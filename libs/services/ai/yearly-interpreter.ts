import type { Locale } from "@/i18n/config";

import { AIError } from "./errors";
import { getPrompts } from "./prompts";
import type {
  YearlyCategoryResponse,
  YearlyCoreScenarioResponse,
  YearlyFortuneInterpretation,
  YearlyInterpretationRequest,
  YearlyMonthlyFortune,
  YearlyOverviewResponse,
} from "./types";
import {
  YearlyCategoryResponseSchema,
  YearlyCoreScenarioResponseSchema,
  YearlyMonthlyFortuneSchema,
  YearlyOverviewResponseSchema,
} from "./types";
import { chatCompletion, parseJsonResponse } from "./upstage";

// ============================================================
// 올해 운세(유년) 해석 서비스
// ============================================================

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
 * 유년 운세 데이터를 AI에게 전달할 문자열로 포맷팅
 */
const formatYearlyDataForAI = (
  request: YearlyInterpretationRequest
): string => {
  const {
    user,
    chart,
    targetYear,
    yearlySihua,
    yearlyPalaces,
    peachBlossom,
    currentDayun,
    language,
  } = request;

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

  let dataStr = `## User Info
- gender: ${genderLabel}
- lunarBirthInfo: ${user.lunarBirthInfo}
- currentAge: ${user.currentAge}${userStatusStr}

## Chart Info
- wuxingJu: ${chart.wuxingJu}
- mingGongPosition: ${chart.mingGongPosition}

## ${targetYear} (${yearlySihua.yearStemName}${yearlySihua.yearBranchName}) Yearly Sihua
- hualu: ${yearlySihua.hualu.star} → ${yearlySihua.hualu.palace} (${yearlySihua.hualu.palaceMeaning})
- huaquan: ${yearlySihua.huaquan.star} → ${yearlySihua.huaquan.palace} (${yearlySihua.huaquan.palaceMeaning})
- huake: ${yearlySihua.huake.star} → ${yearlySihua.huake.palace} (${yearlySihua.huake.palaceMeaning})
- huaji: ${yearlySihua.huaji.star} → ${yearlySihua.huaji.palace} (${yearlySihua.huaji.palaceMeaning})`;

  // 유년궁 정보 추가
  if (yearlyPalaces) {
    const mingStars =
      yearlyPalaces.yearlyMingGong.mainStars.length > 0
        ? yearlyPalaces.yearlyMingGong.mainStars.join(", ")
        : "No main stars";
    dataStr += `

## Yearly Palace Info
- yearlyMingGong: ${yearlyPalaces.yearlyMingGong.palaceName} (mainStars: ${mingStars})
- yearlySpousePalace: ${yearlyPalaces.yearlySpousePalace.palaceName}${yearlyPalaces.yearlySpousePalace.hasPeachBlossom ? " (has peach blossom)" : ""}`;
  }

  // 도화성 정보 추가
  if (peachBlossom) {
    dataStr += `

## Yearly Peach Blossom Info
- isPeachBlossomActive: ${peachBlossom.isPeachBlossomActive}
- hongluanPalace: ${peachBlossom.hongluanPalace}
- tianxiPalace: ${peachBlossom.tianxiPalace}`;

    if (peachBlossom.peachBlossomNotes.length > 0) {
      dataStr += `
- peachBlossomNotes:`;
      for (const note of peachBlossom.peachBlossomNotes) {
        dataStr += `
  * ${note}`;
      }
    }
  }

  // 현재 대운 정보 추가
  if (currentDayun) {
    const mainStarsStr =
      currentDayun.mainStars.length > 0
        ? currentDayun.mainStars.join(", ")
        : "No main stars";
    dataStr += `

## Current Dayun Info
- period: ${currentDayun.period}
- palace: ${currentDayun.palaceName}
- mainStars: ${mainStarsStr}`;
  }

  return dataStr;
};

/**
 * 프롬프트에서 {targetYear} 치환
 */
const replaceTargetYear = (prompt: string, targetYear: number): string => {
  return prompt.replace(/{targetYear}/g, String(targetYear));
};

/**
 * 특정 유형의 유년 해석 요청
 */
const requestYearlyInterpretation = async <T>(
  request: YearlyInterpretationRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> => {
  const prompts = getPrompts(request.language);
  const chartData = formatYearlyDataForAI(request);
  const userPrompt = replaceTargetYear(
    prompts.yearlyUserPrompts[request.requestType],
    request.targetYear
  );

  const fullUserPrompt = `${chartData}

---

${userPrompt}`;

  const response = await chatCompletion([
    { role: "system", content: prompts.yearlySystemPrompt },
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

// ============================================================
// 개별 해석 함수
// ============================================================

/**
 * 연간 총평 해석 요청 (올해 스포일러)
 */
export const interpretYearlyOverview = async (
  request: Omit<YearlyInterpretationRequest, "requestType">
): Promise<YearlyOverviewResponse> => {
  return requestYearlyInterpretation(
    { ...request, requestType: "yearly_overview" },
    YearlyOverviewResponseSchema
  );
};

/**
 * 핵심 시나리오 해석 요청
 */
export const interpretYearlyCore = async (
  request: Omit<YearlyInterpretationRequest, "requestType">
): Promise<YearlyCoreScenarioResponse> => {
  return requestYearlyInterpretation(
    { ...request, requestType: "yearly_core" },
    YearlyCoreScenarioResponseSchema
  );
};

/**
 * 연간 재물운 해석 요청
 */
export const interpretYearlyWealth = async (
  request: Omit<YearlyInterpretationRequest, "requestType">
): Promise<YearlyCategoryResponse> => {
  return requestYearlyInterpretation(
    { ...request, requestType: "yearly_wealth" },
    YearlyCategoryResponseSchema
  );
};

/**
 * 연간 직업운 해석 요청
 */
export const interpretYearlyCareer = async (
  request: Omit<YearlyInterpretationRequest, "requestType">
): Promise<YearlyCategoryResponse> => {
  return requestYearlyInterpretation(
    { ...request, requestType: "yearly_career" },
    YearlyCategoryResponseSchema
  );
};

/**
 * 연간 인연운 해석 요청
 */
export const interpretYearlyRelationship = async (
  request: Omit<YearlyInterpretationRequest, "requestType">
): Promise<YearlyCategoryResponse> => {
  return requestYearlyInterpretation(
    { ...request, requestType: "yearly_relationship" },
    YearlyCategoryResponseSchema
  );
};

/**
 * 연간 건강운 해석 요청
 */
export const interpretYearlyHealth = async (
  request: Omit<YearlyInterpretationRequest, "requestType">
): Promise<YearlyCategoryResponse> => {
  return requestYearlyInterpretation(
    { ...request, requestType: "yearly_health" },
    YearlyCategoryResponseSchema
  );
};

/**
 * 월별 운세 해석 요청
 */
export const interpretYearlyMonthly = async (
  request: Omit<YearlyInterpretationRequest, "requestType">
): Promise<YearlyMonthlyFortune> => {
  return requestYearlyInterpretation(
    { ...request, requestType: "yearly_monthly" },
    YearlyMonthlyFortuneSchema
  );
};

// ============================================================
// 전체 유년 해석 서비스
// ============================================================

/**
 * 전체 유년 운세 해석 생성
 *
 * 2단계 병렬 요청으로 성능 최적화
 */
export const generateYearlyInterpretation = async (
  request: Omit<YearlyInterpretationRequest, "requestType">
): Promise<YearlyFortuneInterpretation> => {
  // 1단계: overview + coreScenario + 4개 카테고리
  const [overview, coreScenario, wealth, career, relationship, health] =
    await Promise.all([
      interpretYearlyOverview(request),
      interpretYearlyCore(request),
      interpretYearlyWealth(request),
      interpretYearlyCareer(request),
      interpretYearlyRelationship(request),
      interpretYearlyHealth(request),
    ]);

  // 2단계: 월별 운세 (프롬프트가 길어서 분리)
  const monthlyResult = await interpretYearlyMonthly(request);

  return {
    overview,
    coreScenario,
    categories: {
      wealth,
      career,
      relationship,
      health,
    },
    monthlyFortunes: monthlyResult.monthlyFortunes,
    meta: {
      year: request.targetYear,
      generatedAt: new Date().toISOString(),
      model: "solar-pro",
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
export const createYearlyFallbackInterpretation = (
  targetYear: number,
  error: Error
): YearlyFortuneInterpretation => {
  const isRateLimited =
    error instanceof AIError && error.code === "RATE_LIMITED";

  const fallbackMessage = isRateLimited
    ? "현재 많은 분들이 이용 중입니다. 잠시 후 다시 시도해주세요."
    : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

  return {
    overview: {
      headline: `🔮 ${targetYear}년 운세 분석 준비 중`,
      summary: fallbackMessage,
    },
    coreScenario: {
      content: fallbackMessage,
    },
    categories: {
      wealth: {
        content: fallbackMessage,
        tags: ["준비 중", "잠시만요"],
      },
      career: {
        content: fallbackMessage,
        tags: ["준비 중", "잠시만요"],
      },
      relationship: {
        content: fallbackMessage,
        tags: ["준비 중", "잠시만요"],
      },
      health: {
        content: fallbackMessage,
        tags: ["준비 중", "잠시만요"],
      },
    },
    monthlyFortunes: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      headline: "준비 중",
      content: fallbackMessage,
    })),
    meta: {
      year: targetYear,
      generatedAt: new Date().toISOString(),
      model: "solar-pro",
      isFallback: true,
    },
  };
};
