import { hasFortuneAccessOf, type EntitlementSource } from "./entitlement";

/** URL 경로에 쓰는 운세 종류 (전생만 DB 값과 표기가 다르다) */
export type FortuneRouteType =
  | "lifetime"
  | "yearly"
  | "past-life"
  | "yearly_2027"
  | "daily";

export type PaidFortuneRouteType = Exclude<FortuneRouteType, "daily">;

const FORTUNE_ROUTE_TYPES: readonly FortuneRouteType[] = [
  "lifetime",
  "yearly",
  "past-life",
  "yearly_2027",
  "daily",
];

export const isFortuneRouteType = (
  value: string | null
): value is FortuneRouteType =>
  FORTUNE_ROUTE_TYPES.includes(value as FortuneRouteType);

export const toDbFortuneType = (
  type: PaidFortuneRouteType
): "lifetime" | "yearly" | "past_life" | "yearly_2027" =>
  type === "past-life" ? "past_life" : type;

interface FortuneTarget extends EntitlementSource {
  id: string;
}

/** 이 프로필로 이 운세를 볼 수 있으면(결제·무료 이용권) 본편, 아니면 예고편 */
export const hasFortuneAccess = (
  profile: EntitlementSource,
  type: PaidFortuneRouteType
): boolean => hasFortuneAccessOf(profile, toDbFortuneType(type));

/** 프로필 + 운세 종류 → 바로 들어갈 경로. 오늘의 운세는 무료라 결과로 직행 */
export const getFortuneHref = (
  profile: FortuneTarget,
  type: FortuneRouteType
): string => {
  if (type === "daily") return `/fortune/daily/${profile.id}`;

  return hasFortuneAccess(profile, type)
    ? `/fortune/${type}/${profile.id}`
    : `/fortune/${type}/preview/${profile.id}`;
};

/** 프로필이 없을 때 — 운세 이름이 붙은 프로필 입력으로 보내고, 만들면 그 운세로 */
export const getProfileSetupHref = (type?: FortuneRouteType): string =>
  type ? `/profile/setup?type=${type}` : "/profile/setup";
