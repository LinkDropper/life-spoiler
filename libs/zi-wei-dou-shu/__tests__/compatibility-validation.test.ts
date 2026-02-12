import type { BranchIndex, WuxingJu } from "../types";
import {
  analyzeZodiacCompatibility,
  analyzeFiveElementCompatibility,
  calculateBaseScoreRange,
} from "../calculators/compatibility";

describe("띠 궁합 알고리즘 검증", () => {
  describe("삼합 관계 검증", () => {
    it("수국 삼합: 자(0)-진(4)-신(8)", () => {
      const r1 = analyzeZodiacCompatibility(0, 4);
      const r2 = analyzeZodiacCompatibility(0, 8);
      const r3 = analyzeZodiacCompatibility(4, 8);
      expect(r1.relationship).toBe("samhap");
      expect(r2.relationship).toBe("samhap");
      expect(r3.relationship).toBe("samhap");
    });

    it("금국 삼합: 축(1)-사(5)-유(9)", () => {
      const r1 = analyzeZodiacCompatibility(1, 5);
      const r2 = analyzeZodiacCompatibility(1, 9);
      const r3 = analyzeZodiacCompatibility(5, 9);
      expect(r1.relationship).toBe("samhap");
      expect(r2.relationship).toBe("samhap");
      expect(r3.relationship).toBe("samhap");
    });

    it("화국 삼합: 인(2)-오(6)-술(10)", () => {
      const r1 = analyzeZodiacCompatibility(2, 6);
      const r2 = analyzeZodiacCompatibility(2, 10);
      const r3 = analyzeZodiacCompatibility(6, 10);
      expect(r1.relationship).toBe("samhap");
      expect(r2.relationship).toBe("samhap");
      expect(r3.relationship).toBe("samhap");
    });

    it("목국 삼합: 묘(3)-미(7)-해(11)", () => {
      const r1 = analyzeZodiacCompatibility(3, 7);
      const r2 = analyzeZodiacCompatibility(3, 11);
      const r3 = analyzeZodiacCompatibility(7, 11);
      expect(r1.relationship).toBe("samhap");
      expect(r2.relationship).toBe("samhap");
      expect(r3.relationship).toBe("samhap");
    });
  });

  describe("육합 관계 검증", () => {
    const yukhapPairs: Array<[BranchIndex, BranchIndex, string]> = [
      [0, 1, "자-축"],
      [2, 11, "인-해"],
      [3, 10, "묘-술"],
      [4, 9, "진-유"],
      [5, 8, "사-신"],
      [6, 7, "오-미"],
    ];

    test.each(yukhapPairs)("%s는 육합", (a, b, name) => {
      const result = analyzeZodiacCompatibility(a, b);
      expect(result.relationship).toBe("yukhap");
      expect(result.description).toContain("육합");
    });

    it("육합은 순서와 무관", () => {
      const ab = analyzeZodiacCompatibility(0, 1);
      const ba = analyzeZodiacCompatibility(1, 0);
      expect(ab.relationship).toBe(ba.relationship);
    });
  });

  describe("충(沖) 관계 검증", () => {
    const clashPairs: Array<[BranchIndex, BranchIndex, string]> = [
      [0, 6, "자-오"],
      [1, 7, "축-미"],
      [2, 8, "인-신"],
      [3, 9, "묘-유"],
      [4, 10, "진-술"],
      [5, 11, "사-해"],
    ];

    test.each(clashPairs)("%s는 충", (a, b, name) => {
      const result = analyzeZodiacCompatibility(a, b);
      expect(result.relationship).toBe("clash");
      expect(result.description).toContain("충");
    });
  });

  describe("형(刑) 관계 검증", () => {
    it("무례지형: 자(0)-묘(3)", () => {
      const result = analyzeZodiacCompatibility(0, 3);
      expect(result.relationship).toBe("punishment");
    });

    it("자형(自刑): 진(4), 오(6), 유(9), 해(11)", () => {
      const selfPunishment = [4, 6, 9, 11];
      for (const branch of selfPunishment) {
        const result = analyzeZodiacCompatibility(
          branch as BranchIndex,
          branch as BranchIndex
        );
        expect(result.relationship).toBe("punishment");
        expect(result.description).toContain("자형");
      }
    });

    it("비자형 같은 띠는 none", () => {
      const nonSelfPunishment = [0, 1, 2, 3, 5, 7, 8, 10];
      for (const branch of nonSelfPunishment) {
        const result = analyzeZodiacCompatibility(
          branch as BranchIndex,
          branch as BranchIndex
        );
        expect(result.relationship).toBe("none");
      }
    });
  });

  describe("우선순위 검증", () => {
    it("삼합이 가장 높은 우선순위", () => {
      // 인-오는 삼합이면서 다른 관계도 겹칠 수 있음
      const result = analyzeZodiacCompatibility(2, 6);
      expect(result.relationship).toBe("samhap");
    });

    it("육합이 충보다 우선", () => {
      // 사-신은 육합 관계
      const result = analyzeZodiacCompatibility(5, 8);
      expect(result.relationship).toBe("yukhap");
    });

    it("충이 형보다 우선", () => {
      // 인-신은 충이면서 형(무은지형)
      const result = analyzeZodiacCompatibility(2, 8);
      expect(result.relationship).toBe("clash");
    });
  });

  describe("해(害)와 파(破) 부차적 관계", () => {
    it("해 관계는 description에 표시", () => {
      // 인-사는 형이면서 해 관계
      const result = analyzeZodiacCompatibility(2, 5);
      expect(result.description).toContain("해");
    });
  });
});

describe("오행 궁합 알고리즘 검증", () => {
  describe("오행 매핑 확인", () => {
    it("오행국 → 오행 변환", () => {
      const mappings: Array<[WuxingJu, string]> = [
        [2, "수"],
        [3, "목"],
        [4, "금"],
        [5, "토"],
        [6, "화"],
      ];

      for (const [ju, element] of mappings) {
        const result = analyzeFiveElementCompatibility(ju, ju);
        expect(result.elementA).toBe(element);
        expect(result.elementB).toBe(element);
      }
    });
  });

  describe("상생 관계 검증", () => {
    it("목(3) → 화(6) 목생화", () => {
      const result = analyzeFiveElementCompatibility(3, 6);
      expect(result.relationship).toBe("generating");
      expect(result.description).toContain("상생");
    });

    it("화(6) → 토(5) 화생토", () => {
      const result = analyzeFiveElementCompatibility(6, 5);
      expect(result.relationship).toBe("generating");
    });

    it("토(5) → 금(4) 토생금", () => {
      const result = analyzeFiveElementCompatibility(5, 4);
      expect(result.relationship).toBe("generating");
    });

    it("금(4) → 수(2) 금생수", () => {
      const result = analyzeFiveElementCompatibility(4, 2);
      expect(result.relationship).toBe("generating");
    });

    it("수(2) → 목(3) 수생목", () => {
      const result = analyzeFiveElementCompatibility(2, 3);
      expect(result.relationship).toBe("generating");
    });
  });

  describe("상극 관계 검증", () => {
    it("목(3) → 토(5) 목극토", () => {
      const result = analyzeFiveElementCompatibility(3, 5);
      expect(result.relationship).toBe("overcoming");
      expect(result.description).toContain("상극");
    });

    it("토(5) → 수(2) 토극수", () => {
      const result = analyzeFiveElementCompatibility(5, 2);
      expect(result.relationship).toBe("overcoming");
    });

    it("수(2) → 화(6) 수극화", () => {
      const result = analyzeFiveElementCompatibility(2, 6);
      expect(result.relationship).toBe("overcoming");
    });

    it("화(6) → 금(4) 화극금", () => {
      const result = analyzeFiveElementCompatibility(6, 4);
      expect(result.relationship).toBe("overcoming");
    });

    it("금(4) → 목(3) 금극목", () => {
      const result = analyzeFiveElementCompatibility(4, 3);
      expect(result.relationship).toBe("overcoming");
    });
  });

  describe("쌍방향 관계 검증", () => {
    it("A→B 상생이면 B→A는 being_generated", () => {
      const ab = analyzeFiveElementCompatibility(3, 6);
      const ba = analyzeFiveElementCompatibility(6, 3);
      expect(ab.relationship).toBe("generating");
      expect(ba.relationship).toBe("being_generated");
    });

    it("A→B 상극이면 B→A는 being_overcome", () => {
      const ab = analyzeFiveElementCompatibility(3, 5);
      const ba = analyzeFiveElementCompatibility(5, 3);
      expect(ab.relationship).toBe("overcoming");
      expect(ba.relationship).toBe("being_overcome");
    });
  });

  describe("같은 오행 검증", () => {
    it("같은 오행끼리는 same 관계", () => {
      const elements: WuxingJu[] = [2, 3, 4, 5, 6];
      for (const ju of elements) {
        const result = analyzeFiveElementCompatibility(ju, ju);
        expect(result.relationship).toBe("same");
        expect(result.description).toContain("비화");
      }
    });
  });
});

describe("점수 계산 알고리즘 검증", () => {
  describe("긍정적 조합", () => {
    it("삼합 + 상생 = 높은 점수", () => {
      const zodiac = analyzeZodiacCompatibility(0, 4);
      const fiveElement = analyzeFiveElementCompatibility(2, 3);
      const range = calculateBaseScoreRange(zodiac, fiveElement);

      expect(range.center).toBe(65 + 15 + 8);
      expect(range.center).toBe(88);
      expect(range.min).toBeLessThan(range.center);
      expect(range.max).toBeGreaterThan(range.center);
    });

    it("육합 + 상생 = 중상 점수", () => {
      const zodiac = analyzeZodiacCompatibility(0, 1);
      const fiveElement = analyzeFiveElementCompatibility(2, 3);
      const range = calculateBaseScoreRange(zodiac, fiveElement);

      expect(range.center).toBe(65 + 10 + 8);
      expect(range.center).toBe(83);
    });
  });

  describe("부정적 조합", () => {
    it("충 + 상극 = 낮은 점수", () => {
      const zodiac = analyzeZodiacCompatibility(0, 6);
      const fiveElement = analyzeFiveElementCompatibility(2, 6);
      const range = calculateBaseScoreRange(zodiac, fiveElement);

      expect(range.center).toBe(65 - 15 - 8);
      expect(range.center).toBe(42);
    });

    it("형 + 상극 = 매우 낮은 점수", () => {
      const zodiac = analyzeZodiacCompatibility(0, 3);
      const fiveElement = analyzeFiveElementCompatibility(2, 6);
      const range = calculateBaseScoreRange(zodiac, fiveElement);

      expect(range.center).toBe(65 - 15 - 8);
      expect(range.center).toBe(42);
    });
  });

  describe("점수 범위 제약", () => {
    it("모든 점수는 [15, 95] 범위 내", () => {
      const branches: BranchIndex[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      const wuxingJus: WuxingJu[] = [2, 3, 4, 5, 6];

      for (const b1 of branches) {
        for (const b2 of branches) {
          for (const w1 of wuxingJus) {
            for (const w2 of wuxingJus) {
              const zodiac = analyzeZodiacCompatibility(b1, b2);
              const fiveElement = analyzeFiveElementCompatibility(w1, w2);
              const range = calculateBaseScoreRange(zodiac, fiveElement);

              expect(range.min).toBeGreaterThanOrEqual(15);
              expect(range.max).toBeLessThanOrEqual(95);
              expect(range.min).toBeLessThanOrEqual(range.center);
              expect(range.center).toBeLessThanOrEqual(range.max);
            }
          }
        }
      }
    });

    it("범위 크기는 40 (±20)", () => {
      const zodiac = analyzeZodiacCompatibility(0, 1);
      const fiveElement = analyzeFiveElementCompatibility(2, 3);
      const range = calculateBaseScoreRange(zodiac, fiveElement);

      const theoreticalMin = range.center - 20;
      const theoreticalMax = range.center + 20;

      // 경계값 보정 고려
      expect(range.min).toBeGreaterThanOrEqual(Math.max(15, theoreticalMin));
      expect(range.max).toBeLessThanOrEqual(Math.min(95, theoreticalMax));
    });
  });

  describe("결정적 알고리즘 검증", () => {
    it("동일 입력 → 항상 동일 출력", () => {
      const branch1 = 2 as BranchIndex;
      const branch2 = 6 as BranchIndex;
      const wu1 = 3 as WuxingJu;
      const wu2 = 6 as WuxingJu;

      const results = [];
      for (let i = 0; i < 10; i++) {
        const zodiac = analyzeZodiacCompatibility(branch1, branch2);
        const fiveElement = analyzeFiveElementCompatibility(wu1, wu2);
        const range = calculateBaseScoreRange(zodiac, fiveElement);
        results.push({ zodiac, fiveElement, range });
      }

      const first = results[0];
      for (const result of results) {
        expect(result.zodiac).toEqual(first.zodiac);
        expect(result.fiveElement).toEqual(first.fiveElement);
        expect(result.range).toEqual(first.range);
      }
    });
  });
});
