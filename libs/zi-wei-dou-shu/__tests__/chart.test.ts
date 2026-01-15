import { analyzeZiwei, generateZiweiChart } from "../core";
import { ZiWeiError } from "../errors";
import type { ZiweiInput } from "../types";

describe("자미두수 통합 테스트", () => {
  const validInput: ZiweiInput = {
    name: "홍길동",
    birthDate: "1990-05-15",
    birthTime: "12:00",
    gender: "male",
    calendarType: "solar",
  };

  describe("generateZiweiChart", () => {
    it("유효한 입력으로 명반을 생성한다", () => {
      const chart = generateZiweiChart(validInput);

      expect(chart).toBeDefined();
      expect(chart.input).toEqual(validInput);
      expect(chart.palaces).toHaveLength(12);
      expect(chart.mingGong).toBeGreaterThanOrEqual(0);
      expect(chart.mingGong).toBeLessThanOrEqual(11);
    });

    it("음력 날짜가 올바르게 변환된다", () => {
      const chart = generateZiweiChart(validInput);

      expect(chart.lunarDate).toBeDefined();
      expect(chart.lunarDate.year).toBeGreaterThan(0);
      expect(chart.lunarDate.month).toBeGreaterThanOrEqual(1);
      expect(chart.lunarDate.month).toBeLessThanOrEqual(12);
      expect(chart.lunarDate.day).toBeGreaterThanOrEqual(1);
      expect(chart.lunarDate.day).toBeLessThanOrEqual(30);
    });

    it("오행국이 유효한 값이다", () => {
      const chart = generateZiweiChart(validInput);

      expect([2, 3, 4, 5, 6]).toContain(chart.wuxingJu);
    });

    it("12궁 각각에 이름과 지지가 있다", () => {
      const chart = generateZiweiChart(validInput);

      chart.palaces.forEach((palace) => {
        expect(palace.name).toBeDefined();
        expect(palace.branch).toBeGreaterThanOrEqual(0);
        expect(palace.branch).toBeLessThanOrEqual(11);
        expect(palace.stem).toBeGreaterThanOrEqual(0);
        expect(palace.stem).toBeLessThanOrEqual(9);
        expect(Array.isArray(palace.mainStars)).toBe(true);
        expect(Array.isArray(palace.minorStars)).toBe(true);
      });
    });

    it("사화가 올바르게 배치된다", () => {
      const chart = generateZiweiChart(validInput);

      expect(chart.sihua).toBeDefined();
      expect(chart.sihua.hualu).toBeDefined();
      expect(chart.sihua.huaquan).toBeDefined();
      expect(chart.sihua.huake).toBeDefined();
      expect(chart.sihua.huaji).toBeDefined();
    });

    it("주성에 밝기가 있다", () => {
      const chart = generateZiweiChart(validInput);

      const mingPalace = chart.palaces.find((p) => p.name === "명궁");
      if (mingPalace && mingPalace.mainStars.length > 0) {
        mingPalace.mainStars.forEach((star) => {
          expect(["묘", "왕", "득", "리", "평", "함"]).toContain(
            star.brightness
          );
        });
      }
    });

    it("잘못된 입력에 대해 에러를 던진다", () => {
      const invalidInput = {
        ...validInput,
        birthDate: "invalid-date",
      };

      expect(() => generateZiweiChart(invalidInput)).toThrow(ZiWeiError);
    });
  });

  describe("analyzeZiwei", () => {
    it("명반과 해석 결과를 함께 반환한다", () => {
      const result = analyzeZiwei(validInput);

      expect(result.chart).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.summary).toBeDefined();
      expect(result.result.preview).toBeDefined();
      expect(result.result.wealth).toBeDefined();
      expect(result.result.career).toBeDefined();
      expect(result.result.relationship).toBeDefined();
      expect(result.result.health).toBeDefined();
    });

    it("미리보기에 요약이 포함된다", () => {
      const result = analyzeZiwei(validInput);

      expect(result.result.preview.summary).toBeDefined();
      expect(result.result.preview.description).toBeDefined();
    });

    it("각 섹션에 제목과 내용이 있다", () => {
      const result = analyzeZiwei(validInput);

      expect(result.result.wealth.title).toBeDefined();
      expect(result.result.wealth.content).toBeDefined();
      expect(result.result.career.title).toBeDefined();
      expect(result.result.career.content).toBeDefined();
    });
  });

  describe("다양한 생년월일 테스트", () => {
    it("음력 입력도 처리한다", () => {
      const lunarInput: ZiweiInput = {
        name: "김철수",
        birthDate: "1985-08-20",
        birthTime: "03:30",
        gender: "male",
        calendarType: "lunar",
      };

      const chart = generateZiweiChart(lunarInput);
      expect(chart).toBeDefined();
    });

    it("여성 명반도 생성한다", () => {
      const femaleInput: ZiweiInput = {
        name: "이영희",
        birthDate: "1992-12-25",
        birthTime: "23:30",
        gender: "female",
        calendarType: "solar",
      };

      const chart = generateZiweiChart(femaleInput);
      expect(chart).toBeDefined();
    });

    it("자정 출생도 처리한다", () => {
      const midnightInput: ZiweiInput = {
        name: "박자정",
        birthDate: "2000-01-01",
        birthTime: "00:00",
        gender: "male",
        calendarType: "solar",
      };

      const chart = generateZiweiChart(midnightInput);
      expect(chart.timeBranch).toBe(0); // 자시
    });
  });
});
