import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  NAYIN_TABLE,
  WUXING_JU_MAP,
} from "../constants";
import type { BranchIndex, StemIndex, WuxingJu } from "../types";

import { getPalaceStem } from "./palace";

/**
 * 60갑자 간지 조합 반환
 */
export const getGanZhi = (stem: StemIndex, branch: BranchIndex): string => {
  return HEAVENLY_STEMS[stem] + EARTHLY_BRANCHES[branch];
};

/**
 * 간지로부터 납음 오행 반환
 */
export const getNayin = (stem: StemIndex, branch: BranchIndex): string => {
  const ganZhi = getGanZhi(stem, branch);
  return NAYIN_TABLE[ganZhi] ?? "토"; // 기본값
};

/**
 * 오행국 계산
 *
 * 명궁의 천간+지지로 납음을 구하고, 납음 오행에 따른 국수 반환
 *
 * @param yearStem 연간 인덱스
 * @param mingGongBranch 명궁 지지 인덱스
 * @returns 오행국 수 (2, 3, 4, 5, 6)
 */
export const calculateWuxingJu = (
  yearStem: StemIndex,
  mingGongBranch: BranchIndex
): WuxingJu => {
  const palaceStem = getPalaceStem(yearStem, mingGongBranch);
  const nayin = getNayin(palaceStem, mingGongBranch);
  return WUXING_JU_MAP[nayin] ?? 5; // 기본값: 토오국
};

/**
 * 오행국 이름 반환
 */
export const getWuxingJuName = (wuxingJu: WuxingJu): string => {
  const names: Record<WuxingJu, string> = {
    2: "수이국",
    3: "목삼국",
    4: "금사국",
    5: "토오국",
    6: "화육국",
  };
  return names[wuxingJu];
};
