import type { RegionScore } from "@/libs/face-spoiler/types.v3";

import { ScoreGauge } from "./ScoreGauge";
import styles from "./RegionScoreCard.module.css";

interface RegionScoreCardProps {
  region: RegionScore;
}

export const RegionScoreCard = ({ region }: RegionScoreCardProps) => (
  <article className={styles.card}>
    <ScoreGauge label={region.label} score={region.score} variant="region" />
    <p className={styles.interpretation}>{region.interpretation}</p>
    <ul className={styles.bullets}>
      {region.bullets.map((bullet, i) => (
        <li key={i} className={styles.bullet}>
          {bullet}
        </li>
      ))}
    </ul>
    <blockquote className={styles.oneLiner}>{region.oneLiner}</blockquote>
  </article>
);
