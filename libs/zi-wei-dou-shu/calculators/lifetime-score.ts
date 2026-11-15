/**
 * 인생 운세 4영역 점수 (결정적 계산 + 분포 백분위 정규화)
 *
 * 1) calculateLifetimeRawScores: 원국만으로 영역별 원점수(단위 없음, 클수록 유리)
 * 2) toLifetimeDisplayScore: 격자 표본 분위 경계(LIFETIME_SCORE_QUANTILES)로
 *    백분위 p를 구해 round(40 + 55p) (40~95)로 변환
 *
 * 설계: 영역별 대상 궁의 "삼방사정 가중 합"을 원점수로 한다.
 * 유파 기준은 삼합파. 대운·유년 등 시간축 요소는 포함하지 않는다(원국 기준).
 */

import { LIFETIME_SCORE_QUANTILES } from "../constants/lifetime-score-quantiles";
import type { CategoryScores } from "../constants/scoring";
import type { Brightness, Palace, Sihua, StarInfo, ZiweiChart } from "../types";

import { calculateSamBangSaJeong } from "./sam-bang";

type ScoreCategory = keyof CategoryScores;

/** 영역 → 대상 궁 (재백=재물, 관록=직업, 부처=인연, 질액=건강) */
export const LIFETIME_CATEGORY_PALACE: Record<ScoreCategory, string> = {
  wealth: "재백궁",
  career: "관록궁",
  relationship: "부처궁",
  health: "질액궁",
};

/**
 * 삼방사정 가중치.
 * 삼합파는 본궁을 주(主)로, 대궁(對宮)은 충조(沖照)로 강하게 작용하되
 * 본궁보다 약하게, 삼합 두 궁은 회조(會照)로 가장 약하게 본다.
 */
export const SAMBANG_WEIGHTS = {
  self: 1.0,
  opposite: 0.6,
  triangle: 0.4,
} as const;

/**
 * 空宮 차성(借星) 감쇠. 차성은 본궁 자체의 별이 아니라 대궁에서 빌려 온 것이므로
 * 실제 주성의 60%만 반영한다(차성안궁은 "힘이 약하지만 작용한다"는 통설).
 */
export const BORROWED_STAR_DECAY = 0.6;

/**
 * 주성 묘왕득리평함 점수 (0 = 보통). 묘/왕은 주성 힘이 온전, 평/함은 힘이 빠짐.
 * 함의 감점(-2)을 묘의 가점(+3)보다 작게 둔 것은 함지에서도 별 자체의
 * 작용은 남기 때문(함=무용이 아니라 감력).
 */
export const BRIGHTNESS_SCORE: Record<Brightness, number> = {
  묘: 3,
  왕: 2,
  득: 1,
  리: 0,
  평: -1,
  함: -2,
};

/**
 * 사화 가감. 화기는 장애·막힘으로 록·권·과 단일 항목보다 무겁게 본다
 * (사화 중 화기를 가장 경계하는 것이 삼합파·비성파 공통 통설).
 * 록 > 권 > 과 순서는 재물·실익 > 권한 > 명예 순.
 */
export const SIHUA_SCORE: Record<Sihua, number> = {
  화록: 3,
  화권: 2,
  화과: 1.5,
  화기: -3.5,
};

/**
 * 보좌성(吉星) 가점. 6길성(좌보·우필·문창·문곡·천괴·천월)은 동급 +1.0,
 * 록존은 화록과 동일 계열의 재성(財星)이며 단독 작용이 크므로 +1.5.
 * 천마·홍란·천희는 길흉이 궁·조합에 따라 갈려 방향성이 없어 제외.
 */
export const AUX_GOOD_SCORE: Record<string, number> = {
  좌보: 1,
  우필: 1,
  문창: 1,
  문곡: 1,
  천괴: 1,
  천월: 1,
  록존: 1.5,
};

/**
 * 살성(煞星) 감점. 경양(=양인)·타라는 6살성 중 형극이 큰 쪽으로 -1.5,
 * 화성·영성은 급변·충동 -1.2, 지공·지겁은 허무·소모 -1.2.
 */
export const AUX_BAD_SCORE: Record<string, number> = {
  양인: -1.5,
  경양: -1.5,
  타라: -1.5,
  화성: -1.2,
  영성: -1.2,
  지공: -1.2,
  지겁: -1.2,
};

/**
 * 영역별 살성 민감도. 지공·지겁은 재물의 소모(破財)에 직접 작용, 양타화령은
 * 신체 상해·질병(질액궁)에 직접 작용한다는 통설을 반영해 해당 영역만 +30%.
 */
export const SHA_CATEGORY_MULTIPLIER: Record<
  ScoreCategory,
  Record<string, number>
> = {
  wealth: { 지공: 1.3, 지겁: 1.3 },
  career: {},
  relationship: {},
  health: { 양인: 1.3, 경양: 1.3, 타라: 1.3, 화성: 1.3, 영성: 1.3 },
};

const starSihuaScore = (star: StarInfo): number =>
  star.sihua ? SIHUA_SCORE[star.sihua] : 0;

const mainStarScore = (star: StarInfo): number =>
  BRIGHTNESS_SCORE[star.brightness] + starSihuaScore(star);

/** 한 궁 단독의 점수 (삼방 가중 전) */
export const scorePalace = (
  palace: Palace,
  category: ScoreCategory
): number => {
  const hasOwnMain = palace.mainStars.length > 0;
  const mainSource = hasOwnMain
    ? palace.mainStars
    : (palace.borrowedMainStars ?? []);
  const mainFactor = hasOwnMain ? 1 : BORROWED_STAR_DECAY;
  const mainTotal =
    mainSource.reduce((sum, star) => sum + mainStarScore(star), 0) * mainFactor;

  const multipliers = SHA_CATEGORY_MULTIPLIER[category];
  const minorTotal = palace.minorStars.reduce((sum, star) => {
    const good = AUX_GOOD_SCORE[star.name] ?? 0;
    const bad = (AUX_BAD_SCORE[star.name] ?? 0) * (multipliers[star.name] ?? 1);
    return sum + good + bad + starSihuaScore(star);
  }, 0);

  return mainTotal + minorTotal;
};

const calculateCategoryRaw = (
  chart: ZiweiChart,
  category: ScoreCategory
): number => {
  const target = chart.palaces.find(
    (palace) => palace.name === LIFETIME_CATEGORY_PALACE[category]
  );
  if (!target) {
    throw new Error(`대상 궁을 찾을 수 없습니다: ${category}`);
  }
  const samBang = calculateSamBangSaJeong(chart.palaces, target.branch);
  if (!samBang) {
    throw new Error(`삼방사정을 계산할 수 없습니다: ${category}`);
  }
  const { self, opposite, triangle1, triangle2 } = samBang;
  const total =
    scorePalace(self, category) * SAMBANG_WEIGHTS.self +
    scorePalace(opposite, category) * SAMBANG_WEIGHTS.opposite +
    (scorePalace(triangle1, category) + scorePalace(triangle2, category)) *
      SAMBANG_WEIGHTS.triangle;
  // 부동소수 오차로 동점이 갈라지지 않게 소수 3자리로 고정
  return Math.round(total * 1000) / 1000;
};

/** 원국 기준 영역별 원점수 (단위 없음) */
export const calculateLifetimeRawScores = (
  chart: ZiweiChart
): CategoryScores => ({
  wealth: calculateCategoryRaw(chart, "wealth"),
  career: calculateCategoryRaw(chart, "career"),
  relationship: calculateCategoryRaw(chart, "relationship"),
  health: calculateCategoryRaw(chart, "health"),
});

/**
 * 분위 경계(오름차순)에서 원점수의 백분위 p(0~1)를 구한다.
 * 동점은 중간 순위로 처리해 이산 분포에서도 편향이 없게 한다.
 */
export const rawToPercentile = (quantiles: number[], raw: number): number => {
  if (quantiles.length === 0) {
    throw new Error(
      "분위 경계 상수가 비어 있습니다. 캘리브레이션을 실행하세요."
    );
  }
  const below = quantiles.filter((q) => q < raw).length;
  const belowOrEqual = quantiles.filter((q) => q <= raw).length;
  return (below + belowOrEqual) / 2 / quantiles.length;
};

/** 원점수 → 표시 점수 (40~95) */
export const toLifetimeDisplayScore = (
  category: ScoreCategory,
  raw: number
): number => {
  const p = rawToPercentile(LIFETIME_SCORE_QUANTILES[category], raw);
  return Math.round(40 + 55 * p);
};

/** 공개 함수: 명반 → 4영역 표시 점수 (40~95) */
export const calculateLifetimeCategoryScores = (
  chart: ZiweiChart
): CategoryScores => {
  const raw = calculateLifetimeRawScores(chart);
  return {
    wealth: toLifetimeDisplayScore("wealth", raw.wealth),
    career: toLifetimeDisplayScore("career", raw.career),
    relationship: toLifetimeDisplayScore("relationship", raw.relationship),
    health: toLifetimeDisplayScore("health", raw.health),
  };
};
