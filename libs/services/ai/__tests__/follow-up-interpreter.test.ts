import { generateFollowUpAnswer } from "../follow-up-interpreter";
import type { FollowUpRequest } from "../follow-up-interpreter";
import {
  buildFollowUpRefusal,
  buildFollowUpSystemPrompt,
  buildFollowUpUserPrompt,
} from "../prompts/follow-up-ko";
import type { GeminiMessage } from "../types";

const mockChatCompletion = jest.fn<
  Promise<string>,
  [GeminiMessage[], { responseSchema?: unknown; maxTokens?: number }?]
>();

jest.mock("../provider", () => ({
  chatCompletion: (...args: [GeminiMessage[], { responseSchema?: unknown }?]) =>
    mockChatCompletion(...args),
  parseJsonResponse: (text: string) => JSON.parse(text),
}));

const request: FollowUpRequest = {
  fortuneType: "lifetime",
  fortuneResult: { categories: { relationship: { headline: "연애" } } },
  userContext: {
    currentAge: 23,
    birthDate: "2003-08-08",
    todayDate: "2026-11-24",
  },
  history: [],
  question: "결혼은 언제쯤 할까요?",
};

const answer = (body: string, isRelevant = true): string =>
  JSON.stringify({ isRelevant, judgment: "판정", answer: body });

beforeEach(() => mockChatCompletion.mockReset());

describe("추가 질문 프롬프트", () => {
  const system = buildFollowUpSystemPrompt("lifetime");

  it("별·궁 이름 인용을 요구하지 않고 쓰지 말라고 한다", () => {
    expect(system).not.toMatch(/부처궁|재백궁|화록|주성의 이름/);
    expect(system).toContain(
      "별·궁·사화 이름은 손님이 모르는 말이라 쓰지 않아요"
    );
  });

  it("지시문에 ~니다 문체와 예시 답이 없다", () => {
    const user = buildFollowUpUserPrompt(request);
    // 거절 문구 안의 "답변드리기"는 해요체 문장이다
    expect(`${system}\n${user}`).not.toMatch(/[가-힣]니다(?=[.\s,)]|$)/);
    expect(system).not.toMatch(/❌|✅|Good:|Bad:/);
  });

  it("시기는 지금 나이보다 뒤만 말하도록 나이를 넘긴다", () => {
    expect(buildFollowUpUserPrompt(request)).toContain("만 23세");
  });
});

describe("generateFollowUpAnswer", () => {
  it("judgment를 answer보다 먼저 쓰는 스키마로 요청한다", async () => {
    mockChatCompletion.mockResolvedValue(
      answer("스물여섯 무렵이 가장 자연스러워요.")
    );
    await generateFollowUpAnswer(request);
    const schema = mockChatCompletion.mock.calls[0][1]?.responseSchema as {
      properties: Record<string, unknown>;
    };
    expect(Object.keys(schema.properties)).toEqual([
      "isRelevant",
      "judgment",
      "answer",
    ]);
  });

  it("~니다 답변이면 한국어 피드백을 붙여 1회 재생성한다", async () => {
    mockChatCompletion
      .mockResolvedValueOnce(answer("스물여섯에 인연이 들어옵니다."))
      .mockResolvedValueOnce(answer("스물여섯 무렵에 인연이 들어와요."));

    const result = await generateFollowUpAnswer(request);

    expect(mockChatCompletion).toHaveBeenCalledTimes(2);
    const feedback = mockChatCompletion.mock.calls[1][0].at(-1);
    expect(feedback?.content).toContain("해요체");
    expect(result.answer).toBe("스물여섯 무렵에 인연이 들어와요.");
  });

  it("별·궁 이름이 나오면 재생성한다", async () => {
    mockChatCompletion
      .mockResolvedValueOnce(answer("부처궁에 천동이 있어 편한 사람이 와요."))
      .mockResolvedValueOnce(answer("편하게 웃게 해 주는 사람이 와요."));

    await generateFollowUpAnswer(request);

    expect(mockChatCompletion).toHaveBeenCalledTimes(2);
  });

  it("범위 밖 질문의 고정 거절 문구는 검사하지 않는다", async () => {
    const refusal = buildFollowUpRefusal("lifetime");
    mockChatCompletion.mockResolvedValue(answer(refusal, false));

    const result = await generateFollowUpAnswer({
      ...request,
      question: "김치찌개 끓이는 법 알려줘",
    });

    expect(mockChatCompletion).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ isRelevant: false, answer: refusal });
  });

  it("화면에 쓰지 않는 judgment는 결과에서 뺀다", async () => {
    mockChatCompletion.mockResolvedValue(answer("스물여섯 무렵이에요."));
    const result = await generateFollowUpAnswer(request);
    expect(result).toEqual({
      isRelevant: true,
      answer: "스물여섯 무렵이에요.",
    });
  });
});
