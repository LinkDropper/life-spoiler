import type { Locale } from "@/i18n/config";

import { AIError } from "./errors";
import { koCompatibilityPrompts } from "./prompts/compatibility-ko";
import type {
  CompatibilityCategoryResponse,
  CompatibilityInsightsResponse,
  CompatibilityInterpretationRequest,
  CompatibilityInterpretationType,
  CompatibilityOverviewResponse,
  CompatibilityScenariosResponse,
  GeminiResponseSchema,
  PalaceData,
} from "./types";
import {
  CompatibilityCategoryResponseSchema,
  CompatibilityInsightsResponseSchema,
  CompatibilityOverviewResponseSchema,
  CompatibilityScenariosResponseSchema,
} from "./types";
import { chatCompletion, parseJsonResponse, GEMINI_MODEL_NAME } from "./gemini";
import type { CompatibilityResult } from "@/libs/hooks/compatibility/types";

// ============================================================
// Gemini responseSchema 정의 (궁합)
// ============================================================

const INSIGHT_ITEM_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    label: { type: "string" },
    headline: { type: "string" },
    content: { type: "string" },
  },
  required: ["score", "label", "headline", "content"],
};

const COMPATIBILITY_OVERVIEW_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    spoiler: { type: "string" },
    profileASummary: { type: "string" },
    profileBSummary: { type: "string" },
  },
  required: [
    "headline",
    "tags",
    "spoiler",
    "profileASummary",
    "profileBSummary",
  ],
};

const COMPATIBILITY_INSIGHTS_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    overall: INSIGHT_ITEM_SCHEMA,
    zodiac: INSIGHT_ITEM_SCHEMA,
    fiveElement: INSIGHT_ITEM_SCHEMA,
    chemistry: INSIGHT_ITEM_SCHEMA,
    communication: INSIGHT_ITEM_SCHEMA,
    growthSynergy: INSIGHT_ITEM_SCHEMA,
    trustIndex: INSIGHT_ITEM_SCHEMA,
    crisisResilience: INSIGHT_ITEM_SCHEMA,
  },
  required: [
    "overall",
    "zodiac",
    "fiveElement",
    "chemistry",
    "communication",
    "growthSynergy",
    "trustIndex",
    "crisisResilience",
  ],
};

const COMPATIBILITY_SCENARIOS_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    coreScenarios: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["title", "content"],
      },
    },
    advice: { type: "string" },
  },
  required: ["coreScenarios", "advice"],
};

const COMPATIBILITY_CATEGORY_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    content: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["headline", "content", "tags"],
};

const COMPATIBILITY_RESPONSE_SCHEMA_MAP: Record<
  CompatibilityInterpretationType,
  GeminiResponseSchema
> = {
  compatibility_overview: COMPATIBILITY_OVERVIEW_SCHEMA,
  compatibility_insights: COMPATIBILITY_INSIGHTS_SCHEMA,
  compatibility_core_scenarios: COMPATIBILITY_SCENARIOS_SCHEMA,
  compatibility_communication: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_growth: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_emotion: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_crisis: COMPATIBILITY_CATEGORY_SCHEMA,
};

// ============================================================
// 프롬프트 가져오기
// ============================================================

const getCompatibilityPrompts = (_language?: Locale) => {
  // 현재 한국어만 지원
  return koCompatibilityPrompts;
};

// ============================================================
// 카테고리별 궁 매핑
// ============================================================

/** 기본 궁 (모든 호출에 포함) */
const BASE_PALACES = ["명궁", "부처궁"];

/** 카테고리별 추가 궁 */
const CATEGORY_PALACE_MAPPING: Partial<
  Record<CompatibilityInterpretationType, string[]>
> = {
  compatibility_communication: ["교우궁", "형제궁", "부모궁", "자녀궁"],
  compatibility_growth: ["재백궁", "관록궁", "전택궁", "복덕궁"],
  compatibility_emotion: ["복덕궁", "부모궁", "자녀궁"],
  compatibility_crisis: ["질액궁", "천이궁", "복덕궁", "관록궁"],
};

/** 광범위 분석용 (overview, insights, scenarios) — 12궁 전체 */
const BROAD_PALACES = [
  "명궁",
  "형제궁",
  "부처궁",
  "자녀궁",
  "재백궁",
  "질액궁",
  "천이궁",
  "교우궁",
  "관록궁",
  "전택궁",
  "복덕궁",
  "부모궁",
];

// ============================================================
// 데이터 포맷팅
// ============================================================

const formatPalaceData = (palace: PalaceData): string => {
  const mainStarsStr = palace.mainStars
    .map((star) => {
      let str = `${star.name} (${star.brightness})`;
      if (star.sihua) {
        str += ` [${star.sihua}]`;
      }
      return str;
    })
    .join(", ");

  const minorStarsStr =
    palace.minorStars.length > 0 ? palace.minorStars.join(", ") : "None";

  const branchLabel = palace.isShenGong
    ? `${palace.branch} [신궁]`
    : palace.branch;

  return `- Branch: ${branchLabel}
- Main Stars: ${mainStarsStr || "None"}
- Minor Stars: ${minorStarsStr}`;
};

const formatCompatibilityDataForAI = (
  request: CompatibilityInterpretationRequest
): string => {
  const {
    profileA,
    profileB,
    chartA,
    chartB,
    palacesA,
    palacesB,
    relationshipType,
    zodiacCompatibility,
    fiveElementCompatibility,
    previousContext,
  } = request;

  // 카테고리별 궁 결정
  const categoryPalaces = CATEGORY_PALACE_MAPPING[request.requestType];
  const palaceNames = categoryPalaces
    ? [...new Set([...BASE_PALACES, ...categoryPalaces])]
    : BROAD_PALACES;

  let dataStr = `## Profile A (${profileA.name}) Info
- name: ${profileA.name}
- gender: ${profileA.gender === "male" ? "남성" : "여성"}
- lunarBirthInfo: ${profileA.lunarBirthInfo}

## Profile A (${profileA.name}) Chart
- wuxingJu: ${chartA.wuxingJu}
- mingGongPosition: ${chartA.mingGongPosition}
- shenGongPosition: ${chartA.shenGongPosition}
- hualu: ${chartA.sihua.hualu.star} (${chartA.sihua.hualu.palace})
- huaquan: ${chartA.sihua.huaquan.star} (${chartA.sihua.huaquan.palace})
- huake: ${chartA.sihua.huake.star} (${chartA.sihua.huake.palace})
- huaji: ${chartA.sihua.huaji.star} (${chartA.sihua.huaji.palace})`;

  // Profile A 궁 데이터 (카테고리에 따라 동적 선택)
  for (const palaceName of palaceNames) {
    const palace = palacesA[palaceName];
    if (palace) {
      dataStr += `\n\n### Profile A (${profileA.name}) ${palaceName}\n${formatPalaceData(palace)}`;
    }
  }

  dataStr += `\n\n## Profile B (${profileB.name}) Info
- name: ${profileB.name}
- gender: ${profileB.gender === "male" ? "남성" : "여성"}
- lunarBirthInfo: ${profileB.lunarBirthInfo}

## Profile B (${profileB.name}) Chart
- wuxingJu: ${chartB.wuxingJu}
- mingGongPosition: ${chartB.mingGongPosition}
- shenGongPosition: ${chartB.shenGongPosition}
- hualu: ${chartB.sihua.hualu.star} (${chartB.sihua.hualu.palace})
- huaquan: ${chartB.sihua.huaquan.star} (${chartB.sihua.huaquan.palace})
- huake: ${chartB.sihua.huake.star} (${chartB.sihua.huake.palace})
- huaji: ${chartB.sihua.huaji.star} (${chartB.sihua.huaji.palace})`;

  // Profile B 궁 데이터 (카테고리에 따라 동적 선택)
  for (const palaceName of palaceNames) {
    const palace = palacesB[palaceName];
    if (palace) {
      dataStr += `\n\n### Profile B (${profileB.name}) ${palaceName}\n${formatPalaceData(palace)}`;
    }
  }

  dataStr += `\n\n## Zodiac Compatibility
${zodiacCompatibility}

## Five Element Compatibility
${fiveElementCompatibility}

## Relationship Type
${relationshipType}`;

  if (request.huajiCrossAnalysis) {
    const h = request.huajiCrossAnalysis;
    dataStr += `\n\n## Huaji Cross Analysis (화기 교차 분석)
- A의 화기(긴장) 위치: ${h.huajiPalaceA} → B에게 영향: ${h.aHuajiAffectsBPalaces.length > 0 ? h.aHuajiAffectsBPalaces.join(", ") : "없음"}
- B의 화기(긴장) 위치: ${h.huajiPalaceB} → A에게 영향: ${h.bHuajiAffectsAPalaces.length > 0 ? h.bHuajiAffectsAPalaces.join(", ") : "없음"}
- 양쪽 화기 같은 영역: ${h.bothHuajiSameArea ? "예" : "아니오"}`;
  }

  if (request.scoreRange) {
    dataStr += `\n\n## Score Range
궁합 점수(overall.score)는 반드시 ${request.scoreRange.min}~${request.scoreRange.max} 범위 안에서 결정하세요.`;
  }

  if (previousContext) {
    dataStr += `\n\n${previousContext}`;
  }

  dataStr += `\n\n## ⚠️ 최종 점검
출력에 궁 이름(명궁, 부처궁 등), 별 이름(자미, 천기 등), 사화 용어(화록, 화기 등)가 포함되면 실패입니다. 반드시 일상적 표현으로 대체하세요.`;

  return dataStr;
};

// ============================================================
// 단일 해석 요청
// ============================================================

const requestCompatibilityInterpretation = async <T>(
  request: CompatibilityInterpretationRequest,
  schema: { parse: (data: unknown) => T },
  options?: { maxTokens?: number }
): Promise<T> => {
  const prompts = getCompatibilityPrompts(request.language);
  const chartData = formatCompatibilityDataForAI(request);
  const userPrompt = prompts.userPrompts[request.requestType];

  const fullUserPrompt = `${chartData}

---

${userPrompt}`;

  const responseSchema = COMPATIBILITY_RESPONSE_SCHEMA_MAP[request.requestType];

  const response = await chatCompletion(
    [
      { role: "system", content: prompts.systemPrompt },
      { role: "user", content: fullUserPrompt },
    ],
    {
      responseSchema,
      ...(options?.maxTokens && { maxTokens: options.maxTokens }),
    }
  );

  const parsed = parseJsonResponse<unknown>(response);

  try {
    return schema.parse(parsed);
  } catch (error) {
    throw new AIError("AI 응답이 예상된 형식과 다릅니다.", {
      code: "RESPONSE_PARSE_FAILED",
      originalError: error as Error,
      requestType: request.requestType,
    });
  }
};

// ============================================================
// 개별 해석 함수
// ============================================================

// 큰 응답이 필요한 호출의 maxTokens (기본 6000으로는 부족)
// - overview: spoiler 600-700자 → ~1,500 토큰
// - insights: 8항목 × 350자 → ~6,000+ 토큰
// - scenarios: 3×650자 + advice 650자 → ~5,500+ 토큰
const LARGE_RESPONSE_MAX_TOKENS = 10000;

export const interpretCompatibilityOverview = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityOverviewResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_overview" },
    CompatibilityOverviewResponseSchema,
    { maxTokens: LARGE_RESPONSE_MAX_TOKENS }
  );
};

export const interpretCompatibilityInsights = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityInsightsResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_insights" },
    CompatibilityInsightsResponseSchema,
    { maxTokens: LARGE_RESPONSE_MAX_TOKENS }
  );
};

export const interpretCompatibilityCoreScenarios = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityScenariosResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_core_scenarios" },
    CompatibilityScenariosResponseSchema,
    { maxTokens: LARGE_RESPONSE_MAX_TOKENS }
  );
};

export const interpretCompatibilityCommunication = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoryResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_communication" },
    CompatibilityCategoryResponseSchema
  );
};

export const interpretCompatibilityGrowth = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoryResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_growth" },
    CompatibilityCategoryResponseSchema
  );
};

export const interpretCompatibilityEmotion = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoryResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_emotion" },
    CompatibilityCategoryResponseSchema
  );
};

export const interpretCompatibilityCrisis = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoryResponse> => {
  return requestCompatibilityInterpretation(
    { ...request, requestType: "compatibility_crisis" },
    CompatibilityCategoryResponseSchema
  );
};

// ============================================================
// 전체 해석 오케스트레이션 (3단계 병렬)
// ============================================================

export const generateCompatibilityInterpretation = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityResult> => {
  // Stage 1a: overview 먼저
  const overview = await interpretCompatibilityOverview(request);

  // 성격 앵커: A/B 성격 일관성 유지 (참고용, 내용을 지배하지 않도록 간결하게)
  const personalityAnchor = `## 참고: A/B 성격 설정
- ${request.profileA.name}: ${overview.profileASummary}
- ${request.profileB.name}: ${overview.profileBSummary}
(이 설정과 모순되지 않게 쓰되, 이 섹션 고유의 주제에 집중하세요. 성격 소개를 반복하지 마세요.)`;

  // Stage 1b: overview context를 insights에 전달
  const overviewContext = `${personalityAnchor}

## 이미 생성된 궁합 오버뷰 (중복 금지!)
- headline: "${overview.headline}"
- tags: ${overview.tags.map((t) => `"${t}"`).join(", ")}
- spoiler 요약: "${overview.spoiler.slice(0, 200)}"
위 표현·내용과 겹치지 않는 독립적인 분석을 작성하세요.`;

  const insights = await interpretCompatibilityInsights({
    ...request,
    previousContext: overviewContext,
  });

  // 방어적 클램핑: overall.score가 scoreRange 범위를 벗어나면 보정
  if (request.scoreRange) {
    insights.overall.score = Math.max(
      request.scoreRange.min,
      Math.min(request.scoreRange.max, insights.overall.score)
    );
  }

  // Stage 1 context (Stage 2 전달용)
  const stage1Context = `${personalityAnchor}

## 이미 사용한 표현 (절대 반복 금지!)
- 궁합 headline: "${overview.headline}"
- 궁합 spoiler: "${overview.spoiler.slice(0, 150)}"
- insights overall: "${insights.overall.headline}" — ${insights.overall.content.slice(0, 80)}
- insights zodiac: "${insights.zodiac.headline}" — ${insights.zodiac.content.slice(0, 80)}
- insights fiveElement: "${insights.fiveElement.headline}" — ${insights.fiveElement.content.slice(0, 80)}
- insights chemistry: "${insights.chemistry.headline}" — ${insights.chemistry.content.slice(0, 80)}
위 headline·표현과 같은 구조·어휘·패턴을 사용하지 마세요.
⚠️ 표현만 다르게 하고 같은 내용을 반복하면 실패! 이 섹션 고유의 주제(소통/재물/감정/위기/시나리오)에 맞는 새로운 관점과 장면을 다루세요.`;

  // Stage 2 (병렬, context 전달): core_scenarios + communication + growth
  const [scenarios, communication, growth] = await Promise.all([
    interpretCompatibilityCoreScenarios({
      ...request,
      previousContext: stage1Context,
    }),
    interpretCompatibilityCommunication({
      ...request,
      previousContext: stage1Context,
    }),
    interpretCompatibilityGrowth({
      ...request,
      previousContext: stage1Context,
    }),
  ]);

  // Stage 2 context (Stage 3 전달용)
  const stage2Context = `${personalityAnchor}

## 이미 사용한 표현 (절대 반복 금지!)
- 오버뷰 headline: "${overview.headline}"
- 오버뷰 spoiler: "${overview.spoiler.slice(0, 150)}"
- 소통 headline: "${communication.headline}" — ${communication.content.slice(0, 120)}
- 소통 tags: ${communication.tags.map((t) => `"${t}"`).join(", ")}
- 성장 headline: "${growth.headline}" — ${growth.content.slice(0, 120)}
- 성장 tags: ${growth.tags.map((t) => `"${t}"`).join(", ")}
- 시나리오 1: "${scenarios.coreScenarios[0]?.title}" — ${scenarios.coreScenarios[0]?.content.slice(0, 80)}
- 시나리오 2: "${scenarios.coreScenarios[1]?.title}" — ${scenarios.coreScenarios[1]?.content.slice(0, 80)}
- 조언: "${scenarios.advice.slice(0, 100)}"
위 headline·표현과 같은 구조·어휘·패턴을 사용하지 마세요.
⚠️ 표현만 다르게 하고 같은 내용을 반복하면 실패! 이 섹션 고유의 주제에 맞는 새로운 관점과 장면을 다루세요.`;

  // Stage 3 (병렬, context 전달): emotion + crisis
  const [emotion, crisis] = await Promise.all([
    interpretCompatibilityEmotion({
      ...request,
      previousContext: stage2Context,
    }),
    interpretCompatibilityCrisis({
      ...request,
      previousContext: stage2Context,
    }),
  ]);

  return {
    score: insights.overall.score,
    subScores: {
      communication: insights.communication.score,
      growthSynergy: insights.growthSynergy.score,
      trustIndex: insights.trustIndex.score,
      crisisResilience: insights.crisisResilience.score,
    },
    charts: {
      profileA: {
        profileId: "",
        name: request.profileA.name,
        chart: {
          wuxingJu: request.chartA.wuxingJu,
          mingGong: request.chartA.mingGongPosition,
          shenGong: request.chartA.shenGongPosition,
          sihua: {
            hualu: request.chartA.sihua.hualu.star,
            huaquan: request.chartA.sihua.huaquan.star,
            huake: request.chartA.sihua.huake.star,
            huaji: request.chartA.sihua.huaji.star,
          },
        },
        rawChart: null as never, // Filled by API route
      },
      profileB: {
        profileId: "",
        name: request.profileB.name,
        chart: {
          wuxingJu: request.chartB.wuxingJu,
          mingGong: request.chartB.mingGongPosition,
          shenGong: request.chartB.shenGongPosition,
          sihua: {
            hualu: request.chartB.sihua.hualu.star,
            huaquan: request.chartB.sihua.huaquan.star,
            huake: request.chartB.sihua.huake.star,
            huaji: request.chartB.sihua.huaji.star,
          },
        },
        rawChart: null as never, // Filled by API route
      },
    },
    interpretation: {
      headline: overview.headline,
      tags: overview.tags,
      insights,
      spoiler: overview.spoiler,
      coreScenarios: scenarios.coreScenarios,
      categories: {
        communication,
        growth,
        emotion,
        crisis,
      },
      advice: scenarios.advice,
      meta: {
        generatedAt: new Date().toISOString(),
        model: GEMINI_MODEL_NAME,
        isFallback: false,
      },
    },
  };
};

// ============================================================
// 폴백 응답 생성
// ============================================================

export const createCompatibilityFallbackResult = (
  error: Error
): CompatibilityResult => {
  const isRateLimited =
    error instanceof AIError && error.code === "RATE_LIMITED";
  const fallbackMessage = isRateLimited
    ? "현재 많은 분들이 이용 중입니다. 잠시 후 다시 시도해주세요."
    : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

  const emptyInsight = {
    score: 0,
    label: "",
    headline: "",
    content: fallbackMessage,
  };
  const emptyCategory = { headline: "", content: fallbackMessage, tags: [] };

  return {
    score: 0,
    subScores: {
      communication: 0,
      growthSynergy: 0,
      trustIndex: 0,
      crisisResilience: 0,
    },
    charts: {
      profileA: {
        profileId: "",
        name: "",
        chart: {
          wuxingJu: "",
          mingGong: "",
          shenGong: "",
          sihua: { hualu: "", huaquan: "", huake: "", huaji: "" },
        },
        rawChart: null as never,
      },
      profileB: {
        profileId: "",
        name: "",
        chart: {
          wuxingJu: "",
          mingGong: "",
          shenGong: "",
          sihua: { hualu: "", huaquan: "", huake: "", huaji: "" },
        },
        rawChart: null as never,
      },
    },
    interpretation: {
      headline: "🔮 궁합 분석 준비 중",
      tags: [],
      insights: {
        overall: emptyInsight,
        zodiac: emptyInsight,
        fiveElement: emptyInsight,
        chemistry: emptyInsight,
        communication: emptyInsight,
        growthSynergy: emptyInsight,
        trustIndex: emptyInsight,
        crisisResilience: emptyInsight,
      },
      spoiler: fallbackMessage,
      coreScenarios: [],
      categories: {
        communication: emptyCategory,
        growth: emptyCategory,
        emotion: emptyCategory,
        crisis: emptyCategory,
      },
      advice: "",
      meta: {
        generatedAt: new Date().toISOString(),
        model: GEMINI_MODEL_NAME,
        isFallback: true,
      },
    },
  };
};
