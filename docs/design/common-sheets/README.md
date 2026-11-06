# 공용 시트·모달·알림 상영관 개편 시안 v1

375px 모바일 기준 정적 HTML 13장. 코드(app/, components/)는 건드리지 않았고 대표 컨펌 뒤에 구현한다. 공통 스타일은 `sheets.css` 한 파일이고, 각 HTML이 이를 읽는다.

디스플레이 폰트는 payment-flow와 같은 방식(`SB-B.otf` 상대 경로)이다. 다만 `docs/design/`에는 `SB-B.otf`가 없어서 `sheets.css`가 `../../../public/fonts/SB-B.otf`를 두 번째 후보로 읽는다. 폴더에 `SB-B.otf`를 복사해 두면 단독으로도 열린다.

## 디자인 결정 근거

1. **시트는 하나의 문법이다.** `ScreenSheet`의 틀(밤하늘 바탕, 위쪽 둥근 모서리, 핸들, 영문 mono eyebrow, 디스플레이 제목 24px, 44px 닫기)에 결제 수단 목록의 행 문법을 합친다. 언어·프로필·궁합·삭제·탈퇴가 모두 같은 시트다.
2. **선택 표시는 결제 수단과 같다.** 글씨가 굵고 흰색이 되고 오른쪽에 핑크 체크 하나가 나온다. 테두리·채움·링이 없고, 행은 얇은 구분선으로만 나뉜다. 복수 선택(궁합 2명)도 같은 체크다.
3. **이동 항목(`action`)은 선택지와 떨어뜨린다.** 목록 아래에 16px 띄우고 왼쪽에 + 아이콘을 둔다. 체크 자리가 없어서 선택지로 오해되지 않는다. 글자는 흰색이고 핑크를 쓰지 않는다(핑크는 선택 표시 전용).
4. **삭제·탈퇴는 색으로 겁주지 않는다.** 빨간 원 느낌표 아이콘을 없애고, 제목과 설명 문구, 그리고 "삭제할 프로필 / 민준" 대상 줄로 무엇이 사라지는지 밝힌다. 버튼은 취소가 연핑크 채움(안전한 기본, 초기 포커스), 삭제하기·탈퇴하기는 테두리 버튼이다.
5. **확인 창은 가운데 모달이 아니라 아래 시트로 합쳤다.** 한 손 엄지 닿는 곳이고 다른 시트와 같은 모양이라 문법이 갈리지 않는다. 가운데 모달이 필요하면 같은 내용을 가운데에 놓으면 되지만 권하지 않는다.
6. **`alert()`는 두 갈래로 나눴다.**
   - 비모달 알림은 앱 안 토스트(`AppToast`)다. 오류는 `role="alert"`, 안내는 `role="status"`다.
   - 시트 안에서 생긴 실패(탈퇴 실패 등)는 시트 안에 한 줄로 남긴다. 시트 뒤 배경 위에 뜬 토스트는 놓치기 쉽기 때문이다.
7. **토스트 문법은 CopyToast를 따르되 원 배지를 뺐다.** 밤색 면 + 얇은 금색 선 + mono 꼬리표(`ERROR`/`NOTICE`)다. 금색 원 안 체크는 반려된 패턴이라 쓰지 않았다. 문구가 길어지는 EN/JA를 위해 알약(radius 999) 대신 radius 14에 두 줄까지 늘어난다.
8. **BrowserRedirect는 시트가 아니라 전체 화면이다.** 닫을 수 없는 관문이라 밤하늘 전체 화면에 eyebrow, 디스플레이 제목, 버튼 하나, 수동 안내 순으로 둔다. 흰 배경 모달과 스피너 원을 없앴고 이동 중에는 문구만 보여 준다.
9. **PalaceDetailPanel은 카드에서 선 아래 본문으로 바꿨다.** 박스 배경·테두리, 글로우 점, 별 이름 알약 칩, 💡 이모지를 없앴다. 위에 얇은 선 하나, 궁 이름(디스플레이), 일반어 제목, 설명, "별" 줄, 해석, "주의" 줄이 흐른다. 선택된 칸은 글로우 테두리 대신 옅은 평면 색과 핑크 굵은 궁 이름이다.

## 화면 목록

| 파일 | 대상 | 비고 |
|---|---|---|
| 01-language-sheet.html | OptionSheet, 헤더 언어 변경 | 한국어 선택. 각 행에 `lang` 속성 |
| 02-profile-switch-sheet.html | OptionSheet, 홈 상영 프로필 전환 | 3개 + `action` "다른 사람 인생 추가" |
| 03-compat-profile-sheet.html | 궁합 만들기 프로필 선택 | 2명 선택됨, 나머지 비활성, "새 프로필 만들기", 취소·확인 |
| 04-delete-profile.html | DeleteConfirmModal, 프로필 삭제 | 대상 줄 포함 |
| 05-delete-compat-busy.html | DeleteConfirmModal, 궁합 삭제 + 삭제 중 | 두 버튼 비활성, `aria-busy` |
| 06-withdraw.html | 회원탈퇴 확인 | `alertdialog` |
| 07-withdraw-busy.html | 회원탈퇴 진행 중 | `isWithdrawing` |
| 08-withdraw-error.html | 회원탈퇴 실패 | 시트 안 인라인 오류 `role="alert"` |
| 09-toast-error.html | alert 대체, 오류 | 공유 시트의 "이미지를 만들지 못했어요..." |
| 10-toast-notice.html | alert 대체, 안내(검증) | "프로필을 선택해주세요." |
| 11-browser-redirect.html | BrowserRedirect, 수동 버튼 상태 | 3초 뒤에도 안 열렸을 때 |
| 12-browser-redirect-loading.html | BrowserRedirect, 이동 중 | 접속 직후 3초 |
| 13-palace-detail.html | PalaceDetailPanel | 명반 위, 재백궁 선택. 별·해석 문구는 예시 |

03번은 질문의 `Select` 사용처가 아니다. `app/compatibility/setup/page.tsx`는 `Select`가 아니라 같은 폴더의 `ProfileSelectModal.tsx`(자체 모달, 카드 + 선택 테두리)를 쓴다. 같은 문제이므로 이 시안에서 OptionSheet 문법으로 합쳤다.

## 구현할 때 바뀌는 점

### OptionSheet를 ScreenSheet 문법과 합치는 방법
- 두 컴포넌트를 하나로 합치지 않고 **시트 껍데기만 공유**한다. `ScreenSheet`의 껍데기(backdrop, sheet, handle, header, 닫기)를 `components/common/Sheet`처럼 fortune 밖으로 빼고, `OptionSheet`·확인 시트·`ScreenSheet`가 이를 쓴다. `ScreenSheet`는 토큰이 `screen.module.css .root`에만 있으므로, 공용으로 옮길 때 `--fs-*` 토큰을 `app/globals.css`로 올리거나 Sheet 자체 변수로 둔다.
- `OptionSheet`에는 `eyebrow?: string` prop을 추가한다. 번역하지 않는 영문 장식이라 호출부가 `"LANGUAGE"`, `"NOW SHOWING"`처럼 넘긴다. 없으면 eyebrow를 그리지 않는다.
- 제목은 18px 일반 굵기에서 디스플레이 24px로, 별도 닫기(44px X)를 둔다. 지금은 닫기 버튼이 없고 바깥 누르기·Esc뿐이다.
- 시트 바탕에서 반투명 `--color-surface-default` 회색 판, 20px 모서리, 그림자를 없애고 밤하늘 바탕 + 얇은 핑크 윗선으로 바꾼다. 행은 `.menuItem`의 호버 회색 채움을 없애고 구분선 행으로 바꾼다.
- `OptionSheetOption`에 `description?: string`을 추가한다(궁합 03의 생년월일 줄). `lang?: string`도 추가해 언어 행이 `lang`을 가질 수 있게 한다.
- 복수 선택용 `multiple`(값이 `string[]`)과 `footer`(취소·확인)를 추가하거나, 궁합 쪽만 `ProfileSelectModal`을 이 시트 껍데기로 다시 짜는 두 방식이 가능하다. 후자가 `OptionSheet`의 단일 선택 API를 흔들지 않아 낫다.
- 이동 항목은 지금처럼 `action: { label, href }`를 유지한다. 03의 "새 프로필 만들기"는 링크가 아닌 버튼이므로 `href` 대신 `onClick`을 받는 형태로 넓혀야 한다.

### DeleteConfirmModal
- 반환 구조를 시트로 바꾼다. `role="alertdialog"`, `aria-modal`, `aria-labelledby`·`aria-describedby`를 단다. 지금은 role이 없다.
- 초기 포커스는 취소 버튼이다. 삭제 중에는 Esc·바깥 누르기·두 버튼이 모두 막힌다. 삭제 중 상태는 `role="status"`로 읽힌다.
- Props 추가: `targetLabel?: string`(대상 줄 값), `description?: string`, `title?`. 호출부가 프로필/궁합에 맞는 문구를 넘긴다.
- 빨간 원 느낌표 SVG(`#FA5252`)를 삭제한다.
- **기존 버그:** `/compatibility`도 `profiles.deleteModal`(설명 "선택한 프로필의 운세 기록도...")을 그대로 쓴다. `compatibility.deleteModal.description`은 이미 있지만 쓰이지 않는다. 구현 때 호출부에서 넘기도록 고친다.
- `targetLabel`은 호출부(`app/profiles/page.tsx`, `app/compatibility/page.tsx`)가 삭제 대상의 이름을 넘길 수 있는지 구현 때 확인한다(코드 미확인).

### 회원탈퇴 모달 (landing Menu)
- `Menu.tsx`의 인라인 모달 마크업을 위 확인 시트로 교체하고 `Menu.module.css:546` 이후 `.modal*`을 삭제한다. 삭제·탈퇴가 한 컴포넌트(예: `ConfirmSheet`)를 공유한다.
- 실패 시 `alert(data.error || t("withdrawError"))`를 없애고 시트 안에 `errorMessage`를 `role="alert"`로 보여 준다. 08번 화면이다. `data.error`는 서버 문구라 언어가 섞일 수 있으니 `t("withdrawError")`로 고정하는 것을 권한다.
- `components/face-spoiler/Menu.tsx`에도 같은 모달과 `alert`가 있다. 이번 시안 대상은 아니지만 같은 시트로 옮길 후보다.

### alert() 대체: AppToast
- 새 `components/common/AppToast`(또는 훅 `useAppToast`)를 둔다. 제안 API:
  - `showToast({ kind: "error" | "notice", message })`
  - 오류는 `role="alert"`, 자동 닫힘 6초 + 닫기 버튼(44px). 안내는 `role="status"`, 자동 닫힘 3초, 닫기 없음.
  - 스크린리더가 읽으려면 컨테이너(`aria-live`)를 항상 마운트해 두고 내용만 바꾼다.
  - 위치는 `CopyToast`와 같은 `top: 72px`(헤더 아래). 시트 위에도 뜨도록 z-index를 시트(1000)보다 높게(1100) 둔다.
- `CopyToast`는 같은 컴포넌트의 `kind: "success"` 변형으로 흡수하되, 금색 원 체크 배지는 반려된 패턴이므로 `COPIED` 꼬리표만 남기고 배지는 뺀다.
- 위 grep 기준 호출부 약 30곳은 두 종류로 나뉜다. 모두 훅 하나로 바꾼다.
  - **오류 토스트:** 운세 본편 이미지/공유 실패(`YearlyFortuneView`, lifetime·past-life·compatibility result 페이지의 `imageError`·`shareError`), 운세 생성 훅(`useYearlyFortune`·`useLifetimeFortune`·`usePastLifeFortune`), 프로필 삭제·궁합 삭제·궁합 생성 실패, `app/profile/setup` 저장 실패
  - **안내 토스트:** `selectProfile`(`app/profiles/page.tsx` 5곳), `selectPair`, `selectBothProfiles`
- `app/fortune/lifetime/[profileId]/page.tsx:181,195`에는 **번역 없이 한국어가 하드코딩**돼 있다. 교체하면서 `shareSheet.imageError`/`shareError`로 통일한다.
- 폼 안에서 필드 하나가 비었다는 검증은 토스트보다 필드 아래 인라인 문구가 더 맞다. 이번 시안은 토스트로 통일했고, 폼 검증을 인라인으로 옮길지는 대표 결정이다.
- `libs/hooks/**`에서 `alert()`를 부르는 곳은 훅이 UI를 직접 건드리고 있다는 뜻이다. 구현 때는 훅이 오류 문구만 반환하고 화면이 토스트를 띄우도록 분리해야 한다(fullstack 영역).

### BrowserRedirect
- 흰 배경 모달 + 아이콘 원 + 스피너를 걷어내고 11, 12번 화면으로 바꾼다. 상태 전환(이동 중 3초 → 버튼 표시) 로직은 그대로다.
- `role="dialog"`, `aria-modal`, 제목·설명 연결을 단다. 이동 중 문구는 `role="status"`다.
- 번역 문구는 모두 기존 키를 그대로 쓴다. 문구 변경 없음.
- 본 서비스는 닫을 수 없는 관문이라 X 버튼이 없다. 이는 지금과 같다.

### PalaceDetailPanel
- `PalaceDetailPanel.module.css`를 11번 문법으로 다시 쓴다. 칩(`chip*`)·`headerDot`·`cautionMark`(💡)를 삭제한다.
- 닫기 버튼을 44px로 키운다(지금 32px). `CLOSE_LABEL` 하드코딩 3개 언어 맵은 translations로 옮긴다(규칙: 컴포넌트에 문자열 하드코딩 금지).
- 별 이름은 주성은 굵게, 보조성은 일반 굵기로 `·`로 이어서 보여 준다. `star.isMain`을 그대로 쓴다.
- 칸을 선택했을 때의 글로우 테두리는 `ZiweiChartGrid.module.css`의 `.chartGrid .palaceCell.selected`(핑크 보더 + 글로우)에 있다. 13번 시안대로 옅은 평면 색 + 핑크 굵은 궁 이름으로 바꿔야 패널과 맞는다. 이 파일은 명반 자체라 영향이 크므로 별도 컨펌이 필요하다.
- 시안에서는 명반 위 별자리 선(`ChartConstellation`의 SVG)을 그리지 않았다. 이번 개편에서 바뀌지 않는다.

## 새 번역 키 후보 (KO / EN / JA 모두 필요)

| 키 후보 | KO | 용도 |
|---|---|---|
| `common.sheet.close` | 닫기 | 시트 닫기 aria-label(이미 `common.close`가 있으면 재사용) |
| `common.toast.close` | 알림 닫기 | 오류 토스트 닫기 aria-label |
| `profiles.deleteModal.target` | 삭제할 프로필 | 대상 줄 이름표 |
| `compatibility.deleteModal.target` | 삭제할 궁합 | 대상 줄 이름표 |
| `compatibility.deleteModal.cancel` / `delete` / `deleting` | 취소 / 삭제하기 / 삭제 중... | 지금은 `profiles.deleteModal` 것을 빌려 쓴다 |
| `fortune.palaceDetail.close` | 설명 닫기 | `CLOSE_LABEL` 하드코딩 대체 |
| `fortune.palaceDetail.starsLabel` | 별 | 별 줄 이름표 |
| `fortune.palaceDetail.cautionLabel` | 주의 | 💡 대체 |

eyebrow(`LANGUAGE`, `NOW SHOWING`, `COMPATIBILITY`, `DELETE`, `WITHDRAW`, `OPEN IN BROWSER`)와 토스트 꼬리표(`ERROR`, `NOTICE`)는 `COPIED`·`INTERMISSION`처럼 번역하지 않는 영문 장식이다.

기존 문구 정리 제안(키 추가 아님):
- `profiles.deleteModal.description`의 "불가능 합니다"는 띄어쓰기를 고쳐 "불가능합니다"로 한다(`landing.menu.withdrawModal.description`은 이미 맞다). 시안은 고친 문구를 썼다.
- `landing.header.languageAriaLabel`이 "언어 변경"인데 `LanguageDrawer`는 `default: "언어 설정"`을 쓴다. 시안은 번역 값인 "언어 변경"을 썼다.

## 금지 패턴 점검

- 글로우·text-shadow·drop-shadow·스포트라이트 그라데이션: 없음. 시트 바탕의 별 점만 `ScreenSheet`와 같은 낮은 투명도로 쓴다. `ScreenSheet`의 금색 방사 그라데이션과 위쪽 그림자는 가져오지 않았다.
- 원 안 체크·느낌표 배지, 진행 막대, 박스 카드, 타일 위 보조 라벨, 대형 숫자, 장식 이모지: 없음. 단, 시안 뒤 배경 화면은 맥락용 간이 그림이다.
- **기존 컴포넌트와의 충돌(이번 범위 밖):** `ScreenSheet.module.css`의 `.action`(공유 행)은 1px 테두리 박스 + 40px 아이콘 칸이고 `.sheet`에는 금색 방사 그라데이션이 있다. `CopyToast`에는 금색 원 체크가 있다. 대표 반려 기준에 걸리므로 이 시안과 함께 정리할지 컨펌이 필요하다.

## 한계

- 브라우저로 렌더링을 확인하지 않았다. 실측이 필요한 곳은 다음이다.
  - 02번 EN/JA에서 긴 프로필 이름이 행에서 넘치지 않는지(행은 줄바꿈하도록 했다)
  - 03번에서 프로필이 많아질 때 시트 스크롤(목록만 스크롤, 취소·확인은 아래 고정)을 구현해야 한다. 시안은 4명까지만 보여 준다.
  - 09번 토스트가 EN/JA 긴 문구에서 3줄 이상 늘어날 때
  - 13번 `ctr` 중앙 칸과 칸 테두리가 실제 `ZiweiChartGrid`와 같은지
- 모션은 시안에 없다. 시트는 기존 `slideUp`/`fadeIn`을 그대로 쓰고 토스트는 `CopyToast`의 `fadeInOut`을 쓴다. 둘 다 `prefers-reduced-motion`에서 끈다.
- 시트 뒤 흐림은 시안에서만 `blur(4px)`를 쓴다. 구현에서는 `backdrop-filter`를 쓰지 않고 기존처럼 어두운 반투명 면(`rgba(5,7,15,.72)`)만 쓴다(저사양 모바일 성능).
- 13번의 해석·주의 문구는 예시이고 실제는 `libs/zi-wei-dou-shu/palace-explanation.ts`가 만든다.
- 대비는 계산으로 확인했다: 본문 흰색 78% / 보조 60%가 `#0a0f1c` 위에서 4.5:1 이상, 핑크 `#ff8fb1`·금색 `#ffe7a3`은 약 8:1 이상. 실제 기기 확인은 구현 뒤에 한다.
