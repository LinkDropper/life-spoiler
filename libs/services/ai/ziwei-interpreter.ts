import type { Locale } from "@/i18n/config";

import { AIError } from "./errors";
import { getPrompts } from "./prompts";
import type {
  FortuneInterpretation,
  InterpretationType,
  PalaceData,
  PreviewResponse,
  SectionResponse,
  SummaryResponse,
  ZiweiInterpretationRequest,
} from "./types";
import {
  PreviewResponseSchema,
  SectionResponseSchema,
  SummaryResponseSchema,
} from "./types";
import { chatCompletion, parseJsonResponse } from "./upstage";

// ============================================================
// 자미두수 해석 서비스
// ============================================================

/** 대운 정보가 필요한 해석 유형 (summary만 대운 맥락 필요) */
const DAYUN_REQUIRED_TYPES = ["summary"] as const;

/** 대운 정보가 필요한 해석 유형인지 확인하는 타입 가드 */
const isDayunRequired = (
  type: InterpretationType
): type is (typeof DAYUN_REQUIRED_TYPES)[number] => {
  return (DAYUN_REQUIRED_TYPES as readonly string[]).includes(type);
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
  const {
    user,
    chart,
    targetPalace,
    oppositePalace,
    dayunPeriods,
    requestType,
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

## Target Palace: ${prompts.palaceNameMap[requestType]}
${formatPalaceData(targetPalace)}`;

  if (oppositePalace) {
    dataStr += `\n\n## Opposite Palace
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
    palace.minorStars.length > 0 ? palace.minorStars.join(", ") : "없음";

  return `- 지지: ${palace.branch}
- 주성: ${mainStarsStr || "없음"}
- 보조성/살성: ${minorStarsStr}`;
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
 * 미리보기 해석 요청
 */
export const interpretPreview = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<PreviewResponse> => {
  return requestInterpretation(
    { ...request, requestType: "preview" },
    PreviewResponseSchema
  );
};

/**
 * 재물운 해석 요청
 */
export const interpretWealth = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<SectionResponse> => {
  return requestInterpretation(
    { ...request, requestType: "wealth" },
    SectionResponseSchema
  );
};

/**
 * 직업운 해석 요청
 */
export const interpretCareer = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<SectionResponse> => {
  return requestInterpretation(
    { ...request, requestType: "career" },
    SectionResponseSchema
  );
};

/**
 * 인연운 해석 요청
 */
export const interpretRelationship = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<SectionResponse> => {
  return requestInterpretation(
    { ...request, requestType: "relationship" },
    SectionResponseSchema
  );
};

/**
 * 건강운 해석 요청
 */
export const interpretHealth = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<SectionResponse> => {
  return requestInterpretation(
    { ...request, requestType: "health" },
    SectionResponseSchema
  );
};

/**
 * 종합 해석 요청
 */
export const interpretSummary = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<SummaryResponse> => {
  return requestInterpretation(
    { ...request, requestType: "summary" },
    SummaryResponseSchema
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
    const [preview, wealth] = await Promise.all([
      interpretPreview(request),
      interpretWealth(request),
    ]);

    const [career, relationship] = await Promise.all([
      interpretCareer(request),
      interpretRelationship(request),
    ]);

    const [health, summaryResult] = await Promise.all([
      interpretHealth(request),
      interpretSummary(request),
    ]);

    return {
      preview,
      details: {
        summary: summaryResult.summary,
        wealth,
        career,
        relationship,
        health,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        model: "solar-pro",
        isFallback: false,
      },
    };
  }

  const preview = await interpretPreview(request);

  return {
    preview,
    details: null,
    meta: {
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
export const createFallbackInterpretation = (
  error: Error
): FortuneInterpretation => {
  const isRateLimited =
    error instanceof AIError && error.code === "RATE_LIMITED";

  return {
    preview: {
      headline: "🔮 운세 분석 준비 중",
      description: isRateLimited
        ? "현재 많은 분들이 이용 중입니다. 잠시 후 다시 시도해주세요."
        : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    },
    details: null,
    meta: {
      generatedAt: new Date().toISOString(),
      model: "solar-pro",
      isFallback: true,
    },
  };
};
