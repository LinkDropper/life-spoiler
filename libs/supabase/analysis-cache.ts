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
 * 동일한 생년월일/시간/성별이면 같은 해시가 생성됨
 */
export const generateChartHash = (params: {
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
  gender: "male" | "female";
  calendarType: "solar" | "lunar";
  isLeapMonth?: boolean;
}): string => {
  const {
    birthDate,
    birthTime,
    gender,
    calendarType,
    isLeapMonth = false,
  } = params;
  const key = `${birthDate}|${birthTime}|${gender}|${calendarType}|${isLeapMonth}`;

  // 간단한 해시 함수 (브라우저/서버 호환)
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32비트 정수로 변환
  }

  return Math.abs(hash).toString(36);
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
