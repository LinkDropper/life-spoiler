import type { SupabaseClient } from "@supabase/supabase-js";

import { hasFortuneAccessOf } from "@/libs/fortune/entitlement";
import { createAuthClient, createServerClient } from "@/libs/supabase/client";
import type {
  Database,
  FortuneRow,
  ProfileFreeAccessRow,
  ProfileRow,
} from "@/libs/supabase/types";
import type { ZiweiInput } from "@/libs/zi-wei-dou-shu/types";

import { DailyError } from "./errors";

type SupabaseDB = SupabaseClient<Database>;

interface ProfileWithAccess extends ProfileRow {
  fortunes: FortuneRow[];
  profile_free_access: ProfileFreeAccessRow[];
}

/** 서버 컴포넌트/라우트가 쓰는 본인 소유 프로필 정보. 로그·응답에 그대로 싣지 않는다 */
export interface OwnedDailyProfile {
  /** 인사말 표시용. View DTO에는 넣지 않는다 */
  name: string;
  input: ZiweiInput;
  /** 인생운세 결제 또는 무료 이용권 보유 여부 (기존 엔타이틀먼트 판정 재사용) */
  hasLifetime: boolean;
  /** 계정의 프로필 수 ("프로필 변경" 노출 판단용) */
  profileCount: number;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toEngineBirthTime = (profile: ProfileRow): string => {
  if (profile.birth_time_unknown) {
    return "unknown";
  }

  if (!profile.birth_time) {
    // DB CHECK 제약(birth_time_unknown=false → birth_time NOT NULL)이 깨진 상태.
    // 기본 시각으로 덮으면 틀린 일진 결과가 나가므로 드러낸다.
    throw new DailyError(
      "CALCULATION_FAILED",
      "프로필의 태어난 시간을 확인할 수 없어요."
    );
  }

  return profile.birth_time.slice(0, 5);
};

/**
 * 로그인 사용자 본인의 프로필을 불러온다.
 * - 비로그인: UNAUTHORIZED
 * - 없는 프로필: PROFILE_NOT_FOUND
 * - 타인 프로필: FORBIDDEN (기본값/내 프로필로 대체하지 않는다)
 */
export const loadOwnedDailyProfile = async (
  profileId: string
): Promise<OwnedDailyProfile> => {
  const authClient = await createAuthClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    throw new DailyError("UNAUTHORIZED", "로그인이 필요해요.");
  }

  if (!UUID_REGEX.test(profileId)) {
    throw new DailyError("PROFILE_NOT_FOUND", "프로필을 찾을 수 없어요.");
  }

  const supabase = createServerClient() as SupabaseDB;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, fortunes(*), profile_free_access(*)")
    .eq("id", profileId)
    .maybeSingle<ProfileWithAccess>();

  if (error) {
    throw new DailyError("CALCULATION_FAILED", "프로필을 불러오지 못했어요.", {
      dbCode: error.code ?? "unknown",
    });
  }

  if (!profile) {
    throw new DailyError("PROFILE_NOT_FOUND", "프로필을 찾을 수 없어요.");
  }

  if (profile.user_id !== user.id) {
    throw new DailyError("FORBIDDEN", "접근 권한이 없어요.");
  }

  const { count, error: countError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    throw new DailyError("CALCULATION_FAILED", "프로필을 불러오지 못했어요.", {
      dbCode: countError.code ?? "unknown",
    });
  }

  const profileCount = count ?? 0;

  return {
    name: profile.name,
    input: {
      name: profile.name,
      birthDate: profile.birth_date,
      birthTime: toEngineBirthTime(profile),
      gender: profile.gender,
      calendarType: profile.calendar_type,
    },
    hasLifetime: hasFortuneAccessOf(profile, "lifetime"),
    profileCount,
  };
};
