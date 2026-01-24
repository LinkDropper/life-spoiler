import type { Locale } from "@/i18n/config";

import { AIError } from "./errors";
import { getPrompts } from "./prompts";
import type {
  AgeScenarioResponse,
  FortuneInterpretation,
  InterpretationType,
  LifeSpoilerResponse,
  LifetimeCategoryResponse,
  LifetimeCoreScenarioResponse,
  PalaceData,
  ZiweiInterpretationRequest,
} from "./types";
import {
  AgeScenarioResponseSchema,
  LifeSpoilerResponseSchema,
  LifetimeCategoryResponseSchema,
  LifetimeCoreScenarioResponseSchema,
} from "./types";
import { chatCompletion, parseJsonResponse } from "./gemini";

// ============================================================
// 자미두수 해석 서비스
// ============================================================

/** 대운 정보가 필요한 해석 유형 */
const DAYUN_REQUIRED_TYPES: InterpretationType[] = [
  "lifetime_core",
  "lifetime_age_scenarios",
];

/** 대운 정보가 필요한 해석 유형인지 확인하는 타입 가드 */
const isDayunRequired = (type: InterpretationType): boolean => {
  return DAYUN_REQUIRED_TYPES.includes(type);
};

/** 해석 유형별 대상 궁과 대궁 매핑 */
const PALACE_MAPPING: Record<
  InterpretationType,
  { target: string; opposite: string }
> = {
  life_spoiler: { target: "명궁", opposite: "천이궁" },
  lifetime_core: { target: "명궁", opposite: "천이궁" },
  lifetime_wealth: { target: "재백궁", opposite: "복덕궁" },
  lifetime_career: { target: "관록궁", opposite: "부처궁" },
  lifetime_relationship: { target: "부처궁", opposite: "관록궁" },
  lifetime_health: { target: "질액궁", opposite: "부모궁" },
  lifetime_age_scenarios: { target: "명궁", opposite: "천이궁" },
};

/**
 * 연애 상태 레이블 변환
 */
const getRelationshipStatusLabel = (
  status: string | null | undefined,
  custom: string | null | undefined,
  language?: Locale
): string | null => {
  if (!status) return null;
  const prompts = getPrompts(language);
  const labels = prompts.statusLabels.relationship;
  if (status === "custom") {
    return custom || labels.custom;
  }
  return labels[status] || null;
};

/**
 * 직업 상태 레이블 변환
 */
const getOccupationStatusLabel = (
  status: string | null | undefined,
  custom: string | null | undefined,
  language?: Locale
): string | null => {
  if (!status) return null;
  const prompts = getPrompts(language);
  const labels = prompts.statusLabels.occupation;
  if (status === "custom") {
    return custom || labels.custom;
  }
  return labels[status] || null;
};

/**
 * 명반 데이터를 AI에게 전달할 문자열로 포맷팅
 */
const formatChartDataForAI = (request: ZiweiInterpretationRequest): string => {
  const { user, chart, palaces, dayunPeriods, requestType, language } = request;

  const prompts = getPrompts(language);

  // 사용자 상태 정보 포맷팅
  const relationshipLabel = getRelationshipStatusLabel(
    user.relationshipStatus,
    user.relationshipStatusCustom,
    language
  );
  const occupationLabel = getOccupationStatusLabel(
    user.occupationStatus,
    user.occupationStatusCustom,
    language
  );

  const genderLabel = prompts.statusLabels.gender[user.gender];

  let userStatusStr = "";
  if (relationshipLabel) {
    userStatusStr += `\n- relationshipStatus: ${relationshipLabel}`;
  }
  if (occupationLabel) {
    userStatusStr += `\n- occupationStatus: ${occupationLabel}`;
  }

  // 해석 유형에 맞는 대상 궁과 대궁 선택
  const palaceNames = PALACE_MAPPING[requestType];
  const targetPalace = palaces[palaceNames.target];
  const oppositePalace = palaces[palaceNames.opposite];

  let dataStr = `## User Info
- gender: ${genderLabel}
- lunarBirthInfo: ${user.lunarBirthInfo}${user.currentAge ? `\n- currentAge: ${user.currentAge}` : ""}${userStatusStr}

## Chart Info
- wuxingJu: ${chart.wuxingJu}
- mingGongPosition: ${chart.mingGongPosition}
- shenGongPosition: ${chart.shenGongPosition}

## Sihua Info
- hualu: ${chart.sihua.hualu.star} (${chart.sihua.hualu.palace})
- huaquan: ${chart.sihua.huaquan.star} (${chart.sihua.huaquan.palace})
- huake: ${chart.sihua.huake.star} (${chart.sihua.huake.palace})
- huaji: ${chart.sihua.huaji.star} (${chart.sihua.huaji.palace})

## Target Palace: ${prompts.palaceNameMap[requestType]} (${palaceNames.target})
${targetPalace ? formatPalaceData(targetPalace) : "Palace data not available"}`;

  if (oppositePalace) {
    dataStr += `\n\n## Opposite Palace (${palaceNames.opposite})
${formatPalaceData(oppositePalace)}`;
  }

  // 대운 정보 추가 (timeline이 필요한 해석 유형에서만)
  if (dayunPeriods && dayunPeriods.length > 0 && isDayunRequired(requestType)) {
    dataStr += `\n\n## Dayun (10-year cycles)`;
    for (const period of dayunPeriods) {
      const starsStr =
        period.mainStars.length > 0
          ? period.mainStars.join(", ")
          : "No main stars";
      const sihuaStr =
        period.sihua && period.sihua.length > 0
          ? ` [${period.sihua.join(", ")}]`
          : "";
      dataStr += `\n- ${period.period} (${period.palaceName}): ${starsStr}${sihuaStr}`;
    }
    if (user.currentAge) {
      dataStr += `\n- **Focus on current age ${user.currentAge} Dayun period!**`;
    }
  }

  return dataStr;
};

/**
 * 궁 데이터를 문자열로 포맷팅
 */
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

  return `- Branch: ${palace.branch}
- Main Stars: ${mainStarsStr || "None"}
- Minor Stars: ${minorStarsStr}`;
};

/**
 * 특정 유형의 해석 요청
 */
const requestInterpretation = async <T>(
  request: ZiweiInterpretationRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> => {
  const prompts = getPrompts(request.language);
  const chartData = formatChartDataForAI(request);
  const userPrompt = prompts.userPrompts[request.requestType];

  const fullUserPrompt = `${chartData}

---

${userPrompt}`;

  const response = await chatCompletion([
    { role: "system", content: prompts.ziweiSystemPrompt },
    { role: "user", content: fullUserPrompt },
  ]);

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

/**
 * 인생 스포일러 해석 요청
 */
export const interpretLifeSpoiler = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<LifeSpoilerResponse> => {
  return requestInterpretation(
    { ...request, requestType: "life_spoiler" },
    LifeSpoilerResponseSchema
  );
};

/**
 * 핵심 시나리오 해석 요청
 */
export const interpretLifetimeCore = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<LifetimeCoreScenarioResponse> => {
  return requestInterpretation(
    { ...request, requestType: "lifetime_core" },
    LifetimeCoreScenarioResponseSchema
  );
};

/**
 * 재물운 해석 요청
 */
export const interpretLifetimeWealth = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<LifetimeCategoryResponse> => {
  return requestInterpretation(
    { ...request, requestType: "lifetime_wealth" },
    LifetimeCategoryResponseSchema
  );
};

/**
 * 직업운 해석 요청
 */
export const interpretLifetimeCareer = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<LifetimeCategoryResponse> => {
  return requestInterpretation(
    { ...request, requestType: "lifetime_career" },
    LifetimeCategoryResponseSchema
  );
};

/**
 * 인연운 해석 요청
 */
export const interpretLifetimeRelationship = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<LifetimeCategoryResponse> => {
  return requestInterpretation(
    { ...request, requestType: "lifetime_relationship" },
    LifetimeCategoryResponseSchema
  );
};

/**
 * 건강운 해석 요청
 */
export const interpretLifetimeHealth = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<LifetimeCategoryResponse> => {
  return requestInterpretation(
    { ...request, requestType: "lifetime_health" },
    LifetimeCategoryResponseSchema
  );
};

/**
 * 나이대별 시나리오 해석 요청
 */
export const interpretAgeScenarios = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<AgeScenarioResponse> => {
  return requestInterpretation(
    { ...request, requestType: "lifetime_age_scenarios" },
    AgeScenarioResponseSchema
  );
};

// ============================================================
// 전체 해석 서비스
// ============================================================

export interface FullInterpretationOptions {
  /** 상세 해석 포함 여부 (기본값: false) */
  includeDetails?: boolean;
}

/**
 * 전체 운세 해석 생성
 *
 * 모든 섹션이 성공해야 결과 반환 (하나라도 실패하면 에러)
 */
export const generateFullInterpretation = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  options: FullInterpretationOptions = {}
): Promise<FortuneInterpretation> => {
  const { includeDetails = false } = options;

  if (includeDetails) {
    // 1단계: 인생 스포일러 + 핵심 시나리오
    const [lifeSpoiler, coreScenario] = await Promise.all([
      interpretLifeSpoiler(request),
      interpretLifetimeCore(request),
    ]);

    // 2단계: 상세 시나리오 (재물, 직업)
    const [wealth, career] = await Promise.all([
      interpretLifetimeWealth(request),
      interpretLifetimeCareer(request),
    ]);

    // 3단계: 상세 시나리오 (인연, 건강)
    const [relationship, health] = await Promise.all([
      interpretLifetimeRelationship(request),
      interpretLifetimeHealth(request),
    ]);

    // 4단계: 나이대별 시나리오
    const ageResult = await interpretAgeScenarios(request);

    return {
      lifeSpoiler,
      coreScenario,
      categories: {
        wealth,
        career,
        relationship,
        health,
      },
      ageScenarios: ageResult.ageScenarios,
      meta: {
        generatedAt: new Date().toISOString(),
        model: "gemini-2.0-flash",
        isFallback: false,
      },
    };
  }

  // 미리보기만 (결제 전)
  const lifeSpoiler = await interpretLifeSpoiler(request);

  return {
    lifeSpoiler,
    coreScenario: { headline: "", content: "" },
    categories: {
      wealth: { headline: "", content: "", tags: [], score: 0 },
      career: { headline: "", content: "", tags: [], score: 0 },
      relationship: { headline: "", content: "", tags: [], score: 0 },
      health: { headline: "", content: "", tags: [], score: 0 },
    },
    ageScenarios: [],
    meta: {
      generatedAt: new Date().toISOString(),
      model: "gemini-2.0-flash",
      isFallback: false,
    },
  };
};

// ============================================================
// 폴백 응답 생성
// ============================================================

/**
 * AI 요청 실패 시 폴백 응답 생성
 */
export const createFallbackInterpretation = (
  error: Error
): FortuneInterpretation => {
  const isRateLimited =
    error instanceof AIError && error.code === "RATE_LIMITED";

  return {
    lifeSpoiler: {
      headline: "🔮 운세 분석 준비 중",
      description: "잠시 후 다시 시도해주세요",
      summary: isRateLimited
        ? "현재 많은 분들이 이용 중입니다. 잠시 후 다시 시도해주세요."
        : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    },
    coreScenario: { headline: "", content: "" },
    categories: {
      wealth: { headline: "", content: "", tags: [], score: 0 },
      career: { headline: "", content: "", tags: [], score: 0 },
      relationship: { headline: "", content: "", tags: [], score: 0 },
      health: { headline: "", content: "", tags: [], score: 0 },
    },
    ageScenarios: [],
    meta: {
      generatedAt: new Date().toISOString(),
      model: "gemini-2.0-flash",
      isFallback: true,
    },
  };
};
