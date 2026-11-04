/**
 * "상영관 입장" 전환을 언제 보여 줄지 정한다.
 * 근거: designer·growth-strategist 검토(2026-11-04), docs/home-redesign-2026-11.md §8
 *
 * - 운세를 보러 가는 모든 이동(예고편·본편·오늘의 운세·궁합 결과)에 항상 같은 상영관 로딩을 쓴다
 *   (2026-11-05 사용자 결정). 진입점·횟수에 따라 연출을 빼지 않는다 — 빼면 결과 페이지의 예전 로딩이 보였다.
 * - 연출은 약식 한 가지뿐이다. 결과가 이미 준비돼 있으면 일부러 붙잡지 않는다.
 * - 운세 결과가 아닌 곳(공유 페이지·궁합 입력·관상 목록·프로필·결제 등)에는 쓰지 않는다(isScreeningDestination).
 */

/** ticket: 관람권(찢김 뒤) · link: 앱 안의 운세 링크 클릭 · arrival: 코드 이동·새로고침 등으로 도착한 뒤 로딩이 뜬 경우 */
export type ScreeningEntry = "ticket" | "link" | "arrival";
export type ScreeningVariant = "short";

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
 * 상영관 입장은 운세를 보러 갈 때만 쓴다(2026-11-04·05 사용자 결정).
 * 그 밖의 로딩(공유 페이지, 궁합 입력, 관상 목록, 프로필, 결제 등)에는 쓰지 않는다.
 *   /fortune/{lifetime|yearly|past-life|yearly_2027}/{id}          본편
 *   /fortune/{lifetime|yearly|past-life|yearly_2027}/preview/{id}  예고편
 *   /fortune/daily/{id}                                             오늘의 운세
 *   /compatibility/{id}/fortune/{preview|result}                    궁합 예고편·본편
 */
const FORTUNE_DESTINATION =
  /^\/fortune\/(lifetime|yearly|past-life|yearly_2027|daily)\/(preview\/)?[^/]+$/;
const COMPATIBILITY_DESTINATION =
  /^\/compatibility\/[^/]+\/fortune\/(preview|result)$/;

/** 스크린에 띄울 작품: 어떤 운세인지(home.{kind}.title, 오늘의 운세는 daily.home.title)와 예고편인지 */
export type ScreeningFortuneKind =
  | "lifetime"
  | "yearly"
  | "pastLife"
  | "yearly2027"
  | "daily"
  | "compatibility";

export interface ScreeningDestination {
  kind: ScreeningFortuneKind;
  isPreview: boolean;
}

const SEGMENT_KINDS: Record<string, ScreeningFortuneKind> = {
  lifetime: "lifetime",
  yearly: "yearly",
  "past-life": "pastLife",
  yearly_2027: "yearly2027",
  daily: "daily",
};

/** 운세를 보러 가는 경로면 어떤 운세인지, 아니면 null */
export const parseScreeningDestination = (
  href: string
): ScreeningDestination | null => {
  const pathname = toPathname(href);
  const fortune = pathname.match(FORTUNE_DESTINATION);
  if (fortune) {
    return { kind: SEGMENT_KINDS[fortune[1]], isPreview: !!fortune[2] };
  }
  const compatibility = pathname.match(COMPATIBILITY_DESTINATION);
  if (compatibility) {
    return { kind: "compatibility", isPreview: compatibility[1] === "preview" };
  }
  return null;
};

export const isScreeningDestination = (href: string): boolean =>
  parseScreeningDestination(href) !== null;

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
