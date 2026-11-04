"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { trackScreeningEvent } from "@/libs/analytics";
import {
  READY_SETTLE_MS,
  SCREENING_MAX_WAIT_MS,
  SCREENING_NAVIGATION_TIMEOUT_MS,
  SCREENING_TIMELINE,
  isPlainLeftClick,
  isScreeningDestination,
  parseScreeningDestination,
} from "@/libs/screening/screening-policy";

import { ScreeningOverlay } from "./ScreeningOverlay";
import { preloadTheater } from "./theater-loader";

import type { ReactNode } from "react";
import type {
  ScreeningEntry,
  ScreeningPhase,
  ScreeningTimeline,
  ScreeningVariant,
} from "@/libs/screening/screening-policy";

/** 관람권처럼 연출을 직접 시작하는 링크에 붙인다 — 전역 링크 가로채기에서 뺀다 */
export const SCREENING_MANUAL_ATTRIBUTE = "data-screening-manual";

export interface StartScreeningOptions {
  href: string;
  /** 스크린에 띄울 작품명 (예: "올해 운세 예고편") */
  title: string;
  entry: ScreeningEntry;
  /** 실패하면 포커스를 돌려줄 트리거 */
  trigger?: HTMLElement | null;
}

interface ScreeningContextValue {
  /** 연출을 시작했으면 true, 운세 경로가 아니라 바로 이동했으면 false */
  startScreening: (options: StartScreeningOptions) => boolean;
  /** 로딩 중인 화면이 부른다. 반환값을 부르면 해제된다 */
  registerHold: () => () => void;
}

const ScreeningContext = createContext<ScreeningContextValue | null>(null);
/** 상영관이 화면을 덮고 있는가 — 뒤에 깔린 로딩 화면이 영상·애니메이션을 멈추는 데 쓴다 */
const ScreeningCoverContext = createContext(false);

export interface ActiveScreening {
  title: string;
  entry: ScreeningEntry;
  variant: ScreeningVariant;
  timeline: ScreeningTimeline;
  phase: ScreeningPhase;
  /** 저사양 기기·모션 줄이기가 아니면 3D 장면 (기기마다 늘 같은 쪽을 쓴다) */
  allow3D: boolean;
}

interface ScreeningSession {
  href: string;
  originPathname: string;
  startedAt: number;
  hasNavigated: boolean;
  hasArrived: boolean;
  /** 한 번 준비되면 다시 null이 되지 않는다(걷히는 중 로딩 재개 방지) */
  readyElapsed: number | null;
  isSkipped: boolean;
  phase: ScreeningPhase;
  trigger: HTMLElement | null;
  entry: ScreeningEntry;
  variant: ScreeningVariant;
}

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isLowEndDevice = (): boolean => {
  const { connection } = navigator as Navigator & {
    connection?: { saveData?: boolean };
  };
  return (
    (navigator.hardwareConcurrency ?? 8) <= 4 || connection?.saveData === true
  );
};

/** 새 페이지의 첫 h1로 포커스를 옮긴다 (스크린리더가 도착을 알 수 있게) */
const focusPageHeading = () => {
  const heading = document.querySelector<HTMLElement>("main h1, h1");
  if (!heading) {
    return;
  }
  if (!heading.hasAttribute("tabindex")) {
    heading.setAttribute("tabindex", "-1");
  }
  heading.focus({ preventScroll: true });
};

/**
 * 운세를 보러 갈 때의 "상영관 입장" 전환 (docs/home-redesign-2026-11.md §8).
 * 결과 페이지 로딩을 대신한다: 루트 레이아웃에 있어 페이지가 바뀌어도 유지되고,
 * 목적지가 준비될 때까지(경로 도착 + 공용 <Loading/>이 모두 사라짐) 스크린 앞에서 기다린다.
 * 단계: entering → waiting → revealing. screening-policy.ts 참고.
 *
 * 운세를 보러 가는 이동이면 출발 위치·방식과 관계없이 늘 같은 상영관을 보여 준다(2026-11-05).
 *   - 앱 안의 운세 링크 클릭: 전역에서 가로채 바로 시작 (관람권은 찢김 뒤에 직접 시작)
 *   - 코드 이동·새로고침 등: 운세 페이지에서 공용 <Loading/>이 뜨는 순간 시작 (예전 로딩은 그리지 않는다)
 */
export const ScreeningProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const tHome = useTranslations("home");
  const tDaily = useTranslations("daily.home");
  const tScreening = useTranslations("screening");
  const [active, setActive] = useState<ActiveScreening | null>(null);
  /** 건너뛰기·대기 상한으로 걷힌 운세 페이지 — 그 페이지의 남은 로딩은 페이지 자체 화면으로 */
  const [dismissedPath, setDismissedPath] = useState<string | null>(null);

  /** 경로로 스크린에 띄울 작품명을 만든다 (예: "올해 운세 예고편") */
  const titleFor = (href: string): string => {
    const destination = parseScreeningDestination(href);
    if (!destination) {
      return "";
    }
    if (destination.kind === "daily") {
      return tDaily("title");
    }
    const title = tHome(`${destination.kind}.title`);
    return destination.isPreview
      ? tScreening("trailer", { title })
      : tScreening("feature", { title });
  };
  const titleForRef = useRef(titleFor);
  titleForRef.current = titleFor;

  const routerRef = useRef(router);
  routerRef.current = router;
  const sessionRef = useRef<ScreeningSession | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const holdCountRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 아래 함수들은 ref만 읽으므로 한 번 만들어 계속 쓴다(타이머·해제 콜백에서 오래된 값을 보지 않게)
  const controllerRef = useRef<ReturnType<typeof createController>>(null);
  if (!controllerRef.current) {
    controllerRef.current = createController();
  }
  const controller = controllerRef.current;

  function createController() {
    const schedule = (callback: () => void, ms: number) => {
      timersRef.current.push(setTimeout(callback, Math.max(0, ms)));
    };

    const elapsed = (session: ScreeningSession) =>
      performance.now() - session.startedAt;

    const setPhase = (phase: ScreeningPhase) => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }
      session.phase = phase;
      setActive((current) => (current ? { ...current, phase } : null));
    };

    const finish = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      clearTimeout(settleTimerRef.current);
      // 로딩이 아직 떠 있는데 걷혔으면(건너뛰기·대기 상한) 이 페이지에서는 다시 덮지 않는다
      if (holdCountRef.current > 0) {
        setDismissedPath(window.location.pathname);
      }
      sessionRef.current = null;
      setActive(null);
      document.body.style.removeProperty("overflow");
    };

    const reveal = () => {
      const session = sessionRef.current;
      if (!session || session.phase === "revealing") {
        return;
      }
      trackScreeningEvent("screening_complete", {
        entry_point: session.entry,
        variant: session.variant,
        duration_ms: Math.round(elapsed(session)),
        skipped: session.isSkipped,
        ready_ms:
          session.readyElapsed === null ? -1 : Math.round(session.readyElapsed),
      });
      setPhase("revealing");
      schedule(() => {
        finish();
        focusPageHeading();
      }, SCREENING_TIMELINE.revealMs);
    };

    /** 지금 다음 단계로 갈 수 있으면 간다 */
    const advance = () => {
      const session = sessionRef.current;
      if (!session || session.phase === "revealing") {
        return;
      }
      // 건너뛰면 준비를 기다리지 않는다(페이지 자체 로딩 화면이 보인다)
      if (session.isSkipped) {
        if (session.hasArrived) {
          reveal();
        }
        return;
      }
      if (session.readyElapsed === null) {
        return;
      }
      // 이미 준비됐으면 타이틀을 읽을 최소 시간만 지나고 바로 걷는다(일부러 붙잡지 않는다)
      const { readyAt } = SCREENING_TIMELINE;
      if (elapsed(session) < readyAt) {
        schedule(advance, readyAt - elapsed(session));
        return;
      }
      reveal();
    };

    /** 도착했고 로딩 화면이 하나도 없는 상태가 잠시 유지되면 준비 완료 */
    const checkReady = () => {
      const session = sessionRef.current;
      clearTimeout(settleTimerRef.current);
      if (!session?.hasArrived || session.readyElapsed !== null) {
        return;
      }
      if (holdCountRef.current > 0) {
        return;
      }
      settleTimerRef.current = setTimeout(() => {
        const { current } = sessionRef;
        if (!current || holdCountRef.current > 0) {
          return;
        }
        current.readyElapsed = elapsed(current);
        advance();
      }, READY_SETTLE_MS);
    };

    const registerHold = () => {
      holdCountRef.current += 1;
      clearTimeout(settleTimerRef.current);
      // 링크를 거치지 않고(코드 이동·새로고침) 운세 페이지에 왔는데 로딩이 뜨면 상영관으로 덮는다
      const current = window.location.pathname;
      if (
        !sessionRef.current &&
        isScreeningDestination(current) &&
        current !== dismissedPathRef.current
      ) {
        startArrived(current);
      }
      let isReleased = false;
      return () => {
        if (isReleased) {
          return;
        }
        isReleased = true;
        holdCountRef.current -= 1;
        checkReady();
      };
    };

    const navigate = () => {
      const session = sessionRef.current;
      if (!session || session.hasNavigated) {
        return;
      }
      session.hasNavigated = true;
      routerRef.current.push(session.href);
    };

    /** 경로가 바뀌면(목적지든, 로그인 등으로 튕겼든) 도착 */
    const handlePathname = (current: string) => {
      const session = sessionRef.current;
      if (
        !session ||
        !session.hasNavigated ||
        session.hasArrived ||
        current === session.originPathname
      ) {
        return;
      }
      session.hasArrived = true;
      checkReady();
      advance();
    };

    const skip = () => {
      const session = sessionRef.current;
      if (!session || session.isSkipped || session.phase === "revealing") {
        return;
      }
      session.isSkipped = true;
      trackScreeningEvent("screening_skip", {
        entry_point: session.entry,
        variant: session.variant,
        elapsed_ms: Math.round(elapsed(session)),
      });
      navigate();
      advance();
    };

    const recoverFromBfcache = () => {
      if (!sessionRef.current) {
        return;
      }
      trackScreeningEvent("screening_recovered", { reason: "bfcache" });
      finish();
    };

    /** 화면을 덮고 단계·타이머를 건다. 이동이 필요한 경우(navigate)와 이미 도착한 경우 모두 쓴다 */
    const open = (session: ScreeningSession, title: string) => {
      const timeline = SCREENING_TIMELINE;
      sessionRef.current = session;
      document.body.style.overflow = "hidden";
      setActive({
        title,
        entry: session.entry,
        variant: session.variant,
        timeline,
        phase: "entering",
        allow3D: !isLowEndDevice() && !prefersReducedMotion(),
      });
      trackScreeningEvent("screening_start", {
        entry_point: session.entry,
        variant: session.variant,
      });
      schedule(() => {
        if (sessionRef.current?.phase === "entering") {
          setPhase("waiting");
        }
      }, timeline.readyAt);
      // 도착했지만 로딩이 너무 길면 걷고 페이지 자체 로딩 화면에 넘긴다
      schedule(() => {
        const { current } = sessionRef;
        if (!current?.hasArrived || current.phase === "revealing") {
          return;
        }
        trackScreeningEvent("screening_recovered", { reason: "max_wait" });
        current.isSkipped = true;
        reveal();
      }, SCREENING_MAX_WAIT_MS);
    };

    const start = ({ href, title, entry, trigger }: StartScreeningOptions) => {
      if (sessionRef.current) {
        return true;
      }
      // 운세를 보러 가는 경로가 아니면 연출 없이 바로 이동한다
      if (!isScreeningDestination(href)) {
        routerRef.current.push(href);
        return false;
      }
      routerRef.current.prefetch(href);
      open(
        {
          href,
          originPathname: window.location.pathname,
          startedAt: performance.now(),
          hasNavigated: false,
          hasArrived: false,
          readyElapsed: null,
          isSkipped: false,
          phase: "entering",
          trigger: trigger ?? null,
          entry,
          variant: "short",
        },
        title
      );
      schedule(navigate, SCREENING_TIMELINE.navigateAt);
      // 경로가 안 바뀌면 어두운 화면에 갇히지 않게 원래 화면으로 돌려준다
      schedule(() => {
        const session = sessionRef.current;
        if (!session || session.hasArrived) {
          return;
        }
        trackScreeningEvent("screening_recovered", { reason: "timeout" });
        finish();
        session.trigger?.focus();
      }, SCREENING_NAVIGATION_TIMEOUT_MS);
      return true;
    };

    /** 이미 운세 페이지에 있고 로딩이 막 떴을 때: 이동 없이 덮기만 한다 */
    function startArrived(pathnameNow: string) {
      open(
        {
          href: pathnameNow,
          originPathname: pathnameNow,
          startedAt: performance.now(),
          hasNavigated: true,
          hasArrived: true,
          readyElapsed: null,
          isSkipped: false,
          phase: "entering",
          trigger: null,
          entry: "arrival",
          variant: "short",
        },
        titleForRef.current(pathnameNow)
      );
    }

    /** 앱 안의 운세 링크 클릭을 가로챈다(새 탭·수정 키·외부 링크·관람권은 제외) */
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isPlainLeftClick(event) || !(event.target instanceof Element)) {
        return;
      }
      const anchor = event.target.closest("a[href]");
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.hasAttribute(SCREENING_MANUAL_ATTRIBUTE) ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname === window.location.pathname ||
        !isScreeningDestination(url.pathname)
      ) {
        return;
      }
      const href = `${url.pathname}${url.search}${url.hash}`;
      // Link의 기본 이동을 막고(Link는 defaultPrevented면 이동하지 않는다) 상영관과 함께 이동한다
      event.preventDefault();
      start({
        href,
        title: titleForRef.current(href),
        entry: "link",
        trigger: anchor,
      });
    };

    return {
      start,
      skip,
      handleDocumentClick,
      registerHold,
      handlePathname,
      recoverFromBfcache,
      dispose: () => {
        timersRef.current.forEach(clearTimeout);
        clearTimeout(settleTimerRef.current);
      },
    };
  }

  // registerHold가 렌더 밖(자식 effect)에서 읽으므로 ref로도 둔다
  const dismissedPathRef = useRef(dismissedPath);
  dismissedPathRef.current = dismissedPath;

  useEffect(() => {
    controller.handlePathname(pathname);
    // 다른 페이지로 가면 "이 페이지에서는 다시 덮지 않음"을 푼다
    setDismissedPath((current) => (current === pathname ? current : null));
  }, [controller, pathname]);

  // 운세 링크 클릭은 앱 어디서든 같은 상영관으로 (캡처 단계: Link의 이동보다 먼저)
  useEffect(() => {
    window.addEventListener("click", controller.handleDocumentClick, true);
    return () =>
      window.removeEventListener("click", controller.handleDocumentClick, true);
  }, [controller]);

  // 3D 상영관은 첫 화면이 다 뜬 뒤 한가할 때 미리 받아 둔다(어느 페이지에서 출발하든 같은 화면이 뜨게)
  useEffect(() => {
    const idle =
      window.requestIdleCallback ??
      ((callback: () => void) => window.setTimeout(callback, 1500));
    idle(() => preloadTheater());
  }, []);

  // 뒤로 가기(bfcache)로 돌아오면 남은 오버레이를 걷는다
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        controller.recoverFromBfcache();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [controller]);

  useEffect(() => controller.dispose, [controller]);

  const contextValue = useRef<ScreeningContextValue>({
    startScreening: controller.start,
    registerHold: controller.registerHold,
  }).current;

  return (
    <ScreeningContext.Provider value={contextValue}>
      <ScreeningCoverContext.Provider
        value={
          active
            ? active.phase !== "revealing"
            : isScreeningDestination(pathname) && pathname !== dismissedPath
        }
      >
        {children}
      </ScreeningCoverContext.Provider>
      {active && (
        <ScreeningOverlay screening={active} onSkip={controller.skip} />
      )}
    </ScreeningContext.Provider>
  );
};

export const useScreening = (): ScreeningContextValue => {
  const context = useContext(ScreeningContext);
  if (!context) {
    throw new Error("useScreening은 ScreeningProvider 안에서 써야 합니다.");
  }
  return context;
};

/**
 * 로딩 화면이 떠 있는 동안 상영 전환이 걷히지 않게 붙잡는다.
 * 공용 <Loading/>이 부르므로 결과 페이지마다 따로 신호를 보낼 필요가 없다.
 * 반환값: 상영관이 화면을 덮고 있거나 곧 덮는가 — 운세 페이지에서는 첫 렌더부터 true라
 * 예전 로딩(영상·Lottie)이 한 프레임도 보이지 않는다.
 * Provider 밖에서는 아무 일도 하지 않고 false를 돌려준다.
 */
export const useScreeningHold = (): boolean => {
  const context = useContext(ScreeningContext);
  const isCovered = useContext(ScreeningCoverContext);
  useEffect(() => context?.registerHold(), [context]);
  return isCovered;
};
