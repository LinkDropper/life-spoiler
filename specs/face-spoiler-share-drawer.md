# 관상스포 공유 Drawer + 후기 + 이미지 다운로드 이식 스펙

## 1. 배경 / 목표

인생스포(Life Spoiler)의 compatibility 결과 페이지에는 이미 다음의 통합 패턴이 존재한다.

- (a) **하단 플로팅 2버튼 footer**: "후기 남기기" + "공유하기"
- (b) **ShareDrawer** (`components/fortune/ShareDrawer.tsx`) — 링크 복사 / 카카오 / LINE / 이미지 다운로드 바텀시트
- (c) **ReviewDrawer** (`components/fortune/ReviewDrawer.tsx`) — 별점 + 후기 입력 → `/api/reviews` 전송
- (d) **useImageDownload** (`libs/hooks/useImageDownload.ts`) — 숨김 DOM을 `html-to-image`로 캡처해 다운로드 또는 `toBlob()`으로 카카오 이미지 업로드용 Blob 생성

본 스펙은 위 패턴을 **관상스포(Face Spoiler) 결과 페이지**(`app/face-spoiler/r/[shareId]/page.tsx`)에 그대로 이식해, 관상스포 결과에서도 일관된 공유/후기/다운로드 경험을 제공하는 것을 목표로 한다. 동시에 현재의 상단 인라인 3버튼(`ReportShareButtons`)을 제거하고, 카카오 공유는 신규 이미지 템플릿으로 대체한다.

### 비목표 (Non-goals)

- 관상스포 결과 페이지의 레이아웃/카피 리뉴얼 (버튼/드로어 이식만)
- 신규 후기 테이블/스키마 도입 (기존 `reviews` 테이블 그대로 사용)
- 비로그인 유저를 위한 후기/다운로드 지원
- 관상스포 전용 드로어 컴포넌트 신규 작성 (인생스포 `ShareDrawer`/`ReviewDrawer`를 공용으로 재사용)

## 2. 합의된 결정사항 (변경 금지)

이 섹션의 값은 이미 합의된 것으로 구현 단계에서 임의로 변경할 수 없다.

### 2.1 카카오 공유 템플릿

- **템플릿 ID**: `131969` (관상스포 전용 이미지 템플릿, 신규)
- **템플릿 변수** (3개):
  - `image_url` — 카카오 서버에 업로드된 캡처 이미지 URL
  - `name` — 프로필 이름 (`face_profiles.name`)
  - `web_domain` — `face-spoiler/r/{shareId}` **path만** 전달 (앞의 `/` 없음, origin 없음)
- 기존 인생스포용 피드/이미지 템플릿(`128486`, `128846`)과 **분리**해서 관리한다.

### 2.2 캡처 대상

- 상단 `AnimalHero`의 시각적 복제본이 아닌, 공유 전용 **숨김 `<div>` 컴포넌트** (`HiddenShareCard`)를 별도로 만든다.
- 렌더 내용: 캐릭터 이미지(동물상 이미지) + 동물상 이름 텍스트 2개만. (rationale / matchedRegions / 로고 등 부가 요소 없음)
- 화면에는 보이지 않는 상태로 DOM에 마운트되며 (`position: fixed; left: -9999px; opacity: 0; pointer-events: none;`), `useImageDownload`의 `ref`에 연결된다.
- 다운로드와 카카오 공유 **모두** 이 div 하나를 캡처 대상으로 한다.

### 2.3 권한 가드 (매우 중요)

- 결과의 `face_reports.user_id` === 현재 로그인 유저의 `auth.users.id` 가 **참일 때만** 하단 footer / ShareDrawer / ReviewDrawer / 다운로드 아이콘을 노출한다.
- 그 외 모든 케이스(비로그인, 다른 유저가 공유받은 링크 열람)에서는 위 UI를 **전혀 렌더하지 않는다** (빈 footer 금지).
- 기존 관상 리포트 페이지 자체는 `share_id`만으로 공개 조회가 가능한 점을 유지한다 → 가드는 "액션 UI 노출 여부"에만 관여한다.

### 2.4 후기 시스템

- 기존 `/api/reviews` 엔드포인트를 재사용한다.
- `ReviewFortuneType` 유니온에 `"face_spoiler"` 값을 추가한다 (`libs/supabase/types.ts`).
- `app/api/reviews/route.ts`의 `VALID_FORTUNE_TYPES` 집합에 `"face_spoiler"` 추가.
- POST 경로의 "결제/이용 이력 검증" 분기에 `face_spoiler` 전용 분기를 추가: 해당 `profileId`(= `face_profiles.id`)가 현재 유저 소유이며, 그에 연결된 `face_reports` row 중 `paid_at IS NOT NULL`인 것이 최소 1건 존재해야 함 — 관상스포도 유료 서비스이므로 결제 검증은 필수.
- 후기 저장 시 `profile_id` 컬럼에는 **관상스포 프로필 ID(`face_profiles.id`)**를 사용한다. (인생스포의 `profiles.id`와 DB 상 동일 FK는 아니지만 현재 `reviews.profile_id`는 FK 제약이 느슨한 문자열 키로 운용되므로 재사용 가능하다고 가정한다. 구현 단계에서 제약 조건을 먼저 확인해 문자열 저장이 가능한지 검증 후 진행 — 제약이 강하면 `face_profile_id` 컬럼 신설 마이그레이션이 필요하므로 작업을 중단하고 재설계 필요.)
- 기존 unique constraint `(profile_id, fortune_type)`이 그대로 작동해 중복 방지됨. 409 Conflict는 "이미 후기 작성 완료" UI로 처리.

### 2.5 이미지 다운로드 버튼 위치

- **`AnimalHero` 우상단 아이콘 버튼** (drawer 내부 메뉴 아님). 이미지 위 우상단에 오버레이 형태.
- 다운로드 파일명: `face_spoiler_{animalKey}.png` (예: `face_spoiler_dog.png`)
- 다운로드 버튼은 권한 가드를 통과한 소유자에게만 보인다.

### 2.6 ReportShareButtons 제거

- 상단 인라인 3버튼(`ReportShareButtons`: 링크 복사 / 카카오 / X)은 전면 제거한다.
- 제거 대상 파일: `components/face-spoiler/ReportShareButtons.tsx`, `components/face-spoiler/ReportShareButtons.module.css`
- `r/[shareId]/page.tsx`에서 `ReportShareButtons` import/렌더 제거.

### 2.7 Footer 레이아웃

- `app/compatibility/[id]/fortune/result/page.tsx`의 하단 플로팅 footer와 **시각적으로 동일**한 2버튼 구조 사용.
  - 좌: "후기 남기기" (outline 스타일, 고정 너비)
  - 우: "공유하기" (primary 스타일, flex 확장)
  - CSS 변수/토큰은 compatibility result page의 `.footer / .reviewButton / .shareButton` 규칙을 그대로 참조·복제.

## 3. 영향 파일 목록

### 3.1 신규 생성

| 파일 | 용도 |
| --- | --- |
| `components/face-spoiler/HiddenShareCard.tsx` | 캡처 전용 숨김 div. props: `characterImageUrl`, `animalLabel`. `forwardRef<HTMLDivElement>`. |
| `components/face-spoiler/HiddenShareCard.module.css` | 캡처 카드 스타일 (배경, 패딩, 텍스트 위치) |
| `components/face-spoiler/FaceReportActions.tsx` | 클라이언트 컴포넌트. footer + ShareDrawer + ReviewDrawer + HiddenShareCard + 다운로드 버튼 로직을 한곳에서 관리. 권한 가드(isOwner) props로 받음. |
| `components/face-spoiler/FaceReportActions.module.css` | 위 컴포넌트의 footer 스타일 (compatibility result와 동일 토큰) |

### 3.2 수정

| 파일 | 변경 내용 |
| --- | --- |
| `app/face-spoiler/r/[shareId]/page.tsx` | 서버 컴포넌트에서 현재 로그인 유저의 `auth.users.id` 조회 → `record.user_id === authUserId` 여부 계산 → `isOwner` prop으로 `FaceReportActions`에 전달. `ReportShareButtons` import/렌더 제거. `AnimalHero`에 다운로드 버튼 슬롯 또는 버튼 오버레이용 wrapper 추가. |
| `components/face-spoiler/AnimalHero.tsx` | 우상단 다운로드 버튼 슬롯 수용 (option A: `downloadSlot?: ReactNode` prop, option B: 자식 overlay container). 현재 async 서버 컴포넌트이므로 client 로직은 `FaceReportActions` 쪽에 두고, Hero는 position: relative container만 제공하고 절대 위치 슬롯을 렌더하도록 한다. |
| `components/face-spoiler/AnimalHero.module.css` | `.hero` 또는 `.imageWrapper`에 `position: relative` 보장 + 우상단 아이콘 버튼 포지셔닝용 클래스 추가 |
| `libs/kakao/index.ts` | `FACE_SPOILER_IMAGE_TEMPLATE_ID = 131969` 상수 추가, `shareFaceSpoilerImage(params: KakaoImageShareParams)` 함수 추가. 내부 구현은 `shareToKakaoWithImage`와 동일하되 templateId만 다르게 사용. (기존 `shareToKakaoWithImage`를 그대로 쓰지 않는 이유: 템플릿 ID가 하드코딩되어 있음.) 리팩토링 대안으로 `shareToKakaoWithImage`에 `templateId?` 옵셔널 인자를 추가하는 방식도 허용하되, 기본값은 기존 인생스포 템플릿 유지. |
| `app/api/reviews/route.ts` | `VALID_FORTUNE_TYPES`에 `"face_spoiler"` 추가. POST 결제 검증 분기에 `face_spoiler`: `face_profiles` 소유권 확인 + 연관 `face_reports.paid_at IS NOT NULL` 존재 확인 로직 추가. |
| `libs/supabase/types.ts` | `ReviewFortuneType` 유니온에 `"face_spoiler"` 추가. |
| `messages/translations.json` | `faceSpoiler.share.*` 키 신규 추가 (KO/EN/JA 3개 언어 전부). 누락 키 없도록 기존 `fortune.shareDrawer`, `compatibility.fortune.result.reviewButton/shareButton` 대응 키를 그대로 복제·번역. |

### 3.3 제거

| 파일 | 비고 |
| --- | --- |
| `components/face-spoiler/ReportShareButtons.tsx` | 기능 이관 완료 |
| `components/face-spoiler/ReportShareButtons.module.css` | 동 상 |

## 4. 컴포넌트 상세

### 4.1 `HiddenShareCard`

```tsx
interface HiddenShareCardProps {
  characterImageUrl: string | null;
  animalLabel: string; // ex) "강아지상"
}

// forwardRef로 div ref 노출 → useImageDownload의 ref에 연결
```

- 카드 크기: 1080 × 1080 px (인스타/카카오 이미지 가독성 기준). `pixelRatio: 2`로 캡처해 실질 2160 × 2160 px 출력.
- 배경: 관상스포 브랜드 그라데이션 (`AnimalHero`의 기존 톤과 유사) — 실제 토큰은 구현 단계에서 디자이너/마케터 리뷰로 확정.
- 구성: 중앙 상단 70% 영역에 `characterImageUrl` 이미지, 하단 20% 영역에 `animalLabel` 텍스트 (한 줄, 중앙 정렬, 굵은 세리프/브랜드 폰트).
- `characterImageUrl`이 `null`일 경우 캡처 카드는 placeholder 색상 박스 + 텍스트만 렌더 (다운로드/공유 버튼은 렌더하되 저화질 경고 없이 진행).
- `next/image`가 아닌 네이티브 `<img>` 사용 (`html-to-image`가 `next/image`의 optimizer 경로를 일부 cross-origin으로 취급해 캡처 실패 가능).

### 4.2 `FaceReportActions`

```tsx
interface FaceReportActionsProps {
  shareId: string;
  profileId: string;       // face_profiles.id
  profileName: string;     // face_profiles.name
  animalLabel: string;
  animalKey: string;       // animalMatch.primary (파일명 suffix 용)
  characterImageUrl: string | null;
  isOwner: boolean;        // 서버에서 계산된 권한 가드 결과
}
```

- `isOwner === false` → 컴포넌트 전체가 `null` 반환 (footer, drawer, 다운로드 버튼 전부 미렌더).
- `useState` 4개: `isShareDrawerOpen`, `isReviewDrawerOpen`, `showHiddenCard`, (`useImageDownload` 내장 isDownloading 재사용)
- `useImageDownload({ filename: `face_spoiler_${animalKey}`, pixelRatio: 2 })`.
- 다운로드 핸들러 (AnimalHero 우상단 아이콘용): `setShowHiddenCard(true)` → `await waitOneTick` → `download()` → finally `setShowHiddenCard(false)` (compatibility result page의 `handleProfileDownloadImage` 패턴과 동일).
- 카카오 공유 핸들러: 동일 패턴으로 `toBlob()` → `shareFaceSpoilerImage({ imageBlob, name: profileName, webDomain: `face-spoiler/r/${shareId}` })`. 실패 시 토스트(`alert` → `CopyToast` 계열로 대체 고려), drawer 닫지 않음.
- 링크 복사 / LINE 공유: `ShareDrawer`의 기본 메뉴 그대로. `shareUrl = `${window.location.origin}/face-spoiler/r/${shareId}``.
- "후기 남기기" 버튼 클릭 → `ReviewDrawer` 열기. `<ReviewDrawer profileId={profileId} fortuneType="face_spoiler" />`.
- **중요**: `FaceReportActions`는 `HiddenShareCard`를 자기 자식으로 렌더해야 하며, 다운로드 버튼(아이콘)도 자기가 관리한다. 단, 다운로드 버튼은 UI 상 `AnimalHero` 우상단에 위치해야 하므로 포지셔닝 전략은 둘 중 하나를 선택한다:
  - **안 A (권장)**: `AnimalHero`에 `downloadSlot?: ReactNode` prop 추가 → 페이지에서 `<AnimalHero downloadSlot={<FaceReportActionsDownloadButton ... />} />` 형태. `FaceReportActions`를 두 부분으로 쪼개 다운로드 버튼만 slot으로 주입.
  - **안 B**: `FaceReportActions`가 `position: fixed` absolute로 뷰포트 기준 배치 (좌표 계산 필요, 스크롤 추적 어려움 → 비권장).
- 구현 단계에서 **안 A**로 진행한다. 공용 상태(`useImageDownload`, drawer state)는 상위 `FaceReportActions` 또는 별도 context로 끌어올리고, 다운로드 버튼 JSX만 slot에 주입한다.

### 4.3 `AnimalHero` 수정

```tsx
interface AnimalHeroProps {
  // ... 기존 props
  downloadSlot?: React.ReactNode; // 신규
}
```

- `.imageWrapper`가 `position: relative`임을 보장하고, `downloadSlot` 존재 시 우상단 `position: absolute; top: 12px; right: 12px; z-index: 2;` 컨테이너로 렌더.
- `AnimalHero`는 계속 **async 서버 컴포넌트**로 둔다. 전달되는 `downloadSlot`은 클라이언트 컴포넌트 JSX여야 하며, page.tsx에서 조립한다.

### 4.4 `page.tsx` (서버 컴포넌트) 변경 요약

```tsx
// 1. 현재 로그인 유저 조회
const authClient = await createAuthClient();
const { data: { user: authUser } } = await authClient.auth.getUser();

// 2. record.user_id 대비 owner 여부
const isOwner = Boolean(authUser && authUser.id === record.user_id);

// 3. face_profile 이름 조회 (report record에는 face_profile_id만 있음 → join 혹은 별도 조회)
const profile = await fetchFaceProfile(record.face_profile_id); // name 포함

// 4. AnimalHero에 downloadSlot 주입 + FaceReportActions 렌더
<AnimalHero
  animalMatch={report.animalMatch}
  characterImageUrl={characterImageUrl}
  showFullContext
  downloadSlot={
    isOwner ? (
      <FaceReportActionsDownloadSlot
        shareId={shareId}
        profileId={record.face_profile_id}
        profileName={profile.name}
        animalLabel={...}
        animalKey={report.animalMatch.primary}
        characterImageUrl={characterImageUrl}
      />
    ) : null
  }
/>
...
<FaceReportActionsFooter
  isOwner={isOwner}
  shareId={shareId}
  profileId={record.face_profile_id}
  profileName={profile.name}
  animalLabel={...}
  animalKey={report.animalMatch.primary}
  characterImageUrl={characterImageUrl}
/>
```

- 위 구조상 다운로드 버튼(슬롯)과 하단 footer/drawer가 **같은 상태를 공유**해야 하므로, 구현 단계에서는 `FaceReportActions`를 단일 클라이언트 루트로 만들고 React portal로 두 곳(AnimalHero 우상단, body 하단 footer)에 동시 렌더하는 방식을 채택한다.
  - 페이지 레벨에서 `<FaceReportActions>` 1개만 렌더.
  - 내부에서 `AnimalHero`의 슬롯 DOM(우상단 absolute container, page.tsx가 미리 정의)으로 다운로드 버튼을 `createPortal`로 전송.
  - 타겟 DOM id: `face-spoiler-download-slot` (AnimalHero가 `isOwner ? <div id="face-spoiler-download-slot" className={...} /> : null`로 빈 컨테이너만 렌더).
  - 페이지 마운트 후 portal target 존재 여부를 `useEffect`로 확인해 mount 지연 처리.

## 5. `/api/reviews` 확장 상세

```ts
const VALID_FORTUNE_TYPES: ReadonlySet<ReviewFortuneType> = new Set([
  "lifetime",
  "yearly",
  "past_life",
  "compatibility",
  "face_spoiler", // 추가
]);
```

POST 내부 결제 검증 분기:

```ts
if (fortuneTypeValue === "face_spoiler") {
  // profileId = face_profiles.id
  // 1. 소유권: face_profiles.user_id === authUser.id (이미 위쪽에서 profiles 테이블로 체크하고 있으므로,
  //    face_spoiler 분기에서는 face_profiles 테이블로 재조회한다.)
  const { data: faceProfile, error: faceProfileError } = await supabase
    .from("face_profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", authUser.id)
    .single();
  if (faceProfileError || !faceProfile) {
    return 404 "프로필을 찾을 수 없습니다.";
  }

  // 2. 결제 이력: 연관 face_reports.paid_at NOT NULL 1건 이상
  const { data: report, error: reportError } = await supabase
    .from("face_reports")
    .select("id")
    .eq("face_profile_id", profileId)
    .not("paid_at", "is", null)
    .limit(1)
    .single();
  if (reportError || !report) {
    return 403 "해당 운세를 이용한 이력이 없습니다.";
  }
}
```

GET 경로도 동일하게 `face_spoiler`에 대해서는 `face_profiles` 테이블로 소유권 체크를 해야 한다 (현재 코드는 `profiles` 테이블만 조회 → 그대로 두면 404 발생). 분기 추가 필수.

## 6. 번역 키

`messages/translations.json`에 다음 키를 3개 언어(KO/EN/JA) 전부 추가. KO가 주 언어지만 누락 없이 세트로 채운다.

```
faceSpoiler.share.footerReviewButton: "후기 남기기" / "Leave a review" / "レビューを書く"
faceSpoiler.share.footerShareButton: "공유하기" / "Share" / "シェアする"
faceSpoiler.share.drawerTitle: "공유하기" / "Share" / "シェアする"
faceSpoiler.share.copyLink: "링크 복사하기" / "Copy link" / "リンクをコピー"
faceSpoiler.share.shareKakao: "카카오톡 공유하기" / ...
faceSpoiler.share.shareLine: "라인 공유하기" / ...
faceSpoiler.share.downloadImage: "이미지 다운로드" / ...
faceSpoiler.share.downloading: "다운로드 중..." / ...
faceSpoiler.share.downloadButtonAria: "이미지 다운로드" (우상단 아이콘 aria-label)
faceSpoiler.share.kakaoShareFailed: "공유에 실패했습니다. 다시 시도해주세요."
faceSpoiler.share.captureFailed: "이미지 생성에 실패했습니다. 다시 시도해주세요."
faceSpoiler.share.copySuccess: "링크가 복사되었습니다."
faceSpoiler.report.reviewCompleted: "후기 작성 완료" (이미 있으면 재사용)
```

`ShareDrawer`/`ReviewDrawer`는 기존 `fortune.shareDrawer` namespace를 읽는 구조이므로, 관상스포 노출 시에도 **기존 키를 그대로 사용**해 별도의 중복 키 없이 동작시킨다. 위 `faceSpoiler.share.*`는 footer 버튼과 우상단 다운로드 아이콘에만 사용한다.

## 7. UX 디테일

- **캡처 div 스타일** (가이드라인, 최종은 디자이너 리뷰):
  - 정사각 1080×1080, 브랜드 딥 퍼플 → 핑크 그라데이션 배경
  - 캐릭터 이미지: 중앙 상단 760×760 원형 또는 둥근 사각 마스크
  - 동물상 라벨: 하단 중앙, 64px 굵은 세리프, 흰색, 그림자 약간
  - 브랜드 워터마크/로고는 **넣지 않는다** (결정사항 2.2: "이미지 + 텍스트만")
- **다운로드 버튼 (AnimalHero 우상단 아이콘)**:
  - 44×44 터치 타겟, 반투명 검정 배경, 흰색 download 아이콘(lucide `Download`)
  - `aria-label`: `faceSpoiler.share.downloadButtonAria`
  - 다운로드 중에는 spinner 또는 비활성화 상태 표시
- **footer**:
  - 스크롤 하단 고정(sticky/fixed), compatibility result와 동일한 패딩/간격
  - 반응형: 모바일 우선, 데스크톱은 max-width 컨테이너 내부에 정렬
- **drawer 오픈 동작**:
  - body scroll lock은 기존 `ShareDrawer`/`ReviewDrawer`가 이미 처리
  - 카카오 공유 중에는 drawer를 열어둔 채 `isDownloading` prop으로 메뉴 비활성화
- **권한 없을 때** (`isOwner === false`):
  - footer, 다운로드 아이콘, 어떤 drawer trigger도 DOM에 **존재하지 않음**
  - 리포트 본문(AnimalHero, ReportView)은 정상 노출
  - 비로그인 유저에게도 보여야 하는 CTA(예: "나도 분석해보기")가 필요하면 별도 스펙으로 분리 (본 스펙 범위 밖)
- **후기 작성 완료 UX**:
  - 기존 `ReviewDrawer`가 `isCompleted` 상태로 "소중한 후기 감사합니다!" 뷰 자동 표시
  - 서버에서 409(중복) 발생 시 기존 로직대로 에러 메시지 노출 → 사용자가 drawer 재진입 시 GET이 `exists: true`를 돌려주므로 완료 뷰로 전환됨

## 8. 엣지 케이스

| 케이스 | 동작 |
| --- | --- |
| 캡처 시 이미지 로딩 미완료 | `useImageDownload.waitForImagesToLoad`가 3초 타임아웃 내 모든 `<img>` 대기 → 기존 훅 동작 그대로 |
| `characterImageUrl === null` (캐릭터 이미지 미생성 상태) | 캡처 카드에 placeholder 색상만 렌더해 진행. 다운로드/공유는 가능하되 품질 낮음 경고 없음. |
| 카카오 SDK 초기화 실패 | `shareFaceSpoilerImage`가 `false` 반환 → `alert` 또는 토스트로 실패 알림, drawer 유지 |
| 카카오 이미지 업로드 실패 (네트워크/사이즈) | 동일: 실패 토스트, drawer 유지 |
| iOS Safari Web Share API | 다운로드 버튼은 기존 훅이 iOS 감지해 Web Share로 폴백 — 기존 동작 유지 |
| 비로그인 상태에서 본인 결과 접근 (쿠키/세션 만료) | `authUser === null` → `isOwner = false` → 액션 UI 미렌더. 사용자가 다시 로그인하면 정상 노출. 쿠키 기반 "내 것" 자체 판단 로직은 **넣지 않는다** (스펙 범위 밖). |
| `reviews.profile_id` FK 제약 | 기존 제약이 `profiles.id`만 허용하는 FK라면 face_profiles.id 삽입 시 FK 위반. 구현 시작 전에 `reviews` 테이블 제약 조건을 SQL로 직접 확인해야 함. 제약 존재 시 → 스펙 재설계(별도 `face_profile_id` 컬럼 마이그레이션 등). |
| 번역 키 누락 | `next-intl`은 `default` 옵션을 지원하므로 KO 외 언어가 누락돼도 fallback 가능. 그래도 KO/EN/JA 3개 키는 전부 추가해 누락 없음. |
| 리포트 페이지를 **SSR로 조회 시 로그인 세션이 없는 것처럼 보이는 케이스** | `createAuthClient`는 server action/route handler에선 쿠키를 읽을 수 있지만, 서버 컴포넌트에서도 쿠키 기반으로 동작하므로 그대로 사용 가능. 그럼에도 "클라이언트에서 재확인"이 필요하면 `FaceReportActions` 내부에서 `useEffect`로 `/api/auth/me` 등을 호출해 재검증 → 본 스펙에서는 서버 판정을 1차로 신뢰하고 재검증은 도입하지 않는다. |

## 9. 체크리스트 (구현/리뷰 시 검증)

- [ ] 카카오 템플릿 ID `131969` 사용, 변수 3개(`image_url`/`name`/`web_domain`)만 전달
- [ ] `web_domain`은 path만 (`face-spoiler/r/{shareId}`), origin/선행 `/` 없음
- [ ] `HiddenShareCard`는 이미지 + 동물상 이름 텍스트만 렌더 (로고/부가요소 없음)
- [ ] 다운로드와 카카오 공유가 **같은** `HiddenShareCard` 1개를 캡처 대상으로 공유
- [ ] `isOwner === false`면 footer/drawer/다운로드 버튼 전부 DOM 미렌더 (빈 공간 없음)
- [ ] `ReportShareButtons` 파일·import·렌더 전부 제거됨
- [ ] 다운로드 버튼은 `AnimalHero` 우상단 아이콘 형태로만 존재
- [ ] 하단 footer 2버튼 레이아웃/스타일이 compatibility result page와 시각적으로 동일
- [ ] `ReviewFortuneType`에 `"face_spoiler"` 추가, `/api/reviews` POST/GET 분기 추가
- [ ] 결제 검증: `face_profiles` 소유권 + `face_reports.paid_at IS NOT NULL` 이력 확인
- [ ] `reviews.profile_id` FK 제약 검증 완료 (face_profiles.id 삽입 가능)
- [ ] 번역 키 `faceSpoiler.share.*` KO/EN/JA 전부 추가, 누락 없음
- [ ] 인생스포(compatibility) 기존 공유/후기 동작 회귀 없음 (템플릿 ID, 프로필 공유 유지)
- [ ] 관상스포 카카오 이미지 템플릿 실제 발행 및 검수 완료 (마케터/플랫폼 담당 확인)
- [ ] iOS Safari, 안드로이드 Chrome, 데스크톱 Chrome에서 다운로드·공유 각 1회 수동 검증

## 10. 오픈 이슈 / 후속 작업

- **카피**: 카카오 공유 템플릿 131969의 실제 카피(타이틀/본문/버튼 문구)는 Task #2 마케터 작업으로 분리. 본 스펙에서는 변수 스키마만 고정.
- **캡처 카드 디자인 토큰**: 최종 색상/폰트는 디자이너 리뷰(Task #4)에서 확정.
- **비로그인 본인 세션 판단**: 현 스펙에서는 로그인 필수. 비로그인 본인 판단이 필요해지면 후속 스펙으로 분리.
- **reviews.profile_id 스키마**: face_profiles.id 삽입이 FK 제약에 막히면 `face_profile_id` 컬럼 추가 마이그레이션이 필요하며, 이 경우 본 스펙은 "구현 전 재설계" 상태로 되돌린다.
