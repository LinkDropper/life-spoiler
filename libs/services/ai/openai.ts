import { env } from "@/env";

import { AIError } from "./errors";
import type {
  GeminiMessage,
  GeminiResponseSchema,
  GeminiSchemaProperty,
} from "./types";

// ============================================================
// 설정
// ============================================================

export const OPENAI_MODEL_NAME = env.OPENAI_FACE_MODEL;

const OPENAI_CONFIG = {
  url: "https://api.openai.com/v1/chat/completions",
  defaultTemperature: 0.8,
  defaultMaxTokens: 12000,
  timeout: 60000, // 60초 — 자미두수 해석은 응답이 길어 Gemini(30초)보다 여유를 둠
  maxRetries: 3,
  retryDelay: 1000,
} as const;

// ============================================================
// OpenAI API 클라이언트
// ============================================================

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseSchema?: GeminiResponseSchema;
}

interface OpenAIChatResponse {
  choices?: Array<{
    message: { role: string; content: string | null };
    finish_reason: string | null;
  }>;
  error?: { message: string; type: string; code?: string };
}

/**
 * OpenAI API로 채팅 완성 요청.
 * gemini.ts의 chatCompletion과 동일한 시그니처를 유지해 provider.ts에서
 * 서로 교체 가능하도록 한다.
 */
export const chatCompletion = async (
  messages: GeminiMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> => {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIError("OpenAI API 키가 설정되지 않았습니다.", {
      code: "API_KEY_MISSING",
    });
  }

  const openaiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const responseFormat = options.responseSchema
    ? {
        type: "json_schema" as const,
        json_schema: {
          name: "response",
          strict: true,
          schema: toStrictJsonSchema(options.responseSchema),
        },
      }
    : { type: "json_object" as const };

  const request = {
    model: OPENAI_MODEL_NAME,
    messages: openaiMessages,
    temperature: options.temperature ?? OPENAI_CONFIG.defaultTemperature,
    max_completion_tokens: options.maxTokens ?? OPENAI_CONFIG.defaultMaxTokens,
    response_format: responseFormat,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= OPENAI_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        OPENAI_CONFIG.url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(request),
        },
        OPENAI_CONFIG.timeout
      );

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 429) {
          throw new AIError("API 요청 한도를 초과했습니다.", {
            code: "RATE_LIMITED",
            statusCode: 429,
          });
        }

        throw new AIError(`OpenAI API 요청 실패: ${errorText}`, {
          code: "API_REQUEST_FAILED",
          statusCode: response.status,
        });
      }

      const data: OpenAIChatResponse = await response.json();

      if (data.error) {
        throw new AIError(`OpenAI 오류: ${data.error.message}`, {
          code: "API_REQUEST_FAILED",
        });
      }

      const choice = data.choices?.[0];
      const content = choice?.message.content;

      if (!content) {
        throw new AIError("AI 응답이 비어있습니다.", {
          code: "INVALID_RESPONSE",
        });
      }

      if (choice?.finish_reason === "length") {
        throw new AIError(
          "AI 응답이 토큰 상한에 도달해 잘렸습니다 — maxTokens 증설 필요.",
          { code: "RESPONSE_TRUNCATED" }
        );
      }

      if (choice?.finish_reason === "content_filter") {
        throw new AIError("AI 응답이 콘텐츠 필터에 의해 차단되었습니다.", {
          code: "INVALID_RESPONSE",
        });
      }

      return content;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof AIError && error.code === "API_KEY_MISSING") {
        throw error;
      }

      if (attempt < OPENAI_CONFIG.maxRetries) {
        const backoffDelay = OPENAI_CONFIG.retryDelay * Math.pow(2, attempt);

        if (error instanceof AIError && error.code === "RATE_LIMITED") {
          console.warn(
            `Rate limited. ${backoffDelay}ms 후 재시도... (${attempt + 1}/${OPENAI_CONFIG.maxRetries})`
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

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Gemini용 느슨한 responseSchema(일부 필드만 required)를
 * OpenAI Structured Outputs strict 모드 스키마로 변환한다.
 * strict 모드는 모든 프로퍼티가 required에 있어야 하므로, 원래 optional이던
 * 필드는 `type: [원래타입, "null"]`로 nullable 처리해 optional을 표현한다.
 */
const toStrictJsonSchema = (
  schema: GeminiResponseSchema | GeminiSchemaProperty
): Record<string, unknown> => {
  if (schema.type === "object") {
    const properties = schema.properties ?? {};
    const requiredFields = new Set(schema.required ?? []);
    const convertedProperties: Record<string, unknown> = {};

    for (const [key, propSchema] of Object.entries(properties)) {
      const converted = toStrictJsonSchema(propSchema);
      convertedProperties[key] = requiredFields.has(key)
        ? converted
        : makeNullable(converted);
    }

    return {
      type: "object",
      additionalProperties: false,
      properties: convertedProperties,
      required: Object.keys(properties),
    };
  }

  if (schema.type === "array") {
    return {
      type: "array",
      items: schema.items
        ? toStrictJsonSchema(schema.items)
        : { type: "string" },
    };
  }

  const converted: Record<string, unknown> = { type: schema.type };

  if ("description" in schema && schema.description) {
    converted.description = schema.description;
  }
  if ("enum" in schema && schema.enum) {
    converted.enum = schema.enum;
  }
  if ("minimum" in schema && schema.minimum !== undefined) {
    converted.minimum = schema.minimum;
  }
  if ("maximum" in schema && schema.maximum !== undefined) {
    converted.maximum = schema.maximum;
  }

  return converted;
};

const makeNullable = (
  schema: Record<string, unknown>
): Record<string, unknown> => {
  const { type } = schema;
  return {
    ...schema,
    type: Array.isArray(type) ? [...type, "null"] : [type, "null"],
  };
};
