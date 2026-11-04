import { hasFortuneAccessOf } from "@/libs/fortune/entitlement";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";
import type { FortuneRow } from "@/libs/supabase/types";

/**
 * 로그인 홈의 상태 판정. 근거와 화면 구성은 docs/home-redesign-2026-11.md.
 * 홈 방문자의 73%가 인생 운세 소장자라 첫 화면은 본인의 인생 스포일러 한 줄이다.
 */

type DbFortuneType = FortuneRow["fortune_type"];

/** 홈 목록에 거는 운세. 순서는 누적 결제량 순 (2026-11-03 운영 DB 집계) */
export const HOME_FORTUNE_KEYS = [
  "lifetime",
  "yearly",
  "compatibility",
  "faceReading",
  "pastLife",
  "yearly2027",
] as const;

export type HomeFortuneKey = (typeof HOME_FORTUNE_KEYS)[number];

/** 프로필에 묶여 소장 여부를 알 수 있는 운세의 DB 타입 */
const PROFILE_FORTUNE_TYPES: Partial<Record<HomeFortuneKey, DbFortuneType>> = {
  lifetime: "lifetime",
  yearly: "yearly",
  pastLife: "past_life",
  yearly2027: "yearly_2027",
};

/** 프로필에 묶인 운세(예고편이 있는 운세) */
export const PROFILE_BOUND_KEYS: readonly HomeFortuneKey[] = [
  "lifetime",
  "yearly",
  "pastLife",
  "yearly2027",
];

/** 결과 페이지 경로 조각 (`/fortune/{segment}/...`) */
const FORTUNE_ROUTE_SEGMENTS: Partial<Record<HomeFortuneKey, string>> = {
  lifetime: "lifetime",
  yearly: "yearly",
  pastLife: "past-life",
  yearly2027: "yearly_2027",
};

/** 프로필과 무관한 운세의 진입 경로 */
const STANDALONE_ROUTES: Partial<Record<HomeFortuneKey, string>> = {
  compatibility: "/compatibility",
  faceReading: "/face-spoiler/profiles",
};

export type HomeState =
  | { kind: "noProfile" }
  /** 본편 소장(결제 또는 무료 이용권). 결과 행이 아직 없으면 headline은 null */
  | {
      kind: "owned";
      profile: ProfileWithFortunes;
      /** 인생 운세 결과 JSON. 결과 행이 없으면(이용권만) null */
      lifetimeResult: unknown;
      headline: string | null;
      subline: string | null;
    }
  /** 미리보기만 봤다 — 미결제 인생 운세 행이 있다 */
  | {
      kind: "preview";
      profile: ProfileWithFortunes;
      lifetimeResult: unknown;
      headline: string | null;
      subline: string | null;
    }
  /** 프로필만 있고 인생 운세를 아직 받지 않았다 */
  | { kind: "fresh"; profile: ProfileWithFortunes };

/**
 * 본인 프로필을 고른다.
 * 프로필에는 "본인" 표시가 없고(relationship_to_user는 UI에서 채우지 않음),
 * 가입 직후 첫 프로필 입력으로 만든 것이 본인이므로 가장 먼저 만든 프로필을 쓴다.
 * API 정렬(최신순)에 기대지 않고 created_at으로 직접 비교한다.
 */
export const pickOwnProfile = (
  profiles: ProfileWithFortunes[]
): ProfileWithFortunes | null => {
  if (profiles.length === 0) {
    return null;
  }
  return profiles.reduce((oldest, profile) =>
    profile.created_at < oldest.created_at ? profile : oldest
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readText = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

/**
 * 인생 운세 결과(JSON)에서 스포일러 한 줄을 꺼낸다.
 * headline은 결제 결과 전부에 있고(15~25자), oneLiner는 3.5%에만 있어
 * 보조 문구는 description → oneLiner 순으로 있는 것을 쓴다.
 */
export const readLifeSpoiler = (
  result: unknown
): { headline: string | null; subline: string | null } => {
  const empty = { headline: null, subline: null };
  if (!isRecord(result) || !isRecord(result.interpretation)) {
    return empty;
  }
  const { lifeSpoiler } = result.interpretation;
  if (!isRecord(lifeSpoiler)) {
    return empty;
  }
  return {
    headline: readText(lifeSpoiler, "headline"),
    subline:
      readText(lifeSpoiler, "description") ?? readText(lifeSpoiler, "oneLiner"),
  };
};

/** 명반 요약 API(`POST /api/landing/chart`)가 받는 입력 */
export interface ChartRequest {
  birthDate: string;
  birthTime: string;
  gender: ProfileWithFortunes["gender"];
  calendarType: ProfileWithFortunes["calendar_type"];
}

/** DB 생시(HH:mm:ss)를 엔진 입력(HH:mm 또는 unknown)으로 바꾼다 */
export const toChartRequest = (profile: ProfileWithFortunes): ChartRequest => ({
  birthDate: profile.birth_date,
  birthTime:
    profile.birth_time_unknown || !profile.birth_time
      ? "unknown"
      : profile.birth_time.slice(0, 5),
  gender: profile.gender,
  calendarType: profile.calendar_type,
});

/**
 * 홈이 비출 프로필. 고른 프로필이 없거나 삭제됐으면 처음 만든(본인) 프로필이다.
 */
export const selectHomeProfile = (
  profiles: ProfileWithFortunes[],
  selectedId: string | null
): ProfileWithFortunes | null =>
  profiles.find((profile) => profile.id === selectedId) ??
  pickOwnProfile(profiles);

/** 프로필 셀렉트 순서: 본인(처음 만든 것) 먼저, 나머지는 만든 순서 */
export const orderHomeProfiles = (
  profiles: ProfileWithFortunes[]
): ProfileWithFortunes[] =>
  [...profiles].sort((a, b) => a.created_at.localeCompare(b.created_at));

export const resolveHomeState = (
  profile: ProfileWithFortunes | null
): HomeState => {
  if (!profile) {
    return { kind: "noProfile" };
  }

  const lifetime = profile.fortunes?.find(
    (fortune) => fortune.fortune_type === "lifetime"
  );
  const spoiler = readLifeSpoiler(lifetime?.result);
  const lifetimeResult: unknown = lifetime?.result ?? null;

  if (hasFortuneAccessOf(profile, "lifetime")) {
    return { kind: "owned", profile, lifetimeResult, ...spoiler };
  }
  if (lifetime) {
    return { kind: "preview", profile, lifetimeResult, ...spoiler };
  }
  return { kind: "fresh", profile };
};

/** 프로필 기준 소장 여부. 프로필과 무관한 운세(궁합·관상)는 알 수 없어 false */
export const isFortuneOwned = (
  profile: ProfileWithFortunes | null,
  key: HomeFortuneKey
): boolean => {
  const dbType = PROFILE_FORTUNE_TYPES[key];
  return Boolean(profile && dbType && hasFortuneAccessOf(profile, dbType));
};

/**
 * 운세 진입 경로. `/profiles`의 navigateToFortune과 같은 규칙으로,
 * 소장했으면 결과, 아니면 미리보기로 바로 보낸다(프로필 86%가 1개라 선택 단계를 건너뛴다).
 */
export const getFortuneHref = (
  profile: ProfileWithFortunes | null,
  key: HomeFortuneKey
): string => {
  const standalone = STANDALONE_ROUTES[key];
  if (standalone) {
    return standalone;
  }
  const segment = FORTUNE_ROUTE_SEGMENTS[key] ?? key;
  if (!profile) {
    return "/profile/setup";
  }
  return isFortuneOwned(profile, key)
    ? `/fortune/${segment}/${profile.id}`
    : `/fortune/${segment}/preview/${profile.id}`;
};

/**
 * "다음 편"으로 추천할 운세 하나.
 * 두 번째 구매 실측(인생→올해 760명, 올해→인생 361명, 그 외 22명)을 따라
 * 누적 결제량 순으로 아직 안 산 것 중 첫 번째를 고른다.
 * 인생 운세를 아직 안 산 사람에겐 히어로가 인생 운세를 권하므로 다음 편을 두지 않는다
 * (onboarding 스킬: 세션당 목표 하나).
 */
export const pickNextFortune = (state: HomeState): HomeFortuneKey | null => {
  if (state.kind !== "owned") {
    return null;
  }
  return (
    HOME_FORTUNE_KEYS.find(
      (key) => key !== "lifetime" && !isFortuneOwned(state.profile, key)
    ) ?? null
  );
};

/**
 * "다음 상영작" 근거 수치: 인생 운세를 먼저 산 사람의 두 번째 구매 774건 중
 * 760건(98%)이 올해 운세였다. 2026-11-03 운영 DB 읽기 전용 집계 스냅샷이며,
 * 다시 집계하면 이 값과 측정일을 함께 고친다.
 */
export const YEARLY_AFTER_LIFETIME_PER_100 = 98;

/**
 * 상영 시간표에 걸 운세. 위에서 이미 권한 것은 빼고, 소장한 것은 맨 아래로 내린다.
 * - 다음 상영작(관람권)에 걸린 운세는 뺀다.
 * - 인생 운세는 아직 소장하지 않았으면 뺀다(히어로가 이미 권한다).
 */
export const getTimetableKeys = (
  profile: ProfileWithFortunes | null,
  nextKey: HomeFortuneKey | null
): { open: HomeFortuneKey[]; owned: HomeFortuneKey[] } => {
  const keys = HOME_FORTUNE_KEYS.filter((key) => key !== nextKey);
  const owned = keys.filter((key) => isFortuneOwned(profile, key));
  const open = keys.filter(
    (key) => !owned.includes(key) && !(key === "lifetime" && profile)
  );
  return { open, owned };
};
