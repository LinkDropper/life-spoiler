import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

import { AIError } from "./errors";
import type { OutputValidatorOptions } from "./output-validator";
import { CURRENT_MODEL_NAME } from "./provider";
import { generatePastLifeImage } from "./image-generator";
import {
  categoryLabelToExistenceType,
  formatCoordinatesForPrompt,
  generatePastLifeCoordinates,
} from "./past-life-seed";
import { getPastLifePrompts } from "./prompts";
import { completeWithViolationRetry, withJudgment } from "./violation-retry";
import type {
  GeminiResponseSchema,
  GeminiSchemaProperty,
  PalaceData,
  PastLifeBirthResponse,
  PastLifeConnectionsResponse,
  PastLifeContrastResponse,
  PastLifeEndResponse,
  PastLifeFortuneInterpretation,
  PastLifeInterpretationType,
  PastLifeJourneyResponse,
  PastLifeLessonsResponse,
  PastLifeProfileCardResponse,
  PastLifeSpoilerResponse,
  PastLifeStatsResponse,
  PastLifeTracesResponse,
  PastLifeWorldResponse,
  ZiweiInterpretationRequest,
} from "./types";
import {
  PastLifeBirthResponseSchema,
  PastLifeConnectionsResponseSchema,
  PastLifeContrastResponseSchema,
  PastLifeEndResponseSchema,
  PastLifeJourneyResponseSchema,
  PastLifeLessonsResponseSchema,
  PastLifeProfileCardResponseSchema,
  PastLifeSpoilerResponseSchema,
  PastLifeStatsResponseSchema,
  PastLifeTracesResponseSchema,
  PastLifeWorldResponseSchema,
} from "./types";

// ============================================================
// Gemini responseSchema 정의 (전생 운세)
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
 * 전생 스포일러 스키마.
 * 신규: subSections + oneLiner / 레거시: summary.
 */
const PAST_LIFE_SPOILER_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    existenceType: {
      type: "string",
      enum: [
        "human",
        "mammal",
        "bird",
        "reptile",
        "fish",
        "insect",
        "plant",
        "fungi",
        "mineral",
        "weather",
        "landform",
      ],
    },
    description: { type: "string" },
    summary: { type: "string" },
    subSections: {
      type: "array",
      items: SUB_SECTION_SCHEMA,
      minItems: 3,
      maxItems: 5,
    },
    oneLiner: { type: "string" },
    imagePrompt: { type: "string" },
  },
  required: ["headline", "existenceType", "description", "imagePrompt"],
};

/** 전생 탄생 스키마 */
const PAST_LIFE_BIRTH_SCHEMA: GeminiResponseSchema = {
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
  },
  required: ["headline"],
};

/** 전생 삶 스키마 */
const PAST_LIFE_JOURNEY_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          period: { type: "string" },
          event: { type: "string" },
        },
        required: ["period", "event"],
      },
      minItems: 3,
      maxItems: 5,
    },
    content: { type: "string" },
    subSections: {
      type: "array",
      items: SUB_SECTION_SCHEMA,
      minItems: 2,
      maxItems: 4,
    },
    oneLiner: { type: "string" },
  },
  required: ["headline", "events"],
};

/** 전생 죽음과 카르마 스키마 */
const PAST_LIFE_END_SCHEMA: GeminiResponseSchema = {
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
    lastWords: { type: "string" },
  },
  required: ["headline", "lastWords"],
};

/** 전생 인연 스키마 */
const PAST_LIFE_CONNECTIONS_SCHEMA: GeminiResponseSchema = {
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
  },
  required: ["headline"],
};

/** 전생 프로필 카드 스키마 */
const PAST_LIFE_PROFILE_CARD_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    hashtags: {
      type: "array",
      items: { type: "string" },
    },
    spectrums: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          leftLabel: { type: "string" },
          rightLabel: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 100 },
        },
        required: ["label", "leftLabel", "rightLabel", "score"],
      },
    },
    epitaph: { type: "string" },
  },
  required: ["hashtags", "spectrums", "epitaph"],
};

/** 전생 능력치 스키마 */
const PAST_LIFE_STATS_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    stats: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 100 },
        },
        required: ["label", "score"],
      },
    },
  },
  required: ["title", "stats"],
};

/** 전생 vs 현생 대비 스키마 */
const PAST_LIFE_CONTRAST_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    contrasts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          aspect: { type: "string" },
          pastLife: { type: "string" },
          presentLife: { type: "string" },
        },
        required: ["aspect", "pastLife", "presentLife"],
      },
      minItems: 3,
      maxItems: 4,
    },
  },
  required: ["contrasts"],
};

/** 전생 교훈 스키마 */
const PAST_LIFE_LESSONS_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    lessons: {
      type: "array",
      items: {
        type: "object",
        properties: {
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
        required: ["headline"],
      },
      minItems: 2,
      maxItems: 3,
    },
  },
  required: ["lessons"],
};

/** 전생 세계 스키마 */
const PAST_LIFE_WORLD_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    era: { type: "string" },
    location: { type: "string" },
    atmosphere: { type: "string" },
    socialRole: { type: "string" },
    description: { type: "string" },
  },
  required: ["era", "location", "atmosphere", "socialRole", "description"],
};

/** 전생 흔적 스키마 */
const PAST_LIFE_TRACES_SCHEMA: GeminiResponseSchema = {
  type: "object",
  properties: {
    traces: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          trace: { type: "string" },
          origin: { type: "string" },
        },
        required: ["category", "trace", "origin"],
      },
      minItems: 3,
      maxItems: 4,
    },
  },
  required: ["traces"],
};

/** 해석 유형별 스키마 매핑 */
const PAST_LIFE_RESPONSE_SCHEMA_MAP: Record<
  PastLifeInterpretationType,
  GeminiResponseSchema
> = {
  past_life_spoiler: PAST_LIFE_SPOILER_SCHEMA,
  past_life_birth: PAST_LIFE_BIRTH_SCHEMA,
  past_life_journey: PAST_LIFE_JOURNEY_SCHEMA,
  past_life_end: PAST_LIFE_END_SCHEMA,
  past_life_connections: PAST_LIFE_CONNECTIONS_SCHEMA,
  past_life_profile_card: PAST_LIFE_PROFILE_CARD_SCHEMA,
  past_life_stats: PAST_LIFE_STATS_SCHEMA,
  past_life_contrast: PAST_LIFE_CONTRAST_SCHEMA,
  past_life_lessons: PAST_LIFE_LESSONS_SCHEMA,
  past_life_world: PAST_LIFE_WORLD_SCHEMA,
  past_life_traces: PAST_LIFE_TRACES_SCHEMA,
};

// ============================================================
// KO 스키마 (인생 운세 재설계와 같은 순서)
// ============================================================
//
// strict 모드는 속성 순서대로 생성하므로 judgment(판정) → 본문 → 제목 순으로 둔다.
// 스포일러는 존재 유형을 먼저 정하고, 이미지 프롬프트는 본문을 다 쓴 뒤 맨 끝에 써서
// 그림이 글과 같은 존재를 그리게 한다. 레거시 칸(summary, content)은 뺀다.

const subSections = (count: number): GeminiSchemaProperty => ({
  type: "array",
  items: SUB_SECTION_SCHEMA,
  minItems: count,
  maxItems: count,
});

const narrative = (
  extra: Record<string, GeminiSchemaProperty> = {},
  before: Record<string, GeminiSchemaProperty> = {}
): GeminiResponseSchema =>
  withJudgment({
    type: "object",
    properties: {
      ...before,
      subSections: subSections(3),
      headline: { type: "string" },
      oneLiner: { type: "string" },
      ...extra,
    },
    required: [
      ...Object.keys(before),
      "subSections",
      "headline",
      "oneLiner",
      ...Object.keys(extra),
    ],
  });

const existenceTypeProperty = (
  PAST_LIFE_SPOILER_SCHEMA.properties as Record<string, GeminiSchemaProperty>
).existenceType;

const KO_SPOILER_SCHEMA: GeminiResponseSchema = (() => {
  const base = narrative({
    description: { type: "string" },
    imagePrompt: { type: "string" },
  });
  // existenceType → judgment → 본문 → headline → description → oneLiner → imagePrompt
  return {
    ...base,
    properties: { existenceType: existenceTypeProperty, ...base.properties },
    required: ["existenceType", ...(base.required ?? [])],
  };
})();

const withCount = (
  schema: GeminiResponseSchema,
  key: string,
  count: number
): GeminiResponseSchema => ({
  ...schema,
  properties: {
    ...schema.properties,
    [key]: {
      ...(schema.properties?.[key] as GeminiSchemaProperty),
      minItems: count,
      maxItems: count,
    },
  },
});

const KO_PAST_LIFE_RESPONSE_SCHEMA_MAP: Record<
  PastLifeInterpretationType,
  GeminiResponseSchema
> = {
  past_life_spoiler: KO_SPOILER_SCHEMA,
  past_life_birth: narrative(),
  past_life_journey: narrative(
    {},
    {
      events: PAST_LIFE_JOURNEY_SCHEMA.properties
        ?.events as GeminiSchemaProperty,
    }
  ),
  past_life_end: narrative({ lastWords: { type: "string" } }),
  past_life_connections: narrative(),
  past_life_profile_card: withCount(
    withCount(PAST_LIFE_PROFILE_CARD_SCHEMA, "hashtags", 3),
    "spectrums",
    4
  ),
  past_life_stats: withCount(PAST_LIFE_STATS_SCHEMA, "stats", 5),
  past_life_contrast: PAST_LIFE_CONTRAST_SCHEMA,
  past_life_lessons: PAST_LIFE_LESSONS_SCHEMA,
  past_life_world: PAST_LIFE_WORLD_SCHEMA,
  past_life_traces: PAST_LIFE_TRACES_SCHEMA,
};

const isKoRequest = (language?: Locale): boolean =>
  (language ?? defaultLocale) === "ko";

/**
 * 이미지 프롬프트와 존재 유형은 화면에 나오지 않아 검사하지 않는다.
 * 기상 현상·지형 전생은 "강의 흐름", "기온"처럼 추상어 목록의 말이 실제 뜻으로 쓰여 그 검사를 끈다.
 */
const validatorOptionsFor = (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): OutputValidatorOptions => {
  const locale = request.language ?? defaultLocale;
  const { category } = generatePastLifeCoordinates(request, locale);
  const type = categoryLabelToExistenceType(category);
  return {
    skipKeys: ["imagePrompt", "existenceType"],
    ...(type === "weather" || type === "landform"
      ? { skipCodes: ["ABSTRACT_WORD"] }
      : {}),
  };
};

/**
 * 신규(subSections+oneLiner) / 레거시(content) 어느 쪽이든 안전하게 첫 문장 발췌.
 * previousContext 불릿에 들어가므로 모든 whitespace 평탄화.
 */
const extractPastLifeOpening = (
  subSections: { heading: string; body: string }[] | undefined,
  oneLiner: string | undefined,
  legacyText: string | undefined,
  maxLength = 100
): string => {
  const candidate =
    subSections?.[0]?.body?.trim() ||
    oneLiner?.trim() ||
    legacyText?.split("\n\n")[0]?.trim() ||
    "";
  return candidate.replace(/\s+/g, " ").slice(0, maxLength).trim();
};

// ============================================================
// 데이터 포맷팅
// ============================================================

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
 * 전생 운세에 필요한 궁 이름 목록
 */
const PAST_LIFE_PALACES = [
  "복덕궁",
  "부모궁",
  "전택궁",
  "명궁",
  "질액궁",
  "부처궁",
];

/**
 * 전생 운세용 명반 데이터를 AI에게 전달할 문자열로 포맷팅
 *
 * 전생 좌표(시드 기반)가 항상 데이터의 맨 앞에 와서, 모든 단계 프롬프트가
 * 동일한 무대·시대·카테고리 위에서 일관되게 작동하도록 한다.
 */
const formatPastLifeDataForAI = (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): string => {
  const { user, chart, palaces } = request;
  const locale = request.language ?? defaultLocale;
  const coordinates = generatePastLifeCoordinates(request, locale);
  const coordinateBlock = formatCoordinatesForPrompt(coordinates, locale);

  if (isKoRequest(request.language)) {
    // KO: 지시문 문체가 출력에 새지 않도록 헤더도 한국어로 쓴다 (명반 원문은 내부용)
    let koStr = `${coordinateBlock}

## 손님 정보
- 성별: ${user.gender === "male" ? "남성" : "여성"}

## 명반 (내부용, 이름은 출력하지 않아요)
- 오행국: ${chart.wuxingJu}
- 화록: ${chart.sihua.hualu.star} (${chart.sihua.hualu.palace})
- 화권: ${chart.sihua.huaquan.star} (${chart.sihua.huaquan.palace})
- 화과: ${chart.sihua.huake.star} (${chart.sihua.huake.palace})
- 화기: ${chart.sihua.huaji.star} (${chart.sihua.huaji.palace})`;
    for (const palaceName of PAST_LIFE_PALACES) {
      const palace = palaces[palaceName];
      if (!palace) continue;
      const stars = (list: PalaceData["mainStars"]) =>
        list
          .map(
            (st) =>
              `${st.name}${st.brightness ? `(${st.brightness})` : ""}${st.sihua ? `[${st.sihua}]` : ""}`
          )
          .join(", ") || "없음";
      koStr += `\n- ${palaceName}: 주성 ${stars(palace.mainStars)} / 보조 ${stars(palace.minorStars)}`;
    }
    return previousContext ? `${koStr}\n\n${previousContext}` : koStr;
  }

  let dataStr = `${coordinateBlock}

## User Info
- gender: ${user.gender === "male" ? "남성" : "여성"}
- lunarBirthInfo: ${user.lunarBirthInfo}

## Chart Info
- wuxingJu: ${chart.wuxingJu}
- mingGongPosition: ${chart.mingGongPosition}
- shenGongPosition: ${chart.shenGongPosition}

## Sihua Info
- hualu: ${chart.sihua.hualu.star} (${chart.sihua.hualu.palace})
- huaquan: ${chart.sihua.huaquan.star} (${chart.sihua.huaquan.palace})
- huake: ${chart.sihua.huake.star} (${chart.sihua.huake.palace})
- huaji: ${chart.sihua.huaji.star} (${chart.sihua.huaji.palace})`;

  // 전생 해석에 필요한 궁 데이터 추가
  for (const palaceName of PAST_LIFE_PALACES) {
    const palace = palaces[palaceName];
    if (palace) {
      dataStr += `\n\n## ${palaceName}
${formatPalaceData(palace)}`;
    }
  }

  // 이전 해석 맥락 (스테이지 간 일관성)
  if (previousContext) {
    dataStr += `\n\n${previousContext}`;
  }

  return dataStr;
};

// ============================================================
// 전생 운세 해석 서비스
// ============================================================

/**
 * 특정 유형의 전생 해석 요청
 */
const requestPastLifeInterpretation = async <T>(
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  interpretationType: PastLifeInterpretationType,
  schema: { parse: (data: unknown) => T },
  previousContext?: string
): Promise<T> => {
  const prompts = getPastLifePrompts(request.language);
  const chartData = formatPastLifeDataForAI(request, previousContext);
  const userPrompt = prompts.userPrompts[interpretationType];

  const fullUserPrompt = `${chartData}

---

${userPrompt}`;

  const responseSchema = isKoRequest(request.language)
    ? KO_PAST_LIFE_RESPONSE_SCHEMA_MAP[interpretationType]
    : PAST_LIFE_RESPONSE_SCHEMA_MAP[interpretationType];

  // 금지 용어·문체 위반이 있으면 피드백을 붙여 1회 재생성한다 (인생 운세와 같은 검사기)
  const { parsed } = await completeWithViolationRetry(
    [
      { role: "system", content: prompts.systemPrompt },
      { role: "user", content: fullUserPrompt },
    ],
    {
      language: request.language,
      completion: { responseSchema },
      validator: validatorOptionsFor(request),
      label: `past-life:${interpretationType}`,
    }
  );

  // spoiler.existenceType은 schema enum 11종 중 하나여야 하지만, LLM이 좌표
  // 라벨("인간"·"포유류 (육상)"·"Land mammal" 등)을 그대로 출력해 zod 검증이
  // 깨지는 경우를 대비해 parse 직전 정규화한다.
  if (
    interpretationType === "past_life_spoiler" &&
    parsed !== null &&
    typeof parsed === "object" &&
    "existenceType" in parsed &&
    typeof (parsed as { existenceType: unknown }).existenceType === "string"
  ) {
    const obj = parsed as { existenceType: string };
    obj.existenceType = categoryLabelToExistenceType(obj.existenceType);
  }

  try {
    return schema.parse(parsed);
  } catch (error) {
    throw new AIError("AI 응답이 예상된 형식과 다릅니다.", {
      code: "RESPONSE_PARSE_FAILED",
      originalError: error as Error,
      requestType: interpretationType,
    });
  }
};

/**
 * 전생 스포일러 해석 요청
 */
const interpretPastLifeSpoiler = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): Promise<PastLifeSpoilerResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_spoiler",
    PastLifeSpoilerResponseSchema
  );
};

/**
 * 전생 탄생 해석 요청
 */
const interpretPastLifeBirth = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeBirthResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_birth",
    PastLifeBirthResponseSchema,
    previousContext
  );
};

/**
 * 전생 삶 해석 요청
 */
const interpretPastLifeJourney = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeJourneyResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_journey",
    PastLifeJourneyResponseSchema,
    previousContext
  );
};

/**
 * 전생 죽음과 카르마 해석 요청
 */
const interpretPastLifeEnd = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeEndResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_end",
    PastLifeEndResponseSchema,
    previousContext
  );
};

/**
 * 전생 인연 해석 요청
 */
const interpretPastLifeConnections = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeConnectionsResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_connections",
    PastLifeConnectionsResponseSchema,
    previousContext
  );
};

/**
 * 전생 프로필 카드 해석 요청
 */
const interpretPastLifeProfileCard = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeProfileCardResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_profile_card",
    PastLifeProfileCardResponseSchema,
    previousContext
  );
};

/**
 * 전생 능력치 해석 요청
 */
const interpretPastLifeStats = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeStatsResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_stats",
    PastLifeStatsResponseSchema,
    previousContext
  );
};

/**
 * 전생 vs 현생 대비 해석 요청
 */
const interpretPastLifeContrast = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeContrastResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_contrast",
    PastLifeContrastResponseSchema,
    previousContext
  );
};

/**
 * 전생 교훈 해석 요청
 */
const interpretPastLifeLessons = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeLessonsResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_lessons",
    PastLifeLessonsResponseSchema,
    previousContext
  );
};

/**
 * 전생 세계 해석 요청
 */
const interpretPastLifeWorld = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeWorldResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_world",
    PastLifeWorldResponseSchema,
    previousContext
  );
};

/**
 * 전생 흔적 해석 요청
 */
const interpretPastLifeTraces = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): Promise<PastLifeTracesResponse> => {
  return requestPastLifeInterpretation(
    request,
    "past_life_traces",
    PastLifeTracesResponseSchema,
    previousContext
  );
};

// ============================================================
// 전체 전생 운세 해석 (3단계 병렬 파이프라인)
// ============================================================

/**
 * 전생 운세 전체 해석 생성
 *
 * 4단계 병렬 파이프라인:
 * - Stage 1: spoiler + birth (병렬)
 * - Stage 2: journey + end + stats (병렬, Stage 1 맥락 전달)
 * - Stage 3: connections + contrast + lessons + profileCard (병렬, Stage 1~2 맥락 전달)
 * - Image generation: Stage 1 완료 후 시작, Stage 2~3과 병렬 진행
 */
export const generatePastLifeInterpretation = async (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  profileId: string
): Promise<PastLifeFortuneInterpretation> => {
  // Stage 1: 스포일러. 탄생은 스포일러가 정한 존재를 알아야 해서 Stage 2로 옮겼다
  // (예전에는 병렬이라 두 섹션이 서로 다른 종을 고를 수 있었다).
  const spoiler = await interpretPastLifeSpoiler(request);

  // Stage 1 완료 후 이미지 생성 시작 (Stage 2~3과 병렬 진행)
  const imagePromise = spoiler.imagePrompt
    ? generatePastLifeImage(spoiler.imagePrompt, profileId)
    : Promise.resolve(null);

  // 앞 섹션이 쓴 말. 지시문 문체가 출력에 새지 않도록 해요체로 쓴다.
  const spoilerOpening = extractPastLifeOpening(
    spoiler.subSections,
    spoiler.oneLiner,
    spoiler.summary,
    100
  );
  const stage1Context = `## 앞 섹션에서 정한 것
- 전생 존재: ${spoiler.headline} (${spoiler.existenceType})
- 설명: ${spoiler.description}
- 스포일러 첫 문단: "${spoilerOpening}"
이 존재 그대로 이어서 쓰고, 위와 같은 문장 구조와 낱말은 피해요.`;

  // Stage 2: 탄생 + 삶 + 마지막 + 능력치 + 세계 (병렬, Stage 1 맥락 전달)
  const [birth, journey, end, stats, world] = await Promise.all([
    interpretPastLifeBirth(request, stage1Context),
    interpretPastLifeJourney(request, stage1Context),
    interpretPastLifeEnd(request, stage1Context),
    interpretPastLifeStats(request, stage1Context),
    interpretPastLifeWorld(request, stage1Context),
  ]);

  // Stage 1~2 맥락 생성
  const stage2Context = `## 앞 섹션에서 정한 것
- 전생 존재: ${spoiler.headline} (${spoiler.existenceType})
- 전생 설명: ${spoiler.description}
- 탄생: ${birth.headline}
- 삶: ${journey.headline}
- 죽음: ${end.headline}
- 마지막 한마디: "${end.lastWords}"
- 핵심 사건: ${journey.events.map((e) => e.event.slice(0, 30)).join(", ")}
- 전생 칭호: ${stats.title}
- 능력치: ${stats.stats.map((s) => `${s.label}=${s.score}`).join(", ")}
- 세계: ${world.era}, ${world.location}
지금까지의 전생 이야기와 이어지게 쓰고, 위와 같은 문장 구조와 낱말은 피해요.`;

  // Stage 3: 인연 + 대비 + 교훈 + 프로필 카드 + 흔적 (병렬, Stage 1~2 맥락 전달)
  const [connections, contrast, lessons, profileCard, traces] =
    await Promise.all([
      interpretPastLifeConnections(request, stage2Context),
      interpretPastLifeContrast(request, stage2Context),
      interpretPastLifeLessons(request, stage2Context),
      interpretPastLifeProfileCard(request, stage2Context),
      interpretPastLifeTraces(request, stage2Context),
    ]);

  // 이미지 생성 완료 대기 (Stage 2~3과 병렬로 이미 진행 중)
  const imageUrl = await imagePromise;

  return {
    spoiler,
    birth,
    journey,
    end,
    connections,
    profileCard,
    stats,
    contrast,
    lessons,
    world,
    traces,
    imageUrl,
    meta: {
      generatedAt: new Date().toISOString(),
      model: CURRENT_MODEL_NAME,
      isFallback: false,
    },
  };
};

// ============================================================
// 폴백 응답 생성
// ============================================================

/**
 * AI 요청 실패 시 전생 운세 폴백 응답 생성
 */
export const createPastLifeFallbackInterpretation = (
  error: Error
): PastLifeFortuneInterpretation => {
  const isRateLimited =
    error instanceof AIError && error.code === "RATE_LIMITED";

  return {
    spoiler: {
      headline: "",
      existenceType: "human",
      description: "",
      summary: isRateLimited
        ? "현재 많은 분들이 이용 중입니다. 잠시 후 다시 시도해주세요."
        : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      imagePrompt: "",
    },
    birth: { headline: "", content: "" },
    journey: {
      headline: "",
      events: [],
      content: "",
    },
    end: { headline: "", content: "", lastWords: "" },
    connections: { headline: "", content: "" },
    profileCard: {
      hashtags: [],
      spectrums: [],
      epitaph: "",
    },
    stats: { title: "", stats: [] },
    contrast: { contrasts: [] },
    lessons: { lessons: [] },
    world: {
      era: "",
      location: "",
      atmosphere: "",
      socialRole: "",
      description: "",
    },
    traces: { traces: [] },
    imageUrl: null,
    meta: {
      generatedAt: new Date().toISOString(),
      model: CURRENT_MODEL_NAME,
      isFallback: true,
    },
  };
};
