import { trackEvent } from "./google-analytics";

import type { HomeFortuneKey, HomeState } from "@/libs/home/home-profile";

/**
 * 로그인 홈 GA 이벤트. 결과 문장·생년월일은 보내지 않는다.
 * 어떤 상태의 사람이 어느 자리에서 무엇을 눌렀는지로 홈 구성을 검증한다
 * (docs/home-redesign-2026-11.md §5).
 */

export type HomeCtaPosition = "hero" | "ticket" | "daily" | "timetable";
export type HomeCtaTarget =
  | HomeFortuneKey
  | "daily"
  | "universe"
  | "profileSetup";

interface HomeEventParamMap {
  home_view: { state: HomeState["kind"] };
  home_cta_click: {
    position: HomeCtaPosition;
    target: HomeCtaTarget;
    state: HomeState["kind"];
  };
  /** 상영할 프로필을 바꿨을 때 (프로필 이름·id는 보내지 않는다) */
  home_profile_change: { profile_count: number };
}

export type HomeEventName = keyof HomeEventParamMap;

export const trackHomeEvent = <E extends HomeEventName>(
  name: E,
  params: HomeEventParamMap[E]
): void => {
  trackEvent(name, params);
};
