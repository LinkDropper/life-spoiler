import { env } from "@/env";

import { CHARACTER_IMAGE_PROMPT } from "./prompts";

const CHARACTER_MODEL = "gemini-2.5-flash-image";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 90_000;

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiImageResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

export interface GeneratedCharacterImage {
  base64: string;
  mimeType: string;
}

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const generateCharacterImage = async (
  sourceImageBase64: string,
  sourceMimeType: string
): Promise<GeneratedCharacterImage> => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API 키가 설정되지 않았습니다.");
  }

  const parts: GeminiPart[] = [
    { text: CHARACTER_IMAGE_PROMPT },
    {
      inlineData: {
        mimeType: sourceMimeType,
        data: sourceImageBase64,
      },
    },
  ];

  const url = `${GEMINI_API_BASE}/${CHARACTER_MODEL}:generateContent`;
  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      }),
    },
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini 이미지 생성 실패 (${response.status}): ${errorText}`
    );
  }

  const data: GeminiImageResponse = await response.json();

  if (data.promptFeedback?.blockReason) {
    throw new Error(
      `이미지 생성이 차단되었습니다: ${data.promptFeedback.blockReason}`
    );
  }

  const imagePart = data.candidates?.[0]?.content.parts.find(
    (part) => part.inlineData
  );

  if (!imagePart?.inlineData) {
    throw new Error("Gemini 응답에 이미지 데이터가 없습니다.");
  }

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
};
