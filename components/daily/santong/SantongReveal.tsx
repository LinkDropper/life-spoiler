"use client";

import { useEffect, useRef, useState } from "react";
import { Noto_Serif_KR } from "next/font/google";
import { useTranslations } from "next-intl";

import { trackDailyEvent } from "@/libs/analytics";

import { createSantongSound } from "./santong-sound";
import styles from "./SantongReveal.module.css";

import type { SantongScene } from "./santong-scene";
import type { SantongSound } from "./santong-sound";
import type { DailyLevel } from "@/libs/zi-wei-dou-shu/calculators/daily-fortune-types";

// 막대에 먹으로 쓴 등급 글자 — 캔버스에 그리므로 fontFamily만 쓴다
const stickFont = Noto_Serif_KR({
  weight: "900",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

/** 이만큼 아래로 끌면 최대로 당겨진다 */
const PULL_FULL_PX = 160;
/** scene의 MIN_RELEASE_PULL과 같은 값 — 넘으면 "놓으세요" 안내로 바뀐다 */
const PULL_READY_RATIO = 0.25;
/** 가속도 변화량(m/s²)이 이 이상이면 한 번 흔든 것으로 본다 */
const SHAKE_JERK_THRESHOLD = 14;
const SHAKE_JERK_FULL = 40;

type Phase = "loading" | "idle" | "revealing" | "revealed";
type DrawMethod = "shake" | "pull" | "button";

interface MotionPermissionApi {
  requestPermission?: () => Promise<"granted" | "denied">;
}

interface SantongRevealProps {
  date: string;
  /** 인사말 (예: "11월 3일 화요일 · 지수님의 오늘") */
  greeting: string;
  level: DailyLevel;
  headline: string;
  /** 연출이 끝나(또는 건너뛰어) 결과 화면을 보여줄 때 */
  onDone: () => void;
}

/**
 * 오늘의 운세 첫 열람 연출: 산통을 흔들거나(기기) 화면을 당겼다 놓으면 막대 하나가 솟아
 * 오늘의 등급과 별을 보여준다. 결과 자체는 서버가 이미 계산한 값 그대로다 (같은 날 같은 막대).
 *
 * - 흔들기를 못 하는 환경(데스크톱·센서 없음·iOS 권한 거부)은 당기기 또는 "막대 뽑기" 버튼으로 같은 결과.
 * - WebGL/물리 엔진 초기화 실패 시 연출 없이 바로 결과로 넘어간다.
 */
export const SantongReveal = ({
  date,
  greeting,
  level,
  headline,
  onDone,
}: SantongRevealProps) => {
  const t = useTranslations("daily");
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SantongScene | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const dragRef = useRef<{ y: number } | null>(null);
  const methodRef = useRef<DrawMethod>("button");
  const soundRef = useRef<SantongSound | null>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [shakeProgress, setShakeProgress] = useState(0);
  const [isPullReady, setIsPullReady] = useState(false);
  const [canShake, setCanShake] = useState(false);
  const [needsMotionPermission, setNeedsMotionPermission] = useState(false);

  const grade = t(`grade.${level}`);

  // 씬 생성
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let isCancelled = false;

    const sound = createSantongSound();
    soundRef.current = sound;

    const start = async () => {
      try {
        const { createSantongScene } = await import("./santong-scene");
        if (isCancelled) return;
        const scene = await createSantongScene({
          container: stage,
          label: { grade, level },
          fontFamily: stickFont.style.fontFamily,
          seed: Number(date.replace(/-/g, "")),
          onShakeProgress: setShakeProgress,
          onCollision: sound.playClack,
          onRevealStart: () => {
            sound.playDraw();
            setPhase("revealing");
            trackDailyEvent("daily_santong_draw", {
              date,
              method: methodRef.current,
            });
            navigator.vibrate?.(15);
          },
          onRevealed: () => setPhase("revealed"),
        });
        if (isCancelled) {
          scene.destroy();
          return;
        }
        sceneRef.current = scene;
        setPhase("idle");
      } catch (error) {
        console.error("[SantongReveal] 3D 씬 초기화 실패:", error);
        if (!isCancelled) onDoneRef.current();
      }
    };
    start();

    return () => {
      isCancelled = true;
      sound.dispose();
      soundRef.current = null;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
    // 하루에 한 번 만드는 씬 — 등급·날짜가 바뀌면 화면 자체가 다시 그려진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 기기 흔들기 (iOS는 사용자 동작으로 권한을 받아야 한다)
  useEffect(() => {
    if (phase !== "idle") return;
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window))
      return;
    const permissionApi =
      window.DeviceMotionEvent as unknown as MotionPermissionApi;
    if (typeof permissionApi.requestPermission === "function") {
      setNeedsMotionPermission(true);
    }

    let last: { x: number; y: number; z: number } | null = null;
    const handleMotion = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity;
      if (!a || a.x === null || a.y === null || a.z === null) return;
      setCanShake(true);
      if (last) {
        const jerk = Math.hypot(a.x - last.x, a.y - last.y, a.z - last.z);
        if (jerk > SHAKE_JERK_THRESHOLD) {
          methodRef.current = "shake";
          sceneRef.current?.addShake(
            0.5 + 0.5 * Math.min(1, jerk / SHAKE_JERK_FULL)
          );
        }
      }
      last = { x: a.x, y: a.y, z: a.z };
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [phase]);

  const handleMotionPermission = async () => {
    soundRef.current?.unlock();
    const permissionApi =
      window.DeviceMotionEvent as unknown as MotionPermissionApi;
    try {
      const result = await permissionApi.requestPermission?.();
      if (result === "granted") setCanShake(true);
    } finally {
      setNeedsMotionPermission(false);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "idle") return;
    soundRef.current?.unlock();
    dragRef.current = { y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const amount = Math.max(0, event.clientY - drag.y) / PULL_FULL_PX;
    sceneRef.current?.setPull(amount);
    setIsPullReady(amount >= PULL_READY_RATIO);
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsPullReady(false);
    methodRef.current = "pull";
    sceneRef.current?.release();
  };

  const handleDrawButton = () => {
    methodRef.current = "button";
    soundRef.current?.unlock();
    sceneRef.current?.drawAuto();
  };

  const handleSkip = () => {
    trackDailyEvent("daily_santong_draw", { date, method: "skip" });
    onDone();
  };

  const statusText = (() => {
    if (phase === "revealed") return t("santong.revealed", { grade });
    // 흔드는 중에는 글자 없이 통과 소리만 둔다
    if (phase === "revealing" || shakeProgress > 0.05) return "";
    if (isPullReady) return t("santong.releaseHint");
    return canShake ? t("santong.hint") : t("santong.hintPull");
  })();

  return (
    <div
      className={styles.container}
      role="dialog"
      aria-label={t("santong.title")}
    >
      <div
        ref={stageRef}
        className={styles.stage}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {phase === "revealed" && (
        <>
          <div className={styles.revealGlow} aria-hidden="true" />
          <div className={styles.footerScrim} aria-hidden="true" />
        </>
      )}
      <p className={styles.srOnly}>{t("santong.description")}</p>

      <header className={styles.header}>
        <h1 className={styles.title}>{t("santong.title")}</h1>
        <p className={styles.greeting}>{greeting}</p>
      </header>

      {phase !== "revealed" && (
        <button type="button" className={styles.skip} onClick={handleSkip}>
          {t("santong.skip")}
        </button>
      )}

      <div className={styles.footer}>
        <p
          className={[
            styles.status,
            phase === "revealed" ? styles.statusRevealed : "",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          {statusText}
        </p>
        {phase === "idle" && (
          <div className={styles.actions}>
            {shakeProgress > 0 && (
              <div className={styles.progress} aria-hidden="true">
                <span style={{ transform: `scaleX(${shakeProgress})` }} />
              </div>
            )}
            <button
              type="button"
              className={styles.drawButton}
              onClick={handleDrawButton}
            >
              {t("santong.draw")}
            </button>
            {needsMotionPermission && (
              <button
                type="button"
                className={styles.textButton}
                onClick={handleMotionPermission}
              >
                {t("santong.enableShake")}
              </button>
            )}
          </div>
        )}
        {phase === "revealed" && (
          <div className={styles.result}>
            <p className={styles.headline}>{headline}</p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onDone}
              autoFocus
            >
              {t("santong.viewResult")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
