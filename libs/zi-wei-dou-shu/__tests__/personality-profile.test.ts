import { generateZiweiChart } from "../core";
import { buildPersonalityProfile } from "../calculators/personality-profile";
import type { PersonalityProfile } from "../calculators/personality-profile";
import type { ZiweiInput } from "../types";

describe("buildPersonalityProfile", () => {
  const inputA: ZiweiInput = {
    name: "테스트A",
    birthDate: "1990-05-15",
    birthTime: "12:00",
    gender: "male",
    calendarType: "solar",
  };

  const inputB: ZiweiInput = {
    name: "테스트B",
    birthDate: "1985-11-22",
    birthTime: "08:30",
    gender: "female",
    calendarType: "solar",
  };

  let profileA: PersonalityProfile;
  let profileB: PersonalityProfile;

  beforeAll(() => {
    const chartA = generateZiweiChart(inputA);
    const chartB = generateZiweiChart(inputB);
    profileA = buildPersonalityProfile(chartA);
    profileB = buildPersonalityProfile(chartB);
  });

  it("프로필에 모든 필수 필드가 존재한다", () => {
    const requiredKeys: (keyof PersonalityProfile)[] = [
      "coreTraits",
      "communicationStyle",
      "emotionalPattern",
      "conflictStyle",
      "valueOrientation",
      "strengths",
      "weaknesses",
      "dominantElement",
      "summary",
    ];

    for (const key of requiredKeys) {
      expect(profileA).toHaveProperty(key);
    }
  });

  it("coreTraits는 최대 5개이다", () => {
    expect(profileA.coreTraits.length).toBeLessThanOrEqual(5);
    expect(profileA.coreTraits.length).toBeGreaterThan(0);
  });

  it("communicationStyle은 최대 3개이다", () => {
    expect(profileA.communicationStyle.length).toBeLessThanOrEqual(3);
  });

  it("emotionalPattern은 최대 3개이다", () => {
    expect(profileA.emotionalPattern.length).toBeLessThanOrEqual(3);
  });

  it("conflictStyle은 최대 3개이다", () => {
    expect(profileA.conflictStyle.length).toBeLessThanOrEqual(3);
  });

  it("valueOrientation은 최대 3개이다", () => {
    expect(profileA.valueOrientation.length).toBeLessThanOrEqual(3);
  });

  it("strengths는 최대 3개이다", () => {
    expect(profileA.strengths.length).toBeLessThanOrEqual(3);
  });

  it("weaknesses는 최대 3개이다", () => {
    expect(profileA.weaknesses.length).toBeLessThanOrEqual(3);
  });

  it("dominantElement가 유효한 오행이다", () => {
    const validElements = [
      "수(水)",
      "목(木)",
      "금(金)",
      "토(土)",
      "화(火)",
      "알 수 없음",
    ];
    expect(validElements).toContain(profileA.dominantElement);
  });

  it("summary가 비어있지 않은 문자열이다", () => {
    expect(typeof profileA.summary).toBe("string");
    expect(profileA.summary.length).toBeGreaterThan(0);
  });

  it("동일 입력 → 항상 동일 프로필 (결정적)", () => {
    const chart1 = generateZiweiChart(inputA);
    const chart2 = generateZiweiChart(inputA);
    const profile1 = buildPersonalityProfile(chart1);
    const profile2 = buildPersonalityProfile(chart2);

    expect(profile1).toEqual(profile2);
  });

  it("다른 입력 → 다른 프로필", () => {
    // 다른 생년월일이면 프로필이 달라야 한다
    // (극소 확률로 같을 수 있으나 summary는 다를 가능성이 높음)
    expect(profileA.summary).not.toBe(profileB.summary);
  });

  it("모든 특성 값이 비어있지 않은 문자열이다", () => {
    const allTraits = [
      ...profileA.coreTraits,
      ...profileA.communicationStyle,
      ...profileA.emotionalPattern,
      ...profileA.conflictStyle,
      ...profileA.valueOrientation,
      ...profileA.strengths,
      ...profileA.weaknesses,
    ];

    for (const trait of allTraits) {
      expect(typeof trait).toBe("string");
      expect(trait.trim().length).toBeGreaterThan(0);
    }
  });
});
