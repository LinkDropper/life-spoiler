import { AIError } from "./errors";
import { YEARLY_SYSTEM_PROMPT, YEARLY_USER_PROMPTS } from "./prompts";
import type {
  YearlyCategoryResponse,
  YearlyFortuneInterpretation,
  YearlyInterpretationRequest,
  YearlyMonthlyFortune,
  YearlyOverviewResponse,
} from "./types";
import {
  YearlyCategoryResponseSchema,
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
  custom?: string | null
): string | null => {
  if (!status) return null;
  const labels: Record<string, string> = {
    solo: "솔로",
    dating: "연애중",
    married: "기혼",
    divorced: "이혼",
    custom: custom || "직접입력",
  };
  return labels[status] || null;
};

/**
 * 직업 상태 레이블 변환
 */
const getOccupationStatusLabel = (
  status: string | null | undefined,
  custom?: string | null
): string | null => {
  if (!status) return null;
  const labels: Record<string, string> = {
    student: "학생",
    job_seeker: "취준생",
    homemaker: "주부",
    employed: "직장인",
    self_employed: "자영업",
    retired: "은퇴",
    custom: custom || "직접입력",
  };
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
    scores,
  } = request;

  // 사용자 상태 정보 포맷팅
  const relationshipLabel = getRelationshipStatusLabel(
    user.relationshipStatus,
    user.relationshipStatusCustom
  );
  const occupationLabel = getOccupationStatusLabel(
    user.occupationStatus,
    user.occupationStatusCustom
  );

  let userStatusStr = "";
  if (relationshipLabel) {
    userStatusStr += `\n- 연애 상태: ${relationshipLabel}`;
  }
  if (occupationLabel) {
    userStatusStr += `\n- 직업 상태: ${occupationLabel}`;
  }

  let dataStr = `## 사용자 정보
- 성별: ${user.gender === "male" ? "남성" : "여성"}
- 음력 생일: ${user.lunarBirthInfo}
- 현재 나이: ${user.currentAge}세${userStatusStr}

## 명반 기본 정보
- 오행국: ${chart.wuxingJu}
- 명궁 위치: ${chart.mingGongPosition}

## ${targetYear}년 (${yearlySihua.yearStemName}${yearlySihua.yearBranchName}년) 유년 사화
- 화록: ${yearlySihua.hualu.star} → ${yearlySihua.hualu.palace} (${yearlySihua.hualu.palaceMeaning})
- 화권: ${yearlySihua.huaquan.star} → ${yearlySihua.huaquan.palace} (${yearlySihua.huaquan.palaceMeaning})
- 화과: ${yearlySihua.huake.star} → ${yearlySihua.huake.palace} (${yearlySihua.huake.palaceMeaning})
- 화기: ${yearlySihua.huaji.star} → ${yearlySihua.huaji.palace} (${yearlySihua.huaji.palaceMeaning})`;

  // 유년궁 정보 추가
  if (yearlyPalaces) {
    const mingStars =
      yearlyPalaces.yearlyMingGong.mainStars.length > 0
        ? yearlyPalaces.yearlyMingGong.mainStars.join(", ")
        : "주성 없음";
    dataStr += `

## 유년궁 정보
- 유년 명궁: ${yearlyPalaces.yearlyMingGong.palaceName} (주성: ${mingStars})
- 유년 부처궁: ${yearlyPalaces.yearlySpousePalace.palaceName}${yearlyPalaces.yearlySpousePalace.hasPeachBlossom ? " (도화성 있음)" : ""}`;
  }

  // 도화성 정보 추가
  if (peachBlossom) {
    dataStr += `

## 유년 도화성 정보
- isPeachBlossomActive: ${peachBlossom.isPeachBlossomActive}
- 유년 홍란 위치: ${peachBlossom.hongluanPalace}
- 유년 천희 위치: ${peachBlossom.tianxiPalace}`;

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
        : "주성 없음";
    dataStr += `

## 현재 대운 정보
- 대운 기간: ${currentDayun.period}
- 대운궁: ${currentDayun.palaceName}
- 주요 별: ${mainStarsStr}`;
  }

  // 점수 정보 추가 (AI가 참고할 수 있도록)
  dataStr += `

## 유년 점수 (참고용)
- 종합: ${scores.overall}점
- 재물운: ${scores.wealth}점
- 직업운: ${scores.career}점
- 인연운: ${scores.relationship}점
- 건강운: ${scores.health}점`;

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
  const chartData = formatYearlyDataForAI(request);
  const userPrompt = replaceTargetYear(
    YEARLY_USER_PROMPTS[request.requestType],
    request.targetYear
  );

  const fullUserPrompt = `${chartData}

---

${userPrompt}`;

  const response = await chatCompletion([
    { role: "system", content: YEARLY_SYSTEM_PROMPT },
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
 * 연간 총평 해석 요청
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
 * 병렬 요청으로 성능 최적화
 */
export const generateYearlyInterpretation = async (
  request: Omit<YearlyInterpretationRequest, "requestType">
): Promise<YearlyFortuneInterpretation> => {
  // 1단계: overview + wealth
  const [overview, wealth] = await Promise.all([
    interpretYearlyOverview(request),
    interpretYearlyWealth(request),
  ]);

  // 2단계: career + relationship
  const [career, relationship] = await Promise.all([
    interpretYearlyCareer(request),
    interpretYearlyRelationship(request),
  ]);

  // 3단계: health + monthly
  const [health, monthlyResult] = await Promise.all([
    interpretYearlyHealth(request),
    interpretYearlyMonthly(request),
  ]);

  return {
    overview,
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
      keywords: [],
      luckyMonths: [],
      cautionMonths: [],
    },
    categories: {
      wealth: {
        title: `💰 ${targetYear}년 재물운`,
        content: fallbackMessage,
        advice: "",
      },
      career: {
        title: `💼 ${targetYear}년 직업운`,
        content: fallbackMessage,
        advice: "",
      },
      relationship: {
        title: `💕 ${targetYear}년 인연운`,
        content: fallbackMessage,
        advice: "",
      },
      health: {
        title: `🏃 ${targetYear}년 건강운`,
        content: fallbackMessage,
        advice: "",
      },
    },
    monthlyFortunes: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      score: 50,
      theme: "준비 중",
      content: fallbackMessage,
      tip: "",
    })),
    meta: {
      year: targetYear,
      generatedAt: new Date().toISOString(),
      model: "solar-pro",
      isFallback: true,
    },
  };
};
