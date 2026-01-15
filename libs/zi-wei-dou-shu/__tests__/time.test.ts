import { getTimeBranch, parseTimeToTimeBranch } from "../calculators/time";

describe("시진 변환", () => {
  describe("getTimeBranch", () => {
    it("자시(23:00-00:59)는 0을 반환한다", () => {
      expect(getTimeBranch(23, 0)).toBe(0);
      expect(getTimeBranch(23, 30)).toBe(0);
      expect(getTimeBranch(0, 0)).toBe(0);
      expect(getTimeBranch(0, 59)).toBe(0);
    });

    it("축시(01:00-02:59)는 1을 반환한다", () => {
      expect(getTimeBranch(1, 0)).toBe(1);
      expect(getTimeBranch(2, 30)).toBe(1);
    });

    it("인시(03:00-04:59)는 2를 반환한다", () => {
      expect(getTimeBranch(3, 0)).toBe(2);
      expect(getTimeBranch(4, 59)).toBe(2);
    });

    it("묘시(05:00-06:59)는 3을 반환한다", () => {
      expect(getTimeBranch(5, 0)).toBe(3);
      expect(getTimeBranch(6, 59)).toBe(3);
    });

    it("진시(07:00-08:59)는 4를 반환한다", () => {
      expect(getTimeBranch(7, 0)).toBe(4);
      expect(getTimeBranch(8, 59)).toBe(4);
    });

    it("사시(09:00-10:59)는 5를 반환한다", () => {
      expect(getTimeBranch(9, 0)).toBe(5);
      expect(getTimeBranch(10, 59)).toBe(5);
    });

    it("오시(11:00-12:59)는 6을 반환한다", () => {
      expect(getTimeBranch(11, 0)).toBe(6);
      expect(getTimeBranch(12, 0)).toBe(6);
      expect(getTimeBranch(12, 59)).toBe(6);
    });

    it("미시(13:00-14:59)는 7을 반환한다", () => {
      expect(getTimeBranch(13, 0)).toBe(7);
      expect(getTimeBranch(14, 59)).toBe(7);
    });

    it("신시(15:00-16:59)는 8을 반환한다", () => {
      expect(getTimeBranch(15, 0)).toBe(8);
      expect(getTimeBranch(16, 59)).toBe(8);
    });

    it("유시(17:00-18:59)는 9를 반환한다", () => {
      expect(getTimeBranch(17, 0)).toBe(9);
      expect(getTimeBranch(18, 59)).toBe(9);
    });

    it("술시(19:00-20:59)는 10을 반환한다", () => {
      expect(getTimeBranch(19, 0)).toBe(10);
      expect(getTimeBranch(20, 59)).toBe(10);
    });

    it("해시(21:00-22:59)는 11을 반환한다", () => {
      expect(getTimeBranch(21, 0)).toBe(11);
      expect(getTimeBranch(22, 59)).toBe(11);
    });
  });

  describe("parseTimeToTimeBranch", () => {
    it("HH:mm 문자열을 올바르게 파싱한다", () => {
      expect(parseTimeToTimeBranch("00:00")).toBe(0);
      expect(parseTimeToTimeBranch("12:00")).toBe(6);
      expect(parseTimeToTimeBranch("23:59")).toBe(0);
    });

    it("잘못된 형식에 대해 에러를 던진다", () => {
      expect(() => parseTimeToTimeBranch("invalid")).toThrow();
      expect(() => parseTimeToTimeBranch("25:00")).toThrow();
    });
  });
});
