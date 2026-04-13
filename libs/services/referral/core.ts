import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerClient } from "@/libs/supabase";
import type { Database } from "@/libs/supabase/types";

import { ReferralError } from "./errors";
import { sendReferralNotification } from "./notify";
import type { RewardReferralResult } from "./types";

type SupabaseDB = SupabaseClient<Database>;

/**
 * 랜덤 8자리 영숫자 문자열 생성
 */
const generateRandomCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * referrerUserId가 실존하는 유저인지 확인
 */
const verifyReferrerExists = async (
  supabase: SupabaseDB,
  referrerUserId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", referrerUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false;
    }
    throw new ReferralError("DATABASE_ERROR", { originalError: error });
  }

  return !!data;
};

/**
 * 동일 쌍에 대한 중복 보상 확인
 */
const checkDuplicateReferral = async (
  supabase: SupabaseDB,
  referrerUserId: string,
  referredUserId: string
): Promise<boolean> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase.from("referrals") as any)
    .select("*", { count: "exact", head: true })
    .eq("referrer_user_id", referrerUserId)
    .eq("referred_user_id", referredUserId);

  if (error) {
    throw new ReferralError("DATABASE_ERROR", { originalError: error });
  }

  return (count ?? 0) > 0;
};

/**
 * 레퍼럴 보상 처리
 *
 * 1. 자기 자신 레퍼럴 방지
 * 2. referrerUserId가 실존 유저인지 확인
 * 3. 동일 쌍 중복 보상 확인
 * 4. 프로모 코드 생성
 * 5. referrals 테이블 INSERT
 * 6. 알림 발송 (비동기, fire-and-forget)
 */
export const rewardReferral = async (
  referredUserId: string,
  referrerUserId: string
): Promise<RewardReferralResult> => {
  // 1. 자기 자신 레퍼럴 방지
  if (referredUserId === referrerUserId) {
    throw new ReferralError("SELF_REFERRAL", {
      referrerUserId,
      referredUserId,
    });
  }

  const supabase = createServerClient() as SupabaseDB;

  // 2. referrerUserId가 실존 유저인지 확인
  const referrerExists = await verifyReferrerExists(supabase, referrerUserId);
  if (!referrerExists) {
    throw new ReferralError("INVALID_REFERRER", { referrerUserId });
  }

  // 3. 동일 쌍 중복 보상 확인
  const isDuplicate = await checkDuplicateReferral(
    supabase,
    referrerUserId,
    referredUserId
  );
  if (isDuplicate) {
    throw new ReferralError("ALREADY_REWARDED", {
      referrerUserId,
      referredUserId,
    });
  }

  // 4. 프로모 코드 생성
  const promoCodeValue = `REF-${generateRandomCode()}`;
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 30);

  const { data: promoCode, error: promoError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("promo_codes") as any)
      .insert({
        code: promoCodeValue,
        code_type: "single_use",
        benefit_type: "free_fortune",
        fortune_type: "all",
        max_uses: 1,
        max_uses_per_user: 1,
        valid_from: now.toISOString(),
        valid_until: validUntil.toISOString(),
        is_active: true,
        campaign_name: "referral_promotion",
        owner_id: referrerUserId,
        created_by: referredUserId,
      })
      .select()
      .single();

  if (promoError || !promoCode) {
    throw new ReferralError("DATABASE_ERROR", {
      originalError: promoError,
    });
  }

  // 5. referrals 테이블 INSERT
  const { data: referral, error: referralError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("referrals") as any)
      .insert({
        referrer_user_id: referrerUserId,
        referred_user_id: referredUserId,
        promo_code_id: promoCode.id,
        notification_status: "pending",
      })
      .select()
      .single();

  if (referralError || !referral) {
    // referral INSERT 실패 시 생성된 프로모 코드 정리
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("promo_codes") as any).delete().eq("id", promoCode.id);

    throw new ReferralError("DATABASE_ERROR", {
      originalError: referralError,
    });
  }

  // 6. 알림 발송 (Vercel 서버리스 환경에서 응답 후 종료 방지를 위해 await)
  try {
    await sendReferralNotification(
      referrerUserId,
      promoCodeValue,
      referral.id,
      validUntil
    );
  } catch (error) {
    console.error("레퍼럴 알림 발송 실패:", error);
  }

  return {
    success: true,
    referralId: referral.id,
    promoCode: promoCodeValue,
  };
};
