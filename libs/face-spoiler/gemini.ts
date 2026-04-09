import { env } from "@/env";

import {
  buildFaceReportSystemPrompt,
  FACE_REPORT_RESPONSE_SCHEMA,
  FACE_REPORT_USER_PROMPT,
} from "./prompts";
import type { FaceReportData } from "./types";

const FACE_GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: {
    parts: GeminiPart[];
  };
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: unknown;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
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

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const generateFaceReport = async (
  imageBase64: string,
  mimeType: string
): Promise<FaceReportData> => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API 키가 설정되지 않았습니다.");
  }

  const systemPrompt = buildFaceReportSystemPrompt();

  const request: GeminiRequest = {
    contents: [
      {
        role: "user",
        parts: [
          { text: FACE_REPORT_USER_PROMPT },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: FACE_REPORT_RESPONSE_SCHEMA,
      temperature: 0.85,
      maxOutputTokens: 8192,
    },
  };

  const url = `${GEMINI_API_BASE}/${FACE_GEMINI_MODEL}:generateContent`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
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
        REQUEST_TIMEOUT_MS
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gemini API 요청 실패 (${response.status}): ${errorText}`
        );
      }

      const data: GeminiResponse = await response.json();

      if (data.promptFeedback?.blockReason) {
        throw new Error(
          `콘텐츠가 차단되었습니다: ${data.promptFeedback.blockReason}`
        );
      }

      const text = data.candidates?.[0]?.content.parts
        .map((p) => p.text)
        .join("");

      if (!text) {
        throw new Error("Gemini 응답이 비어있습니다.");
      }

      return JSON.parse(text) as FaceReportData;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
    }
  }

  throw (
    lastError ??
    new Error("Gemini 관상 리포트 생성에 알 수 없는 오류가 발생했습니다.")
  );
};
