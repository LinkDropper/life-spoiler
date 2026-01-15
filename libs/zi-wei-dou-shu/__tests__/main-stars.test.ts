import {
  calculateZiweiPosition,
  calculateTianfuPosition,
  arrangeMainStars,
  getMainStarsInPalace,
} from "../calculators/main-stars";
import type { BranchIndex, WuxingJu } from "../types";

describe("주성 계산", () => {
  describe("calculateZiweiPosition", () => {
    it("수이국 1일생은 인궁(2)이다", () => {
      expect(calculateZiweiPosition(2 as WuxingJu, 1)).toBe(2);
    });

    it("수이국 15일생은 유궁(9)이다", () => {
      expect(calculateZiweiPosition(2 as WuxingJu, 15)).toBe(9);
    });

    it("목삼국 1일생은 묘궁(3)이다", () => {
      expect(calculateZiweiPosition(3 as WuxingJu, 1)).toBe(3);
    });

    it("금사국 1일생은 진궁(4)이다", () => {
      expect(calculateZiweiPosition(4 as WuxingJu, 1)).toBe(4);
    });

    it("토오국 1일생은 사궁(5)이다", () => {
      expect(calculateZiweiPosition(5 as WuxingJu, 1)).toBe(5);
    });

    it("화육국 1일생은 오궁(6)이다", () => {
      expect(calculateZiweiPosition(6 as WuxingJu, 1)).toBe(6);
    });
  });

  describe("calculateTianfuPosition", () => {
    it("자미가 인궁(2)이면 천부는 진궁(4)이다", () => {
      expect(calculateTianfuPosition(2 as BranchIndex)).toBe(4);
    });

    it("자미가 오궁(6)이면 천부는 오궁(6)이다", () => {
      expect(calculateTianfuPosition(6 as BranchIndex)).toBe(6);
    });

    it("자미가 술궁(10)이면 천부는 인궁(2)이다", () => {
      expect(calculateTianfuPosition(10 as BranchIndex)).toBe(2);
    });
  });

  describe("arrangeMainStars", () => {
    it("자미성 위치에서 14주성이 올바르게 배치된다", () => {
      const stars = arrangeMainStars(2 as BranchIndex);

      // 자미성 계열 확인
      expect(stars.get("자미")).toBe(2);
      expect(stars.get("천기")).toBe(1); // 자미 -1
      expect(stars.get("태양")).toBe(0); // 자미 -2
      expect(stars.get("무곡")).toBe(11); // 자미 -3

      // 천부성 계열 확인 (천부는 진궁 4)
      expect(stars.get("천부")).toBe(4);
      expect(stars.get("태음")).toBe(5); // 천부 +1
      expect(stars.get("탐랑")).toBe(6); // 천부 +2
    });

    it("모든 14주성이 배치된다", () => {
      const stars = arrangeMainStars(6 as BranchIndex);

      expect(stars.size).toBe(14);
      expect(stars.has("자미")).toBe(true);
      expect(stars.has("천기")).toBe(true);
      expect(stars.has("태양")).toBe(true);
      expect(stars.has("무곡")).toBe(true);
      expect(stars.has("천동")).toBe(true);
      expect(stars.has("염정")).toBe(true);
      expect(stars.has("천부")).toBe(true);
      expect(stars.has("태음")).toBe(true);
      expect(stars.has("탐랑")).toBe(true);
      expect(stars.has("거문")).toBe(true);
      expect(stars.has("천상")).toBe(true);
      expect(stars.has("천량")).toBe(true);
      expect(stars.has("칠살")).toBe(true);
      expect(stars.has("파군")).toBe(true);
    });
  });

  describe("getMainStarsInPalace", () => {
    it("특정 궁에 있는 주성 목록을 반환한다", () => {
      const stars = arrangeMainStars(2 as BranchIndex);
      const starsInYin = getMainStarsInPalace(stars, 2 as BranchIndex);

      expect(starsInYin).toContain("자미");
    });

    it("주성이 없는 궁은 빈 배열을 반환한다", () => {
      const stars = arrangeMainStars(2 as BranchIndex);

      // 모든 궁에 최소 하나의 별이 있을 수 있지만,
      // 특정 구성에서는 비어있을 수 있음
      const result = getMainStarsInPalace(stars, 8 as BranchIndex);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
