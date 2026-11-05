import { useTranslations } from "next-intl";

import { rankByScore, toRating } from "@/libs/fortune/lifetime-screen";

import styles from "./screen.module.css";

export type RatingKey = "wealth" | "career" | "relationship" | "health";

export interface RatingItem {
  key: RatingKey;
  label: string;
  score: number;
  /** 한 줄 평 = 분야 제목 */
  review: string;
}

interface RatingBoardProps {
  items: RatingItem[];
}

const toStarText = (count: number): string =>
  `${"★".repeat(count)}${"☆".repeat(5 - count)}`;

/** 네 갈래 관람 평점: 점수 ÷ 10 = 10점 만점, 별 5개, 한 줄 평은 분야 제목 */
export const RatingBoard = ({ items }: RatingBoardProps) => {
  const t = useTranslations("fortune.screen.rating");
  const ranks = rankByScore(
    Object.fromEntries(items.map((item) => [item.key, item.score])) as Record<
      RatingKey,
      number
    >
  );
  const top = items.find((item) => ranks[item.key] === 1);

  return (
    <div className={styles.section}>
      <p className={styles.eyebrow}>RATING</p>
      <h3 className={styles.sectionTitle}>{t("title")}</h3>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      <ul className={styles.ratings} role="list">
        {items.map((item) => {
          const rating = toRating(item.score);
          const isTop = ranks[item.key] === 1;
          return (
            <li
              key={item.key}
              className={`${styles.rating} ${isTop ? styles.ratingTop : ""}`}
            >
              <span className={styles.ratingHead}>
                {item.label}
                <span className={styles.ratingRank}>#{ranks[item.key]}</span>
              </span>
              <span className={styles.ratingScore}>
                <b>{rating.ten}</b>
                <span className={styles.ratingOutOf}>/ 10</span>
              </span>
              <span
                className={styles.ratingStars}
                role="img"
                aria-label={t("starsAria", { count: rating.stars })}
              >
                {toStarText(rating.stars)}
              </span>
              <span className={styles.ratingReview}>{item.review}</span>
            </li>
          );
        })}
      </ul>
      {top && (
        <p className={styles.callout}>
          {t.rich("topCallout", {
            label: top.label,
            score: toRating(top.score).ten,
            b: (chunks) => <b>{chunks}</b>,
          })}
        </p>
      )}
    </div>
  );
};
