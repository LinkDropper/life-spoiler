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
  parseTimeToTimeBranch,
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

// ============================================================
// 입력 검증
// ============================================================

/**
 * 입력 데이터 검증
 */
const validateInput = (input: ZiweiInput): void => {
  const result = ZiweiInputSchema.safeParse(input);
  if (!result.success) {
    throw new ZiWeiError("입력 데이터가 올바르지 않습니다.", {
      code: "INVALID_INPUT",
      originalError: result.error,
    });
  }
};

// ============================================================
// 명반 생성
// ============================================================

/**
 * 자미두수 명반 생성
 *
 * @param input 입력 데이터 (이름, 생년월일시, 성별, 달력유형)
 * @returns 완성된 명반 (ZiweiChart)
 */
export const generateZiweiChart = (input: ZiweiInput): ZiweiChart => {
  // 1. 입력 검증
  validateInput(input);

  // 2. 음력 변환
  const lunarDate = toLunarDate(input);

  // 3. 시진 계산
  const timeBranch = parseTimeToTimeBranch(input.birthTime);

  // 4. 명궁/신궁 계산
  const mingGong = calculateMingGong(lunarDate.month, timeBranch);
  const shenGong = calculateShenGong(lunarDate.month, timeBranch);

  // 5. 오행국 계산
  const wuxingJu = calculateWuxingJu(lunarDate.yearStem, mingGong);

  // 6. 12궁 배치
  const palaceArrangement = arrangePalaces(mingGong);

  // 7. 자미성 위치 계산
  const ziweiPosition = calculateZiweiPosition(lunarDate.day, wuxingJu);

  // 8. 14주성 배치
  const mainStarsMap = arrangeMainStars(ziweiPosition);

  // 9. 보조성 배치
  const minorStarsMap = arrangeMinorStars(lunarDate, timeBranch);

  // 10. 사화성 계산
  const sihua = calculateSihua(lunarDate.yearStem);

  // 11. 12궁 완성 (별 + 밝기 + 사화 적용)
  const palaces: Palace[] = PALACE_ORDER.map((palaceName) => {
    const branch = palaceArrangement.get(palaceName) as BranchIndex;
    const stem = getPalaceStem(lunarDate.yearStem, branch);

    // 해당 궁의 주성 목록
    const mainStarNames = getMainStarsInPalace(mainStarsMap, branch);
    let mainStars: StarInfo[] = mainStarNames.map((name) => ({
      name,
      brightness: getStarBrightness(name, branch),
    }));

    // 사화 적용
    mainStars = applySihuaToStars(mainStars, sihua);

    // 해당 궁의 보조성 목록
    const minorStarNames = getMinorStarsInPalace(minorStarsMap, branch);
    let minorStars: StarInfo[] = minorStarNames.map((name) => ({
      name,
      brightness: "평", // 보조성은 밝기 테이블이 없음
    }));

    // 보조성에도 사화 적용 (문창, 문곡 등)
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

// ============================================================
// 운세 해석 생성
// ============================================================

/**
 * 명반 기반 운세 해석 생성
 *
 * @param chart 자미두수 명반
 * @returns 운세 해석 결과
 */
export const interpretChart = (chart: ZiweiChart): FortuneResult => {
  return generateFortuneResult(chart);
};

/**
 * 미리보기만 생성 (결제 전)
 *
 * @param chart 자미두수 명반
 * @returns 미리보기 정보
 */
export const getChartPreview = (
  chart: ZiweiChart
): FortuneResult["preview"] => {
  return generatePreviewOnly(chart);
};

// ============================================================
// 편의 함수 (한 번에 처리)
// ============================================================

/**
 * 입력부터 해석까지 한 번에 처리
 *
 * @param input 입력 데이터
 * @returns 명반 + 해석 결과
 */
export const analyzeZiwei = (input: ZiweiInput): ZiweiAnalysisResult => {
  const chart = generateZiweiChart(input);
  const result = interpretChart(chart);

  return {
    chart,
    result,
  };
};

/**
 * 입력부터 미리보기까지 한 번에 처리
 *
 * @param input 입력 데이터
 * @returns 명반 + 미리보기
 */
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
