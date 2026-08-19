---
name: friend-universe-ownership
description: 친구 우주 궁합(무료 바이럴) 기능의 에이전트별 소유 경계와 확정된 계약 — 계산 엔진은 ziwei-expert, 스키마/API는 fullstack
metadata:
  type: project
---

친구 우주 궁합(`/universe/{publicId}`)은 로그인 없는 익명 무료 바이럴 기능이며, 기존 유료 1:1 궁합(`app/compatibility/**`, `profiles`/`compatibility_pairs`)과 **코드·스키마 모두 완전히 분리**되어 있다.

소유 경계 (2026-08-18 CTO 지시 기준):
- `libs/zi-wei-dou-shu/calculators/friend-compatibility.ts` 및 `libs/zi-wei-dou-shu/constants/friend-compatibility-table.ts` → **ziwei-expert 소유**. fullstack이 직접 생성/수정하지 않는다.
- `supabase/migrations/005_create_friend_universe.sql`, `libs/supabase/types.ts`, Route Handler → **fullstack 소유**.

확정 계약: `calculateFriendCompatibility(owner, guest)` 는 **순수 동기 함수(LLM/네트워크 없음)**.

**스키마가 엔진보다 앞서간다**: CTO가 계약을 먼저 확정하고 fullstack이 스키마에 반영하는 순서라, `libs/supabase/types.ts`가 엔진에 아직 없는 필드를 참조하게 되는 구간이 생긴다. 엔진의 아직-미존재 타입을 `import type` 하면 tsc가 깨지므로, 그 필드는 supabase 쪽에 로컬 타입으로 정의하고 "엔진 릴리스 후 교체" 주석을 남긴다. 이미 존재하는 타입(`FriendCompatibilityFactor` 등)은 복제하지 말고 `@/libs/zi-wei-dou-shu` 루트에서 type-only import 한다(순환 참조 때문에 `calculators` 인덱스가 아니라 루트여야 함).

**Why:** 두 에이전트가 동시에 같은 기능을 작업하므로 파일 경계를 넘으면 서로의 미완성 코드를 덮어쓰거나 tsc 에러를 오진하게 된다 (실제로 작업 중 ziwei-expert가 편집 중이던 constants 파일에서 구문 에러가 떠서 무관한 에러로 판별해야 했음).

**How to apply:** 이 기능 관련 요청을 받으면 계산 로직 변경은 보고서에 "ziwei-expert 위임 필요"로 남기고 직접 건드리지 않는다. `npx tsc --noEmit` 결과에 `friend-compatibility-table.ts`/`owner-one-liner-table.ts` 에러가 보이면 내 변경 탓인지 먼저 분리해서 판단한다.

**owner 한줄평(2026-08-19 완료)**: ziwei-expert가 `calculateOwnerOneLiner`(`libs/zi-wei-dou-shu/calculators/owner-one-liner.ts`)를 먼저 완성해두고, 내가 DB(마이그레이션 006에 `owner_one_liner_id`/`owner_one_liner_version` 컬럼 추가) + API(`libs/universe/service.ts`, `repository.ts`) + UI(섹션1 `UniverseOwnerSummary`) 배선을 맡는 동일 패턴이 반복됐다. **지연 산출(자가 치유) 패턴**을 여기서 처음 도입했다: 컬럼 추가 이전에 생성된 우주는 스냅샷이 NULL이므로, 조회 시점(`getUniverseDetail`)에 없으면 계산은 기다리고(응답에 필요) 저장만 `touchLastViewedAt`과 동일하게 fire-and-forget으로 처리한다(`service.ts`의 `resolveOwnerOneLiner`). 이후 유사하게 "생성 시점 스냅샷 + 과거 행 지연 백필"이 필요한 필드가 생기면 이 패턴을 재사용할 것.
