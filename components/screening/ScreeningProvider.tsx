"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { trackScreeningEvent } from "@/libs/analytics";
import {
  READY_SETTLE_MS,
  SCREENING_MAX_WAIT_MS,
  SCREENING_NAVIGATION_TIMEOUT_MS,
  SCREENING_TIMELINE,
  decideScreeningVariant,
  isScreeningDestination,
} from "@/libs/screening/screening-policy";

import { ScreeningOverlay } from "./ScreeningOverlay";

import type { ReactNode } from "react";
import type {
  ScreeningEntry,
  ScreeningPhase,
  ScreeningTimeline,
  ScreeningVariant,
} from "@/libs/screening/screening-policy";

const SESSION_SCREENED_KEY = "life-spoiler:screening-session";

export interface StartScreeningOptions {
  href: string;
  /** 스크린에 띄울 작품명 (예: "올해 운세 예고편") */
  title: string;
  entry: ScreeningEntry;
  /** 실패하면 포커스를 돌려줄 트리거 */
  trigger?: HTMLElement | null;
}

interface ScreeningContextValue {
  /** 연출을 시작했으면 해당 variant, 바로 이동했으면 "none" */
  startScreening: (options: StartScreeningOptions) => ScreeningVariant;
  /** 로딩 중인 화면이 부른다. 반환값을 부르면 해제된다 */
  registerHold: () => () => void;
}

const ScreeningContext = createContext<ScreeningContextValue | null>(null);
/** 상영관이 화면을 덮고 있는가 — 뒤에 깔린 로딩 화면이 영상·애니메이션을 멈추는 데 쓴다 */
const ScreeningCoverContext = createContext(false);

export interface ActiveScreening {
  title: string;
  entry: ScreeningEntry;
  variant: Exclude<ScreeningVariant, "none">;
  timeline: ScreeningTimeline;
  phase: ScreeningPhase;
  /** 저사양 기기가 아니면 3D 장면을 쓸 수 있다(이미 받아져 있을 때만) */
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
  variant: Exclude<ScreeningVariant, "none">;
}

const readFlag = (storage: () => Storage, key: string): boolean => {
  try {
    return storage().getItem(key) === "1";
  } catch {
    return false;
  }
};

const writeFlag = (storage: () => Storage, key: string) => {
  try {
    storage().setItem(key, "1");
  } catch {
    // 저장소를 못 쓰면 다음에 연출이 한 번 더 나올 뿐이다
  }
};

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
 */
export const ScreeningProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<ActiveScreening | null>(null);

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

    const start = ({ href, title, entry, trigger }: StartScreeningOptions) => {
      if (sessionRef.current) {
        return sessionRef.current.variant;
      }
      // 운세 예고편·본편이 아닌 곳으로 가면 연출 없이 바로 이동한다
      if (!isScreeningDestination(href)) {
        routerRef.current.push(href);
        return "none";
      }
      const variant = decideScreeningVariant(entry, {
        hasScreenedThisSession: readFlag(
          () => sessionStorage,
          SESSION_SCREENED_KEY
        ),
        prefersReducedMotion: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches,
      });
      trackScreeningEvent("screening_start", { entry_point: entry, variant });

      if (variant === "none") {
        routerRef.current.push(href);
        return variant;
      }

      writeFlag(() => sessionStorage, SESSION_SCREENED_KEY);

      const timeline = SCREENING_TIMELINE;
      sessionRef.current = {
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
        variant,
      };
      routerRef.current.prefetch(href);
      document.body.style.overflow = "hidden";
      setActive({
        title,
        entry,
        variant,
        timeline,
        phase: "entering",
        allow3D: !isLowEndDevice(),
      });

      schedule(navigate, timeline.navigateAt);
      schedule(() => {
        if (sessionRef.current?.phase === "entering") {
          setPhase("waiting");
        }
      }, timeline.readyAt);
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
      // 도착했지만 로딩이 너무 길면 걷고 페이지 자체 로딩 화면에 넘긴다
      schedule(() => {
        const session = sessionRef.current;
        if (!session?.hasArrived || session.phase === "revealing") {
          return;
        }
        trackScreeningEvent("screening_recovered", { reason: "max_wait" });
        session.isSkipped = true;
        reveal();
      }, SCREENING_MAX_WAIT_MS);
      return variant;
    };

    return {
      start,
      skip,
      registerHold,
      handlePathname,
      recoverFromBfcache,
      dispose: () => {
        timersRef.current.forEach(clearTimeout);
        clearTimeout(settleTimerRef.current);
      },
    };
  }

  useEffect(() => {
    controller.handlePathname(pathname);
  }, [controller, pathname]);

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
        value={!!active && active.phase !== "revealing"}
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
 * 반환값: 지금 상영관이 화면을 덮고 있는가 (덮여 있으면 로딩 영상·Lottie를 그리지 않는다).
 * Provider 밖에서는 아무 일도 하지 않고 false를 돌려준다.
 */
export const useScreeningHold = (): boolean => {
  const context = useContext(ScreeningContext);
  const isCovered = useContext(ScreeningCoverContext);
  useEffect(() => context?.registerHold(), [context]);
  return isCovered;
};
