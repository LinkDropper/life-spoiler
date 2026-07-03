import { env } from "@/env";

import { AIError } from "./errors";
import type {
  GeminiMessage,
  GeminiRequest,
  GeminiResponse,
  GeminiResponseSchema,
} from "./types";

// ============================================================
// 설정
// ============================================================

export const GEMINI_MODEL_NAME = "gemini-2.5-flash-lite";

const GEMINI_CONFIG = {
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  model: GEMINI_MODEL_NAME,
  defaultTemperature: 0.8,
  // 마크다운 구조(소제목/리스트/표/단락 분리)로 동일 정보당 토큰이 늘어남.
  // 6000으로는 700~800자 본문 + 마크다운 구조에서 잘림이 자주 발생.
  defaultMaxTokens: 12000,
  timeout: 30000, // 30초
  maxRetries: 3, // 3회 재시도 (총 4회 시도)
  retryDelay: 1000, // 기본 1초 대기 (exponential backoff 적용)
} as const;

// ============================================================
// Gemini API 클라이언트
// ============================================================

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseSchema?: GeminiResponseSchema;
}

/**
 * Gemini API로 채팅 완성 요청
 */
export const chatCompletion = async (
  messages: GeminiMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> => {
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AIError("Gemini API 키가 설정되지 않았습니다.", {
      code: "API_KEY_MISSING",
    });
  }

  // OpenAI 형식 메시지를 Gemini 형식으로 변환
  const systemMessage = messages.find((m) => m.role === "system");
  const userMessages = messages.filter((m) => m.role !== "system");

  const request: GeminiRequest = {
    contents: userMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: options.temperature ?? GEMINI_CONFIG.defaultTemperature,
      maxOutputTokens: options.maxTokens ?? GEMINI_CONFIG.defaultMaxTokens,
      responseMimeType: "application/json",
      ...(options.responseSchema && { responseSchema: options.responseSchema }),
    },
  };

  // 시스템 프롬프트가 있으면 추가
  if (systemMessage) {
    request.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= GEMINI_CONFIG.maxRetries; attempt++) {
    try {
      const url = `${GEMINI_CONFIG.baseUrl}/${GEMINI_CONFIG.model}:generateContent`;

      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(request),
        },
        GEMINI_CONFIG.timeout
      );

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 429) {
          throw new AIError("API 요청 한도를 초과했습니다.", {
            code: "RATE_LIMITED",
            statusCode: 429,
          });
        }

        throw new AIError(`Gemini API 요청 실패: ${errorText}`, {
          code: "API_REQUEST_FAILED",
          statusCode: response.status,
        });
      }

      const data: GeminiResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new AIError("AI 응답이 비어있습니다.", {
          code: "INVALID_RESPONSE",
        });
      }

      const [candidate] = data.candidates;

      // 토큰 상한에 걸려 응답이 잘린 경우 — 잘린 본문을 sanitize/recover로 메우면
      // 결론 문단이 통째로 누락된 결과가 그대로 저장된다.
      // 잘림이 감지되면 즉시 에러로 throw하여 재시도 루프(또는 호출자)가 처리하도록.
      if (candidate.finishReason === "MAX_TOKENS") {
        throw new AIError(
          "AI 응답이 토큰 상한에 도달해 잘렸습니다 — maxOutputTokens 증설 필요.",
          { code: "RESPONSE_TRUNCATED" }
        );
      }

      const content = candidate.content.parts.map((p) => p.text).join("");

      // AI 응답이 JSON 형식인지 기본 검증
      const trimmedContent = content.trim();
      const startsWithJson =
        trimmedContent.startsWith("{") ||
        trimmedContent.startsWith("[") ||
        trimmedContent.startsWith("```json") ||
        trimmedContent.startsWith("```");

      if (!startsWithJson) {
        console.warn(
          "AI 응답이 JSON 형식이 아님 - 재시도 예정. 응답 시작:",
          trimmedContent.slice(0, 100)
        );
        throw new AIError("AI 응답이 유효한 JSON 형식이 아닙니다.", {
          code: "INVALID_JSON_FORMAT",
        });
      }

      return content;
    } catch (error) {
      lastError = error as Error;

      // 재시도하지 않는 에러
      if (error instanceof AIError && error.code === "API_KEY_MISSING") {
        throw error;
      }

      // 재시도 가능한 경우 exponential backoff 적용
      if (attempt < GEMINI_CONFIG.maxRetries) {
        const backoffDelay = GEMINI_CONFIG.retryDelay * Math.pow(2, attempt);

        if (error instanceof AIError && error.code === "RATE_LIMITED") {
          console.warn(
            `Rate limited. ${backoffDelay}ms 후 재시도... (${attempt + 1}/${GEMINI_CONFIG.maxRetries})`
          );
        }

        await sleep(backoffDelay);
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
 * JSON 문자열 정리 (일반적인 AI 출력 오류 수정)
 */
const sanitizeJsonString = (str: string): string => {
  let result = str.trim();

  // 마크다운 코드 블록 제거
  if (result.startsWith("```json")) {
    result = result.slice(7);
  } else if (result.startsWith("```")) {
    result = result.slice(3);
  }
  if (result.endsWith("```")) {
    result = result.slice(0, -3);
  }

  result = result.trim();

  // JSON 시작 찾기
  const jsonStart = result.indexOf("{");
  if (jsonStart === -1) return result;

  result = result.slice(jsonStart);

  // JSON 끝 이후의 불필요한 텍스트 제거 시도
  const jsonEnd = findJsonEnd(result);
  if (jsonEnd !== -1 && jsonEnd < result.length - 1) {
    result = result.slice(0, jsonEnd + 1);
  }

  // 일반적인 JSON 오류 수정
  // 1. 문자열 내 이스케이프 안 된 줄바꿈 수정
  result = result.replace(/:\s*"([^"]*)\n([^"]*)"/g, (match, p1, p2) => {
    return `: "${p1}\\n${p2}"`;
  });

  // 2. 후행 쉼표 제거
  result = result.replace(/,\s*([}\]])/g, "$1");

  // 3. 누락된 쉼표 추가 (AI가 쉼표를 빠뜨리는 경우)
  // "value" 다음에 바로 "key": 가 오는 패턴 수정
  result = result.replace(/"\s*\n\s*"/g, '",\n"');
  // ] 다음에 바로 "key": 가 오는 패턴 수정
  result = result.replace(/\]\s*\n\s*"/g, '],\n"');
  // } 다음에 바로 "key": 가 오는 패턴 수정
  result = result.replace(/\}\s*\n\s*"/g, '},\n"');

  // 4. 잘린 JSON 복구 시도 (응답이 토큰 한도로 잘렸을 때)
  result = tryRecoverTruncatedJson(result);

  return result;
};

/**
 * 잘린 JSON 복구 시도
 * AI 응답이 토큰 한도로 잘렸을 때 JSON 구조를 복구
 */
const tryRecoverTruncatedJson = (str: string): string => {
  try {
    JSON.parse(str);
    return str;
  } catch {
    // 복구 시도
  }

  let result = str;

  // 문자열 중간에서 잘린 경우 처리
  // 마지막으로 열린 따옴표 이후의 불완전한 문자열 값 찾기
  const lastQuoteIndex = findLastUnmatchedQuote(result);
  if (lastQuoteIndex !== -1) {
    // 불완전한 문자열 값을 "..." 로 truncate 표시하고 닫기
    result = `${result.slice(0, lastQuoteIndex + 1)}..."`;
  }

  // 이스케이프된 따옴표를 제외한 실제 따옴표 카운트 재확인
  const unescapedQuotes = result.replace(/\\"/g, "").match(/"/g) || [];
  if (unescapedQuotes.length % 2 !== 0) {
    result = `${result}"`;
  }

  // 괄호 균형 맞추기
  const openBraces = (result.match(/{/g) || []).length;
  const closeBraces = (result.match(/}/g) || []).length;
  const openBrackets = (result.match(/\[/g) || []).length;
  const closeBrackets = (result.match(/]/g) || []).length;

  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    result = `${result}]`;
  }

  for (let i = 0; i < openBraces - closeBraces; i++) {
    result = `${result}}`;
  }

  result = result.replace(/,\s*([}\]])/g, "$1");

  return result;
};

/**
 * JSON 객체의 끝 위치 찾기
 * 올바르게 닫힌 JSON의 마지막 } 위치 반환
 */
const findJsonEnd = (str: string): number => {
  let depth = 0;
  let inString = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : "";

    if (char === '"' && prevChar !== "\\") {
      inString = !inString;
    } else if (!inString) {
      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
  }

  return -1; // JSON이 완전하지 않음
};

/**
 * 마지막으로 매칭되지 않은 따옴표의 위치 찾기
 * 문자열이 중간에 잘린 경우 해당 위치 반환
 */
const findLastUnmatchedQuote = (str: string): number => {
  let inString = false;
  let lastOpenQuote = -1;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : "";

    if (char === '"' && prevChar !== "\\") {
      if (!inString) {
        inString = true;
        lastOpenQuote = i;
      } else {
        inString = false;
        lastOpenQuote = -1;
      }
    }
  }

  return lastOpenQuote;
};

/**
 * 문자열 값 내의 이스케이프되지 않은 따옴표 처리
 */
const escapeQuotesInValues = (str: string): string => {
  let result = "";
  let inString = false;
  let i = 0;

  while (i < str.length) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : "";

    if (char === '"' && prevChar !== "\\") {
      if (!inString) {
        // 문자열 시작
        inString = true;
        result += char;
      } else {
        // 문자열 내 따옴표인지 문자열 끝인지 판단
        // 다음 문자가 :, ,, }, ] 또는 공백+이들이면 문자열 끝
        const remaining = str.slice(i + 1).trimStart();
        if (
          remaining.startsWith(":") ||
          remaining.startsWith(",") ||
          remaining.startsWith("}") ||
          remaining.startsWith("]") ||
          remaining.length === 0
        ) {
          // 문자열 끝
          inString = false;
          result += char;
        } else {
          // 문자열 내 따옴표 - 이스케이프
          result += '\\"';
        }
      }
    } else {
      result += char;
    }
    i++;
  }

  return result;
};

/**
 * OpenAI strict 모드는 optional 필드도 required에 넣어야 하므로 값이 없으면
 * `null`로 채워 보낸다. 우리 Zod 스키마는 `.optional()`(undefined만 허용)을
 * 쓰므로 null이 오면 파싱이 깨진다 — null 값을 가진 키를 재귀적으로 제거해
 * "필드 없음"과 동일하게 취급한다. Gemini는 애초에 null을 보내지 않으므로
 * 해당 경로에서는 no-op.
 */
const stripNullValues = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripNullValues(item)) as unknown as T;
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === null) continue;
      result[key] = stripNullValues(v);
    }
    return result as T;
  }

  return value;
};

/**
 * JSON 응답 파싱 (AI가 마크다운 코드 블록으로 감쌀 수 있음)
 */
export const parseJsonResponse = <T>(content: string): T => {
  const jsonStr = sanitizeJsonString(content);

  // 1차 시도: 기본 파싱
  try {
    return stripNullValues(JSON.parse(jsonStr)) as T;
  } catch {
    // 1차 실패 - 계속 진행
  }

  // 2차 시도: 제어 문자 제거
  try {
    const cleaned = jsonStr
      .replace(/[\x00-\x1F\x7F]/g, (char) => {
        if (char === "\n" || char === "\r" || char === "\t") {
          return char;
        }
        return "";
      })
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    return stripNullValues(JSON.parse(cleaned)) as T;
  } catch {
    // 2차 실패 - 계속 진행
  }

  // 3차 시도: 문자열 내 이스케이프되지 않은 따옴표 처리
  try {
    const escaped = escapeQuotesInValues(jsonStr);
    return stripNullValues(JSON.parse(escaped)) as T;
  } catch {
    // 3차 실패 - 계속 진행
  }

  // 4차 시도: 줄바꿈을 공백으로 치환하고 다시 시도
  try {
    const singleLine = jsonStr.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    return stripNullValues(JSON.parse(singleLine)) as T;
  } catch (finalError) {
    // 디버깅을 위해 원본 응답의 일부 로깅
    console.error(
      "JSON 파싱 실패 - 원본 응답 (처음 500자):",
      jsonStr.slice(0, 500)
    );

    throw new AIError("AI 응답을 JSON으로 파싱할 수 없습니다.", {
      code: "RESPONSE_PARSE_FAILED",
      originalError: finalError as Error,
    });
  }
};
