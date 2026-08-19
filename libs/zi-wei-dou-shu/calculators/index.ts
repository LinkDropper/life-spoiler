export {
  timeBranchToIndex,
  getTimeBranch,
  parseTimeToTimeBranch,
} from "./time";

export {
  calculateMingGong,
  calculateShenGong,
  arrangePalaces,
  getPalaceStem,
} from "./palace";

export {
  getGanZhi,
  getNayin,
  calculateWuxingJu,
  getWuxingJuName,
} from "./wuxing";

export {
  calculateZiweiPosition,
  calculateTianfuPosition,
  arrangeMainStars,
  getMainStarsInPalace,
} from "./main-stars";

export {
  getStarBrightness,
  getBrightnessScore,
  isPositiveBrightness,
  isNegativeBrightness,
} from "./brightness";

export {
  calculateZuofu,
  calculateYoubi,
  calculateWenchang,
  calculateWenqu,
  calculateTiankui,
  calculateTianyue,
  calculateLucun,
  calculateHuoxing,
  calculateLingxing,
  calculateQingyang,
  calculateTuoluo,
  calculateDijie,
  calculateDikong,
  calculateTianma,
  calculateHongluan,
  calculateTianxi,
  arrangeMinorStars,
  getMinorStarsInPalace,
} from "./minor-stars";

export {
  calculateSihua,
  getSihuaForStar,
  applySihuaToStars,
  getStarWithSihua,
  isPositiveSihua,
  isNegativeSihua,
} from "./sihua";

export {
  calculateDayun,
  getCurrentDayun,
  calculateDayunScores,
  calculateAllDayunScores,
  type DayunPeriod,
  type DayunResult,
} from "./dayun";

export {
  getYearStemBranch,
  getMonthStem,
  getMonthBranch,
  calculateYearlySihua,
  calculateYearlyPalaces,
  calculateYearlyPeachBlossom,
  calculateMonthlyFortunes,
  calculateYearlyFortune,
  getLuckyAndCautionMonths,
  type YearlySihua,
  type YearlySihuaEffect,
  type YearlyPalaceInfo,
  type YearlyPeachBlossomInfo,
  type MonthlyFortune,
  type YearlyFortuneResult,
} from "./yearly";

export { calculateSamBangSaJeong, type SamBangSaJeong } from "./sam-bang";

export { resolveEmptyPalaces, getEffectiveMainStars } from "./empty-palace";

export { identifyGeokGuk, type IdentifiedGeokGuk } from "./geok-guk";

export {
  extractKeywordsFromChart,
  extractKeywordsWithDetails,
  extractOneLinerFromChart,
  type KeywordExtractionResult,
} from "./keywords";

export {
  calculateYearlyInsights,
  SAMHAP_GROUPS,
  YUKHAP_PAIRS,
  BRANCH_TO_ANIMAL,
  ELEMENT_GENERATES,
  type YearlyInsights,
  type MonthInsight,
  type WealthStrategy,
  type RomanceMode,
  type LuckyPlace,
  type NobleHelper,
  type HealthWarning,
  type LuckyColor,
} from "./yearly-insights";

export {
  analyzeZodiacCompatibility,
  analyzeFiveElementCompatibility,
  calculateBaseScoreRange,
  type ZodiacCompatibility,
  type FiveElementCompatibility,
  type ScoreRange,
} from "./compatibility";

export {
  buildPersonalityProfile,
  type PersonalityProfile,
} from "./personality-profile";

export {
  analyzeCompatibility,
  type CompatibilityAnalysis,
  type CategoryAnalysis,
  type ScoreConstraint,
} from "./compatibility-analysis";

// NOTE: `calculators/friend-compatibility.ts`는 `core.ts`(generateZiweiChart)에
// 의존하고 `core.ts`는 이 index를 import하므로, 여기서 re-export하면 순환 참조가 된다.
// 친구 우주 궁합은 라이브러리 루트 `index.ts`에서만 export한다.
// 같은 이유로 `calculators/owner-one-liner.ts`(owner 1인 운세 한줄평)도
// 여기서 re-export하지 않고 루트 `index.ts`에서만 export한다.
