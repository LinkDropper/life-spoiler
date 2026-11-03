"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { trackLandingEvent } from "@/libs/analytics";

import { ScrollTrigger, useGSAP } from "./gsap";
import styles from "./HourDialScene.module.css";
import { BRANCH_GRID_POSITIONS } from "./palace-layout";
import { PalaceGrid } from "./PalaceGrid";

import type { LandingHourVariant } from "@/libs/landing/landing-cinema-data";

interface HourDialSceneProps {
  birthDate: string;
  hours: LandingHourVariant[];
}

/**
 * 장면 3 — 같은 날 태어나도 시간이 다르면 명궁 자리가 옮겨간다.
 * 스크롤하면 자시 → 해시로 2시간씩 넘어가고, 다이얼을 눌러 바로 골라볼 수도 있다.
 */
export const HourDialScene = ({ birthDate, hours }: HourDialSceneProps) => {
  const t = useTranslations("landing.cinema.hour");
  const stageRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // 모바일에선 다이얼이 가로로 넘기는 한 줄이라, 지금 시진을 가운데로 데려온다.
  // scrollIntoView는 페이지 세로 스크롤까지 움직여 고정 구간을 흔들므로 다이얼만 움직인다.
  useEffect(() => {
    const dial = dialRef.current;
    const active = dial?.children[index] as HTMLElement | undefined;
    if (!dial || !active || dial.scrollWidth <= dial.clientWidth) return;
    dial.scrollTo({
      left: active.offsetLeft - (dial.clientWidth - active.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [index]);

  const current = hours[index];
  const mingPosition = BRANCH_GRID_POSITIONS[current.mingBranch];
  const [year, month, day] = birthDate.split("-").map(Number);

  useGSAP(
    () => {
      triggerRef.current = ScrollTrigger.create({
        trigger: stageRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const next = Math.min(
            hours.length - 1,
            Math.floor(self.progress * hours.length)
          );
          setIndex((value) => (value === next ? value : next));
        },
      });
    },
    { scope: stageRef, dependencies: [hours.length], revertOnUpdate: true }
  );

  const handleSelect = (nextIndex: number) => {
    trackLandingEvent("landing_hour_select", { branch: nextIndex });
    const trigger = triggerRef.current;
    if (!trigger) {
      setIndex(nextIndex);
      return;
    }
    // 고른 시진 구간의 가운데로 스크롤해 스크롤 위치와 화면 상태를 맞춘다
    const segment = (trigger.end - trigger.start) / hours.length;
    window.scrollTo({
      top: trigger.start + segment * (nextIndex + 0.5),
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={stageRef}
      className={styles.stage}
      aria-labelledby="hour-title"
    >
      <div className={styles.viewport}>
        <div className={styles.layout}>
          <div className={styles.copy}>
            <h2 id="hour-title" className={styles.title}>
              {t("title")}
            </h2>
            <p className={styles.description}>
              {t("description", { year, month, day })}
            </p>

            <div className={styles.readout} aria-live="polite">
              <span className={styles.readoutTime}>
                {t("readoutTime", {
                  label: current.label,
                  from: current.fromHour,
                  to: current.toHour,
                })}
              </span>
              <strong key={current.branch} className={styles.readoutOneLiner}>
                {current.oneLiner ?? t("emptyOneLiner")}
              </strong>
              <span className={styles.readoutStars}>
                {current.mingStars.length > 0
                  ? t("mingStars", { stars: current.mingStars.join(" · ") })
                  : t("mingEmpty")}
              </span>
            </div>

            <div
              ref={dialRef}
              className={styles.dial}
              role="radiogroup"
              aria-label={t("dialLabel")}
            >
              {hours.map((hour, hourIndex) => (
                <button
                  key={hour.branch}
                  type="button"
                  role="radio"
                  aria-checked={hourIndex === index}
                  aria-label={t("readoutTime", {
                    label: hour.label,
                    from: hour.fromHour,
                    to: hour.toHour,
                  })}
                  className={`${styles.dialItem} ${hourIndex === index ? styles.dialActive : ""}`}
                  onClick={() => handleSelect(hourIndex)}
                >
                  {hour.label}
                </button>
              ))}
            </div>
          </div>

          {/* 모바일에선 남은 높이를 이 칸이 차지하고, 명반은 그 안에 정사각형으로 맞춘다 */}
          <div className={styles.chartSlot}>
            <div className={styles.chart}>
              <PalaceGrid
                cells={current.cells}
                mingBranch={current.mingBranch}
                centerLabel={t("chartCenter")}
                ariaLabel={t("chartAriaLabel")}
              />
              {/* 명궁 표시가 칸에서 칸으로 미끄러지듯 옮겨간다 */}
              <span
                className={styles.mingMarker}
                style={{
                  left: `${(mingPosition.col - 1) * 25}%`,
                  top: `${(mingPosition.row - 1) * 25}%`,
                }}
                aria-hidden="true"
              >
                <span className={styles.mingBadge}>{t("mingBadge")}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
