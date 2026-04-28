import { env } from "@/env";

import { NEW_PROMPT } from "./prompts/new";

// ============================================================
// 관상 리포트 단일 호출 generator (Phase 21).
//
// 설계 원칙: 사용자 업로드 사진 + NEW_PROMPT 두 가지만 OpenAI에 전달한다.
// system 메시지 / response_format / schema / validator / retry feedback
// 어떤 형태의 추가 컨텍스트도 주입하지 않는다.
// ============================================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.8;

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

export const generateFaceReport = async ({
  imageBase64,
  mimeType,
}: GenerateFaceReportInput): Promise<string> => {
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
      console.warn(
        "[face-report] 응답이 토큰 상한에 도달해 잘렸습니다 — max_completion_tokens 검토 필요."
      );
    }

    if (choice?.finish_reason === "content_filter") {
      throw new Error("OpenAI 응답이 콘텐츠 필터에 의해 차단되었습니다.");
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
};
