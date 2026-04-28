import { env } from "@/env";

import { NEW_PROMPT } from "./prompts/new";

import type { FaceReportSection } from "./types";

// ============================================================
// 관상 리포트 단일 호출 generator (Phase 21).
//
// 설계 원칙:
// - 사용자 업로드 사진 + NEW_PROMPT 두 가지만 OpenAI에 전달한다.
//   system 메시지 / 추가 컨텍스트 텍스트는 일체 주입하지 않는다.
// - 단, 출력 구조의 안정성을 위해 `response_format: json_schema strict`를 사용한다.
//   이는 프롬프트(텍스트 입력)가 아닌 API 파라미터로, 모델이 반환할 JSON shape만
//   강제하는 안전망이다. 의미적 가이드는 NEW_PROMPT에서 모두 통제.
// - sections 배열을 그대로 반환. 호출자가 face_reports.result에 저장한다.
// ============================================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.8;

const FACE_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sections"],
  properties: {
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["number", "title", "body"],
        properties: {
          number: { type: "integer" },
          title: { type: "string" },
          body: { type: "string" },
        },
      },
    },
  },
} as const;

interface FaceReportPayload {
  sections: FaceReportSection[];
}

interface OpenAIChatResponse {
  choices?: Array<{
    message: { role: string; content: string | null };
    finish_reason: string | null;
  }>;
  error?: { message: string; type: string; code?: string };
}

interface GenerateFaceReportInput {
  imageBase64: string;
  mimeType: string;
}

const isValidPayload = (value: unknown): value is FaceReportPayload => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<FaceReportPayload>;
  if (!Array.isArray(v.sections) || v.sections.length === 0) return false;
  return v.sections.every(
    (s) =>
      s &&
      typeof s === "object" &&
      typeof (s as FaceReportSection).number === "number" &&
      typeof (s as FaceReportSection).title === "string" &&
      typeof (s as FaceReportSection).body === "string"
  );
};

export const generateFaceReport = async ({
  imageBase64,
  mimeType,
}: GenerateFaceReportInput): Promise<FaceReportSection[]> => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API 키가 설정되지 않았습니다.");
  }

  const model = env.OPENAI_FACE_MODEL;
  const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: NEW_PROMPT },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: TEMPERATURE,
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "face_report",
            strict: true,
            schema: FACE_REPORT_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI 관상 리포트 생성 실패 (${response.status}): ${errorText.slice(0, 500)}`
      );
    }

    const data = (await response.json()) as OpenAIChatResponse;

    if (data.error) {
      throw new Error(
        `OpenAI 오류: ${data.error.message} (${data.error.code ?? data.error.type})`
      );
    }

    const choice = data.choices?.[0];
    const text = choice?.message.content?.trim();

    if (!text) {
      throw new Error("OpenAI 응답이 비어있습니다.");
    }

    if (choice?.finish_reason === "length") {
      throw new Error(
        "OpenAI 응답이 토큰 상한에 도달해 잘렸습니다 — max_completion_tokens 증설 필요."
      );
    }

    if (choice?.finish_reason === "content_filter") {
      throw new Error("OpenAI 응답이 콘텐츠 필터에 의해 차단되었습니다.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      const snippet = text.slice(0, 300).replace(/\n/g, "\\n");
      throw new Error(
        `OpenAI 응답 JSON 파싱 실패: ${(parseError as Error).message}. 응답 앞부분: ${snippet}...`
      );
    }

    if (!isValidPayload(parsed)) {
      throw new Error(
        "OpenAI 응답이 기대 구조(sections 배열)와 일치하지 않습니다."
      );
    }

    return parsed.sections;
  } finally {
    clearTimeout(timer);
  }
};
