import { AIError } from "./errors";
import { PALACE_NAME_MAP, USER_PROMPTS, ZIWEI_SYSTEM_PROMPT } from "./prompts";
import type {
  FortuneInterpretation,
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

/** 대운 정보가 필요한 해석 유형 */
const DAYUN_REQUIRED_TYPES = [
  "wealth",
  "career",
  "relationship",
  "health",
  "summary",
] as const;

/**
 * 명반 데이터를 AI에게 전달할 문자열로 포맷팅
 */
const formatChartDataForAI = (request: ZiweiInterpretationRequest): string => {
  const {
    user,
    chart,
    targetPalace,
    oppositePalace,
    allPalaces,
    dayunPeriods,
    requestType,
  } = request;

  let dataStr = `## 사용자 정보
- 성별: ${user.gender === "male" ? "남성" : "여성"}
- 음력 생일: ${user.lunarBirthInfo}${user.currentAge ? `\n- 현재 나이: ${user.currentAge}세` : ""}

## 명반 기본 정보
- 오행국: ${chart.wuxingJu}
- 명궁 위치: ${chart.mingGongPosition}
- 신궁 위치: ${chart.shenGongPosition}

## 사화성 정보
- 화록: ${chart.sihua.hualu.star} (${chart.sihua.hualu.palace})
- 화권: ${chart.sihua.huaquan.star} (${chart.sihua.huaquan.palace})
- 화과: ${chart.sihua.huake.star} (${chart.sihua.huake.palace})
- 화기: ${chart.sihua.huaji.star} (${chart.sihua.huaji.palace})

## 분석 대상 궁: ${PALACE_NAME_MAP[requestType]}
${formatPalaceData(targetPalace)}`;

  if (oppositePalace) {
    dataStr += `\n\n## 대궁 (맞은편 궁)
${formatPalaceData(oppositePalace)}`;
  }

  // 대운 정보 추가 (timeline이 필요한 해석 유형에서만)
  if (
    dayunPeriods &&
    dayunPeriods.length > 0 &&
    (DAYUN_REQUIRED_TYPES as readonly string[]).includes(requestType)
  ) {
    dataStr += `\n\n## 대운(10년 주기) 흐름`;
    for (const period of dayunPeriods) {
      const starsStr =
        period.mainStars.length > 0 ? period.mainStars.join(", ") : "주성 없음";
      const sihuaStr =
        period.sihua && period.sihua.length > 0
          ? ` [${period.sihua.join(", ")}]`
          : "";
      dataStr += `\n- ${period.period} (${period.palaceName}): ${starsStr}${sihuaStr}`;
    }
    if (user.currentAge) {
      dataStr += `\n- **현재 ${user.currentAge}세 대운에 특히 주목해서 분석해줘!**`;
    }
  }

  if (allPalaces && requestType === "summary") {
    dataStr += `\n\n## 전체 12궁 배치`;
    for (const palace of allPalaces) {
      dataStr += `\n\n### ${palace.name} (${palace.branch})
${formatPalaceData(palace)}`;
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
  const chartData = formatChartDataForAI(request);
  const userPrompt = USER_PROMPTS[request.requestType];

  const fullUserPrompt = `${chartData}

---

${userPrompt}`;

  const response = await chatCompletion([
    { role: "system", content: ZIWEI_SYSTEM_PROMPT },
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
 * preview만 요청하거나, 상세 해석(재물/직업/인연/건강/종합)까지 모두 요청
 */
export const generateFullInterpretation = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  options: FullInterpretationOptions = {}
): Promise<FortuneInterpretation> => {
  const { includeDetails = false } = options;

  // 미리보기는 항상 요청
  const preview = await interpretPreview(request);

  let details: FortuneInterpretation["details"] = null;

  if (includeDetails) {
    // 상세 해석 병렬 요청
    const [wealth, career, relationship, health, summaryResult] =
      await Promise.all([
        interpretWealth(request),
        interpretCareer(request),
        interpretRelationship(request),
        interpretHealth(request),
        interpretSummary(request),
      ]);

    details = {
      summary: summaryResult.summary,
      wealth,
      career,
      relationship,
      health,
    };
  }

  return {
    preview,
    details,
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
