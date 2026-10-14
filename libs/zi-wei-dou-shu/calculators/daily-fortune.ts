import KoreanLunarCalendar from "korean-lunar-calendar";

import { BRIGHTNESS_SCORE, SIHUA_TABLE } from "../constants";
import {
  DAILY_BIAS,
  DAILY_COMPLEMENT_TABLE,
  DAILY_ELEMENT_DIGITS,
  DAILY_ESTIMATED_SHRINK,
  DAILY_ESTIMATED_VARIABLE_MIN_FACTOR,
  DAILY_EXTREME_STREAK,
  DAILY_HARSH_MINOR_STARS,
  DAILY_JU_ELEMENT,
  DAILY_KO_ELEMENT,
  DAILY_LAYER_WEIGHT,
  DAILY_LEVEL_CUTS,
  DAILY_LEVEL_CUTS_ESTIMATED,
  DAILY_ESTIMATED_LEVEL_MODE,
  DAILY_POINT_CENTER,
  DAILY_SANFANG_CUTS_ESTIMATED,
  DAILY_LUCKY_MINOR_STARS,
  DAILY_RELATION_FACTOR,
  DAILY_ROLE_OFFSET,
  DAILY_SANFANG_CUTS,
  DAILY_SIHUA,
  DAILY_SIHUA_VALUE,
  DAILY_STAR_GROUP_OF,
  DAILY_STAR_GROUPS,
  DAILY_STAR_SLUG,
  DAILY_STEM_ELEMENT,
  DAILY_STRUCTURE_WEIGHT,
  DAILY_TIME_BRANCH_CLOCKS,
  DAILY_CATEGORIES,
  branchToSlug,
  buildCategoryBodySlugOf,
  buildCautionSlugOf,
  buildColorSlug,
  buildEstimatedHeadlineSlug,
  buildHeadlineSlug,
  buildItemSlug,
  buildOverallBodySlug,
  buildReasonSlug,
  buildTimeSlotSlug,
  buildTipSlug,
  buildVariableSlug,
  type DailyCategory,
  type DailyElement,
  type DailyLevel,
  type DailySanfang,
  type DailySihuaKind,
  type DailyStarGroup,
  type DailySubCategory,
  type DailyVariantStrategy,
  type DailyVariantV2,
  type DailyVariantV3,
} from "../constants/daily-fortune-table";
import {
  toBrightnessGroup,
  type BrightnessGroup,
} from "../constants/star-traits";
import type { MainStarName } from "../constants/stars";
import { generateZiweiChart } from "../core";
import { ZiWeiError } from "../errors";
import type {
  BranchIndex,
  Palace,
  StarInfo,
  StemIndex,
  ZiweiChart,
} from "../types";

import type {
  CalculateDailyFortune,
  DailyCautionKey,
  DailyDigit,
  DailyFortuneKeys,
  DailySubCategoryKey,
} from "./daily-fortune-types";
import { calculateDayun, getCurrentDayun } from "./dayun";
import { getEffectiveMainStars } from "./empty-palace";
import { getNayin } from "./wuxing";
import { getMonthBranch, getMonthStem } from "./yearly";

/**
 * 오늘의 운세 엔진 (삼합파 簡易 流日)
 *
 * 입력 `chart` + `kstDate` 만으로 결정되는 순수 함수다. 내부에서 `Date.now()`·
 * `Math.random()`을 쓰지 않는다. 출력은 문장이 아니라 슬러그와 값이다.
 *
 * 계산 흐름 (specs/daily-fortune.md "결과 생성 규칙"):
 * 1. 일진: korean-lunar-calendar의 getChineseGapja()/getLunarCalendar()
 * 2. 流日 명궁 = 流月 명궁(월건 간이법, 정월=寅, 윤달은 본월) + (음력일-1) 순행
 *    - 流日 명궁은 "지지 위치"이며 본명반 궁 이름과 무관하다. 사람마다 달라지는 것은
 *      그 위치(와 삼방사정)에 앉은 본명반의 별이다.
 * 3. 카테고리 점수 = 개인 편향(본명 구조, ±6 클램프) + 사화 4층(일간 1.0·유월 0.6·유년 0.5·대운 0.3)
 *    사화 판정: 사화 별이 앉은 본명 궁이 역할 궁의 삼방사정 안에 있는가.
 * 4. 등급: 카테고리별 분위 컷(DAILY_LEVEL_CUTS), 극단 3연속 완화(무상태 재계산)
 * 5. 시간 미상: 12시진 명반 평균 × 0.6 수축
 */

// ============================================================
// 해시 (결정적, 비암호)
// ============================================================

/** FNV-1a 32bit + murmur3 finalizer. 같은 문자열은 항상 같은 uint32. */
const hash32 = (text: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
};

/** 명반 입력의 결정적 해시 (이름은 제외 — 같은 출생 정보는 같은 결과) */
const buildPersonSeed = (chart: ZiweiChart): string => {
  const { birthDate, birthTime, calendarType, isLeapMonth, gender } =
    chart.input;
  return `${birthDate}|${birthTime}|${calendarType}|${isLeapMonth ? 1 : 0}|${gender}`;
};

// ============================================================
// 일진 · 음력
// ============================================================

const HANJA_STEMS = "甲乙丙丁戊己庚辛壬癸";
const HANJA_BRANCHES = "子丑寅卯辰巳午未申酉戌亥";

interface DayInfo {
  date: string;
  dayStem: StemIndex;
  dayBranch: BranchIndex;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  yearStem: StemIndex;
  monthStem: StemIndex;
  /** 流日 명궁 지지 */
  mingBranch: BranchIndex;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const mod12 = (value: number): BranchIndex =>
  (((value % 12) + 12) % 12) as BranchIndex;

const parseGanzhi = (
  text: string,
  field: string
): { stem: StemIndex; branch: BranchIndex } => {
  const stem = HANJA_STEMS.indexOf(text.charAt(0));
  const branch = HANJA_BRANCHES.indexOf(text.charAt(1));
  if (stem < 0 || branch < 0) {
    throw new ZiWeiError("간지를 해석하지 못했습니다.", {
      code: "CALCULATION_ERROR",
      field,
    });
  }
  return { stem: stem as StemIndex, branch: branch as BranchIndex };
};

const DAY_INFO_CACHE = new Map<string, DayInfo>();
const DAY_INFO_CACHE_LIMIT = 4000;

/** 순수 함수 결과의 메모이즈 (같은 날짜는 항상 같은 DayInfo). 크기 상한으로 메모리 제한. */
const getDayInfo = (kstDate: string): DayInfo => {
  const cached = DAY_INFO_CACHE.get(kstDate);
  if (cached) return cached;
  const info = computeDayInfo(kstDate);
  if (DAY_INFO_CACHE.size >= DAY_INFO_CACHE_LIMIT) DAY_INFO_CACHE.clear();
  DAY_INFO_CACHE.set(kstDate, info);
  return info;
};

const computeDayInfo = (kstDate: string): DayInfo => {
  if (!DATE_REGEX.test(kstDate)) {
    throw new ZiWeiError("날짜 형식은 YYYY-MM-DD여야 합니다.", {
      code: "INVALID_DATE",
      field: "kstDate",
    });
  }
  const [year, month, day] = kstDate.split("-").map(Number);
  const calendar = new KoreanLunarCalendar();
  if (!calendar.setSolarDate(year, month, day)) {
    throw new ZiWeiError("지원하지 않는 날짜입니다.", {
      code: "INVALID_DATE",
      field: "kstDate",
    });
  }
  const lunar = calendar.getLunarCalendar();
  const gapja = calendar.getChineseGapja();
  const dayPillar = parseGanzhi(gapja.day, "gapja.day");
  const yearPillar = parseGanzhi(gapja.year, "gapja.year");

  // 流月 명궁: 월건 간이법(정월=寅). 윤달은 본월과 동일하게 음력 월 숫자를 그대로 쓴다.
  const monthBranch = getMonthBranch(lunar.month);
  const monthStem = getMonthStem(yearPillar.stem, lunar.month);

  return {
    date: kstDate,
    dayStem: dayPillar.stem,
    dayBranch: dayPillar.branch,
    lunarYear: lunar.year,
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    yearStem: yearPillar.stem,
    monthStem,
    mingBranch: mod12(monthBranch + lunar.day - 1),
  };
};

/** 일진·음력·流日 명궁 조회 (개인정보 없음). 테스트·시뮬레이션 검증용 공개 API. */
export interface DailyDayInfo {
  dayStem: StemIndex;
  dayBranch: BranchIndex;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  /** 라이브러리 간지(설날 경계)의 연간 */
  yearStem: StemIndex;
  monthStem: StemIndex;
  /** 流日 명궁 지지 */
  mingBranch: BranchIndex;
}

export const getDailyDayInfo = (kstDate: string): DailyDayInfo => {
  const { date: _date, ...rest } = getDayInfo(kstDate);
  void _date;
  return rest;
};

/** kstDate에서 n일 이전/이후의 YYYY-MM-DD (UTC 산술이라 시간대 영향 없음) */
const shiftDate = (kstDate: string, days: number): string => {
  const [year, month, day] = kstDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
};

// ============================================================
// 명반 뷰 (본명 구조 전처리)
// ============================================================

interface ChartView {
  chart: ZiweiChart;
  /** 별 이름 → 본명 지지 (주성 + 보조성) */
  starBranch: Map<string, BranchIndex>;
  /** 지지 → 실효 주성 (空宮이면 借對宮 차용 주성) */
  effectiveStars: StarInfo[][];
  /** 지지 → 삼방사정 구조 점수 (클램프 전, 대략 ±8) */
  structure: number[];
  /** 대운 천간 조회 (나이 → 천간 | null) */
  dayunStemAt: (age: number) => StemIndex | null;
}

const brightnessDeviation = (star: StarInfo): number =>
  ((BRIGHTNESS_SCORE[star.brightness] ?? 40) - 50) / 50;

const palaceStructureScore = (palace: Palace): number => {
  const isBorrowed = palace.mainStars.length === 0;
  const stars = getEffectiveMainStars(palace);
  const mainMean =
    stars.length === 0
      ? 0
      : stars.reduce((sum, s) => sum + brightnessDeviation(s), 0) /
        stars.length;
  const mainScore = isBorrowed
    ? mainMean * DAILY_BIAS.borrowedFactor
    : mainMean;

  const lucky = palace.minorStars.filter((s) =>
    DAILY_LUCKY_MINOR_STARS.includes(s.name)
  ).length;
  const harsh = palace.minorStars.filter((s) =>
    DAILY_HARSH_MINOR_STARS.includes(s.name)
  ).length;
  const net = Math.max(
    -DAILY_BIAS.minorCap,
    Math.min(DAILY_BIAS.minorCap, lucky - harsh)
  );

  return mainScore + net * DAILY_BIAS.minorUnit;
};

const buildChartView = (chart: ZiweiChart): ChartView => {
  const starBranch = new Map<string, BranchIndex>();
  const effectiveStars: StarInfo[][] = Array.from({ length: 12 }, () => []);
  const palaceScore: number[] = new Array(12).fill(0);

  chart.palaces.forEach((palace) => {
    [...palace.mainStars, ...palace.minorStars].forEach((star) => {
      starBranch.set(star.name, palace.branch);
    });
    effectiveStars[palace.branch] = getEffectiveMainStars(palace);
    palaceScore[palace.branch] = palaceStructureScore(palace);
  });

  const structure = Array.from({ length: 12 }, (_, b) => {
    const triangle = palaceScore[mod12(b + 4)] + palaceScore[mod12(b + 8)];
    const weighted =
      palaceScore[b] * DAILY_STRUCTURE_WEIGHT.self +
      palaceScore[mod12(b + 6)] * DAILY_STRUCTURE_WEIGHT.opposite +
      triangle * DAILY_STRUCTURE_WEIGHT.triangle;
    return weighted * DAILY_BIAS.scale;
  });

  const dayun = calculateDayun(chart);
  const dayunStemAt = (age: number): StemIndex | null =>
    getCurrentDayun(dayun, age)?.stemIndex ?? null;

  return { chart, starBranch, effectiveStars, structure, dayunStemAt };
};

const buildViews = (chart: ZiweiChart): ChartView[] => {
  if (chart.input.birthTime !== "unknown") {
    return [buildChartView(chart)];
  }
  return DAILY_TIME_BRANCH_CLOCKS.map((clock) =>
    buildChartView(generateZiweiChart({ ...chart.input, birthTime: clock }))
  );
};

// ============================================================
// 사화 영향
// ============================================================

/** 사화 별이 role 지지의 삼방사정 어디에 있는가 → 영향 비율 (없으면 0) */
const relationFactor = (
  view: ChartView,
  starName: string,
  roleBranch: BranchIndex
): number => {
  const branch = view.starBranch.get(starName);
  if (branch === undefined) return 0;
  const d = mod12(branch - roleBranch);
  if (d === 0) return DAILY_RELATION_FACTOR.self;
  if (d === 6) return DAILY_RELATION_FACTOR.opposite;
  if (d === 4 || d === 8) return DAILY_RELATION_FACTOR.triangle;
  return 0;
};

const SIHUA_STAR_KEYS: Record<
  DailySihuaKind,
  "hualu" | "huaquan" | "huake" | "huaji"
> = {
  rok: "hualu",
  gwon: "huaquan",
  gwa: "huake",
  gi: "huaji",
};

const sihuaStarOf = (stem: StemIndex, kind: DailySihuaKind): string =>
  SIHUA_TABLE[stem][SIHUA_STAR_KEYS[kind]];

interface Layer {
  stem: StemIndex;
  weight: number;
}

const layersFor = (view: ChartView, day: DayInfo): Layer[] => {
  const layers: Layer[] = [
    { stem: day.dayStem, weight: DAILY_LAYER_WEIGHT.day },
    { stem: day.monthStem, weight: DAILY_LAYER_WEIGHT.month },
    { stem: day.yearStem, weight: DAILY_LAYER_WEIGHT.year },
  ];
  // 대운: 허나이(세는 나이) = 현재 음력 연도 - 출생 음력 연도 + 1
  const age = day.lunarYear - view.chart.lunarDate.year + 1;
  const dayunStem = view.dayunStemAt(age);
  if (dayunStem !== null) {
    layers.push({ stem: dayunStem, weight: DAILY_LAYER_WEIGHT.dayun });
  }
  return layers;
};

// ============================================================
// 카테고리 점수
// ============================================================

type CategoryRecord<T> = Record<DailyCategory, T>;

const mapCategories = <T>(
  fn: (category: DailyCategory) => T
): CategoryRecord<T> =>
  Object.fromEntries(
    DAILY_CATEGORIES.map((c) => [c, fn(c)])
  ) as CategoryRecord<T>;

const clampBias = (value: number): number =>
  Math.max(-DAILY_BIAS.clamp, Math.min(DAILY_BIAS.clamp, value));

interface ViewScore {
  points: CategoryRecord<number>;
  structure: CategoryRecord<number>;
}

const scoreView = (view: ChartView, day: DayInfo): ViewScore => {
  const layers = layersFor(view, day);
  const structure = mapCategories(
    (c) => view.structure[mod12(day.mingBranch + DAILY_ROLE_OFFSET[c])]
  );
  const points = mapCategories((c) => {
    const role = mod12(day.mingBranch + DAILY_ROLE_OFFSET[c]);
    const sihuaPoints = layers.reduce(
      (sum, layer) =>
        sum +
        layer.weight *
          DAILY_SIHUA.reduce(
            (inner, kind) =>
              inner +
              DAILY_SIHUA_VALUE[kind] *
                relationFactor(view, sihuaStarOf(layer.stem, kind), role),
            0
          ),
      0
    );
    return clampBias(structure[c]) + sihuaPoints;
  });
  return { points, structure };
};

interface DayScore {
  /** 시간 미상이면 수축 적용 후 */
  points: CategoryRecord<number>;
  /** 삼방 평가용 구조 점수 (시간 미상이면 평균) */
  structure: CategoryRecord<number>;
  isEstimated: boolean;
}

const averageRecords = (
  records: CategoryRecord<number>[]
): CategoryRecord<number> =>
  mapCategories(
    (c) => records.reduce((sum, r) => sum + r[c], 0) / records.length
  );

/** 시간 미상 수축: 모집단 중심(DAILY_POINT_CENTER)을 기준으로 편차를 0.6배 */
const shrinkTowardCenter = (
  points: CategoryRecord<number>
): CategoryRecord<number> =>
  mapCategories(
    (c) =>
      DAILY_POINT_CENTER[c] +
      (points[c] - DAILY_POINT_CENTER[c]) * DAILY_ESTIMATED_SHRINK
  );

const scoreDay = (views: ChartView[], day: DayInfo): DayScore => {
  const scores = views.map((view) => scoreView(view, day));
  const isEstimated = views.length > 1;
  const averaged = averageRecords(scores.map((s) => s.points));
  return {
    points: isEstimated ? shrinkTowardCenter(averaged) : averaged,
    structure: averageRecords(scores.map((s) => s.structure)),
    isEstimated,
  };
};

const pointsToLevel = (
  category: DailyCategory,
  points: number,
  isEstimated: boolean
): DailyLevel => {
  const useOwnCuts =
    isEstimated && DAILY_ESTIMATED_LEVEL_MODE !== "shrink-exact-cuts";
  const cuts = useOwnCuts
    ? DAILY_LEVEL_CUTS_ESTIMATED[category]
    : DAILY_LEVEL_CUTS[category];
  const index = cuts.findIndex((cut) => points < cut);
  const level = (index === -1 ? 5 : index + 1) as DailyLevel;
  // 시간 미상은 극단 등급을 단정하지 않는다 (수축의 취지를 등급 공간에서 보존)
  return isEstimated && DAILY_ESTIMATED_LEVEL_MODE === "own-cuts-compress"
    ? relaxExtreme(level)
    : level;
};

const toSanfang = (structure: number, isEstimated: boolean): DailySanfang => {
  const [low, high] = isEstimated
    ? DAILY_SANFANG_CUTS_ESTIMATED
    : DAILY_SANFANG_CUTS;
  if (structure < low) return "burden";
  if (structure >= high) return "support";
  return "steady";
};

const relaxExtreme = (level: DailyLevel): DailyLevel => {
  if (level === 5) return 4;
  if (level === 1) return 2;
  return level;
};

const isExtreme = (level: DailyLevel): boolean => level === 1 || level === 5;

/**
 * 극단 완화: 같은 극단 등급(1 또는 5)이 DAILY_EXTREME_STREAK일 연속이면 마지막 날을
 * 한 단계 중앙 쪽으로 옮긴다. 과거 날은 "완화 없는 원 등급"으로 재계산한다 — 이렇게
 * 끊어야 재귀가 무한히 이어지지 않고 저장 없이 같은 날은 항상 같은 결과가 된다.
 */
const resolveLevels = (
  views: ChartView[],
  day: DayInfo
): { levels: CategoryRecord<DailyLevel>; score: DayScore } => {
  const score = scoreDay(views, day);
  const pastScores = Array.from({ length: DAILY_EXTREME_STREAK - 1 }, (_, i) =>
    scoreDay(views, getDayInfo(shiftDate(day.date, -(i + 1))))
  );
  const levels = mapCategories((category) => {
    const level = pointsToLevel(
      category,
      score.points[category],
      score.isEstimated
    );
    if (!isExtreme(level)) return level;
    const streak = pastScores.every(
      (past) =>
        pointsToLevel(category, past.points[category], past.isEstimated) ===
        level
    );
    return streak ? relaxExtreme(level) : level;
  });
  return { levels, score };
};

// ============================================================
// 변형 · 선택
// ============================================================

/** 변형을 고르는 슬롯 (pickVariant의 salt에서 "cb-love" 같은 접미를 뗀 값) */
type VariantSlot = "hl" | "hx" | "ob" | "cb" | "vr" | "ca" | "tp" | "kr";

/**
 * 슬롯별 변형 선택 전략 (CTO 결정, CPO 동의 대기).
 * - cycle: (사람 offset + floor(dayNumber/12)) mod V — 같은 변형이 12일 동안 유지되고 사람마다
 *   시작점이 다르다. 슬롯 안에서 변형 하나로 재등장 간격을 늘리는 데 유효하다.
 * - hash: hash(personSeed, kstDate, salt) mod V (PRD 규칙 7).
 * kr은 cycle로 바꾸면 오히려 나빠지고(보완 슬러그 쌍이 적음), hx는 시뮬레이션으로 확정했다.
 * 되돌리기: 해당 슬롯 값을 "hash"로 바꾸면 된다. 전부 hash면 1단계 동작과 같다.
 */
/** 슬롯 전략: 하나로 고정하거나 confidence(시간 확정/미상)별로 나눈다. */
type SlotStrategy =
  | DailyVariantStrategy
  | { exact: DailyVariantStrategy; estimated: DailyVariantStrategy };

export const DAILY_SLOT_VARIANT_STRATEGY: Record<VariantSlot, SlotStrategy> = {
  hl: "cycle",
  hx: "hash",
  ob: "cycle",
  // 시간 미상은 등급·삼방 조합이 몰려 cycle이면 12일 블록 안에서 같은 문장이 반복된다
  // (cb 중앙값 12 -> 6일). 되돌리기: estimated를 "cycle"로.
  cb: { exact: "cycle", estimated: "hash" },
  vr: "hash",
  ca: "hash",
  tp: "hash",
  kr: "hash",
};

interface PickContext {
  seed: string;
  date: string;
  /** "cycle" 전략용 일련번호 (UTC 일수) */
  dayNumber: number;
  /** 지정하면 모든 슬롯에 이 전략을 강제 (비교 실험용). 없으면 슬롯별 표를 쓴다. */
  strategyOverride?: DailyVariantStrategy;
  /** 시간 미상 여부 (슬롯 전략의 confidence 분기용) */
  isEstimated: boolean;
}

const pickIndex = (ctx: PickContext, salt: string, count: number): number => {
  if (count <= 1) return 0;
  const base = hash32(`${ctx.seed}|${ctx.date}|${salt}`);
  return base % count;
};

/** 변형 선택: 슬롯별 전략(DAILY_SLOT_VARIANT_STRATEGY)에 따라 hash 또는 cycle. */
const pickVariant = (ctx: PickContext, salt: string, count: number): number => {
  const slot = (salt.startsWith("cb-") ? "cb" : salt) as VariantSlot;
  const entry = DAILY_SLOT_VARIANT_STRATEGY[slot];
  const strategy =
    ctx.strategyOverride ??
    (typeof entry === "string"
      ? entry
      : ctx.isEstimated
        ? entry.estimated
        : entry.exact);
  if (strategy === "cycle" && count > 1) {
    const offset = hash32(`${ctx.seed}|${salt}`) % count;
    return (offset + Math.floor(ctx.dayNumber / 12)) % count;
  }
  return pickIndex(ctx, salt, count);
};

const toV2 = (index: number): DailyVariantV2 => (index === 0 ? "v1" : "v2");
const toV3 = (index: number): DailyVariantV3 =>
  index === 0 ? "v1" : index === 1 ? "v2" : "v3";

const toDayNumber = (kstDate: string): number => {
  const [year, month, day] = kstDate.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
};

// ============================================================
// 헤드라인 · 성향군
// ============================================================

/** 지지의 실효 주성. 빈 궁이 차용도 못 받는 극단 케이스는 가까운 다음 궁에서 찾는다. */
const starsAt = (view: ChartView, branch: BranchIndex): StarInfo[] => {
  for (let step = 0; step < 12; step += 1) {
    const stars = view.effectiveStars[mod12(branch + step)];
    if (stars.length > 0) return stars;
  }
  throw new ZiWeiError("명반에 주성이 없습니다.", {
    code: "CALCULATION_ERROR",
    field: "chart.palaces",
  });
};

const groupOfStar = (star: StarInfo): DailyStarGroup =>
  DAILY_STAR_GROUP_OF[star.name as MainStarName];

/**
 * 한 줄의 밝기군: 본명 밝기군을 기본으로 하되, 오늘 일간 사화가 그 별에 붙으면 그날의
 * 기운이 밝기를 덮는다 (화록·화권·화과 → bright, 화기 → dark). 점수(사화 가산)와 한 줄의
 * 방향이 같아지고, 같은 별의 한 줄이 날마다 다른 밝기군으로 나뉘어 반복 체감도 줄어든다.
 * 사화 덮어쓰기 뒤에 총운 level 정렬(alignBrightnessToLevel)을 적용하며, 충돌하면 정렬이 이긴다.
 */
const dailyBrightnessGroup = (
  star: StarInfo,
  day: DayInfo,
  overallLevel: DailyLevel
): BrightnessGroup => {
  const base = ((): BrightnessGroup => {
    if (sihuaStarOf(day.dayStem, "gi") === star.name) return "dark";
    const lifted = (["rok", "gwon", "gwa"] as const).some(
      (kind) => sihuaStarOf(day.dayStem, kind) === star.name
    );
    return lifted ? "bright" : toBrightnessGroup(star.brightness);
  })();
  return alignBrightnessToLevel(base, overallLevel);
};

/**
 * 한 줄(hl)의 밝기군을 총운 level과 정렬한다 (PRD 규칙 6: 점수와 텍스트 일치).
 * 총운 ≥ DAILY_HL_ALIGN.highLevel이면 dark를 neutral로 올리고,
 * 총운 ≤ DAILY_HL_ALIGN.lowLevel이면 bright를 neutral로 내린다.
 * 되돌리기: DAILY_HL_ALIGN.enabled = false.
 */
export const DAILY_HL_ALIGN = {
  enabled: true,
  highLevel: 4,
  lowLevel: 2,
} as const;

const alignBrightnessToLevel = (
  group: BrightnessGroup,
  overallLevel: DailyLevel
): BrightnessGroup => {
  if (!DAILY_HL_ALIGN.enabled) return group;
  if (group === "dark" && overallLevel >= DAILY_HL_ALIGN.highLevel) {
    return "neutral";
  }
  if (group === "bright" && overallLevel <= DAILY_HL_ALIGN.lowLevel) {
    return "neutral";
  }
  return group;
};

/** 시간 미상: 12시진 명반에서 流日 명궁 위치의 성향군 최다 득표 (동률은 해시로 결정) */
const pluralityGroup = (
  views: ChartView[],
  branch: BranchIndex,
  ctx: PickContext
): DailyStarGroup => {
  const counts = new Map<DailyStarGroup, number>();
  views.forEach((view) => {
    starsAt(view, branch).forEach((star) => {
      const group = groupOfStar(star);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    });
  });
  const max = Math.max(...counts.values());
  const tied = DAILY_STAR_GROUPS.filter((g) => counts.get(g) === max);
  return tied[pickIndex(ctx, "ob-group", tied.length)];
};

// ============================================================
// 사화 변수 · 일간 사화 지배형
// ============================================================

interface SihuaHit {
  kind: DailySihuaKind;
  category: DailyCategory;
  /** 시간 미상이면 12시진 평균 */
  factor: number;
}

const SIHUA_PRIORITY: readonly DailySihuaKind[] = ["gi", "rok", "gwon", "gwa"];

const collectDayHits = (views: ChartView[], day: DayInfo): SihuaHit[] =>
  SIHUA_PRIORITY.flatMap((kind) =>
    DAILY_CATEGORIES.map((category) => {
      const role = mod12(day.mingBranch + DAILY_ROLE_OFFSET[category]);
      const star = sihuaStarOf(day.dayStem, kind);
      const factor =
        views.reduce((sum, view) => sum + relationFactor(view, star, role), 0) /
        views.length;
      return { kind, category, factor };
    })
  );

/**
 * 변수 문장 후보 선택. 사화 별이 역할 궁 삼방사정에 걸린 (사화, 카테고리) 중
 * 해당 카테고리 등급의 방향을 거스르지 않는 것만 남긴다 (점수-문구 일치):
 * 화록·화권·화과는 level 3 이상, 화기는 level 3 이하일 때만.
 */
const pickVariableHit = (
  hits: SihuaHit[],
  isEstimated: boolean,
  levels: CategoryRecord<DailyLevel>
): SihuaHit | null => {
  const minFactor = isEstimated ? DAILY_ESTIMATED_VARIABLE_MIN_FACTOR : 0;
  const candidates = hits.filter((h) => {
    if (h.factor <= 0 || h.factor < minFactor) return false;
    return DAILY_SIHUA_VALUE[h.kind] > 0
      ? levels[h.category] >= 3
      : levels[h.category] <= 3;
  });
  if (candidates.length === 0) return null;
  // 강도 = |사화 점수| × 영향 비율. 동률이면 SIHUA_PRIORITY → DAILY_CATEGORIES 순서 (hits 순서)
  return candidates.reduce((best, cur) =>
    Math.abs(DAILY_SIHUA_VALUE[cur.kind]) * cur.factor >
    Math.abs(DAILY_SIHUA_VALUE[best.kind]) * best.factor
      ? cur
      : best
  );
};

/** hx 슬롯용: 오늘 일간 사화 중 영향 합이 가장 큰 종류 (동률은 SIHUA_PRIORITY 순) */
const dominantSihuaKind = (hits: SihuaHit[]): DailySihuaKind =>
  SIHUA_PRIORITY.reduce((best, kind) => {
    const sum = (k: DailySihuaKind): number =>
      hits.filter((h) => h.kind === k).reduce((s, h) => s + h.factor, 0);
    return sum(kind) > sum(best) ? kind : best;
  }, SIHUA_PRIORITY[0]);

// ============================================================
// 캡션 · 키워드
// ============================================================

const CAUTION_TIE_ORDER: readonly DailyCategory[] = [
  "health",
  "money",
  "love",
  "work",
  "overall",
];

/**
 * 건강은 level ≤ healthMaxLevel(1, "살펴 가는 날")일 때만 주의 포인트 후보가 된다. 流日 명궁 지지가 전원
 * 동일해 건강(질액궁) 삼방이 다른 카테고리와 겹치지 않아, 제한이 없으면 31%를 차지했다.
 * 되돌리기: healthMaxLevel = 5.
 */
export const DAILY_CAUTION = { healthMaxLevel: 1 } as const;

const pickCautionCategory = (
  levels: CategoryRecord<DailyLevel>,
  points: CategoryRecord<number>
): DailyCategory => {
  const candidates = CAUTION_TIE_ORDER.filter(
    (c) => c !== "health" || levels.health <= DAILY_CAUTION.healthMaxLevel
  );
  return candidates.reduce((best, cur) => {
    if (levels[cur] !== levels[best]) {
      return levels[cur] < levels[best] ? cur : best;
    }
    // 등급이 같으면 점수가 낮은 쪽, 점수까지 같으면 CAUTION_TIE_ORDER 앞선 쪽
    return points[cur] < points[best] ? cur : best;
  }, candidates[0]);
};

const birthNayinElement = (chart: ZiweiChart): DailyElement =>
  DAILY_KO_ELEMENT[
    getNayin(chart.lunarDate.yearStem, chart.lunarDate.yearBranch)
  ];

const dayNayinElement = (day: DayInfo): DailyElement =>
  DAILY_KO_ELEMENT[getNayin(day.dayStem, day.dayBranch)];

// ============================================================
// 메인
// ============================================================

export interface DailyFortuneOptions {
  /** 모든 슬롯에 강제할 변형 전략 (시뮬레이션 비교용). 생략하면 슬롯별 표를 쓴다. */
  variantStrategy?: DailyVariantStrategy;
}

/**
 * 내부 진입점 (옵션 지원). 서비스 코드는 `calculateDailyFortune`을 쓴다.
 * 시뮬레이션처럼 명반을 재사용하며 여러 날을 돌릴 때는 `prepareDailyFortune`을 쓴다.
 */
export const prepareDailyFortune = (
  chart: ZiweiChart,
  options: DailyFortuneOptions = {}
): ((kstDate: string) => DailyFortuneKeys) => {
  const views = buildViews(chart);
  const isEstimated = chart.input.birthTime === "unknown";
  const seed = buildPersonSeed(chart);

  return (kstDate: string): DailyFortuneKeys => {
    const day = getDayInfo(kstDate);
    const { levels, score } = resolveLevels(views, day);
    const ctx: PickContext = {
      seed,
      date: kstDate,
      dayNumber: toDayNumber(kstDate),
      strategyOverride: options.variantStrategy,
      isEstimated,
    };

    // --- 헤드라인 · 총운 성향군 ---
    let headline: DailyFortuneKeys["headline"];
    let group: DailyStarGroup;
    const hits = collectDayHits(views, day);
    if (isEstimated) {
      group = pluralityGroup(views, day.mingBranch, ctx);
      headline = buildEstimatedHeadlineSlug(
        dayNayinElement(day),
        dominantSihuaKind(hits),
        toV2(pickVariant(ctx, "hx", 2))
      );
    } else {
      const stars = starsAt(views[0], day.mingBranch);
      const star = stars[pickIndex(ctx, "hl-star", stars.length)];
      group = groupOfStar(star);
      headline = buildHeadlineSlug(
        DAILY_STAR_SLUG[star.name as MainStarName],
        dailyBrightnessGroup(star, day, levels.overall),
        toV3(pickVariant(ctx, "hl", 3))
      );
    }

    // --- 카테고리 본문 ---
    const sanfang = (c: DailyCategory): DailySanfang =>
      toSanfang(score.structure[c], score.isEstimated);
    const sub = <C extends DailySubCategory>(
      category: C
    ): DailySubCategoryKey<C> => ({
      level: levels[category],
      slug: buildCategoryBodySlugOf(
        category,
        levels[category],
        sanfang(category),
        toV3(pickVariant(ctx, `cb-${category}`, 3))
      ),
    });
    const categories: DailyFortuneKeys["categories"] = {
      overall: {
        level: levels.overall,
        slug: buildOverallBodySlug(
          levels.overall,
          group,
          toV2(pickVariant(ctx, "ob", 2))
        ),
      },
      love: sub("love"),
      money: sub("money"),
      work: sub("work"),
      health: sub("health"),
    };

    // --- 일간 사화 변수 ---
    const hit = pickVariableHit(hits, isEstimated, levels);
    const variable = hit
      ? buildVariableSlug(
          hit.kind,
          hit.category,
          toV2(pickVariant(ctx, "vr", 2))
        )
      : null;

    // --- 주의 포인트 ---
    const cautionCategory = pickCautionCategory(levels, score.points);
    const cautionTone = levels[cautionCategory] <= 2 ? "firm" : "mild";
    const caution = {
      category: cautionCategory,
      slug: buildCautionSlugOf(
        cautionCategory,
        cautionTone,
        toV2(pickVariant(ctx, "ca", 2))
      ),
    } as DailyCautionKey;

    // --- 팁 ---
    const tip = buildTipSlug(
      branchToSlug(day.dayBranch),
      levels.overall <= 3 ? "calm" : "lift",
      toV2(pickVariant(ctx, "tp", 2))
    );

    // --- 키워드 ---
    const selfElement = isEstimated
      ? birthNayinElement(chart)
      : DAILY_JU_ELEMENT[chart.wuxingJu];
    const dayElement = DAILY_STEM_ELEMENT[day.dayStem];
    const complement = DAILY_COMPLEMENT_TABLE[selfElement][dayElement];
    const digits = DAILY_ELEMENT_DIGITS[complement.element];
    const number = digits[pickIndex(ctx, "kn", digits.length)] as DailyDigit;

    // 시간대/방향: 시간 확정이면 일간 화록이 앉은 본명 궁의 지지, 미상이면 일진 지지
    const rokBranch = views[0].starBranch.get(sihuaStarOf(day.dayStem, "rok"));
    const timeBranch: BranchIndex =
      isEstimated || rokBranch === undefined ? day.dayBranch : rokBranch;

    const keywords: DailyFortuneKeys["keywords"] = {
      color: buildColorSlug(
        complement.element,
        (pickIndex(ctx, "kc", 4) + 1) as 1 | 2 | 3 | 4
      ),
      item: buildItemSlug(
        complement.element,
        (pickIndex(ctx, "ki", 8) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
      ),
      number,
      timeSlot: buildTimeSlotSlug(branchToSlug(timeBranch)),
      reason: buildReasonSlug(
        complement.element,
        complement.kind,
        toV2(pickVariant(ctx, "kr", 2))
      ),
      directionBranch: timeBranch,
    };

    return {
      date: kstDate,
      confidence: isEstimated ? "estimated" : "exact",
      headline,
      categories,
      variable,
      caution,
      tip,
      keywords,
    };
  };
};

export const calculateDailyFortune: CalculateDailyFortune = (chart, kstDate) =>
  prepareDailyFortune(chart)(kstDate);

// ============================================================
// 캘리브레이션 · 진단용 (시뮬레이션 스크립트에서 사용)
// ============================================================

export interface DailyDiagnostics {
  points: Record<DailyCategory, number>;
  structure: Record<DailyCategory, number>;
  /** 완화 전 원 등급 */
  rawLevels: Record<DailyCategory, DailyLevel>;
  /** 완화 후 등급 */
  levels: Record<DailyCategory, DailyLevel>;
}

/** 분포 캘리브레이션용: 점수와 구조 값을 노출한다 (서비스 출력에는 쓰지 않음). */
export const diagnoseDailyFortune = (
  chart: ZiweiChart,
  kstDate: string
): DailyDiagnostics => {
  const views = buildViews(chart);
  const day = getDayInfo(kstDate);
  const { levels, score } = resolveLevels(views, day);
  return {
    points: score.points,
    structure: score.structure,
    rawLevels: mapCategories((c) =>
      pointsToLevel(c, score.points[c], score.isEstimated)
    ),
    levels,
  };
};

/**
 * 명반 하나를 여러 날에 대해 점수화한다 (뷰를 한 번만 만든다). 컷 도출용.
 */
export const diagnoseDailyRange = (
  chart: ZiweiChart,
  kstDates: readonly string[]
): {
  points: Record<DailyCategory, number>;
  structure: Record<DailyCategory, number>;
}[] => {
  const views = buildViews(chart);
  return kstDates.map((kstDate) => {
    const score = scoreDay(views, getDayInfo(kstDate));
    return { points: score.points, structure: score.structure };
  });
};
