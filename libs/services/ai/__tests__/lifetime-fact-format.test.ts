import type { LifetimeFactSheet } from "@/libs/zi-wei-dou-shu/calculators/lifetime-facts";

import { formatFactSheetBlock, mergeTiming } from "../lifetime-fact-format";
import type { TimingResponse } from "../types";

const evidence = { ko: "근거예요", en: "Evidence", ja: "根拠です" };

const claim = (id: string, section: "core" | "wealth" | "timing") => ({
  id,
  section,
  topic: `${id} 주제`,
  direction: "positive" as const,
  strength: 3 as const,
  sceneSeeds: [`${id} 장면`],
  evidence,
});

const sheet: LifetimeFactSheet = {
  claims: {
    core: [claim("c1", "core")],
    wealth: [claim("w1", "wealth")],
    career: [],
    relationship: [],
    health: [],
    timing: [],
  },
  evidence: { wealth: evidence },
  careerFields: ["기획"],
  timing: [
    {
      topic: "love",
      likely: [
        { year: 2028, score: 3, reasons: ["r"] },
        { year: 2031, score: 2, reasons: ["r"] },
      ],
      caution: { year: 2030, score: -3, reasons: ["r"] },
    },
  ],
};

describe("formatFactSheetBlock", () => {
  it("영역 섹션에는 그 영역 주장만 넣는다", () => {
    const block = formatFactSheetBlock(sheet, "lifetime_wealth");
    expect(block).toContain("w1 주제");
    expect(block).not.toContain("c1 주제");
  });

  it("주장이 없는 영역은 짧게 쓰라고 알린다", () => {
    expect(formatFactSheetBlock(sheet, "lifetime_health")).toContain(
      "no strong signal"
    );
  });

  it("나이대 시나리오는 사실 시트 블록을 쓰지 않는다", () => {
    expect(formatFactSheetBlock(sheet, "lifetime_age_scenarios")).toBe("");
  });
});

describe("mergeTiming", () => {
  it("시트에 없는 연도는 버리고 시트 순서·연도를 따른다", () => {
    const response: TimingResponse = {
      timing: [
        {
          topic: "love",
          likely: [
            { year: 2031, reason: "B" },
            { year: 2099, reason: "지어낸 연도" },
            { year: 2028, reason: "A" },
          ],
          caution: { year: 2030, reason: "C" },
        },
      ],
    };
    expect(mergeTiming(sheet, response)).toEqual([
      {
        topic: "love",
        likely: [
          { year: 2028, reason: "A" },
          { year: 2031, reason: "B" },
        ],
        caution: { year: 2030, reason: "C" },
      },
    ]);
  });
});
