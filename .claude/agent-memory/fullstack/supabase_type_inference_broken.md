---
name: supabase-type-inference-broken
description: 수동 types.ts가 실제 스키마보다 테이블 11개 뒤처져 있고 모든 테이블이 never로 추론된다 — 신규 쿼리는 명시적 제네릭/구조 타입으로 우회
metadata:
  type: project
---

## 수동 types.ts가 실제 스키마보다 뒤처져 있다 (2026-08-18 확인)

`libs/supabase/types.ts`에 정의된 테이블은 16개인데, 실제 원격 스키마에는 **최소 27개**가 있다. 수동 타입에 **아예 없는 테이블 11개**:

`admin_users`, `payments`, `wallets`, `wallet_transactions`, `star_packages`, `monthly_subscriptions`, `monthly_subscription_orders`, `monthly_subscription_deliveries`, `monthly_subscription_delivery_events`, `monthly_subscription_refund_logs`, `monthly_fortune_contents`

**How to apply:** 이 파일을 "스키마의 정본"으로 신뢰하지 말 것. 특정 테이블을 다룰 때는 `mcp__supabase__list_tables`(읽기 전용)로 실제 스키마를 먼저 확인한다. 공식 타입으로의 전면 교체는 **별도 "스키마 타입 동기화" 트랙**으로 분리하기로 확정됐다(2026-08-18 CTO). 신규 기능 PR에 섞지 않는다 — `@/libs/supabase` 계열을 import하는 파일이 80개라 리뷰·롤백이 어려워진다.

전면 교체 시 주의점(미리 검증해 둔 것):
- **단순 덮어쓰기 불가.** 현재 53개 이름을 export하므로 `export type FortuneRow = Database["public"]["Tables"]["fortunes"]["Row"]` 식의 **별칭을 유지**해야 한다.
- **도메인 유니온은 남길 것.** 공식 타입은 `calendar_type`/`gender` 등을 전부 `string`으로 내보낸다(DB가 enum이 아니라 CHECK 제약이라서). 별칭으로 대체하면 `"solar" | "lunar"`가 `string`으로 풀려 타입 안전성이 후퇴한다.
- **`Json` 컬럼에 `interface` 배열을 넣으면 실패한다.** 예: `factors: FriendCompatibilityFactor[]` → `Json`. 아래 `never` 붕괴와 **같은 원인**(인덱스 시그니처 부재)이다. `as Json` 캐스팅 대신 `.map(({ a, b }) => ({ a, b }))`로 익명 객체를 만들어 넘긴다(계약이 바뀌면 빌드가 깨져서 알려준다).

## 타입 추론이 never로 붕괴한다

`createServerClient()`의 `.from("아무테이블")` 결과가 **모든 테이블에서 `never`로 추론된다.** 신규 테이블만의 문제가 아니라 `fortunes` 같은 기존 테이블도 동일하다 (2026-08-18 확인. `.from("fortunes").select("id")` → `Property 'id' does not exist on type 'never'`).

**정확한 원인 (2026-08-18 타입 프로브로 특정)**: `libs/supabase/types.ts`의 Row/Insert/Update가 `interface`로 선언되어 있는데, **TypeScript의 `interface`는 암시적 인덱스 시그니처를 갖지 않아 `Record<string, unknown>`을 만족하지 못한다**(`type` 별칭은 만족한다). supabase-js의 `GenericTable`이 `Row: Record<string, unknown>`을 요구하므로 → `GenericSchema` 불만족 → `SupabaseClient`의 `Schema` 제네릭이 `never`로 붕괴 → 모든 테이블이 `never`.

즉 `interface`를 `type` 별칭으로 바꾸기만 해도 해소된다. **공식 생성 타입(`generate_typescript_types`)은 전부 `type` 별칭을 쓰므로 교체하면 자동으로 해결되고, `supabase-write.ts`의 구조 타입 우회도 제거 가능해진다.**

우회 방법:
- **읽기**: `.maybeSingle<RowType>()` / `.returns<RowType[]>()` 로 행 타입을 명시한다. (기존 `libs/supabase/fortune.ts`가 쓰는 방식)
- **쓰기**: 기존 코드는 `as any` 캐스팅으로 우회하지만 `any`는 코드 스타일 규칙상 금지다. `libs/universe/supabase-write.ts`처럼 필요한 메서드만 드러낸 **구조 타입으로 좁혀 캐스팅**하는 편이 낫다.
- **count**: `.select("*", { count: "exact", head: true })`는 행 타입이 필요 없어 그대로 동작한다.

**Why:** 이걸 모르면 신규 쿼리를 쓸 때마다 "내가 추가한 테이블 타입이 잘못됐나" 하고 `Database` 정의를 의심하며 시간을 쓰게 된다. 실제로 그렇게 한 번 헤맸고, 기존 테이블로 프로브를 짜서야 저장소 전역 문제임을 확인했다.

**How to apply:** `libs/supabase` 관련 신규 쿼리를 쓸 때 `never` 에러가 나오면 `Database` 타입을 고치려 들지 말고 위 우회를 쓴다. 근본 해결(`Database` 정의를 supabase-js 규격에 맞춤)은 기존 모든 쿼리의 타입에 영향을 주므로 **독립 트랙으로 CTO 승인을 받고** 진행해야 한다. 관련: [[friend-universe-ownership]]
