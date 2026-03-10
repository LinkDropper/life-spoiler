import type {
  FortuneInterpretation,
  PastLifeFortuneInterpretation,
  YearlyFortuneInterpretation,
} from "@/libs/services/ai";
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

export interface LifetimePreviewResult {
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
  interpretation: {
    lifeSpoiler: {
      headline: string;
      summary: string;
    };
  };
}

export interface YearlyPreviewResult {
  year: number;
  chart: {
    wuxingJu: string;
    mingGong: string;
  };
  rawChart: ZiweiChart;
  yearlySihua: YearlySihua;
  interpretation: {
    overview: {
      headline: string;
      summary: string;
      keywords: string[];
    };
  };
}

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

export type PastLifePreviewResult = PastLifeFortuneResult;
