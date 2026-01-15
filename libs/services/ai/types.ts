import { z } from "zod/v4";

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

export interface ZiweiInterpretationRequest {
  user: {
    gender: "male" | "female";
    lunarBirthInfo: string;
    currentAge?: number;
  };
  chart: {
    wuxingJu: string;
    mingGongPosition: string;
    shenGongPosition: string;
    sihua: SihuaData;
  };
  targetPalace: PalaceData;
  oppositePalace?: PalaceData;
  allPalaces?: PalaceData[];
  dayunPeriods?: DayunData[]; // 대운 정보
  requestType: InterpretationType;
}

// ============================================================
// 해석 결과 타입
// ============================================================

export const PreviewResponseSchema = z.object({
  headline: z.string(),
  description: z.string(),
});

export type PreviewResponse = z.infer<typeof PreviewResponseSchema>;

// 타임라인 항목 (대운별 점수)
export const TimelineItemSchema = z.object({
  age: z.string(),
  score: z.number().min(0).max(100),
  description: z.string(),
});

export type TimelineItem = z.infer<typeof TimelineItemSchema>;

export const SectionResponseSchema = z.object({
  title: z.string(),
  content: z.string(),
  highlights: z.array(z.string()),
  timeline: z.array(TimelineItemSchema).optional(),
});

export type SectionResponse = z.infer<typeof SectionResponseSchema>;

export const SummaryResponseSchema = z.object({
  summary: z.string(),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

// ============================================================
// 최종 결과 타입
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
