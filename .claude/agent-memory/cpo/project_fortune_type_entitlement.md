---
name: fortune-type-entitlement-constraint
description: 운세 상품 엔타이틀먼트는 fortune_type 단독 키라 연도별 상품 기획 시 과금 누수가 생긴다 — 신규 운세 타입 기획의 핵심 제약
metadata:
  type: project
---

인생스포의 유료 열람 권한(엔타이틀먼트)은 **`fortune_type` 문자열 단독으로** 판정된다. `fortunes` 테이블만 `year` 컬럼을 갖고, `profile_free_access` / `promo_codes` / `promo_code_usages` / `follow_up_questions`에는 year 컬럼이 없다. `useFortuneNavigation.hasPaidFortune`도 year를 보지 않는다.

**Why:** 2026-08 "내년 운세"(2027년) 기획 중 발견. 기존 `yearly` 타입에 `year=2027`만 실어 재사용하면 2026년 구매자가 2027년 운세를 무료로 여는 과금 누수가 발생한다. 같은 이유로 `next_year` 같은 **상대적 이름도 금지** — 해가 바뀌면 같은 타입 값이 다른 연도를 가리켜 누수가 1년 지연되어 재현된다.

**How to apply:** 연도/기간에 종속된 신규 운세 상품을 기획할 때는 반드시 **절대값을 박은 신규 fortune_type**(컨벤션 `yearly_{YYYY}`)을 발급한다. 타입 값을 재사용해 파라미터로만 구분하려는 설계는 반려한다. 신규 타입 추가 시 CHECK 제약이 걸린 테이블 5개(fortunes, profile_free_access, promo_codes, promo_code_usages, follow_up_questions) 마이그레이션이 선행돼야 한다 — `reviews.fortune_type`은 CHECK 없음.

반대로 **자미두수 계산/해석 레이어는 이미 완전히 연도 파라미터화**되어 있어(`calculateYearlyFortune(chart, year, age)`, `/api/interpret/yearly`의 `targetYear`) 연도 상품 추가의 실제 공수는 도메인 로직이 아니라 타입 문자열 관통 작업에 몰린다. 공수 견적 시 이 점을 반영할 것.

상세: `specs/next-year-fortune.md`
