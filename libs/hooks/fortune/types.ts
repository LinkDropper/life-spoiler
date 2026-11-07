import type {
  FortuneInterpretation,
  PastLifeFortuneInterpretation,
  YearlyFortuneInterpretation,
} from "@/libs/services/ai";
import type {
  LifetimePreviewPayload,
  PastLifePreviewPayload,
  YearlyPreviewPayload,
} from "@/libs/fortune/preview-payload";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";
import type { DayunResult } from "@/libs/zi-wei-dou-shu/calculators";
import type {
  YearlyPalaceInfo,
  YearlyPeachBlossomInfo,
  YearlySihua,
} from "@/libs/zi-wei-dou-shu/calculators";

export interface ProfileData {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  calendar_type: "solar" | "lunar";
  gender: "male" | "female";
  relationship_status: string | null;
  relationship_status_custom: string | null;
  occupation_status: string | null;
  occupation_status_custom: string | null;
}

export interface ShareProfileData {
  name: string;
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  calendar_type: "solar" | "lunar";
  gender: "male" | "female";
}

export interface LifetimeFortuneResult {
  chart: {
    wuxingJu: string;
    mingGong: string;
    shenGong: string;
    sihua: {
      hualu: string;
      huaquan: string;
      huake: string;
      huaji: string;
    };
  };
  rawChart: ZiweiChart;
  dayun: DayunResult;
  interpretation: FortuneInterpretation;
}

export interface YearlyFortuneResult {
  year: number;
  chart: {
    wuxingJu: string;
    mingGong: string;
  };
  rawChart: ZiweiChart;
  yearlySihua: YearlySihua;
  yearlyPalaces: YearlyPalaceInfo;
  peachBlossom: YearlyPeachBlossomInfo;
  currentDayun: {
    period: string;
    palaceName: string;
    mainStars: string[];
  } | null;
  interpretation: YearlyFortuneInterpretation;
}

/** 결제 전 응답은 서버에서 예고편 필드만 남긴다 (libs/fortune/preview-payload.ts) */
export type LifetimePreviewResult = LifetimePreviewPayload;

export type YearlyPreviewResult = YearlyPreviewPayload;

export interface PastLifeFortuneResult {
  chart: {
    wuxingJu: string;
    mingGong: string;
    shenGong: string;
    sihua: {
      hualu: string;
      huaquan: string;
      huake: string;
      huaji: string;
    };
  };
  rawChart: ZiweiChart;
  interpretation: PastLifeFortuneInterpretation;
}

export type PastLifePreviewResult = PastLifePreviewPayload;
