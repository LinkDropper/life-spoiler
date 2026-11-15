import { createAuthClient, createServerClient } from "./client";
import type { FortuneType } from "./fortune";
import { getFortune } from "./fortune";

/**
 * 운세 해석 API 접근 판정 (서버 전용).
 *
 * - 로그인한 사용자만 호출할 수 있다.
 * - profileId를 넘기면 그 프로필의 주인이어야 한다. (남의 프로필 결과를 읽거나 덮어쓰지 못하게)
 * - isPaid가 false면 라우트는 예고편 필드만 내려줘야 한다.
 */

export type FortuneAccess =
  | { ok: true; isPaid: boolean }
  | { ok: false; status: 401 | 403 | 404; error: string };

/** 만료되지 않은 무료 이용권(profile_free_access)이 있는지 */
export const hasFreeAccess = async (
  profileId: string,
  fortuneType: FortuneType
): Promise<boolean> => {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("profile_free_access")
      .select("id")
      .eq("profile_id", profileId)
      .eq("fortune_type", fortuneType)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle();

    if (error) {
      console.error("Free access 확인 실패:", error);
      return false;
    }

    return data !== null;
  } catch {
    return false;
  }
};

const getProfileOwnerId = async (profileId: string): Promise<string | null> => {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("id", profileId)
    .maybeSingle<{ user_id: string }>();

  if (error) {
    console.error("프로필 소유자 조회 실패:", { profileId, error });
    return null;
  }
  return data?.user_id ?? null;
};

export const checkFortuneAccess = async (
  profileId: string | undefined,
  fortuneType: FortuneType,
  year: number
): Promise<FortuneAccess> => {
  const authClient = await createAuthClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401, error: "로그인이 필요합니다." };
  }

  // 프로필 없이 호출하면 저장도 결제도 없으므로 예고편만
  if (!profileId) {
    return { ok: true, isPaid: false };
  }

  const ownerId = await getProfileOwnerId(profileId);
  if (!ownerId) {
    return { ok: false, status: 404, error: "프로필을 찾을 수 없습니다." };
  }
  if (ownerId !== user.id) {
    return { ok: false, status: 403, error: "이 프로필에 접근할 수 없습니다." };
  }

  const fortune = await getFortune(profileId, fortuneType, year);
  if (fortune?.paid_at) {
    return { ok: true, isPaid: true };
  }

  return { ok: true, isPaid: await hasFreeAccess(profileId, fortuneType) };
};
