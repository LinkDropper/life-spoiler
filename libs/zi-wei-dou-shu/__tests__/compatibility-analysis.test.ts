import { generateZiweiChart } from "../core";
import { buildPersonalityProfile } from "../calculators/personality-profile";
import {
  analyzeCompatibility,
  type CompatibilityAnalysis,
} from "../calculators/compatibility-analysis";
import { getStarCompatibility } from "../constants/star-compatibility-table";
import type { MainStarName } from "../constants/stars";
import type { ZiweiInput } from "../types";

describe("getStarCompatibility", () => {
  it("자미+천부 → excellent", () => {
    const result = getStarCompatibility(
      "자미" as MainStarName,
      "천부" as MainStarName
    );
    expect(result.level).toBe("excellent");
    expect(result.scoreOffset).toBe(12);
    expect(result.dynamics.length).toBeGreaterThan(0);
  });

  it("염정+파군 → clash", () => {
    const result = getStarCompatibility(
      "염정" as MainStarName,
      "파군" as MainStarName
    );
    expect(result.level).toBe("clash");
    expect(result.scoreOffset).toBe(-12);
  });

  it("순서와 관계없이 동일한 결과를 반환한다", () => {
    const ab = getStarCompatibility(
      "태양" as MainStarName,
      "태음" as MainStarName
    );
    const ba = getStarCompatibility(
      "태음" as MainStarName,
      "태양" as MainStarName
    );
    expect(ab).toEqual(ba);
  });

  it("같은 별끼리 → neutral", () => {
    const result = getStarCompatibility(
      "자미" as MainStarName,
      "자미" as MainStarName
    );
    expect(result.level).toBe("neutral");
    expect(result.scoreOffset).toBe(0);
  });

  it("테이블에 없는 조합 → neutral", () => {
    const result = getStarCompatibility(
      "천상" as MainStarName,
      "파군" as MainStarName
    );
    expect(result.level).toBe("neutral");
    expect(result.scoreOffset).toBe(0);
  });
});

describe("analyzeCompatibility", () => {
  const inputA: ZiweiInput = {
    name: "분석A",
    birthDate: "1990-05-15",
    birthTime: "12:00",
    gender: "male",
    calendarType: "solar",
  };

  const inputB: ZiweiInput = {
    name: "분석B",
    birthDate: "1985-11-22",
    birthTime: "08:30",
    gender: "female",
    calendarType: "solar",
  };

  let analysis: CompatibilityAnalysis;

  beforeAll(() => {
    const chartA = generateZiweiChart(inputA);
    const chartB = generateZiweiChart(inputB);
    const profileA = buildPersonalityProfile(chartA);
    const profileB = buildPersonalityProfile(chartB);
    analysis = analyzeCompatibility(chartA, chartB, profileA, profileB);
  });

  it("4개 카테고리 분석 결과가 모두 존재한다", () => {
    expect(analysis.communication).toBeDefined();
    expect(analysis.growth).toBeDefined();
    expect(analysis.emotion).toBeDefined();
    expect(analysis.crisis).toBeDefined();
  });

  it("각 카테고리에 필수 필드가 존재한다", () => {
    const categories = [
      analysis.communication,
      analysis.growth,
      analysis.emotion,
      analysis.crisis,
    ];

    for (const cat of categories) {
      expect(Array.isArray(cat.relevantTraitsA)).toBe(true);
      expect(Array.isArray(cat.relevantTraitsB)).toBe(true);
      expect(Array.isArray(cat.starInteractions)).toBe(true);
      expect(typeof cat.suggestedScore).toBe("number");
      expect(Array.isArray(cat.analysisPoints)).toBe(true);
    }
  });

  it("suggestedScore가 유효한 범위 [15, 95] 안에 있다", () => {
    const categories = [
      analysis.communication,
      analysis.growth,
      analysis.emotion,
      analysis.crisis,
    ];

    for (const cat of categories) {
      expect(cat.suggestedScore).toBeGreaterThanOrEqual(15);
      expect(cat.suggestedScore).toBeLessThanOrEqual(95);
    }
  });

  it("scoreConstraints에 주요 키가 존재한다", () => {
    const expectedKeys = [
      "communication",
      "growthSynergy",
      "trustIndex",
      "crisisResilience",
      "chemistry",
    ];

    for (const key of expectedKeys) {
      expect(analysis.scoreConstraints[key]).toBeDefined();
      expect(analysis.scoreConstraints[key].min).toBeLessThan(
        analysis.scoreConstraints[key].max
      );
      expect(analysis.scoreConstraints[key].suggested).toBeGreaterThanOrEqual(
        analysis.scoreConstraints[key].min
      );
      expect(analysis.scoreConstraints[key].suggested).toBeLessThanOrEqual(
        analysis.scoreConstraints[key].max
      );
    }
  });

  it("scoreConstraints의 min/max가 유효 범위 안에 있다", () => {
    for (const constraint of Object.values(analysis.scoreConstraints)) {
      expect(constraint.min).toBeGreaterThanOrEqual(15);
      expect(constraint.max).toBeLessThanOrEqual(95);
    }
  });

  it("keyDynamics가 배열이다", () => {
    expect(Array.isArray(analysis.keyDynamics)).toBe(true);
  });

  it("synergyPoints와 tensionPoints가 배열이다", () => {
    expect(Array.isArray(analysis.synergyPoints)).toBe(true);
    expect(Array.isArray(analysis.tensionPoints)).toBe(true);
  });

  it("동일 입력 → 항상 동일 결과 (결정적)", () => {
    const chartA1 = generateZiweiChart(inputA);
    const chartB1 = generateZiweiChart(inputB);
    const profileA1 = buildPersonalityProfile(chartA1);
    const profileB1 = buildPersonalityProfile(chartB1);
    const analysis1 = analyzeCompatibility(
      chartA1,
      chartB1,
      profileA1,
      profileB1
    );

    const chartA2 = generateZiweiChart(inputA);
    const chartB2 = generateZiweiChart(inputB);
    const profileA2 = buildPersonalityProfile(chartA2);
    const profileB2 = buildPersonalityProfile(chartB2);
    const analysis2 = analyzeCompatibility(
      chartA2,
      chartB2,
      profileA2,
      profileB2
    );

    expect(analysis1).toEqual(analysis2);
  });

  it("synergyPoints가 최대 5개이다", () => {
    expect(analysis.synergyPoints.length).toBeLessThanOrEqual(5);
  });

  it("tensionPoints가 최대 5개이다", () => {
    expect(analysis.tensionPoints.length).toBeLessThanOrEqual(5);
  });

  it("analysisPoints가 최대 5개이다", () => {
    const categories = [
      analysis.communication,
      analysis.growth,
      analysis.emotion,
      analysis.crisis,
    ];

    for (const cat of categories) {
      expect(cat.analysisPoints.length).toBeLessThanOrEqual(5);
    }
  });
});
