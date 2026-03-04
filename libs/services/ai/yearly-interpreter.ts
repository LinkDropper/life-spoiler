import type { Locale } from "@/i18n/config";
import { BRANCH_INDEX_MAP } from "@/libs/zi-wei-dou-shu/constants/branches";
import { calculateSamBangSaJeong } from "@/libs/zi-wei-dou-shu/calculators/sam-bang";
import type { BranchIndex, Palace } from "@/libs/zi-wei-dou-shu/types";

import { AIError } from "./errors";
import { getPrompts } from "./prompts";
import type { PalaceData } from "./types";
import type {
  GeminiResponseSchema,
  YearlyCategoryResponse,
  YearlyCoreScenarioResponse,
  YearlyFortuneInterpretation,
  YearlyInterpretationRequest,
  YearlyInterpretationType,
  YearlyMonthlyFortune,
  YearlyOverviewResponse,
} from "./types";
import {
  YearlyCategoryResponseSchema,
  YearlyCoreScenarioResponseSchema,
  YearlyMonthlyFortuneSchema,
  YearlyOverviewResponseSchema,
} from "./types";
import { chatCompletion, parseJsonResponse, GEMINI_MODEL_NAME } from "./gemini";

// ============================================================
// Gemini responseSchema 정의 (유년)
// ============================================================

/** 올해 스포일러 스키마 */
const YEARLY_OVERVIEW_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    description: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    summary: { type: "string" },
  },
  required: ["headline", "description", "tags", "summary"],
};

/** 올해 핵심 시나리오 스키마 */
const YEARLY_CORE_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    content: { type: "string" },
  },
  required: ["headline", "content"],
};

/** 올해 카테고리 응답 스키마 (재물/직업/인연/건강) */
const YEARLY_CATEGORY_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    content: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    score: { type: "integer", minimum: 0, maximum: 100 },
  },
  required: ["headline", "content", "tags", "score"],
};

/** 월별 시나리오 스키마 */
const YEARLY_MONTHLY_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    monthlyFortunes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          month: { type: "integer", minimum: 1, maximum: 12 },
          headline: { type: "string" },
          content: { type: "string" },
        },
        required: ["month", "headline", "content"],
      },
    },
  },
  required: ["monthlyFortunes"],
};

/** 유년 해석 유형별 스키마 매핑 */
const YEARLY_RESPONSE_SCHEMA_MAP: Record<
  YearlyInterpretationType,
  GeminiResponseSchema
> = {
  yearly_overview: YEARLY_OVERVIEW_SCHEMA,
  yearly_core: YEARLY_CORE_SCHEMA,
  yearly_wealth: YEARLY_CATEGORY_SCHEMA,
  yearly_career: YEARLY_CATEGORY_SCHEMA,
  yearly_relationship: YEARLY_CATEGORY_SCHEMA,
  yearly_health: YEARLY_CATEGORY_SCHEMA,
  yearly_monthly: YEARLY_MONTHLY_SCHEMA,
};

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
 * PalaceData의 branch(문자열)를 BranchIndex로 변환
 */
const branchStringToIndex = (branch: string): BranchIndex | null => {
  const index = BRANCH_INDEX_MAP[branch];
  return index !== undefined ? index : null;
};

/**
 * PalaceData를 Palace 유사 객체로 변환 (삼방사정 계산용)
 */
const palaceDataToPalace = (
  palaceData: PalaceData,
  branchIndex: BranchIndex
): Palace => ({
  name: palaceData.name,
  branch: branchIndex,
  stem: 0 as Palace["stem"],
  mainStars: palaceData.mainStars.map((s) => ({
    name: s.name,
    brightness: s.brightness as Palace["mainStars"][0]["brightness"],
    sihua: s.sihua as Palace["mainStars"][0]["sihua"],
  })),
  minorStars: palaceData.minorStars.map((name) => ({
    name: name.replace(/\[.*\]/, ""),
    brightness: "평" as const,
  })),
  isShenGong: false,
});

/**
 * Palace 타입에서 궁 데이터를 문자열로 포맷팅 (삼방사정용)
 */
const formatPalaceFromPalaceType = (palace: Palace): string => {
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
    palace.minorStars.length > 0
      ? palace.minorStars.map((s) => s.name).join(", ")
      : "None";

  return `- Main Stars: ${mainStarsStr || "None"}
- Minor Stars: ${minorStarsStr}`;
};

/**
 * 궁 데이터를 문자열로 포맷팅 (PalaceData용)
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

  return `- Main Stars: ${mainStarsStr || "None"}
- Minor Stars: ${minorStarsStr}`;
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
    natalPalaces,
    natalSihua,
    monthlyFortunes,
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

  // 원국 사화 정보 (타고난 에너지 흐름)
  if (natalSihua) {
    dataStr += `

## Natal Sihua (원국 사화 - 타고난 기운)
- hualu: ${natalSihua.hualu.star} (${natalSihua.hualu.palace})
- huaquan: ${natalSihua.huaquan.star} (${natalSihua.huaquan.palace})
- huake: ${natalSihua.huake.star} (${natalSihua.huake.palace})
- huaji: ${natalSihua.huaji.star} (${natalSihua.huaji.palace})`;
  }

  // 원국 주요 궁 데이터 (타고난 기운 vs 올해 기운 비교)
  if (natalPalaces) {
    const keyPalaces = ["명궁", "재백궁", "관록궁", "부처궁", "질액궁"];
    const availablePalaces = keyPalaces.filter((name) => natalPalaces[name]);

    if (availablePalaces.length > 0) {
      dataStr += `\n\n## Natal Key Palaces (원국 주요 궁 - 타고난 기운)`;
      for (const name of availablePalaces) {
        const palace = natalPalaces[name];
        dataStr += `\n### ${name}
${formatPalaceData(palace)}`;
      }

      // 유년 명궁의 삼방사정 계산
      if (yearlyPalaces) {
        const yearlyMingPalaceName = yearlyPalaces.yearlyMingGong.palaceName;
        const yearlyMingPalace = natalPalaces[yearlyMingPalaceName];

        if (yearlyMingPalace) {
          const branchIndex = branchStringToIndex(yearlyMingPalace.branch);
          if (branchIndex !== null) {
            const palaceArray: Palace[] = Object.values(natalPalaces)
              .map((pd) => {
                const bi = branchStringToIndex(pd.branch);
                if (bi === null) return null;
                return palaceDataToPalace(pd, bi);
              })
              .filter((p): p is Palace => p !== null);

            const samBang = calculateSamBangSaJeong(palaceArray, branchIndex);
            if (samBang) {
              dataStr += `\n\n## 유년 명궁 삼방사정 (${yearlyMingPalaceName} 기준)`;
              dataStr += `\n### Opposite (대궁: ${samBang.opposite.name})
${formatPalaceFromPalaceType(samBang.opposite)}`;
              dataStr += `\n### Triangle 1 (삼합: ${samBang.triangle1.name})
${formatPalaceFromPalaceType(samBang.triangle1)}`;
              dataStr += `\n### Triangle 2 (삼합: ${samBang.triangle2.name})
${formatPalaceFromPalaceType(samBang.triangle2)}`;
            }
          }
        }
      }
    }
  }

  // 월별 운세 데이터 (차별화된 12개월 해석 근거)
  if (monthlyFortunes && monthlyFortunes.length > 0) {
    dataStr += `\n\n## Monthly Fortune Data (월별 운세 점수)`;
    for (const mf of monthlyFortunes) {
      dataStr += `\n- ${mf.month}월 (${mf.monthStemName}${mf.monthBranchName}): score=${mf.score}, theme="${mf.theme}"`;
    }
  }

  // 이전 해석 맥락 (섹션 간 중복 방지)
  if (request.previousContext) {
    dataStr += `\n\n${request.previousContext}`;
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

  const responseSchema = YEARLY_RESPONSE_SCHEMA_MAP[request.requestType];

  const response = await chatCompletion(
    [
      { role: "system", content: prompts.yearlySystemPrompt },
      { role: "user", content: fullUserPrompt },
    ],
    { responseSchema }
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
  // 1단계: overview + coreScenario (병렬)
  const [overview, coreScenario] = await Promise.all([
    interpretYearlyOverview(request),
    interpretYearlyCore(request),
  ]);

  // 2단계: 재물 + 직업 (이전 headline 전달)
  const stage1Context = `## 이미 사용한 표현 (절대 반복 금지!)
- 올해 스포일러 headline: "${overview.headline}"
- 올해 시나리오 headline: "${coreScenario.headline}"
- 스포일러 첫 문장: "${overview.summary.split("\n\n")[0]?.slice(0, 80)}"
위 headline과 같은 구조·어휘·패턴을 사용하지 마세요. 완전히 다른 표현을 창작하세요.`;

  const [wealth, career] = await Promise.all([
    interpretYearlyWealth({ ...request, previousContext: stage1Context }),
    interpretYearlyCareer({ ...request, previousContext: stage1Context }),
  ]);

  // 3단계: 인연 + 건강 (모든 이전 headline 전달)
  const stage2Context = `## 이미 사용한 표현 (절대 반복 금지!)
- 올해 스포일러 headline: "${overview.headline}"
- 올해 시나리오 headline: "${coreScenario.headline}"
- 재물 headline: "${wealth.headline}"
- 직업 headline: "${career.headline}"
- 스포일러 첫 문장: "${overview.summary.split("\n\n")[0]?.slice(0, 80)}"
- 재물 첫 문장: "${wealth.content.split("\n\n")[0]?.slice(0, 60)}"
- 직업 첫 문장: "${career.content.split("\n\n")[0]?.slice(0, 60)}"
위 headline·첫 문장과 같은 구조·어휘·패턴을 사용하지 마세요.`;

  const [relationship, health] = await Promise.all([
    interpretYearlyRelationship({
      ...request,
      previousContext: stage2Context,
    }),
    interpretYearlyHealth({ ...request, previousContext: stage2Context }),
  ]);

  // 4단계: 월별 운세 (프롬프트가 길어서 분리)
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
      model: GEMINI_MODEL_NAME,
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
      description: "잠시 후 다시 시도해주세요",
      tags: [],
      summary: fallbackMessage,
    },
    coreScenario: {
      headline: "",
      content: fallbackMessage,
    },
    categories: {
      wealth: {
        headline: "",
        content: fallbackMessage,
        tags: ["준비 중", "잠시만요"],
        score: 0,
      },
      career: {
        headline: "",
        content: fallbackMessage,
        tags: ["준비 중", "잠시만요"],
        score: 0,
      },
      relationship: {
        headline: "",
        content: fallbackMessage,
        tags: ["준비 중", "잠시만요"],
        score: 0,
      },
      health: {
        headline: "",
        content: fallbackMessage,
        tags: ["준비 중", "잠시만요"],
        score: 0,
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
      model: GEMINI_MODEL_NAME,
      isFallback: true,
    },
  };
};
