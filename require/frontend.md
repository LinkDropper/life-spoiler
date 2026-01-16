# Frontend 기능 명세서

## 1. 개요

- **서비스명:** 인생스포
- **프레임워크:** Next.js 15 (App Router)
- **스타일링:** CSS Modules
- **결제 시스템:** 토스페이먼츠

> backend.md, 자미두수 알고리즘 명세는 별도 문서에서 정의합니다.

---

## 2. User Flow 및 라우팅

```
[랜딩] → [로그인] → [정보입력] → [로딩] → [미리보기] → [결제] → [결과]
   /      /login      /form     /loading   /preview   (PG팝업)  /result
```

| 경로       | 페이지명         | 인증 필요 | 설명                                |
| ---------- | ---------------- | --------- | ----------------------------------- |
| `/`        | 랜딩 페이지      | X         | 마케팅 페이지 + CTA 버튼            |
| `/login`   | 로그인 페이지    | X         | 소셜 로그인 (카카오, 구글 등)       |
| `/form`    | 정보 입력 페이지 | **O**     | 생년월일 등 사용자 정보 입력        |
| `/loading` | 로딩 페이지      | **O**     | 분석 연출 (2.5~3초)                 |
| `/preview` | 미리보기 페이지  | **O**     | 무료 콘텐츠 + 블러 처리 + 결제 유도 |
| `/result`  | 결과 페이지      | **O**     | 결제 완료 후 전체 분석 결과         |

### 2.1. 인증 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                      비로그인 사용자                          │
│  [랜딩(/)] → CTA 클릭 → [로그인(/login)] → 소셜 로그인 완료   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       로그인된 사용자                         │
│  [정보입력(/form)] → [로딩] → [미리보기] → [결제] → [결과]    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. 보호된 라우트 (Protected Routes)

- `/form`, `/loading`, `/preview`, `/result` 페이지는 로그인 필수
- 비로그인 상태로 접근 시 `/login?redirect={원래경로}` 로 리다이렉트
- 로그인 완료 후 원래 접근하려던 페이지로 자동 이동

---

## 3. 페이지별 상세 명세

### 3.1. 랜딩 페이지 (`/`)

> 마케팅 목적의 페이지. 서비스 소개 및 CTA를 통해 로그인으로 유도.

#### 3.1.1. 레이아웃 구조

```
┌─────────────────────────────────┐
│         헤더 (로고/타이틀)        │
├─────────────────────────────────┤
│         메인 카피 영역           │
│  "내 인생, 990원이면 스포일러..."  │
│                                 │
│         서브 카피               │
│  "남들은 5만 원 주고 보는..."     │
├─────────────────────────────────┤
│         서비스 설명 영역         │
│  (자미두수가 뭔지, 뭘 알 수 있는지) │
├─────────────────────────────────┤
│  [자미두수 보러가기] CTA 버튼     │
└─────────────────────────────────┘
```

#### 3.1.2. 카피 문구

- **메인 카피:** "내 인생, 990원이면 스포일러 당할 수 있습니다."
- **서브 카피:** "남들은 5만 원 주고 보는 자미두수, 커피 한 잔 값도 안 되는 가격에 확인하세요."

#### 3.1.3. 동작 명세

- **CTA 버튼 클릭 시:**
  - 비로그인 상태: `/login?redirect=/form` 으로 이동
  - 로그인 상태: `/form` 으로 직접 이동

---

### 3.2. 로그인 페이지 (`/login`)

> 소셜 로그인 전용 페이지. 자체 회원가입 없이 소셜 계정으로만 로그인.

#### 3.2.1. 레이아웃 구조

```
┌─────────────────────────────────┐
│         헤더 (로고)              │
├─────────────────────────────────┤
│                                 │
│         로그인 안내 문구         │
│    "간편하게 로그인하고          │
│     내 운명을 확인하세요"        │
│                                 │
├─────────────────────────────────┤
│   [카카오로 시작하기] 버튼        │
│   [Google로 시작하기] 버튼       │
├─────────────────────────────────┤
│         하단 안내               │
│   "로그인 시 이용약관에 동의..."   │
└─────────────────────────────────┘
```

#### 3.2.2. 지원 소셜 로그인

| 제공자 | 버튼 스타일          | 우선순위 |
| ------ | -------------------- | -------- |
| 카카오 | 카카오 브랜드 가이드 | 1순위    |
| Google | Google 브랜드 가이드 | 2순위    |

#### 3.2.3. 동작 명세

```typescript
interface LoginPageProps {
  redirect?: string; // 로그인 후 이동할 경로 (쿼리 파라미터)
}
```

- **소셜 로그인 버튼 클릭:** OAuth 인증 플로우 시작
- **로그인 성공:**
  - `redirect` 파라미터가 있으면 해당 경로로 이동
  - 없으면 `/form` 으로 이동
- **로그인 실패:** Toast로 에러 메시지 표시

#### 3.2.4. UX 요구사항

- 로그인 버튼은 각 소셜 서비스의 브랜드 가이드 준수
- 이미 로그인된 상태로 접근 시 자동으로 redirect 경로로 이동
- 하단에 이용약관, 개인정보처리방침 링크 표시

---

### 3.3. 정보 입력 페이지 (`/form`) - **로그인 필수**

> 자미두수 분석에 필요한 생년월일시 정보를 입력받는 페이지.

#### 3.3.1. 레이아웃 구조

```
┌─────────────────────────────────┐
│         헤더 (로고/뒤로가기)      │
├─────────────────────────────────┤
│         안내 문구               │
│  "정확한 운세를 위해 정보를..."   │
├─────────────────────────────────┤
│         입력 폼 영역             │
│  - 이름                         │
│  - 생년월일                     │
│  - 태어난 시간                  │
│  - 성별                         │
│  - 양력/음력                    │
├─────────────────────────────────┤
│    [내 운명 조회하기] 버튼        │
└─────────────────────────────────┘
```

#### 3.3.2. 입력 폼 필드 정의

| 필드명         | 타입     | 필수 | 유효성 검사              | UI 컴포넌트 |
| -------------- | -------- | ---- | ------------------------ | ----------- |
| `name`         | `string` | O    | 1~20자, 한글/영문만      | TextInput   |
| `birthDate`    | `string` | O    | YYYY-MM-DD 형식          | DatePicker  |
| `birthTime`    | `enum`   | O    | 12시진 중 선택           | Select      |
| `gender`       | `enum`   | O    | `male` \| `female`       | RadioGroup  |
| `calendarType` | `enum`   | O    | `solar` \| `lunar`       | RadioGroup  |

**시진(時辰) 선택 옵션:**

| 값   | 표시 라벨           | 시간대        |
| ---- | ------------------- | ------------- |
| `자` | 자시 (23:00~00:59)  | 밤 11시~새벽 1시 |
| `축` | 축시 (01:00~02:59)  | 새벽 1시~3시   |
| `인` | 인시 (03:00~04:59)  | 새벽 3시~5시   |
| `묘` | 묘시 (05:00~06:59)  | 새벽 5시~7시   |
| `진` | 진시 (07:00~08:59)  | 오전 7시~9시   |
| `사` | 사시 (09:00~10:59)  | 오전 9시~11시  |
| `오` | 오시 (11:00~12:59)  | 오전 11시~오후 1시 |
| `미` | 미시 (13:00~14:59)  | 오후 1시~3시   |
| `신` | 신시 (15:00~16:59)  | 오후 3시~5시   |
| `유` | 유시 (17:00~18:59)  | 오후 5시~7시   |
| `술` | 술시 (19:00~20:59)  | 저녁 7시~9시   |
| `해` | 해시 (21:00~22:59)  | 밤 9시~11시    |

#### 3.3.3. 상태 및 동작

```typescript
type TimeBranchValue = "자" | "축" | "인" | "묘" | "진" | "사" | "오" | "미" | "신" | "유" | "술" | "해";

interface BirthInfoForm {
  name: string;
  birthDate: string; // "YYYY-MM-DD"
  birthTime: TimeBranchValue; // 시진 선택
  gender: "male" | "female";
  calendarType: "solar" | "lunar";
}
```

- **제출 시 동작:**
  1. 클라이언트 유효성 검사
  2. 유효성 통과 시 `/loading`으로 이동 (폼 데이터는 sessionStorage로 전달)

#### 3.3.4. UX 요구사항

- 시진 선택 안내 문구: "태어난 시간대를 선택해주세요. 정확한 시간을 모르시면 부모님께 확인해보세요."
- 모바일 키보드 최적화 (날짜/시간 네이티브 피커 활용)
- 버튼 비활성화: 필수 필드 미입력 시
- 로그인한 사용자 이름 자동 입력 (소셜 로그인에서 가져온 경우)

---

### 3.4. 로딩 페이지 (`/loading`) - **로그인 필수**

#### 3.4.1. 레이아웃 구조

```
┌─────────────────────────────────┐
│                                 │
│        로딩 애니메이션           │
│                                 │
├─────────────────────────────────┤
│      롤링 메시지 영역            │
│   "{이름}님의 명궁 분석 중..."    │
└─────────────────────────────────┘
```

#### 3.4.2. 롤링 메시지 목록

```typescript
const LOADING_MESSAGES = [
  "{name}님의 명궁 분석 중...",
  "재물 창고 확인 중...",
  "숨겨진 재능 스캔 중...",
  "인생 전성기 계산 중...",
  "최종 결과 정리 중...",
];
```

#### 3.4.3. 동작 명세

- **Duration:** 2.5초 ~ 3초
- **메시지 롤링:** 0.5초 간격으로 메시지 순환
- **완료 시:** 자동으로 `/preview`로 이동
- **백엔드 연동:** 로딩 중 분석 API 호출 (실제 분석 시간이 더 짧으면 최소 2.5초 대기)

#### 3.4.4. 데이터 흐름

```
[정보입력에서 전달받은 데이터] → [분석 API 호출] → [결과를 sessionStorage에 저장] → [/preview 이동]
```

---

### 3.5. 미리보기 페이지 (`/preview`) - **로그인 필수**

#### 3.5.1. 레이아웃 구조

```
┌─────────────────────────────────┐
│         헤더 영역                │
├─────────────────────────────────┤
│   [상단] 명궁 분석 (무료 공개)    │
│   본성 한 줄 요약                │
├─────────────────────────────────┤
│   [중단] 핵심 질문 (블러 처리)    │
│   Q1. 평생 만질 돈의 그릇은?     │
│   Q2. 인생 최대의 전성기는?      │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [하단] Floating Bottom Sheet │ │
│ │  990원에 잠금 해제하기 버튼   │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### 3.5.2. 섹션별 상세

**명궁 분석 섹션 (무료 공개)**

```typescript
interface PreviewFreeContent {
  title: string; // "당신의 본성"
  summary: string; // "겉은 순한 양, 속은 야망 있는 호랑이! 🐯"
  description: string; // "남 밑에서 일 못하는 사장님 팔자시네요."
}
```

**블러 처리 섹션**

```typescript
interface PreviewLockedContent {
  questions: Array<{
    question: string; // "평생 만질 돈의 그릇은?"
    teaser: string; // "당신의 재물 창고에는 💰 [잠겨있음] 정도가..."
  }>;
}
```

#### 3.5.3. 결제 유도 Bottom Sheet

- **고정 위치:** 화면 하단에 고정 (Sticky/Fixed)
- **구성 요소:**
  - 결제 버튼: `[990원에 잠금 해제하고 인생 확인하기]`
  - 심리적 트리거 문구: "지금 페이지를 닫으면 이 가격으로 다시 볼 수 없습니다."
- **버튼 클릭 시:** 토스페이먼츠 결제창 호출

---

### 3.6. 결제 프로세스

#### 3.6.1. 토스페이먼츠 연동 흐름

```
[결제 버튼 클릭]
      ↓
[결제 요청 생성 (서버)]
      ↓
[토스페이먼츠 SDK 결제창 호출]
      ↓
[결제 완료/실패 콜백]
      ↓
[성공 시 /result로 이동]
```

#### 3.6.2. 결제 정보

```typescript
interface PaymentRequest {
  orderId: string; // 고유 주문번호
  amount: number; // 990
  orderName: string; // "[자미두수] 인생 스포일러 열람권"
  customerName: string; // 사용자 이름
}
```

#### 3.6.3. 결제 결과 처리

- **성공:** `/result?orderId={orderId}` 로 리다이렉트
- **실패/취소:** 에러 메시지 토스트 표시, 미리보기 페이지 유지

---

### 3.7. 결과 페이지 (`/result`) - **로그인 필수**

#### 3.7.1. 레이아웃 구조

```
┌─────────────────────────────────┐
│         헤더 영역                │
├─────────────────────────────────┤
│   1. 총평 (한 줄 요약)           │
│   "초년엔 고생하나 말년엔..."     │
├─────────────────────────────────┤
│   2. 재물운                      │
│   평생의 재물 흐름, 돈 버는 방식   │
├─────────────────────────────────┤
│   3. 직업운                      │
│   적성, 추천 직업군              │
├─────────────────────────────────┤
│   4. 연애/결혼운                 │
│   배우자 복, 결혼 시기           │
├─────────────────────────────────┤
│   5. 건강/기타                   │
│   조심해야 할 신체 부위          │
├─────────────────────────────────┤
│   [공유하기] 버튼                │
└─────────────────────────────────┘
```

#### 3.7.2. 결과 데이터 구조

```typescript
interface FortuneResult {
  summary: string; // 총평 한 줄 요약

  wealth: {
    title: string; // "재물운"
    content: string; // 상세 내용
  };

  career: {
    title: string; // "직업운"
    content: string;
  };

  relationship: {
    title: string; // "연애/결혼운"
    content: string;
  };

  health: {
    title: string; // "건강/기타"
    content: string;
  };
}
```

#### 3.7.3. 공유 기능

- **[내 인생 요약 짤 저장하기]:** 결과 요약을 이미지로 생성하여 저장
- **[친구에게 공유하기]:** 카카오톡/링크 공유
- **공유 썸네일:** "내 인생 등급은 S급? 990원 자미두수 확인하기"

#### 3.7.4. 접근 제어

- 로그인 필수 (미로그인 시 `/login`으로 리다이렉트)
- 유효한 결제 완료 정보가 없으면 `/form` 으로 리다이렉트
- orderId로 결제 상태 검증 (서버 사이드)

---

## 4. 공통 컴포넌트

### 4.1. 컴포넌트 목록

| 컴포넌트명          | 용도                    | 위치                                |
| ------------------- | ----------------------- | ----------------------------------- |
| `TextInput`         | 텍스트 입력 필드        | `components/form/TextInput`         |
| `DatePicker`        | 날짜 선택               | `components/form/DatePicker`        |
| `TimePicker`        | 시간 선택               | `components/form/TimePicker`        |
| `RadioGroup`        | 라디오 버튼 그룹        | `components/form/RadioGroup`        |
| `Button`            | 공통 버튼               | `components/ui/Button`              |
| `Toast`             | 알림 메시지             | `components/ui/Toast`               |
| `BottomSheet`       | 하단 고정 시트          | `components/ui/BottomSheet`         |
| `BlurredCard`       | 블러 처리된 콘텐츠 카드 | `components/ui/BlurredCard`         |
| `LoadingSpinner`    | 로딩 애니메이션         | `components/ui/LoadingSpinner`      |
| `ShareButtons`      | 공유 버튼 그룹          | `components/ui/ShareButtons`        |
| `SocialLoginButton` | 소셜 로그인 버튼        | `components/auth/SocialLoginButton` |

### 4.2. 디렉토리 구조

```
app/
├── page.tsx                    # 랜딩 페이지
├── login/
│   └── page.tsx               # 로그인 페이지
├── form/
│   └── page.tsx               # 정보 입력 페이지 (Protected)
├── loading/
│   └── page.tsx               # 로딩 페이지 (Protected)
├── preview/
│   └── page.tsx               # 미리보기 페이지 (Protected)
├── result/
│   └── page.tsx               # 결과 페이지 (Protected)
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts       # NextAuth.js 핸들러 (또는 자체 구현)
│       └── callback/
│           └── route.ts       # OAuth 콜백 처리
├── layout.tsx
└── globals.css

components/
├── auth/
│   ├── SocialLoginButton.tsx
│   ├── SocialLoginButton.module.css
│   ├── AuthGuard.tsx          # Protected Route 래퍼
│   └── AuthGuard.module.css
├── form/
│   ├── TextInput.tsx
│   ├── TextInput.module.css
│   ├── DatePicker.tsx
│   ├── DatePicker.module.css
│   ├── TimePicker.tsx
│   ├── TimePicker.module.css
│   ├── RadioGroup.tsx
│   └── RadioGroup.module.css
├── ui/
│   ├── Button.tsx
│   ├── Button.module.css
│   ├── Toast.tsx
│   ├── Toast.module.css
│   ├── BottomSheet.tsx
│   ├── BottomSheet.module.css
│   ├── BlurredCard.tsx
│   ├── BlurredCard.module.css
│   ├── LoadingSpinner.tsx
│   ├── LoadingSpinner.module.css
│   ├── ShareButtons.tsx
│   └── ShareButtons.module.css
└── layout/
    ├── Header.tsx
    └── Header.module.css
```

---

## 5. 상태 관리

### 5.1. 인증 상태

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  provider: "kakao" | "google";
}
```

- 인증 상태는 서버 세션 기반으로 관리
- 클라이언트에서는 `useAuth` 훅을 통해 인증 상태 접근
- Protected Route는 `AuthGuard` 컴포넌트로 감싸서 처리

### 5.2. 데이터 흐름

```
[랜딩] CTA 클릭
    ↓
[로그인] 소셜 로그인 완료 → 세션 생성
    ↓
[정보입력] sessionStorage에 입력값 저장
    ↓
[로딩] sessionStorage에서 읽기 → API 호출 → 결과 저장
    ↓
[미리보기] sessionStorage에서 미리보기 데이터 읽기
    ↓
[결제] 결제 완료 시 orderId 저장
    ↓
[결과] orderId로 서버에서 전체 결과 조회
```

### 5.3. sessionStorage 키 정의

```typescript
const STORAGE_KEYS = {
  BIRTH_INFO: "birthInfo", // BirthInfoForm
  ANALYSIS_PREVIEW: "analysisPreview", // PreviewFreeContent + PreviewLockedContent
  ORDER_ID: "orderId", // string
} as const;
```

### 5.4. AuthGuard 컴포넌트

```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;  // 기본값: "/login"
}

// 사용 예시
<AuthGuard>
  <FormPage />
</AuthGuard>
```

- 미인증 시 `/login?redirect={현재경로}` 로 리다이렉트
- 인증 확인 중에는 로딩 스피너 표시

---

## 6. API 인터페이스 (Frontend 관점)

> 실제 API 구현은 backend.md에서 정의

### 6.1. 인증 API

```typescript
// GET /api/auth/session
// 현재 로그인 상태 확인
interface SessionResponse {
  isAuthenticated: boolean;
  user?: User;
}

// GET /api/auth/login/{provider}
// 소셜 로그인 시작 (리다이렉트)
// provider: "kakao" | "google"

// GET /api/auth/callback/{provider}
// OAuth 콜백 처리 (리다이렉트)

// POST /api/auth/logout
// 로그아웃
interface LogoutResponse {
  success: boolean;
}
```

### 6.2. 분석 요청

```typescript
// POST /api/analysis
type TimeBranchValue = "자" | "축" | "인" | "묘" | "진" | "사" | "오" | "미" | "신" | "유" | "술" | "해";

interface AnalysisRequest {
  name: string;
  birthDate: string;
  birthTime: TimeBranchValue; // 시진 선택
  gender: "male" | "female";
  calendarType: "solar" | "lunar";
}

interface AnalysisResponse {
  analysisId: string;
  preview: PreviewFreeContent;
  locked: PreviewLockedContent;
}
```

### 6.3. 결제 요청 생성

```typescript
// POST /api/payment/request
interface PaymentInitRequest {
  analysisId: string;
}

interface PaymentInitResponse {
  orderId: string;
  amount: number;
  orderName: string;
}
```

### 6.4. 결제 확인 및 결과 조회

```typescript
// GET /api/result?orderId={orderId}
interface ResultResponse {
  success: boolean;
  result?: FortuneResult;
  error?: string;
}
```

---

## 7. 반응형 및 접근성

### 7.1. 반응형 브레이크포인트

```css
/* Mobile First */
/* 기본: 모바일 (< 768px) */
/* 태블릿: 768px ~ 1023px */
/* 데스크탑: >= 1024px */
```

### 7.2. 모바일 우선 설계

- 모든 UI는 모바일 뷰(375px) 기준으로 설계
- 터치 타겟 최소 44px × 44px
- 폼 필드 간 충분한 여백 (최소 16px)
- 네이티브 날짜/시간 피커 활용

### 7.3. 접근성 요구사항

- 모든 폼 필드에 적절한 label 연결
- 버튼에 명확한 aria-label
- 색상 대비 WCAG AA 기준 충족
- 키보드 네비게이션 지원

---

## 8. 에러 처리

### 8.1. 에러 유형별 처리

| 에러 유형           | 처리 방식                               |
| ------------------- | --------------------------------------- |
| 미인증 접근         | `/login?redirect={현재경로}` 리다이렉트 |
| 소셜 로그인 실패    | Toast 알림 + 로그인 페이지 유지         |
| 폼 유효성 검사 실패 | 필드 하단에 인라인 에러 메시지          |
| API 호출 실패       | Toast 알림 + 재시도 버튼                |
| 결제 실패/취소      | Toast 알림 + 미리보기 페이지 유지       |
| 세션 만료           | 로그인 페이지로 리다이렉트              |
| 잘못된 접근         | 정보 입력 페이지로 리다이렉트           |

### 8.2. 에러 메시지 톤앤매너

- 사용자 친화적인 한국어 메시지
- 기술적 용어 사용 지양
- 다음 행동 안내 포함

```typescript
// Good
"로그인이 필요한 서비스예요. 간편 로그인 후 이용해 주세요.";
"결제 중 문제가 발생했어요. 다시 시도해 주세요.";

// Bad
"Unauthorized: Please login first";
"Payment API Error: 500 Internal Server Error";
```

---

## 9. 성능 요구사항

- LCP (Largest Contentful Paint): < 2.5초
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- 번들 사이즈 최적화: 페이지별 코드 스플리팅
- 이미지 최적화: Next.js Image 컴포넌트 활용

---

## 10. 추후 고려사항

- [ ] 디자인 시안 반영 시 스타일 업데이트
- [ ] 공유 이미지 생성 기능 (html2canvas 또는 서버 사이드 렌더링)
- [ ] 카카오톡 공유 API 연동
- [ ] GA/GTM 이벤트 트래킹
- [ ] 에러 모니터링 (Sentry 등)
