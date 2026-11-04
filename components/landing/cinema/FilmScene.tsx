"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { pickParticle } from "@/libs/utils";

import { DecadeCounter } from "./DecadeCounter";
import { FilmFrameStill } from "./FilmFrameStill";
import { DEFAULT_TINT, PALACE_TINTS } from "./film-still";
import styles from "./FilmScene.module.css";
import { gsap, MOTION_QUERY, useGSAP } from "./gsap";
import { useLandingCta } from "../useLandingCta";

import type { ChartSnapshotFrame } from "@/libs/landing/chart-snapshot";
import type { CSSProperties, ReactNode } from "react";

interface FilmSceneProps {
  frames: ChartSnapshotFrame[];
  birthYear: number;
  /** 방문자가 직접 그린 명반이면 "내 인생 필름"으로 바뀐다 */
  isMine: boolean;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const tintOf = (frame: ChartSnapshotFrame) =>
  PALACE_TINTS[frame.palaceKey] ?? DEFAULT_TINT;

/**
 * 장면 5 — 인생 필름.
 * 세로 스크롤이 35mm 필름을 가로로 감고, 화면 가운데를 지나는 장면이 "영사"되듯 밝아진다.
 * 칸 생김새는 홈 첫 화면과 같은 공용 FilmFrameStill(그 10년의 밤하늘 + 블러로 잠긴 줄거리 자막),
 * 아래 10년 썸네일 줄(DecadeCounter)이 지금 비추는 장면을 따라가고, 누르면 그 장면까지 감는다.
 */
export const FilmScene = ({ frames, birthYear, isMine }: FilmSceneProps) => {
  const t = useTranslations("landing.cinema.film");
  const locale = useLocale();
  const { handleCtaClick } = useLandingCta("film");
  const stageRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const age = new Date().getFullYear() - birthYear;
  const nowIndex = frames.findIndex(
    (frame) => frame.startAge <= age && age <= frame.endAge
  );
  // 마지막 칸(다음 장면 CTA)을 비출 때도 설명은 마지막 10년을 보여 준다
  const active = frames[Math.min(activeIndex, frames.length - 1)];

  // 내 명반을 그리면 frames가 바뀌어 다시 만든다. revertOnUpdate가 없으면 이전 트윈과
  // ScrollTrigger가 남아(페이지가 길어지기 전 위치로) 같은 필름의 x를 두 개가 다퉈 멈춘 것처럼 보인다.
  useGSAP(
    () => {
      const track = trackRef.current;
      const strip = stripRef.current;
      if (!track || !strip) return;
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
        setActiveIndex((value) =>
          value === nearest ? value : Math.min(nearest, frames.length - 1)
        );
      };

      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        tweenRef.current = gsap.to(track, {
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
        return () => {
          tweenRef.current = null;
        };
      });
      // 움직임 줄이기: 손으로 넘기는 필름에서도 썸네일 줄이 따라오게
      mm.add(REDUCED_MOTION_QUERY, () => {
        strip.addEventListener("scroll", updateFocus, { passive: true });
        updateFocus();
        return () => strip.removeEventListener("scroll", updateFocus);
      });
    },
    { scope: stageRef, dependencies: [frames, isMine], revertOnUpdate: true }
  );

  /** 썸네일을 누르면 그 장면이 화면 가운데 오는 스크롤 위치로 감는다 */
  const handleSelectDecade = (index: number) => {
    const track = trackRef.current;
    const frame =
      track?.querySelectorAll<HTMLElement>("[data-film-frame]")[index];
    if (!track || !frame) return;

    const trigger = tweenRef.current?.scrollTrigger;
    if (!trigger) {
      // 움직임 줄이기: 필름 띠를 가로로 넘긴다
      stripRef.current?.scrollTo({
        left:
          frame.offsetLeft -
          (stripRef.current.clientWidth - frame.clientWidth) / 2,
      });
      return;
    }
    const distance = track.scrollWidth - window.innerWidth;
    const targetX =
      window.innerWidth / 2 - (frame.offsetLeft + frame.clientWidth / 2);
    const progress = Math.min(1, Math.max(0, -targetX / distance));
    window.scrollTo({
      top: trigger.start + progress * (trigger.end - trigger.start),
      behavior: "smooth",
    });
  };

  const renderMeta = (frame: ChartSnapshotFrame) => {
    const bold = (chunks: ReactNode) => (
      <b
        className={styles.metaPalace}
        style={{ "--tint": tintOf(frame) } as CSSProperties}
      >
        {chunks}
      </b>
    );
    if (!frame.theme) {
      return t.rich("metaNoTheme", { palace: frame.palaceName, b: bold });
    }
    return t.rich("meta", {
      palace: frame.palaceName,
      theme: frame.theme,
      copula:
        locale === "ko" ? pickParticle(frame.theme, "이에요", "예요") : "",
      b: bold,
    });
  };

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
                {active.theme && (
                  <span className={styles.nowShowingTheme}>{active.theme}</span>
                )}
              </span>
            </p>
          )}
        </div>

        {/* 모바일에서 남은 높이를 받는 영역. 필름 띠는 칸 높이만큼만 차지한다 */}
        <div className={styles.reelArea}>
          <div className={styles.reel}>
            {/* 필름 가장자리 인쇄 (35mm 에지 코드처럼 주황) */}
            <div className={styles.edgeRow} aria-hidden="true">
              <span>
                {activeIndex < frames.length
                  ? t("edgeCode", {
                      number: String(activeIndex + 1).padStart(2, "0"),
                    })
                  : t("edgeCodeEnd")}
              </span>
              {active && (
                <span>
                  {active.startAge}–{active.endAge}
                </span>
              )}
            </div>

            <div ref={stripRef} className={styles.strip}>
              <ol ref={trackRef} className={styles.track} tabIndex={0}>
                {frames.map((frame, index) => (
                  <li
                    key={`${frame.palaceKey}-${frame.startAge}`}
                    data-film-frame
                    className={styles.frame}
                    aria-current={index === activeIndex ? "step" : undefined}
                  >
                    <FilmFrameStill
                      seedKey={`${frame.palaceKey}-${frame.startAge}`}
                      tint={tintOf(frame)}
                      starNames={frame.stars}
                      skyLabel={t("skyAria", {
                        palace: frame.palaceName,
                        stars: frame.stars.join(", ") || "-",
                      })}
                      ages={t("ages", {
                        start: frame.startAge,
                        end: frame.endAge,
                      })}
                      nowLabel={
                        index === nowIndex ? t("nowShowing") : undefined
                      }
                      lockedLabel={t("lockedSrText")}
                    />
                  </li>
                ))}

                <li
                  data-film-frame
                  className={`${styles.frame} ${styles.frameFinal}`}
                >
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
          </div>
        </div>

        <DecadeCounter
          className={styles.counter}
          items={frames.map((frame) => ({
            key: `${frame.palaceKey}-${frame.startAge}`,
            tint: tintOf(frame),
            label: `${frame.startAge}~${frame.endAge}`,
          }))}
          selectedIndex={Math.min(activeIndex, frames.length - 1)}
          onSelect={handleSelectDecade}
          ariaLabel={t("counterAria")}
        />

        {active && <p className={styles.meta}>{renderMeta(active)}</p>}
      </div>
    </section>
  );
};
