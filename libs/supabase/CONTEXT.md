# Supabase 클라이언트 모듈

Supabase 데이터베이스 연동 및 AI 해석 결과 캐싱 서비스입니다.

## 아키텍처

```
libs/supabase/
├── index.ts           # Public exports
├── client.ts          # Supabase 클라이언트 생성
├── types.ts           # Database 타입 정의
└── analysis-cache.ts  # 분석 결과 캐싱 서비스
```

## 주요 파일

### client.ts

- `createBrowserClient()`: 클라이언트 사이드용 (anon key)
- `createServerClient()`: 서버 사이드용 (service role key, RLS 우회)

### analysis-cache.ts

- `generateChartHash()`: 명반 데이터로부터 고유 해시 생성
- `getCachedResult()`: 캐시된 분석 결과 조회
- `setCachedResult()`: 분석 결과 캐시에 저장
- `getOrCreateCachedResult()`: 캐시 miss 시 생성 함수 실행 및 저장

## 데이터베이스 스키마

### interpretation_cache 테이블

AI 해석 결과를 캐싱하기 위한 테이블입니다. 서비스 역할 키로만 접근 가능합니다.

```sql
CREATE TABLE interpretation_cache (
  id UUID PRIMARY KEY,
  chart_hash TEXT NOT NULL,           -- 명반 고유 해시
  interpretation_type TEXT NOT NULL,  -- 해석 유형
  result JSONB NOT NULL,              -- AI 해석 결과
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(chart_hash, interpretation_type)
);
```

마이그레이션: `supabase/migrations/001_create_interpretation_cache.sql`

### universes / universe_guests 테이블 (친구 우주 궁합)

익명 링크 기반 무료 기능입니다. **로그인이 없으며 `auth.users`를 참조하지 않습니다.** 기존 유료 궁합(`profiles` / `compatibility_pairs`)과는 완전히 별개입니다.

```sql
CREATE TABLE universes (
  id UUID PRIMARY KEY,
  public_id TEXT UNIQUE,        -- URL 공개 식별자 (nanoid 12자, 열거 불가)
  owner_name TEXT,              -- 선택
  birth_date DATE, birth_time TIME, birth_time_unknown BOOLEAN,
  calendar_type TEXT, is_leap_month BOOLEAN, gender TEXT,
  guest_count INTEGER,          -- 트리거로 자동 유지
  owner_token_hash TEXT, creator_ip_hash TEXT,
  created_at TIMESTAMPTZ, last_viewed_at TIMESTAMPTZ
);

CREATE TABLE universe_guests (
  id UUID PRIMARY KEY,
  universe_id UUID REFERENCES universes(id) ON DELETE CASCADE,
  star_seed TEXT UNIQUE,        -- 프론트 별 배치용 안정 시드
  guest_name TEXT,              -- 1~20자
  birth_date DATE, birth_time TIME, birth_time_unknown BOOLEAN,
  calendar_type TEXT, is_leap_month BOOLEAN,
  score SMALLINT, tier TEXT, one_liner_id TEXT,
  factors JSONB, matrix_version TEXT,
  confidence TEXT,              -- exact | estimated
  chart_combinations SMALLINT,  -- 1 | 12 | 144
  calculated_at TIMESTAMPTZ,
  creator_ip_hash TEXT, created_at TIMESTAMPTZ
);
```

**시간 미상 처리**: `birth_time`은 사용자 원본 입력(HH:mm)만 저장하고, 엔진이 받는 시진(`TimeBranchValue`)은 API 레이어에서 파생합니다. "시간 모름"은 `birth_time_unknown = true AND birth_time IS NULL`이며, 이 경우 엔진이 시진 12개를 전수 열거해 평균을 냅니다(양쪽 미상이면 144조합). 그 결과가 `confidence` / `chart_combinations` 스냅샷입니다.

**한줄평 조회**: `oneLinerKo`는 **EN/JA 로케일에서도 한국어를 반환**합니다. 프론트/API는 반드시 `one_liner_id`로 문구를 조회하고 `oneLinerKo`는 폴백으로만 사용하세요. 그래서 `one_liner_ko`는 DB에 저장하지 않습니다.

**접근 규칙**: 두 테이블 모두 RLS 활성화 + anon/authenticated 정책 없음(전면 거부) + 테이블 권한 REVOKE. 브라우저에서 직접 조회하지 않고 **반드시 Route Handler에서 `createServerClient()`(service role)로만** 접근합니다. `id`는 API 응답에 노출하지 않고 `public_id` / `star_seed`만 내보냅니다.

**스냅샷 백필 정책 (CTO 확정)**: 궁합 결과는 스냅샷이며 **기본적으로 백필하지 않습니다.** 예외는 매트릭스에 명백한 계산 버그가 있어 기존 점수가 이론적으로 틀린 경우뿐이고, 그때만 사용자 승인 후 해당 `matrix_version` 행을 선택 백필합니다. 단순 튜닝(점수 분포 조정, 문구 수정)은 백필 대상이 아닙니다.

**IP 해시**: `creator_ip_hash`는 반드시 **HMAC(서버 시크릿, IP)** 로 생성합니다. 단순 SHA-256은 IPv4 전수 대입으로 사실상 가역이라 금지입니다. (시크릿 추가·보관 기간 정책은 사용자 승인 대기 중 — 미구현)

마이그레이션: `supabase/migrations/005_create_friend_universe.sql`

## 사용 예시

```typescript
import { generateChartHash, getOrCreateCachedResult } from "@/libs/supabase";
import { generateFullInterpretation } from "@/libs/services/ai";

// 해시 생성
const hash = generateChartHash({
  birthDate: "1990-05-15",
  birthTime: "12:00",
  gender: "male",
  calendarType: "solar",
});

// 캐시 조회 또는 생성
const result = await getOrCreateCachedResult(hash, "full", () =>
  generateFullInterpretation(request, { includeDetails: true })
);
```

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 캐싱 전략

1. **키 구조**: `chart_hash` + `interpretation_type`
2. **해시 생성**: 생년월일 + 시간 + 성별 + 역법 + 윤달여부
3. **캐시 유효기간**: 무기한 (동일 입력은 항상 같은 결과)
4. **오류 처리**: 캐시 실패해도 서비스 중단 없음
