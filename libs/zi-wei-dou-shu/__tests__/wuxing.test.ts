import {
  getGanZhi,
  getNayin,
  calculateWuxingJu,
  getWuxingJuName,
} from "../calculators/wuxing";
import type { BranchIndex, StemIndex } from "../types";

describe("오행국 계산", () => {
  describe("getGanZhi", () => {
    it("갑자년은 '갑자'이다", () => {
      expect(getGanZhi(0 as StemIndex, 0 as BranchIndex)).toBe("갑자");
    });

    it("을축년은 '을축'이다", () => {
      expect(getGanZhi(1 as StemIndex, 1 as BranchIndex)).toBe("을축");
    });

    it("갑술년은 '갑술'이다", () => {
      expect(getGanZhi(0 as StemIndex, 10 as BranchIndex)).toBe("갑술");
    });

    it("계해년은 '계해'이다", () => {
      expect(getGanZhi(9 as StemIndex, 11 as BranchIndex)).toBe("계해");
    });
  });

  describe("getNayin", () => {
    it("갑자의 납음은 '금'이다", () => {
      expect(getNayin(0 as StemIndex, 0 as BranchIndex)).toBe("금");
    });

    it("을축의 납음은 '금'이다", () => {
      expect(getNayin(1 as StemIndex, 1 as BranchIndex)).toBe("금");
    });

    it("병인의 납음은 '화'이다", () => {
      expect(getNayin(2 as StemIndex, 2 as BranchIndex)).toBe("화");
    });

    it("정묘의 납음은 '화'이다", () => {
      expect(getNayin(3 as StemIndex, 3 as BranchIndex)).toBe("화");
    });

    it("무진의 납음은 '목'이다", () => {
      expect(getNayin(4 as StemIndex, 4 as BranchIndex)).toBe("목");
    });

    it("기사의 납음은 '목'이다", () => {
      expect(getNayin(5 as StemIndex, 5 as BranchIndex)).toBe("목");
    });
  });

  describe("calculateWuxingJu", () => {
    it("갑자년 자궁 명궁은 수이국(2)이다", () => {
      const result = calculateWuxingJu(0 as StemIndex, 0 as BranchIndex);
      expect(result).toBe(2);
    });

    it("갑자년 인궁 명궁은 금사국(4)이다", () => {
      const result = calculateWuxingJu(0 as StemIndex, 2 as BranchIndex);
      expect(result).toBe(4);
    });
  });

  describe("getWuxingJuName", () => {
    it("오행국 이름이 올바르게 반환된다", () => {
      expect(getWuxingJuName(2)).toBe("수이국");
      expect(getWuxingJuName(3)).toBe("목삼국");
      expect(getWuxingJuName(4)).toBe("금사국");
      expect(getWuxingJuName(5)).toBe("토오국");
      expect(getWuxingJuName(6)).toBe("화육국");
    });
  });
});
