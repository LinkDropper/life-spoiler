"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { ZiweiChartGrid } from "@/components/fortune";
import type { ConstellationStar } from "@/libs/fortune/lifetime-screen";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

import styles from "./screen.module.css";

interface ChartConstellationProps {
  chart: ZiweiChart;
  profileName: string;
  wuxingJu: string;
  stars: ConstellationStar[];
  interactive?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Overlay {
  width: number;
  height: number;
  points: Point[];
}

/**
 * 칸 높이가 내용에 따라 달라 비율로는 맞지 않는다.
 * 그려진 궁 칸(data-row·data-col)의 실제 가운데를 재서 선을 잇는다.
 */
const measureOverlay = (
  wrap: HTMLElement,
  stars: ConstellationStar[]
): Overlay | null => {
  const box = wrap.getBoundingClientRect();
  const points: Point[] = [];
  for (const star of stars) {
    const cell = wrap.querySelector<HTMLElement>(
      `[data-row="${star.row}"][data-col="${star.col}"]`
    );
    if (!cell) {
      return null;
    }
    const rect = cell.getBoundingClientRect();
    points.push({
      x: rect.left - box.left + rect.width / 2,
      y: rect.top - box.top + rect.height / 2,
    });
  }
  return { width: box.width, height: box.height, points };
};

/** 원작 · 내 명반: 펼친 명반 위에 포스터와 같은 별자리 선을 겹친다 */
export const ChartConstellation = ({
  chart,
  profileName,
  wuxingJu,
  stars,
  interactive = true,
}: ChartConstellationProps) => {
  const t = useTranslations("fortune.screen.chart");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || stars.length < 4) {
      return;
    }
    const update = () => setOverlay(measureOverlay(wrap, stars));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [stars]);

  const [self, triangle1, triangle2, opposite] = overlay?.points ?? [];

  return (
    <div className={styles.section}>
      <div className={styles.chartWrap} ref={wrapRef}>
        <ZiweiChartGrid
          chart={chart}
          profileName={profileName}
          wuxingJu={wuxingJu}
          interactive={interactive}
        />
        {overlay && self && triangle1 && triangle2 && opposite && (
          <svg
            className={styles.chartOverlay}
            viewBox={`0 0 ${overlay.width} ${overlay.height}`}
            aria-hidden="true"
          >
            <path
              d={`M${self.x} ${self.y} L${triangle1.x} ${triangle1.y} L${triangle2.x} ${triangle2.y} Z`}
              fill="none"
              stroke="#ff8fb1"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
            <line
              x1={self.x}
              y1={self.y}
              x2={opposite.x}
              y2={opposite.y}
              stroke="#ffe7a3"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
          </svg>
        )}
      </div>
      {stars.length >= 4 && (
        <p className={styles.chartLegend}>
          <span>
            <i className={styles.legendLine} />
            {t("legendTriangle")}
          </span>
          <span>
            <i className={styles.legendDash} />
            {t("legendOpposite")}
          </span>
        </p>
      )}
    </div>
  );
};
