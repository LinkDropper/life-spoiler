import { env } from "@/env";

import * as geminiClient from "./gemini";
import * as openaiClient from "./openai";
import type { GeminiMessage } from "./types";

export type { ChatCompletionOptions } from "./gemini";

// ============================================================
// 인생스포 텍스트 해석 LLM 제공자 스위치
// (LIFE_SPOILER_LLM_PROVIDER=openai(default) | gemini)
// ============================================================

/** 현재 활성 제공자가 응답 시 사용한 모델명 (meta.model 기록용) */
export const CURRENT_MODEL_NAME =
  env.LIFE_SPOILER_LLM_PROVIDER === "openai"
    ? openaiClient.OPENAI_MODEL_NAME
    : geminiClient.GEMINI_MODEL_NAME;

export const chatCompletion = (
  messages: GeminiMessage[],
  options: openaiClient.ChatCompletionOptions = {}
): Promise<string> =>
  env.LIFE_SPOILER_LLM_PROVIDER === "openai"
    ? openaiClient.chatCompletion(messages, options)
    : geminiClient.chatCompletion(messages, options);

/**
 * JSON 파싱은 gemini.ts의 공용 로직을 그대로 쓰되, OpenAI strict 모드가
 * optional 필드를 null로 채워 보내는 문제는 OpenAI 경로에서만 후처리한다
 * (gemini.ts는 provider 중립을 유지).
 */
export const parseJsonResponse = <T>(content: string): T => {
  const parsed = geminiClient.parseJsonResponse<unknown>(content);
  return (
    env.LIFE_SPOILER_LLM_PROVIDER === "openai"
      ? openaiClient.stripNullValues(parsed)
      : parsed
  ) as T;
};
