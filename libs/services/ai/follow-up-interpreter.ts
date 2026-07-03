import { AIError } from "./errors";
import { chatCompletion, parseJsonResponse } from "./provider";
import {
  buildFollowUpSystemPrompt,
  buildFollowUpUserPrompt,
} from "./prompts/follow-up-ko";
import type { GeminiMessage, GeminiResponseSchema } from "./types";
import type { FollowUpFortuneType } from "@/libs/supabase/types";

// ============================================================
// 추가 질문 응답 생성 (운세 결과 기반 대화)
// ============================================================

const FOLLOW_UP_MAX_OUTPUT_TOKENS = 550;
const FOLLOW_UP_TEMPERATURE = 0.6;
const ANSWER_MAX_CHARS = 600;

const FOLLOW_UP_RESPONSE_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    isRelevant: { type: "boolean" },
    answer: { type: "string" },
  },
  required: ["isRelevant", "answer"],
};

export interface FollowUpRequest {
  fortuneType: FollowUpFortuneType;
  fortuneResult: unknown;
  userContext: {
    currentAge: number;
    birthDate: string;
    todayDate: string;
  };
  history: { question: string; answer: string }[];
  question: string;
}

export interface FollowUpResponse {
  isRelevant: boolean;
  answer: string;
}

/**
 * 운세 결과 + 사용자 컨텍스트(나이/오늘 날짜) + 이전 이력을 바탕으로
 * Gemini에 질문하고 관련성 판정 + 답변을 받는다.
 */
export const generateFollowUpAnswer = async (
  request: FollowUpRequest
): Promise<FollowUpResponse> => {
  const systemPrompt = buildFollowUpSystemPrompt(request.fortuneType);
  const userPrompt = buildFollowUpUserPrompt(request);

  const messages: GeminiMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const raw = await chatCompletion(messages, {
    temperature: FOLLOW_UP_TEMPERATURE,
    maxTokens: FOLLOW_UP_MAX_OUTPUT_TOKENS,
    responseSchema: FOLLOW_UP_RESPONSE_SCHEMA,
  });

  const parsed = parseJsonResponse<FollowUpResponse>(raw);

  if (
    typeof parsed.isRelevant !== "boolean" ||
    typeof parsed.answer !== "string"
  ) {
    throw new AIError("추가 질문 응답 형식이 올바르지 않습니다.", {
      code: "INVALID_RESPONSE",
    });
  }

  return {
    isRelevant: parsed.isRelevant,
    answer: trimToLastSentence(parsed.answer.trim(), ANSWER_MAX_CHARS),
  };
};

/**
 * 답변이 너무 길 경우 마지막 완성된 문장까지만 남기고 잘라냄.
 */
const trimToLastSentence = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) {
    return text;
  }

  const truncated = text.slice(0, maxChars);
  const candidates = [
    truncated.lastIndexOf("다."),
    truncated.lastIndexOf("요."),
    truncated.lastIndexOf("죠."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
    truncated.lastIndexOf(". "),
  ];
  const lastEnd = Math.max(...candidates);

  if (lastEnd <= 0) {
    return `${truncated}…`;
  }

  const cutOffset = text[lastEnd + 1] === " " ? 1 : 2;
  return text.slice(0, lastEnd + cutOffset).trim();
};
