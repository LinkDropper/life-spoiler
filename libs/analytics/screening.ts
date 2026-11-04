import { trackEvent } from "./google-analytics";

import type {
  ScreeningEntry,
  ScreeningVariant,
} from "@/libs/screening/screening-policy";

/**
 * 상영관 입장 전환 GA 이벤트 (growth-strategist 측정 설계, docs/home-redesign-2026-11.md §8).
 * 건너뛰기율이 마찰 지표, recovered가 오버레이 고착 가드레일이다. 개인 정보는 보내지 않는다.
 */
interface ScreeningEventParamMap {
  screening_start: { entry_point: ScreeningEntry; variant: ScreeningVariant };
  screening_skip: {
    entry_point: ScreeningEntry;
    variant: ScreeningVariant;
    elapsed_ms: number;
  };
  screening_complete: {
    entry_point: ScreeningEntry;
    variant: ScreeningVariant;
    duration_ms: number;
    skipped: boolean;
    /** 전환 시작부터 결과 페이지 준비(로딩 끝)까지. 건너뛰어 준비 전에 걷었으면 -1 */
    ready_ms: number;
  };
  /** timeout: 경로가 안 바뀜 · max_wait: 도착했지만 로딩이 너무 길어 걷음 · bfcache: 뒤로 가기 */
  screening_recovered: { reason: "timeout" | "max_wait" | "bfcache" };
}

export type ScreeningEventName = keyof ScreeningEventParamMap;

export const trackScreeningEvent = <E extends ScreeningEventName>(
  name: E,
  params: ScreeningEventParamMap[E]
): void => {
  trackEvent(name, params);
};
