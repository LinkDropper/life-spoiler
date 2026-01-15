import {
  TIANFU_FROM_ZIWEI,
  TIANFU_GROUP_OFFSETS,
  ZIWEI_GROUP_OFFSETS,
  ZIWEI_POSITION_TABLE,
} from "../constants";
import type { BranchIndex, WuxingJu } from "../types";

/**
 * 자미성 위치 계산
 *
 * @param lunarDay 음력 일 (1-30)
 * @param wuxingJu 오행국 수 (2, 3, 4, 5, 6)
 * @returns 자미성이 위치한 지지 인덱스
 */
export const calculateZiweiPosition = (
  lunarDay: number,
  wuxingJu: WuxingJu
): BranchIndex => {
  // 음력일이 테이블 범위를 벗어나면 보정
  const day = Math.min(Math.max(lunarDay, 1), 30);
  return ZIWEI_POSITION_TABLE[wuxingJu][day];
};

/**
 * 천부성 위치 계산 (자미성과 인-신 축 대칭)
 */
export const calculateTianfuPosition = (
  ziweiPos: BranchIndex
): BranchIndex => {
  return TIANFU_FROM_ZIWEI[ziweiPos];
};

/**
 * 14주성 전체 배치
 *
 * @param ziweiPos 자미성 위치
 * @returns 별 이름 → 지지 인덱스 매핑
 */
export const arrangeMainStars = (
  ziweiPos: BranchIndex
): Map<string, BranchIndex> => {
  const stars = new Map<string, BranchIndex>();
  const tianfuPos = calculateTianfuPosition(ziweiPos);

  // 자미 계열 배치 (자미 기준 역행)
  Object.entries(ZIWEI_GROUP_OFFSETS).forEach(([star, offset]) => {
    const pos = ((((ziweiPos + offset) % 12) + 12) % 12) as BranchIndex;
    stars.set(star, pos);
  });

  // 천부 계열 배치 (천부 기준 순행)
  Object.entries(TIANFU_GROUP_OFFSETS).forEach(([star, offset]) => {
    const pos = ((tianfuPos + offset) % 12) as BranchIndex;
    stars.set(star, pos);
  });

  return stars;
};

/**
 * 특정 궁에 있는 주성 목록 반환
 */
export const getMainStarsInPalace = (
  mainStars: Map<string, BranchIndex>,
  palaceBranch: BranchIndex
): string[] => {
  const result: string[] = [];

  mainStars.forEach((branch, starName) => {
    if (branch === palaceBranch) {
      result.push(starName);
    }
  });

  return result;
};
