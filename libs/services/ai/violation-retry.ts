import type { Locale } from "@/i18n/config";

import {
  buildViolationFeedback,
  findOutputViolations,
} from "./output-validator";
import type {
  OutputValidatorOptions,
  OutputViolation,
} from "./output-validator";
import { chatCompletion, parseJsonResponse } from "./provider";
import type { ChatCompletionOptions } from "./provider";
import type { GeminiMessage, GeminiResponseSchema } from "./types";

// ============================================================
// 운세 공통: 응답 생성 → 코드 검사 → 위반 시 1회 재생성
// ============================================================

/**
 * 맨 앞에 judgment(판정 한 문장)를 둔 스키마 사본.
 * 본문을 쓰기 전에 "결국 하는 말"을 먼저 정하게 하는 칸이다
 * (docs/lifetime-prompt-redesign-2026-11.md §1 D3). 화면에는 쓰지 않는다.
 */
export const withJudgment = (
  schema: GeminiResponseSchema
): GeminiResponseSchema => ({
  ...schema,
  properties: { judgment: { type: "string" }, ...schema.properties },
  required: ["judgment", ...(schema.required ?? [])],
});

export interface ViolationRetryOptions {
  /** 없으면 검사는 KO 규칙, 피드백은 영어 (findOutputViolations·buildViolationFeedback 기본값) */
  language?: Locale;
  completion: ChatCompletionOptions;
  validator?: OutputValidatorOptions;
  /**
   * 검사할 부분만 고른다. 기본은 응답 전체.
   * 예: 질문 답변에서 범위 밖 질문의 고정 거절 문구는 검사하지 않는다.
   */
  pickTarget?: (parsed: unknown) => unknown;
  /** 재생성 뒤에도 위반이 남을 때 로그에 남길 이름 */
  label: string;
}

export interface ViolationRetryResult<T> {
  response: string;
  parsed: T;
  /** 재생성을 했는지 (비용 추적용) */
  retried: boolean;
  /** 재생성 뒤에도 남은 위반 */
  remaining: OutputViolation[];
}

/**
 * 생성 후 금지 용어·문체 위반이 있으면 한국어(또는 해당 언어) 피드백을 붙여 1회 재생성한다.
 * 재생성 뒤에도 남으면 결과는 내보내고 경고 로그만 남긴다 (위반률은 품질 지표로 본다).
 */
export const completeWithViolationRetry = async <T = unknown>(
  messages: GeminiMessage[],
  options: ViolationRetryOptions
): Promise<ViolationRetryResult<T>> => {
  const { language, completion, validator, label } = options;
  const pickTarget = options.pickTarget ?? ((parsed: unknown) => parsed);
  const check = (parsed: unknown): OutputViolation[] =>
    findOutputViolations(pickTarget(parsed), language, validator);

  const response = await chatCompletion(messages, completion);
  const parsed = parseJsonResponse<T>(response);
  const violations = check(parsed);
  if (violations.length === 0) {
    return { response, parsed, retried: false, remaining: [] };
  }

  const retryResponse = await chatCompletion(
    [
      ...messages,
      { role: "assistant", content: response },
      { role: "user", content: buildViolationFeedback(violations, language) },
    ],
    completion
  );
  const retryParsed = parseJsonResponse<T>(retryResponse);
  const remaining = check(retryParsed);
  if (remaining.length > 0) {
    console.warn(`[${label}-validator] 재생성 후에도 금지 표현 잔존`, {
      violations: remaining.map((v) => `${v.path}: ${v.match}`),
    });
  }
  return {
    response: retryResponse,
    parsed: retryParsed,
    retried: true,
    remaining,
  };
};
