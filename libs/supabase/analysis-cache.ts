import { createHash } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  FortuneInterpretation,
  InterpretationType,
} from "@/libs/services/ai";

import { createServerClient } from "./client";
import type {
  AnalysisResultInsert,
  AnalysisResultRow,
  Database,
} from "./types";

// ============================================================
// 분석 결과 캐싱 서비스
// ============================================================

type SupabaseDB = SupabaseClient<Database>;

/**
 * 명반 데이터로부터 고유 해시 생성
 *
 * 동일한 생년월일/시간/성별/개인화정보면 같은 해시가 생성됨
 */
export const generateChartHash = (params: {
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
  gender: "male" | "female";
  calendarType: "solar" | "lunar";
  isLeapMonth?: boolean;
  relationshipStatus?: string | null;
  occupationStatus?: string | null;
}): string => {
  const {
    birthDate,
    birthTime,
    gender,
    calendarType,
    isLeapMonth = false,
    relationshipStatus = null,
    occupationStatus = null,
  } = params;
  const key = `${birthDate}|${birthTime}|${gender}|${calendarType}|${isLeapMonth}|${relationshipStatus ?? ""}|${occupationStatus ?? ""}`;

  // SHA-256 해시 사용 (서버 사이드 전용)
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
};

/**
 * 캐시된 분석 결과 조회
 */
export const getCachedResult = async (
  chartHash: string,
  interpretationType: InterpretationType | "full"
): Promise<FortuneInterpretation | null> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    const { data, error } = await supabase
      .from("interpretation_cache")
      .select("result")
      .eq("chart_hash", chartHash)
      .eq("interpretation_type", interpretationType)
      .single<Pick<AnalysisResultRow, "result">>();

    if (error || !data) {
      return null;
    }

    return data.result as unknown as FortuneInterpretation;
  } catch {
    // 캐시 조회 실패는 무시하고 새로 생성
    return null;
  }
};

/**
 * 분석 결과 캐시에 저장
 */
export const setCachedResult = async (
  chartHash: string,
  interpretationType: InterpretationType | "full",
  result: FortuneInterpretation
): Promise<void> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    const insertData: AnalysisResultInsert = {
      chart_hash: chartHash,
      interpretation_type: interpretationType,
      result: result as unknown as AnalysisResultInsert["result"],
      updated_at: new Date().toISOString(),
    };

    // HACK: Supabase v2 upsert 타입 문제로 인한 임시 우회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("interpretation_cache") as any).upsert(insertData, {
      onConflict: "chart_hash,interpretation_type",
    });
  } catch {
    // 캐시 저장 실패는 무시 (서비스 중단 방지)
    console.warn("캐시 저장 실패");
  }
};

/**
 * 캐시된 결과가 있으면 반환, 없으면 생성 함수 실행 후 캐시에 저장
 */
export const getOrCreateCachedResult = async (
  chartHash: string,
  interpretationType: InterpretationType | "full",
  createFn: () => Promise<FortuneInterpretation>
): Promise<FortuneInterpretation> => {
  // 1. 캐시 조회
  const cached = await getCachedResult(chartHash, interpretationType);
  if (cached) {
    return cached;
  }

  // 2. 새로 생성
  const result = await createFn();

  // 3. 캐시에 저장 (비동기, 실패해도 결과는 반환)
  setCachedResult(chartHash, interpretationType, result).catch(() => {
    // 저장 실패 무시
  });

  return result;
};
