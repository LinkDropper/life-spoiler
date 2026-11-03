import { trackEvent } from "./google-analytics";

/**
 * 랜딩 페이지 GA 이벤트.
 *
 * 어느 장면의 CTA가 전환을 만들었는지, 시진 다이얼·내 명반 그려보기를 실제로 쓰는지를 보고
 * 다음 A/B 테스트(장면 순서, 체험 위치)의 근거로 쓴다.
 */

export type LandingCtaPosition = "sticky" | "try" | "film" | "ticket" | "dawn";

interface LandingEventParamMap {
  landing_cta_click: { position: LandingCtaPosition; authenticated: boolean };
  /** 시진 다이얼을 직접 눌렀을 때 (스크롤로 넘어간 건 세지 않는다) */
  landing_hour_select: { branch: number };
  /** 내 명반 그려보기 — 생년월일 등 입력값은 보내지 않는다 */
  landing_try_submit: {
    status: "success" | "error";
    time_known: boolean;
    calendar: "solar" | "lunar";
  };
  /** 첫 프로필 입력에 랜딩에서 넣은 생년월일시를 이어 채웠을 때 */
  landing_draft_applied: { time_known: boolean };
}

export type LandingEventName = keyof LandingEventParamMap;

export const trackLandingEvent = <E extends LandingEventName>(
  name: E,
  params: LandingEventParamMap[E]
): void => {
  trackEvent(name, params);
};
