import { MAIN_STAR_NAMES } from "../constants/stars";
import type { MainStarName } from "../constants/stars";
import {
  STAR_TRAITS,
  toBrightnessGroup,
  type BrightnessGroup,
} from "../constants/star-traits";

describe("toBrightnessGroup", () => {
  it("묘/왕/득 → bright", () => {
    expect(toBrightnessGroup("묘")).toBe("bright");
    expect(toBrightnessGroup("왕")).toBe("bright");
    expect(toBrightnessGroup("득")).toBe("bright");
  });

  it("리 → neutral", () => {
    expect(toBrightnessGroup("리")).toBe("neutral");
  });

  it("평/함 → dark", () => {
    expect(toBrightnessGroup("평")).toBe("dark");
    expect(toBrightnessGroup("함")).toBe("dark");
  });
});

describe("STAR_TRAITS", () => {
  const brightnessGroups: BrightnessGroup[] = ["bright", "neutral", "dark"];

  it("14주성 모두에 대해 데이터가 존재한다", () => {
    for (const starName of MAIN_STAR_NAMES) {
      expect(STAR_TRAITS[starName]).toBeDefined();
    }
  });

  it("각 별에 3단계 밝기 그룹이 모두 존재한다", () => {
    for (const starName of MAIN_STAR_NAMES) {
      for (const group of brightnessGroups) {
        expect(STAR_TRAITS[starName][group]).toBeDefined();
      }
    }
  });

  it("모든 특성 세트에 6개 카테고리가 존재한다", () => {
    const requiredKeys = [
      "personality",
      "communication",
      "emotion",
      "conflict",
      "strength",
      "weakness",
    ];

    for (const starName of MAIN_STAR_NAMES) {
      for (const group of brightnessGroups) {
        const traitSet = STAR_TRAITS[starName][group];
        for (const key of requiredKeys) {
          expect(traitSet).toHaveProperty(key);
          expect(Array.isArray(traitSet[key as keyof typeof traitSet])).toBe(
            true
          );
        }
      }
    }
  });

  it("각 카테고리에 최소 1개 이상의 특성이 있다", () => {
    for (const starName of MAIN_STAR_NAMES) {
      for (const group of brightnessGroups) {
        const traitSet = STAR_TRAITS[starName][group];
        expect(traitSet.personality.length).toBeGreaterThanOrEqual(1);
        expect(traitSet.communication.length).toBeGreaterThanOrEqual(1);
        expect(traitSet.emotion.length).toBeGreaterThanOrEqual(1);
        expect(traitSet.conflict.length).toBeGreaterThanOrEqual(1);
        expect(traitSet.strength.length).toBeGreaterThanOrEqual(1);
        expect(traitSet.weakness.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("모든 특성 값이 비어있지 않은 문자열이다", () => {
    for (const starName of MAIN_STAR_NAMES) {
      for (const group of brightnessGroups) {
        const traitSet = STAR_TRAITS[starName][group];
        const allTraits = [
          ...traitSet.personality,
          ...traitSet.communication,
          ...traitSet.emotion,
          ...traitSet.conflict,
          ...traitSet.strength,
          ...traitSet.weakness,
        ];

        for (const trait of allTraits) {
          expect(typeof trait).toBe("string");
          expect(trait.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("자미 bright 특성이 리더십 관련이다", () => {
    const ziwei = STAR_TRAITS["자미" as MainStarName].bright;
    expect(ziwei.personality).toContain("리더십");
  });
});
