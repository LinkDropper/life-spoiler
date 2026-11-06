import {
  getFortuneHref,
  isFortuneOwned,
  type HomeFortuneKey,
} from "@/libs/home/home-profile";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";

/**
 * 프로필 목록 = 출연진 명단 (2026-11-06).
 * 운세가 정해져 들어오면(?type=) 배우를 누르면 그 운세로 바로, 아니면 그 배우의 홈 상영관으로.
 */

/** `/profiles?type=` 값 (경로 조각 그대로) */
export type RosterFortuneType =
  | "lifetime"
  | "yearly"
  | "past-life"
  | "yearly_2027"
  | "daily";

const ROSTER_TYPES: readonly RosterFortuneType[] = [
  "lifetime",
  "yearly",
  "past-life",
  "yearly_2027",
  "daily",
];

export const toRosterFortuneType = (
  value: string | null
): RosterFortuneType | null =>
  ROSTER_TYPES.find((type) => type === value) ?? null;

const HOME_KEY_BY_TYPE: Record<
  Exclude<RosterFortuneType, "daily">,
  HomeFortuneKey
> = {
  lifetime: "lifetime",
  yearly: "yearly",
  "past-life": "pastLife",
  yearly_2027: "yearly2027",
};

/** 필모그래피 칩 순서 */
export const FILMOGRAPHY_KEYS = [
  "lifetime",
  "yearly",
  "pastLife",
  "yearly2027",
] as const satisfies readonly HomeFortuneKey[];

export type FilmographyKey = (typeof FILMOGRAPHY_KEYS)[number];

/** 카드 오른쪽: 그 운세를 가졌는지(본편), 아니면 예고편 / 오늘 운세 / 홈 상영관 */
export type RosterState = "owned" | "trailer" | "daily" | "home";

export interface RosterItem {
  id: string;
  name: string;
  isOwn: boolean;
  filmography: Record<FilmographyKey, boolean>;
  state: RosterState;
  href: string;
}

export const toRosterItem = (
  profile: ProfileWithFortunes,
  type: RosterFortuneType | null,
  ownProfileId: string | null
): RosterItem => {
  const filmography = Object.fromEntries(
    FILMOGRAPHY_KEYS.map((key) => [key, isFortuneOwned(profile, key)])
  ) as Record<FilmographyKey, boolean>;
  const base = {
    id: profile.id,
    name: profile.name,
    isOwn: profile.id === ownProfileId,
    filmography,
  };

  if (!type) {
    return {
      ...base,
      state: "home",
      href: `/home?profile=${encodeURIComponent(profile.id)}`,
    };
  }
  // 오늘의 운세는 무료라 결제·예고편 없이 결과로 바로
  if (type === "daily") {
    return { ...base, state: "daily", href: `/fortune/daily/${profile.id}` };
  }
  const key = HOME_KEY_BY_TYPE[type];
  return {
    ...base,
    state: isFortuneOwned(profile, key) ? "owned" : "trailer",
    href: getFortuneHref(profile, key),
  };
};
