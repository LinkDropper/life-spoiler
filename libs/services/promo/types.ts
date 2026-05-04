import type {
  FortuneType,
  PromoCodeRow,
  PromoCodeUsageRow,
  PromoFortuneType,
} from "@/libs/supabase/types";

export type { PromoCodeRow, PromoCodeUsageRow };

export interface ValidateCodeRequest {
  code: string;
  userId: string;
  profileId: string;
  fortuneType: FortuneType;
}

export interface ValidateCodeResult {
  isValid: true;
  promoCode: PromoCodeRow;
}

export interface ApplyCodeRequest {
  code: string;
  userId: string;
  profileId: string;
  fortuneType: FortuneType;
}

export interface ApplyCodeResult {
  success: true;
  promoCode: PromoCodeRow;
  usage: PromoCodeUsageRow;
  freeAccessId: string;
}

export interface PromoCodeInfo {
  code: string;
  benefitType: "free_fortune" | "discount";
  fortuneType: PromoFortuneType;
  discountPercent: number | null;
  campaignName: string | null;
  validUntil: string | null;
}

export interface UserPromoUsage {
  id: string;
  code: string;
  /** profileId 와 pairId 중 정확히 하나만 set (fortuneType 에 따라) */
  profileId: string | null;
  /** 궁합 운세용 — compatibility_pairs.id */
  pairId: string | null;
  fortuneType: FortuneType;
  usedAt: string;
  campaignName: string | null;
}
