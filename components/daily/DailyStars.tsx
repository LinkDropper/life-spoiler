import { useTranslations } from "next-intl";

import { DAILY_LEVELS } from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";
import type { DailyLevel } from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";

import styles from "./DailyStars.module.css";

interface DailyStarsProps {
  level: DailyLevel;
  /** 별 아래/옆에 등급명을 함께 보여줄지 (기본 true). 접근성 라벨은 항상 부여한다 */
  showGrade?: boolean;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={filled ? styles.starFilled : styles.starEmpty}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M8 1.2l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.9l-4.2 2.3.8-4.7L1.2 6.2l4.7-.7L8 1.2z" />
  </svg>
);

/**
 * 별 개수 + 등급명 (숫자 점수 없음).
 * 별/등급명은 모두 같은 level에서 파생되며, 스크린리더에는 "5점 만점에 4점, 환한 날"로 읽힌다.
 */
export const DailyStars = ({ level, showGrade = true }: DailyStarsProps) => {
  const t = useTranslations("daily");
  const grade = t(`grade.${level}`);

  return (
    <span className={styles.wrapper}>
      <span
        className={styles.stars}
        role="img"
        aria-label={t("stars.label", { level, grade })}
      >
        {DAILY_LEVELS.map((value) => (
          <StarIcon key={value} filled={value <= level} />
        ))}
      </span>
      {showGrade && (
        <span className={styles.grade} aria-hidden="true">
          {grade}
        </span>
      )}
    </span>
  );
};
