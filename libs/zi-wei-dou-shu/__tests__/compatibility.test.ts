import type { BranchIndex, WuxingJu } from "../types";
import {
  analyzeZodiacCompatibility,
  analyzeFiveElementCompatibility,
  calculateBaseScoreRange,
} from "../calculators/compatibility";

describe("analyzeZodiacCompatibility", () => {
  it("삼합 관계를 판별한다 (자-진, 0-4)", () => {
    const result = analyzeZodiacCompatibility(
      0 as BranchIndex,
      4 as BranchIndex
    );
    expect(result.relationship).toBe("samhap");
    expect(result.description).toContain("삼합");
  });

  it("육합 관계를 판별한다 (자-축, 0-1)", () => {
    const result = analyzeZodiacCompatibility(
      0 as BranchIndex,
      1 as BranchIndex
    );
    expect(result.relationship).toBe("yukhap");
    expect(result.description).toContain("육합");
  });

  it("충 관계를 판별한다 (자-오, 0-6)", () => {
    const result = analyzeZodiacCompatibility(
      0 as BranchIndex,
      6 as BranchIndex
    );
    expect(result.relationship).toBe("clash");
    expect(result.description).toContain("충");
  });

  it("형 관계를 판별한다 — 무례지형 (자-묘, 0-3)", () => {
    const result = analyzeZodiacCompatibility(
      0 as BranchIndex,
      3 as BranchIndex
    );
    expect(result.relationship).toBe("punishment");
    expect(result.description).toContain("형");
  });

  it("형 관계를 판별한다 — 무은지형 (인-사, 2-5), 해 부가 관계 표시", () => {
    const result = analyzeZodiacCompatibility(
      2 as BranchIndex,
      5 as BranchIndex
    );
    expect(result.relationship).toBe("punishment");
    expect(result.description).toContain("형");
    expect(result.description).toContain("해");
  });

  it("해 관계를 판별한다 (자-미, 0-7)", () => {
    const result = analyzeZodiacCompatibility(
      0 as BranchIndex,
      7 as BranchIndex
    );
    expect(result.relationship).toBe("harm");
    expect(result.description).toContain("해");
  });

  it("파 관계를 판별한다 (자-유, 0-9)", () => {
    const result = analyzeZodiacCompatibility(
      0 as BranchIndex,
      9 as BranchIndex
    );
    expect(result.relationship).toBe("break");
    expect(result.description).toContain("파");
  });

  it("중립 관계를 판별한다 (자-인, 0-2)", () => {
    const result = analyzeZodiacCompatibility(
      0 as BranchIndex,
      2 as BranchIndex
    );
    expect(result.relationship).toBe("none");
    expect(result.description).toContain("중립");
  });

  it("같은 띠 자형을 판별한다 (오-오, 6-6)", () => {
    const result = analyzeZodiacCompatibility(
      6 as BranchIndex,
      6 as BranchIndex
    );
    expect(result.relationship).toBe("punishment");
    expect(result.description).toContain("자형");
  });

  it("같은 띠 비자형은 none을 반환한다 (자-자, 0-0)", () => {
    const result = analyzeZodiacCompatibility(
      0 as BranchIndex,
      0 as BranchIndex
    );
    expect(result.relationship).toBe("none");
    expect(result.description).toContain("같은 띠");
  });

  it("역방향도 동일한 결과를 반환한다 (미-자, 7-0)", () => {
    const result = analyzeZodiacCompatibility(
      7 as BranchIndex,
      0 as BranchIndex
    );
    expect(result.relationship).toBe("harm");
  });
});

describe("analyzeFiveElementCompatibility", () => {
  it("같은 오행은 same을 반환한다", () => {
    const result = analyzeFiveElementCompatibility(
      3 as WuxingJu,
      3 as WuxingJu
    );
    expect(result.relationship).toBe("same");
  });

  it("상생 관계를 판별한다 (목→화)", () => {
    const result = analyzeFiveElementCompatibility(
      3 as WuxingJu,
      6 as WuxingJu
    );
    expect(result.relationship).toBe("generating");
    expect(result.description).toContain("상생");
  });

  it("피생 관계를 판별한다 (화→목 → B가 A를 생)", () => {
    const result = analyzeFiveElementCompatibility(
      6 as WuxingJu,
      3 as WuxingJu
    );
    expect(result.relationship).toBe("being_generated");
  });

  it("상극 관계를 판별한다 (목→토)", () => {
    const result = analyzeFiveElementCompatibility(
      3 as WuxingJu,
      5 as WuxingJu
    );
    expect(result.relationship).toBe("overcoming");
    expect(result.description).toContain("상극");
  });

  it("피극 관계를 판별한다 (토→목 → B가 A를 극)", () => {
    const result = analyzeFiveElementCompatibility(
      5 as WuxingJu,
      3 as WuxingJu
    );
    expect(result.relationship).toBe("being_overcome");
  });
});

describe("calculateBaseScoreRange", () => {
  it("삼합 + 상생 → center 88, range [68, 95]", () => {
    const zodiac = analyzeZodiacCompatibility(
      0 as BranchIndex,
      4 as BranchIndex
    ); // samhap
    const fiveElement = analyzeFiveElementCompatibility(
      3 as WuxingJu,
      6 as WuxingJu
    ); // generating
    const range = calculateBaseScoreRange(zodiac, fiveElement);

    expect(range.center).toBe(88);
    expect(range.min).toBe(68);
    expect(range.max).toBe(95);
  });

  it("충 + 상극 → center 42, range [22, 62]", () => {
    const zodiac = analyzeZodiacCompatibility(
      0 as BranchIndex,
      6 as BranchIndex
    ); // clash
    const fiveElement = analyzeFiveElementCompatibility(
      3 as WuxingJu,
      5 as WuxingJu
    ); // overcoming
    const range = calculateBaseScoreRange(zodiac, fiveElement);

    expect(range.center).toBe(42);
    expect(range.min).toBe(22);
    expect(range.max).toBe(62);
  });

  it("중립 + 동일 → center 68, range [48, 88]", () => {
    const zodiac = analyzeZodiacCompatibility(
      0 as BranchIndex,
      2 as BranchIndex
    ); // none (중립)
    const fiveElement = analyzeFiveElementCompatibility(
      3 as WuxingJu,
      3 as WuxingJu
    ); // same
    const range = calculateBaseScoreRange(zodiac, fiveElement);

    expect(range.center).toBe(68);
    expect(range.min).toBe(48);
    expect(range.max).toBe(88);
  });

  it("같은 띠(비자형) + 동일 → center 71, range [51, 91]", () => {
    const zodiac = analyzeZodiacCompatibility(
      0 as BranchIndex,
      0 as BranchIndex
    ); // none (같은 띠)
    const fiveElement = analyzeFiveElementCompatibility(
      3 as WuxingJu,
      3 as WuxingJu
    ); // same
    const range = calculateBaseScoreRange(zodiac, fiveElement);

    expect(range.center).toBe(71);
    expect(range.min).toBe(51);
    expect(range.max).toBe(91);
  });

  it("범위가 [15, 95]로 클램핑된다", () => {
    const zodiac = analyzeZodiacCompatibility(
      0 as BranchIndex,
      6 as BranchIndex
    ); // clash (-12)
    const fiveElement = analyzeFiveElementCompatibility(
      3 as WuxingJu,
      5 as WuxingJu
    ); // overcoming (-5)
    const range = calculateBaseScoreRange(zodiac, fiveElement);

    // center = 42, min = 22, max = 62 — 모두 [15,95] 안
    expect(range.min).toBeGreaterThanOrEqual(15);
    expect(range.max).toBeLessThanOrEqual(95);
  });
});
