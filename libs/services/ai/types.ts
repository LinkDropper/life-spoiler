import { z } from "zod/v4";

import type { Locale } from "@/i18n/config";

// ============================================================
// Upstage API 타입
// ============================================================

export interface UpstageMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface UpstageRequest {
  model: string;
  messages: UpstageMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface UpstageResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
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
  | "lifetime_age_scenarios";

export interface StarData {
  name: string;
  brightness: string;
  sihua?: string;
}

export interface PalaceData {
  name: string;
  branch: string;
  mainStars: StarData[];
  minorStars: string[];
}

export interface SihuaData {
  hualu: { star: string; palace: string };
  huaquan: { star: string; palace: string };
  huake: { star: string; palace: string };
  huaji: { star: string; palace: string };
}

// 대운 데이터
export interface DayunData {
  period: string; // "2-11세", "12-21세" 등
  palaceName: string;
  mainStars: string[];
  sihua?: string[];
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
  requestType: InterpretationType;
  /** 응답 언어 (기본값: ko) */
  language?: Locale;
}

// ============================================================
// 해석 결과 타입 (인생 운세)
// ============================================================

// 인생 스포일러 응답 스키마 (제목 + 본문 300~400자)
export const LifeSpoilerResponseSchema = z.object({
  headline: z.string(),
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

// 상세 시나리오 카테고리 응답 스키마 (제목 + 본문 200~300자 + 태그 1~2개)
export const LifetimeCategoryResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
  tags: z.array(z.string()).min(1).max(2),
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
  requestType: YearlyInterpretationType;
  /** 응답 언어 (기본값: ko) */
  language?: Locale;
}

// 올해 스포일러 응답 스키마
export const YearlyOverviewResponseSchema = z.object({
  headline: z.string(),
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

// 상세 시나리오 카테고리 응답 스키마 (제목 + 재물운, 직업운, 인연운, 건강운)
export const YearlyCategoryResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),
  tags: z.array(z.string()).min(1).max(2),
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
