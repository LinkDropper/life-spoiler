# Phase 5 — API route v3 컷오버

**상태**: ✅ 완료
**작업일**: 2026-04-20

## 목적

리포트 생성 API를 v2 단일 호출에서 v3 3단계 파이프라인으로 전환한다.
업로드 API의 캐시 체크도 v3만 인식하도록 업데이트 — 기존 v2 캐시는 자연스레 무효화되고 새로 생성된다.

## 변경된 파일

| 파일 | 동작 | 내용 |
|---|---|---|
| `app/api/face-spoiler/report/generate/route.ts` | 재작성 | v3 파이프라인 합성 + 코드 결정 필드 주입 + v3 캐시 분기 |
| `app/api/face-spoiler/upload/route.ts` | 수정 | 프로필 캐시 hit 조건을 `isV3Report`로 한정 |

## 변경 요약

### generate/route.ts

**이전 (v2 단일 호출)**:
```
classifyAnimalType  →  generateFaceReport  →  v2 report insert
```

**v3 파이프라인 합성**:
```
① classifyAnimalType        — 코드 결정적 + LLM rationale (그대로 유지)
② scoreRegions(faceMetrics) — 코드 결정적 8개 부위 점수 + hint
③ generateFaceReportV3      — 3 Stage 병렬 호출 (signature+overall / regions / interestAreas+closing)
④ 합성: animalChip + totalScore + region score/label + LLM 텍스트 → FaceReportDataV3
⑤ DB insert (미결제)
```

**필수 입력 변경**:
- `faceMetrics` 없으면 **400 반환** (이전에는 optional). v3 파이프라인은 metrics가 반드시 있어야 부위 점수 산출 가능.

**캐시 분기 (v3 전환)**:
- **Tier 1** (프로필 단위): 같은 사용자·프로필·해시 → `isV3Report(result)`이 true인 경우에만 캐시 재사용
- **Tier 2** (글로벌 해시): 같은 image_hash의 여러 결과 중 첫 v3 결과만 재사용 (`find(isV3Report)`)
- **Tier 3**: 캐시 미스 → 다운로드 + v3 파이프라인 실행

→ **v2 캐시는 자동으로 무시**되고 v3로 재생성됨. 하드 컷오버.

### upload/route.ts

```typescript
if (cachedReport && isV3Report(cachedReport.result)) {
  return NextResponse.json({ cached: true, shareId: cachedReport.share_id });
}
```

v3가 아닌 캐시는 무시 → 업로드는 진행되고 generate가 새 v3 리포트를 만든다.
storage는 계속 `upsert: true`로 덮어쓰므로 중복 파일 문제 없음.

## v2 코드 처리

**삭제하지 않고 보존**:
- `libs/face-spoiler/gemini.ts` (v2)
- `libs/face-spoiler/prompts/text-report.ts` (v2)
- `libs/face-spoiler/types.ts` 중 v2 관련 타입 (`FaceReportData`, `isV2Report` 등)

이유:
1. `app/face-spoiler/r/[shareId]/page.tsx`와 `preview/[shareId]/page.tsx`가 아직 v2 렌더링을 담당 → Phase 7에서 v3로 교체 예정
2. `isV2Report`는 legacy fallback 분기에서 사용 중 (Phase 7 완료 후 정리 가능)
3. 기존 결제 완료된 v2 리포트 사용자 대응 정책 결정 전이라 코드 유지 필요

## 검증 결과

### 타입 체크
`tsc --noEmit -p .` → 에러 0건

### 기존 테스트 회귀
```
Test Suites: 8 passed, 8 total
Tests:       73 passed, 73 total
```

### 통합 수동 QA (Phase 7에서)
- 사진 업로드 → 3단계 파이프라인 정상 실행
- DB에 저장되는 `result.version === 3` 확인
- 같은 이미지 두 번째 업로드 → 캐시 hit (`cached: true`)
- v2 기존 데이터 있는 경우 → 캐시 무시, 새 v3 생성

## 알려진 부작용

1. **기존 v2 리포트는 "legacy 안내 페이지"로 리다이렉트**되어 있는 상태 (`app/face-spoiler/preview/[shareId]/page.tsx` 136~156 라인).
   Phase 7에서 렌더링 교체 시 이 안내가 v3로 자연스럽게 대체되거나, v2는 계속 안내 페이지로 유지.

2. **결제 완료된 v2 사용자 정책 미정**. 선택지:
   - v2 리포트를 계속 볼 수 있도록 v2 렌더러 병행 유지
   - 무료 v3 재생성 제공
   - 안내 페이지로 유도
   → Phase 7 완료 후 사용자와 논의.

3. **페이지 UI는 아직 v2 구조**. Phase 6, 7 진행 전까지는 route만 v3를 생성하지만 프리뷰/본편 페이지는 v3를 제대로 렌더하지 못함.

## 다음 단계

Phase 6: v3 전용 UI 컴포넌트 신설
- `ScoreGauge` — 점수 게이지 시각화
- `RegionScoreCard` — 부위별 카드
- `InterestAreaCard` — 분야별 디테일 카드
- `SignatureHookCard` — 자주 듣는 말·자주 받는 오해 2개 훅 카드
