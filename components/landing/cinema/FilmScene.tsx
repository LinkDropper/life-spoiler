"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  DEFAULT_TINT,
  PALACE_TINTS,
  STILL_HEIGHT,
  STILL_WIDTH,
  createFilmStill,
} from "./film-still";
import styles from "./FilmScene.module.css";
import { gsap, MOTION_QUERY, useGSAP } from "./gsap";
import { useLandingCta } from "../useLandingCta";

import type { ChartSnapshotFrame } from "@/libs/landing/chart-snapshot";
import type { CSSProperties } from "react";

interface FilmSceneProps {
  frames: ChartSnapshotFrame[];
  birthYear: number;
  /** 방문자가 직접 그린 명반이면 "내 인생 필름"으로 바뀐다 */
  isMine: boolean;
}

/** 블러 아래 자리 표시 문구. 읽히면 안 되므로 번역하지 않는다 */
const SPOILER_PLACEHOLDER = "이 10년의 줄거리는 본편에서 공개됩니다";

/** 나이 눈금자 범위 */
const RULER_MAX_AGE = 100;
const RULER_TICKS = Array.from({ length: 11 }, (_, index) => index * 10);

const toPercent = (age: number): string =>
  `${(Math.min(age, RULER_MAX_AGE) / RULER_MAX_AGE) * 100}%`;

/**
 * 장면 5 — 인생 필름.
 * 세로 스크롤이 35mm 필름을 가로로 감고, 화면 가운데를 지나는 장면이 "영사"되듯 밝아진다.
 * 각 장면은 그 10년을 맡는 대운궁의 주제와 별로 그린 스틸컷이고, 줄거리만 본편으로 가린다.
 * 아래 나이 눈금자의 재생 헤드가 지금 비추는 나이를 따라간다.
 */
export const FilmScene = ({ frames, birthYear, isMine }: FilmSceneProps) => {
  const t = useTranslations("landing.cinema.film");
  const { handleCtaClick } = useLandingCta("film");
  const stageRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const playheadRef = useRef<HTMLSpanElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const age = new Date().getFullYear() - birthYear;
  const nowIndex = frames.findIndex(
    (frame) => frame.startAge <= age && age <= frame.endAge
  );
  const active = frames[activeIndex] ?? frames[0];

  const stills = useMemo(
    () =>
      frames.map((frame) =>
        createFilmStill(
          `${frame.palaceKey}-${frame.startAge}`,
          frame.stars.length
        )
      ),
    [frames]
  );

  // 내 명반을 그리면 frames가 바뀌어 다시 만든다. revertOnUpdate가 없으면 이전 트윈과
  // ScrollTrigger가 남아(페이지가 길어지기 전 위치로) 같은 필름의 x를 두 개가 다퉈 멈춘 것처럼 보인다.
  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;
      const frameElements = Array.from(
        track.querySelectorAll<HTMLElement>("[data-film-frame]")
      );

      // 화면 가운데에 가까운 장면일수록 --focus가 1에 가까워진다
      const updateFocus = () => {
        const center = window.innerWidth / 2;
        let nearest = 0;
        let nearestDistance = Infinity;
        frameElements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.left + rect.width / 2 - center);
          const focus = Math.max(0, 1 - distance / (rect.width * 1.1));
          element.style.setProperty("--focus", focus.toFixed(3));
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
          }
        });
        const current = frames[Math.min(nearest, frames.length - 1)];
        if (playheadRef.current && current) {
          playheadRef.current.style.left = toPercent(
            (current.startAge + current.endAge) / 2
          );
        }
        setActiveIndex((value) =>
          value === nearest ? value : Math.min(nearest, frames.length - 1)
        );
      };

      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: stageRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
          onUpdate: updateFocus,
        });
        updateFocus();
      });
    },
    { scope: stageRef, dependencies: [frames, isMine], revertOnUpdate: true }
  );

  return (
    <section
      ref={stageRef}
      className={styles.stage}
      style={{ "--frame-count": frames.length + 1 } as CSSProperties}
      aria-labelledby="film-title"
    >
      <div className={styles.viewport}>
        <div className={styles.header}>
          <div>
            <h2 id="film-title" className={styles.title}>
              {isMine ? t("titleMine") : t("title")}
            </h2>
            <p className={styles.description}>{t("description")}</p>
          </div>
          {active && (
            <p className={styles.nowShowing} aria-live="polite">
              <span className={styles.nowShowingLabel}>{t("nowShowing")}</span>
              <span className={styles.nowShowingValue}>
                {t("ages", { start: active.startAge, end: active.endAge })}
                {" · "}
                {active.theme}
              </span>
            </p>
          )}
        </div>

        <div className={styles.strip}>
          <ol ref={trackRef} className={styles.track} tabIndex={0}>
            {frames.map((frame, index) => {
              const tint = PALACE_TINTS[frame.palaceKey] ?? DEFAULT_TINT;
              const still = stills[index];
              const isNow = index === nowIndex;
              return (
                <li
                  key={`${frame.palaceKey}-${frame.startAge}`}
                  data-film-frame
                  className={`${styles.frame} ${isNow ? styles.frameNow : ""}`}
                  style={{ "--tint": tint } as CSSProperties}
                >
                  <span className={styles.edgeCode} aria-hidden="true">
                    {t("edgeCode", {
                      number: String(index + 1).padStart(2, "0"),
                    })}
                  </span>

                  <div className={styles.still}>
                    <svg
                      viewBox={`0 0 ${STILL_WIDTH} ${STILL_HEIGHT}`}
                      className={styles.stillArt}
                      aria-hidden="true"
                    >
                      {still.lines.map(([from, to]) => (
                        <line
                          key={`${from}-${to}`}
                          x1={still.stars[from].x}
                          y1={still.stars[from].y}
                          x2={still.stars[to].x}
                          y2={still.stars[to].y}
                          className={styles.stillLine}
                        />
                      ))}
                      {still.stars.map((star) => (
                        <circle
                          key={`${star.x}-${star.y}`}
                          cx={star.x}
                          cy={star.y}
                          r={star.r}
                          className={
                            star.isMain ? styles.stillMain : styles.stillMinor
                          }
                        />
                      ))}
                    </svg>
                    <span className={styles.stillAges}>
                      {t("ages", { start: frame.startAge, end: frame.endAge })}
                    </span>
                    {isNow && (
                      <span className={styles.nowBadge}>{t("now")}</span>
                    )}
                  </div>

                  <div className={styles.caption}>
                    <span className={styles.palace}>
                      {t("palace", { palace: frame.palaceName })}
                    </span>
                    <strong className={styles.theme}>{frame.theme}</strong>
                    <span className={styles.stars}>
                      {frame.stars.length > 0
                        ? frame.stars.join(" · ")
                        : t("emptyPalace")}
                    </span>
                    <span className={styles.spoiler}>
                      <span className={styles.blurred} aria-hidden="true">
                        {SPOILER_PLACEHOLDER}
                      </span>
                      <span className={styles.srOnly}>{t("lockedSrText")}</span>
                    </span>
                  </div>
                </li>
              );
            })}

            <li
              data-film-frame
              className={`${styles.frame} ${styles.frameFinal}`}
            >
              <span className={styles.edgeCode} aria-hidden="true">
                {t("edgeCodeEnd")}
              </span>
              <div className={styles.finalBody}>
                <p className={styles.finalQuestion}>{t("finalQuestion")}</p>
                <button
                  type="button"
                  className={styles.finalButton}
                  onClick={handleCtaClick}
                  data-landing-cta
                >
                  {t("finalButton")}
                </button>
              </div>
            </li>
          </ol>
        </div>

        <div className={styles.ruler} aria-hidden="true">
          <div className={styles.rulerBar}>
            {frames.map((frame) => (
              <span
                key={`${frame.palaceKey}-${frame.startAge}`}
                className={styles.rulerSegment}
                style={
                  {
                    left: toPercent(frame.startAge),
                    width: `${((frame.endAge - frame.startAge + 1) / RULER_MAX_AGE) * 100}%`,
                    "--tint": PALACE_TINTS[frame.palaceKey] ?? DEFAULT_TINT,
                  } as CSSProperties
                }
              />
            ))}
            {nowIndex >= 0 && (
              <span
                className={styles.rulerNow}
                style={{ left: toPercent(age) }}
              >
                {t("now")}
              </span>
            )}
            <span ref={playheadRef} className={styles.playhead} />
          </div>
          <div className={styles.rulerTicks}>
            {RULER_TICKS.map((tick) => (
              <span
                key={tick}
                className={styles.rulerTick}
                style={{ left: toPercent(tick) }}
              >
                {tick}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
