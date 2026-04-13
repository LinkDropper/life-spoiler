# 레퍼럴 프로모션 기획서

> 작성일: 2026-04-13
> 상태: Draft

## 1. 개요

결과 페이지에서 공유하기를 통해 친구를 초대하고, 초대받은 친구가 **회원가입을 완료**하면 공유한 사용자에게 **무료 운세 1회** 프로모션 코드를 지급하는 기능.

### 목표

- 기존 사용자의 자발적 공유를 통한 신규 유저 획득
- 가입 전환율 향상 (공유 → 가입 퍼널)
- 공유자에게 실질적 보상을 제공하여 바이럴 루프 형성

### 운영 방식

- **상시 운영** (기간 제한 없음)

## 2. 전체 플로우

```
[사용자 A] 결과 페이지 → 공유하기 버튼(EVENT 태그) 클릭
    ↓
[사용자 A] ShareDrawer에서 링크 복사 또는 카카오톡 공유
    ↓  (공유 URL에 ?ref={userId} 파라미터 포함)
[사용자 B] 공유 링크 클릭 → 공유 결과 페이지 진입
    ↓  (ref 파라미터를 localStorage에 저장)
[사용자 B] "나도 해보기" → 로그인/회원가입 완료
    ↓  (신규 가입 감지 + localStorage에 ref 존재)
[클라이언트] POST /api/referral/reward 호출
    ↓
[서버] 사용자 A에게 프로모션 코드 생성 & 알림 발송
    ↓
[사용자 A] 카카오톡/이메일 알림 수신 → 프로모션 코드 사용
```

## 3. 상세 기능 명세

### 3.1 공유하기 UI 변경

#### 공유하기 버튼 EVENT 태그

- 기존 공유하기 버튼 **위에** `EVENT` 뱃지 태그 추가
- 참고 UI: 카카오톡 로그인의 "3초만에 로그인" 태그와 유사한 형태
- 뱃지 스타일: 작은 pill 형태, 강조 색상 배경

```
    ┌───────┐
    │ EVENT │  ← 뱃지 태그
    └───┬───┘
  ┌─────┴─────┐
  │  공유하기  │  ← 기존 버튼
  └───────────┘
```

#### ShareDrawer 내부 이벤트 메시지

- 드로어 상단 (타이틀 아래)에 이벤트 안내 배너 추가
- 메시지: "친구가 가입하면 무료 운세 1회를 드려요!"
- 배너 스타일: 강조 배경색 + 아이콘

```
┌──────────────────────────────┐
│ 공유하기                      │
├──────────────────────────────┤
│ 🎁 친구가 가입하면              │
│    무료 운세 1회를 드려요!      │  ← 이벤트 배너 (신규)
├──────────────────────────────┤
│ 🔗 링크 복사하기               │
│ 💬 카카오톡 공유하기            │
└──────────────────────────────┘
```

#### 공유 채널 제한

- **링크 복사**와 **카카오톡 공유**만 노출
- LINE, 이미지 다운로드는 제외
- ShareDrawer에 `showLine={false}`, `showDownloadImage={false}` 전달

### 3.2 레퍼럴 추적

#### 공유 URL 구조

기존 공유 URL에 `ref` 쿼리 파라미터를 추가하여 공유자를 식별한다.

```
기존: /fortune/lifetime/share/{profileId}
변경: /fortune/lifetime/share/{profileId}?ref={referrerUserId}
```

- `ref` 값은 공유자의 `user.id` (Supabase auth user ID)
- 모든 운세 타입(lifetime, yearly, past-life, compatibility)에 동일 적용

#### 레퍼럴 정보 저장

공유 링크를 통해 진입한 사용자 B가 가입할 때까지 `ref` 정보를 유지해야 한다.

- **저장 위치**: `localStorage` (키: `referrer_user_id`)
- **저장 시점**: 공유 결과 페이지(`/fortune/*/share/*`) 진입 시 URL에서 `ref` 파라미터 추출하여 저장
- **만료 정책**: 없음 (만료 없이 유지)
- **덮어쓰기**: 새로운 공유 링크 클릭 시 기존 값 덮어쓰기 (마지막 클릭 우선)
- **삭제 시점**: 레퍼럴 보상 API 호출 성공 후 삭제

```typescript
// localStorage 저장 형태
interface ReferralData {
  referrerUserId: string;
}
```

### 3.3 회원가입 완료 시 레퍼럴 보상 처리

#### 트리거 조건

OAuth 콜백(`/auth/callback`) 후 클라이언트에서 신규 가입을 감지했을 때:

1. 신규 가입 여부 확인 (auth callback에서 `?new=1` 쿼리 파라미터 추가)
2. `localStorage`에 `referrer_user_id` 존재 여부 확인
3. 둘 다 충족 시 `POST /api/referral/reward` 호출

#### 신규 가입 감지 방법

현재 auth callback(`app/auth/callback/route.ts`)에서 이미 `isNewUser`를 판단하고 있다.
신규 사용자인 경우 리다이렉트 URL에 `?new=1` 파라미터를 추가한다.

```typescript
// auth/callback/route.ts 변경
if (isNewUser) {
  // 기존: sendSignupNotification(...)
  // 추가: 리다이렉트 URL에 new=1 파라미터 추가
  const redirectUrl = new URL(`${origin}${nextPath}`);
  redirectUrl.searchParams.set("new", "1");
  return NextResponse.redirect(redirectUrl.toString());
}
```

#### 클라이언트 처리 (리다이렉트 대상 페이지)

```
1. URL에 ?new=1 파라미터 존재 확인
2. localStorage에서 referrer_user_id 읽기
3. 둘 다 존재 → POST /api/referral/reward { referrerUserId }
4. 성공 시 localStorage에서 referrer_user_id 삭제
5. URL에서 ?new=1 파라미터 제거 (history.replaceState)
```

#### 자기 자신 레퍼럴 방지

- 서버 측에서 `referrerUserId === 가입자 userId`인 경우 보상 미지급

#### 보상 프로세스

1. **프로모션 코드 생성**
   - 코드 타입: `single_use` (1회 사용 후 자동 비활성화)
   - 혜택 타입: `free_fortune`
   - 적용 운세: `all` (모든 운세 타입에 사용 가능)
   - 유효 기간: 생성일로부터 **30일**
   - 코드 형식: `REF-{랜덤 8자리 영숫자}` (예: `REF-A1B2C3D4`)
   - `campaign_name`: `referral_promotion`
   - `max_uses`: 1
   - `max_uses_per_user`: 1
   - `created_by`: 가입자의 userId (누구의 가입으로 발생한 보상인지 추적)

2. **레퍼럴 이력 저장** (`referrals` 테이블에 INSERT)

3. **알림 발송** (3.4절 참조)

### 3.4 알림 발송

가입 완료 후 공유자(사용자 A)에게 프로모션 코드를 알림으로 전달한다.

#### 발송 채널 결정

| 공유자 가입 Provider | 발송 채널 | 방법 |
|---------------------|----------|------|
| `kakao`             | 카카오톡 알림톡 | 카카오 비즈니스 알림톡 API |
| `google`            | 이메일   | Resend API |

#### 알림 내용

- **제목**: "[인생스포] 친구가 가입했어요! 무료 운세 코드가 도착했습니다"
- **본문**:
  - 축하 메시지
  - 프로모션 코드 (복사 가능하게)
  - 유효 기간 안내 (30일)
  - 사용 방법 안내 (결제 화면에서 프로모션 코드 입력)
  - 서비스 링크

## 4. 데이터 모델

### 4.1 신규 테이블: `referrals`

레퍼럴 관계와 보상 상태를 추적하는 테이블.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | `uuid` | PK, 자동 생성 |
| `referrer_user_id` | `uuid` | 공유자 (보상 수령자), FK → `users.id` |
| `referred_user_id` | `uuid` | 피공유자 (가입자), FK → `users.id` |
| `promo_code_id` | `uuid` | 지급된 프로모 코드, FK → `promo_codes.id` |
| `notification_channel` | `text` | 알림 발송 채널 (`kakao` / `email`) |
| `notification_sent_at` | `timestamptz` | 알림 발송 시각 |
| `notification_status` | `text` | 알림 상태 (`pending` / `sent` / `failed`) |
| `created_at` | `timestamptz` | 생성 시각 |

**유니크 제약**: `(referrer_user_id, referred_user_id)` — 동일 쌍에 대해 중복 보상 방지

### 4.2 기존 테이블 변경

- **변경 없음**: 프로모션 코드는 기존 `promo_codes` 테이블에 생성, 기존 프로모 시스템 그대로 활용

## 5. API 설계

### 5.1 레퍼럴 보상 API (신규)

`POST /api/referral/reward`

클라이언트에서 신규 가입 + 레퍼럴 조건 충족 시 호출.

**Request:**

```typescript
{
  referrerUserId: string; // 공유자 user ID
}
```

**Response (200):**

```typescript
{
  success: true;
  referralId: string;
}
```

**서버 로직:**

1. 인증 확인 (요청자 = 가입자)
2. `referrerUserId !== 요청자 userId` 검증 (자기 레퍼럴 방지)
3. `referrerUserId`가 실존하는 유저인지 확인
4. 동일 쌍 중복 보상 확인 (이미 referrals 레코드 존재하면 무시)
5. 프로모 코드 생성 (`promo_codes` INSERT)
6. `referrals` 레코드 INSERT
7. 알림 발송 (비동기, fire-and-forget)

**에러 응답:**

| 상태 코드 | 코드 | 설명 |
|----------|------|------|
| 401 | `UNAUTHORIZED` | 미인증 |
| 400 | `SELF_REFERRAL` | 자기 자신 레퍼럴 |
| 400 | `INVALID_REFERRER` | 존재하지 않는 공유자 |
| 409 | `ALREADY_REWARDED` | 이미 보상 지급됨 |

### 5.2 알림 발송 (내부 함수)

별도 API가 아닌 `libs/services/referral/` 내부 함수로 구현.

- 공유자의 provider에 따라 카카오 알림톡 또는 Resend 이메일 발송
- 실패 시 `referrals.notification_status`를 `failed`로 업데이트
- 재시도 정책: 최대 3회

## 6. 프론트엔드 변경사항

### 6.1 공유 결과 페이지 (`/fortune/*/share/[profileId]`)

- URL의 `ref` 쿼리 파라미터를 읽어 `localStorage`에 저장
- 클라이언트 컴포넌트로 처리 (`useSearchParams`)

### 6.2 결과 페이지 공유하기 버튼

- 공유하기 버튼 위에 EVENT 뱃지 컴포넌트 추가
- ShareDrawer에 이벤트 배너 영역 추가
- 공유 URL 생성 시 `?ref={currentUserId}` 파라미터 추가
- `showLine={false}`, `showDownloadImage={false}` 설정

### 6.3 리다이렉트 대상 페이지 (`/home`)

- 페이지 진입 시 `?new=1` + localStorage `referrer_user_id` 조합 감지
- 조건 충족 시 `POST /api/referral/reward` 호출
- 성공 후 localStorage 정리 + URL 파라미터 정리

### 6.4 ShareDrawer 컴포넌트

**Props 추가:**

```typescript
interface ShareDrawerProps {
  // ... 기존 props
  /** 이벤트 배너 메시지 */
  eventBannerMessage?: string;
  /** 이벤트 배너 표시 여부 */
  showEventBanner?: boolean;
}
```

### 6.5 EVENT 뱃지 컴포넌트 (신규)

- 공유하기 버튼 상단에 위치하는 작은 pill 형태의 뱃지
- 애니메이션 없음
- 기존 디자인 시스템 색상 활용, 글자가 잘 보이는 수준

## 7. 파일 구조 (신규/변경)

```
libs/
  services/
    referral/              ← 신규 모듈
      core.ts              # 레퍼럴 보상 로직 (프로모 코드 생성, referrals INSERT)
      notify.ts            # 알림 발송 (카카오 알림톡, Resend 이메일)
      types.ts             # 타입 정의
      index.ts             # 모듈 export
  hooks/
    useReferral.ts         ← 신규: localStorage 읽기/쓰기, 보상 API 호출

app/
  api/
    referral/
      reward/
        route.ts           ← 신규: POST /api/referral/reward
  auth/
    callback/
      route.ts             ← 변경: isNewUser 시 ?new=1 추가
  home/
    page.tsx               ← 변경: 레퍼럴 보상 트리거 로직 추가

components/
  fortune/
    ShareDrawer.tsx        ← 변경: eventBanner props 추가
    EventBadge.tsx         ← 신규: EVENT 뱃지 컴포넌트
    EventBadge.module.css  ← 신규
```

## 8. 분석 이벤트

| 이벤트명 | 시점 | 파라미터 |
|---------|------|---------|
| `referral_share_link_copy` | 레퍼럴 링크 복사 | `fortuneType` |
| `referral_share_kakao` | 레퍼럴 카카오 공유 | `fortuneType` |
| `referral_link_landed` | 레퍼럴 링크로 공유 페이지 진입 | `referrerUserId` |
| `referral_signup_complete` | 레퍼럴 링크 통해 가입 완료 | `referrerUserId` |
| `referral_promo_created` | 프로모 코드 생성 | `referrerUserId`, `promoCode` |
| `referral_notification_sent` | 알림 발송 완료 | `channel`, `referrerUserId` |

## 9. 엣지 케이스 및 정책

| 케이스 | 처리 방침 |
|--------|----------|
| 자기 자신의 레퍼럴 링크로 가입 | 보상 미지급 (400 `SELF_REFERRAL`) |
| 동일 사용자가 여러 명의 레퍼럴 링크 클릭 후 가입 | 마지막 클릭한 레퍼럴 링크의 공유자에게 보상 (Last Click) |
| 공유자 계정이 삭제/비활성화된 경우 | 보상 미지급 (400 `INVALID_REFERRER`) |
| 이미 가입된 사용자가 레퍼럴 링크로 진입 | 보상 미지급 (`?new=1`이 없으므로 트리거 안 됨) |
| 같은 공유자-가입자 쌍으로 중복 요청 | 409 `ALREADY_REWARDED` (유니크 제약) |
| 알림 발송 실패 | 최대 3회 재시도, 실패 시 `notification_status=failed` 기록 |
| 레퍼럴 보상 횟수 제한 | **없음** (공유자는 무제한으로 보상 가능) |
| API 중복 호출 (네트워크 재시도 등) | 유니크 제약으로 멱등성 보장 |

## 10. 구현 우선순위

### Phase 1 — MVP (핵심 플로우)

1. `referrals` 테이블 생성 (Supabase migration)
2. `libs/services/referral/` 모듈 구현 (코드 생성, 이력 저장)
3. `POST /api/referral/reward` API 구현
4. `app/auth/callback/route.ts` 변경 (`?new=1` 파라미터)
5. 공유 URL에 `ref` 파라미터 추가 (프론트엔드)
6. 공유 결과 페이지에서 `ref` → localStorage 저장
7. `/home` 페이지에서 레퍼럴 보상 트리거 로직
8. EVENT 뱃지 + ShareDrawer 이벤트 배너 UI

### Phase 2 — 알림

9. 카카오 알림톡 연동
10. Resend 이메일 발송 연동
11. 알림 발송 상태 관리

### Phase 3 — 모니터링

12. 분석 이벤트 추가
13. Discord 알림 (레퍼럴 보상 발생 시 운영팀 알림)

## 11. 확정 사항

- [x] 이벤트 배너 문구: "친구가 가입하면 무료 운세 1회를 드려요!"
- [x] EVENT 뱃지 디자인: 기존 디자인 시스템 색상 사용, 글자가 잘 보이는 수준의 pill 형태, 애니메이션 없음
- [ ] 카카오 알림톡 템플릿 승인 — 추후 진행
