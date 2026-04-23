import { env } from "@/env";

import {
  validateInterestAreas,
  validateRegionScores,
  validateSignatureOverall,
} from "./gemini.v3";
import {
  INTEREST_AREAS_USER_PROMPT,
  REGION_SCORES_USER_PROMPT,
  SIGNATURE_OVERALL_USER_PROMPT,
  buildInterestAreasSystemPrompt,
  buildRegionScoresSystemPrompt,
  buildSignatureOverallSystemPrompt,
} from "./prompts/text-report.v3";
import type {
  InterestAreasResponse,
  RegionScoresResponse,
  SignatureOverallResponse,
} from "./prompts/text-report.v3";
import {
  INTEREST_AREAS_SCHEMA_STRICT,
  REGION_SCORES_SCHEMA_STRICT,
  SIGNATURE_OVERALL_SCHEMA_STRICT,
} from "./prompts/text-report.v3.openai-schemas";
import type { RegionRawScore } from "./region-scorer";
import type { AnimalMatch } from "./types";
import type { FaceTextReportV3 } from "./types.v3";

// ============================================================
// Phase 20 (2026-04-22) — OpenAI GPT-5.4 mini 병행 구현.
//
// 목적: Gemini 2.5 Flash 대비 품질·지연·비용 비교 실험.
// Provider 스위칭은 `env.FACE_SPOILER_LLM_PROVIDER`. Gemini 기본, openai는 선택.
//
// 재사용 전략:
// - 프롬프트 빌더(`buildSignatureOverallSystemPrompt` 등) 그대로 재사용.
// - Validator(`validateSignatureOverall` 등) 그대로 재사용 — 응답 구조 동일.
// - JSON Schema만 strict 버전(`text-report.v3.openai-schemas.ts`) 사용.
// - API 호출 레이어(이 파일)만 신규. 의존성 없이 `fetch` 직접 호출.
//
// 재시도 정책: Gemini와 동일. Hard 5회, Soft 1회, retry feedback 주입.
// ============================================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;

/** Hard validator 재시도 상한 (구조 실패). */
const MAX_HARD_RETRIES = 3;
/** Soft validator 재시도 상한 (품질 실패). */
const MAX_SOFT_RETRIES = 1;
/** 루프 상한은 Hard 기준. Soft는 내부 조건으로 제한. */
const MAX_RETRIES = MAX_HARD_RETRIES;

interface OpenAIContentTextPart {
  type: "text";
  text: string;
}

interface OpenAIContentImagePart {
  type: "image_url";
  image_url: { url: string };
}

type OpenAIUserContent = OpenAIContentTextPart | OpenAIContentImagePart;

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenAIUserContent[];
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  response_format: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: true;
      schema: unknown;
    };
  };
  temperature?: number;
  max_completion_tokens?: number;
}

interface OpenAIResponse {
  choices?: Array<{
    message: {
      role: string;
      content: string | null;
    };
    finish_reason: "stop" | "length" | "content_filter" | "tool_calls" | null;
  }>;
  error?: {
    message: string;
    type: string;
    code?: string;
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

/**
 * 재시도 시 system prompt 하단에 붙는 feedback 블록.
 * gemini.v3 의 `buildRetryFeedback`과 동일한 메시지. LLM에게 위반 사유와
 * 구체 교정 방향을 전달해 같은 실수를 반복하지 않도록 유도.
 */
const buildRetryFeedback = (previousError: string, attempt: number): string => `

---

## ⚠️ 이전 응답 검증 실패 (재시도 ${attempt}회차)

직전 응답이 품질 검증에서 다음 이유로 실패했습니다:

> ${previousError}

이번 재시도에서는 **반드시** 위 문제를 교정해서 응답하세요. 구체적으로:
- 문제가 "A보다 B 패턴 과다"라면 → 부위별 패턴 할당표를 엄격히 지켜 다른 문법 구조를 사용하세요.
- 문제가 "시간·축적 은유 과다"라면 → "시간이 갈수록", "쌓아가는", "차곡차곡", "가까워질수록", "함께할수록" 등의 표현을 제거하고 대안 은유(무게·온기·속도·빛·공간·리듬·깊이)로 교체하세요.
- 문제가 "반대 결 축 부족"이라면 → highlights에 활동성(추진력/실행력), 유머(위트/여유), 감수성(섬세함/공감), 순발력(눈치/재치), 호기심(탐구심), 표현력(전달력) 중 최소 2개를 반드시 포함하세요.
- 문제가 "과거 수렴 어휘 과다"라면 → "신중함·안정감·꾸준함·신뢰감·후반상승·성실함·차분함" 중 최대 1개만 사용하고 나머지는 새 어휘로 교체하세요.
- 문제가 "반복 어휘 과다"라면 → 해당 어휘를 대체 어휘로 교체하세요.
- 문제가 "긴 구문 반복"이라면 → 동일한 긴 구문을 여러 문장에 재사용하지 말고 각 문장을 서로 다른 어휘·구조로 작성하세요.

위 교정 사항을 반영한 JSON만 출력하세요.`;

interface CallStageOptions<T> {
  imageBase64: string;
  mimeType: string;
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  responseSchema: unknown;
  stageName: string;
  /** Stage B처럼 분량이 큰 경우 토큰 상한 증설 */
  maxOutputTokens?: number;
  validator?: (resp: T) => void;
}

const callStage = async <T>({
  imageBase64,
  mimeType,
  systemPrompt,
  userPrompt,
  schemaName,
  responseSchema,
  stageName,
  maxOutputTokens,
  validator,
}: CallStageOptions<T>): Promise<T> => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API 키가 설정되지 않았습니다.");
  }

  const model = env.OPENAI_FACE_MODEL;
  const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

  let lastError: Error | null = null;
  let previousValidationError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const systemPromptForAttempt =
      attempt > 0 && previousValidationError
        ? systemPrompt + buildRetryFeedback(previousValidationError, attempt)
        : systemPrompt;

    const request: OpenAIRequest = {
      model,
      messages: [
        { role: "system", content: systemPromptForAttempt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema: responseSchema,
        },
      },
      temperature: 0.85,
      max_completion_tokens: maxOutputTokens ?? 4096,
    };

    try {
      const response = await fetchWithTimeout(
        OPENAI_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(request),
        },
        REQUEST_TIMEOUT_MS
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAI API 요청 실패 [${stageName}] (${response.status}): ${errorText}`
        );
      }

      const data: OpenAIResponse = await response.json();

      if (data.error) {
        throw new Error(
          `OpenAI 오류 [${stageName}]: ${data.error.message} (${data.error.code ?? data.error.type})`
        );
      }

      const choice = data.choices?.[0];
      const text = choice?.message.content;

      if (!text) {
        throw new Error(`OpenAI 응답이 비어있습니다 [${stageName}].`);
      }

      if (choice?.finish_reason === "length") {
        throw new Error(
          `OpenAI 응답이 토큰 상한에 도달해 잘렸습니다 [${stageName}]. max_completion_tokens 증설 필요.`
        );
      }

      if (choice?.finish_reason === "content_filter") {
        throw new Error(
          `OpenAI 응답이 콘텐츠 필터에 의해 차단되었습니다 [${stageName}].`
        );
      }

      let parsed: T;
      try {
        parsed = JSON.parse(text) as T;
      } catch (parseError) {
        const snippet = text.slice(0, 200).replace(/\n/g, "\\n");
        throw new Error(
          `OpenAI 응답 JSON 파싱 실패 [${stageName}] (finish_reason=${choice?.finish_reason ?? "unknown"}, length=${text.length}): ${(parseError as Error).message}. 응답 앞부분: ${snippet}...`
        );
      }

      if (validator) {
        try {
          validator(parsed);
        } catch (validationError) {
          const message =
            validationError instanceof Error
              ? validationError.message
              : String(validationError);
          const isSoft = message.includes("[v3 검증 실패] Soft:");
          previousValidationError = message;
          lastError = validationError as Error;

          const retryLimit = isSoft ? MAX_SOFT_RETRIES : MAX_HARD_RETRIES;
          if (attempt < retryLimit) {
            console.warn(
              `[face-spoiler v3 openai] Stage ${stageName} validator ${isSoft ? "soft" : "hard"} 실패 (attempt ${attempt + 1}/${retryLimit + 1}): ${message}`
            );
            await sleep(500 * (attempt + 1));
            continue;
          }

          if (isSoft) {
            console.warn(
              `[face-spoiler v3 openai] Stage ${stageName} soft validator 최종 실패 — 경고만 남기고 결과 통과: ${message}`
            );
            return parsed;
          }
          throw validationError;
        }
      }

      return parsed;
    } catch (error) {
      const isValidationError =
        error instanceof Error && error.message.includes("[v3 검증 실패]");
      if (!isValidationError) {
        previousValidationError = null;
      }
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        await sleep(500 * (attempt + 1));
        continue;
      }
    }
  }

  throw (
    lastError ??
    new Error(`OpenAI v3 파이프라인 [${stageName}] 알 수 없는 오류.`)
  );
};

// ============================================================
// 메인 엔트리 — 3단계 호출 + 합성 (Gemini 구현과 동일 인터페이스)
// ============================================================

interface GenerateFaceReportV3Input {
  imageBase64: string;
  mimeType: string;
  animal: AnimalMatch;
  regionScores: RegionRawScore[];
}

/**
 * OpenAI GPT-5.4 mini로 v3 텍스트 리포트 생성 (3단계 병렬).
 * 반환 타입은 Gemini 구현과 동일 (`FaceTextReportV3`) — 호출자 변경 없이 스위칭 가능.
 */
export const generateFaceReportV3OpenAI = async ({
  imageBase64,
  mimeType,
  animal,
  regionScores,
}: GenerateFaceReportV3Input): Promise<FaceTextReportV3> => {
  // Phase 20.6: env.FACE_SPOILER_HINT_MODE에 따라 프롬프트 파생 정보 레벨 결정.
  const hintMode = env.FACE_SPOILER_HINT_MODE;

  const expectedRegionCount = regionScores.length;
  const [stageA, stageB, stageC] = await Promise.all([
    callStage<SignatureOverallResponse>({
      imageBase64,
      mimeType,
      systemPrompt: buildSignatureOverallSystemPrompt(
        animal,
        regionScores,
        hintMode
      ),
      userPrompt: SIGNATURE_OVERALL_USER_PROMPT,
      schemaName: "face_signature_overall",
      responseSchema: SIGNATURE_OVERALL_SCHEMA_STRICT,
      stageName: "signature+overall",
      maxOutputTokens: 8192,
      validator: validateSignatureOverall,
    }),
    callStage<RegionScoresResponse>({
      imageBase64,
      mimeType,
      systemPrompt: buildRegionScoresSystemPrompt(
        animal,
        regionScores,
        hintMode
      ),
      userPrompt: REGION_SCORES_USER_PROMPT,
      schemaName: "face_region_scores",
      responseSchema: REGION_SCORES_SCHEMA_STRICT,
      stageName: "regionScores",
      maxOutputTokens: 8192,
      validator: (resp) => validateRegionScores(resp, expectedRegionCount),
    }),
    callStage<InterestAreasResponse>({
      imageBase64,
      mimeType,
      systemPrompt: buildInterestAreasSystemPrompt(
        animal,
        regionScores,
        hintMode
      ),
      userPrompt: INTEREST_AREAS_USER_PROMPT,
      schemaName: "face_interest_areas",
      responseSchema: INTEREST_AREAS_SCHEMA_STRICT,
      stageName: "interestAreas+closing",
      maxOutputTokens: 8192,
      validator: validateInterestAreas,
    }),
  ]);

  return {
    signature: stageA.signature,
    overallScore: stageA.overallScore,
    regionScores: {
      regions: stageB.regions,
    },
    interestAreas: stageC.interestAreas,
    closing: stageC.closing,
  };
};
