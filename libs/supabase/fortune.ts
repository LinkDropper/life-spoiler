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
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

import { createServerClient } from "./client";
import type { Database, FortuneInsert, FortuneRow } from "./types";

// ============================================================
// Fortune 저장 서비스
// ============================================================

type SupabaseDB = SupabaseClient<Database>;

export type FortuneType = "lifetime" | "yearly" | "compatibility";

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
 * @returns 저장 성공 여부
 */
export const saveFortune = async (
  params: SaveFortuneParams
): Promise<boolean> => {
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
    const { error } = await (supabase.from("fortunes") as any).upsert(
      insertData,
      {
        onConflict: "profile_id,fortune_type,year",
      }
    );

    if (error) {
      console.error("Fortune 저장 실패:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Fortune 저장 실패:", error);
    return false;
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
      .maybeSingle<FortuneRow>();

    if (error) {
      console.error("Fortune 조회 실패:", error);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

/**
 * 운세 결제 완료 처리 (paid_at 업데이트)
 *
 * @returns 업데이트 성공 여부 (레코드가 없으면 false)
 */
export const updateFortunePaidAt = async (
  profileId: string,
  fortuneType: FortuneType,
  year: number = 0
): Promise<boolean> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    // select()를 추가하여 실제로 업데이트된 데이터를 반환받음
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("fortunes") as any)
      .update({ paid_at: new Date().toISOString() })
      .eq("profile_id", profileId)
      .eq("fortune_type", fortuneType)
      .eq("year", year)
      .select("id");

    if (error) {
      console.error("Fortune paid_at 업데이트 실패:", error);
      return false;
    }

    // 업데이트된 행이 없으면 실패로 처리
    if (!data || data.length === 0) {
      console.error("Fortune paid_at 업데이트 실패: 해당 레코드 없음", {
        profileId,
        fortuneType,
        year,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Fortune paid_at 업데이트 실패:", error);
    return false;
  }
};

/**
 * 궁합 결제 완료 처리 (compatibility_pairs.paid_at 업데이트)
 *
 * @returns 업데이트 성공 여부 (레코드가 없으면 false)
 */
export const updateCompatibilityPaidAt = async (
  pairId: string
): Promise<boolean> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("compatibility_pairs") as any)
      .update({ paid_at: new Date().toISOString() })
      .eq("id", pairId)
      .select("id");

    if (error) {
      console.error("Compatibility paid_at 업데이트 실패:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error("Compatibility paid_at 업데이트 실패: 해당 레코드 없음", {
        pairId,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Compatibility paid_at 업데이트 실패:", error);
    return false;
  }
};

// ============================================================
// 궁합 무료 프로모션
// ============================================================

const COMPATIBILITY_FREE_PROMO_DEADLINE = "2026-02-26T00:00:00+09:00";

/**
 * 유저가 이미 궁합 무료 프로모션을 사용했는지 확인
 */
export const hasUsedFreeCompatibility = async (
  userId: string
): Promise<boolean> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase.from("compatibility_pairs") as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_free_promotion", true);

    if (error) {
      console.error("무료 궁합 사용 확인 실패:", error);
      return false;
    }

    return (count ?? 0) > 0;
  } catch (error) {
    console.error("무료 궁합 사용 확인 실패:", error);
    return false;
  }
};

/**
 * 유저가 궁합 무료 프로모션 대상인지 확인
 * - 프로모션 기한 내인지
 * - 아직 무료 프로모션을 사용하지 않았는지
 */
export const isCompatibilityFreeEligible = async (
  userId: string
): Promise<boolean> => {
  const now = new Date();
  const deadline = new Date(COMPATIBILITY_FREE_PROMO_DEADLINE);

  if (now >= deadline) {
    return false;
  }

  const used = await hasUsedFreeCompatibility(userId);
  return !used;
};

/**
 * 궁합 무료 프로모션 청구 (paid_at + is_free_promotion 업데이트)
 */
export const claimFreeCompatibility = async (
  pairId: string
): Promise<boolean> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("compatibility_pairs") as any)
      .update({
        paid_at: new Date().toISOString(),
        is_free_promotion: true,
      })
      .eq("id", pairId)
      .select("id");

    if (error) {
      console.error("무료 궁합 청구 실패:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error("무료 궁합 청구 실패: 해당 레코드 없음", { pairId });
      return false;
    }

    return true;
  } catch (error) {
    console.error("무료 궁합 청구 실패:", error);
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
