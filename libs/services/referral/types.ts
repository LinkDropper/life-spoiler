import type { ReferralRow } from "@/libs/supabase/types";

export type { ReferralRow };

export interface RewardReferralRequest {
  referrerUserId: string;
}

export interface RewardReferralResult {
  success: true;
  referralId: string;
  promoCode: string;
}
