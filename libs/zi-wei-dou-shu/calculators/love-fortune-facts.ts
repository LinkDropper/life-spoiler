import {
  CONFLICT_ANTIDOTE,
  CONFLICT_CARD_LABEL,
  EXPRESSION_WEIGHT,
  LOVE_LABELS,
  LOVE_QUADRANT,
  PEACH_PLACE,
  PEACH_STARS,
  QUADRANT_HABIT,
  SHA_CONFLICT,
  SKINSHIP_WEIGHT,
  SPEED_WEIGHT,
  STAR_CONFLICT_CARD,
  STAR_LOVE_REASON,
} from "../constants/lifetime-facts/love-deep-facts";
import type {
  ConflictCard,
  PeachKind,
} from "../constants/lifetime-facts/love-deep-facts";
import {
  LOVE_INNER_NEED,
  LOVE_PERSON_CUES,
  LOVE_SELF_CUES,
} from "../constants/lifetime-facts/love-section-cues";
import type {
  LovePersonCue,
  LoveSelfCues,
} from "../constants/lifetime-facts/love-section-cues";
import type { PalaceName } from "../constants/palaces";
import type { MainStarName } from "../constants/stars";
import type { BranchIndex, Palace, ZiweiChart } from "../types";

import type { DayunResult } from "./dayun";
import { getEffectiveMainStars } from "./empty-palace";
import {
  buildStarPalaceMap,
  calculateFlyingSihua,
  calculateTiming,
} from "./lifetime-facts";
import { calculateHongluan, calculateTianxi } from "./minor-stars";
import { getYearStemBranch } from "./yearly";

// ============================================================
// 연애 운세(딥다이브) 사실 시트. 설계: specs/love-fortune.md
// 엔진이 라벨·좌표·게이지·카드·시즌을 정하고, LLM은 설명만 쓴다.
// ============================================================

/** 축 값 (0~100, 50 = 평균) */
export interface LoveAxis {
  score: number;
  /** 엔진이 정한 쉬운 말 (모델이 숫자를 다시 해석하지 않게 그대로 넘긴다) */
  text: string;
  /** 쉬운 말 근거 (별·궁 이름 없음) */
  reasons: string[];
}

export interface LovePeach {
  star: string;
  kind: PeachKind;
  reading: string;
  palace: string;
  place: string;
}

export interface LoveSeason {
  year: number;
  /** 그해 나이 (만) */
  age: number;
  reasons: string[];
}

export type LoveQuadrantKey = keyof typeof LOVE_QUADRANT;

export interface LoveFactSheet {
  label: string;
  quadrant: { key: LoveQuadrantKey; name: string };
  /** 섹션별 장면 단서 (명궁 주성) */
  selfCues?: LoveSelfCues;
  /** 처음 끌리는 사람 (부처궁 주성) */
  attract?: LovePersonCue;
  /** 오래 편한 사람 (관록궁 주성, 끌리는 사람과 같으면 복덕궁) */
  lasting?: LovePersonCue;
  /** 연애에서 속으로 바라는 것 (복덕궁 주성) */
  innerNeed?: string;
  speed: LoveAxis;
  expression: LoveAxis;
  skinship: LoveAxis;
  conflict: {
    card: ConflictCard;
    label: string;
    antidote: string;
    trigger?: string;
    reasons: string[];
  };
  peach: LovePeach[];
  /** 친구·지인이 연인이 되는 신호 */
  friendToLover: boolean;
  seasons: LoveSeason[];
  restSeason?: LoveSeason;
  /** 처방 재료 세 가지 (섹션마다 다른 재료에서 하나씩) */
  prescription: { habit: string; place: string; need?: string };
}

const MAIN_STARS = new Set<string>(Object.keys(LOVE_LABELS));
const isMainStar = (name: string): name is MainStarName => MAIN_STARS.has(name);

const findPalace = (chart: ZiweiChart, name: PalaceName): Palace | undefined =>
  chart.palaces.find((p) => p.name === name);

const mainStarsOf = (palace: Palace | undefined): MainStarName[] =>
  palace
    ? getEffectiveMainStars(palace)
        .map((s) => s.name)
        .filter(isMainStar)
    : [];

const clamp = (value: number): number =>
  Math.max(5, Math.min(95, Math.round(value)));

/** 점수 → 평균 대비 쉬운 말. 50 근처도 어느 쪽인지 말해 모델이 반대로 읽지 않게 한다 */
const describeBand = (score: number, high: string, low: string): string => {
  if (score >= 75) return `평균보다 꽤 ${high} 편`;
  if (score >= 60) return `평균보다 살짝 ${high} 편`;
  if (score >= 50) return `평균 근처인데 조금 ${high} 쪽`;
  if (score > 40) return `평균 근처인데 조금 ${low} 쪽`;
  if (score > 25) return `평균보다 살짝 ${low} 편`;
  return `평균보다 꽤 ${low} 편`;
};

/** 천요: 축(丑)에서 정월, 음력 생월까지 순행 (도장본 "姚丑順行") */
export const calculateTianyao = (lunarMonth: number): BranchIndex =>
  (lunarMonth % 12) as BranchIndex;

/** 함지: 연지 삼합 기준 (신자진→유, 인오술→묘, 사유축→오, 해묘미→자) */
export const calculateXianchi = (yearBranch: BranchIndex): BranchIndex => {
  const group = yearBranch % 4;
  // 자(0)·진(4)·신(8) → 유(9), 축·사·유 → 오(6), 인·오·술 → 묘(3), 묘·미·해 → 자(0)
  const byGroup: Record<number, BranchIndex> = { 0: 9, 1: 6, 2: 3, 3: 0 };
  return byGroup[group];
};

const palaceAtBranch = (chart: ZiweiChart, branch: number) =>
  chart.palaces.find((p) => p.branch === ((branch % 12) + 12) % 12);

const hasSha = (palace: Palace | undefined, name: string): boolean =>
  !!palace?.minorStars.some((s) => s.name === name);

const starWeight = (
  stars: MainStarName[],
  weight: Record<MainStarName, number>
): number => stars.reduce((sum, s) => sum + weight[s], 0);

const collectPeach = (chart: ZiweiChart): LovePeach[] => {
  const branches: Record<string, BranchIndex> = {
    홍란: calculateHongluan(chart.lunarDate.yearBranch),
    천희: calculateTianxi(chart.lunarDate.yearBranch),
    천요: calculateTianyao(chart.lunarDate.month),
    함지: calculateXianchi(chart.lunarDate.yearBranch),
  };
  return Object.entries(branches).flatMap(([star, branch]) => {
    const palace = palaceAtBranch(chart, branch);
    const place = palace ? PEACH_PLACE[palace.name] : undefined;
    if (!palace || !place) return [];
    return [{ star, ...PEACH_STARS[star], palace: palace.name, place }];
  });
};

const NEAR_PALACES = new Set<string>(["명궁", "부처궁"]);

export interface LoveFactOptions {
  birthYear: number;
  currentYear: number;
  dayun: DayunResult;
}

export const buildLoveFactSheet = (
  chart: ZiweiChart,
  { birthYear, currentYear, dayun }: LoveFactOptions
): LoveFactSheet => {
  const ming = findPalace(chart, "명궁");
  const spouse = findPalace(chart, "부처궁");
  const career = findPalace(chart, "관록궁");
  const fortune = findPalace(chart, "복덕궁");
  const [mingStar] = mainStarsOf(ming);
  const [spouseStar] = mainStarsOf(spouse);
  const [fortuneStar] = mainStarsOf(fortune);
  const lastingStar = [...mainStarsOf(career), ...mainStarsOf(fortune)].find(
    (s) => s !== spouseStar
  );
  const loveStars = [...mainStarsOf(ming), ...mainStarsOf(spouse)];
  const starPalace = buildStarPalaceMap(chart.palaces);
  const peach = collectPeach(chart);

  // 사화: 부처궁에 앉은 생년 사화, 명궁 천간 화기가 부처궁으로 가는지
  const spouseSihua = (spouse?.mainStars ?? [])
    .concat(spouse?.minorStars ?? [])
    .flatMap((s) => (s.sihua ? [s.sihua] : []));
  const flights = calculateFlyingSihua(chart, starPalace);
  const mingJiToSpouse = flights.some(
    (f) => f.from === "명궁" && f.sihua === "화기" && f.to === "부처궁"
  );
  const friendToLover = flights.some(
    (f) =>
      (f.from === "형제궁" || f.from === "교우궁") &&
      f.sihua === "화록" &&
      f.to === "부처궁"
  );

  const peachNear = peach.filter((p) => NEAR_PALACES.has(p.palace));
  const shortPeach = peach.filter(
    (p) => p.kind === "short" && p.palace !== "관록궁"
  );

  // 다가가는 속도
  const speedReasons = loveStars.map((s) => STAR_LOVE_REASON[s]);
  let speed = 50 + starWeight(loveStars, SPEED_WEIGHT);
  speed += peachNear.length * 6;
  if (spouseSihua.includes("화기")) {
    speed -= 10;
    speedReasons.push("연애 앞에서 마음을 오래 재는 편이에요");
  }
  if (mingJiToSpouse) {
    speed -= 8;
    speedReasons.push("서두르기보다 늦게 자리 잡는 연애가 맞는 편이에요");
  }
  if (peachNear.length > 0) {
    speedReasons.push("첫인상에서 설렘을 잘 일으키는 편이에요");
  }

  // 마음 표현
  const expressionReasons = loveStars.map((s) => STAR_LOVE_REASON[s]);
  let expression = 50 + starWeight(loveStars, EXPRESSION_WEIGHT);
  if (spouseSihua.includes("화권")) {
    expression += 8;
    expressionReasons.push("연애에서 주도권을 쥐려는 편이에요");
  }
  if (spouseSihua.includes("화과")) {
    expression += 6;
    expressionReasons.push("연애가 주변에 잘 드러나는 편이에요");
  }
  if (spouseSihua.includes("화기")) {
    expression -= 10;
    expressionReasons.push("서운한 걸 말보다 속으로 삭이는 편이에요");
  }

  // 스킨십 진도
  const skinshipReasons = loveStars.map((s) => STAR_LOVE_REASON[s]);
  let skinship = 50 + starWeight(loveStars, SKINSHIP_WEIGHT);
  // 짧은 설렘은 첫인상·단둘이 자리에 있을 때만 크게 본다.
  // 다른 자리까지 +10씩 더했더니 2회차에서 77 → 87로 튀었다.
  const shortNear = shortPeach.filter((p) => NEAR_PALACES.has(p.palace));
  skinship += shortNear.length * 8 + (shortPeach.length - shortNear.length) * 3;
  if (shortPeach.length > 0) {
    skinshipReasons.push(
      "끌림이 생기면 마음보다 몸이 먼저 가까워지는 편이에요"
    );
  }
  skinship += peachNear.length * 5;
  if (spouseSihua.includes("화기")) {
    skinship -= 8;
    skinshipReasons.push("가까워지기 전에 한 번 더 확인하고 싶어 해요");
  }

  // 갈등 카드: 부처궁 살성 → 명궁 살성 → 부처궁 주성 → 명궁 주성
  const sha =
    Object.keys(SHA_CONFLICT).find((s) => hasSha(spouse, s)) ??
    Object.keys(SHA_CONFLICT).find((s) => hasSha(ming, s));
  const cardStar = spouseStar ?? mingStar;
  const card: ConflictCard = sha
    ? SHA_CONFLICT[sha].card
    : cardStar
      ? STAR_CONFLICT_CARD[cardStar]
      : "담쌓기";
  const conflictReasons = [
    ...(sha ? [SHA_CONFLICT[sha].reason] : []),
    ...(cardStar ? [STAR_LOVE_REASON[cardStar]] : []),
    ...(spouseSihua.includes("화기")
      ? ["연애에서 서운함이 쌓이기 쉬운 편이에요"]
      : []),
  ];

  // 시즌: 기존 연애 타이밍 + 유년 홍란·천희가 유년 명궁·부처궁·관록궁에 드는 해.
  // 근거 문장은 인생 운세용(추상어 포함)이라 연애 운세 쉬운 말로 바꿔 넘긴다.
  const timing = calculateTiming(
    chart,
    dayun,
    birthYear,
    currentYear,
    starPalace
  ).find((t) => t.topic === "love");
  const horizon = [1, 2, 3].map((i) => currentYear + i);
  const seasonScores = horizon.map((year) => {
    const base = timing?.likely.find((y) => y.year === year);
    const reasons = base ? ["연애 쪽에 일이 많아지는 해예요"] : [];
    let score = base?.score ?? 0;
    const { branch } = getYearStemBranch(year);
    const axis = new Set([branch, (branch + 10) % 12, (branch + 4) % 12]);
    const yearPeach = [
      calculateHongluan(branch as BranchIndex),
      calculateTianxi(branch as BranchIndex),
    ];
    if (yearPeach.some((b) => axis.has(b))) {
      score += 2;
      reasons.push("새로운 사람에게 설렐 일이 생기기 쉬운 해예요");
    }
    return { year, age: year - birthYear, score, reasons };
  });
  const seasons = seasonScores
    .filter((s) => s.score > 0)
    .map(({ year, age, reasons }) => ({ year, age, reasons }));
  const caution = timing?.caution;
  const restSeason =
    caution && horizon.includes(caution.year)
      ? {
          year: caution.year,
          age: caution.year - birthYear,
          reasons: ["연애보다 내 일과 생활을 챙기는 게 맞는 해예요"],
        }
      : undefined;

  const speedScore = clamp(speed);
  const expressionScore = clamp(expression);
  const quadrantKey: LoveQuadrantKey =
    speedScore >= 50
      ? expressionScore >= 50
        ? "fastShow"
        : "fastHold"
      : expressionScore >= 50
        ? "slowShow"
        : "slowHold";
  const innerNeed = fortuneStar ? LOVE_INNER_NEED[fortuneStar] : undefined;
  const meetPlace =
    peach.find((p) => p.kind === "lasting")?.place ??
    peach[0]?.place ??
    PEACH_PLACE.교우궁;

  return {
    label: mingStar ? LOVE_LABELS[mingStar] : LOVE_LABELS.천동,
    quadrant: { key: quadrantKey, name: LOVE_QUADRANT[quadrantKey] },
    ...(mingStar ? { selfCues: LOVE_SELF_CUES[mingStar] } : {}),
    ...(spouseStar ? { attract: LOVE_PERSON_CUES[spouseStar] } : {}),
    ...(lastingStar ? { lasting: LOVE_PERSON_CUES[lastingStar] } : {}),
    ...(innerNeed ? { innerNeed } : {}),
    speed: {
      score: speedScore,
      text: describeBand(speedScore, "빨리 다가가는", "천천히 다가가는"),
      reasons: [...new Set(speedReasons)],
    },
    expression: {
      score: expressionScore,
      text: describeBand(expressionScore, "드러내는", "속에 담는"),
      reasons: [...new Set(expressionReasons)],
    },
    skinship: {
      score: clamp(skinship),
      text: describeBand(clamp(skinship), "빠른", "느긋한"),
      reasons: [...new Set(skinshipReasons)],
    },
    conflict: {
      card,
      label: CONFLICT_CARD_LABEL[card],
      antidote: CONFLICT_ANTIDOTE[card],
      ...(mingStar
        ? { trigger: LOVE_SELF_CUES[mingStar].conflictTrigger }
        : {}),
      reasons: conflictReasons,
    },
    peach,
    friendToLover,
    seasons,
    ...(restSeason ? { restSeason } : {}),
    prescription: {
      habit: QUADRANT_HABIT[quadrantKey],
      place: meetPlace,
      ...(innerNeed ? { need: innerNeed } : {}),
    },
  };
};
