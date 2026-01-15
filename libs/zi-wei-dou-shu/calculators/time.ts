import type { BranchIndex } from "../types";

/**
 * 시간을 12시진으로 변환
 *
 * 23:00-00:59 → 자시(0)
 * 01:00-02:59 → 축시(1)
 * 03:00-04:59 → 인시(2)
 * 05:00-06:59 → 묘시(3)
 * 07:00-08:59 → 진시(4)
 * 09:00-10:59 → 사시(5)
 * 11:00-12:59 → 오시(6)
 * 13:00-14:59 → 미시(7)
 * 15:00-16:59 → 신시(8)
 * 17:00-18:59 → 유시(9)
 * 19:00-20:59 → 술시(10)
 * 21:00-22:59 → 해시(11)
 */
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

/**
 * 시간 문자열(HH:mm)을 파싱하여 시진 반환
 */
export const parseTimeToTimeBranch = (timeString: string): BranchIndex => {
  const [hour, minute] = timeString.split(":").map(Number);
  return getTimeBranch(hour, minute);
};
