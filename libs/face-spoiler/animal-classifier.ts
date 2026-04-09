import { env } from "@/env";

import { ANIMAL_CATALOG, ANIMAL_TYPE_LIST } from "./constants/animals";
import type { AnimalMatch, AnimalType, MatchConfidence } from "./types";

/**
 * 동물상 분류 전용 호출.
 *
 * 텍스트 리포트와 분리한 이유:
 * - 리포트 생성은 창의성(temperature 0.85)이 필요하지만, 동물상 분류는
 *   결정성·일관성이 필요하다 (temperature 0.1).
 * - 한 번에 두 작업을 시키면 모델의 주의가 분산되어 둘 다 품질이 떨어진다.
 * - 분류 전용 프롬프트는 12종 후보·부위 단서·tie-breaker만 집중 노출 →
 *   같은 모델(flash-lite)로도 분류 정확도가 유의미하게 향상된다.
 */

const FACE_GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;

const ANIMAL_ENUM: readonly AnimalType[] = ANIMAL_TYPE_LIST;
const CONFIDENCE_ENUM: readonly MatchConfidence[] = [
  "high",
  "medium",
  "low",
] as const;

const buildAnimalClassifierSystemPrompt = (): string => {
  const animalLines = ANIMAL_TYPE_LIST.map((id) => {
    const def = ANIMAL_CATALOG[id];
    const cues = def.regionCues.join(" / ");
    const keywords = def.impressionKeywords.join("·");
    return `- **${id}** (${def.label.ko}): 인상=${keywords}\n  부위 단서=${cues}`;
  }).join("\n");

  const tieBreakerLines = ANIMAL_TYPE_LIST.flatMap((id) => {
    const def = ANIMAL_CATALOG[id];
    return def.tieBreakers.map((tb) => {
      return `- ${id} vs ${tb.vs}: ${tb.decisiveCue}`;
    });
  }).join("\n");

  return `당신은 한국 대중문화에서 통용되는 **동물상 분류 전문가**입니다. 사진 한 장을 보고 12종 중 가장 부합하는 **단 1종**을 결정합니다. 텍스트 리포트는 작성하지 않습니다.

## 🚨 절대 규칙
1. 12종 enum 중 정확히 **1종**만 선택. 복수 후보 금지.
2. 인종·민족·국적·외모 등급과 어떤 방식으로도 연관 짓지 말 것. "이국적", "야생적", "서양적" 같은 인종 연상 어휘 금지.
3. 미추 평가 금지. "예쁘다·잘생겼다·귀엽다·매력적이다" 금지.
4. 나이·성별·체형·건강 추론 금지.
5. 동물 자체의 **습성·이미지·분위기**로만 사고.
6. 사진에서 보이지 않는 부위로 추론 금지. 보이는 것만 사용.

## 12종 후보
${animalLines}

## 분류 절차 (반드시 이 순서로 사고)
1. **관찰**: 사진에서 다음 8개 부위를 객관적으로 관찰한다.
   - 얼굴형(둥근/각진/긴/하관 좁은/계란형)
   - 눈(크기/모양/눈꼬리 방향/눈빛)
   - 눈썹(진하기/모양/길이)
   - 코(길이/콧대/코끝/콧방울)
   - 입·입꼬리(크기/두께/방향)
   - 턱(각진/둥근/뾰족/길이)
   - 광대(또렷/평평)
   - 인상의 전체 톤(부드러움/날카로움/단단함/우아함)
2. **점수 매김**: 12종 각각에 대해, 위 관찰 결과가 그 동물의 "부위 단서"와 몇 개나 일치하는지 머릿속으로 센다. 0~8점 척도.
3. **최고점 선택**: 가장 높은 점수의 1종을 primary로 확정. 2위와 점수가 비슷하면 아래 tie-breaker를 적용한다.
4. **confidence 산정**:
   - **high**: 1위가 5점 이상이고 2위와 2점 이상 차이
   - **medium**: 1위가 3~4점이거나, 1위와 2위 차이가 1점 이하
   - **low**: 1위가 2점 이하 (그래도 1종을 강제 선택)

## 혼동 쌍 tie-breaker (정확 판별 기준)
${tieBreakerLines}

## 출력
JSON으로만 응답. 추가 텍스트·마크다운·코드블록 금지.

\`\`\`json
{
  "primary": "<12종 enum 중 1개>",
  "confidence": "<high|medium|low>",
  "matchedRegions": ["<일상 표현 부위 1>", "<부위 2>", ...],
  "rationale": "<120~180자 단일 문단. 왜 이 동물상인지 관찰된 2~3개 부위 조합을 명시적으로 언급. 한자 금지, 인종 연상 어휘 금지, 미추 평가 금지.>"
}
\`\`\`

matchedRegions는 2~4개. primary 매칭의 결정적 근거가 된 부위를 일상 표현으로(예: ["둥근 얼굴", "올라간 입꼬리", "둥근 코끝"]).`;
};

const ANIMAL_CLASSIFIER_USER_PROMPT = `사진을 보고 위 절차를 따라 단 1종의 동물상을 분류하세요. JSON만 출력하세요.`;

const ANIMAL_CLASSIFIER_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    primary: { type: "string", enum: ANIMAL_ENUM },
    confidence: { type: "string", enum: CONFIDENCE_ENUM },
    matchedRegions: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    rationale: { type: "string" },
  },
  required: ["primary", "confidence", "matchedRegions", "rationale"],
} as const;

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
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

export const classifyAnimalType = async (
  imageBase64: string,
  mimeType: string
): Promise<AnimalMatch> => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API 키가 설정되지 않았습니다.");
  }

  const systemPrompt = buildAnimalClassifierSystemPrompt();
  const parts: GeminiPart[] = [
    { text: ANIMAL_CLASSIFIER_USER_PROMPT },
    { inlineData: { mimeType, data: imageBase64 } },
  ];

  const request = {
    contents: [{ role: "user" as const, parts }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ANIMAL_CLASSIFIER_RESPONSE_SCHEMA,
      // 분류 정확도·일관성을 위해 낮은 temperature
      temperature: 0.1,
      maxOutputTokens: 1024,
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
          `Gemini 동물상 분류 실패 (${response.status}): ${errorText}`
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
        throw new Error("Gemini 동물상 분류 응답이 비어있습니다.");
      }

      return JSON.parse(text) as AnimalMatch;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        await sleep(800 * (attempt + 1));
        continue;
      }
    }
  }

  throw (
    lastError ?? new Error("동물상 분류에 알 수 없는 오류가 발생했습니다.")
  );
};
