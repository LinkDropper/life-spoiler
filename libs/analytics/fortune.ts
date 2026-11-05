import { trackEvent } from "./google-analytics";

/**
 * 운세 예고편·본편 화면 GA 이벤트 (docs/fortune-screen-redesign-2026-11.md §3, §9).
 * 개인 정보(이름·생년)는 보내지 않는다.
 */
export type FortuneScreenType =
  | "lifetime"
  | "yearly"
  | "yearly_2027"
  | "past_life"
  | "compatibility";

/** owner = 본인 본편, shared = 친구가 받은 공유 페이지 */
export type FortuneSurface = "owner" | "shared";

export type FortuneSceneId = "act1" | "act2" | "act3" | "act4" | "next" | "end";

interface FortuneEventParamMap {
  fortune_preview_view: { fortune_type: FortuneScreenType };
  fortune_preview_cta_click: {
    fortune_type: FortuneScreenType;
    first_payment: boolean;
  };
  fortune_result_scene_reach: {
    fortune_type: FortuneScreenType;
    surface: FortuneSurface;
    scene: FortuneSceneId;
  };
  /** 상영 컨트롤 바에서 장면 이동. now = "지금 n세"·"지금 n월" 버튼 */
  fortune_result_jump: {
    fortune_type: FortuneScreenType;
    surface: FortuneSurface;
    target: FortuneSceneId | "now";
  };
  /** next_type = 홈 운세 키(yearly, lifetime, yearly2027 …) */
  fortune_next_click: {
    fortune_type: FortuneScreenType;
    next_type: string;
  };
  /** 나이대별 시기를 눌렀을 때. distance = 누른 시기 − 지금 시기 (전체 펼치기는 index -1) */
  fortune_age_focus: {
    fortune_type: FortuneScreenType;
    surface: FortuneSurface;
    index: number;
    distance: number;
    expand_all: boolean;
  };
  /** 월별 시나리오에서 달을 눌렀을 때. distance = 누른 달 − 펼쳐 둔 기준 달 (전체 펼치기는 month -1) */
  fortune_month_focus: {
    fortune_type: FortuneScreenType;
    surface: FortuneSurface;
    month: number;
    distance: number;
    expand_all: boolean;
  };
}

export type FortuneEventName = keyof FortuneEventParamMap;

export const trackFortuneEvent = <E extends FortuneEventName>(
  name: E,
  params: FortuneEventParamMap[E]
): void => {
  trackEvent(name, params);
};
