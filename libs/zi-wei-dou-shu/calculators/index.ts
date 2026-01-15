// 시간 계산
export { getTimeBranch, parseTimeToTimeBranch } from "./time";

// 궁 계산
export {
  calculateMingGong,
  calculateShenGong,
  arrangePalaces,
  getPalaceStem,
} from "./palace";

// 오행국 계산
export {
  getGanZhi,
  getNayin,
  calculateWuxingJu,
  getWuxingJuName,
} from "./wuxing";

// 주성 계산
export {
  calculateZiweiPosition,
  calculateTianfuPosition,
  arrangeMainStars,
  getMainStarsInPalace,
} from "./main-stars";

// 밝기 계산
export {
  getStarBrightness,
  getBrightnessScore,
  isPositiveBrightness,
  isNegativeBrightness,
} from "./brightness";

// 보조성 계산
export {
  calculateZuofu,
  calculateYoubi,
  calculateWenchang,
  calculateWenqu,
  calculateTiankui,
  calculateTianyue,
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

// 사화성 계산
export {
  calculateSihua,
  getSihuaForStar,
  applySihuaToStars,
  getStarWithSihua,
  isPositiveSihua,
  isNegativeSihua,
} from "./sihua";

// 대운 계산
export {
  calculateDayun,
  getCurrentDayun,
  calculateDayunScores,
  calculateAllDayunScores,
  type DayunPeriod,
  type DayunResult,
} from "./dayun";
