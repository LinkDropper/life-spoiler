"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { gsap, SplitText, useGSAP } from "./gsap";
import { PalaceGrid } from "./PalaceGrid";
import styles from "./SkyChartScene.module.css";
import { createStarField } from "./star-field";

import type { StarField } from "./star-field";
import type { ChartSnapshot } from "@/libs/landing/chart-snapshot";

interface SkyChartSceneProps {
  protagonist: ChartSnapshot;
}

/** 스크롤 진행도 중 별이 날아와 명반이 완성되기까지의 구간 */
const STAR_PHASE_END = 0.58;
/** 명반이 완성된 뒤 궁을 하나씩 비추는 구간 */
const FOCUS_PHASE_START = 0.6;

/**
 * 장면 1·2 — 밤하늘을 날아가다 별이 12궁 명반으로 모인다.
 * 명반이 잡히면 나(명궁) → 돈(재백궁) → 일(관록궁) → 연애(부처궁)를 차례로 비춘다.
 */
export const SkyChartScene = ({ protagonist }: SkyChartSceneProps) => {
  const t = useTranslations("landing.cinema.sky");
  const stageRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLOListElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fieldRef = useRef<StarField | null>(null);
  const [activeFocus, setActiveFocus] = useState(-1);

  const { focuses } = protagonist;
  const activeBranch = focuses[activeFocus]?.branch ?? null;

  // WebGL 별 무리: three는 이 장면이 마운트될 때만 불러온다
  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    const grid = gridRef.current;
    if (!canvas || !viewport || !grid) return;

    let disposed = false;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const mainStarCounts = Array.from({ length: 12 }, (_, branch) => {
      const cell = protagonist.cells.find((c) => c.branch === branch);
      return cell?.mainStars.length ?? 0;
    });

    const measureGrid = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      fieldRef.current?.setGridRect({
        left: gridRect.left - canvasRect.left,
        top: gridRect.top - canvasRect.top,
        size: gridRect.width,
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      fieldRef.current?.resize(canvas.clientWidth, canvas.clientHeight);
      measureGrid();
    });

    // 화면 밖에서는 렌더 루프를 멈춘다
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      fieldRef.current?.setActive(entry.isIntersecting);
    });

    createStarField(canvas, { mainStarCounts, reducedMotion })
      .then((field) => {
        if (disposed) {
          field.dispose();
          return;
        }
        fieldRef.current = field;
        measureGrid();
        resizeObserver.observe(viewport);
        intersectionObserver.observe(canvas);
      })
      .catch(() => {
        // WebGL을 못 쓰는 환경에선 CSS 밤하늘 배경과 DOM 명반만 보인다
        canvas.hidden = true;
      });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      fieldRef.current?.dispose();
      fieldRef.current = null;
    };
  }, [protagonist.cells]);

  useEffect(() => {
    fieldRef.current?.setHighlight(activeBranch);
  }, [activeBranch]);

  useGSAP(
    () => {
      const split = SplitText.create(titleRef.current, { type: "words" });
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stageRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            fieldRef.current?.setProgress(self.progress / STAR_PHASE_END);
            const focusProgress =
              (self.progress - FOCUS_PHASE_START) / (1 - FOCUS_PHASE_START);
            const nextFocus =
              focusProgress < 0
                ? -1
                : Math.min(
                    focuses.length - 1,
                    Math.floor(focusProgress * focuses.length)
                  );
            setActiveFocus((current) =>
              current === nextFocus ? current : nextFocus
            );
          },
        },
      });

      timeline
        .from(split.words, { opacity: 0.12, stagger: 0.02, duration: 0.1 }, 0)
        .to(`.${styles.intro}`, { opacity: 0, y: -60, duration: 0.1 }, 0.2)
        .fromTo(
          `.${styles.chartLayout}`,
          { opacity: 0 },
          { opacity: 1, duration: 0.1 },
          0.46
        )
        // 타임라인 길이를 스크롤 전체(1)에 맞춘다
        .set({}, {}, 1);
    },
    { scope: stageRef, dependencies: [focuses.length], revertOnUpdate: true }
  );

  return (
    <section
      ref={stageRef}
      className={styles.stage}
      aria-labelledby="sky-title"
    >
      <div ref={viewportRef} className={styles.viewport}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

        <div className={styles.intro}>
          {/* SplitText가 줄바꿈 문자를 지우므로 줄을 요소로 나눈다 */}
          <h1 id="sky-title" ref={titleRef} className={styles.introTitle}>
            <span className={styles.titleLine}>{t("titleLine1")}</span>
            <span className={styles.titleLine}>{t("titleLine2")}</span>
          </h1>
          <p className={styles.introDescription}>{t("description")}</p>
          <span className={styles.scrollHint} aria-hidden="true">
            {t("scrollHint")}
          </span>
        </div>

        <div className={styles.chartLayout}>
          <div className={styles.copy}>
            <h2 className={styles.chartTitle}>{t("chartTitle")}</h2>
            <ol className={styles.focusList}>
              {focuses.map((focus, index) => (
                <li
                  key={focus.palaceKey}
                  className={`${styles.focus} ${index === activeFocus ? styles.focusActive : ""}`}
                  aria-current={index === activeFocus || undefined}
                >
                  <span className={styles.focusTitle}>
                    {t(`focusLabel.${index}`)}
                  </span>
                  <span className={styles.focusMeaning}>{focus.title}</span>
                  <p className={styles.focusReading}>{focus.reading}</p>
                </li>
              ))}
            </ol>
            <p className={styles.caption}>{t("caption")}</p>
          </div>
          {/* 모바일에선 설명을 뺀 남은 높이를 이 칸이 차지하고, 명반은 그 안에 정사각형으로 맞춘다 */}
          <div className={styles.gridSlot}>
            <PalaceGrid
              ref={gridRef}
              className={styles.grid}
              cells={protagonist.cells}
              mingBranch={protagonist.mingBranch}
              highlightBranch={activeBranch}
              centerLabel={t("chartCenter")}
              ariaLabel={t("chartAriaLabel")}
              isOverlay
            />
          </div>
        </div>
      </div>
    </section>
  );
};
