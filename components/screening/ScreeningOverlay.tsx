"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import {
  LONG_WAIT_MESSAGE_AFTER_MS,
  WAITING_MESSAGE_INTERVAL_MS,
} from "@/libs/screening/screening-policy";

import { NightSkyArt } from "@/components/landing/cinema/NightSkyArt";

import { getLoadedTheater, loadTheater } from "./theater-loader";

import styles from "./ScreeningOverlay.module.css";

import type { ActiveScreening } from "./ScreeningProvider";
import type { TheaterScene } from "./theater-scene";
import type { CSSProperties } from "react";

/** 빛줄기 속 먼지: [가로 %, 세로 %, 지연 ms, 길이 s] — 고정값이라 매번 같은 결로 떠다닌다 */
const DUST = [
  [47, 18, 0, 7],
  [52, 30, 900, 8],
  [44, 46, 300, 6.5],
  [57, 52, 1500, 7.5],
  [39, 66, 600, 8.5],
  [62, 70, 1200, 6],
  [49, 78, 200, 7],
  [33, 84, 1800, 9],
  [68, 86, 400, 8],
  [54, 92, 1100, 7.5],
] as const;

/** 스크린 밤하늘: 명궁 색, 이름 없는 주성 두 개 */
const SCREEN_SKY_TINT = "#c4b5ff";
const SCREEN_SKY_STARS = ["main", "sub"];

/** 앞줄 좌석: 등받이 x 위치(viewBox 400 기준)와 그 자리에 앉은 관객 여부 */
const SEATS = [
  [-38, false],
  [30, false],
  [98, true],
  [166, false],
  [234, false],
  [302, true],
  [370, false],
] as const;
const SEAT_WIDTH = 60;

/** 3D 상영관을 아직 못 받았을 때 어두운 객석에서 기다리는 최대 시간 — 넘으면 CSS 장면 */
const THEATER_LOAD_WAIT_MS = 1200;

/** 기다림이 길어질 때 차례로 바꿔 보여 줄 안내 (screening.waiting.*) */
const WAITING_MESSAGES = ["threading", "chart", "soon"] as const;

/** 앞줄 좌석 실루엣 — 등받이·머리 윗선에만 스크린 빛이 비친다 */
const SeatRow = () => (
  <svg
    className={styles.seats}
    viewBox="0 0 400 130"
    preserveAspectRatio="xMidYMax slice"
    aria-hidden="true"
  >
    {SEATS.map(([x, hasViewer]) => {
      const center = x + SEAT_WIDTH / 2;
      return (
        <g key={x}>
          {hasViewer && (
            <>
              <ellipse cx={center} cy={33} rx={16} ry={19} />
              <path
                d={`M${x + 2} 76 Q${x + 6} 49 ${center} 49 Q${x + SEAT_WIDTH - 6} 49 ${x + SEAT_WIDTH - 2} 76 Z`}
              />
              <path
                className={styles.rim}
                d={`M${center - 13} 22 Q${center} 12 ${center + 13} 22`}
              />
            </>
          )}
          <rect x={x} y={58} width={SEAT_WIDTH} height={90} rx={18} />
          <path
            className={styles.rim}
            d={`M${x + 6} 66 Q${x + 8} 58.6 ${x + 18} 58.6 L${x + SEAT_WIDTH - 18} 58.6 Q${x + SEAT_WIDTH - 8} 58.6 ${x + SEAT_WIDTH - 6} 66`}
          />
        </g>
      );
    })}
  </svg>
);

/** 대기 단계 안내: 처음엔 "상영 준비 중", 대기가 시작되면 차례로, 아주 길어지면 "조금만 더" */
const useWaitingMessage = (
  phase: ActiveScreening["phase"],
  keys: readonly string[]
) => {
  const [key, setKey] = useState("preparing");
  const mountedAtRef = useRef(0);

  useEffect(() => {
    mountedAtRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (phase !== "waiting") {
      return;
    }
    let index = 0;
    const interval = setInterval(() => {
      if (
        performance.now() - mountedAtRef.current >=
        LONG_WAIT_MESSAGE_AFTER_MS
      ) {
        setKey("long");
        clearInterval(interval);
        return;
      }
      setKey(keys[index % keys.length] ?? "preparing");
      index += 1;
    }, WAITING_MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
    // 안내 목록은 한 화면에서 바뀌지 않는다 — 길이만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, keys.length]);

  return key;
};

/** 운세가 아닌 화면(결제 등)에서 상영관 로딩을 쓸 때 바꿔 끼우는 문구 */
export interface ScreeningOverlayCopy {
  preparing: string;
  /** 대기 중 차례로 보여 줄 안내 */
  waiting: readonly string[];
  long: string;
  /** 스크린리더 상태 안내 */
  status: string;
}

interface ScreeningOverlayProps {
  screening: ActiveScreening;
  /** 없으면 건너뛸 수 없다 (탭·키 무시, 안내 숨김) — 결제 확인처럼 기다려야만 하는 로딩 */
  onSkip?: () => void;
  /** 없으면 운세 상영 문구(screening.*) */
  copy?: ScreeningOverlayCopy;
}

/**
 * 상영관 입장 화면 (docs/home-redesign-2026-11.md §8, designer 검토 2026-11-04).
 * 관객 시점: 앞쪽 스크린(필름 칸 비율·검은 3px 프레임, 홈과 같은 밤하늘), 아래쪽 앞줄 좌석.
 * 영사기는 관객 뒤 위쪽에 있어, 빛줄기가 화면 위 바깥의 좁은 점에서 출발해 스크린 윗모서리로 퍼진다.
 * 3D 장면(theater-scene.ts)이 받아져 있고 저사양이 아니면 3D, 아니면 같은 구성의 CSS 장면.
 *
 * 레이어(아래 → 위): 객석 → 스크린 → 빛줄기 → 스크린 빛 번짐 → 좌석 → 비네트.
 * 단계별 화면: entering(영사기 켜짐·타이틀) → waiting(타이틀 + 필름 감김 + 안내) → revealing(스크린 속으로 들어감).
 * 화면 전체가 밝게 번쩍이는 단계는 없다(WCAG 2.3.1). 화면 탭, Esc·Enter·Space로 건너뛴다.
 */
export const ScreeningOverlay = ({
  screening,
  onSkip,
  copy,
}: ScreeningOverlayProps) => {
  const t = useTranslations("screening");
  const { timeline, title, phase } = screening;
  const waitingKeys = copy
    ? copy.waiting.map((_, index) => String(index))
    : WAITING_MESSAGES;
  const messageKey = useWaitingMessage(phase, waitingKeys);
  const resolveCopyMessage = (current: ScreeningOverlayCopy): string => {
    if (messageKey === "preparing") return current.preparing;
    if (messageKey === "long") return current.long;
    return current.waiting[Number(messageKey)] ?? current.preparing;
  };
  const message = copy
    ? resolveCopyMessage(copy)
    : messageKey === "preparing"
      ? t("preparing")
      : t(`waiting.${messageKey}`);
  const statusText = copy ? copy.status : t("status", { title });

  // 3D 장면은 전환이 시작될 때 이미 받아져 있을 때만 쓴다(도중에 바꿔 끼우지 않는다)
  // 3D가 기본. 아직 못 받았으면 같은 어두운 객석(pending)에서 잠깐 기다렸다가 3D로 —
  // 진입점·타이밍에 따라 CSS 장면과 3D가 번갈아 보이지 않게 한다. 저사양·모션 줄이기만 CSS.
  const [mode, setMode] = useState<"3d" | "css" | "pending">(() => {
    if (!screening.allow3D) {
      return "css";
    }
    return getLoadedTheater() ? "3d" : "pending";
  });

  useEffect(() => {
    if (mode !== "pending") {
      return;
    }
    let isCancelled = false;
    const fallback = setTimeout(() => {
      if (!isCancelled) {
        setMode("css");
      }
    }, THEATER_LOAD_WAIT_MS);
    loadTheater().then((theater) => {
      if (!isCancelled) {
        clearTimeout(fallback);
        setMode(theater ? "3d" : "css");
      }
    });
    return () => {
      isCancelled = true;
      clearTimeout(fallback);
    };
  }, [mode]);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<TheaterScene | null>(null);

  useEffect(() => {
    const theater = getLoadedTheater();
    const host = canvasHostRef.current;
    if (mode !== "3d" || !theater || !host) {
      return;
    }
    try {
      sceneRef.current = theater.createTheaterScene({
        container: host,
        title,
        seedKey: title,
        fontFamily:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--font-sb-aggro")
            .trim() || "sans-serif",
        timeline,
        isMobile: window.matchMedia("(pointer: coarse)").matches,
        onFirstFrame: () => setIsCanvasReady(true),
        onError: () => setMode("css"),
      });
    } catch {
      setMode("css");
    }
    return () => {
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
    // 한 번의 상영 동안 작품명·타임라인은 바뀌지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    sceneRef.current?.setPhase(phase);
  }, [mode, phase]);

  useEffect(() => {
    sceneRef.current?.setCaption(message);
  }, [mode, message]);

  useEffect(() => {
    if (!onSkip) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["Escape", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        onSkip();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  const timing = {
    "--fade-in-ms": `${timeline.fadeInMs}ms`,
    "--projector-at": `${timeline.projectorAt}ms`,
    "--title-at": `${timeline.titleAt}ms`,
    "--reveal-ms": `${timeline.revealMs}ms`,
    "--hint-at": `${timeline.hintAt}ms`,
  } as CSSProperties;

  if (mode === "3d" || mode === "pending") {
    return createPortal(
      <div
        className={[styles.overlay, styles.overlay3d, styles[phase]]
          .filter(Boolean)
          .join(" ")}
        style={timing}
        onClick={onSkip}
      >
        <div
          ref={canvasHostRef}
          className={[
            styles.canvasHost,
            isCanvasReady ? styles.canvasReady : "",
          ].join(" ")}
          aria-hidden="true"
        />
        {onSkip && (
          <span className={styles.hint} aria-hidden="true">
            {t("skipHint")}
          </span>
        )}
        <p className={styles.srOnly} role="status" aria-live="polite">
          {statusText}
        </p>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className={[styles.overlay, styles[phase]].filter(Boolean).join(" ")}
      style={timing}
      onClick={onSkip}
    >
      <div className={styles.room} aria-hidden="true" />

      <div className={styles.stage} aria-hidden="true">
        <div className={styles.screen}>
          <div className={styles.picture}>
            {/* 홈·랜딩 인생 필름과 같은 밤하늘 — 작품명마다 같은 하늘이 나온다 */}
            <div className={styles.sky}>
              <NightSkyArt
                seedKey={title}
                tint={SCREEN_SKY_TINT}
                starNames={SCREEN_SKY_STARS}
                label=""
                hideNames
              />
            </div>
            <div className={styles.titleCard}>
              <span className={styles.title}>{title}</span>
              <span key={messageKey} className={styles.caption}>
                {message}
              </span>
            </div>
            <span className={styles.sprockets} />
          </div>
        </div>
        <div className={styles.beam}>
          <span className={styles.haze} />
          {DUST.map(([x, y, delay, duration]) => (
            <span
              key={`${x}-${y}`}
              className={styles.dust}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `calc(var(--projector-at) + ${delay}ms)`,
                animationDuration: `${duration}s`,
              }}
            />
          ))}
        </div>
        <div className={styles.glow} />
      </div>

      <SeatRow />
      <div className={styles.vignette} aria-hidden="true" />

      {onSkip && (
        <span className={styles.hint} aria-hidden="true">
          {t("skipHint")}
        </span>
      )}
      <p className={styles.srOnly} role="status" aria-live="polite">
        {statusText}
      </p>
    </div>,
    document.body
  );
};
