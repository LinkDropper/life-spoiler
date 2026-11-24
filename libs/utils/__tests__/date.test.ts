import { calculateAgeInYear } from "../date";

describe("calculateAgeInYear", () => {
  const today = new Date("2026-11-24T12:00:00+09:00");

  it("올해 운세는 지금 만 나이와 같다", () => {
    expect(calculateAgeInYear("2003-08-08", 2026, today)).toBe(23);
    expect(calculateAgeInYear("2003-12-30", 2026, today)).toBe(22);
  });

  it("내년 운세는 지금 나이에 1살을 더한다", () => {
    expect(calculateAgeInYear("2003-08-08", 2027, today)).toBe(24);
    expect(calculateAgeInYear("2003-12-30", 2027, today)).toBe(23);
  });
});
