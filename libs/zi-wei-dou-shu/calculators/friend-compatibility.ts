import {
  FRIEND_COMPATIBILITY_BASE_SCORE,
  FRIEND_COMPATIBILITY_MATRIX_VERSION,
  FRIEND_COMPATIBILITY_MAX_SCORE,
  FRIEND_COMPATIBILITY_MIN_SCORE,
  FRIEND_COMPATIBILITY_SPREAD,
  FRIEND_COMPATIBILITY_TIERS,
  FRIEND_ONE_LINERS,
  FRIEND_PALACE_STAR_WEIGHT,
  ELEMENT_RELATION_DELTA,
  ELEMENT_RELATION_LABEL,
  MING_STAR_WEIGHT,
  PALACE_RELATION_DELTA,
  PALACE_RELATION_LABEL,
  SIHUA_CROSS_CLAMP,
  SIHUA_CROSS_DELTA,
  SIHUA_CROSS_LABEL,
  STEM_COMBINE_OFFSET,
  STEM_OPPOSE_OFFSET,
  STEM_RELATION_DELTA,
  STEM_RELATION_LABEL,
  UNKNOWN_TIME_FACTOR,
  ZODIAC_RELATION_DELTA,
  ZODIAC_RELATION_LABEL,
  buildNeutralOneLinerId,
  buildOneLinerId,
  type FriendElementRelation,
  type FriendPalaceRelation,
  type FriendStemRelation,
  type FriendZodiacRelation,
} from "../constants/friend-compatibility-table";
import { getStarCompatibility } from "../constants/star-compatibility-table";
import { MAIN_STAR_NAMES, type MainStarName } from "../constants/stars";
import { generateZiweiChart } from "../core";
import { ZiWeiError } from "../errors";
import type {
  BranchIndex,
  CalendarType,
  Palace,
  Sihua,
  StemIndex,
  TimeBranchValue,
  ZiweiChart,
} from "../types";
import { TIME_BRANCHES } from "../types";

import {
  analyzeFiveElementCompatibility,
  analyzeZodiacCompatibility,
} from "./compatibility";
import type { FiveElementCompatibility } from "./compatibility";
import { getEffectiveMainStars } from "./empty-palace";
import {
  BRANCH_TO_ANIMAL,
  SAMHAP_GROUPS,
  YUKHAP_PAIRS,
} from "./yearly-insights";

// ============================================================
// 공개 타입
// ============================================================

/** 시진 또는 "unknown"(태어난 시간 모름) */
export type FriendCompatibilityBirthTime = TimeBranchValue | "unknown";

/**
 * 결과 신뢰 수준.
 * - `exact`: 양쪽 모두 시진이 확정되어 명반이 1개로 특정됨
 * - `estimated`: 한쪽 이상 시간 미상 → 가능한 명반 전수의 기대값
 */
export type FriendCompatibilityConfidence = "exact" | "estimated";

export interface FriendCompatibilityPerson {
  /** "YYYY-MM-DD" */
  birthDate: string;
  /** 시진 ("자" ~ "해") 또는 "unknown" */
  birthTime: FriendCompatibilityBirthTime;
  calendarType: CalendarType;
  isLeapMonth?: boolean;
}

export interface FriendCompatibilityFactor {
  /** 축 이름 (예: "띠 관계") — 8종 고정 문자열 */
  label: string;
  /** 판정 근거 (예: "삼합 — 방향이 같은 띠끼리 뭉치는 관계 (말-호랑이)") */
  detail: string;
  /** 점수 기여도 (+/-). 모든 factor의 delta 합 + 기준 점수 = score */
  delta: number;
}

export interface FriendCompatibilityResult {
  /** 0-100 정수 */
  score: number;
  /** 등급 슬러그 (kebab-case, append-only) */
  tier: string;
  /** 한줄평 템플릿 ID (i18n 키, append-only) */
  oneLinerId: string;
  /** 한국어 한줄평 원문 */
  oneLinerKo: string;
  /** 근거 breakdown (길이 3~8) */
  factors: FriendCompatibilityFactor[];
  /** 시간 미상 여부 */
  confidence: FriendCompatibilityConfidence;
  /** 기대값 계산에 사용된 명반 조합 수 (1 | 12 | 144) */
  chartCombinations: number;
  /** 매트릭스 버전 */
  matrixVersion: string;
}

// ============================================================
// 성별 비의존 보장
// ============================================================

/**
 * 명반 생성 시 넣는 고정 성별.
 *
 * `generateZiweiChart`는 `ZiweiInput.gender`를 필수로 요구하지만,
 * 성별이 실제로 쓰이는 곳은 대운(`calculators/dayun.ts`)의 순행/역행 판정뿐이다.
 * 이 모듈은 대운을 일절 사용하지 않으므로 어떤 값을 넣어도 결과가 같다.
 * (`__tests__/friend-compatibility.test.ts`에서 male/female 동치성을 검증)
 */
const FIXED_GENDER = "male" as const;

/** 명반 생성에만 쓰이는 자리표시자 이름 (결과에 영향 없음) */
const PLACEHOLDER_NAME = "friend";

/**
 * 시진 → 대표 시각(HH:mm).
 * `ZiweiInput.birthTime`이 "HH:mm" 문자열을 받으므로 각 시진 구간의
 * 대표 시각으로 변환한다. `parseTimeToTimeBranch`가 원래 시진을 그대로 복원한다.
 */
const TIME_BRANCH_TO_CLOCK: Record<TimeBranchValue, string> = {
  자: "00:00",
  축: "02:00",
  인: "04:00",
  묘: "06:00",
  진: "08:00",
  사: "10:00",
  오: "12:00",
  미: "14:00",
  신: "16:00",
  유: "18:00",
  술: "20:00",
  해: "22:00",
};

/** 12시진 전체 (시간 미상일 때 전수 열거용) */
const ALL_TIME_BRANCHES: readonly TimeBranchValue[] = TIME_BRANCHES.map(
  (entry) => entry.value
);

const buildChart = (
  person: FriendCompatibilityPerson,
  timeBranch: TimeBranchValue
): ZiweiChart => {
  const clock = TIME_BRANCH_TO_CLOCK[timeBranch];

  if (!clock) {
    throw new ZiWeiError("출생 시진 값이 올바르지 않습니다.", {
      code: "INVALID_TIME",
      field: "birthTime",
    });
  }

  return generateZiweiChart({
    name: PLACEHOLDER_NAME,
    birthDate: person.birthDate,
    birthTime: clock,
    gender: FIXED_GENDER,
    calendarType: person.calendarType,
    isLeapMonth: person.isLeapMonth ?? false,
  });
};

/**
 * 후보 명반 목록.
 *
 * @description
 * 시진을 알면 명반은 1개로 확정된다.
 * 모르면 전통 정시법(定時法)이 12개 명반을 모두 세워두고 좁히는 것에 착안해,
 * 12개를 동등 가중으로 전부 세운 뒤 기대값을 낸다.
 * 임의의 한 시진을 정답인 척 고르지 않는다.
 */
const buildCandidateCharts = (
  person: FriendCompatibilityPerson
): ZiweiChart[] => {
  if (person.birthTime === "unknown") {
    return ALL_TIME_BRANCHES.map((timeBranch) =>
      buildChart(person, timeBranch)
    );
  }

  return [buildChart(person, person.birthTime)];
};

// ============================================================
// 축별 판정
// ============================================================

/** 띠(생년 지지) 관계 — 기존 `analyzeZodiacCompatibility` 결과를 8분류로 정규화 */
const resolveZodiacRelation = (
  branchA: BranchIndex,
  branchB: BranchIndex
): FriendZodiacRelation => {
  const zodiac = analyzeZodiacCompatibility(branchA, branchB);

  if (zodiac.relationship === "none") {
    return branchA === branchB ? "same-sign" : "neutral";
  }

  return zodiac.relationship;
};

/** 오행국 관계 — 방향(누가 생/극하는가)을 지운 대칭 3분류 */
const toElementRelation = (
  relationship: FiveElementCompatibility["relationship"]
): FriendElementRelation => {
  if (relationship === "same") return "same";
  if (relationship === "generating" || relationship === "being_generated") {
    return "generate";
  }
  return "overcome";
};

/** 명궁 지지 간 자리 관계 */
const resolvePalaceRelation = (
  mingA: BranchIndex,
  mingB: BranchIndex
): FriendPalaceRelation => {
  if (mingA === mingB) return "same";

  if (SAMHAP_GROUPS.some((g) => g.includes(mingA) && g.includes(mingB))) {
    return "samhap";
  }

  if (YUKHAP_PAIRS[mingA] === mingB) return "yukhap";

  if ((mingA + 6) % 12 === mingB) return "opposite";

  return "neutral";
};

/** 생년 천간 관계 */
const resolveStemRelation = (
  stemA: StemIndex,
  stemB: StemIndex
): FriendStemRelation => {
  const gap = Math.abs(stemA - stemB);

  if (gap === STEM_COMBINE_OFFSET) return "combine";
  if (gap === STEM_OPPOSE_OFFSET) return "oppose";
  return "neutral";
};

// ============================================================
// 주성 상성
// ============================================================

const isMainStarName = (name: string): name is MainStarName =>
  (MAIN_STAR_NAMES as readonly string[]).includes(name);

const findPalace = (chart: ZiweiChart, palaceName: string): Palace => {
  const palace = chart.palaces.find((p) => p.name === palaceName);

  if (!palace) {
    throw new ZiWeiError("명반에서 궁을 찾을 수 없습니다.", {
      code: "CALCULATION_ERROR",
      field: palaceName,
    });
  }

  return palace;
};

/** 궁의 실효 주성 이름 목록 (空宮이면 借對宮으로 차용한 주성) */
const getPalaceMainStarNames = (
  chart: ZiweiChart,
  palaceName: string
): MainStarName[] =>
  getEffectiveMainStars(findPalace(chart, palaceName))
    .map((star) => star.name)
    .filter(isMainStarName);

/** 두 주성 집합의 교차 상성 평균 오프셋 (교차 전수 평균이므로 대칭) */
const averageStarOffset = (
  starsA: MainStarName[],
  starsB: MainStarName[]
): number => {
  if (starsA.length === 0 || starsB.length === 0) return 0;

  let total = 0;
  for (const a of starsA) {
    for (const b of starsB) {
      total += getStarCompatibility(a, b).scoreOffset;
    }
  }

  return total / (starsA.length * starsB.length);
};

/**
 * 교차 상성 요약 문구 (가장 대표적인 조합 1개).
 *
 * @대칭성 조합을 이름 정렬한 정규 키로 만든 뒤
 * (|오프셋| 내림차순, 키 오름차순)으로 정렬해 첫 항목을 고른다.
 * → owner/guest 순서를 바꿔도 같은 문구가 나온다.
 */
const describeStarPair = (
  starsA: MainStarName[],
  starsB: MainStarName[]
): string => {
  if (starsA.length === 0 || starsB.length === 0) {
    return "주성 조합 없음";
  }

  const pairs = starsA.flatMap((a) =>
    starsB.map((b) => ({
      key: [a, b].sort().join(" + "),
      offset: getStarCompatibility(a, b).scoreOffset,
    }))
  );

  const sorted = [...pairs].sort((x, y) => {
    const byOffset = Math.abs(y.offset) - Math.abs(x.offset);
    return byOffset !== 0 ? byOffset : x.key.localeCompare(y.key);
  });

  return sorted[0].key;
};

// ============================================================
// 사화 교차 (飛化)
// ============================================================

/** 동률 시 대표 사화를 고르는 고정 순서 (대칭성 보장용) */
const SIHUA_ORDER: readonly Sihua[] = ["화록", "화권", "화과", "화기"];

/** source의 연간 사화가 target 명궁의 별에 떨어졌는지 */
const findSihuaHits = (source: ZiweiChart, target: ZiweiChart): Sihua[] => {
  const mingGong = findPalace(target, "명궁");
  const starNames = new Set<string>([
    ...getEffectiveMainStars(mingGong).map((star) => star.name),
    ...mingGong.minorStars.map((star) => star.name),
  ]);

  const candidates: Array<[Sihua, string]> = [
    ["화록", source.sihua.hualu],
    ["화권", source.sihua.huaquan],
    ["화과", source.sihua.huake],
    ["화기", source.sihua.huaji],
  ];

  return candidates.filter(([, star]) => starNames.has(star)).map(([k]) => k);
};

// ============================================================
// 한 쌍(명반 A × 명반 B) 분석
// ============================================================

/** 명반 한 쌍에서 뽑아낸 축별 원(raw) 기여도와 판정 결과 */
interface AxisSample {
  zodiacRelation: FriendZodiacRelation;
  elementRelation: FriendElementRelation;
  palaceRelation: FriendPalaceRelation;
  stemRelation: FriendStemRelation;
  elementPair: string;
  animalPair: string;
  mingStarPair: string;
  dominantSihua: Sihua | null;
  zodiacRaw: number;
  elementRaw: number;
  palaceRaw: number;
  mingStarRaw: number;
  friendStarRaw: number;
  sihuaRaw: number;
  stemRaw: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * 명반 한 쌍의 6축을 계산한다.
 *
 * @대칭성 `analyzePair(a, b)`와 `analyzePair(b, a)`는 모든 필드가 동일하다.
 * 방향성이 있는 오행 생극·사화 비화는 여기서 이미 대칭화된다.
 */
const analyzePair = (chartA: ZiweiChart, chartB: ZiweiChart): AxisSample => {
  const zodiacRelation = resolveZodiacRelation(
    chartA.lunarDate.yearBranch,
    chartB.lunarDate.yearBranch
  );
  const animalPair = [
    BRANCH_TO_ANIMAL[chartA.lunarDate.yearBranch].ko,
    BRANCH_TO_ANIMAL[chartB.lunarDate.yearBranch].ko,
  ]
    .sort()
    .join("-");

  const fiveElement = analyzeFiveElementCompatibility(
    chartA.wuxingJu,
    chartB.wuxingJu
  );
  const elementRelation = toElementRelation(fiveElement.relationship);
  const elementPair = [fiveElement.elementA, fiveElement.elementB]
    .sort()
    .join("-");

  const palaceRelation = resolvePalaceRelation(
    chartA.mingGong,
    chartB.mingGong
  );
  const stemRelation = resolveStemRelation(
    chartA.lunarDate.yearStem,
    chartB.lunarDate.yearStem
  );

  const aMingStars = getPalaceMainStarNames(chartA, "명궁");
  const bMingStars = getPalaceMainStarNames(chartB, "명궁");
  const aFriendStars = getPalaceMainStarNames(chartA, "교우궁");
  const bFriendStars = getPalaceMainStarNames(chartB, "교우궁");

  const hits = [
    ...findSihuaHits(chartA, chartB),
    ...findSihuaHits(chartB, chartA),
  ];

  // 대칭 보장: (|기여도| 내림차순, 사화 고정 순서)로 정렬해 대표를 고른다.
  const [dominantSihua] = [...hits].sort((x, y) => {
    const byWeight =
      Math.abs(SIHUA_CROSS_DELTA[y]) - Math.abs(SIHUA_CROSS_DELTA[x]);
    return byWeight !== 0
      ? byWeight
      : SIHUA_ORDER.indexOf(x) - SIHUA_ORDER.indexOf(y);
  });

  return {
    zodiacRelation,
    elementRelation,
    palaceRelation,
    stemRelation,
    elementPair,
    animalPair,
    mingStarPair: describeStarPair(aMingStars, bMingStars),
    dominantSihua: dominantSihua ?? null,
    zodiacRaw: ZODIAC_RELATION_DELTA[zodiacRelation],
    elementRaw: ELEMENT_RELATION_DELTA[elementRelation],
    palaceRaw: PALACE_RELATION_DELTA[palaceRelation],
    mingStarRaw: averageStarOffset(aMingStars, bMingStars) * MING_STAR_WEIGHT,
    friendStarRaw:
      ((averageStarOffset(aFriendStars, bMingStars) +
        averageStarOffset(bFriendStars, aMingStars)) /
        2) *
      FRIEND_PALACE_STAR_WEIGHT,
    sihuaRaw: clamp(
      hits.reduce((sum, hit) => sum + SIHUA_CROSS_DELTA[hit], 0),
      -SIHUA_CROSS_CLAMP,
      SIHUA_CROSS_CLAMP
    ),
    stemRaw: STEM_RELATION_DELTA[stemRelation],
  };
};

// ============================================================
// 집계 유틸
// ============================================================

/**
 * 최빈값(mode)을 고른다. 동률은 `compareTie`로 결정론적으로 깬다.
 *
 * @대칭성 입력이 같은 다중집합(multiset)이면 순서와 무관하게 같은 값을 돌려준다.
 */
const pickModal = <T extends string>(
  values: readonly T[],
  compareTie: (a: T, b: T) => number
): T => {
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort(
    (x, y) => y[1] - x[1] || compareTie(x[0], y[0])
  );

  return sorted[0][0];
};

const byLexical = (a: string, b: string): number => a.localeCompare(b);

const ELEMENT_ORDER: readonly FriendElementRelation[] = [
  "generate",
  "same",
  "overcome",
];

const PALACE_ORDER: readonly FriendPalaceRelation[] = [
  "same",
  "samhap",
  "yukhap",
  "opposite",
  "neutral",
];

/** 원(raw) 기여도를 확산 계수로 스케일링해 정수 delta로 변환 */
const toDelta = (rawDelta: number): number =>
  Math.round(rawDelta * FRIEND_COMPATIBILITY_SPREAD);

const average = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const resolveTier = (score: number): string => {
  const matched = FRIEND_COMPATIBILITY_TIERS.find(
    (t) => score >= t.minScore && score <= t.maxScore
  );

  // 등급표가 0~100을 빈틈없이 덮으므로 도달 불가. 방어가 아니라 타입 좁히기용.
  if (!matched) {
    throw new ZiWeiError("궁합 등급을 결정할 수 없습니다.", {
      code: "CALCULATION_ERROR",
      field: "score",
    });
  }

  return matched.tier;
};

// ============================================================
// 메인 엔트리
// ============================================================

/**
 * 친구 우주 궁합 점수/한줄평을 결정론적으로 산출한다.
 *
 * @description
 * - LLM 호출 없음. 모든 값은 `constants/friend-compatibility-table.ts`에서 나온다.
 * - 순수 함수 — 동일 입력 → 항상 동일 출력 (Math.random / Date.now 미사용).
 * - 성별 비의존 — 대운/유년 순역행을 일절 쓰지 않는다.
 * - 대칭 — `calculate(A, B)`와 `calculate(B, A)`의 모든 필드가 같다.
 * - 시간 미상 — 해당 인물의 명반 12개를 전부 세워 기대값을 낸다(定時法의 자동화 근사).
 *   양쪽 모두 미상이면 144조합. 임의의 한 시진을 정답으로 고르지 않는다.
 */
export const calculateFriendCompatibility = (
  owner: FriendCompatibilityPerson,
  guest: FriendCompatibilityPerson
): FriendCompatibilityResult => {
  const ownerCharts = buildCandidateCharts(owner);
  const guestCharts = buildCandidateCharts(guest);

  const samples = ownerCharts.flatMap((ownerChart) =>
    guestCharts.map((guestChart) => analyzePair(ownerChart, guestChart))
  );

  const chartCombinations = samples.length;
  const confidence: FriendCompatibilityConfidence =
    chartCombinations === 1 ? "exact" : "estimated";

  // 시진에 따라 달라지는 축은 "특정 관계"를 단정하지 않고 평균임을 밝힌다.
  const estimateNote =
    confidence === "exact"
      ? ""
      : ` (시간 미상 — ${chartCombinations}가지 경우의 평균)`;

  const factors: FriendCompatibilityFactor[] = [];

  // --- 축 1. 띠 관계 (시진 무관 — 생년 지지는 시진에 의존하지 않는다) ---
  // toLunarDate는 birthTime을 쓰지 않으므로 년간/년지는 모든 후보 명반에서 동일하다.
  const [firstSample] = samples;
  const { zodiacRelation, animalPair } = firstSample;

  factors.push({
    label: "띠 관계",
    detail: `${ZODIAC_RELATION_LABEL[zodiacRelation]} (${animalPair})`,
    delta: toDelta(average(samples.map((s) => s.zodiacRaw))),
  });

  // --- 축 2. 오행 기운 (시진 의존) ---
  const elementRelation = pickModal(
    samples.map((s) => s.elementRelation),
    (a, b) => ELEMENT_ORDER.indexOf(a) - ELEMENT_ORDER.indexOf(b)
  );
  const elementPair = pickModal(
    samples.map((s) => s.elementPair),
    byLexical
  );

  factors.push({
    label: "오행 기운",
    detail: `${ELEMENT_RELATION_LABEL[elementRelation]} (${elementPair})${estimateNote}`,
    delta: toDelta(average(samples.map((s) => s.elementRaw))),
  });

  // --- 축 3. 명궁 자리 (시진 의존) ---
  const palaceRelation = pickModal(
    samples.map((s) => s.palaceRelation),
    (a, b) => PALACE_ORDER.indexOf(a) - PALACE_ORDER.indexOf(b)
  );

  factors.push({
    label: "명궁 자리",
    detail: `${PALACE_RELATION_LABEL[palaceRelation]}${estimateNote}`,
    delta: toDelta(average(samples.map((s) => s.palaceRaw))),
  });

  // --- 축 4-1. 타고난 성향 (명궁 × 명궁 주성, 시진 의존) ---
  const mingStarDelta = toDelta(average(samples.map((s) => s.mingStarRaw)));

  if (mingStarDelta !== 0) {
    const mingStarPair = pickModal(
      samples.map((s) => s.mingStarPair),
      byLexical
    );

    factors.push({
      label: "타고난 성향",
      detail: `${mingStarPair} 조합${estimateNote}`,
      delta: mingStarDelta,
    });
  }

  // --- 축 4-2. 친구 자리 (교우궁 × 상대 명궁, 시진 의존) ---
  const friendStarDelta = toDelta(average(samples.map((s) => s.friendStarRaw)));

  if (friendStarDelta !== 0) {
    factors.push({
      label: "친구 자리",
      detail:
        (friendStarDelta > 0
          ? "서로를 친구로 편하게 받아들이는 자리"
          : "친구로 지내는 데 조율이 필요한 자리") + estimateNote,
      delta: friendStarDelta,
    });
  }

  // --- 축 5. 서로에게 주는 영향 (사화 교차, 시진 의존) ---
  const sihuaDelta = toDelta(average(samples.map((s) => s.sihuaRaw)));
  const sihuaHitList = samples
    .map((s) => s.dominantSihua)
    .filter((s): s is Sihua => s !== null);

  if (sihuaDelta !== 0 && sihuaHitList.length > 0) {
    const dominantSihua = pickModal(
      sihuaHitList,
      (a, b) => SIHUA_ORDER.indexOf(a) - SIHUA_ORDER.indexOf(b)
    );

    factors.push({
      label: "서로에게 주는 영향",
      detail: `${SIHUA_CROSS_LABEL[dominantSihua]}${estimateNote}`,
      delta: sihuaDelta,
    });
  }

  // --- 축 6. 태어난 해 기운 (시진 무관) ---
  const stemDelta = toDelta(average(samples.map((s) => s.stemRaw)));

  if (stemDelta !== 0) {
    factors.push({
      label: "태어난 해 기운",
      detail: STEM_RELATION_LABEL[firstSample.stemRelation],
      delta: stemDelta,
    });
  }

  // --- 시간 미상 안내 (점수에 영향 없는 delta 0 항목) ---
  if (confidence === "estimated") {
    factors.push({ ...UNKNOWN_TIME_FACTOR });
  }

  // --- 합산 ---
  const totalDelta = factors.reduce((sum, factor) => sum + factor.delta, 0);
  const score = clamp(
    FRIEND_COMPATIBILITY_BASE_SCORE + totalDelta,
    FRIEND_COMPATIBILITY_MIN_SCORE,
    FRIEND_COMPATIBILITY_MAX_SCORE
  );

  // 띠 관계가 neutral(약 42%, 최빈)이면 명궁 자리 관계로 한 번 더 세분화한
  // 슬러그를 쓴다 — 점수는 그대로, 한줄평 선택만 더 세밀해진다 (fu-1.2.0).
  const oneLinerId =
    zodiacRelation === "neutral"
      ? buildNeutralOneLinerId(elementRelation, palaceRelation)
      : buildOneLinerId(zodiacRelation, elementRelation);
  const oneLiner = FRIEND_ONE_LINERS[oneLinerId];

  if (!oneLiner) {
    throw new ZiWeiError("한줄평 템플릿을 찾을 수 없습니다.", {
      code: "CALCULATION_ERROR",
      field: oneLinerId,
    });
  }

  return {
    score,
    tier: resolveTier(score),
    oneLinerId,
    oneLinerKo: oneLiner.ko,
    factors,
    confidence,
    chartCombinations,
    matrixVersion: FRIEND_COMPATIBILITY_MATRIX_VERSION,
  };
};
