import { REGION_LABEL } from "@/libs/face-spoiler/constants/regions";
import type { Intensity, ObservationFeature } from "@/libs/face-spoiler/types";

import styles from "./FeatureBadges.module.css";

interface FeatureBadgesProps {
  features: ObservationFeature[];
}

const INTENSITY_CLASS_NAME: Record<Intensity, string> = {
  strong: styles.badgeStrong,
  balanced: styles.badgeBalanced,
  subtle: styles.badgeSubtle,
};

const AXIS_LABEL: Record<string, string> = {
  shape: "형태",
  width: "너비",
  height: "높이",
  length: "길이",
  size: "크기",
  density: "농도",
  direction: "방향",
  tone: "톤",
  tilt: "기울기",
  angle: "각도",
  prominence: "돌출",
  thickness: "두께",
  spacing: "간격",
  distance: "거리",
  balance: "균형",
  proportion: "비율",
  curve: "곡선",
  clarity: "선명도",
  volume: "볼륨",
  texture: "결",
  symmetry: "대칭",
  widthratio: "너비 비율",
  heightratio: "높이 비율",
  lengthratio: "길이 비율",
  widthtoheightratio: "가로세로 비율",
  horizontaltoverticalratio: "좌우 비율",
};

const getAxisLabel = (axis: string): string => {
  const normalized = axis.toLowerCase();
  return AXIS_LABEL[normalized] ?? axis;
};

/**
 * 숫자 값을 사람이 읽기 쉬운 비율 표기로 변환.
 * - ratio 축: 0.89 → "약 9 : 10", 4.27 → "약 4 : 1"
 * - 그 외 숫자: 그대로 반환
 */
const formatValue = (value: string, axis: string): string => {
  const num = Number(value);
  if (isNaN(num) || !axis.toLowerCase().includes("ratio")) {
    return value;
  }

  // 근사 정수비를 찾기 위해 분모 1~12 범위에서 가장 가까운 조합 탐색
  let bestN = 1;
  let bestD = 1;
  let bestError = Infinity;

  for (let d = 1; d <= 12; d++) {
    const n = Math.round(num * d);
    if (n < 1) continue;
    const error = Math.abs(num - n / d);
    if (error < bestError) {
      bestError = error;
      bestN = n;
      bestD = d;
    }
  }

  return `약 ${bestN} : ${bestD}`;
};

export const FeatureBadges = ({ features }: FeatureBadgesProps) => {
  if (features.length === 0) {
    return null;
  }

  return (
    <ul className={styles.root}>
      {features.map((feature, index) => (
        <li
          key={`${feature.region}-${feature.axis}-${index}`}
          className={`${styles.badge} ${INTENSITY_CLASS_NAME[feature.intensity]}`}
        >
          <span className={styles.badgeAxis}>
            {REGION_LABEL[feature.region]} · {getAxisLabel(feature.axis)}
          </span>
          <span className={styles.badgeValue}>
            {formatValue(feature.value, feature.axis)}
          </span>
        </li>
      ))}
    </ul>
  );
};
