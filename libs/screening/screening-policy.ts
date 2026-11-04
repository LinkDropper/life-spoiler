/**
 * "상영관 입장" 전환을 언제 보여 줄지 정한다.
 * 근거: designer·growth-strategist 검토(2026-11-04), docs/home-redesign-2026-11.md §8
 *
 * - 연출은 약식 한 가지뿐이다(2026-11-04 사용자 결정: 풀버전·카운트다운 없앰).
 *   결과가 이미 준비돼 있으면 일부러 붙잡지 않고, 입장이 끝나는 대로 스크린 속으로 들어간다.
 * - 관람권(다음 상영작)은 누를 때마다(찢김과 함께) 약식을 보여 준다.
 * - 본편 다시 보기·상영 시간표는 자주 누르므로(홈 방문자 73%가 재방문 소장자) 세션 첫 회만 약식, 이후 바로 이동.
 * - 운세 예고편·본편이 아닌 곳으로 가면 쓰지 않는다(isScreeningDestination).
 */

export type ScreeningEntry = "ticket" | "hero" | "timetable";
export type ScreeningVariant = "short" | "none";

export interface ScreeningEnvironment {
  /** 이 세션에서 상영 전환을 한 번이라도 봤는가 (sessionStorage) */
  hasScreenedThisSession: boolean;
  prefersReducedMotion: boolean;
}

export const decideScreeningVariant = (
  entry: ScreeningEntry,
  env: ScreeningEnvironment
): ScreeningVariant => {
  if (env.prefersReducedMotion) {
    return "none";
  }
  if (entry === "ticket") {
    return "short";
  }
  return env.hasScreenedThisSession ? "none" : "short";
};

/**
 * 상영관 입장은 고정 타임라인이 아니라 단계(phase)로 진행한다. 이 전환은 결과 페이지 로딩을 대신하므로
 * 로딩이 얼마나 걸리든 맞아야 한다.
 *
 * entering(입장: 어두운 객석, 영사기가 켜지고 스크린에 타이틀)
 *   → waiting(타이틀 + 필름 감기는 표시 + 안내, 목적지가 준비될 때까지 무기한)
 *   → revealing(스크린 속으로 들어가며 결과 페이지가 보인다)
 *
 * "준비"는 목적지 경로에 도착했고, 그 페이지의 공용 <Loading/>이 모두 사라진 상태가
 * READY_SETTLE_MS 동안 유지된 것을 말한다(useScreeningHold).
 */
export type ScreeningPhase = "entering" | "waiting" | "revealing";

export interface ScreeningTimeline {
  /** 오버레이가 덮이는 시간 — 이동은 다 덮인 뒤에 시작해 페이지가 바뀌는 게 비치지 않는다 */
  fadeInMs: number;
  /** 실제 이동 시작 */
  navigateAt: number;
  /** 영사기가 켜지고 스크린에 빛이 닿는다 */
  projectorAt: number;
  /** 스크린에 타이틀 카드 */
  titleAt: number;
  /** 준비가 끝나도 이 시각 전에는 걷지 않는다(타이틀을 읽을 시간) */
  readyAt: number;
  /** 스크린 속으로 들어가며 걷히는 시간 */
  revealMs: number;
  /** "탭하면 건너뛰기" 안내 */
  hintAt: number;
}

/** 준비가 바로 끝나면 약 1.1초 */
export const SCREENING_TIMELINE: ScreeningTimeline = {
  fadeInMs: 180,
  navigateAt: 180,
  projectorAt: 80,
  titleAt: 160,
  readyAt: 550,
  revealMs: 550,
  hintAt: 700,
};

/** 준비가 바로 끝났을 때 걸리는 최소 시간 */
export const getMinimumScreeningMs = (timeline: ScreeningTimeline): number =>
  timeline.readyAt + timeline.revealMs;

/** 목적지의 <Loading/>이 사라진 뒤 이만큼 다시 안 나타나야 준비 완료로 본다 */
export const READY_SETTLE_MS = 150;

/** 이 시간 안에 경로가 바뀌지 않으면 이동이 멈춘 것으로 보고 원래 화면으로 돌려준다 */
export const SCREENING_NAVIGATION_TIMEOUT_MS = 8000;

/** 도착했지만 이만큼 지나도 준비가 안 되면 걷고, 페이지 자체 로딩 화면에 넘긴다 */
export const SCREENING_MAX_WAIT_MS = 20000;

/** 기다림이 길어질 때 스크린 아래 안내 문구를 바꾸는 간격 */
export const WAITING_MESSAGE_INTERVAL_MS = 2800;

/** 이보다 오래 기다리면 "조금만 더 기다려 주세요" 문구로 바꾼다 */
export const LONG_WAIT_MESSAGE_AFTER_MS = 10000;

/**
 * 상영관 입장은 운세 미리보기(예고편)·본문(본편)으로 갈 때만 쓴다(2026-11-04 사용자 결정).
 * 그 밖의 로딩(오늘의 운세, 공유 페이지, 궁합 입력, 관상 목록, 프로필, 결제 등)에는 쓰지 않는다.
 *   /fortune/{lifetime|yearly|past-life|yearly_2027}/{id}          본편
 *   /fortune/{lifetime|yearly|past-life|yearly_2027}/preview/{id}  예고편
 *   /compatibility/{id}/fortune/{preview|result}                    궁합 예고편·본편
 */
const SCREENING_DESTINATIONS = [
  /^\/fortune\/(lifetime|yearly|past-life|yearly_2027)\/(preview\/)?[^/]+$/,
  /^\/compatibility\/[^/]+\/fortune\/(preview|result)$/,
];

export const isScreeningDestination = (href: string): boolean => {
  const pathname = toPathname(href);
  return SCREENING_DESTINATIONS.some((pattern) => pattern.test(pathname));
};

/** 경로 비교용: 쿼리·해시를 뗀 pathname */
export const toPathname = (href: string): string =>
  href.split(/[?#]/)[0] || "/";

/** 새 탭·새 창·다운로드 의도인 클릭은 가로채지 않는다 */
export const isPlainLeftClick = (event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}): boolean =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;
