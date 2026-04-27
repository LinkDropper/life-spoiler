import type { GeminiResponse } from "../types";

jest.mock("@/env", () => ({
  env: { GEMINI_API_KEY: "test-key" },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chatCompletion } = require("../gemini") as typeof import("../gemini");

const createGeminiResponse = (
  text: string,
  finishReason = "STOP"
): GeminiResponse => ({
  candidates: [
    {
      content: { parts: [{ text }], role: "model" },
      finishReason,
    },
  ],
});

describe("chatCompletion", () => {
  const messages = [{ role: "user" as const, content: "test" }];

  it("finishReason이 STOP이면 정상 응답을 반환한다", async () => {
    const validJson =
      '{"headline":"test","content":"본문","tags":["a"],"score":50}';
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createGeminiResponse(validJson, "STOP")),
    });

    const result = await chatCompletion(messages);
    expect(result).toBe(validJson);
  });

  it("finishReason이 MAX_TOKENS이면 RESPONSE_TRUNCATED 에러를 던진다", async () => {
    const truncatedJson = '{"headline":"test","content":"잘린 본문';
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve(createGeminiResponse(truncatedJson, "MAX_TOKENS")),
    });

    await expect(chatCompletion(messages)).rejects.toMatchObject({
      code: "RESPONSE_TRUNCATED",
    });
    // 1 initial + 3 retries = 4 total
    expect(mockFetch).toHaveBeenCalledTimes(4);
  }, 30000);
});
