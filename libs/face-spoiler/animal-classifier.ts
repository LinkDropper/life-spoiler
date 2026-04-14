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
    const must = def.mustCues.map((c, i) => `  [필수${i + 1}] ${c}`).join("\n");
    const supporting = def.supportingCues
      .map((c) => `  [보조] ${c}`)
      .join("\n");
    const never = def.neverCues.map((c) => `  [배타] ${c}`).join("\n");
    const keywords = def.impressionKeywords.join("·");
    return `### ${id} (${def.label.ko}) — 인상: ${keywords}
${must}
${supporting}
${never}`;
  }).join("\n\n");

  const tieBreakerLines = ANIMAL_TYPE_LIST.flatMap((id) => {
    const def = ANIMAL_CATALOG[id];
    return def.tieBreakers.map((tb) => {
      return `- **${id} vs ${tb.vs}**: ${tb.decisiveCue}`;
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

## 🚫 편향 금지 (매우 중요)
- **어떤 특정 동물상을 기본값으로 사용하지 마세요.** 애매하다고 강아지상이나 고양이상을 선택하면 안 됩니다.
- 모든 동물상은 동등한 확률로 시작합니다. 어떤 동물상이 더 "안전한 선택"이라는 생각을 버리세요.
- 반드시 [필수] 단서가 2개 이상 충족되는 동물상만 후보로 올리세요.
- [배타] 단서에 해당하면 그 동물상은 즉시 탈락시키세요.

## 👁️ 눈 가로세로 비율(eyeAspectRatio) 기준표
- **< 2.0**: 원안 (크고 둥근 눈) → 사슴상, 토끼상, 판다상, 너구리상 후보
- **2.0 ~ 3.0**: 보통 눈 → 강아지상, 곰상, 호랑이상, 사자상, 늑대상 후보 (대부분의 사람이 여기 해당)
- **> 3.0**: 세장안 (좁고 긴 눈) → 고양이상, 여우상 후보
- ⚠️ 보통 눈(2.0~3.0)인데 고양이상으로 분류하면 **오류**입니다. 반드시 세장안(>3.0)이어야 고양이상.

## 12종 후보 (필수/보조/배타 단서 포함)

${animalLines}

## 📊 측정 데이터 활용 원칙 (매우 중요)
유저 메시지에 [얼굴 측정 데이터]가 포함되어 있으면, 해당 수치를 **1순위 근거**로 사용하세요.
- 수치가 명시된 기준(예: eyeCornerAngle > 8°)이 있으면 그대로 대조
- 수치와 시각 관찰이 충돌하면 **수치를 우선** (측정이 감보다 정확)
- 수치가 없는 항목만 시각 관찰로 보완

## 분류 절차 (반드시 이 순서로 사고)

### 1단계: 관찰 (사실만 기록)
사진에서 다음 8개 부위를 **객관적으로** 관찰한다. 아직 동물상을 떠올리지 마세요.
측정 데이터가 제공되었으면 해당 수치를 함께 참조한다.
- 얼굴형 (둥근/각진/세로로 긴/가로로 넓은/갸름한) ← faceRatio, jawWidthRatio
- 눈 (크기·모양·눈꼬리 방향) ← eyeAspectRatio, eyeCornerAngle, eyeSizeRatio
- 눈썹 (진하기·모양·길이)
- 코 (길이·콧대 높이·코끝·콧방울) ← noseLengthRatio
- 입·입꼬리 (크기·두께·방향)
- 턱 (각진/둥근/뾰족/길이)
- 광대 (또렷/평평, 옆돌출 정도)
- 인상의 전체 톤 (부드러움/날카로움/단단함/우아함/차가움/따뜻함)

### 2단계: 배타 단서로 탈락시키기
12종 각각의 [배타] 단서를 확인한다. 해당되는 동물상은 후보에서 제외한다.

### 3단계: 필수 단서로 후보 좁히기
남은 후보 중에서 [필수] 단서가 **2개 모두 충족**되는 동물상만 최종 후보로 남긴다.
필수 단서가 1개 이하만 충족되면 그 동물상은 후보에서 제외한다.

### 4단계: 보조 단서로 점수 매기기
최종 후보들에 대해 [보조] 단서 매칭 개수를 센다. 가장 많이 매칭된 1종을 primary로 확정.

### 5단계: tie-breaker 적용
4단계에서 2종이 동점이면 아래 tie-breaker를 적용하여 1종을 확정한다.

## 혼동 쌍 tie-breaker (정확 판별 기준)
${tieBreakerLines}

### 6단계: confidence 산정
- **high**: 필수 단서 2개 + 보조 단서 2개 이상 매칭, 2위와 보조 점수 2점 이상 차이
- **medium**: 필수 단서 2개 + 보조 단서 1개 매칭, 또는 1위와 2위 차이가 1점 이하
- **low**: 필수 단서 2개만 겨우 충족, 보조 단서 매칭 0개 (그래도 1종을 강제 선택)

## 출력
JSON으로만 응답. 추가 텍스트·마크다운·코드블록 금지.

\`\`\`json
{
  "primary": "<12종 enum 중 1개>",
  "confidence": "<high|medium|low>",
  "matchedRegions": ["<일상 표현 부위 1>", "<부위 2>", ...],
  "rationale": "<120~180자 단일 문단. 왜 이 동물상인지 관찰된 2~3개 부위 조합을 일상 언어로 설명.>"
}
\`\`\`

## 🚨 rationale·matchedRegions 작성 규칙 (매우 중요)

**이 필드는 일반 사용자에게 그대로 노출됩니다.** 내부 분석 용어가 새어나가면 실패입니다.

### 금지 사항
1. **숫자·측정 수치 절대 금지**: "4.27", "6.38°", "> 3.0", "%" 같은 수치 일체. 각도(°)도 금지.
2. **내부 변수명 금지**: \`eyeAspectRatio\`, \`eyeCornerAngle\`, \`faceRatio\`, \`jawWidthRatio\`, \`eyeSizeRatio\`, \`noseLengthRatio\` 등 코드 식별자 일체 금지.
3. **분류 체계 용어 금지**: "필수 조건", "필수 단서", "보조 단서", "배타 단서", "tie-breaker", "후보 1", "2개 충족", "enum" 등 프롬프트 내부 용어 금지.
4. **관상학 전문/해부 용어 금지**: "세장안", "원안", "단봉안", "와잠", "산근", "준두", "법령", "인중" 같은 전문어 및 한자어 금지.
5. **도형·수학 표현 금지**: "비율 X:Y", "각도 N도", "좌표", "랜드마크" 등 금지.

### 대체 일상 표현 (이것만 사용)
- "세장안" → "좁고 길게 찢어진 눈" 또는 "가로로 긴 눈"
- "원안" → "크고 둥근 눈"
- "눈꼬리 각도가 8° 이상 올라감" → "눈꼬리가 또렷하게 올라간 편"
- "faceRatio 0.89" → "세로로 살짝 긴 얼굴형" 같은 일상 묘사
- "필수 조건 2개 충족" → 표현 자체를 쓰지 말고, 관찰된 부위 조합을 직접 서술

### 좋은 예 vs 나쁜 예
❌ 나쁨: "눈 가로세로 비율 4.27로 세장안이며 눈꼬리 각도 6.38°로 올라가 고양이상의 필수 조건 1, 2를 충족하고, 얼굴형이 갸름하여 고양이상으로 분류된다."
✅ 좋음: "좁고 길게 찢어진 눈매에 눈꼬리가 살짝 올라가 있고, 갸름한 얼굴선이 더해지며 고양이 특유의 시크하고 도도한 분위기가 자연스럽게 드러나요."

❌ 나쁨: matchedRegions = ["eyeAspectRatio 4.27", "jawWidthRatio 0.65"]
✅ 좋음: matchedRegions = ["가로로 긴 눈매", "살짝 올라간 눈꼬리", "갸름한 턱선"]

### 문체 규칙
- 존댓말 ("~요", "~이에요", "~습니다")
- 관찰된 2~3개 부위를 일상 표현으로 묶어 한 문단으로 서술
- **"~해서 ~상으로 분류된다" 같은 판정문 대신 "~분위기가 드러나요" 같은 묘사형** 사용

matchedRegions는 2~4개. primary 매칭의 결정적 근거가 된 부위를 일상 표현으로(예: ["둥근 얼굴", "올라간 입꼬리", "둥근 코끝"]).`;
};

const ANIMAL_CLASSIFIER_USER_PROMPT = `사진을 보고 위 절차를 따라 단 1종의 동물상을 분류하세요. JSON만 출력하세요.

⚠️ 다시 한 번 강조: 강아지상을 기본값으로 사용하지 마세요. 반드시 [필수] 단서 2개가 모두 충족되는 동물상만 선택하세요. [배타] 단서에 해당하면 즉시 탈락시키세요.

⚠️ rationale·matchedRegions에 **숫자 수치**("4.27", "6.38°"), **코드 변수명**(eyeAspectRatio 등), **분류 체계 용어**("필수 조건", "보조 단서" 등), **한자어 관상 용어**("세장안", "원안" 등)를 절대 쓰지 마세요. 일반 사용자에게 그대로 노출되는 필드입니다.`;

/** rationale/matchedRegions에 섞이면 안 되는 패턴. 위반 시 재시도 트리거. */
const BANNED_OUTPUT_PATTERNS: readonly RegExp[] = [
  /세장안|원안|단봉안|와잠|산근|준두|법령|관골|천창|지각/,
  /eyeAspectRatio|eyeCornerAngle|faceRatio|jawWidthRatio|eyeSizeRatio|noseLengthRatio/i,
  /필수\s*조건|보조\s*단서|배타\s*단서|tie[\s-]?breaker/,
  /\d+\.\d+\s*°?/,
];

const violatesBannedPatterns = (match: AnimalMatch): boolean => {
  const haystacks = [match.rationale, ...match.matchedRegions];
  return haystacks.some((text) =>
    BANNED_OUTPUT_PATTERNS.some((pattern) => pattern.test(text))
  );
};

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
  mimeType: string,
  faceShapeHint?: string
): Promise<AnimalMatch> => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API 키가 설정되지 않았습니다.");
  }

  const systemPrompt = buildAnimalClassifierSystemPrompt();
  const userPromptText = faceShapeHint
    ? `${ANIMAL_CLASSIFIER_USER_PROMPT}\n\n${faceShapeHint}`
    : ANIMAL_CLASSIFIER_USER_PROMPT;
  const parts: GeminiPart[] = [
    { text: userPromptText },
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

      const parsed = JSON.parse(text) as AnimalMatch;

      // 금지 패턴(수치·내부 변수명·한자 관상용어) 위반 시 재시도.
      // 프롬프트만으로는 저온도 모델도 드물게 새어나올 수 있어 방어층으로 추가.
      if (violatesBannedPatterns(parsed) && attempt < MAX_RETRIES) {
        lastError = new Error(
          "rationale·matchedRegions에 금지 패턴이 포함되어 재시도합니다."
        );
        await sleep(400 * (attempt + 1));
        continue;
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

  throw lastError ?? new Error("동물상 분류에 알 수 없는 오류가 발생했습니다.");
};
