# Backend 기능 명세서

## 1. 개요

- **서비스명:** 인생스포
- **Backend:** Next.js 15 API Routes (App Router)
- **Database:** Supabase (PostgreSQL)
- **인증:** Supabase Auth (카카오, Google OAuth)
- **결제:** 토스페이먼츠

> 자미두수 분석 알고리즘은 별도 문서에서 정의합니다.

---

## 2. 기술 스택

| 영역       | 기술                                    |
| ---------- | --------------------------------------- |
| Runtime    | Next.js 15 API Routes                   |
| Database   | Supabase (PostgreSQL)                   |
| Auth       | Supabase Auth                           |
| ORM        | Supabase Client (@supabase/supabase-js) |
| Payment    | 토스페이먼츠 SDK                        |
| Validation | Zod                                     |

---

## 3. 비즈니스 규칙

| 규칙           | 설명                                            |
| -------------- | ----------------------------------------------- |
| 분석 횟수      | 한 사용자가 여러 번 분석 가능 (다른 생년월일시) |
| 결과 열람 기간 | 결제 완료 시 영구 열람 가능                     |
| 환불 정책      | 디지털 콘텐츠 특성상 환불 불가                  |
| 공유 링크 접근 | 미리보기만 표시, 전체 결과는 본인 결제 필요     |

---

## 4. Database 스키마

### 4.1. ERD 개요

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│   users     │──1:N──│  profiles   │──1:N──│    fortunes     │
└─────────────┘       └─────────────┘       └─────────────────┘
       │
       └──1:N──┌─────────────┐       ┌─────────────────┐
               │  analyses   │──1:1──│ analysis_results│
               └─────────────┘       └─────────────────┘
                      │
                      ├──1:1──┌─────────────┐
                      │       │  payments   │
                      │       └─────────────┘
                      │
                      └──1:N──┌─────────────┐
                              │   shares    │
                              └─────────────┘
```

### 4.2. 테이블 상세

#### 4.2.1. users (사용자)

> Supabase Auth의 `auth.users`와 연동되는 public 스키마 테이블
>
> **계정 연결 정책:** 동일 이메일로 다른 소셜 제공자(카카오/구글)를 통해 가입할 경우, Supabase Auth의 자동 계정 연결 기능을 활용합니다. `auth.users`에서 검증된 이메일이 동일하면 기존 계정과 연결되어 `public.users`에 중복 레코드가 생성되지 않습니다.

```sql
CREATE TABLE public.users (
  -- Primary Key (Supabase Auth user id와 동일)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 기본 정보
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,

  -- OAuth 정보
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('kakao', 'google')),
  provider_id VARCHAR(255) NOT NULL,

  -- 프로필 설정 상태
  profile_completed BOOLEAN DEFAULT FALSE,

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- 제약조건
  UNIQUE(provider, provider_id)
);

-- 인덱스
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_provider ON public.users(provider, provider_id);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### 4.2.2. profiles (프로필)

> 사용자별 프로필 정보. 한 계정에 여러 프로필 등록 가능 (본인, 가족, 지인 등)

```sql
CREATE TABLE public.profiles (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- 기본 정보
  name VARCHAR(50) NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_time_unknown BOOLEAN NOT NULL DEFAULT FALSE,
  calendar_type VARCHAR(10) NOT NULL CHECK (calendar_type IN ('solar', 'lunar')),
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),

  -- 추가 정보
  relationship_status VARCHAR(20),
  relationship_status_custom VARCHAR(50),
  occupation_status VARCHAR(20),
  occupation_status_custom VARCHAR(50),
  relationship_to_user VARCHAR(20),  -- 본인, 가족, 지인 등 (추후 확장용)

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### 4.2.3. fortunes (운세 결과)

> 프로필별 운세 결과 저장. 인생운세(lifetime) + 올해운세(yearly)

```sql
CREATE TABLE public.fortunes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- 운세 정보
  fortune_type VARCHAR(20) NOT NULL CHECK (fortune_type IN ('lifetime', 'yearly')),
  year INTEGER NOT NULL DEFAULT 0,  -- 0: 인생운세, 2024/2025...: 해당 연도 운세
  result JSONB NOT NULL,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지 (프로필당 인생운세 1개, 연도별 운세 1개씩)
  UNIQUE (profile_id, fortune_type, year)
);

-- 인덱스
CREATE INDEX idx_fortunes_profile_id ON public.fortunes(profile_id);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER set_fortunes_updated_at
  BEFORE UPDATE ON public.fortunes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### 4.2.4. analyses (분석 요청)

> 사용자가 입력한 생년월일시 정보와 분석 상태 관리

```sql
CREATE TABLE public.analyses (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- 입력 정보 (자미두수 분석에 필요한 데이터)
  name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  calendar_type VARCHAR(10) NOT NULL CHECK (calendar_type IN ('solar', 'lunar')),

  -- 분석 상태
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'analyzed', 'paid', 'expired')),

  -- 미리보기 데이터 (무료 공개 부분)
  preview_summary TEXT,           -- 명궁 분석 한 줄 요약
  preview_description TEXT,       -- 명궁 분석 상세

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,        -- 분석 완료 시각
  paid_at TIMESTAMPTZ,            -- 결제 완료 시각

  -- 중복 분석 방지 (같은 사용자가 동일 정보로 중복 분석 시)
  UNIQUE(user_id, birth_date, birth_time, gender, calendar_type)
);

-- 인덱스
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER set_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### 4.2.5. analysis_results (분석 결과)

> 결제 완료 후 열람 가능한 상세 분석 결과

```sql
CREATE TABLE public.analysis_results (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key (1:1 관계)
  analysis_id UUID NOT NULL UNIQUE REFERENCES public.analyses(id) ON DELETE CASCADE,

  -- 총평
  summary TEXT NOT NULL,                    -- "초년엔 고생하나 말년엔 건물주 될 팔자"

  -- 상세 분석 결과 (JSONB로 유연하게 저장)
  wealth JSONB NOT NULL,                    -- 재물운
  career JSONB NOT NULL,                    -- 직업운
  relationship JSONB NOT NULL,              -- 연애/결혼운
  health JSONB NOT NULL,                    -- 건강/기타

  -- 자미두수 원본 데이터 (디버깅/추후 활용)
  raw_chart JSONB,                          -- 명반 원본 데이터

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_analysis_results_analysis_id ON public.analysis_results(analysis_id);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER set_analysis_results_updated_at
  BEFORE UPDATE ON public.analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

**JSONB 필드 구조 예시:**

```typescript
interface FortuneSection {
  title: string;       // "재물운"
  content: string;     // 상세 내용 (마크다운 또는 플레인 텍스트)
  highlights: string[]; // 핵심 포인트 (선택)
}

// 예시
{
  "title": "재물운",
  "content": "당신은 타고난 재물 복이 있습니다...",
  "highlights": ["40대 이후 재물운 상승", "부동산 투자 적성"]
}
```

#### 4.2.6. payments (결제)

> 토스페이먼츠 결제 정보

```sql
CREATE TABLE public.payments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  analysis_id UUID NOT NULL UNIQUE REFERENCES public.analyses(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,

  -- 토스페이먼츠 결제 정보
  order_id VARCHAR(100) NOT NULL UNIQUE,    -- 주문번호 (우리가 생성)
  payment_key VARCHAR(200) UNIQUE,          -- 토스 결제키 (결제 완료 후)

  -- 결제 금액
  amount INTEGER NOT NULL,                  -- 결제 금액 (원)

  -- 결제 상태
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),

  -- 결제 수단 정보 (결제 완료 후)
  method VARCHAR(50),                       -- 카드, 간편결제 등
  method_detail JSONB,                      -- 상세 정보 (카드사, 승인번호 등)

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,                      -- 결제 완료 시각
  failed_at TIMESTAMPTZ,                    -- 결제 실패 시각
  failure_reason TEXT,                      -- 실패 사유

  -- 토스 원본 응답 (디버깅용)
  raw_response JSONB
);

-- 인덱스
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_analysis_id ON public.payments(analysis_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_payment_key ON public.payments(payment_key);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### 4.2.7. shares (공유)

> 결과 공유 링크 관리

```sql
CREATE TABLE public.shares (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,

  -- 공유 정보
  share_code VARCHAR(20) NOT NULL UNIQUE,   -- 짧은 공유 코드 (예: "abc123xy")

  -- 통계
  view_count INTEGER NOT NULL DEFAULT 0,    -- 조회수

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ                    -- 만료 시간 (NULL이면 무제한)
);

-- 인덱스
CREATE INDEX idx_shares_analysis_id ON public.shares(analysis_id);
CREATE INDEX idx_shares_share_code ON public.shares(share_code);
CREATE INDEX idx_shares_expires_at ON public.shares(expires_at);
```

### 4.3. 공통 함수 및 트리거

```sql
-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 새 사용자 생성 시 public.users에 자동 삽입 (Auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, provider, provider_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth 트리거 설정
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 4.4. Row Level Security (RLS)

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fortunes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- users: 본인만 조회/수정 가능
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- profiles: 본인 프로필만 CRUD 가능
CREATE POLICY "Users can view own profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- fortunes: 본인 프로필에 연결된 운세만 CRUD 가능
CREATE POLICY "Users can view own fortunes"
  ON public.fortunes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own fortunes"
  ON public.fortunes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own fortunes"
  ON public.fortunes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own fortunes"
  ON public.fortunes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );

-- analyses: 본인 분석만 조회/생성 가능
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- analysis_results: 결제 완료된 본인 결과만 조회 가능
CREATE POLICY "Users can view paid results"
  ON public.analysis_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses a
      WHERE a.id = analysis_id
        AND a.user_id = auth.uid()
        AND a.status = 'paid'
    )
  );

-- payments: 본인 결제만 조회 가능
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- shares: 공유 코드로 누구나 조회 가능 (공개)
CREATE POLICY "Anyone can view shares by code"
  ON public.shares FOR SELECT
  USING (true);

CREATE POLICY "Users can create shares for own analyses"
  ON public.shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses a
      WHERE a.id = analysis_id
        AND a.user_id = auth.uid()
        AND a.status = 'paid'
    )
  );
```

### 4.5. 서비스 역할 정책 (Service Role)

> API Routes에서 서비스 역할로 접근 시 사용

```sql
-- 서비스 역할은 RLS 우회
-- Supabase 서비스 키 사용 시 자동 적용

-- 분석 결과 삽입 (서비스 역할만)
CREATE POLICY "Service can insert analysis_results"
  ON public.analysis_results FOR INSERT
  WITH CHECK (true);

-- 분석 상태 업데이트 (서비스 역할만)
CREATE POLICY "Service can update analyses"
  ON public.analyses FOR UPDATE
  USING (true);

-- 결제 생성/업데이트 (서비스 역할만)
CREATE POLICY "Service can manage payments"
  ON public.payments FOR ALL
  USING (true);
```

---

## 5. API 엔드포인트

### 5.1. 인증 API

| Method | Endpoint                 | 설명                | 인증 필요 |
| ------ | ------------------------ | ------------------- | --------- |
| GET    | `/api/auth/session`      | 현재 세션 정보 조회 | X         |
| GET    | `/api/auth/login/kakao`  | 카카오 로그인 시작  | X         |
| GET    | `/api/auth/login/google` | Google 로그인 시작  | X         |
| GET    | `/api/auth/callback`     | OAuth 콜백 처리     | X         |
| POST   | `/api/auth/logout`       | 로그아웃            | O         |

### 5.2. 프로필 API

| Method | Endpoint          | 설명                 | 인증 필요 |
| ------ | ----------------- | -------------------- | --------- |
| POST   | `/api/profile`    | 새 프로필 생성       | O         |
| GET    | `/api/profiles`   | 내 프로필 목록 조회  | O         |
| GET    | `/api/profile/:id`| 프로필 상세 조회     | O         |
| PUT    | `/api/profile/:id`| 프로필 수정          | O         |
| DELETE | `/api/profile/:id`| 프로필 삭제          | O         |

### 5.3. 분석 API

| Method | Endpoint                    | 설명                     | 인증 필요 |
| ------ | --------------------------- | ------------------------ | --------- |
| POST   | `/api/analysis`             | 새 분석 요청             | O         |
| GET    | `/api/analysis/:id`         | 분석 상세 조회           | O         |
| GET    | `/api/analysis/:id/preview` | 미리보기 조회            | O         |
| GET    | `/api/analysis/:id/result`  | 전체 결과 조회 (결제 후) | O         |
| GET    | `/api/analyses`             | 내 분석 목록             | O         |

### 5.4. 결제 API

| Method | Endpoint                | 설명           | 인증 필요 |
| ------ | ----------------------- | -------------- | --------- |
| POST   | `/api/payment/request`  | 결제 요청 생성 | O         |
| POST   | `/api/payment/confirm`  | 결제 승인 처리 | O         |
| GET    | `/api/payment/:orderId` | 결제 상태 조회 | O         |

### 5.5. 공유 API

| Method | Endpoint           | 설명             | 인증 필요 |
| ------ | ------------------ | ---------------- | --------- |
| POST   | `/api/share`       | 공유 링크 생성   | O         |
| GET    | `/api/share/:code` | 공유 콘텐츠 조회 | X         |

---

## 6. API 상세 명세

### 6.1. 인증 API

#### GET /api/auth/session

현재 로그인 상태 확인

**Response:**

```typescript
// 로그인 상태
{
  "isAuthenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "avatarUrl": "https://...",
    "provider": "kakao"
  }
}

// 비로그인 상태
{
  "isAuthenticated": false,
  "user": null
}
```

#### GET /api/auth/login/:provider

소셜 로그인 시작 (리다이렉트)

**Query Parameters:**

- `redirect`: 로그인 후 이동할 경로 (optional, default: "/form")

**Response:** OAuth 제공자 페이지로 리다이렉트

#### POST /api/auth/logout

로그아웃 처리

**Response:**

```typescript
{
  "success": true
}
```

### 6.2. 분석 API

#### POST /api/analysis

새 분석 요청 생성 및 분석 실행

**Request:**

```typescript
{
  "name": "홍길동",
  "birthDate": "1990-05-15",
  "birthTime": "미",  // 미시 (13:00~14:59)
  "gender": "male",
  "calendarType": "solar"
}
```

**Response:**

```typescript
{
  "analysisId": "uuid",
  "status": "analyzed",
  "preview": {
    "summary": "겉은 순한 양, 속은 야망 있는 호랑이!",
    "description": "남 밑에서 일 못하는 사장님 팔자시네요."
  },
  "lockedQuestions": [
    {
      "question": "평생 만질 돈의 그릇은?",
      "teaser": "당신의 재물 창고에는 💰 [잠겨있음] 정도가..."
    },
    {
      "question": "인생 최대의 전성기는?",
      "teaser": "지금 힘들다면 버티세요. [잠겨있음]세 부터..."
    }
  ]
}
```

**Error Responses:**

- `400`: 유효성 검사 실패
- `401`: 미인증
- `409`: 동일한 분석이 이미 존재

#### GET /api/analysis/:id/result

결제 완료된 전체 결과 조회

**Response:**

```typescript
{
  "analysisId": "uuid",
  "name": "홍길동",
  "birthInfo": {
    "date": "1990-05-15",
    "time": "14:30",
    "gender": "male",
    "calendarType": "solar"
  },
  "result": {
    "summary": "초년엔 고생하나 말년엔 건물주 될 팔자",
    "wealth": {
      "title": "재물운",
      "content": "당신은 타고난 재물 복이 있습니다..."
    },
    "career": {
      "title": "직업운",
      "content": "..."
    },
    "relationship": {
      "title": "연애/결혼운",
      "content": "..."
    },
    "health": {
      "title": "건강/기타",
      "content": "..."
    }
  },
  "paidAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

- `401`: 미인증
- `403`: 결제 미완료
- `404`: 분석 없음

### 6.3. 결제 API

#### POST /api/payment/request

결제 요청 생성

**Request:**

```typescript
{
  "analysisId": "uuid"
}
```

**Response:**

```typescript
{
  "orderId": "ORDER_20240115_abc123",
  "amount": 990,
  "orderName": "[인생스포] 인생 스포일러 열람권",
  "customerName": "홍길동"
}
```

#### POST /api/payment/confirm

토스페이먼츠 결제 승인 처리

**Request:**

```typescript
{
  "orderId": "ORDER_20240115_abc123",
  "paymentKey": "toss_payment_key",
  "amount": 990
}
```

**Response:**

```typescript
{
  "success": true,
  "analysisId": "uuid",
  "redirectUrl": "/result?id=uuid"
}
```

**Error Responses:**

- `400`: 금액 불일치
- `402`: 결제 실패
- `409`: 이미 처리된 결제

### 6.4. 공유 API

#### POST /api/share

공유 링크 생성

**Request:**

```typescript
{
  "analysisId": "uuid"
}
```

**Response:**

```typescript
{
  "shareCode": "abc123xy",
  "shareUrl": "https://life-spoiler.com/s/abc123xy"
}
```

#### GET /api/share/:code

공유된 미리보기 조회

**Response:**

```typescript
{
  "preview": {
    "summary": "겉은 순한 양, 속은 야망 있는 호랑이!",
    "description": "남 밑에서 일 못하는 사장님 팔자시네요."
  },
  "meta": {
    "title": "내 인생 등급은 S급?",
    "description": "990원 자미두수로 확인하기"
  }
}
```

---

## 7. 인증 흐름

### 7.1. Supabase Auth 설정

```typescript
// libs/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// libs/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
};
```

### 7.2. OAuth 로그인 흐름

```
1. 사용자가 [카카오로 시작하기] 클릭
2. GET /api/auth/login/kakao?redirect=/form
3. Supabase Auth가 카카오 OAuth 페이지로 리다이렉트
4. 사용자 카카오 로그인/동의
5. 카카오가 콜백 URL로 리다이렉트 (GET /api/auth/callback)
6. Supabase Auth가 세션 생성
7. auth.users에 새 사용자 생성 → 트리거로 public.users에 복사
8. redirect 경로(/form)로 이동
```

### 7.3. 미들웨어 인증 체크

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/form", "/loading", "/preview", "/result"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected route 체크
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // 세션 확인
  const supabase = createServerClient(/* ... */);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
```

---

## 8. 결제 흐름

### 8.1. 토스페이먼츠 연동

```typescript
// libs/payment/toss.ts
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;
const TOSS_API_URL = "https://api.tosspayments.com/v1/payments";

export const confirmPayment = async (
  paymentKey: string,
  orderId: string,
  amount: number
) => {
  const response = await fetch(`${TOSS_API_URL}/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new PaymentError(error.message, error.code);
  }

  return response.json();
};
```

### 8.2. 결제 프로세스

```
1. [미리보기] 결제 버튼 클릭
2. POST /api/payment/request → orderId 발급
3. 토스페이먼츠 SDK로 결제창 호출
4. 사용자 결제 진행
5. 결제 성공 시 successUrl로 리다이렉트 (paymentKey 포함)
6. POST /api/payment/confirm → 토스 API로 결제 승인
7. DB 업데이트 (payments, analyses.status = 'paid')
8. /result 페이지로 이동
```

### 8.3. orderId 생성 규칙

```typescript
import { randomBytes } from "crypto";

// 형식: {PREFIX}_{YYYYMMDD}_{RANDOM}
// 예: LS_20240115_a1b2c3d4

const generateOrderId = (): string => {
  const prefix = "LS"; // Life Spoiler
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = randomBytes(4).toString("hex"); // 8-character hex string
  return `${prefix}_${date}_${random}`;
};
```

---

## 9. 보안 고려사항

### 9.1. API 보안

| 영역          | 보안 조치                                          |
| ------------- | -------------------------------------------------- |
| 인증          | Supabase Auth + JWT 검증                           |
| 권한          | RLS로 데이터 접근 제어                             |
| 결제          | 서버 사이드 금액 검증, 토스 Secret Key 서버만 보관 |
| 입력 검증     | Zod 스키마로 모든 입력 검증                        |
| Rate Limiting | Vercel/Supabase 기본 제한 + 필요 시 추가           |

### 9.2. 환경 변수

```bash
# .env.local (절대 커밋 금지)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # 서버 전용

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxx...
TOSS_SECRET_KEY=test_sk_xxx...  # 서버 전용

# 앱
NEXT_PUBLIC_APP_URL=https://life-spoiler.com
```

### 9.3. 데이터 보호

- 민감 정보(생년월일 등)는 암호화 저장 고려
- 결제 정보는 토스페이먼츠에서 관리 (PCI DSS 준수)
- 로그에 민감 정보 출력 금지

---

## 10. 에러 코드

| 코드                 | HTTP | 설명                    |
| -------------------- | ---- | ----------------------- |
| `AUTH_REQUIRED`      | 401  | 로그인 필요             |
| `AUTH_INVALID`       | 401  | 유효하지 않은 세션      |
| `FORBIDDEN`          | 403  | 접근 권한 없음          |
| `NOT_FOUND`          | 404  | 리소스 없음             |
| `VALIDATION_ERROR`   | 400  | 입력값 유효성 검사 실패 |
| `DUPLICATE_ANALYSIS` | 409  | 동일 분석 이미 존재     |
| `PAYMENT_REQUIRED`   | 402  | 결제 필요               |
| `PAYMENT_FAILED`     | 402  | 결제 실패               |
| `PAYMENT_MISMATCH`   | 400  | 결제 금액 불일치        |
| `INTERNAL_ERROR`     | 500  | 서버 내부 오류          |

---

## 11. 추후 고려사항

- [ ] 분석 결과 캐싱 (동일 생년월일시 재계산 방지)
- [ ] 결제 웹훅 처리 (토스 → 서버 알림)
- [ ] 분석 통계 집계 테이블
- [ ] 이벤트/프로모션 코드 시스템
- [ ] 알림 시스템 (이메일/푸시)
