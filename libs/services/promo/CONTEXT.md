# 프로모션 코드 서비스

마케팅/이벤트용 프로모션 코드 관리 서비스입니다.

## 아키텍처

```
libs/services/promo/
├── index.ts      # Public exports
├── types.ts      # 타입 정의
├── errors.ts     # 에러 클래스
└── core.ts       # 핵심 비즈니스 로직
```

## 핵심 개념

### 코드 타입

| 타입 | 설명 | 사용 예 |
|------|------|---------|
| `common` | 여러 사용자가 사용 가능 | `NEWYEAR2026` |
| `single_use` | 1번만 사용 가능 | `GIFT-A1B2C3D4` |

### 혜택 타입

| 타입 | 설명 |
|------|------|
| `free_fortune` | 무료 운세 열람 |
| `discount` | 할인 (확장용) |

### 적용 대상

- **계정(유저) 단위가 아닌 프로필(사주) 단위**로 코드 적용
- 동일 프로필+운세타입에는 같은 코드를 중복 적용할 수 없음

## 주요 함수

### validatePromoCode

코드 유효성 검증 (적용 전 확인용)

```typescript
import { validatePromoCode } from "@/libs/services/promo";

const result = await validatePromoCode({
  code: "NEWYEAR2026",
  userId: "user-uuid",
  profileId: "profile-uuid",
  fortuneType: "lifetime",
});
// { isValid: true, promoCode: PromoCodeRow }
```

### applyPromoCode

코드 적용 (검증 + 무료접근권한 생성 + 사용이력 기록)

```typescript
import { applyPromoCode } from "@/libs/services/promo";

const result = await applyPromoCode({
  code: "NEWYEAR2026",
  userId: "user-uuid",
  profileId: "profile-uuid",
  fortuneType: "lifetime",
});
// { success: true, promoCode, usage, freeAccessId }
```

### getPromoCodeInfo

코드 정보 조회 (UI 미리보기용)

```typescript
import { getPromoCodeInfo } from "@/libs/services/promo";

const info = await getPromoCodeInfo("NEWYEAR2026");
// { code, benefitType, fortuneType, discountPercent, campaignName, validUntil }
```

### getUserPromoUsages

유저의 코드 사용 내역 조회

```typescript
import { getUserPromoUsages } from "@/libs/services/promo";

const usages = await getUserPromoUsages("user-uuid");
// [{ id, code, profileId, fortuneType, usedAt, campaignName }]
```

## 에러 코드

| 코드 | 설명 |
|------|------|
| `INVALID_CODE` | 존재하지 않는 코드 |
| `CODE_EXPIRED` | 유효 기간 만료 |
| `CODE_NOT_YET_VALID` | 아직 시작 전인 코드 |
| `CODE_EXHAUSTED` | 전체 사용 횟수 소진 |
| `CODE_INACTIVE` | 비활성화된 코드 |
| `USER_LIMIT_EXCEEDED` | 유저당 사용 한도 초과 |
| `ALREADY_APPLIED` | 해당 프로필에 이미 적용됨 |
| `FORTUNE_TYPE_MISMATCH` | 운세 타입 불일치 |

## 데이터베이스 테이블

### promo_codes

프로모션 코드 정의

```sql
-- 주요 컬럼
code VARCHAR(50)           -- 프로모션 코드
code_type VARCHAR(20)      -- 'common' | 'single_use'
benefit_type VARCHAR(30)   -- 'free_fortune' | 'discount'
fortune_type VARCHAR(20)   -- 'lifetime' | 'yearly' | 'all'
max_uses INTEGER           -- 전체 사용 횟수 제한 (NULL=무제한)
max_uses_per_user INTEGER  -- 유저당 사용 횟수 제한 (기본 1)
valid_from TIMESTAMPTZ     -- 유효 시작일
valid_until TIMESTAMPTZ    -- 유효 종료일 (NULL=무기한)
is_active BOOLEAN          -- 활성화 여부
campaign_name VARCHAR(100) -- 캠페인명
```

### promo_code_usages

코드 사용 이력

```sql
promo_code_id UUID  -- FK to promo_codes
user_id UUID        -- FK to users
profile_id UUID     -- FK to profiles
fortune_type        -- 적용된 운세 타입
free_access_id UUID -- 생성된 무료접근권한 ID
used_at TIMESTAMPTZ -- 사용 시간
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/promo/validate` | 코드 유효성 검증 |
| POST | `/api/promo/apply` | 코드 적용 |
| GET | `/api/promo/history` | 사용 내역 조회 |

## 연동

코드 적용 시 `profile_free_access` 테이블에 레코드 생성:

```sql
INSERT INTO profile_free_access (
  profile_id,
  fortune_type,
  granted_by,  -- 'promo:NEWYEAR2026' 형태
  memo         -- '캠페인: 2026 신년 이벤트'
) ...
```
