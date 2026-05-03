"use client";

import Image from "next/image";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ANIMAL_META } from "@/libs/face-spoiler/animal-meta";

import styles from "./AnimalFeatureCard.module.css";

import type { AnimalRatio } from "@/libs/face-spoiler/preview-parser";

interface AnimalFeatureCardProps {
  /** 헤더 라벨 (예: "나의 동물상 특징"). */
  title: string;
  /** 비율 내림차순 1~2개. 첫 항목이 큰 sector(주), 두 번째가 작은 sector(부). */
  animals: AnimalRatio[];
  /** 차트 아래 작은 배지에 노출되는 한 줄 평. */
  oneLiner: string;
  /** 본문 (마크다운, 평문 prose). */
  body: string;
  /** 기본 펼침 여부. 디자인 기본값은 펼침(true). */
  defaultExpanded?: boolean;
}

/**
 * Figma 280x280 pie chart 좌표계.
 * 12 o'clock 에서 시계방향으로 sector 를 그린다 — 시작은 (140, 0).
 */
const CHART = 280;
const RADIUS = 140;
const CENTER = 140;

interface Point {
  x: number;
  y: number;
}

const polarToCartesian = (angleDeg: number, distance: number): Point => {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + distance * Math.sin(rad),
    y: CENTER - distance * Math.cos(rad),
  };
};

/**
 * 12 o'clock 시작, 시계방향으로 startDeg → endDeg sector 를 그린다.
 *
 * 360° (full circle) 는 SVG arc 명령에서 시작/끝 좌표가 동일해 일부 브라우저가
 * 렌더하지 않는다. 두 개의 180° 호(상→하→상)로 분할해 안정적으로 그린다.
 * 예: parseAnimalRatios 가 [100%, 0%] 같은 한쪽 0% 조합을 반환했을 때 primary
 * sector 가 360° 가 되는 케이스.
 */
const describeSector = (startDeg: number, endDeg: number): string => {
  const sweep = endDeg - startDeg;
  if (sweep <= 0) return "";
  if (sweep >= 360) {
    return [
      `M ${CENTER} ${CENTER - RADIUS}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER} ${CENTER + RADIUS}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER} ${CENTER - RADIUS}`,
      "Z",
    ].join(" ");
  }
  const start = polarToCartesian(startDeg, RADIUS);
  const end = polarToCartesian(endDeg, RADIUS);
  const largeArc = sweep > 180 ? 1 : 0;
  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    "Z",
  ].join(" ");
};

/**
 * sector 안 아이콘+라벨 그룹의 시각적 기준점.
 *
 * Figma 위치 (나의 동물상 특징, 65/35) 와 일치하도록 튜닝:
 * - distance 는 항상 0.42R 고정 — 두 sector 라벨이 같은 반지름에 정렬되어 균형감
 * - 좁은 sector (≤180°) 는 sector midline 각도를 그대로 사용
 * - 넓은 sector (>180°) 는 midline 이 너무 깊숙이 들어가 라벨이 가장자리에서
 *   멀어지므로 90° (3 시 horizon) 방향으로 0.5 비율만큼 끌어당긴다
 */
const sectorCentroid = (startDeg: number, endDeg: number): Point => {
  const sweepDeg = endDeg - startDeg;
  const midDeg = (startDeg + endDeg) / 2;
  let positionDeg = midDeg;
  if (sweepDeg > 180) {
    // 넓은 sector — primary 는 항상 0° 에서 시작하므로 midline 은 (90°, 180°] 구간.
    // 90° (3 o'clock) 쪽으로 절반만 당겨 시각적 중심을 sector 의 "벌어진 면" 으로.
    positionDeg = 90 + (midDeg - 90) * 0.5;
  }
  const distance = RADIUS * 0.42;
  return polarToCartesian(positionDeg, distance);
};

const stripParticleSuffix = (name: string): string =>
  name.endsWith("상") ? name.slice(0, -1) : name;

/* ============================================================
   sector 렌더 — Figma 디자인 의도(스크린샷)는 단순 원이 아닌 실제 pie chart.
   primary 가 12시 → 시계방향, 나머지를 secondary 가 채운다.
   ============================================================ */

interface SectorMark {
  centroid: Point;
  startDeg: number;
  endDeg: number;
}

const computeSectors = (animals: AnimalRatio[]): SectorMark[] => {
  if (animals.length === 0) return [];
  if (animals.length === 1) {
    return [{ centroid: { x: CENTER, y: CENTER }, startDeg: 0, endDeg: 360 }];
  }

  const total = animals.reduce((sum, a) => sum + (a.ratio || 0), 0);
  // 비율 합이 0이면 균등 분할 fallback
  if (total <= 0) {
    const a = 360 / animals.length;
    return animals.map((_, i) => {
      const startDeg = i * a;
      const endDeg = startDeg + a;
      return { startDeg, endDeg, centroid: sectorCentroid(startDeg, endDeg) };
    });
  }

  let cursor = 0;
  return animals.map((animal) => {
    const sweep = ((animal.ratio || 0) / total) * 360;
    const startDeg = cursor;
    const endDeg = cursor + sweep;
    cursor = endDeg;
    return { startDeg, endDeg, centroid: sectorCentroid(startDeg, endDeg) };
  });
};

export const AnimalFeatureCard = ({
  title,
  animals,
  oneLiner,
  body,
  defaultExpanded = true,
}: AnimalFeatureCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (animals.length === 0) return null;

  const handleToggle = () => setExpanded((prev) => !prev);

  const sectors = computeSectors(animals);
  const isSingle = animals.length === 1;

  const ariaLabel = animals
    .map((a) => `${stripParticleSuffix(a.name)} ${a.ratio}%`)
    .join(", ");

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <span className={styles.title}>{title}</span>
        <svg
          className={`${styles.chevron} ${
            expanded ? styles.chevronUp : styles.chevronDown
          }`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.55806 7.05806C9.80214 6.81398 10.1979 6.81398 10.4419 7.05806L15.4419 12.0581C15.686 12.3021 15.686 12.6979 15.4419 12.9419C15.1979 13.186 14.8021 13.186 14.5581 12.9419L10 8.38388L5.44194 12.9419C5.19786 13.186 4.80214 13.186 4.55806 12.9419C4.31398 12.6979 4.31398 12.3021 4.55806 12.0581L9.55806 7.05806Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {expanded && (
        <div className={styles.body}>
          <div className={styles.chartFrame}>
            <div className={styles.chart} role="img" aria-label={ariaLabel}>
              <svg
                className={styles.chartSvg}
                viewBox={`0 0 ${CHART} ${CHART}`}
                aria-hidden
              >
                {/*
                 * Sector seam(이웃 path 사이 hairline) 방지 — 작은 동물상 색을
                 * 전체 원으로 깔고, 그 위에 큰 sector 를 덮는다.
                 * 단일(100%) 인 경우엔 base circle 만 노출.
                 */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill={ANIMAL_META[animals[animals.length - 1].name].color}
                />
                {!isSingle && (
                  <path
                    d={describeSector(sectors[0].startDeg, sectors[0].endDeg)}
                    fill={ANIMAL_META[animals[0].name].color}
                  />
                )}
              </svg>

              {animals.map((animal, idx) => {
                const meta = ANIMAL_META[animal.name];
                const { centroid } = sectors[idx];
                const shortName = stripParticleSuffix(animal.name);
                return (
                  <div
                    key={`${animal.name}-mark-${idx}`}
                    className={styles.mark}
                    style={{
                      left: `${(centroid.x / CHART) * 100}%`,
                      top: `${(centroid.y / CHART) * 100}%`,
                    }}
                  >
                    <span className={styles.markIcon} aria-hidden>
                      <Image src={meta.iconSrc} alt="" width={34} height={32} />
                    </span>
                    <span className={styles.markLabel}>
                      {isSingle ? shortName : `${shortName}(${animal.ratio}%)`}
                    </span>
                  </div>
                );
              })}
            </div>

            {oneLiner.length > 0 && (
              <div className={styles.badgeRow}>
                <span className={styles.badge}>{oneLiner}</span>
              </div>
            )}
          </div>

          {body.length > 0 && (
            <div className={styles.description}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
