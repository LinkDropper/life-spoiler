import KoreanLunarCalendar from "korean-lunar-calendar";

import { ZiWeiError } from "../errors";
import type { BranchIndex, LunarDate, StemIndex, ZiweiInput } from "../types";

/**
 * 음력 변환 결과
 */
interface LunarConversionResult {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
}

/**
 * 양력 → 음력 변환
 */
export const convertSolarToLunar = (
  year: number,
  month: number,
  day: number
): LunarConversionResult => {
  const calendar = new KoreanLunarCalendar();
  calendar.setSolarDate(year, month, day);

  const lunar = calendar.getLunarCalendar();

  return {
    lunarYear: lunar.year,
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    isLeapMonth: lunar.intercalation ?? false,
  };
};

/**
 * 연도로부터 천간 계산 (갑자년 = 서기 4년 기준)
 */
export const getYearStem = (lunarYear: number): StemIndex => {
  return ((((lunarYear - 4) % 10) + 10) % 10) as StemIndex;
};

/**
 * 연도로부터 지지 계산
 */
export const getYearBranch = (lunarYear: number): BranchIndex => {
  return ((((lunarYear - 4) % 12) + 12) % 12) as BranchIndex;
};

/**
 * ZiweiInput을 LunarDate로 변환
 */
export const toLunarDate = (input: ZiweiInput): LunarDate => {
  try {
    const [year, month, day] = input.birthDate.split("-").map(Number);

    if (input.calendarType === "lunar") {
      // 음력 직접 입력
      return {
        year,
        month,
        day,
        isLeapMonth: input.isLeapMonth ?? false,
        yearStem: getYearStem(year),
        yearBranch: getYearBranch(year),
      };
    }

    // 양력 → 음력 변환
    const lunar = convertSolarToLunar(year, month, day);

    return {
      year: lunar.lunarYear,
      month: lunar.lunarMonth,
      day: lunar.lunarDay,
      isLeapMonth: lunar.isLeapMonth,
      yearStem: getYearStem(lunar.lunarYear),
      yearBranch: getYearBranch(lunar.lunarYear),
    };
  } catch (error) {
    throw new ZiWeiError("음력 변환에 실패했습니다.", {
      code: "LUNAR_CONVERSION_FAILED",
      field: "birthDate",
      originalError: error,
    });
  }
};
