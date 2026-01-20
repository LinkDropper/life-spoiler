import type { SupabaseClient } from "@supabase/supabase-js";

import type { Locale } from "@/i18n/config";
import type {
  FortuneInterpretation,
  YearlyFortuneInterpretation,
} from "@/libs/services/ai";
import type { DayunResult } from "@/libs/zi-wei-dou-shu/calculators";
import type {
  YearlyPalaceInfo,
  YearlyPeachBlossomInfo,
  YearlySihua,
} from "@/libs/zi-wei-dou-shu/calculators";
import type { LifestyleRecommendation } from "@/libs/zi-wei-dou-shu/lifestyle";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

import { createServerClient } from "./client";
import type { Database, FortuneInsert, FortuneRow } from "./types";

// ============================================================
// Fortune 저장 서비스
// ============================================================

type SupabaseDB = SupabaseClient<Database>;

export type FortuneType = "lifetime" | "yearly";

/**
 * 인생 운세 전체 데이터 (저장용)
 */
export interface LifetimeFortuneData {
  /** 저장된 데이터의 언어 */
  language?: Locale;
  chart: {
    wuxingJu: string;
    mingGong: string;
    shenGong: string;
    sihua: ZiweiChart["sihua"];
  };
  rawChart: ZiweiChart;
  dayun: DayunResult;
  lifestyle: LifestyleRecommendation;
  interpretation: FortuneInterpretation;
}

/**
 * 올해 운세 전체 데이터 (저장용)
 */
export interface YearlyFortuneData {
  /** 저장된 데이터의 언어 */
  language?: Locale;
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

/** 운세 결과 타입 (전체 데이터) */
export type FortuneResultType = LifetimeFortuneData | YearlyFortuneData;

export interface SaveFortuneParams {
  profileId: string;
  fortuneType: FortuneType;
  year?: number;
  result: FortuneResultType;
}

/**
 * 운세 결과 저장 (upsert)
 *
 * 동일한 profile_id + fortune_type + year 조합이면 업데이트
 */
export const saveFortune = async (params: SaveFortuneParams): Promise<void> => {
  const { profileId, fortuneType, year = 0, result } = params;

  try {
    const supabase = createServerClient() as SupabaseDB;

    const insertData: FortuneInsert = {
      profile_id: profileId,
      fortune_type: fortuneType,
      year,
      result: result as unknown as FortuneInsert["result"],
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("fortunes") as any).upsert(insertData, {
      onConflict: "profile_id,fortune_type,year",
    });
  } catch (error) {
    console.error("Fortune 저장 실패:", error);
  }
};

/**
 * 프로필의 운세 결과 조회
 */
export const getFortune = async (
  profileId: string,
  fortuneType: FortuneType,
  year: number = 0
): Promise<FortuneRow | null> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    const { data, error } = await supabase
      .from("fortunes")
      .select("*")
      .eq("profile_id", profileId)
      .eq("fortune_type", fortuneType)
      .eq("year", year)
      .single<FortuneRow>();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

/**
 * 운세 결제 완료 처리 (paid_at 업데이트)
 */
export const updateFortunePaidAt = async (
  profileId: string,
  fortuneType: FortuneType,
  year: number = 0
): Promise<boolean> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("fortunes") as any)
      .update({ paid_at: new Date().toISOString() })
      .eq("profile_id", profileId)
      .eq("fortune_type", fortuneType)
      .eq("year", year);

    if (error) {
      console.error("Fortune paid_at 업데이트 실패:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Fortune paid_at 업데이트 실패:", error);
    return false;
  }
};

/**
 * 프로필의 모든 운세 결과 조회
 */
export const getFortunesByProfile = async (
  profileId: string
): Promise<FortuneRow[]> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    const { data, error } = await supabase
      .from("fortunes")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as FortuneRow[];
  } catch {
    return [];
  }
};
