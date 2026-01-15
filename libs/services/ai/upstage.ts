import { env } from "@/env";

import { AIError } from "./errors";
import type { UpstageMessage, UpstageRequest, UpstageResponse } from "./types";

// ============================================================
// 설정
// ============================================================

const UPSTAGE_CONFIG = {
  baseUrl: "https://api.upstage.ai/v1/solar",
  model: "solar-pro",
  defaultTemperature: 0.7,
  defaultMaxTokens: 2000,
  timeout: 30000, // 30초
  maxRetries: 2,
} as const;

// ============================================================
// Upstage API 클라이언트
// ============================================================

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Upstage API로 채팅 완성 요청
 */
export const chatCompletion = async (
  messages: UpstageMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> => {
  const apiKey = env.UPSTAGE_API_KEY;

  if (!apiKey) {
    throw new AIError("Upstage API 키가 설정되지 않았습니다.", {
      code: "API_KEY_MISSING",
    });
  }

  const request: UpstageRequest = {
    model: UPSTAGE_CONFIG.model,
    messages,
    temperature: options.temperature ?? UPSTAGE_CONFIG.defaultTemperature,
    max_tokens: options.maxTokens ?? UPSTAGE_CONFIG.defaultMaxTokens,
    stream: false,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= UPSTAGE_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${UPSTAGE_CONFIG.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(request),
        },
        UPSTAGE_CONFIG.timeout
      );

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 429) {
          throw new AIError("API 요청 한도를 초과했습니다.", {
            code: "RATE_LIMITED",
            statusCode: 429,
          });
        }

        throw new AIError(`Upstage API 요청 실패: ${errorText}`, {
          code: "API_REQUEST_FAILED",
          statusCode: response.status,
        });
      }

      const data: UpstageResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new AIError("AI 응답이 비어있습니다.", {
          code: "INVALID_RESPONSE",
        });
      }

      return data.choices[0].message.content;
    } catch (error) {
      lastError = error as Error;

      // 재시도하지 않는 에러들
      if (error instanceof AIError) {
        if (
          error.code === "API_KEY_MISSING" ||
          error.code === "RATE_LIMITED"
        ) {
          throw error;
        }
      }

      // 타임아웃이 아닌 경우 재시도
      if (
        attempt < UPSTAGE_CONFIG.maxRetries &&
        !(error instanceof AIError && error.code === "TIMEOUT")
      ) {
        // 지수 백오프
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
    }
  }

  throw (
    lastError ||
    new AIError("알 수 없는 오류가 발생했습니다.", {
      code: "UNKNOWN_ERROR",
    })
  );
};

// ============================================================
// 유틸리티
// ============================================================

/**
 * 타임아웃이 있는 fetch
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new AIError("API 요청 시간이 초과되었습니다.", {
        code: "TIMEOUT",
      });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * 지정된 시간만큼 대기
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * JSON 응답 파싱 (AI가 마크다운 코드 블록으로 감쌀 수 있음)
 */
export const parseJsonResponse = <T>(content: string): T => {
  try {
    // 마크다운 코드 블록 제거
    let jsonStr = content.trim();

    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }

    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }

    return JSON.parse(jsonStr.trim()) as T;
  } catch (error) {
    throw new AIError("AI 응답을 JSON으로 파싱할 수 없습니다.", {
      code: "RESPONSE_PARSE_FAILED",
      originalError: error as Error,
    });
  }
};
