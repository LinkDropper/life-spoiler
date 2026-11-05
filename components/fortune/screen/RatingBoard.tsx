import { useTranslations } from "next-intl";

import { rankByScore, toRating } from "@/libs/fortune/lifetime-screen";

import styles from "./screen.module.css";

/** 인생·올해: wealth·career·relationship·health, 궁합: communication·growth·emotion·crisis */
export type RatingKey = string;

export interface RatingItem {
  key: RatingKey;
  label: string;
  score: number;
  /** 한 줄 평 = 분야 제목 */
  review: string;
}

interface RatingBoardProps {
  items: RatingItem[];
  /** 상영 컨트롤 바 버튼이 데려올 앵커 */
  id?: string;
  /** 예고편: 점수와 한 줄 평을 가리고 안내 한 줄 */
  lockedHint?: string;
}

const toStarText = (count: number): string =>
  `${"★".repeat(count)}${"☆".repeat(5 - count)}`;

/** 네 갈래 관람 평점: 점수 ÷ 10 = 10점 만점, 별 5개, 한 줄 평은 분야 제목 */
export const RatingBoard = ({ items, id, lockedHint }: RatingBoardProps) => {
  const isLocked = Boolean(lockedHint);
  const t = useTranslations("fortune.screen.rating");
  const ranks = rankByScore(
    Object.fromEntries(items.map((item) => [item.key, item.score])) as Record<
      RatingKey,
      number
    >
  );
  const top = isLocked
    ? undefined
    : items.find((item) => ranks[item.key] === 1);

  return (
    <div id={id} className={`${styles.section} ${styles.ratingAnchor}`}>
      <p className={styles.eyebrow}>RATING</p>
      <h3 className={styles.sectionTitle}>{t("title")}</h3>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      <ul className={styles.ratings} role="list">
        {items.map((item) => {
          const rating = toRating(item.score);
          const isTop = !isLocked && ranks[item.key] === 1;
          return (
            <li
              key={item.key}
              className={`${styles.rating} ${isTop ? styles.ratingTop : ""}`}
            >
              <span className={styles.ratingHead}>
                {item.label}
                {!isLocked && (
                  <span className={styles.ratingRank}>#{ranks[item.key]}</span>
                )}
              </span>
              <span className={styles.ratingScore}>
                <b className={isLocked ? styles.ratingLocked : undefined}>
                  {isLocked ? "?.?" : rating.ten}
                </b>
                <span className={styles.ratingOutOf}>/ 10</span>
              </span>
              {isLocked ? (
                <span className={styles.ratingStars} aria-hidden="true">
                  {toStarText(0)}
                </span>
              ) : (
                <span
                  className={styles.ratingStars}
                  role="img"
                  aria-label={t("starsAria", { count: rating.stars })}
                >
                  {toStarText(rating.stars)}
                </span>
              )}
              {isLocked ? (
                <span
                  className={`${styles.ratingReview} ${styles.ratingReviewLocked}`}
                  aria-hidden="true"
                >
                  {item.review}
                </span>
              ) : (
                <span className={styles.ratingReview}>{item.review}</span>
              )}
            </li>
          );
        })}
      </ul>
      {lockedHint && <p className={styles.sectionDesc}>{lockedHint}</p>}
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
