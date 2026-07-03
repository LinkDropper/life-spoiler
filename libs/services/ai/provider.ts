import { env } from "@/env";

import * as geminiClient from "./gemini";
import * as openaiClient from "./openai";
import type { GeminiMessage } from "./types";

export type { ChatCompletionOptions } from "./gemini";
export { parseJsonResponse } from "./gemini";

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
