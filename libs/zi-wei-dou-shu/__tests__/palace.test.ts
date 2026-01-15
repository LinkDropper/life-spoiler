import {
  calculateMingGong,
  calculateShenGong,
  arrangePalaces,
  getPalaceStem,
} from "../calculators/palace";
import type { BranchIndex, StemIndex } from "../types";

describe("궁 계산", () => {
  describe("calculateMingGong", () => {
    it("정월생 자시는 인궁(2)이다", () => {
      expect(calculateMingGong(1, 0)).toBe(2);
    });

    it("정월생 오시는 신궁(8)이다", () => {
      expect(calculateMingGong(1, 6)).toBe(8);
    });

    it("3월생 자시는 진궁(4)이다", () => {
      expect(calculateMingGong(3, 0)).toBe(4);
    });

    it("3월생 오시는 술궁(10)이다", () => {
      expect(calculateMingGong(3, 6)).toBe(10);
    });

    it("12월생 해시는 자궁(0)이다", () => {
      expect(calculateMingGong(12, 11)).toBe(0);
    });
  });

  describe("calculateShenGong", () => {
    it("정월생 자시 신궁은 인궁(2)이다", () => {
      expect(calculateShenGong(1, 0)).toBe(2);
    });

    it("정월생 오시 신궁은 신궁(8)이다", () => {
      expect(calculateShenGong(1, 6)).toBe(8);
    });

    it("3월생 사시 신궁은 신궁(8)이다", () => {
      // 월 + 시 = 3 + 5 = 8
      expect(calculateShenGong(3, 5)).toBe(8);
    });
  });

  describe("arrangePalaces", () => {
    it("명궁이 인궁(2)이면 12궁이 반시계로 배치된다", () => {
      const palaces = arrangePalaces(2);

      expect(palaces.get("명궁")).toBe(2);
      expect(palaces.get("부모궁")).toBe(3);
      expect(palaces.get("복덕궁")).toBe(4);
      expect(palaces.get("전택궁")).toBe(5);
      expect(palaces.get("관록궁")).toBe(6);
      expect(palaces.get("노복궁")).toBe(7);
      expect(palaces.get("천이궁")).toBe(8);
      expect(palaces.get("질액궁")).toBe(9);
      expect(palaces.get("재백궁")).toBe(10);
      expect(palaces.get("자녀궁")).toBe(11);
      expect(palaces.get("부처궁")).toBe(0);
      expect(palaces.get("형제궁")).toBe(1);
    });

    it("명궁이 자궁(0)이면 올바르게 순환된다", () => {
      const palaces = arrangePalaces(0);

      expect(palaces.get("명궁")).toBe(0);
      expect(palaces.get("부모궁")).toBe(1);
      expect(palaces.get("형제궁")).toBe(11);
    });
  });

  describe("getPalaceStem", () => {
    it("갑년 인궁의 천간은 병(2)이다", () => {
      expect(getPalaceStem(0 as StemIndex, 2 as BranchIndex)).toBe(2);
    });

    it("갑년 자궁의 천간은 갑(0)이다", () => {
      expect(getPalaceStem(0 as StemIndex, 0 as BranchIndex)).toBe(0);
    });

    it("을년 인궁의 천간은 무(4)이다", () => {
      expect(getPalaceStem(1 as StemIndex, 2 as BranchIndex)).toBe(4);
    });
  });
});
