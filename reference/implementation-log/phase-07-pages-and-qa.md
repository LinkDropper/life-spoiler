# Phase 7 — 페이지 재작성 + i18n + QA

**상태**: ✅ 완료 (수동 QA는 실제 업로드로 별도 수행 필요)
**작업일**: 2026-04-20

## 목적

v3 스키마를 실제 사용자에게 렌더링하는 페이지를 재작성한다. 프리뷰·본편 모두 새 구조로 전환.

## 변경된 파일

| 파일 | 동작 | 내용 |
|---|---|---|
| `components/face-spoiler/SignatureHero.tsx` + `.module.css` | 신설 | oneLineDefinition 중심 히어로. ScoreGauge(total) + 키워드 + 훅 카드 2개 내장 |
| `components/face-spoiler/ReportViewV3.tsx` + `.module.css` | 신설 | v3 본편 전체 렌더. SignatureHero + 종합 + 부위 8개 + 분야 3개 + 마무리 |
| `app/face-spoiler/preview/[shareId]/page.tsx` | 재작성 | v3 프리뷰 — 히어로 전체 + 요약 티저 + 부위 라벨만 + 분야 라벨만 |
| `app/face-spoiler/preview/[shareId]/page.module.css` | 추가 | 프리뷰 v3 티저 스타일 (잠금 카드·highlight 등) |
| `app/face-spoiler/r/[shareId]/page.tsx` | 재작성 | v3 본편 렌더 — ReportViewV3 호출 + FaceReportActions 연결 |

## 주요 변경 요약

### preview page
- 기존: `AnimalHero` + firstImpression + vibeTags + traits 티저
- v3: `SignatureHero` (oneLineDefinition + 키워드 + 자주 듣는 말 + 자주 받는 오해 + 종합 점수)
  + summary 첫 단락 + highlights 2개 + 🔒 잠금 라벨
  + 부위 8개 라벨만 (점수·해석 잠금)
  + 분야 3개 라벨만 (🔒)
- 레거시(v1/v2) 리포트는 `legacyNotice` 화면

### r (본편) page
- 기존: `AnimalHero` + `ReportView` (v2)
- v3: `ReportViewV3` 단독 호출 — 히어로부터 마무리까지 한 컴포넌트가 책임
- `FaceReportActions` / `GuestFaceActions`는 `report.signature.animalChip.type`를 animalKey로 받음 (기존 `animalMatch.primary` 대체)

### 라벨(i18n) 전략
- 현재: 한국어 하드코딩 + `ReportViewV3Labels` prop 인터페이스로 추후 i18n 주입 가능하게 설계
- 이유:
  - `messages/translations.json`에 v3 전용 섹션(`faceSpoiler.v3`)을 ko/en/ja 모두 추가하는 것은 작업량 증가
  - v3가 실 서비스에 먼저 노출되는 언어는 한국어 위주
  - 영어·일본어는 다음 스프린트에 일괄 추가 예정
- next-intl 4는 누락 키 시 throw → `t("key", { default: ... })` 패턴이 fallback으로 동작하지 않음 확인

### 기존 컴포넌트 재사용
- `Header`, `PreviewFooter`, `FaceReportActions`, `GuestFaceActions`는 그대로 사용
- `AnimalHero`는 v3 본편에서 **미사용** (동물상 히어로 강등 → 칩으로 대체)
- `ReportView`(v2), `IntensityIndicator`, `FeatureBadges`, `ShareableQuoteCard`는 legacy 렌더링 경로에만 남음 (제거 가능하지만 이번 phase 범위 밖)

## 검증 결과

### 정적 검증
- **TypeScript**: `tsc --noEmit -p .` → 에러 0건
- **ESLint**: v3 관련 파일 전부 통과 (prettier 자동 수정 2건 포함)
- **Jest**: 73개 테스트 전부 통과 (회귀 없음)

### 실행 검증 (미완 — 사용자 확인 필요)
- 개발 서버 기동 (`pnpm dev` / `npm run dev`) 후 브라우저 검증 필요:
  1. 로그인 → 프로필 생성 → 사진 업로드
  2. `/face-spoiler/preview/[shareId]` — v3 프리뷰가 올바르게 렌더되는가
     - oneLineDefinition 히어로
     - 자주 듣는 말 / 자주 받는 오해 카드 2개
     - 키워드 5개 + 동물상 칩
     - 종합 점수 + scoreOneLiner
     - summary 첫 단락 + highlights 2개 + 🔒 잠금 라벨
     - 부위 8개 라벨 + "본편에서 공개돼요" 안내
     - 분야 3개 라벨 + 🔒
  3. 결제 버튼 → Toss 결제 성공 흐름
  4. `/face-spoiler/r/[shareId]` — v3 본편 전체 렌더
     - SignatureHero (프리뷰와 동일)
     - 종합 인상 본문 전체 + highlights 전체
     - 부위별 카드 8개 (각 점수·해석·bullets·oneLiner)
     - 분야별 카드 3개 (연애/재물/직장)
     - closing (finalNickname + finalNote + shareLine)
     - FaceReportActions 표시 (소유자인 경우)
  5. 모바일 레이아웃 (~640px) 깨짐 없는지 확인
  6. 동일 사진 재업로드 → 캐시 hit
  7. (선택) 결제된 기존 v2 리포트 URL 접속 → `legacyNotice` 노출

### 알려진 한계
- **i18n 미적용**: 영어/일본어 라벨은 현재 한국어 그대로. 다음 스프린트에서 `messages/translations.json` 확장 필요.
- **동물상 칩 i18n**: `signature.animalChip.label`은 API route에서 `ANIMAL_CATALOG[type].label.ko`로 저장되므로 모든 로케일에서 한국어 노출. 런타임 동적 전환 필요 시 `animalChip.type`만 저장하고 UI에서 해석하도록 리팩토링 필요.
- **v2 렌더러 잔존**: `components/face-spoiler/ReportView.tsx`(v2)는 이제 어디서도 호출되지 않음 → 다음 정리 phase에서 삭제 가능.
- **production build 미확인**: dev 서버 수동 확인이 필요함. CI에서 `next build` 검증 필요.

## 정리 대상 (후속 작업)

1. 더 이상 호출되지 않는 v2 컴포넌트 제거:
   - `ReportView.tsx` / `ReportView.module.css`
   - `IntensityIndicator.tsx` / `.module.css`
   - `FeatureBadges.tsx` / `.module.css`
   - `ShareableQuoteCard.tsx` / `.module.css`
2. `libs/face-spoiler/gemini.ts` (v2) 삭제
3. `libs/face-spoiler/prompts/text-report.ts` (v2) 삭제
4. `libs/face-spoiler/types.ts`에서 v2-only 타입 (`FaceReportData`, `isV2Report` 등) 정리
5. `messages/translations.json`의 `faceSpoiler.report.sections.*` v2 키 정리
6. `face-spoiler.v3` 네임스페이스 ko/en/ja 추가 (정식 i18n 복원)
7. `app/api/face-spoiler/character-image/` 등 동물상 캐릭터 이미지 관련 엔드포인트의 v3 호환 검증

## 다음 단계

**사용자가 해야 할 것**:
1. dev 서버 기동 후 실제 업로드·결제 플로우를 수동 QA
2. reference 톤으로 생성된 문장이 브랜드 가이드에 부합하는지 1~2개 샘플 확인
3. 프리뷰의 훅(자주 듣는 말·자주 받는 오해) 카피가 실제로 결제 동기를 자극하는지 체감 평가
4. QA 결과를 토대로 프롬프트 튜닝 / UI 조정 지시

**AI가 후속으로 할 수 있는 것** (요청 시):
- 정리 대상 목록의 1~6번 일괄 정리
- next build로 프로덕션 빌드 검증
- `messages/translations.json` v3 네임스페이스 추가 (ko/en/ja)
- 프롬프트 미세 조정 (톤·길이·강제 규칙)
