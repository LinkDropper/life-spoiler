import { calculateDayun } from "@/libs/zi-wei-dou-shu/calculators";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";

import { convertChartToRequest, convertToDayunData } from "../lifetime-request";
import type { GeminiMessage } from "../types";

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

// 모든 해석 유형 스키마를 만족하는 응답 (zod 가 남는 키는 버린다)
const makeResponse = (body: string): string =>
  JSON.stringify({
    headline: "헤드라인",
    description: "설명",
    content: "",
    subSections: [
      { heading: "하나", body },
      { heading: "둘", body: "두 번째 본문" },
      { heading: "셋", body: "세 번째 본문" },
    ],
    oneLiner: "한 줄",
    tags: ["태그"],
    score: 99,
    ageScenarios: [
      {
        period: "6-15세",
        headline: "시기",
        bullets: ["가", "나"],
        oneLiner: "줄",
      },
    ],
    hashtags: ["해시", "태그"],
    spectrums: {
      activity: { leftLabel: "a", rightLabel: "b", leftPercentage: 50 },
      work: { leftLabel: "a", rightLabel: "b", leftPercentage: 50 },
      economy: { leftLabel: "a", rightLabel: "b", leftPercentage: 50 },
      romance: { leftLabel: "a", rightLabel: "b", leftPercentage: 50 },
    },
  });

const chart = generateZiweiChart({
  name: "테스트",
  birthDate: "1994-03-15",
  birthTime: "10:30",
  gender: "female",
  calendarType: "solar",
});

const buildRequest = () => ({
  ...convertChartToRequest(chart, {
    currentAge: 32,
    dayunPeriods: convertToDayunData(
      calculateDayun(chart, 100, "ko"),
      chart.palaces,
      "ko"
    ),
    categoryScores: { wealth: 41, career: 90, relationship: 63, health: 55 },
  }),
  language: "ko" as const,
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadInterpreter = () => require("../ziwei-interpreter");

describe("generateFullInterpretation", () => {
  beforeEach(() => {
    mockChatCompletion.mockReset();
  });

  it("영역 점수는 LLM 값이 아니라 엔진 점수를 쓴다", async () => {
    mockChatCompletion.mockResolvedValue(makeResponse("돈이 잘 붙어요"));
    const { generateFullInterpretation } = loadInterpreter();

    const result = await generateFullInterpretation(buildRequest(), {
      includeDetails: true,
    });

    expect(result.categories.wealth.score).toBe(41);
    expect(result.categories.career.score).toBe(90);
    expect(result.categories.relationship.score).toBe(63);
    expect(result.categories.health.score).toBe(55);
  });

  it("상세 해석에 엔진 점수가 없으면 실패한다", async () => {
    mockChatCompletion.mockResolvedValue(makeResponse("본문"));
    const { generateFullInterpretation } = loadInterpreter();
    const withoutScores = { ...buildRequest(), categoryScores: undefined };

    await expect(
      generateFullInterpretation(withoutScores, { includeDetails: true })
    ).rejects.toThrow("categoryScores");
  });

  it("금지 용어가 나오면 피드백을 붙여 한 번 재생성한다", async () => {
    mockChatCompletion
      .mockResolvedValueOnce(makeResponse("자미의 품위가 있어요"))
      .mockResolvedValueOnce(makeResponse("타고난 품위가 있어요"));
    const { interpretLifeSpoiler } = loadInterpreter();

    const result = await interpretLifeSpoiler(buildRequest());

    expect(mockChatCompletion).toHaveBeenCalledTimes(2);
    const [, [retryMessages]] = mockChatCompletion.mock.calls;
    expect(retryMessages.at(-1)?.content).toContain('"자미"');
    expect(result.subSections?.[0].body).toBe("타고난 품위가 있어요");
  });

  it("항목 개수가 형식에 안 맞으면 오류를 알려 주고 한 번 재생성한다", async () => {
    const tooFew = JSON.parse(makeResponse("본문"));
    tooFew.subSections = tooFew.subSections.slice(0, 1);
    mockChatCompletion
      .mockResolvedValueOnce(JSON.stringify(tooFew))
      .mockResolvedValueOnce(makeResponse("고친 본문"));
    const { interpretLifeSpoiler } = loadInterpreter();

    const result = await interpretLifeSpoiler(buildRequest());

    expect(mockChatCompletion).toHaveBeenCalledTimes(2);
    const [, [retryMessages]] = mockChatCompletion.mock.calls;
    expect(retryMessages.at(-1)?.content).toContain("subSections");
    expect(result.subSections?.[0].body).toBe("고친 본문");
  });

  it("재생성 후에도 형식이 안 맞으면 형식 오류로 실패한다", async () => {
    const tooFew = JSON.parse(makeResponse("본문"));
    tooFew.subSections = tooFew.subSections.slice(0, 1);
    mockChatCompletion.mockResolvedValue(JSON.stringify(tooFew));
    const { interpretLifeSpoiler } = loadInterpreter();

    await expect(interpretLifeSpoiler(buildRequest())).rejects.toThrow(
      "AI 응답이 예상된 형식과 다릅니다."
    );
    expect(mockChatCompletion).toHaveBeenCalledTimes(2);
  });

  it("LLM 입력에 궁간·신궁·상대 강도를 싣고, 점수 필드는 요구하지 않는다", async () => {
    mockChatCompletion.mockResolvedValue(makeResponse("본문"));
    const { interpretLifetimeWealth } = loadInterpreter();

    await interpretLifetimeWealth(buildRequest());

    const [[messages, options]] = mockChatCompletion.mock.calls;
    const userPrompt = messages[1].content;
    expect(userPrompt).toMatch(/- 명궁 \[[갑을병정무기경신임계]\]/);
    expect(userPrompt).toContain("(신궁)");
    expect(userPrompt).toContain("## Relative Strength");
    expect(userPrompt).toMatch(/wealth: rank 4\/4.*← THIS SECTION/);
    expect(JSON.stringify(options?.responseSchema)).not.toContain("score");
  });
});
