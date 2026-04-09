import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerClient } from "./client";
import type { Database, FaceReportRow } from "./types";

type SupabaseDB = SupabaseClient<Database>;

/**
 * 관상 리포트 결제 완료 처리 (face_reports.paid_at 업데이트)
 *
 * @returns 업데이트된 리포트 row (없으면 null)
 */
export const updateFaceReportPaidAt = async (
  shareId: string
): Promise<FaceReportRow | null> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("face_reports") as any)
      .update({
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("share_id", shareId)
      .select("*")
      .single();

    if (error) {
      console.error("face_reports paid_at 업데이트 실패:", error);
      return null;
    }

    return data as FaceReportRow;
  } catch (error) {
    console.error("face_reports paid_at 업데이트 실패:", error);
    return null;
  }
};

/**
 * shareId로 face_report 조회 (소유권 확인용)
 */
export const getFaceReportByShareId = async (
  shareId: string
): Promise<FaceReportRow | null> => {
  const supabase = createServerClient() as SupabaseDB;

  const { data, error } = await supabase
    .from("face_reports")
    .select("*")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as FaceReportRow;
};
