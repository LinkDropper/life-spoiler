import {
  getGanZhi,
  getNayin,
  calculateWuxingJu,
  getWuxingJuName,
} from "../calculators/wuxing";
import type { BranchIndex, StemIndex } from "../types";

describe("오행국 계산", () => {
  describe("getGanZhi", () => {
    it("갑자년은 인덱스 0이다", () => {
      expect(getGanZhi(0 as StemIndex, 0 as BranchIndex)).toBe(0);
    });

    it("을축년은 인덱스 1이다", () => {
      expect(getGanZhi(1 as StemIndex, 1 as BranchIndex)).toBe(1);
    });

    it("갑술년(34)은 올바르게 계산된다", () => {
      expect(getGanZhi(0 as StemIndex, 10 as BranchIndex)).toBe(10);
    });

    it("계해년(59)은 올바르게 계산된다", () => {
      expect(getGanZhi(9 as StemIndex, 11 as BranchIndex)).toBe(59);
    });
  });

  describe("getNayin", () => {
    it("갑자/을축의 납음은 금(4)이다", () => {
      expect(getNayin(0)).toBe(4); // 갑자 - 해중금
      expect(getNayin(1)).toBe(4); // 을축 - 해중금
    });

    it("병인/정묘의 납음은 화(6)이다", () => {
      expect(getNayin(2)).toBe(6); // 병인 - 노중화
      expect(getNayin(3)).toBe(6); // 정묘 - 노중화
    });

    it("무진/기사의 납음은 목(3)이다", () => {
      expect(getNayin(4)).toBe(3); // 무진 - 대림목
      expect(getNayin(5)).toBe(3); // 기사 - 대림목
    });
  });

  describe("calculateWuxingJu", () => {
    it("갑자년 자궁 명궁은 수이국(2)이다", () => {
      const result = calculateWuxingJu(
        0 as StemIndex,
        0 as BranchIndex,
        0 as BranchIndex
      );
      expect(result).toBe(2);
    });

    it("갑자년 인궁 명궁은 금사국(4)이다", () => {
      const result = calculateWuxingJu(
        0 as StemIndex,
        0 as BranchIndex,
        2 as BranchIndex
      );
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
