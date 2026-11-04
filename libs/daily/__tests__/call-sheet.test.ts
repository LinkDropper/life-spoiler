import {
  formatCallSheetDate,
  formatCallSheetWeekday,
  getTimeUntilNextCall,
} from "../call-sheet";

describe("formatCallSheetDate", () => {
  it("YYYY.MM.DD로 바꾼다", () => {
    expect(formatCallSheetDate("2026-11-05")).toBe("2026.11.05");
  });
});

describe("formatCallSheetWeekday", () => {
  it("실행 환경 시간대와 무관하게 그 날짜의 요일을 준다", () => {
    expect(formatCallSheetWeekday("2026-11-05", "ko")).toBe("목");
    expect(formatCallSheetWeekday("2026-11-05", "en")).toBe("Thu");
  });
});

describe("getTimeUntilNextCall", () => {
  it("KST 기준 다음 자정까지 남은 시간을 준다", () => {
    // 2026-11-05 15:20 KST = 06:20 UTC
    expect(getTimeUntilNextCall(new Date("2026-11-05T06:20:00Z"))).toEqual({
      hours: 8,
      minutes: 40,
    });
  });

  it("남은 초는 분으로 올림한다", () => {
    // 23:59:30 KST
    expect(getTimeUntilNextCall(new Date("2026-11-05T14:59:30Z"))).toEqual({
      hours: 0,
      minutes: 1,
    });
  });
});
