import { getTranslations } from "next-intl/server";

import type { Intensity } from "@/libs/face-spoiler/types";

import styles from "./IntensityIndicator.module.css";

interface IntensityIndicatorProps {
  intensity: Intensity;
}

const INTENSITY_FILL_COUNT: Record<Intensity, number> = {
  strong: 3,
  balanced: 2,
  subtle: 1,
};

export const IntensityIndicator = async ({
  intensity,
}: IntensityIndicatorProps) => {
  const t = await getTranslations("faceSpoiler.report.intensity");
  const filled = INTENSITY_FILL_COUNT[intensity];
  const label = t(intensity);

  return (
    <span className={styles.root} aria-label={label}>
      <span className={styles.dots} aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`${styles.dot} ${index < filled ? styles.dotFilled : ""}`}
          />
        ))}
      </span>
      <span className={styles.label}>{label}</span>
    </span>
  );
};
