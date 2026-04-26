# Phase 2 — region-scorer (부위별 점수 결정적 산출)

**상태**: ✅ 완료
**작업일**: 2026-04-20

## 목적

`FaceMetrics` (MediaPipe 468 랜드마크 기반 측정값)을 입력받아 **8개 부위 점수(7.5~9.5) + 해석 hint**를 결정적으로 산출한다.
점수는 LLM이 아닌 코드가 결정 → 같은 이미지 → 항상 같은 점수 보장, 신뢰도 붕괴 방지.

## 변경된 파일

| 파일 | 동작 | 내용 |
|---|---|---|
| `libs/face-spoiler/region-scorer.ts` | 신설 | `scoreRegions(metrics)` + `deriveTotalScore(regions)` |
| `libs/face-spoiler/__tests__/region-scorer.test.ts` | 신설 | 결정성·구간·분포·hint 필터링 12 테스트 |

## 설계 포인트

### 1. 점수의 의미 정의
> "이 부위가 **인상에 얼마나 또렷하게 기여하는가**의 척도.
>  미추(美醜) 평가가 아니다. 7.0 미만은 사용하지 않는다."

이 정의가 프롬프트·UI에도 노출되어야 함 (Phase 3, 6).

### 2. 구간·분포 강제
- **7.5 ~ 9.5** 구간 (`finalizeScore()`에서 clamp + 소수점 1자리 반올림)
- 일반 부위 기본 곡선: `7.7 + fit × 1.7` → 7.7~9.4
- `eye`는 인상의 핵심축이라 기본점 +0.2
- `balance`는 전체 균형감 — 가장 높은 대역(`8.3 + fit × 1.2`)

### 3. 결정적 매핑 (랜덤 없음)
각 부위는 1~3개의 `FaceMetrics` 필드를 특정 중심값·폭의 **가우시안 적합도**로 변환 → 가중 평균 → 최종 점수.

| 부위 | 사용 메트릭 | hint 분기 키 |
|---|---|---|
| forehead | `foreheadWidthRatio`, `samjeong.upper` | foreheadWidthRatio 임계 |
| eye | `eyeAspectRatio`, `eyeSizeRatio`, `eyeCornerAngle` | eyeCornerAngle → eyeAspectRatio |
| brow | `samjeong.upper`, `eyeAspectRatio` (proxy) | 단일 hint (랜드마크 한계) |
| nose | `noseLengthRatio`, `philtrumRatio` | noseLengthRatio 임계 |
| mouth | `mouthWidthRatio`, `philtrumRatio` | mouthWidthRatio 임계 |
| chin | `jawWidthRatio`, `jawAngularity` | jawAngularity 임계 |
| cheekbone | `samjeong.middle`, `jawWidthRatio` (proxy) | 단일 hint |
| balance | `samjeong` 분산 + `faceRatio` 대칭성 | 단일 hint |

### 4. hint 문구의 안전 규칙
`rationaleHint`는 LLM 프롬프트에 그대로 주입되므로 다음을 **노출하지 않는다**:
- 측정 수치 (소수점·각도·퍼센트)
- 코드 변수명 (`eyeAspectRatio`, `faceRatio` 등)
- 한자 관상 용어 (印堂·山根·臥蠶 등)

테스트(`rationaleHint는 측정 수치나 코드 변수명을 노출하지 않는다`)로 regex 검증.

### 5. 종합 점수 (`deriveTotalScore`)
- 균형감 제외 7개 부위 평균 + 균형감에 35% 가중 혼합
- 이유: reference `score.md`도 종합 8.6이 개별 7개 평균(~8.4)보다 높음 — "전체 조화가 좋으면 종합이 더 돋보인다" 메시지

## 검증 결과

### 테스트

```
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Time:        0.271 s
```

12개 테스트 커버:
- 8개 부위 순서 일치 (`REGION_SCORE_KEYS`)
- 극단 입력(큰 값·작은 값·평균)에서도 모든 점수 7.5~9.5 구간
- 소수점 1자리 정밀도
- **결정성** — 같은 입력 → 같은 출력
- 한국어 라벨 채워짐
- `rationaleHint` 수치·변수명·한자 비노출
- 삼정 균형 차이 → balance 점수 차이 반영
- 눈꼬리 각도 → eye hint 분기
- 총점 구간·가중·정밀도
- 빈 배열 입력 → 안전한 기본값

### 회귀 테스트 (face-spoiler 전체)
```
Test Suites: 6 passed, 6 total
Tests:       48 passed, 48 total
```
기존 테스트 0 regression.

### 타입 체크
`tsc --noEmit -p .` → 에러 0건.

## 다음 단계

Phase 3: `prompts/text-report.v3.ts` — v3 프롬프트 설계.
- reference 톤 규칙 (관상가 인용 화법·A보다 B 대조·따옴표 한 줄 평)
- 기존 FORBIDDEN_RULES 재사용 (윤리·한자·수치 금지)
- `rationaleHint` 주입 형식 설계 — 8개 부위 hint를 프롬프트에 주어 LLM이 해석·bullets·oneLiner 생성
- 3단계 파이프라인으로 분할 (signature+overall / regionScores / interestAreas+closing)
