# 내년 운세 (2027년 운세)

> 한 줄 요약: 기존 "올해 운세(yearly)" 파이프라인을 그대로 재사용해 2027년을 대상으로 하는 신규 유료 운세 상품을 추가한다.

**상태**: 스펙 확정 (CPO 승인) — 구현 미착수
**작성일**: 2026-08-11
**구현 담당**: CTO → fullstack
**디자인**: designer (컬러 토큰/카드 규격 별도 산출)

---

## 개요

### 배경

인생스포는 현재 `yearly` 타입으로 "올해 운세"를 판매하고 있다. `yearly`의 대상 연도는 `new Date().getFullYear()`로 매번 동적으로 계산되므로 항상 "지금 이 해"를 가리킨다.

"내년 운세"는 2027년을 대상으로 하는 별도 상품이다. 유저 플로우(프로필 선택 → 미리보기 → 결제 → 결과)는 기존 yearly와 **완전히 동일**하며, 유일한 차이는 대상 연도가 2027이라는 점이다.

### 조사 결과 — 재사용 가능한 것과 아닌 것

구현 방식을 정하기 전에 기존 코드를 조사한 결과, **도메인 계산/해석 레이어는 이미 완전히 연도 파라미터화되어 있다.**

| 레이어 | 현재 상태 | 신규 작업 필요? |
|---|---|---|
| 자미두수 연운 계산 (`libs/zi-wei-dou-shu/calculators/yearly.ts`) | `calculateYearlyFortune(chart, year, age)` — year를 인자로 받음 | **불필요** |
| AI 해석 (`app/api/interpret/yearly/route.ts`) | `targetYear: z.number().min(1900).max(2100)` 이미 수용 | fortuneType 인자만 추가 |
| 결과 저장 (`fortunes` 테이블) | `year` 컬럼(int, default 0) 이미 존재 | **불필요** |
| 결과 페이지 i18n (`fortune.yearly.*`) | `title: "{name}님의 {year}년 운세"` — year 보간 이미 적용 | **거의 불필요** (아래 참고) |
| 결제 상태 조회 API | `?type=yearly&year=2026` — year 스코프 이미 적용 | fortuneType 분기만 추가 |
| **엔타이틀먼트(무료권/쿠폰/네비게이션)** | **`fortune_type`만 보고 `year`를 보지 않음** | **여기가 핵심 리스크** |

즉 이 기능의 실제 작업량은 자미두수 로직이 아니라 **타입 문자열을 파이프라인에 관통시키는 일**에 거의 전부 몰려 있다.

### 목표

- 2027년 운세를 독립 상품으로 판매한다.
- 기존 yearly 코드를 **복사하지 않고** edition 파라미터로 재사용한다.
- 2026년 운세 구매자가 2027년 운세를 무료로 열람하는 과금 누수를 원천 차단한다.

---

## 1. fortuneType 값 확정

### 결정: `yearly_2027` (컨벤션 `yearly_{YYYY}`)

### 검토한 대안과 트레이드오프

| 방식 | DB 마이그레이션 | 과금 누수 | 연간 유지비 | 판정 |
|---|---|---|---|---|
| A. 기존 `yearly` 재사용 + `year=2027` | 0건 | **발생** | 없음 | 기각 |
| B. `next_year` (상대적 이름) | 5건 | **발생** (지연) | 없음 | 기각 |
| C. `yearly_2027` (절대 연도) | 5건 | 없음 | 연 1회 | **채택** |

#### A안(기존 yearly 재사용)을 기각한 이유

DB 마이그레이션이 0건이라 가장 매력적으로 보이지만, **엔타이틀먼트가 연도로 구분되지 않는다.** 원격 DB를 read-only로 조회해 확인한 사실:

- `fortunes` 테이블만 `year` 컬럼을 갖는다.
- `profile_free_access`, `promo_codes`, `promo_code_usages`, `follow_up_questions`에는 **year 컬럼이 없다.**
- `app/profiles/hooks/useFortuneNavigation.ts`의 `hasPaidFortune`은 `f.fortune_type === dbType`만 검사하고 `year`를 보지 않는다.

따라서 A안을 택하면 2026년 운세를 결제한 유저의 `hasPaidFortune("yearly")`가 `true`를 반환해 **2027년 운세 결제 화면을 건너뛰고 결과로 진입한다.** 무료권 grant와 프로모 쿠폰도 동일하게 두 연도에 모두 적용된다. 이를 막으려면 위 4개 테이블에 year 컬럼을 추가하고 RLS까지 재검토해야 하므로, 오히려 C안보다 마이그레이션 부담이 크다.

#### B안(`next_year` 상대적 이름)을 기각한 이유

"매년 재사용 가능"해 보이지만 **엔타이틀먼트가 `fortune_type` 단독 키이기 때문에 상대적 이름은 시한폭탄이다.**

```
2026년: 유저가 'next_year' 결제 → fortunes(profile, 'next_year', year=2027).paid_at 설정
2027년: "내년 운세" 카드가 이제 2028년을 의미
        → hasPaidFortune('next_year')는 year를 안 보므로 2027년 행을 보고 true 반환
        → 유저가 2028년 운세를 무료 열람 (A안과 동일한 누수가 1년 지연되어 재현)
```

추가로 `home.nextYear.subtitle`에 "2027년"이라고 쓴 카피가 해가 바뀌면 조용히 거짓말이 된다. 상대적 이름은 **코드와 카피 양쪽에서 시간이 지나면 틀려지는** 구조다.

#### C안을 채택한 이유

- 연도마다 타입 값이 달라지므로 **모든 엔타이틀먼트 검사가 year 스코프 작업 없이 자동으로 정확해진다.** 이것이 결정적이다.
- 카피가 절대 연도를 가리키므로 시간이 지나도 틀려지지 않는다.
- 신규 타입 추가는 이미 `past_life`로 검증된 경로다.
- 연 1회 반복 비용(CHECK 제약 1건 + i18n 블록 1개 + 카드 1개, 기계적 작업)이 발생하지만, "내년 운세"는 연말 시즌 캠페인 상품이므로 **어차피 해마다 의도적으로 세팅하는 상품**이다. 상시 운영 기능이 아니다.

> **"매년 재사용 가능한 컨벤션"의 의미**: 재사용되는 것은 타입 *값*이 아니라 *규칙*(`yearly_{YYYY}`)과 코드 경로다. 값을 매년 새로 발급하는 것이 바로 과금 정확성을 공짜로 얻는 대가다.

### 기존 `yearly`는 그대로 둔다

`yearly`(=올해 운세, 동적 현재 연도)를 `yearly_2026`으로 소급 마이그레이션하지 **않는다.** 8,418행의 운영 데이터를 건드릴 이유가 없고, `yearly` + `year` 컬럼 조합은 현 상품에서 정상 동작한다. 의도된 비대칭이며 아래 롤오버 정책으로 정합성을 유지한다.

### 문자열 표기 통일 (중요)

`yearly_2027`을 **DB 값 · 타입 유니온 · URL 세그먼트 전부에 동일한 문자열로** 사용한다.

```
DB          fortune_type = 'yearly_2027'
타입         type FortuneType = ... | "yearly_2027"
결제 URL     /payment/yearly_2027/{profileId}
결과 URL     /fortune/yearly_2027/{profileId}
미리보기 URL  /fortune/yearly_2027/preview/{profileId}
프로필 진입   /profiles?type=yearly_2027
```

기존 `past_life`는 DB에서 `past_life`, URL에서 `past-life`로 갈라져 있고 이를 `useFortuneNavigation.toDbFortuneType`이 겨우 메우고 있다. 이 불일치는 이미 `app/payment/[type]/[profileId]/page.tsx`의 `handleBack`·`handleViewFortune`에 분기 예외를 만들어 놓았다. **같은 함정을 새로 만들지 않는다.** 하이픈/언더스코어 혼용 금지.

---

## 2. 플로우 파라미터 설계

### 결정: "edition" 파라미터로 기존 yearly 코드 경로를 재사용한다 (복사 금지)

`/fortune/yearly/**` 페이지들은 500줄이 넘는다. 복사본을 만들면 이후 모든 개선을 두 곳에 반영해야 하고, 매년 한 벌씩 늘어난다. 대신 **연 단위 상품을 "edition"으로 추상화**한다.

### 2-1. 단일 진실 공급원 신설

`libs/fortune/yearly-editions.ts` (신규)

```typescript
/** 연 단위 운세 상품의 edition 정의 */
export const YEARLY_EDITIONS = {
  yearly: {
    /** null이면 조회 시점의 현재 연도를 사용 */
    targetYear: null,
    i18nKey: "yearly",
  },
  yearly_2027: {
    targetYear: 2027,
    i18nKey: "yearly2027",
  },
} as const;

export type YearlyEdition = keyof typeof YEARLY_EDITIONS;

export const isYearlyEdition = (value: string): value is YearlyEdition =>
  value in YEARLY_EDITIONS;

/** edition의 대상 연도를 해석한다. yearly는 현재 연도, yearly_2027은 2027 고정 */
export const resolveTargetYear = (edition: YearlyEdition): number =>
  YEARLY_EDITIONS[edition].targetYear ?? new Date().getFullYear();
```

앞으로 연도가 추가될 때 **이 파일 한 곳과 CHECK 제약, i18n 블록만** 손대면 되도록 설계한다. 하드코딩된 `"yearly_2027"` 문자열이 페이지·API에 흩어지면 안 된다.

### 2-2. 훅 파라미터화

`libs/hooks/fortune/useYearlyFortune.ts` — 현재 `type=yearly`와 `/fortune/yearly/preview/${profileId}` 리다이렉트 경로가 하드코딩되어 있다. `edition` 옵션을 받도록 변경한다.

```typescript
interface UseYearlyFortuneOptions {
  edition?: YearlyEdition; // 기본값 "yearly" — 기존 호출부 무변경
  // ...기존 옵션
}
```

내부 변경점:
- `currentYear` → `resolveTargetYear(edition)`로 대체 (반환 필드명 `currentYear`는 하위호환 위해 유지하거나 `targetYear`로 리네임 — CTO 재량)
- 결제 상태 조회: `?type=${edition}&year=${targetYear}`
- 미리보기 리다이렉트: `/fortune/${edition}/preview/${profileId}`
- `/api/interpret/yearly` 요청 body에 `fortuneType: edition` 추가

`useYearlyPreview.ts`, `useYearlyShare.ts`도 동일 패턴으로 처리한다.

### 2-3. 라우트 구성

Next.js App Router에서 `/fortune/yearly`와 `/fortune/yearly_2027`을 **동적 세그먼트로 통합**하는 방식(`/fortune/[edition]/...`)은 기존 `/fortune/past-life`, `/fortune/lifetime` 등과 충돌하므로 권장하지 않는다.

대신 **얇은 래퍼 페이지**를 만든다. 기존 페이지 본문을 `edition`을 prop으로 받는 컴포넌트로 추출하고, 두 라우트가 각각 edition만 지정해 렌더한다.

```
app/fortune/yearly/[profileId]/page.tsx            → <YearlyFortuneView edition="yearly" />
app/fortune/yearly_2027/[profileId]/page.tsx       → <YearlyFortuneView edition="yearly_2027" />
app/fortune/yearly_2027/preview/[profileId]/page.tsx
app/fortune/yearly_2027/share/[profileId]/page.tsx + layout.tsx
```

`share/layout.tsx`의 OG 메타 생성부는 `.eq("year", currentYear)`가 하드코딩되어 있으므로 `resolveTargetYear`로 교체하고 `fortune_type`도 edition으로 필터해야 한다.

### 2-4. 결제 파이프라인

`app/payment/[type]/[profileId]/page.tsx`:
- `FortuneType` 유니온에 `"yearly_2027"` 추가
- 타입 유효성 검사 분기(현재 `!==` 4연속 비교)에 추가 — `isYearlyEdition()` 활용 권장
- `orderName` / `getProductName()` 분기에 추가
- PayPal `description`에 `"2027 Yearly Fortune"` 추가 (현재 yearly가 `"2025 Yearly Fortune"`으로 **잘못 하드코딩**되어 있음 — 함께 수정 권장)
- `handleBack` → `/fortune/yearly_2027/preview/${profileId}`
- `handleViewFortune` → `/fortune/yearly_2027/${profileId}`

`app/payment/success/page.tsx`: `year` 결정 로직이 `fortuneType === "yearly" ? new Date().getFullYear() : undefined`이므로 `isYearlyEdition(fortuneType) ? resolveTargetYear(fortuneType) : undefined`로 교체한다. **이 부분을 놓치면 결제는 성공하는데 엉뚱한 연도 행에 `paid_at`이 찍혀 유저가 결과를 못 본다. 최우선 검증 항목.**

`app/api/payment/confirm/route.ts`: 동일하게 `year` 결정 로직을 edition 기반으로 교체.

`app/api/fortune/[profileId]/payment-status/route.ts`: `fortuneType` 파싱 화이트리스트와 `year` 결정 분기에 edition 추가.

### 2-5. AI 해석 API

`app/api/interpret/yearly/route.ts`는 `getFortune(profileId, "yearly", targetYear)`와 저장 시 `fortuneType: "yearly"`가 하드코딩되어 있다. 요청 스키마에 선택적 `fortuneType`을 추가한다.

```typescript
fortuneType: z.enum(["yearly", "yearly_2027"]).default("yearly"),
```

`targetYear`와 `fortuneType`이 서로 모순되면(예: `yearly_2027` + `targetYear=2026`) 400으로 거절한다 — 클라이언트가 보낸 값을 그대로 믿고 저장하면 데이터가 오염된다.

캐시 키 `` `yearly-${targetYear}-${language}` ``는 targetYear를 이미 포함하므로 **변경 불필요**하다.

---

## 3. i18n 키 구조

### 3-1. 신규 키 (home)

기존 `home.yearly`와 동일 구조. 키 이름은 `home.yearly2027` (camelCase — `pastLife` 선례를 따름).

```json
"home": {
  "yearly2027": {
    "title": "...",
    "subtitle": "...",
    "button": "..."
  }
}
```

| 로케일 | title | subtitle | button |
|---|---|---|---|
| **ko** | `내년 운세` | `2027년 공략 방법 미리 보기` | `내년 운세 확인하기` |
| **en** | `Next Year's Fortune` | `Preview how to navigate 2027` | `View Next Year's Fortune` |
| **ja** | `来年の運勢` | `2027年の攻略法を先取り` | `来年の運勢を見る` |

카피 근거: 기존 yearly가 "올해 공략 방법 보기"이므로 **"공략"이라는 동일 프레임을 유지**하되 "미리 보기"로 선점 심리를 더했다. 브랜드 보이스 규칙상 자미두수 전문 용어는 CTA에 쓰지 않았고, 금지 표현·과장 적중률 표현 없음. 이모지 없음.

### 3-2. 신규 키 (payment)

```json
"payment": {
  "productNameYearly2027": "...",
  "orderNameYearly2027": "..."
}
```

| 로케일 | productNameYearly2027 | orderNameYearly2027 |
|---|---|---|
| **ko** | `내년 운세 스포일러` | `{name}님의 내년 운세 스포일러` |
| **en** | `Next Year's Fortune Spoiler` | `{name}'s Next Year Fortune Spoiler` |
| **ja** | `来年の運勢ネタバレ` | `{name}さんの来年の運勢ネタバレ` |

기존 `productNameYearly`("올해 운세 스포일러") 패턴을 그대로 따랐다. "스포일러/ネタバレ" 브랜드 용어 유지.

### 3-3. 결과/미리보기 페이지 — 신규 네임스페이스 불필요

`fortune.yearly.title`이 이미 `"{name}님의 {year}년 운세"`로 **year를 보간**하고 있다. `useYearlyFortune`이 넘기는 year만 2027이 되면 결과 페이지 카피는 자동으로 맞는다. **`fortune.yearly2027` 네임스페이스를 새로 만들지 않는다.**

단, 아래 키는 "올해"가 하드코딩되어 있으므로 연도 중립 표현으로 **수정**한다 (ko/en/ja 3언어 모두):

| 키 | 현재(ko) | 변경(ko) |
|---|---|---|
| `fortune.yearly.fetchError` | `올해 운세 조회에 실패했습니다.` | `운세 조회에 실패했습니다.` |

`useYearlyFortune.ts` 내 하드코딩 폴백 문자열 `"올해 운세 조회에 실패했습니다."`도 동일하게 수정한다.

### 3-4. 쿠폰 라벨

`app/coupon/page.tsx`의 라벨 매핑에 추가한다. 현재 이 매핑은 **한국어가 하드코딩**되어 있다(`yearly: "연간 운세"`).

```typescript
yearly_2027: "내년 운세",
```

> 이 파일이 translations를 경유하지 않는 것은 기존 규칙 위반이지만, 이번 스코프에서는 기존 패턴을 따르고 별도 티켓으로 분리한다.

---

## 4. 디자인 (확정)

designer 산출물: `components/home/NextYearFortuneCard.module.css` (작성 완료). CPO가 대비율을 독립 검산해 승인함.

### 4-1. 루미너스 블루 컬러 토큰

| 용도 | hex | 제안 토큰명 |
|---|---|---|
| 카드 배경 그라데이션 시작 | `#1e4fd8` | `--color-card-next-year-surface-start` |
| 카드 배경 그라데이션 끝 | `#101b4d` | `--color-card-next-year-surface-end` |
| 하단 보더 | `#0f1e52` | `--color-card-next-year-border` |
| 버튼 텍스트 (흰 배경 위) | `#0f1e52` | `--color-card-next-year-button-text` |

```css
background: linear-gradient(180deg, #1e4fd8 0%, #101b4d 100%);
```

기존 YearlyFortuneCard는 단색(`#4c359f` → `#4c359f`)인 반면 신규 카드는 실제 그라데이션을 써서 시각적 무게를 더했다. home 최상단 배치 의도와 부합한다.

> 토큰은 `globals.css`에 **등록하지 않고** 모듈 CSS에 hex를 직접 쓴다. 다른 홈 카드 5종이 모두 동일한 관례를 따르고 있으므로 이 카드만 예외를 만들지 않는다. 토큰화는 홈 카드 전체를 한 번에 정리할 때 별도 티켓으로 진행한다.

### 4-2. 대비 검증 (WCAG AA 4.5:1) — CPO 재검산 완료

| 조합 | 대비율 | 판정 |
|---|---|---|
| `#ffffff` 텍스트 on `#1e4fd8` (그라데이션 밝은 쪽, 최악 케이스) | **6.64:1** | 통과 |
| `#ffffff` 텍스트 on `#101b4d` (어두운 쪽) | **16.33:1** | 통과 |
| `#0f1e52` 버튼 텍스트 on `#ffffff` | **15.82:1** | 통과 |

### 4-3. 이미지 placeholder 규격

기존 카드들을 실제로 확인한 결과 홈 카드는 **두 그룹**으로 나뉜다.

- **대형 일러스트 그룹**: YearlyFortuneCard — `368x368`, `top:-75px`, `right:-85px`
- **소형 아이콘 그룹**: Lifetime / Compatibility / PastLife / FaceReading — 150~213px대

"내년 운세"는 "올해 운세"와 같은 연간운세 카테고리로 나란히 놓이므로 **YearlyFortuneCard와 동일한 368x368 / top:-75px / right:-85px 규격**을 채택한다. 두 카드가 한 쌍으로 읽혀야 한다.

- 최종 이미지 경로: `/public/images/home/next-year-illustration.png` (368x368, PNG)
- 이미지 도착 전까지는 `.illustrationPlaceholder` 클래스(동일 좌표에 radial-gradient 광원)를 사용해 빈 영역이 깨져 보이지 않게 한다. 에셋 반영 시 `.illustration`으로 교체하고 placeholder 클래스는 제거한다.
- fullstack은 `YearlyFortuneCard.tsx`의 `<Image>` 사용법을 그대로 따르고 `src`만 교체하면 된다.

### 4-4. 다국어 레이아웃

`height: 164px` 고정을 유지했다. 확정 카피 기준으로 KO/EN/JA 모두 여유가 있다(최장 케이스인 EN subtitle 2줄 가정 시 약 136px 사용). 다만 **고정 높이는 잠재 리스크**이므로, 구현 시 EN/JA 로케일 375px에서 실제 렌더를 확인하고 넘칠 경우 `min-height`로 전환한다.

---

## 5. 연도 롤오버 정책 (🔴 반드시 처리)

**2027-01-01이 되면 `yearly`(올해 운세)가 자동으로 2027년을 가리킨다.** 그 순간 `yearly`(year=2027)와 `yearly_2027`이 **같은 연도를 파는 상품 2개**가 되어, `yearly_2027`을 이미 결제한 유저가 "올해 운세"에서 다시 결제를 요구받는 이중과금이 발생한다.

필수 대응:

1. 2027-01-01 이전에 home에서 `NextYearFortuneCard`를 **제거**하고 `yearly` 카드만 남긴다.
2. `yearly` + `year=2027`의 결제/접근 판정 시 **`yearly_2027` 결제 이력도 함께 인정**하는 호환 셔임을 넣는다. 대상: `payment-status` 라우트, `useFortuneNavigation.hasPaidFortune`, `first-payment-eligibility`.

셔임을 런칭과 동시에 넣을지 별도 티켓으로 뺄지는 CTO 판단에 맡기되, **2026-12-31 이전에는 반드시 배포되어야 한다.**

---

## 6. CTO 인계 — 구현 체크리스트

### Phase 0: DB 마이그레이션 (🔴 선행 필수)

`supabase/migrations/`에 파일로 작성한 뒤 로컬 검증 → 사용자 승인 → 원격 적용 (`.claude/rules/database-safety.md` 준수).

CHECK 제약에 `'yearly_2027'`을 추가해야 하는 테이블 5개:

- [ ] 🔴 `fortunes.fortune_type` — 현재 `['lifetime','yearly','past_life']` (8,418행)
- [ ] 🔴 `profile_free_access.fortune_type` — 현재 `[...,'compatibility']` (90행)
- [ ] 🔴 `promo_codes.fortune_type` — 현재 `[...,'all','face_spoiler']` (25행)
- [ ] 🔴 `promo_code_usages.fortune_type` — 현재 `[...,'face_spoiler','compatibility']` (218행)
- [ ] 🔴 `follow_up_questions.fortune_type` — 현재 `[...,'compatibility']` (38행)
- [ ] `reviews.fortune_type`은 text이고 CHECK가 없어 **마이그레이션 불필요** (앱단 `VALID_FORTUNE_TYPES` Set만 수정)
- [ ] RLS 정책이 `fortune_type` 값에 의존하는지 확인 (신규 값이 정책에서 누락되지 않도록)

### Phase 1: 타입/상수 (🔴)

- [ ] 🔴 `libs/fortune/yearly-editions.ts` 신규 — `YEARLY_EDITIONS`, `isYearlyEdition`, `resolveTargetYear`
- [ ] 🔴 `libs/supabase/types.ts` — `FortuneType` 유니온에 `"yearly_2027"` 추가
- [ ] 🔴 `libs/supabase/types.ts` — `PromoFortuneType`, `PromoUsageFortuneType`, `ReviewFortuneType`, `FollowUpFortuneType` 4개 유니온에 각각 추가
- [ ] 🔴 `libs/supabase/fortune.ts` — `FortuneType` 유니온에 추가
- [ ] 🔴 `libs/stores/user/types.ts` — `FortuneType` 확인 후 추가

### Phase 2: API 라우트 (🔴)

- [ ] 🔴 `app/api/payment/first-payment-eligibility/route.ts` — `VALID_TYPES` 배열
- [ ] 🔴 `app/api/promo/apply/route.ts` — zod `z.enum([...])`
- [ ] 🔴 `app/api/promo/validate/route.ts` — zod enum
- [ ] 🔴 `app/api/promo/check/route.ts` — 타입 검증부
- [ ] 🔴 `app/api/fortune/[profileId]/payment-status/route.ts` — 타입 화이트리스트 + `year` 결정 분기
- [ ] 🔴 `app/api/fortune/[profileId]/route.ts` — 타입 캐스팅부
- [ ] 🔴 `app/api/payment/confirm/route.ts` — `year` 결정 분기 (`fortuneType === "yearly"` 하드코딩 교체)
- [ ] 🔴 `app/api/interpret/yearly/route.ts` — 선택적 `fortuneType` 파라미터 + targetYear 모순 검증 + `getFortune`/저장부 edition 반영
- [ ] 🟡 `app/api/reviews/route.ts` — `VALID_FORTUNE_TYPES` Set
- [ ] 🟡 `app/api/follow-up/route.ts` — `VALID_FORTUNE_TYPES` Set

### Phase 3: 훅/네비게이션 (🔴)

- [ ] 🔴 `libs/hooks/fortune/useYearlyFortune.ts` — `edition` 옵션 추가, 하드코딩된 `type=yearly`·리다이렉트 경로·`currentYear` 교체
- [ ] 🔴 `libs/hooks/fortune/useYearlyPreview.ts` — 동일
- [ ] 🔴 `libs/hooks/fortune/useYearlyShare.ts` — 동일
- [ ] 🔴 `app/profiles/hooks/useFortuneNavigation.ts` — `FortuneType` 로컬 유니온에 추가. **`toDbFortuneType`은 `yearly_2027`을 변환하지 않고 그대로 통과시켜야 한다** (하이픈 변환 금지)
- [ ] 🔴 `app/profiles/hooks/useProfileSelection.ts` — `getCompletedFortunes`에 신규 타입 집계 추가
- [ ] 🔴 `app/profiles/page.tsx` — `?type=yearly_2027` 쿼리 수용

### Phase 4: 페이지/라우트 (🔴)

- [ ] 🔴 `app/fortune/yearly/[profileId]/page.tsx` 본문을 `edition` prop 받는 공용 뷰로 추출
- [ ] 🔴 `app/fortune/yearly_2027/[profileId]/page.tsx` 신규 (얇은 래퍼)
- [ ] 🔴 `app/fortune/yearly_2027/preview/[profileId]/page.tsx` 신규
- [ ] 🟡 `app/fortune/yearly_2027/share/[profileId]/page.tsx` + `layout.tsx` 신규 — layout의 `.eq("year", currentYear)`·`fortune_type` 필터를 edition 기반으로
- [ ] 🔴 `app/payment/[type]/[profileId]/page.tsx` — `FortuneType` 유니온, 유효성 분기, `orderName`, `getProductName`, `handleBack`, `handleViewFortune`, PayPal `description`
- [ ] 🔴 `app/payment/success/page.tsx` — `fortuneType` 캐스팅 유니온 + **`year` 결정 로직** (최우선 검증)
- [ ] 🟡 `app/payment/fail/page.tsx` — 타입 유니온
- [ ] 🟡 `app/coupon/page.tsx` — 라벨 매핑에 `yearly_2027: "내년 운세"`
- [ ] 🟢 `app/sitemap.ts` — 신규 경로 노출 여부 판단

### Phase 5: 컴포넌트 (🔴)

- [ ] 🔴 `components/home/NextYearFortuneCard.tsx` 신규 — designer의 `NextYearFortuneCard.module.css` import, `home.yearly2027` 네임스페이스 사용
- [ ] 🔴 `components/home/index.ts` — export 추가
- [ ] 🔴 `app/home/page.tsx` — `handleNextYearFortune` (→ `/profiles?type=yearly_2027`) + **`<YearlyFortuneCard />`보다 위에 배치**
- [ ] 🔴 이미지 placeholder — 실제 파일은 후속 제작, 부재 시 레이아웃 미파손

### Phase 6: i18n (🔴)

- [ ] 🔴 `messages/translations.json` — `home.yearly2027` (title/subtitle/button) ko/en/ja **3개 블록 모두**
- [ ] 🔴 `messages/translations.json` — `payment.productNameYearly2027`, `payment.orderNameYearly2027` ko/en/ja
- [ ] 🟡 `fortune.yearly.fetchError`에서 "올해" 제거 (ko/en/ja) + `useYearlyFortune.ts` 폴백 문자열

### Phase 7: 롤오버 대비 (🟡 — 2026-12-31 이전 필수)

- [ ] 🟡 `yearly`(year=2027) 판정 시 `yearly_2027` 결제 이력 인정하는 호환 셔임
- [ ] 🟡 2027-01-01 이전 home에서 `NextYearFortuneCard` 제거

---

## 성공 기준

### 완료 조건

- [ ] `pnpm build` 타입 체크 통과
- [ ] `pnpm lint` 통과
- [ ] 신규 타입 문자열 `"yearly_2027"`이 `yearly-editions.ts` 외 파일에 하드코딩되지 않음 (`grep -rn '"yearly_2027"'`로 검증)

### 수동 검증 시나리오 (🔴 과금 정확성)

1. **미결제 유저**: home "내년 운세" → 프로필 선택 → 미리보기 → 결제 → 결과에 **2027년** 데이터 표시
2. **2026년 운세만 결제한 유저**: "내년 운세" 진입 시 **결제 화면이 정상 노출**되어야 한다 (건너뛰면 A안 누수가 재현된 것)
3. **2027년 운세만 결제한 유저**: "올해 운세"(2026) 진입 시 **결제 화면이 정상 노출**되어야 한다
4. `yearly` 전용 프로모 쿠폰이 `yearly_2027`에 적용되지 **않아야** 한다
5. 결제 완료 후 `fortunes` 테이블에 `fortune_type='yearly_2027'`, `year=2027`, `paid_at` NOT NULL 행이 정확히 1개 생성
6. ko/en/ja 3개 로케일에서 카드·결제·결과 페이지 문구 정상 노출
7. 모바일 375px에서 카드 레이아웃 정상

---

## 제약사항 / 미해결 이슈

- ~~**CTO 확인 대기**~~ → **CTO 회신 완료 (2026-08-11)**. 아래 "CTO 결정 기록" 참조.
- 카드 이미지 미제작 — placeholder로 선반영.
- 기존 `past_life`의 DB/URL 표기 불일치는 이번 스코프에서 수정하지 않는다(별도 티켓 권장).
- `app/coupon/page.tsx` 라벨 하드코딩(다국어 미경유)은 기존 패턴을 따르며 별도 티켓으로 분리.
- 발견된 기존 버그: `app/payment/[type]/[profileId]/page.tsx`의 PayPal `description`이 yearly에 대해 `"2025 Yearly Fortune"`으로 하드코딩되어 있다. 이번 작업 중 함께 수정 권장. → **이번 스코프에 포함해 수정함** (edition 대상 연도 기반 동적 생성).

---

## CTO 결정 기록 (2026-08-11)

CPO가 남긴 3건의 확인 요청에 대한 회신이다.

### D-1. CHECK 제약 마이그레이션 방식 → **동적 DROP + 명시적 재생성**

`NOT VALID` 후 `VALIDATE` 방식은 채택하지 않는다. 이번 변경은 허용 값 집합을 **넓히기만** 하므로 기존 행이 새 제약을 위반할 수 없고, 따라서 검증을 지연시켜 얻을 이점이 없다.

단, 원격 DB의 CHECK 제약 **이름을 read-only 도구로 조회할 수 없다**는 제약이 있다. (`list_tables`는 제약 정의는 주지만 이름은 주지 않고, 이름 조회에는 `execute_sql`이 필요한데 이는 `.claude/rules/database-safety.md`상 승인 없이 호출 금지 대상이다.) 이름을 추측해 `DROP CONSTRAINT`를 거는 것은 실패 위험이 있으므로, **`pg_constraint`에서 해당 컬럼의 CHECK 제약을 동적으로 찾아 DROP한 뒤 명시적 이름으로 재생성하는 `DO` 블록**으로 작성한다. 실제 이름과 무관하게 동작하고 재실행에도 안전하다.

### D-2. edition 리팩터링 공수 → **수용, 이번 스코프에 포함**

`/fortune/yearly/**` 4개 파일 1,231줄을 복사하지 않고 `edition` prop 기반 공용 뷰로 추출한다. 복사본을 만들면 매년 한 벌씩 늘어나며 모든 개선을 N곳에 반영해야 한다. 초기 공수를 지불하고 구조를 잡는 쪽이 명백히 유리하다.

### D-3. 롤오버 셔임(Phase 7) → **🎫 별도 티켓으로 분리. 이번 스코프에서 구현하지 않음**

사용자 승인 하에 내린 결정이다. 이번 릴리스에서는 **문서화만** 하고 실제 처리 로직은 만들지 않는다.

> **🎫 TICKET-ROLLOVER-2027 — 마감: 2026-12-31 (하드 데드라인)**
>
> **문제**: 2027-01-01이 되면 `yearly`(올해 운세)의 `resolveTargetYear()`가 2027을 반환한다. 그 순간 `yearly`(year=2027)와 `yearly_2027`이 **같은 연도를 파는 상품 2개**가 되어, `yearly_2027`을 이미 결제한 유저가 "올해 운세"에서 재결제를 요구받는 **이중과금**이 발생한다.
>
> **필요 작업** (스펙 5장 참조):
> 1. `yearly` + `year=2027` 판정 시 `yearly_2027` 결제 이력도 인정하는 호환 셔임 — 대상: `app/api/fortune/[profileId]/payment-status/route.ts`, `app/profiles/hooks/useFortuneNavigation.ts`의 `hasPaidFortune`, `app/api/payment/first-payment-eligibility/route.ts`
> 2. home에서 `NextYearFortuneCard` 제거 (2027-01-01 이전)
>
> **위험도**: 🔴 높음 — 미처리 시 실제 과금 사고. 날짜 기반으로 조용히 발현되므로 테스트로 잡히지 않는다.
>
> **완화**: 2026-12-31 이전에는 발현 불가능하므로 이번 릴리스의 정확성에는 영향이 없다. 단 **잊으면 사고가 나는 종류의 부채**이므로 캘린더 리마인더 등 코드 외부 장치가 필요하다.
