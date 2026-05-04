import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerClient } from "@/libs/supabase";
import type {
  Database,
  FortuneType,
  PromoCodeRow,
} from "@/libs/supabase/types";

import { PromoError } from "./errors";

type SupabaseDB = SupabaseClient<Database>;
import type {
  ApplyCodeRequest,
  ApplyCodeResult,
  PromoCodeInfo,
  UserPromoUsage,
  ValidateCodeRequest,
  ValidateCodeResult,
} from "./types";

/**
 * 프로모션 코드 조회 (대소문자 무시)
 */
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

  return data;
};

/**
 * 유저의 특정 코드 사용 횟수 조회
 */
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

/**
 * 궁합 운세는 subjectId 가 compatibility_pairs.id 를 가리킨다.
 */
const isCompatibility = (fortuneType: FortuneType): boolean =>
  fortuneType === "compatibility";

/**
 * 특정 프로필(또는 페어)+운세타입에 코드가 이미 적용되었는지 확인.
 * - 일반 운세: profile_id 기준
 * - 궁합 운세: pair_id 기준
 */
const isAlreadyApplied = async (
  promoCodeId: string,
  subjectId: string,
  fortuneType: FortuneType
): Promise<boolean> => {
  const supabase = createServerClient() as SupabaseDB;

  const subjectColumn = isCompatibility(fortuneType) ? "pair_id" : "profile_id";

  const { count, error } = await supabase
    .from("promo_code_usages")
    .select("*", { count: "exact", head: true })
    .eq("promo_code_id", promoCodeId)
    .eq(subjectColumn, subjectId)
    .eq("fortune_type", fortuneType);

  if (error) {
    throw new PromoError("DATABASE_ERROR", { originalError: error });
  }

  return (count ?? 0) > 0;
};

/**
 * 프로필 소유권 확인 (일반 운세).
 */
const verifyProfileOwnership = async (
  profileId: string,
  userId: string
): Promise<boolean> => {
  const supabase = createServerClient() as SupabaseDB;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false;
    }
    throw new PromoError("DATABASE_ERROR", { originalError: error });
  }

  return !!data;
};

/**
 * 궁합 페어 소유권 확인.
 */
const verifyPairOwnership = async (
  pairId: string,
  userId: string
): Promise<boolean> => {
  const supabase = createServerClient() as SupabaseDB;

  const { data, error } = await supabase
    .from("compatibility_pairs")
    .select("id")
    .eq("id", pairId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false;
    }
    throw new PromoError("DATABASE_ERROR", { originalError: error });
  }

  return !!data;
};

/**
 * 운세 타입에 따라 subject(프로필 or 페어) 소유권 검증.
 */
const verifySubjectOwnership = async (
  subjectId: string,
  userId: string,
  fortuneType: FortuneType
): Promise<boolean> => {
  return isCompatibility(fortuneType)
    ? verifyPairOwnership(subjectId, userId)
    : verifyProfileOwnership(subjectId, userId);
};

/**
 * 운세 타입 호환성 확인
 */
const isFortuneTypeCompatible = (
  codeFortuneType: string,
  targetFortuneType: FortuneType
): boolean => {
  if (codeFortuneType === "all") {
    return true;
  }
  return codeFortuneType === targetFortuneType;
};

/**
 * 프로모션 코드 유효성 검증
 */
export const validatePromoCode = async (
  request: ValidateCodeRequest
): Promise<ValidateCodeResult> => {
  const { code, userId, profileId, fortuneType } = request;

  // 1. 코드 존재 여부 확인
  const promoCode = await findPromoCode(code);
  if (!promoCode) {
    throw new PromoError("INVALID_CODE", { promoCode: code });
  }

  // 2. 활성화 여부 확인
  if (!promoCode.is_active) {
    throw new PromoError("CODE_INACTIVE", { promoCode: code });
  }

  // 3. 유효 기간 확인
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

  // 4. 전체 사용 횟수 확인
  if (
    promoCode.max_uses !== null &&
    promoCode.current_uses >= promoCode.max_uses
  ) {
    throw new PromoError("CODE_EXHAUSTED", { promoCode: code });
  }

  // 5. 프로필(또는 페어) 소유권 확인
  // 궁합 운세는 profileId 가 compatibility_pairs.id 를 가리킨다.
  const isOwner = await verifySubjectOwnership(profileId, userId, fortuneType);
  if (!isOwner) {
    throw new PromoError("PROFILE_NOT_FOUND", {
      promoCode: code,
      profileId,
    });
  }

  // 6. 유저당 사용 횟수 확인
  const userUsageCount = await getUserCodeUsageCount(promoCode.id, userId);
  if (userUsageCount >= promoCode.max_uses_per_user) {
    throw new PromoError("USER_LIMIT_EXCEEDED", { promoCode: code });
  }

  // 7. 해당 프로필+운세타입 중복 적용 여부 확인
  const alreadyApplied = await isAlreadyApplied(
    promoCode.id,
    profileId,
    fortuneType
  );
  if (alreadyApplied) {
    throw new PromoError("ALREADY_APPLIED", {
      promoCode: code,
      profileId,
      fortuneType,
    });
  }

  // 8. 운세 타입 호환성 확인
  if (!isFortuneTypeCompatible(promoCode.fortune_type, fortuneType)) {
    throw new PromoError("FORTUNE_TYPE_MISMATCH", {
      promoCode: code,
      fortuneType,
    });
  }

  return {
    isValid: true,
    promoCode,
  };
};

/**
 * 프로모션 코드 적용
 */
export const applyPromoCode = async (
  request: ApplyCodeRequest
): Promise<ApplyCodeResult> => {
  const { code, userId, profileId, fortuneType } = request;

  // 1. 유효성 검증
  const { promoCode } = await validatePromoCode(request);

  const supabase = createServerClient() as SupabaseDB;

  // subject 컬럼 분기: 궁합은 pair_id, 그 외는 profile_id
  const subjectColumns = isCompatibility(fortuneType)
    ? { pair_id: profileId, profile_id: null }
    : { profile_id: profileId, pair_id: null };

  // 2. 무료 접근 권한 생성
  const { data: freeAccess, error: freeAccessError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profile_free_access") as any)
      .insert({
        ...subjectColumns,
        fortune_type: fortuneType,
        granted_by: `promo:${promoCode.code}`,
        memo: promoCode.campaign_name
          ? `캠페인: ${promoCode.campaign_name}`
          : null,
      })
      .select()
      .single();

  if (freeAccessError) {
    throw new PromoError("DATABASE_ERROR", {
      promoCode: code,
      originalError: freeAccessError,
    });
  }

  // 3. 사용 이력 생성
  const { data: usage, error: usageError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("promo_code_usages") as any)
      .insert({
        promo_code_id: promoCode.id,
        user_id: userId,
        ...subjectColumns,
        fortune_type: fortuneType,
        free_access_id: freeAccess.id,
      })
      .select()
      .single();

  if (usageError) {
    // 사용 이력 생성 실패 시 무료 접근 권한 롤백
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profile_free_access") as any)
      .delete()
      .eq("id", freeAccess.id);

    throw new PromoError("DATABASE_ERROR", {
      promoCode: code,
      originalError: usageError,
    });
  }

  // 4. 사용 횟수 증가
  const { error: updateError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("promo_codes") as any)
      .update({
        current_uses: promoCode.current_uses + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", promoCode.id);

  if (updateError) {
    // 로그만 남기고 진행 (critical하지 않음)
    console.error("프로모션 코드 사용 횟수 업데이트 실패:", updateError);
  }

  // 5. 1회성 코드인 경우 비활성화
  if (promoCode.code_type === "single_use") {
    const { error: deactivateError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("promo_codes") as any)
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
    usage,
    freeAccessId: freeAccess.id,
  };
};

/**
 * 프로모션 코드 정보 조회 (적용 전 미리보기용)
 */
export const getPromoCodeInfo = async (
  code: string
): Promise<PromoCodeInfo | null> => {
  const promoCode = await findPromoCode(code);

  if (!promoCode || !promoCode.is_active) {
    return null;
  }

  // 유효 기간 확인
  const now = new Date();
  if (promoCode.valid_until && now > new Date(promoCode.valid_until)) {
    return null;
  }

  return {
    code: promoCode.code,
    benefitType: promoCode.benefit_type as "free_fortune" | "discount",
    fortuneType: promoCode.fortune_type,
    discountPercent: promoCode.discount_percent,
    campaignName: promoCode.campaign_name,
    validUntil: promoCode.valid_until,
  };
};

/**
 * 유저의 프로모션 코드 사용 내역 조회
 */
interface PromoUsageWithCode {
  id: string;
  profile_id: string | null;
  pair_id: string | null;
  fortune_type: string;
  used_at: string;
  promo_codes: {
    code: string;
    campaign_name: string | null;
  };
}

export const getUserPromoUsages = async (
  userId: string
): Promise<UserPromoUsage[]> => {
  const supabase = createServerClient() as SupabaseDB;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("promo_code_usages") as any)
    .select(
      `
      id,
      profile_id,
      pair_id,
      fortune_type,
      used_at,
      promo_codes (
        code,
        campaign_name
      )
    `
    )
    .eq("user_id", userId)
    .order("used_at", { ascending: false });

  if (error) {
    throw new PromoError("DATABASE_ERROR", { originalError: error });
  }

  return ((data ?? []) as PromoUsageWithCode[]).map((usage) => ({
    id: usage.id,
    code: usage.promo_codes.code,
    profileId: usage.profile_id,
    pairId: usage.pair_id,
    fortuneType: usage.fortune_type as FortuneType,
    usedAt: usage.used_at,
    campaignName: usage.promo_codes.campaign_name,
  }));
};

/**
 * 프로필(또는 페어)에 프로모션 코드가 적용되었는지 확인
 */
export const hasPromoAppliedToProfile = async (
  subjectId: string,
  fortuneType: FortuneType
): Promise<boolean> => {
  const supabase = createServerClient() as SupabaseDB;
  const subjectColumn = isCompatibility(fortuneType) ? "pair_id" : "profile_id";

  const { count, error } = await supabase
    .from("promo_code_usages")
    .select("*", { count: "exact", head: true })
    .eq(subjectColumn, subjectId)
    .eq("fortune_type", fortuneType);

  if (error) {
    throw new PromoError("DATABASE_ERROR", { originalError: error });
  }

  return (count ?? 0) > 0;
};
