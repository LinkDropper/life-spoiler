import type { Locale } from "@/i18n/config";
import { BRANCH_INDEX_MAP } from "@/libs/zi-wei-dou-shu/constants/branches";
import { calculateSamBangSaJeong } from "@/libs/zi-wei-dou-shu/calculators/sam-bang";
import type { BranchIndex, Palace } from "@/libs/zi-wei-dou-shu/types";

import { AIError } from "./errors";
import { getPrompts } from "./prompts";
import type {
  AgeScenarioResponse,
  FortuneInterpretation,
  GeminiResponseSchema,
  InterpretationType,
  LifeSpoilerResponse,
  LifetimeCategoryResponse,
  LifetimeCoreScenarioResponse,
  PalaceData,
  ProfileTraitsResponse,
  ZiweiInterpretationRequest,
} from "./types";
import {
  AgeScenarioResponseSchema,
  LifeSpoilerResponseSchema,
  LifetimeCategoryResponseSchema,
  LifetimeCoreScenarioResponseSchema,
  ProfileTraitsResponseSchema,
} from "./types";
import { chatCompletion, parseJsonResponse, GEMINI_MODEL_NAME } from "./gemini";

// ============================================================
// Gemini responseSchema 정의
// ============================================================

/** Sub-section (heading + body) — 신규 구조화 응답용 */
const SUB_SECTION_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    heading: { type: "string" },
    body: { type: "string" },
  },
  required: ["heading", "body"],
};

/**
 * 인생 스포일러 스키마.
 * 신규 구조: subSections + oneLiner / 레거시: summary.
 * 두 형태 모두 허용하기 위해 summary·subSections·oneLiner 는 required 에서 제외.
 */
const LIFE_SPOILER_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    description: { type: "string" },
    summary: { type: "string" },
    subSections: {
      type: "array",
      items: SUB_SECTION_SCHEMA,
      minItems: 3,
      maxItems: 5,
    },
    oneLiner: { type: "string" },
  },
  required: ["headline", "description"],
};

/** 핵심 시나리오 스키마 */
const LIFETIME_CORE_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    content: { type: "string" },
    subSections: {
      type: "array",
      items: SUB_SECTION_SCHEMA,
      minItems: 3,
      maxItems: 5,
    },
    oneLiner: { type: "string" },
  },
  required: ["headline"],
};

/** 카테고리 응답 스키마 (재물/직업/인연/건강) */
const LIFETIME_CATEGORY_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    content: { type: "string" },
    subSections: {
      type: "array",
      items: SUB_SECTION_SCHEMA,
      minItems: 2,
      maxItems: 4,
    },
    oneLiner: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    score: { type: "integer", minimum: 0, maximum: 100 },
  },
  required: ["headline", "tags", "score"],
};

/** 나이대별 시나리오 스키마 */
const AGE_SCENARIOS_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    ageScenarios: {
      type: "array",
      items: {
        type: "object",
        properties: {
          period: { type: "string" },
          headline: { type: "string" },
          content: { type: "string" },
          bullets: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 4,
          },
          oneLiner: { type: "string" },
        },
        required: ["period", "headline"],
      },
    },
  },
  required: ["ageScenarios"],
};

/** 프로필 성향 분석 스키마 */
const PROFILE_TRAITS_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    hashtags: {
      type: "array",
      items: { type: "string" },
    },
    spectrums: {
      type: "object",
      properties: {
        activity: {
          type: "object",
          properties: {
            leftLabel: { type: "string" },
            rightLabel: { type: "string" },
            leftPercentage: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["leftLabel", "rightLabel", "leftPercentage"],
        },
        work: {
          type: "object",
          properties: {
            leftLabel: { type: "string" },
            rightLabel: { type: "string" },
            leftPercentage: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["leftLabel", "rightLabel", "leftPercentage"],
        },
        economy: {
          type: "object",
          properties: {
            leftLabel: { type: "string" },
            rightLabel: { type: "string" },
            leftPercentage: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["leftLabel", "rightLabel", "leftPercentage"],
        },
        romance: {
          type: "object",
          properties: {
            leftLabel: { type: "string" },
            rightLabel: { type: "string" },
            leftPercentage: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["leftLabel", "rightLabel", "leftPercentage"],
        },
      },
      required: ["activity", "work", "economy", "romance"],
    },
  },
  required: ["hashtags", "spectrums"],
};

/** 해석 유형별 스키마 매핑 */
const RESPONSE_SCHEMA_MAP: Record<InterpretationType, GeminiResponseSchema> = {
  life_spoiler: LIFE_SPOILER_SCHEMA,
  lifetime_core: LIFETIME_CORE_SCHEMA,
  lifetime_wealth: LIFETIME_CATEGORY_SCHEMA,
  lifetime_career: LIFETIME_CATEGORY_SCHEMA,
  lifetime_relationship: LIFETIME_CATEGORY_SCHEMA,
  lifetime_health: LIFETIME_CATEGORY_SCHEMA,
  lifetime_age_scenarios: AGE_SCENARIOS_SCHEMA,
  lifetime_profile_traits: PROFILE_TRAITS_SCHEMA,
};

/**
 * 신규/레거시 응답 어느 쪽이든 안전하게 첫 문장(요약)을 뽑아낸다.
 * - 신규: subSections[0].body 또는 oneLiner
 * - 레거시: summary/content 의 첫 단락
 * 섹션 간 중복 방지 컨텍스트 생성에만 쓰는 짧은 발췌.
 */
const extractOpeningLine = (
  subSections: { heading: string; body: string }[] | undefined,
  oneLiner: string | undefined,
  legacyText: string | undefined,
  maxLength = 80
): string => {
  const candidate =
    subSections?.[0]?.body?.trim() ||
    oneLiner?.trim() ||
    legacyText?.split("\n\n")[0]?.trim() ||
    "";
  // previousContext 는 "- 첫 문장: \"...\"" 형태의 불릿 안에 들어가므로
  // 줄바꿈이 들어가면 마크다운 구조가 깨진다. 공백으로 평탄화.
  return candidate.replace(/\s+/g, " ").slice(0, maxLength).trim();
};

// ============================================================
// 자미두수 해석 서비스
// ============================================================

/** 대운 정보가 필요한 해석 유형 */
const DAYUN_REQUIRED_TYPES: InterpretationType[] = [
  "lifetime_core",
  "lifetime_wealth",
  "lifetime_career",
  "lifetime_relationship",
  "lifetime_health",
  "lifetime_age_scenarios",
];

/** 대운 정보가 필요한 해석 유형인지 확인하는 타입 가드 */
const isDayunRequired = (type: InterpretationType): boolean => {
  return DAYUN_REQUIRED_TYPES.includes(type);
};

/** 해석 유형별 대상 궁 매핑 */
const PALACE_MAPPING: Record<InterpretationType, string> = {
  life_spoiler: "명궁",
  lifetime_core: "명궁",
  lifetime_wealth: "재백궁",
  lifetime_career: "관록궁",
  lifetime_relationship: "부처궁",
  lifetime_health: "질액궁",
  lifetime_age_scenarios: "명궁",
  lifetime_profile_traits: "명궁",
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
  minorStars: palaceData.minorStars.map((s) => ({
    name: s.name,
    brightness: (s.brightness || "평") as Palace["minorStars"][0]["brightness"],
  })),
  isShenGong: false,
});

/**
 * 명반 데이터를 AI에게 전달할 문자열로 포맷팅
 */
const formatChartDataForAI = (request: ZiweiInterpretationRequest): string => {
  const {
    user,
    chart,
    palaces,
    dayunPeriods,
    geokGuk,
    previousContext,
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

  // 해석 유형에 맞는 대상 궁 선택
  const targetPalaceName = PALACE_MAPPING[requestType];
  const targetPalace = palaces[targetPalaceName];

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
- huaji: ${chart.sihua.huaji.star} (${chart.sihua.huaji.palace})`;

  // 격국 분석 데이터 추가
  if (geokGuk && geokGuk.length > 0) {
    dataStr += `\n\n## Geok-Guk Analysis (격국)`;
    for (const gk of geokGuk) {
      dataStr += `\n- ${gk.name} [${gk.grade}] (${gk.palaceName}): ${gk.meaning}`;
    }
  }

  // 대상 궁 + 삼방사정 데이터
  dataStr += `\n\n## Target Palace: ${prompts.palaceNameMap[requestType]} (${targetPalaceName})
${targetPalace ? formatPalaceData(targetPalace) : "Palace data not available"}`;

  // 삼방사정 계산 및 추가
  if (targetPalace) {
    const branchIndex = branchStringToIndex(targetPalace.branch);
    if (branchIndex !== null) {
      // PalaceData를 Palace로 변환
      const palaceArray: Palace[] = Object.values(palaces)
        .map((pd) => {
          const bi = branchStringToIndex(pd.branch);
          if (bi === null) return null;
          return palaceDataToPalace(pd, bi);
        })
        .filter((p): p is Palace => p !== null);

      const samBang = calculateSamBangSaJeong(palaceArray, branchIndex);
      if (samBang) {
        dataStr += `\n\n## 삼방사정 Palaces (본궁 + 대궁 + 삼합1 + 삼합2)`;
        dataStr += `\n### Opposite (대궁: ${samBang.opposite.name})
${formatPalaceFromPalaceType(samBang.opposite)}`;
        dataStr += `\n### Triangle 1 (삼합: ${samBang.triangle1.name})
${formatPalaceFromPalaceType(samBang.triangle1)}`;
        dataStr += `\n### Triangle 2 (삼합: ${samBang.triangle2.name})
${formatPalaceFromPalaceType(samBang.triangle2)}`;
      }
    }
  }

  // 이전 해석 맥락 (섹션 간 중복 방지)
  if (previousContext) {
    dataStr += `\n\n${previousContext}`;
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
      let dayunSihuaStr = "";
      if (period.dayunSihua) {
        const palaceMapping = period.dayunSihua.hualuPalace
          ? ` | 록→${period.dayunSihua.hualu}(${period.dayunSihua.hualuPalace}), 권→${period.dayunSihua.huaquan}(${period.dayunSihua.huaquanPalace}), 과→${period.dayunSihua.huake}(${period.dayunSihua.huakePalace}), 기→${period.dayunSihua.huaji}(${period.dayunSihua.huajiPalace})`
          : ` | dayunSihua: 록→${period.dayunSihua.hualu}, 권→${period.dayunSihua.huaquan}, 과→${period.dayunSihua.huake}, 기→${period.dayunSihua.huaji}`;
        dayunSihuaStr = palaceMapping;
      }
      dataStr += `\n- ${period.period} (${period.palaceName}): ${starsStr}${sihuaStr}${dayunSihuaStr}`;
    }
    if (user.currentAge) {
      dataStr += `\n- **Focus on current age ${user.currentAge} Dayun period!**`;
    }
  }

  return dataStr;
};

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
    palace.minorStars.length > 0
      ? palace.minorStars
          .map((s) => {
            let str = s.name;
            if (s.sihua) str += `[${s.sihua}]`;
            return str;
          })
          .join(", ")
      : "None";

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

  const responseSchema = RESPONSE_SCHEMA_MAP[request.requestType];

  const response = await chatCompletion(
    [
      { role: "system", content: prompts.ziweiSystemPrompt },
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

/**
 * 프로필 성향 분석 요청 (v2)
 */
export const interpretProfileTraits = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<ProfileTraitsResponse> => {
  return requestInterpretation(
    { ...request, requestType: "lifetime_profile_traits" },
    ProfileTraitsResponseSchema
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
    // 1단계: 인생 스포일러 + 핵심 시나리오 + 프로필 성향
    const [lifeSpoiler, coreScenario, profileTraits] = await Promise.all([
      interpretLifeSpoiler(request),
      interpretLifetimeCore(request),
      interpretProfileTraits(request),
    ]);

    // 이전 해석 맥락 생성 (섹션 간 중복 방지)
    // 신규 구조(subSections+oneLiner)와 레거시(summary/content) 모두 안전 처리
    const lifeSpoilerOpening = extractOpeningLine(
      lifeSpoiler.subSections,
      lifeSpoiler.oneLiner,
      lifeSpoiler.summary
    );
    const stage1Context = `## 이미 사용한 표현 (절대 반복 금지!)
- 스포일러 headline: "${lifeSpoiler.headline}"
- 시나리오 headline: "${coreScenario.headline}"
- 스포일러 첫 문장: "${lifeSpoilerOpening}"
위 headline과 같은 구조·어휘·패턴을 사용하지 마세요. 완전히 다른 표현을 창작하세요.`;
    const requestWithContext = { ...request, previousContext: stage1Context };

    // 2단계: 상세 시나리오 (재물, 직업) - 맥락 전달
    const [wealth, career] = await Promise.all([
      interpretLifetimeWealth(requestWithContext),
      interpretLifetimeCareer(requestWithContext),
    ]);

    // 3단계: 상세 시나리오 (인연, 건강) - 이전 headline 모두 전달
    const wealthOpening = extractOpeningLine(
      wealth.subSections,
      wealth.oneLiner,
      wealth.content
    );
    const careerOpening = extractOpeningLine(
      career.subSections,
      career.oneLiner,
      career.content
    );
    const stage2Context = `## 이미 사용한 표현 (절대 반복 금지!)
- 스포일러 headline: "${lifeSpoiler.headline}"
- 시나리오 headline: "${coreScenario.headline}"
- 재물 headline: "${wealth.headline}"
- 직업 headline: "${career.headline}"
- 스포일러 첫 문장: "${lifeSpoilerOpening}"
- 재물 첫 문장: "${wealthOpening}"
- 직업 첫 문장: "${careerOpening}"
위 headline·첫 문장과 같은 구조·어휘·패턴을 사용하지 마세요.`;
    const requestWithStage2Context = {
      ...request,
      previousContext: stage2Context,
    };

    const [relationship, health] = await Promise.all([
      interpretLifetimeRelationship(requestWithStage2Context),
      interpretLifetimeHealth(requestWithStage2Context),
    ]);

    // 4단계: 나이대별 시나리오 - 맥락 전달
    const ageResult = await interpretAgeScenarios(requestWithContext);

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
      profileTraits,
      meta: {
        generatedAt: new Date().toISOString(),
        model: GEMINI_MODEL_NAME,
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
      model: GEMINI_MODEL_NAME,
      isFallback: true,
    },
  };
};
