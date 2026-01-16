import type { BranchIndex, TimeBranchValue } from "../types";

const TIME_BRANCH_MAP: Record<TimeBranchValue, BranchIndex> = {
  자: 0,
  축: 1,
  인: 2,
  묘: 3,
  진: 4,
  사: 5,
  오: 6,
  미: 7,
  신: 8,
  유: 9,
  술: 10,
  해: 11,
};

export const timeBranchToIndex = (timeBranch: TimeBranchValue): BranchIndex => {
  return TIME_BRANCH_MAP[timeBranch];
};

export const getTimeBranch = (hour: number, minute: number): BranchIndex => {
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) return 0; // 자
  if (totalMinutes < 3 * 60) return 1; // 축
  if (totalMinutes < 5 * 60) return 2; // 인
  if (totalMinutes < 7 * 60) return 3; // 묘
  if (totalMinutes < 9 * 60) return 4; // 진
  if (totalMinutes < 11 * 60) return 5; // 사
  if (totalMinutes < 13 * 60) return 6; // 오
  if (totalMinutes < 15 * 60) return 7; // 미
  if (totalMinutes < 17 * 60) return 8; // 신
  if (totalMinutes < 19 * 60) return 9; // 유
  if (totalMinutes < 21 * 60) return 10; // 술
  return 11; // 해
};

export const parseTimeToTimeBranch = (timeString: string): BranchIndex => {
  const [hour, minute] = timeString.split(":").map(Number);
  return getTimeBranch(hour, minute);
};
