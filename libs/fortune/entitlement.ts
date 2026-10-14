import type { FortuneRow, ProfileFreeAccessRow } from "@/libs/supabase/types";

type DbFortuneType = FortuneRow["fortune_type"];

export interface EntitlementSource {
  fortunes?: FortuneRow[] | null;
  profile_free_access?: ProfileFreeAccessRow[] | null;
}

/** 해당 운세를 결제(paid_at)했는지 */
export const hasPaidFortuneOf = (
  source: EntitlementSource | undefined | null,
  fortuneType: DbFortuneType
): boolean => {
  if (!source?.fortunes) return false;

  return source.fortunes.some(
    (f) => f.fortune_type === fortuneType && f.paid_at !== null
  );
};

/** 만료되지 않은 무료 이용권(profile_free_access)이 있는지. nowIso는 호출 시점 시각 */
export const hasFreeAccessOf = (
  source: EntitlementSource | undefined | null,
  fortuneType: DbFortuneType,
  nowIso: string = new Date().toISOString()
): boolean => {
  if (!source?.profile_free_access) return false;

  return source.profile_free_access.some(
    (access) =>
      access.fortune_type === fortuneType &&
      (access.expires_at === null || access.expires_at > nowIso)
  );
};

/** 결제 또는 무료 이용권 중 하나라도 있으면 접근 가능 */
export const hasFortuneAccessOf = (
  source: EntitlementSource | undefined | null,
  fortuneType: DbFortuneType,
  nowIso?: string
): boolean =>
  hasPaidFortuneOf(source, fortuneType) ||
  hasFreeAccessOf(source, fortuneType, nowIso);
