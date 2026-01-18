import {
  QINGYANG_TABLE,
  TIANKUI_TABLE,
  TIANMA_TABLE,
  TIANYUE_TABLE,
  TUOLUO_TABLE,
} from "../constants";
import type { BranchIndex, LunarDate, StemIndex } from "../types";

// ============================================================
// 보좌성 (輔助星)
// ============================================================

/**
 * 좌보 위치 계산 (월 기준 순행)
 * 진(辰)에서 시작, 월수만큼 순행
 */
export const calculateZuofu = (lunarMonth: number): BranchIndex => {
  return ((4 + lunarMonth - 1) % 12) as BranchIndex;
};

/**
 * 우필 위치 계산 (월 기준 역행)
 * 술(戌)에서 시작, 월수만큼 역행
 */
export const calculateYoubi = (lunarMonth: number): BranchIndex => {
  return ((10 - lunarMonth + 1 + 12) % 12) as BranchIndex;
};

/**
 * 문창 위치 계산 (시 기준 역행)
 * 술(戌)에서 시작, 시진만큼 역행
 */
export const calculateWenchang = (timeBranch: BranchIndex): BranchIndex => {
  return ((10 - timeBranch + 12) % 12) as BranchIndex;
};

/**
 * 문곡 위치 계산 (시 기준 순행)
 * 진(辰)에서 시작, 시진만큼 순행
 */
export const calculateWenqu = (timeBranch: BranchIndex): BranchIndex => {
  return ((4 + timeBranch) % 12) as BranchIndex;
};

/**
 * 천괴 위치 조회 (연간 기준)
 */
export const calculateTiankui = (yearStem: StemIndex): BranchIndex => {
  return TIANKUI_TABLE[yearStem];
};

/**
 * 천월 위치 조회 (연간 기준)
 */
export const calculateTianyue = (yearStem: StemIndex): BranchIndex => {
  return TIANYUE_TABLE[yearStem];
};

// ============================================================
// 살성 (煞星)
// ============================================================

/**
 * 화성 위치 계산 (연지와 시 기준)
 *
 * @출처 삼합파(三合派)
 * @검증일 2026-01-18
 * @학파차이 북파(北派)와 일부 시작점 차이 있을 수 있음
 *
 * 인오술년: 축에서 시작
 * 신자진년: 인에서 시작
 * 사유축년: 묘에서 시작
 * 해묘미년: 유에서 시작
 */
export const calculateHuoxing = (
  yearBranch: BranchIndex,
  timeBranch: BranchIndex
): BranchIndex => {
  let start: BranchIndex;

  if ([2, 6, 10].includes(yearBranch)) {
    start = 1; // 인오술 → 축
  } else if ([8, 0, 4].includes(yearBranch)) {
    start = 2; // 신자진 → 인
  } else if ([5, 9, 1].includes(yearBranch)) {
    start = 3; // 사유축 → 묘
  } else {
    start = 9; // 해묘미 → 유
  }

  return ((start + timeBranch) % 12) as BranchIndex;
};

/**
 * 영성 위치 계산 (연지와 시 기준)
 *
 * @출처 삼합파(三合派)
 * @검증일 2026-01-18
 * @학파차이 북파(北派)와 일부 시작점 차이 있을 수 있음
 *
 * 인오술년: 묘에서 시작
 * 신자진년: 술에서 시작
 * 사유축년: 술에서 시작
 * 해묘미년: 묘에서 시작
 */
export const calculateLingxing = (
  yearBranch: BranchIndex,
  timeBranch: BranchIndex
): BranchIndex => {
  let start: BranchIndex;

  if ([2, 6, 10].includes(yearBranch)) {
    start = 3; // 인오술 → 묘
  } else if ([8, 0, 4].includes(yearBranch)) {
    start = 10; // 신자진 → 술
  } else if ([5, 9, 1].includes(yearBranch)) {
    start = 10; // 사유축 → 술
  } else {
    start = 3; // 해묘미 → 묘
  }

  return ((start + timeBranch) % 12) as BranchIndex;
};

/**
 * 양인 위치 조회 (연간 기준)
 */
export const calculateQingyang = (yearStem: StemIndex): BranchIndex => {
  return QINGYANG_TABLE[yearStem];
};

/**
 * 타라 위치 조회 (연간 기준)
 */
export const calculateTuoluo = (yearStem: StemIndex): BranchIndex => {
  return TUOLUO_TABLE[yearStem];
};

/**
 * 지겁 위치 계산 (시 기준)
 * 해(亥)에서 시작, 시진만큼 순행
 */
export const calculateDijie = (timeBranch: BranchIndex): BranchIndex => {
  return ((11 + timeBranch) % 12) as BranchIndex;
};

/**
 * 지공 위치 계산 (시 기준)
 * 해(亥)에서 시작, 시진만큼 역행
 */
export const calculateDikong = (timeBranch: BranchIndex): BranchIndex => {
  return ((11 - timeBranch + 12) % 12) as BranchIndex;
};

// ============================================================
// 기타 중요 별
// ============================================================

/**
 * 천마 위치 조회 (연지 기준)
 */
export const calculateTianma = (yearBranch: BranchIndex): BranchIndex => {
  return TIANMA_TABLE[yearBranch];
};

/**
 * 홍란 위치 계산 (연지 기준)
 * 묘(卯)에서 시작, 연지만큼 역행
 */
export const calculateHongluan = (yearBranch: BranchIndex): BranchIndex => {
  return ((3 - yearBranch + 12) % 12) as BranchIndex;
};

/**
 * 천희 위치 계산 (연지 기준)
 * 유(酉)에서 시작, 연지만큼 역행
 */
export const calculateTianxi = (yearBranch: BranchIndex): BranchIndex => {
  return ((9 - yearBranch + 12) % 12) as BranchIndex;
};

// ============================================================
// 보조성 전체 배치
// ============================================================

/**
 * 모든 보조성/살성 배치
 */
export const arrangeMinorStars = (
  lunarDate: LunarDate,
  timeBranch: BranchIndex
): Map<string, BranchIndex> => {
  const stars = new Map<string, BranchIndex>();

  // 보좌성
  stars.set("좌보", calculateZuofu(lunarDate.month));
  stars.set("우필", calculateYoubi(lunarDate.month));
  stars.set("문창", calculateWenchang(timeBranch));
  stars.set("문곡", calculateWenqu(timeBranch));
  stars.set("천괴", calculateTiankui(lunarDate.yearStem));
  stars.set("천월", calculateTianyue(lunarDate.yearStem));

  // 살성
  stars.set("화성", calculateHuoxing(lunarDate.yearBranch, timeBranch));
  stars.set("영성", calculateLingxing(lunarDate.yearBranch, timeBranch));
  stars.set("양인", calculateQingyang(lunarDate.yearStem));
  stars.set("타라", calculateTuoluo(lunarDate.yearStem));
  stars.set("지겁", calculateDijie(timeBranch));
  stars.set("지공", calculateDikong(timeBranch));

  // 기타
  stars.set("천마", calculateTianma(lunarDate.yearBranch));
  stars.set("홍란", calculateHongluan(lunarDate.yearBranch));
  stars.set("천희", calculateTianxi(lunarDate.yearBranch));

  return stars;
};

/**
 * 특정 궁에 있는 보조성 목록 반환
 */
export const getMinorStarsInPalace = (
  minorStars: Map<string, BranchIndex>,
  palaceBranch: BranchIndex
): string[] => {
  const result: string[] = [];

  minorStars.forEach((branch, starName) => {
    if (branch === palaceBranch) {
      result.push(starName);
    }
  });

  return result;
};
