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
  decades: [
    {
      startAge: 3,
      endAge: 12,
      stage: "어린 시절 무대",
      lifeStage: "youth" as const,
      claims: [],
      score: 0,
      hasCoreHuaji: false,
    },
    {
      startAge: 13,
      endAge: 22,
      stage: "공부 무대",
      lifeStage: "youth" as const,
      hasCoreHuaji: true,
      claims: [
        { ...claim("d1", "timing"), direction: "negative" as const },
        claim("d2", "timing"),
        claim("d3", "timing"),
      ],
      score: -2,
    },
    {
      startAge: 23,
      endAge: 32,
      stage: "일 무대",
      lifeStage: "adult" as const,
      hasCoreHuaji: false,
      claims: [
        claim("e1", "timing"),
        claim("e2", "timing"),
        claim("e3", "timing"),
      ],
      score: 4,
    },
  ],
  decadeTones: { highlight: 2, hard: 1 },
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

  describe("나이대 시나리오", () => {
    const labels = ["3-12세", "13-22세", "23-32세"];
    const block = formatFactSheetBlock(sheet, "lifetime_age_scenarios", {
      periodLabels: labels,
      currentAge: 25,
    });

    it("구간마다 요청의 나이 문자열과 무대를 그대로 싣는다", () => {
      for (const label of labels) expect(block).toContain(`- ${label}`);
      expect(block).toContain("stage: 일 무대");
      expect(block).toContain("## Dayun (10-year cycles)");
      expect(block).toContain("Focus on current age 25");
      expect(block).toContain("- 3-12세 [youth] | stage: 어린 시절 무대");
    });

    it("집중 구간은 주장을 전부, 나머지는 앞의 2개만 넣는다", () => {
      expect(block).toContain("23-32세 [focus]");
      expect(block).not.toContain("13-22세 [focus]");
      expect(block).toContain("e3 주제");
      expect(block).toContain("d2 주제");
      expect(block).not.toContain("d3 주제");
    });

    it("구간 표기 개수가 어긋나면 숫자 범위로 둔다", () => {
      const fallback = formatFactSheetBlock(sheet, "lifetime_age_scenarios", {
        periodLabels: ["3-12세"],
      });
      expect(fallback).toContain("- 23-32 | stage: 일 무대");
    });
  });

  it("핵심 시나리오에는 엔진이 고른 하이라이트·고비 구간을 넣는다", () => {
    const block = formatFactSheetBlock(sheet, "lifetime_core", {
      periodLabels: ["3-12세", "13-22세", "23-32세"],
    });
    expect(block).toContain("- highlight: 23-32세 | stage: 일 무대 | e1 주제");
    expect(block).toContain("- hard: 13-22세 | stage: 공부 무대 | d1 주제");
  });

  it("고를 구간이 없으면 나이를 쓰지 말라고 알리고, 스포일러에는 넣지 않는다", () => {
    const noTones = { ...sheet, decadeTones: {} };
    expect(formatFactSheetBlock(noTones, "lifetime_core")).toContain(
      "without naming any age range"
    );
    expect(formatFactSheetBlock(sheet, "life_spoiler")).not.toContain(
      "highlight:"
    );
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
