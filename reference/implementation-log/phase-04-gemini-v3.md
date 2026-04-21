# Phase 4 — Gemini v3 파이프라인 호출

**상태**: ✅ 완료
**작업일**: 2026-04-20

## 목적

Phase 3의 3단계 프롬프트를 실제 Gemini 호출로 연결하고, 응답 길이·개수를 사후 검증한다.
기존 `gemini.ts` (v2)는 그대로 두고 **별도 파일**로 신설 — backward compat 유지.

## 변경된 파일

| 파일 | 동작 | 내용 |
|---|---|---|
| `libs/face-spoiler/gemini.v3.ts` | 신설 | `generateFaceReportV3` + Stage 단위 validator (외부 export) |
| `libs/face-spoiler/__tests__/gemini-v3-validators.test.ts` | 신설 | validator 3종의 정상·오류 케이스 13 테스트 |

## 설계 포인트

### 병렬 호출
3개 Stage가 **동일 입력(사진 + animal + regionScores)** 을 사용하고, Stage 간 의존성이 없으므로 `Promise.all`로 병렬 실행.
→ 전체 지연을 순차 호출 대비 ~3배 단축.

```typescript
const [stageA, stageB, stageC] = await Promise.all([
  callStage<SignatureOverallResponse>({ ... }),
  callStage<RegionScoresResponse>({ ... }),
  callStage<InterestAreasResponse>({ ... }),
]);
```

### Stage별 토큰 상한
| Stage | `maxOutputTokens` | 이유 |
|---|---|---|
| A (signature + overall) | 3072 | summary 2단락 + highlights 6~10개 → 중간 |
| B (region 8개) | 4096 | 8개 interpretation + 각 bullets·oneLiner → 큼 |
| C (interestAreas + closing) | 4096 | 3개 body 280~360자 + 기타 → 가장 큼 |

### Validator — 프롬프트 강제가 실패할 경우의 안전망
Gemini responseSchema로 구조는 강제되지만 **문자 수·배열 개수**는 schema로 강제 불가.
→ 응답 수령 후 validator가 길이·개수 초과/부족이면 throw → route 레벨에서 재시도 판단.

배포에 너무 엄격하면 반복 실패로 사용자 경험 악화 → 스펙(02-new-structure.md)보다 **느슨한 허용 범위**로 설정:

| 필드 | 스펙 | validator 허용 |
|---|---|---|
| signature.oneLineDefinition | 25~40자 | 10~50자 |
| signature.subDefinition | 60~90자 | 40~120자 |
| signature.coreKeywords | 5개 | 4~6개 |
| overallScore.summary | 200~280자 | 150~360자 |
| regionScores.regions | 8개 | 정확히 8 |
| regionScores.regions[].bullets | 3개 | 정확히 3 |
| interestAreas.areas | 3개 + 순서 | 정확히 3 + love→money→career 강제 |
| interestAreas.areas[].strengths/cautions | 3개 | 정확히 3 |

→ 순서와 배열 길이는 **엄격**, 문자 수는 **관대**. UI가 수용 가능한 선에서 관대하게 두고 수동 QA에서 반복 모니터링.

### 사진 base64 3회 전달
- Gemini 2.5 Flash-Lite는 이미지 1MB 입력이 매우 저렴 (~$0.000001/이미지)
- 3회 호출해도 비용 무시 가능
- 각 Stage가 독립적으로 이미지를 참고 가능 → 더 정확한 해석

### 재시도 전략
각 Stage 내에서 최대 3회 재시도 (1~3초 백오프). 실패 누적으로 Promise.all이 실패하면 route가 에러 반환.

## 검증 결과

### 테스트
```
Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

13개 테스트 커버:
- **validateSignatureOverall**: 유효 통과 / coreKeywords 개수 이탈 / oneLineDefinition 짧음 / summary 초과 (4)
- **validateRegionScores**: 유효 통과 / 개수 불일치 / bullets 3개 아님 / interpretation 짧음 (4)
- **validateInterestAreas**: 유효 통과 / 도메인 순서 역전 / areas 개수 부족 / strengths 개수 이탈 / shareLine 짧음 (5)

### 회귀 + 타입
```
Test Suites: 8 passed, 8 total
Tests:       73 passed, 73 total
```
`tsc --noEmit -p .` 에러 0건.

## 알려진 한계

- 실제 Gemini API 호출은 네트워크·키가 필요해 unit test에서 다루지 않음 → Phase 7 수동 QA로 검증
- validator의 허용 범위는 초기 보수적 추정 — 실 운영 후 로그 기반 조정 필요
- 부분 실패(예: Stage B만 실패) 시 Stage A/C 결과를 버리고 전체 재호출 — 세분화 재시도는 Phase 7 이후 최적화

## 다음 단계

Phase 5: `app/api/face-spoiler/report/generate/route.ts` 수정.
- `classifyAnimalType` → `scoreRegions` → `generateFaceReportV3` 파이프라인 합성
- 코드 결정 필드(animalChip, totalScore, region score/label) 주입
- `FaceReportDataV3` 최종 조립 + DB 저장
- v2 캐시 무효화 (version 3가 아니면 새로 생성)
