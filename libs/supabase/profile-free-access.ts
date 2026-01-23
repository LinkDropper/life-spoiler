import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerClient } from "./client";
import type { Database, FortuneType, ProfileFreeAccessRow } from "./types";

type SupabaseDB = SupabaseClient<Database>;

export interface FreeAccessStatus {
  granted: boolean;
  expiresAt: string | null;
  grantedBy: string | null;
}

export type FreeAccessMap = Record<FortuneType, FreeAccessStatus>;

/**
 * 프로필의 무료 접근 권한 조회
 */
export const getProfileFreeAccess = async (
  profileId: string
): Promise<ProfileFreeAccessRow[]> => {
  try {
    const supabase = createServerClient() as SupabaseDB;

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("profile_free_access")
      .select("*")
      .eq("profile_id", profileId)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (error || !data) {
      return [];
    }

    return data as ProfileFreeAccessRow[];
  } catch (error) {
    console.error("Error fetching profile free access:", error);
    return [];
  }
};

/**
 * 프로필의 무료 접근 권한을 Map 형태로 조회
 */
export const getProfileFreeAccessMap = async (
  profileId: string
): Promise<FreeAccessMap> => {
  const accessList = await getProfileFreeAccess(profileId);

  const result: FreeAccessMap = {
    lifetime: { granted: false, expiresAt: null, grantedBy: null },
    yearly: { granted: false, expiresAt: null, grantedBy: null },
  };

  for (const access of accessList) {
    result[access.fortune_type] = {
      granted: true,
      expiresAt: access.expires_at,
      grantedBy: access.granted_by,
    };
  }

  return result;
};

/**
 * 특정 운세 타입에 대한 무료 접근 권한 확인
 */
export const hasProfileFreeAccess = async (
  profileId: string,
  fortuneType: FortuneType
): Promise<boolean> => {
  try {
    const supabase = createServerClient() as SupabaseDB;
    const now = new Date().toISOString();

    const { error, count } = await supabase
      .from("profile_free_access")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("fortune_type", fortuneType)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (error) {
      console.error("Error checking profile free access:", error);
      return false;
    }

    return (count ?? 0) > 0;
  } catch (error) {
    console.error("Unexpected error in hasProfileFreeAccess:", error);
    return false;
  }
};
