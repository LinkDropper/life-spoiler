/** 홈 셀렉트의 "다른 사람 인생 추가"가 붙여 보내는 redirect 값 */
export const HOME_REDIRECT = "/home";

/** redirect 안에 넣으면 방금 만든 프로필 id로 바뀌는 자리 (궁합 캐스팅: 새 배우를 그 칸에 바로 앉힌다) */
export const NEW_PROFILE_TOKEN = "__new_profile__";

/**
 * 프로필 저장 후 이동할 곳.
 * 홈에서 추가하러 왔으면(redirect=/home) 홈으로 돌아가 방금 만든 프로필을 상영한다.
 * 외부 주소로 새지 않게 `/`로 시작하는 경로만 받는다(`//host`는 막는다).
 */
export const getProfileSetupRedirect = (
  redirectParam: string | null,
  typeParam: string | null,
  profileId: string
): string => {
  if (redirectParam?.startsWith("/") && !redirectParam.startsWith("//")) {
    if (redirectParam === HOME_REDIRECT) {
      return `${HOME_REDIRECT}?profile=${encodeURIComponent(profileId)}`;
    }
    return redirectParam
      .split(NEW_PROFILE_TOKEN)
      .join(encodeURIComponent(profileId));
  }
  return typeParam ? `/profiles?type=${typeParam}` : "/profiles";
};
