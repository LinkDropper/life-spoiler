import type { ProfileWithFortunes } from "./types";

/** 홈에서 마지막으로 고른 프로필 id를 기기에 기억하는 키 */
export const SELECTED_PROFILE_STORAGE_KEY = "life-spoiler:selected-profile-id";

/**
 * 기본 선택 프로필: 가장 먼저 만든 프로필(본인으로 가정).
 * API는 created_at 내림차순으로 주므로 순서에 기대지 않고 직접 비교한다.
 */
export const pickDefaultProfile = (
  profiles: ProfileWithFortunes[]
): ProfileWithFortunes | undefined =>
  profiles.reduce<ProfileWithFortunes | undefined>(
    (earliest, profile) =>
      !earliest || profile.created_at < earliest.created_at
        ? profile
        : earliest,
    undefined
  );

/** 기억된 선택이 아직 유효하면 그 프로필, 아니면(삭제·다른 계정) 기본 프로필 */
export const resolveSelectedProfile = (
  profiles: ProfileWithFortunes[],
  selectedProfileId: string | null
): ProfileWithFortunes | undefined =>
  profiles.find((profile) => profile.id === selectedProfileId) ??
  pickDefaultProfile(profiles);

/** 사파리 사생활 보호 모드 등에서는 storage 접근 자체가 throw 할 수 있다 */
export const readStoredProfileId = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(SELECTED_PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const writeStoredProfileId = (profileId: string): void => {
  try {
    window.localStorage.setItem(SELECTED_PROFILE_STORAGE_KEY, profileId);
  } catch {
    // 기억 못 해도 이번 방문의 선택은 메모리 상태로 유지된다
  }
};
