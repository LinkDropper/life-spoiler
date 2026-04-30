import type { SupabaseClient } from "@supabase/supabase-js";

import { PromoError } from "@/libs/services/promo";
import { createServerClient, updateFaceReportPaidAt } from "@/libs/supabase";
import type { Database, PromoCodeRow } from "@/libs/supabase/types";

type SupabaseDB = SupabaseClient<Database>;

const FACE_FORTUNE_TYPE = "face_spoiler";

interface ApplyPromoRequest {
  code: string;
  userId: string;
  shareId: string;
}

interface ApplyPromoResult {
  success: true;
  promoCode: PromoCodeRow;
}

const findPromoCode = async (code: string): Promise<PromoCodeRow | null> => {
  const supabase = createServerClient() as SupabaseDB;

  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .ilike("code", code)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new PromoError("DATABASE_ERROR", {
      promoCode: code,
      originalError: error,
    });
  }

  return data as PromoCodeRow;
};

const getUserCodeUsageCount = async (
  promoCodeId: string,
  userId: string
): Promise<number> => {
  const supabase = createServerClient() as SupabaseDB;

  const { count, error } = await supabase
    .from("promo_code_usages")
    .select("*", { count: "exact", head: true })
    .eq("promo_code_id", promoCodeId)
    .eq("user_id", userId);

  if (error) {
    throw new PromoError("DATABASE_ERROR", { originalError: error });
  }

  return count ?? 0;
};

const isAlreadyAppliedToFaceReport = async (
  promoCodeId: string,
  faceReportId: string
): Promise<boolean> => {
  const supabase = createServerClient() as SupabaseDB;

  const { count, error } = await supabase
    .from("promo_code_usages")
    .select("*", { count: "exact", head: true })
    .eq("promo_code_id", promoCodeId)
    .eq("face_report_id", faceReportId);

  if (error) {
    throw new PromoError("DATABASE_ERROR", { originalError: error });
  }

  return (count ?? 0) > 0;
};

const verifyFaceReportOwnership = async (
  shareId: string,
  userId: string
): Promise<{ id: string; paid_at: string | null } | null> => {
  const supabase = createServerClient() as SupabaseDB;

  const { data, error } = await supabase
    .from("face_reports")
    .select("id, user_id, paid_at")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as {
    id: string;
    user_id: string;
    paid_at: string | null;
  };

  if (row.user_id !== userId) {
    return null;
  }

  return { id: row.id, paid_at: row.paid_at };
};

const isFortuneTypeCompatible = (codeFortuneType: string): boolean => {
  return codeFortuneType === "all" || codeFortuneType === FACE_FORTUNE_TYPE;
};

/**
 * 관상 리포트에 프로모션 코드가 적용되었는지 확인
 */
export const hasPromoAppliedToFaceReport = async (
  shareId: string
): Promise<boolean> => {
  const supabase = createServerClient() as SupabaseDB;

  const { data: reportData, error: reportError } = await supabase
    .from("face_reports")
    .select("id")
    .eq("share_id", shareId)
    .maybeSingle();

  if (reportError || !reportData) {
    return false;
  }

  const report = reportData as unknown as { id: string };

  const { count, error } = await supabase
    .from("promo_code_usages")
    .select("*", { count: "exact", head: true })
    .eq("face_report_id", report.id);

  if (error) {
    throw new PromoError("DATABASE_ERROR", { originalError: error });
  }

  return (count ?? 0) > 0;
};

/**
 * 관상 리포트에 프로모션 코드 적용
 *
 * 성공 시:
 * - promo_code_usages에 기록
 * - face_reports.paid_at = now()
 * - promo_codes.current_uses 증가
 * - 1회성 코드면 비활성화
 */
export const applyPromoCodeToFaceReport = async (
  request: ApplyPromoRequest
): Promise<ApplyPromoResult> => {
  const { code, userId, shareId } = request;

  // 1. 코드 존재 여부
  const promoCode = await findPromoCode(code);
  if (!promoCode) {
    throw new PromoError("INVALID_CODE", { promoCode: code });
  }

  // 2. 활성화
  if (!promoCode.is_active) {
    throw new PromoError("CODE_INACTIVE", { promoCode: code });
  }

  // 3. 유효기간
  const now = new Date();
  const validFrom = new Date(promoCode.valid_from);
  if (now < validFrom) {
    throw new PromoError("CODE_NOT_YET_VALID", { promoCode: code });
  }
  if (promoCode.valid_until) {
    const validUntil = new Date(promoCode.valid_until);
    if (now > validUntil) {
      throw new PromoError("CODE_EXPIRED", { promoCode: code });
    }
  }

  // 4. 전체 사용 횟수
  if (
    promoCode.max_uses !== null &&
    promoCode.current_uses >= promoCode.max_uses
  ) {
    throw new PromoError("CODE_EXHAUSTED", { promoCode: code });
  }

  // 5. 리포트 소유권
  const report = await verifyFaceReportOwnership(shareId, userId);
  if (!report) {
    throw new PromoError("PROFILE_NOT_FOUND", {
      promoCode: code,
      profileId: shareId,
    });
  }

  // 6. 유저당 사용 횟수
  const userUsageCount = await getUserCodeUsageCount(promoCode.id, userId);
  if (userUsageCount >= promoCode.max_uses_per_user) {
    throw new PromoError("USER_LIMIT_EXCEEDED", { promoCode: code });
  }

  // 7. 이미 적용됨
  const alreadyApplied = await isAlreadyAppliedToFaceReport(
    promoCode.id,
    report.id
  );
  if (alreadyApplied) {
    throw new PromoError("ALREADY_APPLIED", {
      promoCode: code,
      profileId: shareId,
      fortuneType: FACE_FORTUNE_TYPE,
    });
  }

  // 8. 운세 타입 호환성
  if (!isFortuneTypeCompatible(promoCode.fortune_type)) {
    throw new PromoError("FORTUNE_TYPE_MISMATCH", {
      promoCode: code,
      fortuneType: FACE_FORTUNE_TYPE,
    });
  }

  const supabase = createServerClient() as SupabaseDB;

  // 9. 사용 이력 생성
  const { error: usageError } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("promo_code_usages") as any).insert({
      promo_code_id: promoCode.id,
      user_id: userId,
      profile_id: null,
      face_report_id: report.id,
      fortune_type: FACE_FORTUNE_TYPE,
      free_access_id: null,
    });

  if (usageError) {
    throw new PromoError("DATABASE_ERROR", {
      promoCode: code,
      originalError: usageError,
    });
  }

  // 10. face_reports.paid_at 업데이트 (이미 결제된 경우는 건드리지 않음)
  if (!report.paid_at) {
    const updated = await updateFaceReportPaidAt(shareId);
    if (!updated) {
      throw new PromoError("DATABASE_ERROR", {
        promoCode: code,
      });
    }
  }

  // 11. 프로모 코드 사용 횟수 증가
  const { error: updateError } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("promo_codes") as any)
      .update({
        current_uses: promoCode.current_uses + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", promoCode.id);

  if (updateError) {
    console.error("프로모션 코드 사용 횟수 업데이트 실패:", updateError);
  }

  // 12. 1회성 코드 비활성화
  if (promoCode.code_type === "single_use") {
    const { error: deactivateError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("promo_codes") as any)
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", promoCode.id);

    if (deactivateError) {
      console.error("1회성 코드 비활성화 실패:", deactivateError);
    }
  }

  return {
    success: true,
    promoCode,
  };
};
