# Phase 6 — v3 UI 컴포넌트 신설

**상태**: ✅ 완료
**작업일**: 2026-04-20

## 목적

v3 리포트 렌더링에 필요한 재사용 컴포넌트 4종을 만든다.
Phase 7 페이지 재작성 시 조립해서 쓸 "레고 블록" 레이어.

## 변경된 파일 (8개, 모두 신설)

| 컴포넌트 | 파일 | 역할 |
|---|---|---|
| **ScoreGauge** | `components/face-spoiler/ScoreGauge.tsx` + `.module.css` | 점수 + 게이지 바. `variant="total"` (히어로) / `"region"` (카드) |
| **SignatureHookCard** | `components/face-spoiler/SignatureHookCard.tsx` + `.module.css` | 자주 듣는 말 / 자주 받는 오해 두 훅을 같은 컴포넌트로. `variant="phrase" | "misread"` |
| **RegionScoreCard** | `components/face-spoiler/RegionScoreCard.tsx` + `.module.css` | 부위별 카드. ScoreGauge + interpretation + bullets + blockquote(oneLiner) |
| **InterestAreaCard** | `components/face-spoiler/InterestAreaCard.tsx` + `.module.css` | 분야별 카드. 라벨 + body + 강점/주의점 2열 + verdict + 캐릭터 별명 |

## 디자인 원칙 (기존 톤 유지)

- 기본 색상 변수: `--text-primary`, `--text-secondary` (다크 배경 가정)
- 메인 액센트: `#3fd9ad` (민트) — 기존 ReportView와 동일
- 보조 액센트:
  - `#b593ff` (보라) — `commonMisread` 훅용 (구분)
  - `#ffb870` (앰버) — `cautions` 주의점 구분 (강점과 차별화)
- 폰트: `Pretendard Variable, Pretendard, sans-serif`
- border-radius 최소화 (sharp/minimal) — 기존 디자인 패턴 준수
- 640px 이하 모바일 미디어 쿼리

## 컴포넌트별 특징

### ScoreGauge
- 게이지 바: 6px (region) / 10px (total) 높이, 민트 그라디언트 fill
- aria-label로 점수 표출 (접근성)
- 소수점 1자리 강제 (`toFixed(1)`)
- `total` variant는 3rem 폰트로 히어로급 강조

### SignatureHookCard
- 왼쪽 3px 컬러 바 (variant별 색 분기)
- 이모지 아이콘(💬 / 🔍) + 라벨 + 본문
- 히어로 영역의 핵심 훅 — 자기인식·반전 호기심 트리거

### RegionScoreCard
- ScoreGauge 내장 → 부위별 라벨·점수 일체화
- 3개 bullets는 민트 dot 마커
- `oneLiner`는 blockquote 형태, 유니코드 따옴표(`\201C \201D`) 자동 감싸기
- 부위마다 동일 구조 8번 반복 (UI 일관성)

### InterestAreaCard
- 상단: 라벨 + `oneLineDefinition`(민트 강조)
- 본문: `\n\n` 단락 분리, `white-space: pre-wrap`
- **강점/주의점 2열**: 강점=민트, 주의점=앰버 색 분리
- `verdict` blockquote (따옴표 자동), 중앙 정렬
- 하단 `characterNickname` 태그 (민트 pill) + 부연 서브텍스트

## 검증 결과

### 타입 체크
`tsc --noEmit -p .` → 에러 0건

### 시각 QA
실제 렌더링은 Phase 7에서 페이지 조립 후 브라우저에서 확인.
컴포넌트 스토리북은 이 프로젝트에 설정되어 있지 않으므로 생략.

## 컴포넌트 API 요약

```typescript
// 점수 게이지
<ScoreGauge score={8.6} label="종합 점수" variant="total" />
<ScoreGauge score={8.7} label="눈" variant="region" />

// 훅 카드
<SignatureHookCard
  variant="phrase"
  label="자주 듣는 말"
  content="'조용한데 은근 강하다'는 말, 한 번쯤 들어보셨죠?"
/>
<SignatureHookCard
  variant="misread"
  label="자주 받는 오해"
  content="'차가워 보인다'는 오해, 실제와 가장 거리가 먼 부분이에요."
/>

// 부위별 카드 (regionScores.regions[i])
<RegionScoreCard region={regionScore} />

// 분야별 카드 (interestAreas.areas[i])
<InterestAreaCard
  area={area}
  strengthsLabel="강점"
  cautionsLabel="주의점"
/>
```

## 미완 / 다음 단계에서 처리

- **`AnimalHero` 교체 여부**: 현재 히어로는 동물상 중심. v3 스펙에 따르면 oneLineDefinition이 히어로여야 함. Phase 7에서 결정:
  - 옵션 A: `AnimalHero` 유지 + `SignatureSection` 추가 (동물상과 나란히)
  - 옵션 B: 새 `SignatureHero` 컴포넌트 신설, `AnimalHero`는 본편 상단에만 유지
  - 추천: 옵션 B — 히어로 메인이 바뀌었으므로 컴포넌트도 교체
- **`ReportViewV3`**: 위 컴포넌트 4종을 조립하는 최상위 컴포넌트는 Phase 7에서 작성 (페이지와 동시에)
- **i18n 라벨**: "강점" / "주의점" 등 라벨을 `messages/translations.json`에 추가 — Phase 7

## 다음 단계

Phase 7: 페이지 재작성 + i18n + 수동 QA
- `SignatureHero` (신설) — oneLineDefinition 히어로
- `ReportViewV3.tsx` 신설 — 위 4개 컴포넌트 + 추가 섹션 조립
- `preview/[shareId]/page.tsx` v3 노출 범위 재작성
- `r/[shareId]/page.tsx` v3 렌더링 호출
- 번역 라벨 추가
- 실제 업로드 → 프리뷰 → 결제 → 본편 플로우 수동 QA
