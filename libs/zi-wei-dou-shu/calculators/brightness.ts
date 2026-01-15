import { BRIGHTNESS_SCORE, STAR_BRIGHTNESS_TABLE } from "../constants";
import type { BranchIndex, Brightness } from "../types";

/**
 * 별의 밝기 조회
 *
 * @param star 별 이름
 * @param branch 지지 인덱스 (별이 위치한 궁)
 * @returns 밝기 (묘/왕/득/리/평/함)
 */
export const getStarBrightness = (
  star: string,
  branch: BranchIndex
): Brightness => {
  const brightnesses = STAR_BRIGHTNESS_TABLE[star];
  if (!brightnesses) {
    return "평"; // 보조성 등 밝기 테이블에 없는 별
  }
  return brightnesses[branch];
};

/**
 * 밝기 점수 조회 (해석 시 활용)
 * 묘: 100, 왕: 80, 득: 60, 리: 40, 평: 20, 함: 0
 */
export const getBrightnessScore = (brightness: Brightness): number => {
  return BRIGHTNESS_SCORE[brightness];
};

/**
 * 밝기가 긍정적인지 판단 (묘/왕/득)
 */
export const isPositiveBrightness = (brightness: Brightness): boolean => {
  return ["묘", "왕", "득"].includes(brightness);
};

/**
 * 밝기가 부정적인지 판단 (함/평)
 */
export const isNegativeBrightness = (brightness: Brightness): boolean => {
  return ["함", "평"].includes(brightness);
};
