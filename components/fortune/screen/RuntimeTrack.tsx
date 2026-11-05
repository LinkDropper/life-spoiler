import styles from "./screen.module.css";

/** 영화 러닝타임 = 99세 */
export const RUNTIME_YEARS = 99;

const TICKS = Array.from({ length: 9 }, (_, index) => (index + 1) * 10);

const toPercent = (age: number): string =>
  `${(Math.min(Math.max(age, 0), RUNTIME_YEARS) / RUNTIME_YEARS) * 100}%`;

interface RuntimeTrackProps {
  age: number;
}

/** 0~99세 막대. 지금 나이까지 채우고, 10년마다 눈금 */
export const RuntimeTrack = ({ age }: RuntimeTrackProps) => (
  <div className={styles.track} aria-hidden="true">
    <span className={styles.trackRail} />
    <span className={styles.trackFill} style={{ width: toPercent(age) }} />
    {TICKS.map((tick) => (
      <span
        key={tick}
        className={styles.trackTick}
        style={{ left: toPercent(tick) }}
      />
    ))}
    <span className={styles.trackHead} style={{ left: toPercent(age) }} />
  </div>
);
