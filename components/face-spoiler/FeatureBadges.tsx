"use client";

import { useState } from "react";

import { REGION_LABEL } from "@/libs/face-spoiler/constants/regions";
import type { Intensity, ObservationFeature } from "@/libs/face-spoiler/types";

import styles from "./FeatureBadges.module.css";

interface FeatureBadgesProps {
  features: ObservationFeature[];
  showMoreLabel: string;
  showLessLabel: string;
}

const INTENSITY_CLASS_NAME: Record<Intensity, string> = {
  strong: styles.badgeStrong,
  balanced: styles.badgeBalanced,
  subtle: styles.badgeSubtle,
};

const AXIS_LABEL: Record<string, string> = {
  shape: "모양",
  width: "너비",
  height: "높이",
  length: "길이",
  size: "크기",
  density: "진하기",
  direction: "방향",
  tone: "느낌",
  tilt: "기울기",
  angle: "방향",
  prominence: "또렷함",
  thickness: "두께",
  spacing: "간격",
  distance: "거리",
  balance: "균형",
  proportion: "크기감",
  curve: "곡선",
  clarity: "또렷함",
  volume: "볼륨감",
  texture: "결",
  symmetry: "좌우 균형",
  widthratio: "너비감",
  heightratio: "높이감",
  lengthratio: "길이감",
  widthtoheightratio: "세로·가로 느낌",
  horizontaltoverticalratio: "좌우 느낌",
};

const INITIAL_VISIBLE = 6;

const getAxisLabel = (axis: string): string => {
  const normalized = axis.toLowerCase();
  return AXIS_LABEL[normalized] ?? axis;
};

const isNumericRatioValue = (value: string, axis: string): boolean => {
  if (!axis.toLowerCase().includes("ratio")) {
    return false;
  }
  const num = Number(value);
  return !isNaN(num);
};

export const FeatureBadges = ({
  features,
  showMoreLabel,
  showLessLabel,
}: FeatureBadgesProps) => {
  const [showAll, setShowAll] = useState(false);

  const displayable = features.filter(
    (feature) => !isNumericRatioValue(feature.value, feature.axis)
  );

  if (displayable.length === 0) {
    return null;
  }

  const visible = showAll
    ? displayable
    : displayable.slice(0, INITIAL_VISIBLE);
  const hiddenCount = displayable.length - INITIAL_VISIBLE;
  const hasMore = hiddenCount > 0;

  const handleToggle = () => {
    setShowAll((prev) => !prev);
  };

  return (
    <div className={styles.wrapper}>
      <ul className={styles.root}>
        {visible.map((feature, index) => (
          <li
            key={`${feature.region}-${feature.axis}-${index}`}
            className={`${styles.badge} ${INTENSITY_CLASS_NAME[feature.intensity]}`}
          >
            <span className={styles.badgeAxis}>
              {REGION_LABEL[feature.region as keyof typeof REGION_LABEL] ??
                feature.region}{" "}
              · {getAxisLabel(feature.axis)}
            </span>
            <span className={styles.badgeValue}>{feature.value}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          className={styles.toggleButton}
          onClick={handleToggle}
        >
          {showAll ? showLessLabel : `${showMoreLabel} +${hiddenCount}`}
        </button>
      )}
    </div>
  );
};
