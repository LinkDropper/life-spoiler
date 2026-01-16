import {
  arrangeMainStars,
  arrangeMinorStars,
  arrangePalaces,
  applySihuaToStars,
  calculateMingGong,
  calculateShenGong,
  calculateSihua,
  calculateWuxingJu,
  calculateZiweiPosition,
  getMainStarsInPalace,
  getMinorStarsInPalace,
  getPalaceStem,
  getStarBrightness,
  timeBranchToIndex,
} from "./calculators";
import { PALACE_ORDER } from "./constants";
import { ZiWeiError } from "./errors";
import { generateFortuneResult, generatePreviewOnly } from "./interpreter";
import { toLunarDate } from "./lunar";
import type {
  BranchIndex,
  FortuneResult,
  Palace,
  StarInfo,
  ZiweiAnalysisResult,
  ZiweiChart,
  ZiweiInput,
} from "./types";
import { ZiweiInputSchema } from "./types";

const validateInput = (input: ZiweiInput): void => {
  const result = ZiweiInputSchema.safeParse(input);
  if (!result.success) {
    throw new ZiWeiError("입력 데이터가 올바르지 않습니다.", {
      code: "INVALID_INPUT",
      originalError: result.error,
    });
  }
};

export const generateZiweiChart = (input: ZiweiInput): ZiweiChart => {
  validateInput(input);

  const lunarDate = toLunarDate(input);
  const timeBranch = timeBranchToIndex(input.birthTime);

  const mingGong = calculateMingGong(lunarDate.month, timeBranch);
  const shenGong = calculateShenGong(lunarDate.month, timeBranch);
  const wuxingJu = calculateWuxingJu(lunarDate.yearStem, mingGong);

  const palaceArrangement = arrangePalaces(mingGong);

  const ziweiPosition = calculateZiweiPosition(lunarDate.day, wuxingJu);

  const mainStarsMap = arrangeMainStars(ziweiPosition);

  const minorStarsMap = arrangeMinorStars(lunarDate, timeBranch);

  const sihua = calculateSihua(lunarDate.yearStem);

  const palaces: Palace[] = PALACE_ORDER.map((palaceName) => {
    const branch = palaceArrangement.get(palaceName) as BranchIndex;
    const stem = getPalaceStem(lunarDate.yearStem, branch);

    const mainStarNames = getMainStarsInPalace(mainStarsMap, branch);
    let mainStars: StarInfo[] = mainStarNames.map((name) => ({
      name,
      brightness: getStarBrightness(name, branch),
    }));

    mainStars = applySihuaToStars(mainStars, sihua);

    const minorStarNames = getMinorStarsInPalace(minorStarsMap, branch);
    let minorStars: StarInfo[] = minorStarNames.map((name) => ({
      name,
      brightness: "평",
    }));

    minorStars = applySihuaToStars(minorStars, sihua);

    return {
      name: palaceName,
      branch,
      stem,
      mainStars,
      minorStars,
      isShenGong: branch === shenGong,
    };
  });

  return {
    input,
    lunarDate,
    timeBranch,
    mingGong,
    shenGong,
    wuxingJu,
    palaces,
    sihua,
  };
};

export const interpretChart = (chart: ZiweiChart): FortuneResult => {
  return generateFortuneResult(chart);
};

export const getChartPreview = (
  chart: ZiweiChart
): FortuneResult["preview"] => {
  return generatePreviewOnly(chart);
};

export const analyzeZiwei = (input: ZiweiInput): ZiweiAnalysisResult => {
  const chart = generateZiweiChart(input);
  const result = interpretChart(chart);

  return {
    chart,
    result,
  };
};

export const getZiweiPreview = (
  input: ZiweiInput
): { chart: ZiweiChart; preview: FortuneResult["preview"] } => {
  const chart = generateZiweiChart(input);
  const preview = getChartPreview(chart);

  return {
    chart,
    preview,
  };
};
