import type { LifetimeFactSheet } from "@/libs/zi-wei-dou-shu/calculators/lifetime-facts";

import {
  categorySubSectionCount,
  formatFactSheetBlock,
  mergeTiming,
} from "../lifetime-fact-format";
import type { TimingResponse } from "../types";

const evidence = { ko: "근거예요", en: "Evidence", ja: "根拠です" };

const claim = (id: string, section: "core" | "wealth" | "timing") => ({
  id,
  section,
  topic: `${id} 주제`,
  direction: "positive" as const,
  strength: 3 as const,
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

  describe("영역 섹션 항목 수", () => {
    it("주장이 2개 이하면 2개, 3개 이상이면 3개를 지시한다", () => {
      expect(categorySubSectionCount(sheet, "lifetime_wealth")).toBe(2);
      expect(formatFactSheetBlock(sheet, "lifetime_wealth")).toContain(
        "Write exactly 2 items"
      );

      const rich: LifetimeFactSheet = {
        ...sheet,
        claims: {
          ...sheet.claims,
          wealth: ["w1", "w2", "w3", "w4"].map((id) => claim(id, "wealth")),
        },
      };
      expect(categorySubSectionCount(rich, "lifetime_wealth")).toBe(3);
      expect(formatFactSheetBlock(rich, "lifetime_wealth")).toContain(
        "Write exactly 3 items"
      );
    });

    it("스포일러·핵심 시나리오는 개수를 스키마로 고정하지 않는다", () => {
      expect(categorySubSectionCount(sheet, "life_spoiler")).toBeUndefined();
      expect(categorySubSectionCount(sheet, "lifetime_core")).toBeUndefined();
    });

    it("연애 재료 주장은 관점·단서·말·피할 해석을 함께 싣는다", () => {
      const love: LifetimeFactSheet = {
        ...sheet,
        claims: {
          ...sheet.claims,
          relationship: [
            {
              id: "love:self:천동:energy",
              section: "relationship",
              topic: "같이 있으면 긴장이 풀리게 하는 사람",
              direction: "positive",
              strength: 3,
              lens: "상대가 보는 나",
              cues: ["동네 카페", "주말 늦은 아침", "편의점 산책"],
              voice: "너랑 있으면 그냥 편해",
              avoid: "무관심",
            },
          ],
        },
      };
      const block = formatFactSheetBlock(love, "lifetime_relationship", {
        language: "ko",
      });
      expect(block).toContain("| lens: 상대가 보는 나]");
      expect(block).toContain("cues: 동네 카페 / 주말 늦은 아침 / 편의점 산책");
      expect(block).toContain("voice: 너랑 있으면 그냥 편해");
      expect(block).toContain("avoid: 무관심");
    });

    it("KO는 사실 시트 규칙을 한국어 해요체로 준다", () => {
      const block = formatFactSheetBlock(sheet, "lifetime_wealth", {
        language: "ko",
      });
      expect(block).toContain("사실 시트 쓰는 법");
      expect(block).toContain("문단은 정확히 2개");
      expect(block).not.toContain("Rules for using the fact sheet");
      expect(block).not.toMatch(/니다/);
    });

    it("스포일러는 서사 구조라 항목 수를 고정한다", () => {
      const block = formatFactSheetBlock(sheet, "life_spoiler");
      expect(block).toContain("Keep exactly the number of items");
      expect(block).not.toContain("Write exactly 2 items");
    });
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
