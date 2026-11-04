import {
  HOME_FORTUNE_KEYS,
  PROFILE_BOUND_KEYS,
  getFortuneHref,
  isFortuneOwned,
} from "./home-profile";
import type { HomeFortuneKey } from "./home-profile";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";

/**
 * 헤더 메뉴의 "상영 시간표". 홈 시간표(getTimetableKeys)와 같은 규칙으로
 * 아직 안 본 운세를 위에, 본 운세를 맨 아래에 둔다. 메뉴에는 홈 히어로가 없으므로
 * 인생 운세도 빼지 않고, 오늘의 운세를 맨 위에 건다.
 */

export type MenuShowKey = "daily" | HomeFortuneKey | "universe";

/** owned: 관람 완료(금), free: 무료(핑크), trailer: 비로그인 인생 운세의 예고편 무료 */
export type MenuShowStatus = "owned" | "free" | "trailer" | null;

export interface MenuShow {
  key: MenuShowKey;
  href: string;
  status: MenuShowStatus;
}

interface MenuLineupInput {
  /** 메뉴가 비추는 프로필(본인). 프로필이 없거나 비로그인이면 null */
  profile: ProfileWithFortunes | null;
  isLoggedIn: boolean;
  /** 친구 우주는 한줄평 번역이 KO뿐이라 KO에서만 건다(홈 시간표와 같은 정책) */
  showUniverse: boolean;
}

const getDailyHref = ({ profile, isLoggedIn }: MenuLineupInput): string => {
  if (!isLoggedIn) {
    return "/login";
  }
  return profile ? `/fortune/daily/${profile.id}` : "/profile/setup";
};

/** 프로필에 묶인 운세는 로그인해야 볼 수 있어 비로그인이면 로그인으로 보낸다 */
const getShowHref = (
  { profile, isLoggedIn }: MenuLineupInput,
  key: HomeFortuneKey
): string => {
  if (!isLoggedIn && PROFILE_BOUND_KEYS.includes(key)) {
    return "/login";
  }
  return getFortuneHref(profile, key);
};

export const buildMenuLineup = (input: MenuLineupInput): MenuShow[] => {
  const { profile, isLoggedIn, showUniverse } = input;
  const ownedKeys = HOME_FORTUNE_KEYS.filter((key) =>
    isFortuneOwned(profile, key)
  );
  const openKeys = HOME_FORTUNE_KEYS.filter((key) => !ownedKeys.includes(key));

  const daily: MenuShow = {
    key: "daily",
    href: getDailyHref(input),
    status: null,
  };
  const open: MenuShow[] = openKeys.map((key) => ({
    key,
    href: getShowHref(input, key),
    status: !isLoggedIn && key === "lifetime" ? "trailer" : null,
  }));
  const universe: MenuShow[] = showUniverse
    ? [{ key: "universe", href: "/universe/create", status: "free" }]
    : [];
  const owned: MenuShow[] = ownedKeys.map((key) => ({
    key,
    href: getShowHref(input, key),
    status: "owned",
  }));

  return [daily, ...open, ...universe, ...owned];
};

/** 쿠폰 목록 API(`GET /api/coupon/list`)의 항목 중 메뉴가 쓰는 필드 */
export interface MenuCouponItem {
  status: "active" | "used" | "expired";
  validUntil: string | null;
}

/** 사용 가능한 쿠폰 수와 그중 가장 빠른 만료일(없으면 null) */
export const summarizeCoupons = (
  coupons: MenuCouponItem[]
): { count: number; earliestExpiry: string | null } => {
  const active = coupons.filter((coupon) => coupon.status === "active");
  const expiries = active
    .map((coupon) => coupon.validUntil)
    .filter((value): value is string => Boolean(value))
    .sort();
  return { count: active.length, earliestExpiry: expiries[0] ?? null };
};
