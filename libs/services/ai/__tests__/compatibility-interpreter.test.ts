import {
  analyzeCompatibility,
  analyzeFiveElementCompatibility,
  analyzeZodiacCompatibility,
  buildPersonalityProfile,
  calculateBaseScoreRange,
} from "@/libs/zi-wei-dou-shu/calculators";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type { BranchIndex } from "@/libs/zi-wei-dou-shu/types";

import { findOutputViolations } from "../output-validator";
import {
  buildKoCategoriesCombinedPrompt,
  koCompatibilityPrompts,
} from "../prompts/compatibility-ko";
import type {
  CompatibilityInterpretationRequest,
  GeminiMessage,
} from "../types";

const mockChatCompletion = jest.fn<
  Promise<string>,
  [GeminiMessage[], { responseSchema?: unknown }?]
>();

jest.mock("../provider", () => ({
  chatCompletion: (...args: [GeminiMessage[], { responseSchema?: unknown }?]) =>
    mockChatCompletion(...args),
  parseJsonResponse: (text: string) => JSON.parse(text),
  CURRENT_MODEL_NAME: "test-model",
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadInterpreter = () => require("../compatibility-interpreter");

const chartA = generateZiweiChart({
  name: "재민",
  birthDate: "2003-08-08",
  birthTime: "16:40",
  gender: "male",
  calendarType: "solar",
});
const chartB = generateZiweiChart({
  name: "서연",
  birthDate: "2002-03-15",
  birthTime: "10:30",
  gender: "female",
  calendarType: "solar",
});

const sihuaOf = (chart: typeof chartA) => {
  const palaceOf = (star: string) =>
    chart.palaces.find((p) =>
      [...p.mainStars, ...p.minorStars].some((s) => s.name === star)
    )?.name ?? "불명";
  const effect = (star: string) => ({ star, palace: palaceOf(star) });
  return {
    hualu: effect(chart.sihua.hualu),
    huaquan: effect(chart.sihua.huaquan),
    huake: effect(chart.sihua.huake),
    huaji: effect(chart.sihua.huaji),
  };
};

const buildRequest = (
  relationshipTypeKey: CompatibilityInterpretationRequest["relationshipTypeKey"] = "lover"
): Omit<CompatibilityInterpretationRequest, "requestType"> => {
  const zodiac = analyzeZodiacCompatibility(
    chartA.lunarDate.yearBranch as BranchIndex,
    chartB.lunarDate.yearBranch as BranchIndex
  );
  const five = analyzeFiveElementCompatibility(
    chartA.wuxingJu,
    chartB.wuxingJu
  );
  const range = calculateBaseScoreRange(zodiac, five);
  const personalityA = buildPersonalityProfile(chartA);
  const personalityB = buildPersonalityProfile(chartB);
  return {
    profileA: {
      name: "재민",
      gender: "male",
      lunarBirthInfo: "",
      birthYear: 2003,
      currentAge: 23,
    },
    profileB: {
      name: "서연",
      gender: "female",
      lunarBirthInfo: "",
      birthYear: 2002,
      currentAge: 24,
    },
    chartA: {
      wuxingJu: "금4국",
      mingGongPosition: "인",
      shenGongPosition: "인",
      sihua: sihuaOf(chartA),
    },
    chartB: {
      wuxingJu: "금4국",
      mingGongPosition: "묘",
      shenGongPosition: "묘",
      sihua: sihuaOf(chartB),
    },
    palacesA: {},
    palacesB: {},
    personalityA,
    personalityB,
    analysis: analyzeCompatibility(chartA, chartB, personalityA, personalityB),
    relationshipType: "연인",
    relationshipTypeKey,
    zodiacCompatibility: zodiac.description,
    fiveElementCompatibility: five.description,
    scoreRange: { min: range.min, max: range.max },
  } as Omit<CompatibilityInterpretationRequest, "requestType">;
};

const sections = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    heading: `소제목${i}`,
    body: `본문 ${i}이에요.`,
  }));
const category = (body = "둘은 말이 잘 통해요.") => ({
  judgment: "판정",
  subSections: [{ heading: "첫", body }, ...sections(2)],
  headline: "💬 헤드라인",
  oneLiner: "한 줄이에요",
  tags: ["태그하나", "태그둘"],
});
const insight = { score: 70, label: "라벨" };

/** 모든 KO 요청 유형 스키마를 만족하는 응답 (zod가 남는 키는 버린다) */
const makeResponse = (body?: string): string =>
  JSON.stringify({
    ...category(body),
    profileASummary: "A 요약",
    profileBSummary: "B 요약",
    overall: insight,
    zodiac: insight,
    fiveElement: insight,
    chemistry: insight,
    communication: category(body),
    growthSynergy: insight,
    trustIndex: insight,
    crisisResilience: insight,
    growth: category(body),
    emotion: category(body),
    crisis: category(body),
    coreScenarios: [1, 2, 3].map(() => ({
      judgment: "판정",
      subSections: sections(3),
      title: "🌱 장면",
      oneLiner: "한 줄이에요",
    })),
    adviceSubSections: sections(3),
    adviceOneLiner: "한 줄이에요",
  });

/** communication 키가 인사이트와 카테고리에 겹치므로 인사이트 요청에는 인사이트 모양을 준다 */
const respond = (body?: string) =>
  mockChatCompletion.mockImplementation(async (messages) => {
    const user = messages[1]?.content ?? "";
    if (user.includes("궁합 점수판")) {
      return JSON.stringify({
        overall: insight,
        zodiac: insight,
        fiveElement: insight,
        chemistry: insight,
        communication: insight,
        growthSynergy: insight,
        trustIndex: insight,
        crisisResilience: insight,
      });
    }
    return makeResponse(body);
  });

const PROMPT_TEXTS = [
  ...Object.values(koCompatibilityPrompts.systemPrompts),
  ...Object.values(koCompatibilityPrompts.userPrompts).flatMap((p) =>
    Object.values(p)
  ),
];

describe("궁합 KO 프롬프트", () => {
  it("브랜드 금지어·추상어 지시와 ~니다가 없다", () => {
    // 공용 화법 블록이 피할 말로 든 목록("분위기, 느낌, 결, 흐름 같은 것")은 제외한다
    const all = PROMPT_TEXTS.join("\n").replace(/\([^)]*흐름 같은 것\)/g, "");
    expect(all).not.toMatch(/소름 ?돋는|뼈 ?때리|팩폭|기운|에너지|흐름/);
    expect(all).not.toMatch(/[가-힣]니다(?=[.\s,)]|$)/);
    expect(all).not.toMatch(/즉시 실패|🚨/);
  });

  it("입력에 없는 궁 데이터를 해석하라고 하지 않는다", () => {
    expect(PROMPT_TEXTS.join("\n")).not.toMatch(
      /부처궁|교우궁|재백궁|명궁|Profile A Chart/
    );
  });

  it("반려동물 관계는 이름만 부르고 행동으로 보여 주게 한다", () => {
    const system = koCompatibilityPrompts.systemPrompts.cat_owner;
    expect(system).toContain("반려동물은 이름만 불러요");
    expect(buildKoCategoriesCombinedPrompt("cat_owner")).toContain(
      "서로의 신호를 어떻게 읽나"
    );
  });
});

describe("궁합 데이터 블록", () => {
  beforeEach(() => mockChatCompletion.mockReset());

  it("엔진 문구의 궁·별 이름과 영어 헤더를 넘기지 않는다", async () => {
    respond();
    const { generateCompatibilityInterpretation } = loadInterpreter();
    await generateCompatibilityInterpretation(buildRequest());
    const user = mockChatCompletion.mock.calls[0][0][1].content;
    const [dataBlock] = user.split("---");
    expect(
      findOutputViolations({ dataBlock }, "ko").filter(
        (v) => v.code === "FORBIDDEN_TERM"
      )
    ).toEqual([]);
    expect(dataBlock).not.toMatch(/Profile A|Zodiac|Score Range|⚠️|→/);
    expect(dataBlock).toContain("재민님");
  });
});

describe("generateCompatibilityInterpretation (KO)", () => {
  beforeEach(() => mockChatCompletion.mockReset());

  it("judgment를 맨 앞, 제목을 본문 뒤에 두고 인사이트 본문은 만들지 않는다", async () => {
    respond();
    const { generateCompatibilityInterpretation } = loadInterpreter();
    await generateCompatibilityInterpretation(buildRequest());

    const schemaOf = (needle: string) =>
      mockChatCompletion.mock.calls.find(([m]) =>
        m[1].content.includes(needle)
      )?.[1]?.responseSchema as {
        properties: Record<string, { properties?: Record<string, unknown> }>;
      };
    const overview = Object.keys(schemaOf("궁합 요약 섹션").properties);
    expect(overview[0]).toBe("judgment");
    expect(overview.indexOf("subSections")).toBeLessThan(
      overview.indexOf("headline")
    );
    expect(overview).not.toContain("spoiler");

    const insightItem = schemaOf("궁합 점수판").properties.overall.properties;
    expect(Object.keys(insightItem ?? {})).toEqual(["score", "label"]);
  });

  it("~니다가 나오면 1회 재생성한다", async () => {
    let calls = 0;
    mockChatCompletion.mockImplementation(async (messages) => {
      calls += 1;
      if (messages[1].content.includes("궁합 점수판")) {
        return JSON.stringify(
          Object.fromEntries(
            [
              "overall",
              "zodiac",
              "fiveElement",
              "chemistry",
              "communication",
              "growthSynergy",
              "trustIndex",
              "crisisResilience",
            ].map((k) => [k, insight])
          )
        );
      }
      const isOverviewFirst =
        messages.length === 2 && messages[1].content.includes("궁합 요약 섹션");
      return makeResponse(
        isOverviewFirst ? "둘은 말이 잘 통합니다." : "둘은 말이 잘 통해요."
      );
    });
    const { generateCompatibilityInterpretation } = loadInterpreter();
    const result = await generateCompatibilityInterpretation(buildRequest());

    // 4개 호출 + 요약 재생성 1회
    expect(calls).toBe(5);
    expect(JSON.stringify(result.interpretation)).not.toContain("통합니다");
  });
});
