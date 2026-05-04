import { AIError } from "./errors";
import { chatCompletion, parseJsonResponse, GEMINI_MODEL_NAME } from "./gemini";
import { generatePastLifeImage } from "./image-generator";
import { getPastLifePrompts } from "./prompts";
import type {
  GeminiResponseSchema,
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
      enum: ["human", "animal", "plant", "insect", "nature"],
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
 */
const formatPastLifeDataForAI = (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  previousContext?: string
): string => {
  const { user, chart, palaces } = request;

  let dataStr = `## User Info
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

  const responseSchema = PAST_LIFE_RESPONSE_SCHEMA_MAP[interpretationType];

  const response = await chatCompletion(
    [
      { role: "system", content: prompts.systemPrompt },
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
  // Stage 1: 스포일러 + 탄생 (병렬)
  const [spoiler, birth] = await Promise.all([
    interpretPastLifeSpoiler(request),
    interpretPastLifeBirth(request),
  ]);

  // Stage 1 완료 후 이미지 생성 시작 (Stage 2~3과 병렬 진행)
  const imagePromise = spoiler.imagePrompt
    ? generatePastLifeImage(spoiler.imagePrompt, profileId)
    : Promise.resolve(null);

  // Stage 1 맥락 생성 (신구조/레거시 모두 안전)
  const birthOpening = extractPastLifeOpening(
    birth.subSections,
    birth.oneLiner,
    birth.content,
    100
  );
  const stage1Context = `## 이전 섹션 맥락 (일관성 유지, 표현 반복 금지)
- 전생 존재: ${spoiler.headline} (${spoiler.existenceType})
- 전생 설명: ${spoiler.description}
- 탄생 headline: "${birth.headline}"
- 탄생 첫 문장: "${birthOpening}"
위 표현과 같은 구조·어휘·패턴을 사용하지 마세요. 완전히 다른 표현을 창작하세요.
전생 존재 유형(${spoiler.existenceType})에 맞는 서사 톤을 유지하세요.`;

  // Stage 2: 삶 + 죽음과 카르마 + 능력치 + 세계 (병렬, Stage 1 맥락 전달)
  const [journey, end, stats, world] = await Promise.all([
    interpretPastLifeJourney(request, stage1Context),
    interpretPastLifeEnd(request, stage1Context),
    interpretPastLifeStats(request, stage1Context),
    interpretPastLifeWorld(request, stage1Context),
  ]);

  // Stage 1~2 맥락 생성
  const stage2Context = `## 이전 섹션 맥락 (일관성 유지, 표현 반복 금지)
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
위 headline·표현과 같은 구조·어휘를 사용하지 마세요.
전생 존재 유형(${spoiler.existenceType})에 맞는 서사 톤을 유지하세요.
지금까지의 전생 서사 전체를 종합하여 응답하세요.`;

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
      model: GEMINI_MODEL_NAME,
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
    world: { era: "", location: "", atmosphere: "", socialRole: "", description: "" },
    traces: { traces: [] },
    imageUrl: null,
    meta: {
      generatedAt: new Date().toISOString(),
      model: GEMINI_MODEL_NAME,
      isFallback: true,
    },
  };
};
