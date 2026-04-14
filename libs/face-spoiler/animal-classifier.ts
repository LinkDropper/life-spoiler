import { env } from "@/env";

import { scoreAnimals } from "./animal-scorer";
import { ANIMAL_CATALOG, ANIMAL_TYPE_LIST } from "./constants/animals";
import type { FaceMetrics } from "./face-shape-analyzer";
import type { AnimalMatch, AnimalType } from "./types";

/**
 * 동물상 분류 + 설명 작성.
 *
 * **분류 아키텍처 (2026-04 리팩토링)**
 * - 분류는 `scoreAnimals()` (코드 결정적)가 담당. 같은 metrics에 대해 항상 동일 결과.
 * - LLM(Gemini)은 분류된 primary를 입력으로 받아 `rationale` + `matchedRegions`만 작성.
 * - 기존 LLM 분류기는 한국인 얼굴에 대해 대부분 고양이상으로 회귀하는 편향이 있어 폐기.
 *
 * **레거시 호환**
 * - `faceMetrics`가 없으면(레거시 호출 경로) 더 이상 분류할 수 없으므로 에러를 던진다.
 *   현재 파이프라인은 항상 metrics를 전달한다.
 */

const FACE_GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;

interface RationaleResult {
  rationale: string;
  matchedRegions: string[];
}

const RATIONALE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    rationale: { type: "string" },
    matchedRegions: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
  },
  required: ["rationale", "matchedRegions"],
} as const;

/** rationale/matchedRegions에 섞이면 안 되는 패턴. 위반 시 재시도 트리거. */
const BANNED_OUTPUT_PATTERNS: readonly RegExp[] = [
  /세장안|원안|단봉안|와잠|산근|준두|법령|관골|천창|지각|인중/,
  /eyeAspectRatio|eyeCornerAngle|faceRatio|jawWidthRatio|eyeSizeRatio|noseLengthRatio/i,
  /필수\s*조건|보조\s*단서|배타\s*단서|tie[\s-]?breaker/,
  /\d+\.\d+|\d+\s*[°%]|[<>]\s*\d/,
];

const violatesBannedPatterns = (result: RationaleResult): boolean => {
  const haystacks = [result.rationale, ...result.matchedRegions];
  return haystacks.some((text) =>
    BANNED_OUTPUT_PATTERNS.some((pattern) => pattern.test(text))
  );
};

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

/**
 * 분류는 끝났다는 전제 하에, primary 동물상에 대한 일상 언어 설명을 LLM에게 받는다.
 *
 * 프롬프트 핵심:
 * - 분류 재판정 금지. primary는 고정.
 * - 측정 수치·내부 변수명·한자 관상용어·분류 체계 용어 일체 금지.
 * - 존댓말 묘사형 한 문단 + 일상 표현 부위 2~4개.
 */
const buildRationaleSystemPrompt = (
  primary: AnimalType,
  faceShapeHint?: string
): string => {
  const def = ANIMAL_CATALOG[primary];
  const keywords = def.impressionKeywords.join("·");
  const cuesContext = [
    ...def.mustCues.map((c) => `- ${c}`),
    ...def.supportingCues.map((c) => `- ${c}`),
  ].join("\n");

  return `당신은 한국 대중문화의 동물상 해설자입니다. 분류는 이미 끝났습니다. 당신의 역할은 **일반 사용자에게 노출될 설명문**을 작성하는 것입니다.

## 확정된 분류
- primary: **${primary}** (${def.label.ko})
- 인상 키워드: ${keywords}

위 분류는 코드 결정적 분류기가 측정값 기반으로 산정한 결과입니다. **다시 판정하지 마세요.** 다른 동물상을 추천하거나 분류를 흔들지 마세요. 오직 위 동물상에 대한 설명만 작성합니다.

## 참고 — ${def.label.ko}의 전형 특징
${cuesContext}

${faceShapeHint ? `## 측정 데이터 (참고용)\n${faceShapeHint}\n` : ""}
## 출력
JSON으로만 응답. 추가 텍스트·마크다운·코드블록 금지.

\`\`\`json
{
  "rationale": "<120~180자 단일 문단 한국어 존댓말. 사진에서 관찰되는 부위 2~3개를 일상 표현으로 묶어 ${def.label.ko} 분위기가 어떻게 드러나는지 묘사.>",
  "matchedRegions": ["<일상 표현 부위 1>", "<부위 2>", ...]
}
\`\`\`

## 🚨 절대 금지 (위반 시 재시도)
1. **숫자·측정 수치 절대 금지**: "4.27", "6.38°", "> 3.0", "%" 같은 수치. 각도(°)도 금지.
2. **내부 변수명 금지**: \`eyeAspectRatio\`, \`eyeCornerAngle\`, \`faceRatio\`, \`jawWidthRatio\`, \`eyeSizeRatio\`, \`noseLengthRatio\` 등 코드 식별자.
3. **분류 체계 용어 금지**: "필수 조건", "필수 단서", "보조 단서", "배타 단서", "tie-breaker", "후보", "enum", "primary".
4. **관상학 전문/해부 용어 금지**: "세장안", "원안", "단봉안", "와잠", "산근", "준두", "법령", "관골", "인중" 등 한자어.
5. **도형·수학 표현 금지**: "비율 X:Y", "각도 N도", "좌표", "랜드마크".
6. **인종·미추 평가 금지**: "이국적", "예쁘다", "잘생겼다" 등.

## 대체 일상 표현
- "세장안" → "좁고 길게 찢어진 눈", "가로로 긴 눈"
- "원안" → "크고 둥근 눈"
- "올라간 눈꼬리" / "처진 눈꼬리" / "수평한 눈꼬리"
- "둥근 턱선" / "각진 턱선" / "갸름한 얼굴선" / "세로로 긴 얼굴형"

## 문체
- 존댓말 ("~요", "~이에요", "~습니다")
- 묘사형 문장으로 마무리. "~로 분류된다" 같은 판정문 금지.
- matchedRegions는 2~4개. 결정적 근거가 된 부위를 일상 표현으로 (예: ["둥근 얼굴", "올라간 입꼬리", "둥근 코끝"]).`;
};

const RATIONALE_USER_PROMPT = `사진을 참고하여 위 시스템 프롬프트의 규칙대로 JSON만 출력하세요.

⚠️ 분류는 이미 결정됐습니다. 다른 동물상을 추천하지 마세요.
⚠️ 숫자, 코드 변수명, 한자 관상 용어, 분류 체계 용어를 절대 쓰지 마세요. 일반 사용자에게 그대로 노출됩니다.`;

const generateRationale = async (
  imageBase64: string,
  mimeType: string,
  primary: AnimalType,
  faceShapeHint: string | undefined
): Promise<RationaleResult> => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API 키가 설정되지 않았습니다.");
  }

  const systemPrompt = buildRationaleSystemPrompt(primary, faceShapeHint);
  const parts: GeminiPart[] = [
    { text: RATIONALE_USER_PROMPT },
    { inlineData: { mimeType, data: imageBase64 } },
  ];

  const request = {
    contents: [{ role: "user" as const, parts }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RATIONALE_RESPONSE_SCHEMA,
      // 설명은 자연스러움이 필요하지만 분류는 끝났으므로 너무 풀지 않음
      temperature: 0.5,
      maxOutputTokens: 768,
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
          `Gemini 동물상 설명 생성 실패 (${response.status}): ${errorText}`
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
        throw new Error("Gemini 동물상 설명 응답이 비어있습니다.");
      }

      const parsed = JSON.parse(text) as RationaleResult;

      if (violatesBannedPatterns(parsed)) {
        if (attempt < MAX_RETRIES) {
          lastError = new Error(
            "rationale·matchedRegions에 금지 패턴이 포함되어 재시도합니다."
          );
          await sleep(400 * (attempt + 1));
          continue;
        }
        throw new Error(
          "동물상 설명 결과에 금지 패턴이 반복적으로 포함되어 생성에 실패했습니다."
        );
      }

      return parsed;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        await sleep(800 * (attempt + 1));
        continue;
      }
    }
  }

  throw (
    lastError ?? new Error("동물상 설명 생성에 알 수 없는 오류가 발생했습니다.")
  );
};

/**
 * 동물상 분류 + 설명 합성.
 *
 * @param imageBase64 - 사진 base64 (LLM 설명용)
 * @param mimeType    - 이미지 MIME
 * @param faceShapeHint - LLM 설명용 측정 힌트 문자열 (있으면 컨텍스트로 주입)
 * @param faceMetrics - **분류용 측정값 객체** (없으면 에러)
 */
export const classifyAnimalType = async (
  imageBase64: string,
  mimeType: string,
  faceShapeHint?: string,
  faceMetrics?: FaceMetrics
): Promise<AnimalMatch> => {
  if (!faceMetrics) {
    throw new Error(
      "동물상 분류에 필요한 얼굴 측정값(faceMetrics)이 누락되었습니다. 클라이언트가 측정값을 전달하는지 확인하세요."
    );
  }

  // 1단계: 코드 결정적 분류
  const scoring = scoreAnimals(faceMetrics);
  const { primary, confidence } = scoring;

  // 2단계: LLM에 설명만 요청
  const { rationale, matchedRegions } = await generateRationale(
    imageBase64,
    mimeType,
    primary,
    faceShapeHint
  );

  const match: AnimalMatch = { primary, confidence, rationale, matchedRegions };

  return match;
};

// ANIMAL_TYPE_LIST는 다른 모듈(텍스트 리포트 프롬프트 등)에서 enum 검증에 사용될 수 있어 재export.
export { ANIMAL_TYPE_LIST };
