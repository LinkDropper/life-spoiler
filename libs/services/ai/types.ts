import { z } from "zod/v4";

import type { Locale } from "@/i18n/config";
import type { CompatibilityRelationshipType } from "@/libs/supabase/types";

// ============================================================
// Gemini API 타입
// ============================================================

export interface GeminiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

/** Gemini JSON Schema 타입 */
export interface GeminiSchemaProperty {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  description?: string;
  items?: GeminiSchemaProperty;
  properties?: Record<string, GeminiSchemaProperty>;
  required?: string[];
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
}

export interface GeminiResponseSchema {
  type: "object" | "array";
  properties?: Record<string, GeminiSchemaProperty>;
  items?: GeminiSchemaProperty;
  required?: string[];
}

export interface GeminiRequest {
  systemInstruction?: {
    parts: GeminiPart[];
  };
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: GeminiResponseSchema;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: GeminiPart[];
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ============================================================
// 자미두수 해석 요청 타입
// ============================================================

export type InterpretationType =
  | "life_spoiler"
  | "lifetime_core"
  | "lifetime_wealth"
  | "lifetime_career"
  | "lifetime_relationship"
  | "lifetime_health"
  | "lifetime_age_scenarios"
  | "lifetime_profile_traits";

export interface StarData {
  name: string;
  brightness: string;
  sihua?: string;
}

export interface PalaceData {
  name: string;
  branch: string;
  mainStars: StarData[];
  minorStars: StarData[];
  isShenGong?: boolean;
}

export interface SihuaData {
  hualu: { star: string; palace: string };
  huaquan: { star: string; palace: string };
  huake: { star: string; palace: string };
  huaji: { star: string; palace: string };
}

/** 화기 교차 분석 (궁합용) */
export interface HuajiCrossAnalysis {
  huajiPalaceA: string;
  huajiPalaceB: string;
  aHuajiAffectsBPalaces: string[];
  bHuajiAffectsAPalaces: string[];
  bothHuajiSameArea: boolean;
}

// 대운 사화 궁 매핑 (별 → 궁)
export interface DayunSihuaMapping {
  hualu: string;
  huaquan: string;
  huake: string;
  huaji: string;
  /** 사화가 위치한 궁 매핑 (예: "화록: 탐랑 → 재백궁") */
  hualuPalace?: string;
  huaquanPalace?: string;
  huakePalace?: string;
  huajiPalace?: string;
}

// 대운 데이터
export interface DayunData {
  period: string; // "2-11세", "12-21세" 등
  palaceName: string;
  mainStars: string[];
  sihua?: string[];
  dayunSihua?: DayunSihuaMapping;
}

// 사용자 상태 정보 (프로필 기반)
export interface UserStatusInfo {
  relationshipStatus?:
    | "solo"
    | "dating"
    | "married"
    | "divorced"
    | "custom"
    | null;
  relationshipStatusCustom?: string | null;
  occupationStatus?:
    | "student"
    | "job_seeker"
    | "homemaker"
    | "employed"
    | "self_employed"
    | "retired"
    | "custom"
    | null;
  occupationStatusCustom?: string | null;
}

/** 격국 분석 결과 (AI 전달용) */
export interface GeokGukData {
  name: string;
  meaning: string;
  grade: "대격" | "중격" | "소격";
  palaceName: string;
  stars: string[];
}

export interface ZiweiInterpretationRequest {
  user: {
    gender: "male" | "female";
    lunarBirthInfo: string;
    currentAge?: number;
  } & UserStatusInfo;
  chart: {
    wuxingJu: string;
    mingGongPosition: string;
    shenGongPosition: string;
    sihua: SihuaData;
  };
  /** 모든 12궁 데이터 (궁 이름 → 궁 데이터) */
  palaces: Record<string, PalaceData>;
  dayunPeriods?: DayunData[];
  /** 격국 분석 결과 */
  geokGuk?: GeokGukData[];
  /** 이전 섹션 해석 맥락 (섹션 간 일관성용) */
  previousContext?: string;
  requestType: InterpretationType;
  /** 응답 언어 (기본값: ko) */
  language?: Locale;
}

// ============================================================
// 해석 결과 타입 (인생 운세)
// ============================================================

// 인생 스포일러 응답 스키마 (제목 + 설명 + 본문 300~400자)
export const LifeSpoilerResponseSchema = z.object({
  headline: z.string(),
  description: z.string(),
  summary: z.string(),
});

export type LifeSpoilerResponse = z.infer<typeof LifeSpoilerResponseSchema>;

// 핵심 시나리오 응답 스키마 (제목 + 본문 700~800자)
export const LifetimeCoreScenarioResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
});

export type LifetimeCoreScenarioResponse = z.infer<
  typeof LifetimeCoreScenarioResponseSchema
>;

// 상세 시나리오 카테고리 응답 스키마 (제목 + 본문 200~300자 + 태그 1~2개 + 점수)
export const LifetimeCategoryResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
  tags: z.array(z.string()).min(1).max(2),
  score: z.number().min(0).max(100),
});

export type LifetimeCategoryResponse = z.infer<
  typeof LifetimeCategoryResponseSchema
>;

// 나이대별 시나리오 응답 스키마 (제목 + 본문 200~300자)
export const AgeScenarioResponseSchema = z.object({
  ageScenarios: z.array(
    z.object({
      period: z.string(), // "4~13세", "14~23세" 등
      headline: z.string(),
      content: z.string(),
    })
  ),
});

export type AgeScenarioResponse = z.infer<typeof AgeScenarioResponseSchema>;

// ============================================================
// 프로필 카드용 성향 분석 데이터 (v2)
// ============================================================

/** 양극성 스펙트럼 데이터 */
export const PolaritySpectrumSchema = z.object({
  leftLabel: z.string(),
  rightLabel: z.string(),
  leftPercentage: z.number().min(0).max(100),
});

export type PolaritySpectrum = z.infer<typeof PolaritySpectrumSchema>;

/** 프로필 카드용 성향 분석 응답 스키마 */
export const ProfileTraitsResponseSchema = z.object({
  hashtags: z
    .array(z.string())
    .min(2)
    .transform((arr) => [arr[0], arr[1]] as [string, string]),
  spectrums: z.object({
    activity: PolaritySpectrumSchema,
    work: PolaritySpectrumSchema,
    economy: PolaritySpectrumSchema,
    romance: PolaritySpectrumSchema,
  }),
});

export type ProfileTraitsResponse = z.infer<typeof ProfileTraitsResponseSchema>;

// ============================================================
// 최종 결과 타입 (인생 운세)
// ============================================================

export interface FortuneInterpretation {
  /** 인생 스포일러 (제목 + 본문 300~400자) */
  lifeSpoiler: LifeSpoilerResponse;
  /** 핵심 시나리오 (본문 700~800자) */
  coreScenario: LifetimeCoreScenarioResponse;
  /** 상세 시나리오 (본문 200~300자 + 태그 1~2개) */
  categories: {
    wealth: LifetimeCategoryResponse;
    career: LifetimeCategoryResponse;
    relationship: LifetimeCategoryResponse;
    health: LifetimeCategoryResponse;
  };
  /** 나이대별 시나리오 (제목 + 본문 200~300자) */
  ageScenarios: AgeScenarioResponse["ageScenarios"];
  /** 프로필 카드용 성향 분석 (v2, 신규 유저만) */
  profileTraits?: ProfileTraitsResponse;
  meta: {
    generatedAt: string;
    model: string;
    isFallback: boolean;
  };
}

// 레거시 타입 (하위 호환성)
/** @deprecated Use LifeSpoilerResponse instead */
export const PreviewResponseSchema = LifeSpoilerResponseSchema;
/** @deprecated Use LifeSpoilerResponse instead */
export type PreviewResponse = LifeSpoilerResponse;

/** @deprecated Use LifetimeCategoryResponseSchema instead */
export const SectionResponseSchema = z.object({
  title: z.string(),
  content: z.string(),
  highlights: z.array(z.string()),
});
/** @deprecated */
export type SectionResponse = z.infer<typeof SectionResponseSchema>;

/** @deprecated */
export const SummaryResponseSchema = z.object({
  summary: z.string(),
});
/** @deprecated */
export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

// ============================================================
// 올해 운세(유년) 타입
// ============================================================

export type YearlyInterpretationType =
  | "yearly_overview"
  | "yearly_core"
  | "yearly_wealth"
  | "yearly_career"
  | "yearly_relationship"
  | "yearly_health"
  | "yearly_monthly";

export interface YearlySihuaData {
  yearStemName: string;
  yearBranchName: string;
  hualu: { star: string; palace: string; palaceMeaning: string };
  huaquan: { star: string; palace: string; palaceMeaning: string };
  huake: { star: string; palace: string; palaceMeaning: string };
  huaji: { star: string; palace: string; palaceMeaning: string };
}

/** 유년 도화성 정보 (AI 프롬프트용) */
export interface YearlyPeachBlossomData {
  /** 도화 활성화 여부 */
  isPeachBlossomActive: boolean;
  /** 도화 관련 특이사항 */
  peachBlossomNotes: string[];
  /** 유년 홍란 위치 */
  hongluanPalace: string;
  /** 유년 천희 위치 */
  tianxiPalace: string;
}

/** 유년궁 정보 (AI 프롬프트용) */
export interface YearlyPalaceData {
  /** 유년 명궁 정보 */
  yearlyMingGong: {
    palaceName: string;
    mainStars: string[];
  };
  /** 유년 부처궁 정보 */
  yearlySpousePalace: {
    palaceName: string;
    hasPeachBlossom: boolean;
  };
}

/** 월별 운세 데이터 (AI 프롬프트용) */
export interface YearlyMonthlyFortuneData {
  month: number;
  monthStemName: string;
  monthBranchName: string;
  score: number;
  theme: string;
}

export interface YearlyInterpretationRequest {
  user: {
    gender: "male" | "female";
    lunarBirthInfo: string;
    currentAge: number;
  } & UserStatusInfo;
  chart: {
    wuxingJu: string;
    mingGongPosition: string;
  };
  targetYear: number;
  yearlySihua: YearlySihuaData;
  /** 유년궁 정보 */
  yearlyPalaces?: YearlyPalaceData;
  /** 유년 도화성 정보 */
  peachBlossom?: YearlyPeachBlossomData;
  currentDayun?: {
    period: string;
    palaceName: string;
    mainStars: string[];
  };
  /** 원국 12궁 데이터 (타고난 기운 vs 올해 기운 비교용) */
  natalPalaces?: Record<string, PalaceData>;
  /** 원국 사화 정보 */
  natalSihua?: SihuaData;
  /** 월별 운세 데이터 */
  monthlyFortunes?: YearlyMonthlyFortuneData[];
  requestType: YearlyInterpretationType;
  /** 이전 섹션 해석 맥락 (섹션 간 중복 방지) */
  previousContext?: string;
  /** 응답 언어 (기본값: ko) */
  language?: Locale;
}

// 올해 스포일러 응답 스키마 (제목 + 설명 + 태그 + 본문)
export const YearlyOverviewResponseSchema = z.object({
  headline: z.string(),
  description: z.string(),
  tags: z.array(z.string()).min(2).max(3),
  summary: z.string(),
});

export type YearlyOverviewResponse = z.infer<
  typeof YearlyOverviewResponseSchema
>;

// 핵심 시나리오 응답 스키마 (제목 + 본문)
export const YearlyCoreScenarioResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
});

export type YearlyCoreScenarioResponse = z.infer<
  typeof YearlyCoreScenarioResponseSchema
>;

// 상세 시나리오 카테고리 응답 스키마 (제목 + 재물운, 직업운, 인연운, 건강운 + 점수)
export const YearlyCategoryResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
  tags: z.array(z.string()).min(1).max(2),
  score: z.number().min(0).max(100),
});

export type YearlyCategoryResponse = z.infer<
  typeof YearlyCategoryResponseSchema
>;

// 월별 시나리오 응답 스키마
export const YearlyMonthlyFortuneSchema = z.object({
  monthlyFortunes: z.array(
    z.object({
      month: z.number(),
      headline: z.string(),
      content: z.string(),
    })
  ),
});

export type YearlyMonthlyFortune = z.infer<typeof YearlyMonthlyFortuneSchema>;

// 올해 운세 최종 결과
export interface YearlyFortuneInterpretation {
  /** 올해 스포일러 (제목 + 본문) */
  overview: YearlyOverviewResponse;
  /** 핵심 시나리오 (본문만) */
  coreScenario: YearlyCoreScenarioResponse;
  /** 상세 시나리오 (본문 + 태그 1~2개) */
  categories: {
    wealth: YearlyCategoryResponse;
    career: YearlyCategoryResponse;
    relationship: YearlyCategoryResponse;
    health: YearlyCategoryResponse;
  };
  /** 월별 시나리오 (제목 + 본문) */
  monthlyFortunes: YearlyMonthlyFortune["monthlyFortunes"];
  meta: {
    year: number;
    generatedAt: string;
    model: string;
    isFallback: boolean;
  };
}

// ============================================================
// 궁합 운세 타입
// ============================================================

export type CompatibilityInterpretationType =
  | "compatibility_overview"
  | "compatibility_insights"
  | "compatibility_core_scenarios"
  | "compatibility_communication"
  | "compatibility_growth"
  | "compatibility_emotion"
  | "compatibility_crisis";

/** 사전 분석된 성격 프로필 (궁합용) */
export interface PreAnalyzedPersonality {
  coreTraits: string[];
  communicationStyle: string[];
  emotionalPattern: string[];
  conflictStyle: string[];
  valueOrientation: string[];
  strengths: string[];
  weaknesses: string[];
  dominantElement: string;
  summary: string;
}

/** 카테고리별 사전 분석 결과 (궁합용) */
export interface PreAnalyzedCategory {
  relevantTraitsA: string[];
  relevantTraitsB: string[];
  starInteractions: string[];
  suggestedScore: number;
  analysisPoints: string[];
}

/** 사전 분석된 궁합 데이터 */
export interface PreAnalyzedCompatibility {
  communication: PreAnalyzedCategory;
  growth: PreAnalyzedCategory;
  emotion: PreAnalyzedCategory;
  crisis: PreAnalyzedCategory;
  scoreConstraints: Record<
    string,
    { min: number; max: number; suggested: number }
  >;
  keyDynamics: string[];
  synergyPoints: string[];
  tensionPoints: string[];
}

export interface CompatibilityInterpretationRequest {
  profileA: {
    name: string;
    gender: "male" | "female";
    lunarBirthInfo: string;
    birthYear: number;
    currentAge: number;
  };
  profileB: {
    name: string;
    gender: "male" | "female";
    lunarBirthInfo: string;
    birthYear: number;
    currentAge: number;
  };
  chartA: {
    wuxingJu: string;
    mingGongPosition: string;
    shenGongPosition: string;
    sihua: SihuaData;
  };
  chartB: {
    wuxingJu: string;
    mingGongPosition: string;
    shenGongPosition: string;
    sihua: SihuaData;
  };
  palacesA: Record<string, PalaceData>;
  palacesB: Record<string, PalaceData>;
  huajiCrossAnalysis?: HuajiCrossAnalysis;
  relationshipType: string;
  relationshipTypeKey: CompatibilityRelationshipType;
  zodiacCompatibility: string;
  fiveElementCompatibility: string;
  scoreRange?: { min: number; max: number };
  /** 사전 분석된 성격 프로필 A */
  personalityA?: PreAnalyzedPersonality;
  /** 사전 분석된 성격 프로필 B */
  personalityB?: PreAnalyzedPersonality;
  /** 사전 분석된 교차 분석 결과 */
  analysis?: PreAnalyzedCompatibility;
  requestType: CompatibilityInterpretationType;
  previousContext?: string;
  language?: Locale;
}

// 궁합 오버뷰 응답 스키마 (headline + tags + spoiler)
export const CompatibilityOverviewResponseSchema = z.object({
  headline: z.string(),
  tags: z.array(z.string()).min(2).max(4),
  spoiler: z.string(),
  profileASummary: z.string(),
  profileBSummary: z.string(),
});

export type CompatibilityOverviewResponse = z.infer<
  typeof CompatibilityOverviewResponseSchema
>;

// 궁합 인사이트 항목 스키마
const CompatibilityInsightItemSchema = z.object({
  score: z.number().min(0).max(100),
  label: z.string(),
  headline: z.string(),
  content: z.string(),
});

// 궁합 인사이트 응답 스키마 (8개 항목)
export const CompatibilityInsightsResponseSchema = z.object({
  overall: CompatibilityInsightItemSchema,
  zodiac: CompatibilityInsightItemSchema,
  fiveElement: CompatibilityInsightItemSchema,
  chemistry: CompatibilityInsightItemSchema,
  communication: CompatibilityInsightItemSchema,
  growthSynergy: CompatibilityInsightItemSchema,
  trustIndex: CompatibilityInsightItemSchema,
  crisisResilience: CompatibilityInsightItemSchema,
});

export type CompatibilityInsightsResponse = z.infer<
  typeof CompatibilityInsightsResponseSchema
>;

// 궁합 핵심 시나리오 + 종합 조언 응답 스키마
export const CompatibilityScenariosResponseSchema = z.object({
  coreScenarios: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    )
    .min(2)
    .max(4),
  advice: z.string(),
});

export type CompatibilityScenariosResponse = z.infer<
  typeof CompatibilityScenariosResponseSchema
>;

// 궁합 카테고리 응답 스키마 (소통/성장/감정/위기)
export const CompatibilityCategoryResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
  tags: z.array(z.string()).min(1).max(3),
});

export type CompatibilityCategoryResponse = z.infer<
  typeof CompatibilityCategoryResponseSchema
>;

// 4개 카테고리 통합 응답 스키마
export const CompatibilityCategoriesCombinedResponseSchema = z.object({
  communication: CompatibilityCategoryResponseSchema,
  growth: CompatibilityCategoryResponseSchema,
  emotion: CompatibilityCategoryResponseSchema,
  crisis: CompatibilityCategoryResponseSchema,
});

export type CompatibilityCategoriesCombinedResponse = z.infer<
  typeof CompatibilityCategoriesCombinedResponseSchema
>;

// ============================================================
// 전생 운세 타입
// ============================================================

export type PastLifeInterpretationType =
  | "past_life_spoiler"
  | "past_life_birth"
  | "past_life_journey"
  | "past_life_end"
  | "past_life_connections"
  | "past_life_profile_card"
  | "past_life_stats"
  | "past_life_contrast"
  | "past_life_lessons"
  | "past_life_world"
  | "past_life_traces";

// 전생 스포일러 + 이미지 프롬프트
export const PastLifeSpoilerResponseSchema = z.object({
  headline: z.string(),
  existenceType: z.enum(["human", "animal", "plant", "insect", "nature"]),
  description: z.string(),
  summary: z.string(),
  imagePrompt: z.string(),
});

export type PastLifeSpoilerResponse = z.infer<
  typeof PastLifeSpoilerResponseSchema
>;

// 전생 스토리 — 탄생
export const PastLifeBirthResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
});

export type PastLifeBirthResponse = z.infer<typeof PastLifeBirthResponseSchema>;

// 전생 스토리 — 삶
export const PastLifeJourneyResponseSchema = z.object({
  headline: z.string(),
  events: z
    .array(
      z.object({
        period: z.string(),
        event: z.string(),
      })
    )
    .min(3)
    .max(5),
  content: z.string(),
});

export type PastLifeJourneyResponse = z.infer<
  typeof PastLifeJourneyResponseSchema
>;

// 전생 스토리 — 죽음과 카르마
export const PastLifeEndResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
  lastWords: z.string(),
});

export type PastLifeEndResponse = z.infer<typeof PastLifeEndResponseSchema>;

// 전생 인연
export const PastLifeConnectionsResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
});

export type PastLifeConnectionsResponse = z.infer<
  typeof PastLifeConnectionsResponseSchema
>;

// 전생 프로필 카드
export const PastLifeProfileCardResponseSchema = z.object({
  hashtags: z.array(z.string()).length(3),
  spectrums: z
    .array(
      z.object({
        label: z.string(),
        leftLabel: z.string(),
        rightLabel: z.string(),
        score: z.number(),
      })
    )
    .length(4),
  epitaph: z.string(),
});

export type PastLifeProfileCardResponse = z.infer<
  typeof PastLifeProfileCardResponseSchema
>;

// 전생 능력치 (RPG 스탯)
export const PastLifeStatsResponseSchema = z.object({
  title: z.string(),
  stats: z
    .array(
      z.object({
        label: z.string(),
        score: z.number().min(0).max(100),
      })
    )
    .length(5),
});

export type PastLifeStatsResponse = z.infer<
  typeof PastLifeStatsResponseSchema
>;

// 전생 vs 현생 대비
export const PastLifeContrastResponseSchema = z.object({
  contrasts: z
    .array(
      z.object({
        aspect: z.string(),
        pastLife: z.string(),
        presentLife: z.string(),
      })
    )
    .min(3)
    .max(4),
});

export type PastLifeContrastResponse = z.infer<
  typeof PastLifeContrastResponseSchema
>;

// 전생 교훈
export const PastLifeLessonsResponseSchema = z.object({
  lessons: z
    .array(
      z.object({
        headline: z.string(),
        content: z.string(),
      })
    )
    .min(2)
    .max(3),
});

export type PastLifeLessonsResponse = z.infer<
  typeof PastLifeLessonsResponseSchema
>;

// 전생 세계관
export const PastLifeWorldResponseSchema = z.object({
  era: z.string(),
  location: z.string(),
  atmosphere: z.string(),
  socialRole: z.string(),
  description: z.string(),
});

export type PastLifeWorldResponse = z.infer<
  typeof PastLifeWorldResponseSchema
>;

// 전생의 흔적 (현생에 남은 것들)
export const PastLifeTracesResponseSchema = z.object({
  traces: z
    .array(
      z.object({
        category: z.string(),
        trace: z.string(),
        origin: z.string(),
      })
    )
    .min(3)
    .max(4),
});

export type PastLifeTracesResponse = z.infer<
  typeof PastLifeTracesResponseSchema
>;

// 전생 운세 최종 결과
export interface PastLifeFortuneInterpretation {
  spoiler: PastLifeSpoilerResponse;
  birth: PastLifeBirthResponse;
  journey: PastLifeJourneyResponse;
  end: PastLifeEndResponse;
  connections: PastLifeConnectionsResponse;
  profileCard: PastLifeProfileCardResponse;
  stats: PastLifeStatsResponse;
  contrast: PastLifeContrastResponse;
  lessons: PastLifeLessonsResponse;
  world: PastLifeWorldResponse;
  traces: PastLifeTracesResponse;
  imageUrl: string | null;
  meta: {
    generatedAt: string;
    model: string;
    isFallback: boolean;
  };
}
