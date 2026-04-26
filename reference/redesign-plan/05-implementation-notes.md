# 구현 변경 포인트 — 코드 레벨 가이드

## 목표

기존 v2 코드를 **건드리지 않고 v3를 신설**하여 안전하게 컷오버.
(현재도 v2가 "하드 컷오버 + 레거시 v1 fallback" 구조라 동일 패턴 재사용)

## 영향 받는 파일 목록

### 신설 (v3)
| 파일 | 역할 |
|---|---|
| `libs/face-spoiler/types.v3.ts` | v3 타입 + `isV3Report` 가드 |
| `libs/face-spoiler/prompts/text-report.v3.ts` | v3 시스템 프롬프트 + 유저 프롬프트 + responseSchema |
| `libs/face-spoiler/region-scorer.ts` | `FaceMetrics` → 부위별 점수 (7.0~9.5) 결정적 매핑 |
| `components/face-spoiler/RegionScoreCard.tsx` | 부위별 점수 카드 UI |
| `components/face-spoiler/InterestAreaCard.tsx` | 분야별 디테일 카드 UI |
| `components/face-spoiler/ScoreGauge.tsx` | 점수 시각화 (게이지/별/숫자) |

### 수정
| 파일 | 변경 |
|---|---|
| `libs/face-spoiler/types.ts` | v3 타입 re-export, `isV2Report` 유지 |
| `libs/face-spoiler/gemini.ts` | `generateFaceReport` → `generateFaceReportV3` 추가 |
| `app/api/face-spoiler/report/generate/route.ts` | v3 파이프라인으로 컷오버. `region-scorer` 호출 → `generateFaceReportV3` |
| `components/face-spoiler/ReportView.tsx` | v3 신구조로 재작성 (5개 섹션) |
| `app/face-spoiler/preview/[shareId]/page.tsx` | v3 프리뷰 노출 (signature + 종합점수 + 잠금 영역) |
| `app/face-spoiler/r/[shareId]/page.tsx` | v3 본편 렌더 (`ReportView` 호출) |
| `messages/translations.json` | 새 섹션 라벨 추가 |

### 삭제 또는 deprecate
| 파일 | 처리 |
|---|---|
| `components/face-spoiler/FeatureBadges.tsx` | v3에 미사용 — deprecate |
| `components/face-spoiler/ShareableQuoteCard.tsx` | 재활용 — `regionScores.oneLiner` 카드 디자인으로 |
| `components/face-spoiler/IntensityIndicator.tsx` | v3에 미사용 — deprecate (점수가 대체) |

## 컷오버 전략

현재 DB `face_reports.result`는 jsonb 컬럼이라 v1·v2·v3가 공존 가능.

```typescript
// app/face-spoiler/r/[shareId]/page.tsx
if (isV3Report(record.result)) {
  return <ReportViewV3 report={record.result} />;
}
if (isV2Report(record.result)) {
  return <LegacyV2Notice />;  // 또는 기존 ReportView 잠시 유지 후 일괄 재생성
}
return <LegacyV1Notice />;
```

→ **정책 결정 필요**: 기존 v2 리포트(이미 결제된 사용자 포함)를
  - (a) 일괄 재생성해서 v3로 마이그레이션
  - (b) 레거시 안내 페이지로 전환
  - (c) v2 렌더러 유지 (병행 운영)

## 부위별 점수 산출 로직

`face-shape-analyzer.ts`의 `FaceMetrics` (이미 측정됨)를 입력으로 결정적 매핑:

```typescript
// libs/face-spoiler/region-scorer.ts (신설)

import type { FaceMetrics } from "./face-shape-analyzer";

interface RegionRawScore {
  region: "forehead" | "eye" | "brow" | "nose" | "mouth" | "chin" | "cheekbone" | "balance";
  score: number;        // 7.0~9.5
  rationaleHint: string; // 프롬프트에 주입할 짧은 근거 (예: "이마 비율이 균형적이라 안정감")
}

export const scoreRegions = (metrics: FaceMetrics): RegionRawScore[] => {
  // 각 부위별로 metrics의 특정 측정값 → 점수 매핑 (룩업 테이블)
  // 점수 분포: 8.0~9.0이 80%, 7.5~8.0/9.0~9.5가 20%
  // 이 점수와 hint를 LLM에 입력으로 제공 → LLM은 interpretation/bullets/oneLiner를 작성
};
```

→ **점수는 LLM이 결정하지 않고 코드가 결정**. LLM은 점수에 맞는 해석만 작성.
   이유: 같은 사진에 대해 점수가 들쑥날쑥하면 신뢰도 붕괴.

## 프롬프트 설계 — 분리 호출 vs 단일 호출

### 옵션 A — 단일 호출 (현재 v2와 동일)
- 장점: 호출 횟수 적음, 비용·지연 낮음
- 단점: 5개 섹션 × 정확한 길이·개수 강제가 어려움 (현재 v2도 종종 어김)

### 옵션 B — 단계별 파이프라인 (Git status에 흔적 있음)
```
Stage 1: animal-classifier  (이미 분리됨, 그대로 유지)
Stage 2: region-scorer       (코드 결정적, LLM 미사용)
Stage 3: signature-and-keywords  (한 줄 정의 + 키워드 5개 — 짧은 호출)
Stage 4: overall-summary     (종합 인상 본문 + highlights)
Stage 5: region-interpretations  (8개 부위 해석 일괄)
Stage 6: interest-areas      (3개 분야 디테일 일괄)
Stage 7: closing             (캐릭터 별명 + 마무리)
```
- 장점: 각 단계 응답이 짧아 길이·개수 강제 정확, 한 단계 실패해도 부분 재시도 가능
- 단점: 호출 5~6회로 비용·지연 증가 (Gemini 2.5 Flash-Lite는 저렴해서 감당 가능)

→ **추천: 옵션 B 시작점은 3개 호출로 묶기** (Stage 3+4 / Stage 5 / Stage 6+7) — 비용·정확도 절충

## 캐시 정책

`face_reports.image_hash` 캐시는 v3에서도 동일하게 유효:
- 같은 이미지 → 같은 점수·해석 (결정적)
- 단, **v2 캐시는 v3에서 사용 불가** — `result.version` 체크 추가

```typescript
// generate/route.ts 글로벌 캐시 hit 시
if (globalCachedReport.result?.version !== 3) {
  // v2 캐시 무시하고 새로 생성
}
```

## i18n (다국어)

`messages/translations.json` 의 `faceSpoiler.report.sections.*` 추가:
```json
"faceSpoiler.report.sections": {
  "signature": "한 줄 인상",
  "overallScore": "종합 점수",
  "regionScores": "부위별 점수",
  "interestAreas": "분야별 디테일",
  "closing": "마무리"
}
```

분야별 라벨 (한국어/영어):
```json
"faceSpoiler.report.areas": {
  "love": "💕 연애운",
  "money": "💰 재물운",
  "career": "💼 직장운"
}
```

## 테스트 전략

### 신규 테스트 파일
| 파일 | 검증 |
|---|---|
| `libs/face-spoiler/__tests__/region-scorer.test.ts` | 같은 metrics → 같은 점수, 7.0~9.5 구간 강제, 8개 부위 모두 산출 |
| `libs/face-spoiler/__tests__/types-v3.test.ts` | `isV3Report` 가드, 필수 필드 누락 시 false |
| `libs/face-spoiler/__tests__/prompts-v3.test.ts` | 시스템 프롬프트 어셈블리, FORBIDDEN_RULES 포함 |

### 수동 QA 시나리오
1. 같은 이미지 2회 업로드 → 동일 캐시 hit, 동일 결과
2. 다른 이미지 → 점수가 미세하게 달라야 함 (7.0~9.5 구간 안에서)
3. 프리뷰 → 본편 결제 전환 → 잠금 영역이 모두 풀리는지
4. 한자·수치·금지 어휘 출력 검사 (regex 자동화 가능)
5. 강점·주의점이 정확히 3개씩 나오는지
6. 분야 디테일 3개가 정확한 순서(love → money → career)인지

## 마이그레이션 SQL (선택)

기존 v2 리포트를 일괄 무효화/재생성하려면:
```sql
-- v2 리포트의 paid_at은 보존하되, result만 NULL로 → 재생성 트리거
UPDATE face_reports
SET result = NULL
WHERE (result->>'version')::int = 2
  AND paid_at IS NULL;
-- 결제된 v2는 손대지 않고 v3 동시 노출 정책 검토
```

## 작업 순서 제안

1. **승인 대기**: `00-overview.md`의 의사결정 항목 4개 사용자 확정
2. **타입 + 가드**: `types.v3.ts` + 테스트
3. **점수기**: `region-scorer.ts` + 테스트 (LLM 없이 단독 검증 가능)
4. **프롬프트**: `prompts/text-report.v3.ts` + 응답 스키마
5. **Gemini 호출**: `gemini.ts`에 `generateFaceReportV3` (파이프라인 옵션 B)
6. **API**: `report/generate/route.ts` v3 컷오버
7. **UI**: `RegionScoreCard`, `InterestAreaCard`, `ScoreGauge` 컴포넌트
8. **페이지**: `ReportView.tsx`, `preview/page.tsx`, `r/page.tsx` 재작성
9. **i18n**: 라벨 추가
10. **수동 QA + A/B 변수 측정 준비**

## 예상 작업량

| 단계 | 추정 |
|---|---|
| 타입·가드·테스트 | 0.5d |
| region-scorer + 테스트 | 1d |
| v3 프롬프트 (단계별 3개) + 자체 검증 | 2d |
| gemini.ts 파이프라인 호출 | 0.5d |
| API route 컷오버 | 0.5d |
| UI 컴포넌트 (RegionScoreCard, InterestAreaCard, ScoreGauge) | 1.5d |
| ReportView·preview·r 페이지 재작성 + CSS | 2d |
| i18n + QA + 버그 픽스 | 1d |
| **합계** | **약 9 man-day** |

## 위험 요소

| 위험 | 완화책 |
|---|---|
| LLM이 길이·개수 규칙을 자주 어김 | 파이프라인 분리 + responseSchema 강제 + 사후 검증 재시도 (현 v2 패턴 유지) |
| 점수가 들쑥날쑥하면 신뢰 붕괴 | 점수는 코드 결정적 산출, LLM은 해석만 |
| 부위별 점수가 미추 평가로 오해됨 | UI에 "인상 기여도" 라벨 명시 + 7.0 미만 금지 |
| 기존 결제자 v2 리포트가 사라지면 컴플레인 | v2 렌더러 병행 운영 또는 일괄 재생성 후 무료 재제공 |
| 분량 증가로 Gemini 비용 상승 | Flash-Lite 사용 + 캐시 적극 활용 (이미 글로벌 image_hash 캐시 있음) |

## 마무리 체크 — 사용자 승인이 필요한 4가지

`00-overview.md`에서 옮겨옴:
1. 점수 시스템 도입 여부 (추천: 도입)
2. villain / gapAnalysis / compatibility / actions 4개 섹션 처리 (추천: 모두 삭제)
3. 동물상 비중 (추천: 칩으로 강등)
4. 프리뷰에서 종합 점수 노출 여부 (추천: 노출 — 유입 고리)

→ 이 4개 결정되면 즉시 구현 착수 가능.
