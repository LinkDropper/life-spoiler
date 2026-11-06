import {
  calculateLifetimeQualityReport,
  extractInterpretationText,
  type LifetimeQualitySample,
} from "../quality-metrics";
import type { FortuneInterpretation } from "../types";

const makeCategory = (body: string, score: number) => ({
  headline: "카테고리",
  content: "",
  subSections: [{ heading: "장면", body }],
  oneLiner: "한 줄",
  tags: ["태그"],
  score,
});

const makeInterpretation = (
  headline: string,
  oneLiner: string,
  body: string,
  score: number
): FortuneInterpretation => ({
  lifeSpoiler: { headline, description: "설명", summary: "", oneLiner },
  coreScenario: { headline: "코어", content: "", oneLiner: "코어 한 줄" },
  categories: {
    wealth: makeCategory(body, score),
    career: makeCategory(body, score),
    relationship: makeCategory(body, score),
    health: makeCategory(body, score),
  },
  ageScenarios: [
    {
      period: "26-35세",
      headline: "시기",
      content: "",
      bullets: ["불릿"],
      oneLiner: "시기 한 줄",
    },
  ],
  meta: { generatedAt: "2026-11-06", model: "test", isFallback: false },
});

const sample = (
  chartId: string,
  interpretation: FortuneInterpretation
): LifetimeQualitySample => ({ chartId, language: "ko", interpretation });

describe("calculateLifetimeQualityReport", () => {
  it("운영에서 수렴한 템플릿과 감시 어휘 비율을 잰다", () => {
    const report = calculateLifetimeQualityReport([
      sample(
        "a",
        makeInterpretation(
          "🧭 흔들림 속에서 길을 여는 사람",
          "빠르게 밀되, 판단을 세울 때 멀리 갑니다.",
          "기획안처럼 기록을 남기세요.",
          84
        )
      ),
      sample(
        "b",
        makeInterpretation(
          "☀️ 무대에 서면 목소리가 커지는 사람",
          "발표 자리를 먼저 잡으세요.",
          "사람 앞에서 설명할 때 돈이 붙어요.",
          50
        )
      ),
    ]);

    expect(report.sampleCount).toBe(2);
    expect(report.watchTermDocShare["흔들"]).toBe(0.5);
    expect(report.watchTermDocShare["기록"]).toBe(0.5);
    expect(report.headlineContrastShare).toBe(0.5);
    expect(report.oneLinerHedgeShare).toBe(0.5);
    expect(report.scores.career).toEqual({
      mean: 67,
      sd: 17,
      distinct: 2,
      min: 50,
      max: 84,
    });
  });

  it("같은 명반끼리는 교차 유사도에서 빼고, 똑같은 글은 유사도 1이다", () => {
    const same = makeInterpretation("A", "B", "같은 본문", 70);
    const report = calculateLifetimeQualityReport([
      sample("a", same),
      sample("a", same),
      sample("b", same),
    ]);

    expect(report.crossChartSimilarity).toBe(1);
  });

  it("금지 용어 위반 표본 비율을 잰다", () => {
    const report = calculateLifetimeQualityReport([
      sample("a", makeInterpretation("A", "B", "재백궁이 강해요", 70)),
      sample("b", makeInterpretation("A", "B", "돈이 잘 붙어요", 70)),
    ]);

    expect(report.violationShare).toBe(0.5);
  });
});

describe("extractInterpretationText", () => {
  it("엔진 값(score·period·meta)은 텍스트에서 뺀다", () => {
    const text = extractInterpretationText(
      makeInterpretation("헤드", "한줄", "본문", 77)
    );

    expect(text).toContain("본문");
    expect(text).not.toContain("26-35세");
    expect(text).not.toContain("test");
  });
});
