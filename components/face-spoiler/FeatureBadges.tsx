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
          <span className={styles.badgeValue}>{feature.value}</span>
          <span className={styles.badgeAxis}>{feature.axis}</span>
        </li>
      ))}
    </ul>
  );
};
