import styles from "./ScoreGauge.module.css";

interface ScoreGaugeProps {
  /** 0~10 (소수점 1자리 권장) */
  score: number;
  /** 점수 아래/옆에 붙을 라벨 (예: "이마", "종합 점수") */
  label?: string;
  /** "total" = 큰 크기 히어로용, "region" = 부위별 카드용 */
  variant?: "total" | "region";
}

const clampScore = (score: number): number => Math.max(0, Math.min(10, score));

export const ScoreGauge = ({
  score,
  label,
  variant = "region",
}: ScoreGaugeProps) => {
  const safe = clampScore(score);
  const fillPercent = (safe / 10) * 100;
  const displayScore = safe.toFixed(1);

  return (
    <div
      className={`${styles.gauge} ${variant === "total" ? styles.total : styles.region}`}
    >
      <div className={styles.header}>
        {label && <span className={styles.label}>{label}</span>}
        <span className={styles.score}>
          {displayScore}
          <span className={styles.outOf}> / 10</span>
        </span>
      </div>
      <div className={styles.bar} role="img" aria-label={`${displayScore}점`}>
        <div className={styles.fill} style={{ width: `${fillPercent}%` }} />
      </div>
    </div>
  );
};
