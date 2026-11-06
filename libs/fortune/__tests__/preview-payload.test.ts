import type {
  LifetimeFortuneData,
  PastLifeFortuneData,
  YearlyFortuneData,
} from "@/libs/supabase/fortune";

import {
  toLifetimePreview,
  toPastLifePreview,
  toYearlyPreview,
} from "../preview-payload";

const PAID_SECRET = "본편에만 있어야 하는 문장";

const lifetime = {
  language: "ko",
  chart: { wuxingJu: "水二局", mingGong: "子", shenGong: "午", sihua: {} },
  rawChart: { palaces: [] },
  dayun: { periods: [PAID_SECRET] },
  interpretation: {
    lifeSpoiler: { headline: "예고편 헤드라인" },
    coreScenario: { body: PAID_SECRET },
    categories: {
      career: { headline: PAID_SECRET, fields: ["기획", "운영"] },
      relationship: {
        headline: PAID_SECRET,
        partner: {
          traits: [PAID_SECRET],
          role: PAID_SECRET,
          meetingPaths: [PAID_SECRET],
        },
      },
    },
    timing: [
      {
        topic: "love",
        likely: [{ year: 2029, reason: PAID_SECRET }],
        caution: { year: 2031, reason: PAID_SECRET },
      },
    ],
  },
} as unknown as LifetimeFortuneData;

describe("toLifetimePreview", () => {
  const preview = toLifetimePreview(lifetime);

  it("본편 내용(연도·이유·분야·만날 사람·대운·본문)은 응답에 없다", () => {
    const json = JSON.stringify(preview);
    expect(json).not.toContain(PAID_SECRET);
    expect(json).not.toContain("2029");
    expect(json).not.toContain("2031");
    expect(json).not.toContain("기획");
    expect(preview).not.toHaveProperty("dayun");
  });

  it("예고편 화면에 필요한 것만 남긴다", () => {
    expect(preview.interpretation.lifeSpoiler.headline).toBe("예고편 헤드라인");
    expect(preview.rawChart).toBe(lifetime.rawChart);
    expect(preview.interpretation.lockedQuestions).toEqual([
      { kind: "timing", topic: "love", count: 1 },
      { kind: "caution", topic: "love" },
      { kind: "fields", count: 2 },
      { kind: "partner" },
    ]);
  });

  it("구 결과(추가 정보 없음)는 잠금 질문이 비어 있다", () => {
    const old = {
      ...lifetime,
      interpretation: { lifeSpoiler: { headline: "h" } },
    } as unknown as LifetimeFortuneData;
    expect(toLifetimePreview(old).interpretation.lockedQuestions).toEqual([]);
  });
});

describe("toYearlyPreview", () => {
  it("overview 외 영역 해석과 유년 궁 정보는 뺀다", () => {
    const data = {
      year: 2027,
      chart: { wuxingJu: "a", mingGong: "b" },
      rawChart: {},
      yearlySihua: {},
      yearlyPalaces: { secret: PAID_SECRET },
      peachBlossom: { secret: PAID_SECRET },
      currentDayun: { period: PAID_SECRET },
      interpretation: {
        overview: { headline: "올해 헤드라인", tags: ["t"] },
        categories: { career: { body: PAID_SECRET } },
      },
    } as unknown as YearlyFortuneData;

    const preview = toYearlyPreview(data);
    expect(JSON.stringify(preview)).not.toContain(PAID_SECRET);
    expect(preview.interpretation.overview.headline).toBe("올해 헤드라인");
    expect(preview.year).toBe(2027);
  });
});

describe("toPastLifePreview", () => {
  it("spoiler·world·imageUrl만 남긴다", () => {
    const data = {
      chart: {},
      rawChart: {},
      interpretation: {
        spoiler: { headline: "전생 헤드라인" },
        world: { era: "조선" },
        imageUrl: null,
        story: PAID_SECRET,
      },
    } as unknown as PastLifeFortuneData;

    const preview = toPastLifePreview(data);
    expect(JSON.stringify(preview)).not.toContain(PAID_SECRET);
    expect(Object.keys(preview.interpretation).sort()).toEqual([
      "imageUrl",
      "spoiler",
      "world",
    ]);
  });
});
