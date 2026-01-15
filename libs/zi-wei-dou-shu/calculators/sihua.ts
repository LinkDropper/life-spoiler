import { SIHUA_TABLE } from "../constants";
import type { Sihua, SihuaResult, StemIndex, StarInfo } from "../types";

/**
 * 사화성 계산
 *
 * @param yearStem 연간 인덱스
 * @returns 사화 결과 (화록/화권/화과/화기가 붙는 별 이름)
 */
export const calculateSihua = (yearStem: StemIndex): SihuaResult => {
  return SIHUA_TABLE[yearStem];
};

/**
 * 별에 사화성 적용
 *
 * @param starName 별 이름
 * @param sihua 사화 결과
 * @returns 해당 별에 붙는 사화 (없으면 undefined)
 */
export const getSihuaForStar = (
  starName: string,
  sihua: SihuaResult
): Sihua | undefined => {
  if (sihua.hualu === starName) return "화록";
  if (sihua.huaquan === starName) return "화권";
  if (sihua.huake === starName) return "화과";
  if (sihua.huaji === starName) return "화기";
  return undefined;
};

/**
 * 별 목록에 사화성 적용
 */
export const applySihuaToStars = (
  stars: StarInfo[],
  sihua: SihuaResult
): StarInfo[] => {
  return stars.map((star) => ({
    ...star,
    sihua: getSihuaForStar(star.name, sihua),
  }));
};

/**
 * 특정 사화가 어떤 별에 붙어있는지 반환
 */
export const getStarWithSihua = (
  sihua: SihuaResult,
  sihuaType: Sihua
): string => {
  switch (sihuaType) {
    case "화록":
      return sihua.hualu;
    case "화권":
      return sihua.huaquan;
    case "화과":
      return sihua.huake;
    case "화기":
      return sihua.huaji;
  }
};

/**
 * 사화가 긍정적인지 판단
 */
export const isPositiveSihua = (sihua: Sihua): boolean => {
  return ["화록", "화권", "화과"].includes(sihua);
};

/**
 * 사화가 부정적인지 판단 (화기)
 */
export const isNegativeSihua = (sihua: Sihua): boolean => {
  return sihua === "화기";
};
