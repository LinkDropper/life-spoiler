import type { Locale } from "@/i18n/config";

import { AIError } from "./errors";
import { koCompatibilityPrompts } from "./prompts/compatibility-ko";
import type {
  CompatibilityCategoryResponse,
  CompatibilityCategoriesCombinedResponse,
  CompatibilityInsightsResponse,
  CompatibilityInterpretationRequest,
  CompatibilityInterpretationType,
  CompatibilityOverviewResponse,
  CompatibilityScenariosResponse,
  GeminiResponseSchema,
} from "./types";
import {
  CompatibilityCategoryResponseSchema,
  CompatibilityCategoriesCombinedResponseSchema,
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

/** 4개 카테고리 통합 스키마 (1회 호출로 통합) */
const COMPATIBILITY_CATEGORIES_COMBINED_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    communication: COMPATIBILITY_CATEGORY_SCHEMA,
    growth: COMPATIBILITY_CATEGORY_SCHEMA,
    emotion: COMPATIBILITY_CATEGORY_SCHEMA,
    crisis: COMPATIBILITY_CATEGORY_SCHEMA,
  },
  required: ["communication", "growth", "emotion", "crisis"],
};

const COMPATIBILITY_RESPONSE_SCHEMA_MAP: Record<
  CompatibilityInterpretationType | "compatibility_categories_combined",
  GeminiResponseSchema
> = {
  compatibility_overview: COMPATIBILITY_OVERVIEW_SCHEMA,
  compatibility_insights: COMPATIBILITY_INSIGHTS_SCHEMA,
  compatibility_core_scenarios: COMPATIBILITY_SCENARIOS_SCHEMA,
  compatibility_communication: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_growth: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_emotion: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_crisis: COMPATIBILITY_CATEGORY_SCHEMA,
  compatibility_categories_combined: COMPATIBILITY_CATEGORIES_COMBINED_SCHEMA,
};

// ============================================================
// 프롬프트 가져오기
// ============================================================

const getCompatibilityPrompts = (_language?: Locale) => {
  // 현재 한국어만 지원
  return koCompatibilityPrompts;
};

// ============================================================
// 전문용어 필터링
// ============================================================

/** 전문용어 목록 — AI 응답에서 제거 대상 */
const BANNED_TERMS = [
  // 궁 이름
  "명궁",
  "재백궁",
  "관록궁",
  "부처궁",
  "질액궁",
  "천이궁",
  "복덕궁",
  "부모궁",
  "형제궁",
  "자녀궁",
  "노복궁",
  "전택궁",
  "교우궁",
  // 별 이름
  "자미",
  "천기",
  "태양",
  "무곡",
  "천동",
  "염정",
  "천부",
  "태음",
  "탐랑",
  "거문",
  "천상",
  "천량",
  "칠살",
  "파군",
  // 보조성
  "좌보",
  "우필",
  "문창",
  "문곡",
  "천괴",
  "천월",
  "록존",
  "천마",
  // 사화/운
  "화록",
  "화권",
  "화과",
  "화기",
  "대운",
  "유년",
  "원국",
  "삼방사정",
  "사주",
  "명반",
  "오행국",
  "천간",
  "지지",
  "격국",
];

/** 별 간 상호작용 문자열에서 별 이름을 제거하는 헬퍼 */
const sanitizeStarInteraction = (interaction: string): string => {
  // 별 이름 패턴 "별이름(밝기)" 또는 "별이름" 제거하고 dynamics 텍스트만 남김
  let result = interaction;
  // "A 궁이름 별이름(밝기) + B 궁이름 별이름(밝기) = 설명" → "설명" 부분만 추출
  const equalsIdx = result.indexOf("=");
  if (equalsIdx !== -1) {
    result = result.slice(equalsIdx + 1).trim();
  }
  // 남은 전문용어 제거
  for (const term of BANNED_TERMS) {
    result = result.replaceAll(term, "");
  }
  // 괄호 안 밝기 표시 제거: (묘), (왕), (평), (함), (득), (이)
  result = result.replace(/\([묘왕평함득이]\)/g, "");
  // 연속 공백 정리
  result = result.replace(/\s{2,}/g, " ").trim();
  return result;
};

/** AI 응답의 텍스트에서 전문용어를 제거하는 후처리 함수 */
const sanitizeTerminology = (text: string): string => {
  let result = text;
  for (const term of BANNED_TERMS) {
    result = result.replaceAll(term, "");
  }
  // 연속 공백 정리
  result = result.replace(/\s{2,}/g, " ");
  return result;
};

/** 객체의 모든 문자열 필드에 sanitizeTerminology 적용 */
const sanitizeAllText = <T>(obj: T): T => {
  if (typeof obj === "string") {
    return sanitizeTerminology(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeAllText(item)) as T;
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeAllText(value);
    }
    return result as T;
  }
  return obj;
};

/** 긴 텍스트에 줄바꿈이 없으면 자동으로 단락을 삽입하는 후처리 함수 */
const ensureLineBreaks = (text: string): string => {
  // 이미 이중 줄바꿈(단락 구분)이 있으면 그대로
  if (text.includes("\n\n")) return text;
  // 짧은 텍스트는 구분 불필요
  if (text.length < 150) return text;

  // 단일 \n만 있으면 → \n\n으로 교체 (단락 구분 강화)
  if (text.includes("\n")) {
    return text.replace(/\n/g, "\n\n");
  }

  // 줄바꿈이 전혀 없는 경우: 문장 경계에서 자동 단락 분리
  const boundaries: number[] = [];
  for (let i = 0; i < text.length - 1; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (
      next === " " &&
      (ch === "." || ch === "!" || ch === "?" || ch === "요" || ch === "죠")
    ) {
      boundaries.push(i + 1);
    }
  }

  if (boundaries.length < 2) return text;

  // 80자 이상 누적되면 문장 경계에서 단락 분리
  const paragraphs: string[] = [];
  let start = 0;

  for (const boundaryIdx of boundaries) {
    if (boundaryIdx - start >= 80) {
      paragraphs.push(text.slice(start, boundaryIdx).trim());
      start = boundaryIdx + 1;
    }
  }

  const remaining = text.slice(start).trim();
  if (remaining) {
    paragraphs.push(remaining);
  }

  return paragraphs.length > 1 ? paragraphs.join("\n\n") : text;
};

/** 객체의 모든 문자열 필드에 줄바꿈을 보장 (ensureLineBreaks의 길이 체크로 짧은 필드는 무시) */
const ensureAllLineBreaks = <T>(obj: T): T => {
  if (typeof obj === "string") {
    return ensureLineBreaks(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => ensureAllLineBreaks(item)) as T;
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = ensureAllLineBreaks(value);
    }
    return result as T;
  }
  return obj;
};

// ============================================================
// 데이터 포맷팅 (사전 분석 기반)
// ============================================================

/**
 * 사전 분석 데이터를 AI 입력용으로 포맷
 * - 기존: raw 별/궁 데이터 전체를 전달
 * - 변경: 사전 분석된 성격 프로필 + 교차 분석 + 핵심 궁 참고 데이터
 */
const formatCompatibilityDataForAI = (
  request: CompatibilityInterpretationRequest
): string => {
  const {
    profileA,
    profileB,
    chartA,
    chartB,
    relationshipType,
    zodiacCompatibility,
    fiveElementCompatibility,
    previousContext,
  } = request;

  // ──── 1. 사전 분석된 성격 프로필 (핵심 데이터) ────
  let dataStr = "";

  if (request.personalityA && request.personalityB) {
    const pA = request.personalityA;
    const pB = request.personalityB;

    dataStr += `## ⭐ A (${profileA.name}) 성격 프로필 (사전 분석 완료)
- 핵심 성격: ${pA.coreTraits.join(", ")}
- 소통 스타일: ${pA.communicationStyle.join(", ")}
- 감정 패턴: ${pA.emotionalPattern.join(", ")}
- 갈등 대처: ${pA.conflictStyle.join(", ")}
- 가치관: ${pA.valueOrientation.join(", ")}
- 관계 강점: ${pA.strengths.join(", ")}
- 관계 약점: ${pA.weaknesses.join(", ")}
- 지배 오행: ${pA.dominantElement}
- 종합: ${pA.summary}

## ⭐ B (${profileB.name}) 성격 프로필 (사전 분석 완료)
- 핵심 성격: ${pB.coreTraits.join(", ")}
- 소통 스타일: ${pB.communicationStyle.join(", ")}
- 감정 패턴: ${pB.emotionalPattern.join(", ")}
- 갈등 대처: ${pB.conflictStyle.join(", ")}
- 가치관: ${pB.valueOrientation.join(", ")}
- 관계 강점: ${pB.strengths.join(", ")}
- 관계 약점: ${pB.weaknesses.join(", ")}
- 지배 오행: ${pB.dominantElement}
- 종합: ${pB.summary}`;
  }

  // ──── 2. 사전 분석된 교차 분석 결과 ────
  if (request.analysis) {
    const a = request.analysis;

    dataStr += `\n\n## 🔀 교차 분석 결과 (사전 계산 완료)

### 핵심 역학
${a.keyDynamics.map((d) => `- ${d}`).join("\n")}

### 시너지 포인트
${a.synergyPoints.length > 0 ? a.synergyPoints.map((s) => `- ${s}`).join("\n") : "- 특별한 시너지 없음"}

### 긴장 포인트
${a.tensionPoints.length > 0 ? a.tensionPoints.map((t) => `- ${t}`).join("\n") : "- 특별한 긴장 없음"}

### 카테고리별 사전 분석
**소통**: ${a.communication.analysisPoints.join(" / ")} (사전 점수: ${a.communication.suggestedScore})
**성장**: ${a.growth.analysisPoints.join(" / ")} (사전 점수: ${a.growth.suggestedScore})
**감정**: ${a.emotion.analysisPoints.join(" / ")} (사전 점수: ${a.emotion.suggestedScore})
**위기**: ${a.crisis.analysisPoints.join(" / ")} (사전 점수: ${a.crisis.suggestedScore})

### 주요 상호작용 패턴
${[
  ...new Set([
    ...a.communication.starInteractions.slice(0, 2),
    ...a.growth.starInteractions.slice(0, 1),
    ...a.emotion.starInteractions.slice(0, 1),
    ...a.crisis.starInteractions.slice(0, 1),
  ]),
]
  .map((i) => `- ${sanitizeStarInteraction(i)}`)
  .join("\n")}`;
  }

  // ──── 3. 기본 정보 ────
  dataStr += `\n\n## Profile A (${profileA.name}) Info
- name: ${profileA.name}
- gender: ${profileA.gender === "male" ? "남성" : "여성"}
- lunarBirthInfo: ${profileA.lunarBirthInfo}

## Profile B (${profileB.name}) Info
- name: ${profileB.name}
- gender: ${profileB.gender === "male" ? "남성" : "여성"}
- lunarBirthInfo: ${profileB.lunarBirthInfo}`;

  // ──── 4. 에너지 분포 정보 (전문용어 제거) ────
  const palaceToLabel = (palace: string): string => {
    const labelMap: Record<string, string> = {
      명궁: "성격 영역",
      부처궁: "관계 영역",
      재백궁: "재물 영역",
      관록궁: "커리어 영역",
      질액궁: "건강/위기 영역",
      천이궁: "외부활동 영역",
      복덕궁: "내면/감정 영역",
      부모궁: "윗사람 영역",
      형제궁: "형제/동료 영역",
      자녀궁: "후배/아랫사람 영역",
      노복궁: "사회관계 영역",
      전택궁: "가정/부동산 영역",
      교우궁: "친구/소통 영역",
    };
    return labelMap[palace] || palace;
  };

  dataStr += `\n\n## 에너지 분포
- A (${profileA.name}): 오행국 ${chartA.wuxingJu}, 풍요 에너지 위치: ${palaceToLabel(chartA.sihua.hualu.palace)}, 긴장 에너지 위치: ${palaceToLabel(chartA.sihua.huaji.palace)}
- B (${profileB.name}): 오행국 ${chartB.wuxingJu}, 풍요 에너지 위치: ${palaceToLabel(chartB.sihua.hualu.palace)}, 긴장 에너지 위치: ${palaceToLabel(chartB.sihua.huaji.palace)}`;

  // ──── 6. 상성 정보 ────
  dataStr += `\n\n## Zodiac Compatibility
${zodiacCompatibility}

## Five Element Compatibility
${fiveElementCompatibility}

## Relationship Type
${relationshipType}`;

  if (request.huajiCrossAnalysis) {
    const h = request.huajiCrossAnalysis;
    dataStr += `\n\n## 긴장 에너지 교차 분석
- A의 긴장 에너지 위치: ${palaceToLabel(h.huajiPalaceA)} → B에게 영향: ${h.aHuajiAffectsBPalaces.length > 0 ? h.aHuajiAffectsBPalaces.map(palaceToLabel).join(", ") : "없음"}
- B의 긴장 에너지 위치: ${palaceToLabel(h.huajiPalaceB)} → A에게 영향: ${h.bHuajiAffectsAPalaces.length > 0 ? h.bHuajiAffectsAPalaces.map(palaceToLabel).join(", ") : "없음"}
- 양쪽 긴장 에너지 같은 영역: ${h.bothHuajiSameArea ? "예" : "아니오"}`;
  }

  // ──── 7. 점수 제약 ────
  if (request.scoreRange) {
    dataStr += `\n\n## Score Range
궁합 점수(overall.score)는 반드시 ${request.scoreRange.min}~${request.scoreRange.max} 범위 안에서 결정하세요.`;
  }

  if (request.analysis?.scoreConstraints) {
    const sc = request.analysis.scoreConstraints;
    dataStr += `\n\n## 카테고리별 점수 제약 (사전 계산)
각 항목의 점수를 아래 범위 내에서 결정하세요:`;
    for (const [key, constraint] of Object.entries(sc)) {
      dataStr += `\n- ${key}: ${constraint.min}~${constraint.max} (권장: ${constraint.suggested})`;
    }
  }

  if (previousContext) {
    dataStr += `\n\n${previousContext}`;
  }

  dataStr += `\n\n## ⚠️ 최종 점검
1. 출력에 궁 이름(명궁, 부처궁 등), 별 이름(자미, 천기 등), 사화 용어(화록, 화기 등)가 포함되면 실패입니다.
2. 위의 성격 프로필 데이터를 기반으로 문장을 작성하세요. 별/궁 데이터를 직접 해석하지 마세요.
3. A와 B의 성격을 절대 혼동하지 마세요. 각 사람의 프로필에 명시된 특성만 해당 인물에 귀속하세요.`;

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

/**
 * 4개 카테고리 통합 해석 (1회 호출)
 * communication, growth, emotion, crisis를 한번에 생성하여 일관성 보장
 */
export const interpretCompatibilityCategoriesCombined = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityCategoriesCombinedResponse> => {
  const prompts = getCompatibilityPrompts(request.language);
  const chartData = formatCompatibilityDataForAI({
    ...request,
    requestType: "compatibility_communication", // 타입 호환용, 실제로는 사용 안 됨
  });

  // 4개 카테고리 통합 프롬프트 구성
  const combinedUserPrompt = `${chartData}

---

아래 4가지 카테고리를 **하나의 JSON 응답**으로 한번에 작성해주세요.
⚠️ 위의 성격 프로필과 교차 분석 결과를 반드시 활용하세요.
⚠️ 4개 카테고리 간 성격 묘사가 일관되어야 합니다. A와 B의 성격을 절대 혼동하지 마세요.

### communication (소통 & 갈등)
${prompts.userPrompts.compatibility_communication}

### growth (재물 & 성장)
${prompts.userPrompts.compatibility_growth}

### emotion (감정 & 신뢰)
${prompts.userPrompts.compatibility_emotion}

### crisis (위기 & 극복)
${prompts.userPrompts.compatibility_crisis}

응답 형식 (JSON):
{
  "communication": { "headline": "...", "content": "...", "tags": [...] },
  "growth": { "headline": "...", "content": "...", "tags": [...] },
  "emotion": { "headline": "...", "content": "...", "tags": [...] },
  "crisis": { "headline": "...", "content": "...", "tags": [...] }
}`;

  const responseSchema =
    COMPATIBILITY_RESPONSE_SCHEMA_MAP["compatibility_categories_combined"];

  const response = await chatCompletion(
    [
      { role: "system", content: prompts.systemPrompt },
      { role: "user", content: combinedUserPrompt },
    ],
    {
      responseSchema,
      maxTokens: LARGE_RESPONSE_MAX_TOKENS,
    }
  );

  const parsed = parseJsonResponse<unknown>(response);

  try {
    return CompatibilityCategoriesCombinedResponseSchema.parse(parsed);
  } catch (error) {
    throw new AIError("AI 응답이 예상된 형식과 다릅니다.", {
      code: "RESPONSE_PARSE_FAILED",
      originalError: error as Error,
      requestType: "compatibility_categories_combined",
    });
  }
};

// ============================================================
// 전체 해석 오케스트레이션 (3단계 병렬)
// ============================================================

export const generateCompatibilityInterpretation = async (
  request: Omit<CompatibilityInterpretationRequest, "requestType">
): Promise<CompatibilityResult> => {
  // ──── 성격 앵커 (사전 분석된 프로필 기반, 200자 내외) ────
  const personalityAnchor =
    request.personalityA && request.personalityB
      ? `## 참고: A/B 성격 설정 (사전 분석 완료 — 이 설정과 모순되지 않게 작성)
- ${request.profileA.name}: ${request.personalityA.summary}
- ${request.profileB.name}: ${request.personalityB.summary}
(이 설정과 모순되지 않게 쓰되, 이 섹션 고유의 주제에 집중하세요. 성격 소개를 반복하지 마세요.)`
      : "";

  // ──── Stage 1: overview + insights 병렬 ────
  const [overview, insights] = await Promise.all([
    interpretCompatibilityOverview(request),
    interpretCompatibilityInsights({
      ...request,
      previousContext: personalityAnchor,
    }),
  ]);

  // 방어적 클램핑: overall.score가 scoreRange 범위를 벗어나면 보정
  if (request.scoreRange) {
    insights.overall.score = Math.max(
      request.scoreRange.min,
      Math.min(request.scoreRange.max, insights.overall.score)
    );
  }

  // 카테고리별 점수 클램핑 (사전 분석 점수 제약 적용)
  if (request.analysis?.scoreConstraints) {
    const sc = request.analysis.scoreConstraints;
    const clampScore = (score: number, key: string): number => {
      const constraint = sc[key];
      if (!constraint) return score;
      return Math.max(constraint.min, Math.min(constraint.max, score));
    };

    insights.communication.score = clampScore(
      insights.communication.score,
      "communication"
    );
    insights.growthSynergy.score = clampScore(
      insights.growthSynergy.score,
      "growthSynergy"
    );
    insights.trustIndex.score = clampScore(
      insights.trustIndex.score,
      "trustIndex"
    );
    insights.crisisResilience.score = clampScore(
      insights.crisisResilience.score,
      "crisisResilience"
    );
    insights.chemistry.score = clampScore(
      insights.chemistry.score,
      "chemistry"
    );
  }

  // Stage 1 context (Stage 2 전달용)
  const stage1Context = `${personalityAnchor}

## 이미 사용한 표현 (절대 반복 금지!)
- 궁합 headline: "${overview.headline}"
- 궁합 spoiler: "${overview.spoiler.slice(0, 150)}"
- insights overall: "${insights.overall.headline}" — ${insights.overall.content.slice(0, 80)}
- insights chemistry: "${insights.chemistry.headline}" — ${insights.chemistry.content.slice(0, 80)}
위 headline·표현과 같은 구조·어휘·패턴을 사용하지 마세요.
⚠️ 표현만 다르게 하고 같은 내용을 반복하면 실패! 이 섹션 고유의 주제에 맞는 새로운 관점과 장면을 다루세요.`;

  // ──── Stage 2: scenarios + categories(4개 통합) 병렬 ────
  const [scenarios, categories] = await Promise.all([
    interpretCompatibilityCoreScenarios({
      ...request,
      previousContext: stage1Context,
    }),
    interpretCompatibilityCategoriesCombined({
      ...request,
      previousContext: stage1Context,
    }),
  ]);

  // ──── 후처리: 전문용어 필터 + 줄바꿈 보장 ────
  const sanitizedOverview = ensureAllLineBreaks(sanitizeAllText(overview));
  const sanitizedInsights = ensureAllLineBreaks(sanitizeAllText(insights));
  const sanitizedScenarios = ensureAllLineBreaks(sanitizeAllText(scenarios));
  const sanitizedCategories = ensureAllLineBreaks(sanitizeAllText(categories));

  return {
    score: sanitizedInsights.overall.score,
    subScores: {
      communication: sanitizedInsights.communication.score,
      growthSynergy: sanitizedInsights.growthSynergy.score,
      trustIndex: sanitizedInsights.trustIndex.score,
      crisisResilience: sanitizedInsights.crisisResilience.score,
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
      headline: sanitizedOverview.headline,
      tags: sanitizedOverview.tags,
      insights: sanitizedInsights,
      spoiler: sanitizedOverview.spoiler,
      coreScenarios: sanitizedScenarios.coreScenarios,
      categories: {
        communication: sanitizedCategories.communication,
        growth: sanitizedCategories.growth,
        emotion: sanitizedCategories.emotion,
        crisis: sanitizedCategories.crisis,
      },
      advice: sanitizedScenarios.advice,
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
