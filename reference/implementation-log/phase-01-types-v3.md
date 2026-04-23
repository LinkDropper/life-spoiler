# Phase 1 — v3 타입 + 가드 + 테스트

**상태**: ✅ 완료
**작업일**: 2026-04-20

## 목적

redesign-plan의 v3 스키마(5개 섹션)를 TypeScript 타입으로 고정하고, DB `face_reports.result` jsonb 컬럼에서 v1/v2/v3를 분기할 수 있는 runtime 가드를 추가한다.

## 변경된 파일

| 파일 | 동작 | 내용 |
|---|---|---|
| `libs/face-spoiler/types.v3.ts` | 신설 | v3 스키마 전체 + `isV3Report` 가드 + `FaceTextReportV3` (LLM 응답용 축약 타입) + `REGION_SCORE_KEYS` / `REGION_SCORE_LABEL` / `INTEREST_DOMAIN_KEYS` / `INTEREST_DOMAIN_LABEL` 상수 |
| `libs/face-spoiler/__tests__/types-v3.test.ts` | 신설 | 가드·상수 검증 11 테스트 |

기존 `libs/face-spoiler/types.ts` (v2)는 **건드리지 않음** — backward compat 유지.

## 스키마 핵심 요약

```typescript
export interface FaceReportDataV3 {
  version: 3;
  signature: SignatureSection;        // 한 줄 정의 + 자기인식 훅 2개 + 동물상 칩
  overallScore: OverallScoreSection;  // 종합 점수 + 인상 본문 + highlights 6~10
  regionScores: RegionScoresSection;  // 부위별 8개 (순서 고정)
  interestAreas: InterestAreasSection; // love/money/career 3개 (순서 고정)
  closing: ClosingSection;             // 별명 + 마무리 + 공유 카피
}
```

### 고정 열거형

```typescript
REGION_SCORE_KEYS = [
  "forehead", "eye", "brow", "nose", "mouth", "chin", "cheekbone", "balance"
] // 정확히 8개, 순서 고정

INTEREST_DOMAIN_KEYS = ["love", "money", "career"] // love → money → career 순서 고정
```

### 코드 결정 필드 vs LLM 결정 필드 분리

`FaceTextReportV3`는 LLM 호출 응답 형태.
다음 3개 필드는 **코드가 결정**하므로 LLM 응답에서 제외:
- `signature.animalChip` — animal-classifier 결과 주입
- `overallScore.totalScore` — region 점수 평균에서 산출
- `regionScores.regions[].region / label / score` — region-scorer 결과 주입

→ Phase 5 API route에서 코드 결정 필드 + LLM 응답 필드 합성.

## 검증 결과

### 테스트

```
Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Time:        0.258 s
```

11개 테스트 커버:
- `REGION_SCORE_KEYS` 길이 8 고정
- `REGION_SCORE_LABEL` 전체 키 커버
- `INTEREST_DOMAIN_KEYS` 순서 `love → money → career`
- `INTEREST_DOMAIN_LABEL` 전체 도메인 커버
- `isV3Report` — 유효 리포트 통과
- `isV3Report` — version !== 3 거부
- `isV3Report` — version 필드 누락 거부
- `isV3Report` — signature / regionScores / interestAreas 누락 거부 (3건)
- `isV3Report` — null / undefined / primitive 거부

### 타입 체크

`tsc --noEmit -p .` → **에러 0건** (프로젝트 전체 컴파일 통과).

## 다음 단계

Phase 2: `region-scorer.ts` 구현 — `FaceMetrics` → 8개 부위 점수(7.0~9.5) + rationaleHint 결정적 매핑.
점수는 LLM이 아닌 코드가 결정하므로, 같은 이미지 → 같은 점수를 보장해야 함.
