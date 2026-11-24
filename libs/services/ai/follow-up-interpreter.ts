import type { FollowUpFortuneType } from "@/libs/supabase/types";

import { AIError } from "./errors";
import {
  buildFollowUpSystemPrompt,
  buildFollowUpUserPrompt,
} from "./prompts/follow-up-ko";
import type { GeminiMessage, GeminiResponseSchema } from "./types";
import { completeWithViolationRetry } from "./violation-retry";

// ============================================================
// 추가 질문 응답 생성 (운세 결과 기반 대화)
// ============================================================

/** judgment 칸이 늘어 550에서 올렸다 (잘리면 openai.ts가 오류를 던진다) */
const FOLLOW_UP_MAX_OUTPUT_TOKENS = 900;
const FOLLOW_UP_TEMPERATURE = 0.6;
const ANSWER_MAX_CHARS = 600;

/**
 * isRelevant → judgment → answer 순서. strict 모드는 속성 순서대로 생성하므로
 * 답(judgment)을 먼저 한 문장으로 정한 뒤 본문을 쓴다. judgment는 화면에 쓰지 않는다.
 */
const FOLLOW_UP_RESPONSE_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    isRelevant: { type: "boolean" },
    judgment: { type: "string" },
    answer: { type: "string" },
  },
  required: ["isRelevant", "judgment", "answer"],
};

/** 범위 밖 질문의 고정 거절 문구는 검사하지 않는다 */
const pickAnswerToCheck = (parsed: unknown): unknown => {
  if (!parsed || typeof parsed !== "object") return parsed;
  const { isRelevant, answer } = parsed as Partial<FollowUpResponse>;
  return isRelevant === false ? null : { answer };
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
 * 관련성 판정 + 답변을 받는다. 문체 위반(~니다, 별·궁 이름, 추상어 등)이 있으면 1회 재생성한다.
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

  const { parsed } = await completeWithViolationRetry<FollowUpResponse>(
    messages,
    {
      language: "ko",
      completion: {
        temperature: FOLLOW_UP_TEMPERATURE,
        maxTokens: FOLLOW_UP_MAX_OUTPUT_TOKENS,
        responseSchema: FOLLOW_UP_RESPONSE_SCHEMA,
      },
      pickTarget: pickAnswerToCheck,
      label: `follow-up:${request.fortuneType}`,
    }
  );

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
