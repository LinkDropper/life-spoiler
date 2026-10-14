import type { BranchIndex } from "../types";

import type { BrightnessGroup } from "./star-traits";
import { MAIN_STAR_NAMES, type MainStarName } from "./stars";

/**
 * 오늘의 운세(Daily Fortune) — 슬롯·슬러그 카탈로그
 *
 * 엔진(`calculators/daily-fortune.ts`)이 내보내는 모든 문구 슬러그의 단일 출처다.
 * 문구 사전(`libs/daily/dictionary/ko.ts`)은 `Record<DailySlug, string>` 하나로 끝나고,
 * 공유 토큰 화이트리스트 검증도 이 파일의 `isDailySlug`/`isDailySlugOfSlot` 하나로 한다.
 *
 * @설계원칙
 * 1. LLM 호출 없음. 모든 문구는 슬러그 → 사전 조회로만 나온다.
 * 2. 슬러그는 **변형 접미사(-v1…)까지 포함한 최종 슬러그**다. 엔진이 변형을 고른다
 *    (`hash(personSeed, kstDate) mod V`), 사전은 변형을 모른다.
 * 3. `df-` 접두사, 영문 소문자·숫자·하이픈만 사용한다.
 * 4. 자미두수 전문 용어는 표면 문구에 노출하지 않는다. 이 파일의 축 이름(별 슬러그,
 *    오행, 사화)은 내부 식별자일 뿐이다.
 *
 * @append-only
 * 한번 발급한 슬러그는 삭제·재사용 금지(과거 공유 링크 유지). 변형 수(V)를 늘리는 것은
 * 슬러그 추가일 뿐이므로 허용된다(`-v3`, `-v4` append). 축 구성을 바꾸거나 줄이면
 * `DAILY_FORTUNE_TABLE_VERSION`을 올리고 CTO에 보고한다.
 *
 * @이번_단계
 * 카탈로그(슬롯·슬러그)만 정의한다. 가중치·분위 컷·오행 관계표 등 엔진 상수는
 * 1단계(엔진 구현)에서 이 파일에 추가한다.
 *
 * @유파 삼합파(三合派)
 */

/** 슬러그 스키마(축 구성) 버전 — 문구 워딩 수정은 bump 대상이 아니다. */
export const DAILY_FORTUNE_TABLE_VERSION = "df-1.0.0";

// ============================================================
// 공통 축
// ============================================================

export const DAILY_CATEGORIES = [
  "overall",
  "love",
  "money",
  "work",
  "health",
] as const;
export type DailyCategory = (typeof DAILY_CATEGORIES)[number];

/** 총운을 제외한 4개 카테고리 (카테고리 본문 `cb` 슬롯의 축) */
export const DAILY_SUB_CATEGORIES = [
  "love",
  "money",
  "work",
  "health",
] as const;
export type DailySubCategory = (typeof DAILY_SUB_CATEGORIES)[number];

export const DAILY_LEVELS = [1, 2, 3, 4, 5] as const;
export type DailyLevel = (typeof DAILY_LEVELS)[number];

export const DAILY_CONFIDENCES = ["exact", "estimated"] as const;
export type DailyConfidence = (typeof DAILY_CONFIDENCES)[number];

/** star-traits.ts의 `BrightnessGroup`(묘왕득→bright, 리→neutral, 평함→dark)과 동일 */
export const DAILY_BRIGHTNESS_GROUPS = [
  "bright",
  "neutral",
  "dark",
] as const satisfies readonly BrightnessGroup[];

/** 오행 (일진 오행·보완 오행 공통). 표면 문구에는 노출하지 않는다. */
export const DAILY_ELEMENTS = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
] as const;
export type DailyElement = (typeof DAILY_ELEMENTS)[number];

/** 일간 사화 (화록·화권·화과·화기) */
export const DAILY_SIHUA = ["rok", "gwon", "gwa", "gi"] as const;
export type DailySihuaSlug = (typeof DAILY_SIHUA)[number];

/** 지지 슬러그 (BranchIndex 0~11 순서: 자축인묘진사오미신유술해) */
export const DAILY_BRANCH_SLUGS = [
  "ja",
  "chuk",
  "in",
  "myo",
  "jin",
  "sa",
  "o",
  "mi",
  "sin",
  "yu",
  "sul",
  "hae",
] as const;
export type DailyBranchSlug = (typeof DAILY_BRANCH_SLUGS)[number];

export const branchToSlug = (branch: BranchIndex): DailyBranchSlug =>
  DAILY_BRANCH_SLUGS[branch];

// ============================================================
// 주성 슬러그 · 성향군 (총운 본문 축)
// ============================================================

/**
 * 주성 슬러그. `owner-one-liner-table.ts`의 `OWNER_STAR_SLUG`와 같은 표기를 쓴다.
 * (별도 상수로 둔 이유: 리터럴 타입이 필요하고, owner 테이블은 `Record<…, string>`이다.)
 */
export const DAILY_STAR_SLUG = {
  자미: "ziwei",
  천기: "cheongi",
  태양: "taeyang",
  무곡: "mugok",
  천동: "cheondong",
  염정: "yeomjeong",
  천부: "cheonbu",
  태음: "taeeum",
  탐랑: "tamrang",
  거문: "geomun",
  천상: "cheonsang",
  천량: "cheonryang",
  칠살: "chilsal",
  파군: "pagun",
} as const satisfies Record<MainStarName, string>;
export type DailyStarSlug = (typeof DAILY_STAR_SLUG)[MainStarName];

const STAR_SLUGS = MAIN_STAR_NAMES.map(
  (name) => DAILY_STAR_SLUG[name]
) as readonly DailyStarSlug[];

/**
 * 성향군 7개 — 주성 14개를 기질이 닮은 2개씩 묶는다.
 * 총운 본문(`ob`)의 축이다. 시간 미상일 때는 시간 독립 신호로 성향군을 고른다
 * (선택 규칙은 1단계 엔진에서 확정하며 슬롯 구조에는 영향이 없다).
 *
 * - lead  주도·품격   : 자미, 천부
 * - think 분석·기획   : 천기, 천량
 * - warm  온기·돌봄   : 태양, 태음
 * - drive 추진·결단   : 무곡, 칠살
 * - ease  여유·화합   : 천동, 천상
 * - charm 매력·표현   : 탐랑, 염정
 * - shift 변화·소통   : 거문, 파군
 */
export const DAILY_STAR_GROUPS = [
  "lead",
  "think",
  "warm",
  "drive",
  "ease",
  "charm",
  "shift",
] as const;
export type DailyStarGroup = (typeof DAILY_STAR_GROUPS)[number];

export const DAILY_STAR_GROUP_OF: Record<MainStarName, DailyStarGroup> = {
  자미: "lead",
  천부: "lead",
  천기: "think",
  천량: "think",
  태양: "warm",
  태음: "warm",
  무곡: "drive",
  칠살: "drive",
  천동: "ease",
  천상: "ease",
  탐랑: "charm",
  염정: "charm",
  거문: "shift",
  파군: "shift",
};

// ============================================================
// 슬롯 축 (삼방 평가 · 톤 · 무드 · 이유 유형)
// ============================================================

/**
 * 삼방사정 평가 3단계 (카테고리 본문 `cb`의 축).
 * 같은 level 안에서의 뉘앙스 차이이며 level 자체를 뒤집지 않는다.
 * - support: 삼방사정에 도움 되는 신호가 우세
 * - steady : 보통
 * - burden : 부담 신호가 우세
 */
export const DAILY_SANFANG = ["support", "steady", "burden"] as const;
export type DailySanfang = (typeof DAILY_SANFANG)[number];

/**
 * 주의 포인트 톤. 가장 낮은 카테고리의 level이 2 이하면 firm, 3 이상이면 mild.
 * (주의 포인트가 level과 모순되지 않게 level에서 파생한다.)
 */
export const DAILY_CAUTION_TONES = ["mild", "firm"] as const;
export type DailyCautionTone = (typeof DAILY_CAUTION_TONES)[number];

/**
 * 오늘의 팁 무드. 총운 level이 3 이하면 calm, 4 이상이면 lift.
 */
export const DAILY_TIP_MOODS = ["calm", "lift"] as const;
export type DailyTipMood = (typeof DAILY_TIP_MOODS)[number];

/**
 * 키워드 이유 유형 (보완 오행이 오늘 어떤 방식으로 작용하는지).
 * 본명 오행국과 오늘 일간 오행의 생극 관계를 4가지로 접은 것이다
 * (접는 규칙은 1단계 엔진에서 확정).
 * - nourish: 북돋움  - match: 같은 결 맞춤  - release: 덜어 줌  - temper: 누그러뜨림
 */
export const DAILY_REASON_KINDS = [
  "nourish",
  "match",
  "release",
  "temper",
] as const;
export type DailyReasonKind = (typeof DAILY_REASON_KINDS)[number];

// ============================================================
// 변형(V) 수
// ============================================================

type V2 = "v1" | "v2";
type V3 = V2 | "v3";

export const DAILY_VARIANT_COUNT = {
  hl: 3,
  hx: 2,
  ob: 2,
  cb: 3,
  vr: 2,
  ca: 2,
  tp: 2,
  kr: 2,
} as const;

const V2_LIST: readonly V2[] = ["v1", "v2"];
const V3_LIST: readonly V3[] = ["v1", "v2", "v3"];

// ============================================================
// 슬러그 타입 (슬롯별)
// ============================================================

type LevelSlug = `l${DailyLevel}`;

/** 오늘의 한 줄 (시간 확정): 流日 명궁 주성 × 밝기군 × 변형 */
export type HeadlineSlug = `df-hl-${DailyStarSlug}-${BrightnessGroup}-${V3}`;
/** 오늘의 한 줄 (시간 미상): 일진 오행 × 일간 사화 × 변형 */
export type EstimatedHeadlineSlug =
  `df-hx-${DailyElement}-${DailySihuaSlug}-${V2}`;
/** 총운 본문: level × 성향군 × 변형 */
export type OverallBodySlug = `df-ob-${LevelSlug}-${DailyStarGroup}-${V2}`;
/** 카테고리 본문 (건강 포함, 총운 제외): 카테고리 × level × 삼방 평가 × 변형 */
export type CategoryBodySlug =
  `df-cb-${DailySubCategory}-${LevelSlug}-${DailySanfang}-${V3}`;
/** 일간 사화 변수 문장: 사화 × 카테고리(총운 포함) × 변형 */
export type VariableSlug = `df-vr-${DailySihuaSlug}-${DailyCategory}-${V2}`;
/** 주의 포인트: 카테고리(총운 포함) × 톤 × 변형 */
export type CautionSlug = `df-ca-${DailyCategory}-${DailyCautionTone}-${V2}`;
/** 오늘의 팁: 일진 지지 × 무드 × 변형 */
export type TipSlug = `df-tp-${DailyBranchSlug}-${DailyTipMood}-${V2}`;
/** 키워드 색 (라벨): 보완 오행 × 4색 */
export type ColorSlug = `df-kc-${DailyElement}-${1 | 2 | 3 | 4}`;
/** 키워드 소품 (라벨): 보완 오행 × 8품 */
export type ItemSlug = `df-ki-${DailyElement}-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
/** 키워드 시간대 (라벨): 지지 12 */
export type TimeSlotSlug = `df-kt-${DailyBranchSlug}`;
/** 키워드 이유: 보완 오행 × 이유 유형 × 변형 */
export type ReasonSlug = `df-kr-${DailyElement}-${DailyReasonKind}-${V2}`;

export type DailySlug =
  | HeadlineSlug
  | EstimatedHeadlineSlug
  | OverallBodySlug
  | CategoryBodySlug
  | VariableSlug
  | CautionSlug
  | TipSlug
  | ColorSlug
  | ItemSlug
  | TimeSlotSlug
  | ReasonSlug;

// ============================================================
// 슬러그 생성 (상수 조합)
// ============================================================

const cartesian = (
  prefix: string,
  axes: readonly (readonly (string | number)[])[]
): string[] =>
  axes.reduce<string[]>(
    (acc, axis) => acc.flatMap((head) => axis.map((v) => `${head}-${v}`)),
    [prefix]
  );

const LEVEL_SLUGS = DAILY_LEVELS.map((l) => `l${l}`) as readonly LevelSlug[];
const COLOR_INDEXES = [1, 2, 3, 4] as const;
const ITEM_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const HEADLINE_SLUGS = cartesian("df-hl", [
  STAR_SLUGS,
  DAILY_BRIGHTNESS_GROUPS,
  V3_LIST,
]) as HeadlineSlug[];
const ESTIMATED_HEADLINE_SLUGS = cartesian("df-hx", [
  DAILY_ELEMENTS,
  DAILY_SIHUA,
  V2_LIST,
]) as EstimatedHeadlineSlug[];
const OVERALL_BODY_SLUGS = cartesian("df-ob", [
  LEVEL_SLUGS,
  DAILY_STAR_GROUPS,
  V2_LIST,
]) as OverallBodySlug[];
const CATEGORY_BODY_SLUGS = cartesian("df-cb", [
  DAILY_SUB_CATEGORIES,
  LEVEL_SLUGS,
  DAILY_SANFANG,
  V3_LIST,
]) as CategoryBodySlug[];
const VARIABLE_SLUGS = cartesian("df-vr", [
  DAILY_SIHUA,
  DAILY_CATEGORIES,
  V2_LIST,
]) as VariableSlug[];
const CAUTION_SLUGS = cartesian("df-ca", [
  DAILY_CATEGORIES,
  DAILY_CAUTION_TONES,
  V2_LIST,
]) as CautionSlug[];
const TIP_SLUGS = cartesian("df-tp", [
  DAILY_BRANCH_SLUGS,
  DAILY_TIP_MOODS,
  V2_LIST,
]) as TipSlug[];
const COLOR_SLUGS = cartesian("df-kc", [
  DAILY_ELEMENTS,
  COLOR_INDEXES,
]) as ColorSlug[];
const ITEM_SLUGS = cartesian("df-ki", [
  DAILY_ELEMENTS,
  ITEM_INDEXES,
]) as ItemSlug[];
const TIME_SLOT_SLUGS = cartesian("df-kt", [
  DAILY_BRANCH_SLUGS,
]) as TimeSlotSlug[];
const REASON_SLUGS = cartesian("df-kr", [
  DAILY_ELEMENTS,
  DAILY_REASON_KINDS,
  V2_LIST,
]) as ReasonSlug[];

// ============================================================
// 슬롯 레지스트리
// ============================================================

export const DAILY_SLOT_IDS = [
  "hl",
  "hx",
  "ob",
  "cb",
  "vr",
  "ca",
  "tp",
  "kc",
  "ki",
  "kt",
  "kr",
] as const;
export type DailySlotId = (typeof DAILY_SLOT_IDS)[number];

export interface DailySlotInfo<S extends DailySlug> {
  /** 슬롯 설명 (사람용) */
  description: string;
  /** 키 축 (사람용) */
  axes: string;
  /** 슬롯의 전체 최종 슬러그 */
  slugs: readonly S[];
  /** 같은 키 안의 변형 수 (라벨 슬롯은 1) */
  variants: number;
  /** 문구 최대 글자수 (공백 포함). 사전 길이 검사의 상한 */
  maxChars: number;
  /** sentence: 완결 문장(존댓말) / label: 화면 라벨(명사구) */
  kind: "sentence" | "label";
}

export interface DailySlotRegistry {
  hl: DailySlotInfo<HeadlineSlug>;
  hx: DailySlotInfo<EstimatedHeadlineSlug>;
  ob: DailySlotInfo<OverallBodySlug>;
  cb: DailySlotInfo<CategoryBodySlug>;
  vr: DailySlotInfo<VariableSlug>;
  ca: DailySlotInfo<CautionSlug>;
  tp: DailySlotInfo<TipSlug>;
  kc: DailySlotInfo<ColorSlug>;
  ki: DailySlotInfo<ItemSlug>;
  kt: DailySlotInfo<TimeSlotSlug>;
  kr: DailySlotInfo<ReasonSlug>;
}

export const DAILY_SLOTS: DailySlotRegistry = {
  hl: {
    description: "오늘의 한 줄 (시간 확정)",
    axes: "流日 명궁 주성 14 × 밝기군 3 × 변형 3",
    slugs: HEADLINE_SLUGS,
    variants: DAILY_VARIANT_COUNT.hl,
    maxChars: 40,
    kind: "sentence",
  },
  hx: {
    description: "오늘의 한 줄 (시간 미상, 시간 독립 신호)",
    axes: "일진 오행 5 × 일간 사화 4 × 변형 2",
    slugs: ESTIMATED_HEADLINE_SLUGS,
    variants: DAILY_VARIANT_COUNT.hx,
    maxChars: 40,
    kind: "sentence",
  },
  ob: {
    description: "총운 본문 (시간 미상도 재사용)",
    axes: "등급 5 × 성향군 7 × 변형 2",
    slugs: OVERALL_BODY_SLUGS,
    variants: DAILY_VARIANT_COUNT.ob,
    maxChars: 70,
    kind: "sentence",
  },
  cb: {
    description: "카테고리 본문 (애정·재물·일학업·건강, 시간 미상도 재사용)",
    axes: "카테고리 4 × 등급 5 × 삼방 평가 3 × 변형 3",
    slugs: CATEGORY_BODY_SLUGS,
    variants: DAILY_VARIANT_COUNT.cb,
    maxChars: 60,
    kind: "sentence",
  },
  vr: {
    description: "일간 사화 변수 문장",
    axes: "사화 4 × 카테고리 5 × 변형 2",
    slugs: VARIABLE_SLUGS,
    variants: DAILY_VARIANT_COUNT.vr,
    maxChars: 50,
    kind: "sentence",
  },
  ca: {
    description: "오늘의 주의 포인트 (가장 낮은 카테고리 기준)",
    axes: "카테고리 5 × 톤 2 × 변형 2",
    slugs: CAUTION_SLUGS,
    variants: DAILY_VARIANT_COUNT.ca,
    maxChars: 60,
    kind: "sentence",
  },
  tp: {
    description: "오늘의 팁",
    axes: "일진 지지 12 × 무드 2 × 변형 2",
    slugs: TIP_SLUGS,
    variants: DAILY_VARIANT_COUNT.tp,
    maxChars: 40,
    kind: "sentence",
  },
  kc: {
    description: "예고 키워드: 색 (이름 라벨)",
    axes: "보완 오행 5 × 4색",
    slugs: COLOR_SLUGS,
    variants: 1,
    maxChars: 8,
    kind: "label",
  },
  ki: {
    description: "예고 키워드: 소품 (라벨)",
    axes: "보완 오행 5 × 8품",
    slugs: ITEM_SLUGS,
    variants: 1,
    maxChars: 14,
    kind: "label",
  },
  kt: {
    description: "예고 키워드: 시간대 (라벨)",
    axes: "지지 12",
    slugs: TIME_SLOT_SLUGS,
    variants: 1,
    maxChars: 16,
    kind: "label",
  },
  kr: {
    description: "예고 키워드 이유 (색·소품이 왜 도움이 되는지)",
    axes: "보완 오행 5 × 이유 유형 4 × 변형 2",
    slugs: REASON_SLUGS,
    variants: DAILY_VARIANT_COUNT.kr,
    maxChars: 50,
    kind: "sentence",
  },
};

// ============================================================
// 카탈로그 API
// ============================================================

/** 전체 슬러그 (슬롯 순서 고정). 테스트·사전 전수 매칭용 */
export const ALL_DAILY_SLUGS: readonly DailySlug[] = DAILY_SLOT_IDS.flatMap(
  (id) => DAILY_SLOTS[id].slugs as readonly DailySlug[]
);

const DAILY_SLUG_TO_SLOT: ReadonlyMap<string, DailySlotId> = new Map(
  DAILY_SLOT_IDS.flatMap((id) =>
    (DAILY_SLOTS[id].slugs as readonly string[]).map(
      (slug) => [slug, id] as const
    )
  )
);

/** 어떤 슬롯의 슬러그든 카탈로그에 존재하는지 (공유 토큰 1차 검증) */
export const isDailySlug = (value: unknown): value is DailySlug =>
  typeof value === "string" && DAILY_SLUG_TO_SLOT.has(value);

/** 슬러그가 속한 슬롯. 카탈로그에 없으면 null */
export const getDailySlotOf = (value: string): DailySlotId | null =>
  DAILY_SLUG_TO_SLOT.get(value) ?? null;

type SlugOfSlot<K extends DailySlotId> = DailySlotRegistry[K]["slugs"][number];

/**
 * 슬러그가 특정 슬롯에 속하는지 (공유 토큰의 필드별 검증).
 * 예: headline 필드에는 `hl` 또는 `hx` 슬러그만 허용해야 한다.
 */
export const isDailySlugOfSlot = <K extends DailySlotId>(
  slot: K,
  value: unknown
): value is SlugOfSlot<K> =>
  typeof value === "string" && DAILY_SLUG_TO_SLOT.get(value) === slot;

export const isDailyCategory = (value: unknown): value is DailyCategory =>
  (DAILY_CATEGORIES as readonly unknown[]).includes(value);

export const isDailyLevel = (value: unknown): value is DailyLevel =>
  (DAILY_LEVELS as readonly unknown[]).includes(value);

// ============================================================
// 슬러그 빌더 (엔진용, 템플릿 타입 보장)
// ============================================================

export const buildHeadlineSlug = (
  star: DailyStarSlug,
  group: BrightnessGroup,
  variant: V3
): HeadlineSlug => `df-hl-${star}-${group}-${variant}`;

export const buildEstimatedHeadlineSlug = (
  element: DailyElement,
  sihua: DailySihuaSlug,
  variant: V2
): EstimatedHeadlineSlug => `df-hx-${element}-${sihua}-${variant}`;

export const buildOverallBodySlug = (
  level: DailyLevel,
  group: DailyStarGroup,
  variant: V2
): OverallBodySlug => `df-ob-l${level}-${group}-${variant}`;

export const buildCategoryBodySlug = (
  category: DailySubCategory,
  level: DailyLevel,
  sanfang: DailySanfang,
  variant: V3
): CategoryBodySlug => `df-cb-${category}-l${level}-${sanfang}-${variant}`;

export const buildVariableSlug = (
  sihua: DailySihuaSlug,
  category: DailyCategory,
  variant: V2
): VariableSlug => `df-vr-${sihua}-${category}-${variant}`;

export const buildCautionSlug = (
  category: DailyCategory,
  tone: DailyCautionTone,
  variant: V2
): CautionSlug => `df-ca-${category}-${tone}-${variant}`;

export const buildTipSlug = (
  branch: DailyBranchSlug,
  mood: DailyTipMood,
  variant: V2
): TipSlug => `df-tp-${branch}-${mood}-${variant}`;

export const buildColorSlug = (
  element: DailyElement,
  index: 1 | 2 | 3 | 4
): ColorSlug => `df-kc-${element}-${index}`;

export const buildItemSlug = (
  element: DailyElement,
  index: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
): ItemSlug => `df-ki-${element}-${index}`;

export const buildTimeSlotSlug = (branch: DailyBranchSlug): TimeSlotSlug =>
  `df-kt-${branch}`;

export const buildReasonSlug = (
  element: DailyElement,
  kind: DailyReasonKind,
  variant: V2
): ReasonSlug => `df-kr-${element}-${kind}-${variant}`;

export type { V2 as DailyVariantV2, V3 as DailyVariantV3 };

// ============================================================
// 카테고리별 제네릭 빌더 (엔진용 — 카테고리와 슬러그의 불일치를 컴파일 타임에 차단)
// ============================================================

export const buildCategoryBodySlugOf = <C extends DailySubCategory>(
  category: C,
  level: DailyLevel,
  sanfang: DailySanfang,
  variant: V3
): Extract<CategoryBodySlug, `df-cb-${C}-${string}`> =>
  buildCategoryBodySlug(category, level, sanfang, variant) as Extract<
    CategoryBodySlug,
    `df-cb-${C}-${string}`
  >;

export const buildCautionSlugOf = <C extends DailyCategory>(
  category: C,
  tone: DailyCautionTone,
  variant: V2
): Extract<CautionSlug, `df-ca-${C}-${string}`> =>
  buildCautionSlug(category, tone, variant) as Extract<
    CautionSlug,
    `df-ca-${C}-${string}`
  >;

// ============================================================
// 엔진 상수 (1단계: calculators/daily-fortune.ts)
// ============================================================
// 이 아래 값은 슬러그 계약이 아니라 계산 상수다. 바꾸면 같은 날 결과가 달라지므로
// 변경은 KST 자정 직후 배포하고 시뮬레이션(scripts/daily-fortune/simulate.ts)을 다시 돌린다.

/** 사화 종류 (일간 사화 슬러그와 같은 순서: 록·권·과·기) */
export type DailySihuaKind = DailySihuaSlug;

/** 사화 한 건의 기본 점수 (역할 궁 삼방사정에 걸렸을 때, 본궁 기준) */
export const DAILY_SIHUA_VALUE: Record<DailySihuaKind, number> = {
  rok: 9,
  gwon: 6,
  gwa: 4,
  gi: -10,
};

/** 사화 층별 가중 (PRD 규칙 3: 일간 1.0 주동력, 나머지는 배경) */
export const DAILY_LAYER_WEIGHT = {
  day: 1.0,
  month: 0.6,
  year: 0.5,
  dayun: 0.3,
} as const;

/** 사화 별이 역할 궁의 어느 위치에 앉았는가 → 영향 비율 */
export const DAILY_RELATION_FACTOR = {
  self: 1.0,
  opposite: 0.8,
  triangle: 0.6,
} as const;

/** 구조(밝기·보조성) 평가의 삼방사정 가중 (합 = 1.0) */
export const DAILY_STRUCTURE_WEIGHT = {
  self: 0.4,
  opposite: 0.25,
  triangle: 0.175,
} as const;

/** 개인 편향(본명 구조 점수)의 스케일과 클램프 (PRD 규칙 5: ±6) */
export const DAILY_BIAS = {
  scale: 9,
  clamp: 6,
  /** 借對宮 차용 주성은 본궁 주성보다 약하게 반영 */
  borrowedFactor: 0.7,
  /** 보조 길성/살성 한 개당 궁 점수 (±1 범위 점수 기준) */
  minorUnit: 0.25,
  /** 궁 하나에서 보조성 순효과의 상한 개수 */
  minorCap: 2,
} as const;

export const DAILY_LUCKY_MINOR_STARS: readonly string[] = [
  "좌보",
  "우필",
  "문창",
  "문곡",
  "천괴",
  "천월",
  "록존",
];

export const DAILY_HARSH_MINOR_STARS: readonly string[] = [
  "화성",
  "영성",
  "양인",
  "타라",
  "지겁",
  "지공",
];

/** 시간 미상: 12시진 명반 평균 후 수축 계수 (PRD 규칙 8) */
export const DAILY_ESTIMATED_SHRINK = 0.6;

/** 시간 미상 변수 문장: 12시진 중 이 비율 이상(평균 영향 비율)일 때만 낸다 */
export const DAILY_ESTIMATED_VARIABLE_MIN_FACTOR = 0.4;

/** 流日 명궁에서 카테고리 역할 궁까지의 지지 이동량 (반시계, 궁 순서 기준) */
export const DAILY_ROLE_OFFSET: Record<DailyCategory, number> = {
  overall: 0,
  love: -2,
  money: -4,
  health: -5,
  work: -8,
};

/** 극단 등급 연속 완화 기준 일수 (3일째에 한 단계 완화) */
export const DAILY_EXTREME_STREAK = 3;

/** 변형 선택 전략 (기본 hash — PRD 규칙 7) */
export type DailyVariantStrategy = "hash" | "cycle";

/** 시간 미상 12시진 대표 시각 (자시는 00:00 쪽 시진) */
export const DAILY_TIME_BRANCH_CLOCKS = [
  "00:00",
  "02:00",
  "04:00",
  "06:00",
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
] as const;

// ------------------------------------------------------------
// 오행 · 보완 오행 관계표
// ------------------------------------------------------------

/** 천간 → 오행 (갑을 목, 병정 화, 무기 토, 경신 금, 임계 수) */
export const DAILY_STEM_ELEMENT: readonly DailyElement[] = [
  "wood",
  "wood",
  "fire",
  "fire",
  "earth",
  "earth",
  "metal",
  "metal",
  "water",
  "water",
];

/** 한글 오행(납음 테이블 표기) → 오행 슬러그 */
export const DAILY_KO_ELEMENT: Record<string, DailyElement> = {
  목: "wood",
  화: "fire",
  토: "earth",
  금: "metal",
  수: "water",
};

/** 오행국 수 → 본명 오행 (2수 3목 4금 5토 6화) */
export const DAILY_JU_ELEMENT: Record<2 | 3 | 4 | 5 | 6, DailyElement> = {
  2: "water",
  3: "wood",
  4: "metal",
  5: "earth",
  6: "fire",
};

/** 상생: 키가 값을 낳는다 */
export const DAILY_ELEMENT_GENERATES: Record<DailyElement, DailyElement> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

/** 상극: 키가 값을 이긴다 */
export const DAILY_ELEMENT_CONTROLS: Record<DailyElement, DailyElement> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

export interface DailyComplement {
  /** 보완 오행 (색·소품 풀의 오행) */
  element: DailyElement;
  /** 이유 유형 */
  kind: DailyReasonKind;
}

/**
 * 보완 오행 관계표: 본명 오행(self) × 오늘 일간 오행(day) → 보완 오행·이유 유형.
 * 내부 명칭은 "용신"이 아니라 "보완 오행"이다 (표면 노출 금지).
 *
 * - 같은 오행(비화)            : 같은 결을 맞춘다 → match, 보완 = self
 * - day가 self를 낳음(생입)    : 기운을 북돋운다 → nourish, 보완 = day
 * - self가 day를 낳음(설기)    : 소진을 채운다   → nourish, 보완 = self를 낳는 오행
 * - self가 day를 이김(재)      : 힘을 덜어 준다  → release, 보완 = self가 낳는 오행
 * - day가 self를 이김(관, 압박): 누그러뜨린다    → temper, 보완 = day가 낳는 오행(통관)
 */
const deriveComplement = (
  self: DailyElement,
  day: DailyElement
): DailyComplement => {
  if (self === day) return { element: self, kind: "match" };
  if (DAILY_ELEMENT_GENERATES[day] === self) {
    return { element: day, kind: "nourish" };
  }
  if (DAILY_ELEMENT_GENERATES[self] === day) {
    const generator = DAILY_ELEMENTS.find(
      (e) => DAILY_ELEMENT_GENERATES[e] === self
    ) as DailyElement;
    return { element: generator, kind: "nourish" };
  }
  if (DAILY_ELEMENT_CONTROLS[self] === day) {
    return { element: DAILY_ELEMENT_GENERATES[self], kind: "release" };
  }
  return { element: DAILY_ELEMENT_GENERATES[day], kind: "temper" };
};

export const DAILY_COMPLEMENT_TABLE: Record<
  DailyElement,
  Record<DailyElement, DailyComplement>
> = Object.fromEntries(
  DAILY_ELEMENTS.map((self) => [
    self,
    Object.fromEntries(
      DAILY_ELEMENTS.map((day) => [day, deriveComplement(self, day)])
    ),
  ])
) as Record<DailyElement, Record<DailyElement, DailyComplement>>;

/**
 * 하도 생수/성수 (1~9 한 자리). 토의 성수 10은 한 자리가 아니라 제외하고 5만 쓴다.
 */
export const DAILY_ELEMENT_DIGITS: Record<
  DailyElement,
  readonly [DailyDigitValue] | readonly [DailyDigitValue, DailyDigitValue]
> = {
  water: [1, 6],
  fire: [2, 7],
  wood: [3, 8],
  metal: [4, 9],
  earth: [5],
};
export type DailyDigitValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// ------------------------------------------------------------
// 분위 컷 (시뮬레이션으로 도출·고정 — scripts/daily-fortune/simulate.ts)
// ------------------------------------------------------------

/**
 * 등급 컷: points < cut[0] → 1, < cut[1] → 2, < cut[2] → 3, < cut[3] → 4, 그 외 5.
 * 목표 분포 10/25/30/25/10 (PRD 확정 13).
 */
export type DailyLevelCuts = readonly [number, number, number, number];

export const DAILY_LEVEL_CUTS: Record<DailyCategory, DailyLevelCuts> = {
  overall: [-4.9, 2.3, 9.0, 17.0],
  love: [-4.9, 2.3, 9.0, 17.0],
  money: [-4.9, 2.4, 9.0, 17.0],
  work: [-4.8, 2.4, 9.0, 17.0],
  health: [-4.9, 2.3, 9.0, 17.0],
};

/**
 * 모집단 중심: 시간 확정 점수의 중앙값(카테고리별). 시간 미상 수축(0.6배)의 기준점이다.
 * 0이 아니라 모집단 중심으로 수축해야 시간 미상이 한쪽 등급으로 쏠리지 않는다.
 */
export const DAILY_POINT_CENTER: Record<DailyCategory, number> = {
  overall: 5.6,
  love: 5.6,
  money: 5.6,
  work: 5.6,
  health: 5.6,
};

/** 시간 미상 전용 컷: 모집단 중심 수축(0.6) 후 점수의 10/35/65/90 분위. 수축 계수를 바꾸면 재도출한다. */
export const DAILY_LEVEL_CUTS_ESTIMATED: Record<DailyCategory, DailyLevelCuts> =
  {
    overall: [2.6, 4.8, 6.6, 8.9],
    love: [2.6, 4.8, 6.6, 8.8],
    money: [2.6, 4.8, 6.6, 8.9],
    work: [2.7, 4.8, 6.6, 8.9],
    health: [2.6, 4.8, 6.6, 8.9],
  };

/**
 * 시간 미상 등급화 방식.
 * - "shrink-exact-cuts": PRD 문자 그대로. 0.6 수축 점수를 시간 확정 컷으로 등급화.
 *   실측 분포 0/6/84/9/0 (84%가 "잔잔한 날")이라 기본값이 아니다.
 * - "own-cuts": 시간 미상 모집단 자기 분위로 등급화 (분포 10/25/30/25/10 유지, 수축 무효화)
 * - "own-cuts-compress": own-cuts 후 극단(1·5)만 한 단계 안쪽으로 수축 — 분포 대략
 *   0/32/31/37/0. 저신뢰 결과가 극단을 단정하지 않는다는 수축의 취지를 등급 공간에서 보존.
 */
export type DailyEstimatedLevelMode =
  | "shrink-exact-cuts"
  | "own-cuts"
  | "own-cuts-compress";

export const DAILY_ESTIMATED_LEVEL_MODE: DailyEstimatedLevelMode =
  "own-cuts-compress" as DailyEstimatedLevelMode;

export const DAILY_SANFANG_CUTS_ESTIMATED: readonly [number, number] = [
  -0.5, 1.3,
];

/** 삼방 평가 컷: raw 구조 점수 < cut[0] → burden, ≥ cut[1] → support, 그 사이 steady */
export const DAILY_SANFANG_CUTS: readonly [number, number] = [-0.9, 2.3];
