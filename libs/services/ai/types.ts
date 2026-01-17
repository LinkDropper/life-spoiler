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
  | "preview"
  | "wealth"
  | "career"
  | "relationship"
  | "health"
  | "summary";

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
  targetPalace: PalaceData;
  oppositePalace?: PalaceData;
  dayunPeriods?: DayunData[];
  requestType: InterpretationType;
  /** 응답 언어 (기본값: ko) */
  language?: Locale;
}

// ============================================================
// 해석 결과 타입
// ============================================================

export const PreviewResponseSchema = z.object({
  headline: z.string(),
  description: z.string(),
});

export type PreviewResponse = z.infer<typeof PreviewResponseSchema>;

export const SectionResponseSchema = z.object({
  title: z.string(),
  content: z.string(),
  highlights: z.array(z.string()),
});

export type SectionResponse = z.infer<typeof SectionResponseSchema>;

export const SummaryResponseSchema = z.object({
  summary: z.string(),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

// ============================================================
// 최종 결과 타입 (인생 운세)
// ============================================================

export interface FortuneInterpretation {
  preview: PreviewResponse;
  details: {
    summary: string;
    wealth: SectionResponse;
    career: SectionResponse;
    relationship: SectionResponse;
    health: SectionResponse;
  } | null;
  meta: {
    generatedAt: string;
    model: string;
    isFallback: boolean;
  };
}

// ============================================================
// 올해 운세(유년) 타입
// ============================================================

export type YearlyInterpretationType =
  | "yearly_overview"
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
  scores: {
    overall: number;
    wealth: number;
    career: number;
    relationship: number;
    health: number;
  };
  requestType: YearlyInterpretationType;
  /** 응답 언어 (기본값: ko) */
  language?: Locale;
}

// 올해 운세 응답 스키마
export const YearlyOverviewResponseSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  keywords: z.array(z.string()),
  luckyMonths: z.array(z.number()),
  cautionMonths: z.array(z.number()),
});

export type YearlyOverviewResponse = z.infer<
  typeof YearlyOverviewResponseSchema
>;

export const YearlyCategoryResponseSchema = z.object({
  title: z.string(),
  content: z.string(),
  advice: z.string(),
});

export type YearlyCategoryResponse = z.infer<
  typeof YearlyCategoryResponseSchema
>;

export const YearlyMonthlyFortuneSchema = z.object({
  monthlyFortunes: z.array(
    z.object({
      month: z.number(),
      score: z.number(),
      theme: z.string().optional().default(""),
      content: z.string(),
      tip: z.string().optional().default(""),
    })
  ),
});

export type YearlyMonthlyFortune = z.infer<typeof YearlyMonthlyFortuneSchema>;

// 올해 운세 최종 결과
export interface YearlyFortuneInterpretation {
  overview: YearlyOverviewResponse;
  categories: {
    wealth: YearlyCategoryResponse;
    career: YearlyCategoryResponse;
    relationship: YearlyCategoryResponse;
    health: YearlyCategoryResponse;
  };
  monthlyFortunes: YearlyMonthlyFortune["monthlyFortunes"];
  meta: {
    year: number;
    generatedAt: string;
    model: string;
    isFallback: boolean;
  };
}
