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
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const resolveOwnerUserId = async (
  fortuneType: FortuneType,
  profileId: string
): Promise<string | null> => {
  // 잘못된 형식이면 UUID 컬럼 조회 시 DB 에러(500)가 나므로 사전 차단
  if (!UUID_REGEX.test(profileId)) {
    return null;
  }

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

  // 서로 독립적인 조회는 병렬로 (프로필 목록 / 궁합 / 관상)
  const [profilesResult, paidPairsResult, paidFaceResult] = await Promise.all([
    supabase.from("profiles").select("id").eq("user_id", userId),
    supabase
      .from("compatibility_pairs")
      .select("id")
      .eq("user_id", userId)
      .not("paid_at", "is", null)
      .limit(1),
    supabase
      .from("face_reports")
      .select("id")
      .eq("user_id", userId)
      .not("paid_at", "is", null)
      .limit(1),
  ]);

  // 궁합 결제 이력
  if (paidPairsResult.data && paidPairsResult.data.length > 0) {
    return true;
  }
  // 관상 결제 이력
  if (paidFaceResult.data && paidFaceResult.data.length > 0) {
    return true;
  }

  // 본편 운세 결제 이력 (fortunes는 프로필 id 목록에 의존하므로 이후 조회)
  const profileIds = (profilesResult.data ?? []).map(
    (p) => (p as { id: string }).id
  );
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
