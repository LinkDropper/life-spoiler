import type { BranchIndex, Palace } from "../types";

// ============================================================
// 삼방사정(三方四正) 계산
// ============================================================

export interface SamBangSaJeong {
  /** 본궁 */
  self: Palace;
  /** 대궁 (본궁 + 6) */
  opposite: Palace;
  /** 삼합궁 1 (본궁 + 4) */
  triangle1: Palace;
  /** 삼합궁 2 (본궁 + 8) */
  triangle2: Palace;
}

/**
 * 지지 인덱스로 궁 찾기
 */
const findPalaceByBranch = (
  palaces: Palace[],
  branchIndex: BranchIndex
): Palace | undefined => {
  return palaces.find((p) => p.branch === branchIndex);
};

/**
 * 삼방사정 계산
 *
 * 삼방사정 = 본궁(X) + 대궁(X+6) + 삼합1(X+4) + 삼합2(X+8) (mod 12)
 *
 * @param palaces 12궁 배열
 * @param targetBranch 대상 궁의 지지 인덱스
 * @returns 삼방사정 4궁 데이터 (궁을 찾지 못하면 null)
 */
export const calculateSamBangSaJeong = (
  palaces: Palace[],
  targetBranch: BranchIndex
): SamBangSaJeong | null => {
  const selfPalace = findPalaceByBranch(palaces, targetBranch);
  const oppositeBranch = ((targetBranch + 6) % 12) as BranchIndex;
  const triangle1Branch = ((targetBranch + 4) % 12) as BranchIndex;
  const triangle2Branch = ((targetBranch + 8) % 12) as BranchIndex;

  const oppositePalace = findPalaceByBranch(palaces, oppositeBranch);
  const triangle1Palace = findPalaceByBranch(palaces, triangle1Branch);
  const triangle2Palace = findPalaceByBranch(palaces, triangle2Branch);

  if (!selfPalace || !oppositePalace || !triangle1Palace || !triangle2Palace) {
    return null;
  }

  return {
    self: selfPalace,
    opposite: oppositePalace,
    triangle1: triangle1Palace,
    triangle2: triangle2Palace,
  };
};
