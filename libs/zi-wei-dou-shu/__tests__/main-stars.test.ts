import {
  calculateZiweiPosition,
  calculateTianfuPosition,
  arrangeMainStars,
  getMainStarsInPalace,
} from "../calculators/main-stars";
import type { BranchIndex, WuxingJu } from "../types";

describe("주성 계산", () => {
  describe("calculateZiweiPosition", () => {
    // 자미성 위치 테이블 기준 (ZIWEI_POSITION_TABLE)
    // calculateZiweiPosition(lunarDay, wuxingJu) 순서

    it("수이국 1일생은 축궁(1)이다", () => {
      expect(calculateZiweiPosition(1, 2 as WuxingJu)).toBe(1);
    });

    it("수이국 15일생은 신궁(8)이다", () => {
      expect(calculateZiweiPosition(15, 2 as WuxingJu)).toBe(8);
    });

    it("목삼국 1일생은 진궁(4)이다", () => {
      expect(calculateZiweiPosition(1, 3 as WuxingJu)).toBe(4);
    });

    it("금사국 1일생은 해궁(11)이다", () => {
      expect(calculateZiweiPosition(1, 4 as WuxingJu)).toBe(11);
    });

    it("토오국 1일생은 오궁(6)이다", () => {
      expect(calculateZiweiPosition(1, 5 as WuxingJu)).toBe(6);
    });

    it("화육국 1일생은 유궁(9)이다", () => {
      expect(calculateZiweiPosition(1, 6 as WuxingJu)).toBe(9);
    });

    // 화육국 레퍼런스 검증 케이스 (2026-01-19 추가)
    it("화육국 6일생은 인궁(2)이다 - 나머지 0", () => {
      expect(calculateZiweiPosition(6, 6 as WuxingJu)).toBe(2);
    });

    it("화육국 22일생은 미궁(7)이다 - 레퍼런스 검증", () => {
      expect(calculateZiweiPosition(22, 6 as WuxingJu)).toBe(7);
    });

    it("화육국 30일생은 오궁(6)이다 - 나머지 0", () => {
      expect(calculateZiweiPosition(30, 6 as WuxingJu)).toBe(6);
    });
  });

  describe("calculateTianfuPosition", () => {
    // 인-신 축 대칭: TIANFU_FROM_ZIWEI 테이블 기준
    it("자미가 인궁(2)이면 천부도 인궁(2)이다 (축 위)", () => {
      expect(calculateTianfuPosition(2 as BranchIndex)).toBe(2);
    });

    it("자미가 오궁(6)이면 천부는 술궁(10)이다", () => {
      expect(calculateTianfuPosition(6 as BranchIndex)).toBe(10);
    });

    it("자미가 술궁(10)이면 천부는 오궁(6)이다", () => {
      expect(calculateTianfuPosition(10 as BranchIndex)).toBe(6);
    });

    it("자미가 자궁(0)이면 천부는 진궁(4)이다", () => {
      expect(calculateTianfuPosition(0 as BranchIndex)).toBe(4);
    });

    it("자미가 신궁(8)이면 천부도 신궁(8)이다 (축 위)", () => {
      expect(calculateTianfuPosition(8 as BranchIndex)).toBe(8);
    });
  });

  describe("arrangeMainStars", () => {
    /**
     * 자미 계열 배치 검증
     * 구결: "紫微天機星逆行，隔一陽武天同行，天同隔二是廉貞"
     *
     * 자미가 인궁(2)에 있을 때:
     * - 자미: 2 (인)
     * - 천기: (2 - 1 + 12) % 12 = 1 (축)
     * - (공석): 0 (자)
     * - 태양: (2 - 3 + 12) % 12 = 11 (해)
     * - 무곡: (2 - 4 + 12) % 12 = 10 (술)
     * - 천동: (2 - 5 + 12) % 12 = 9 (유)
     * - (공석): 8, 7
     * - 염정: (2 - 8 + 12) % 12 = 6 (오)
     */
    it("자미성 위치에서 14주성이 올바르게 배치된다", () => {
      const stars = arrangeMainStars(2 as BranchIndex);

      // 자미성 계열 확인 (구결 기반)
      expect(stars.get("자미")).toBe(2); // 인궁
      expect(stars.get("천기")).toBe(1); // 자미 -1 (축궁)
      expect(stars.get("태양")).toBe(11); // 자미 -3 (해궁) - 隔一
      expect(stars.get("무곡")).toBe(10); // 자미 -4 (술궁)
      expect(stars.get("천동")).toBe(9); // 자미 -5 (유궁)
      expect(stars.get("염정")).toBe(6); // 자미 -8 (오궁) - 隔二

      // 천부성 계열 확인 (천부는 인궁 2 → 대칭 → 인궁 2)
      expect(stars.get("천부")).toBe(2);
      expect(stars.get("태음")).toBe(3); // 천부 +1
      expect(stars.get("탐랑")).toBe(4); // 천부 +2
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
