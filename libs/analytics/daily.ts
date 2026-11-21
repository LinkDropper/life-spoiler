import { trackEvent } from "./google-analytics";

/**
 * 오늘의 운세 GA 이벤트 (PRD "계측 이벤트").
 *
 * 생년월일시·이름·profileId는 파라미터에 넣지 않는다. 허용 파라미터만 타입으로 열어 두어
 * 개인정보 키가 실수로 섞이지 않게 한다.
 */

export type DailyEntrySource = "home" | "landing" | "share";
export type DailyShareChannel = "copy_link" | "kakao" | "image";
export type DailyConfidenceParam = "time_known" | "time_unknown";

interface DailyEventParamMap {
  daily_entry_click: { source: DailyEntrySource };
  daily_profile_select: Record<string, never>;
  daily_view: {
    date: string;
    confidence: DailyConfidenceParam;
    overall_level: number;
    profile_time_known: boolean;
    is_return_day: boolean;
  };
  daily_category_expand: {
    date: string;
    category: string;
    overall_level: number;
  };
  daily_cta_click: {
    date: string;
    category: string;
    cta_product: string;
  };
  daily_share_click: { date: string; channel: DailyShareChannel };
  daily_shared_link_open: Record<string, never>;
  daily_shared_cta_click: Record<string, never>;
  daily_time_unknown_notice_click: Record<string, never>;
}

export type DailyEventName = keyof DailyEventParamMap;

export const trackDailyEvent = <E extends DailyEventName>(
  name: E,
  ...params: DailyEventParamMap[E] extends Record<string, never>
    ? []
    : [DailyEventParamMap[E]]
): void => {
  trackEvent(name, params[0]);
};

const LAST_VIEW_STORAGE_KEY = "daily_last_view_date";

/**
 * 오늘 처음이 아니라 "이전 KST 날짜에도 열람한 적이 있는지"를 판정하고, 마지막 열람 날짜를 갱신한다.
 * localStorage에는 마지막 열람 KST 날짜(YYYY-MM-DD)만 저장한다. 같은 날 재열람은 false가 되므로
 * 일 단위 재방문 분석은 `daily_view`의 날짜·사용자 기준으로 한다.
 */
export const consumeIsReturnDay = (todayKst: string): boolean => {
  try {
    const last = window.localStorage.getItem(LAST_VIEW_STORAGE_KEY);
    window.localStorage.setItem(LAST_VIEW_STORAGE_KEY, todayKst);
    return last !== null && last < todayKst;
  } catch {
    // 저장소 접근이 막힌 환경(사생활 보호 모드 등)에서는 재방문 여부를 알 수 없다
    return false;
  }
};
