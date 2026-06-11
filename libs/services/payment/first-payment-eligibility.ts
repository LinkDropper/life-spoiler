import { createServerClient } from "@/libs/supabase";
import type { FortuneType } from "@/libs/supabase";

import {
  isFirstPaymentEventActive,
  isFirstPaymentEventType,
} from "./first-payment-event";

/**
 * profileId(또는 궁합의 pairId)로 결제 대상의 소유 유저 id를 도출.
 * 첫 결제 자격은 "소유 유저"의 결제 이력으로 판정한다.
 */
export const resolveOwnerUserId = async (
  fortuneType: FortuneType,
  profileId: string
): Promise<string | null> => {
  const supabase = createServerClient();

  if (fortuneType === "compatibility") {
    const { data } = await supabase
      .from("compatibility_pairs")
      .select("user_id")
      .eq("id", profileId)
      .single<{ user_id: string }>();
    return data?.user_id ?? null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("id", profileId)
    .single<{ user_id: string }>();
  return data?.user_id ?? null;
};

/**
 * 유저가 과거에 한 번이라도 결제(paid_at)한 적이 있는지.
 * 본편 운세(fortunes) + 궁합(compatibility_pairs) + 관상(face_reports) 전체를 본다.
 */
export const hasUserEverPaid = async (userId: string): Promise<boolean> => {
  const supabase = createServerClient();

  // 1) 본편 운세: 유저의 프로필들 중 결제된 fortune 존재 여부
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId);
  const profileIds = (profiles ?? []).map((p) => (p as { id: string }).id);

  if (profileIds.length > 0) {
    const { data: paidFortunes } = await supabase
      .from("fortunes")
      .select("id")
      .in("profile_id", profileIds)
      .not("paid_at", "is", null)
      .limit(1);
    if (paidFortunes && paidFortunes.length > 0) {
      return true;
    }
  }

  // 2) 궁합
  const { data: paidPairs } = await supabase
    .from("compatibility_pairs")
    .select("id")
    .eq("user_id", userId)
    .not("paid_at", "is", null)
    .limit(1);
  if (paidPairs && paidPairs.length > 0) {
    return true;
  }

  // 3) 관상
  const { data: paidFace } = await supabase
    .from("face_reports")
    .select("id")
    .eq("user_id", userId)
    .not("paid_at", "is", null)
    .limit(1);
  if (paidFace && paidFace.length > 0) {
    return true;
  }

  return false;
};

/**
 * 이 결제가 "첫 결제 100원" 자격이 되는지 — 서버 권위 판정.
 * 이벤트 진행 중 + 대상 운세 타입 + 소유 유저의 과거 결제 이력 없음.
 *
 * 결제 페이지(표시)와 confirm(검증) 양쪽이 동일하게 이 함수를 사용한다.
 */
export const isFirstPaymentEligible = async (
  fortuneType: FortuneType,
  profileId: string,
  now: Date = new Date()
): Promise<boolean> => {
  if (!isFirstPaymentEventActive(now)) {
    return false;
  }
  if (!isFirstPaymentEventType(fortuneType)) {
    return false;
  }
  const ownerUserId = await resolveOwnerUserId(fortuneType, profileId);
  if (!ownerUserId) {
    return false;
  }
  return !(await hasUserEverPaid(ownerUserId));
};
