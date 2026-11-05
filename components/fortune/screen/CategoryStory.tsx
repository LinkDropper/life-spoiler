import { useTranslations } from "next-intl";

import { MarkdownContent } from "@/components/fortune";
import { toRating } from "@/libs/fortune/lifetime-screen";
import type { SubSection } from "@/libs/services/ai/types";

import { NumberedSections } from "./NumberedSections";
import styles from "./screen.module.css";

interface CategoryStoryProps {
  label: string;
  score: number;
  headline: string;
  content?: string;
  subSections?: SubSection[];
  oneLiner?: string;
  tags?: string[];
}

/** ACT 3 분야 한 편: 평점 머리 + 제목 + 본문 + 한 줄 정리 */
export const CategoryStory = ({
  label,
  score,
  headline,
  content,
  subSections,
  oneLiner,
  tags,
}: CategoryStoryProps) => {
  const t = useTranslations("fortune.screen.rating");
  const rating = toRating(score);

  return (
    <article className={styles.category}>
      <div className={styles.categoryHead}>
        <div>
          <p className={styles.eyebrow}>SUBPLOT</p>
          <h3 className={styles.categoryName}>{label}</h3>
        </div>
        <span className={styles.ratingScore}>
          <b>{rating.ten}</b>
          <span className={styles.ratingOutOf}>/ 10</span>
        </span>
      </div>
      <span
        className={styles.categoryBar}
        role="img"
        aria-label={t("scoreAria", { score: rating.ten })}
      >
        <span style={{ width: `${Number(rating.ten) * 10}%` }} />
      </span>
      <div className={styles.categoryBody}>
        {tags && tags.length > 0 && (
          <span className={styles.categoryTags}>{tags.join(" · ")}</span>
        )}
        <h4 className={styles.categoryHeadline}>{headline}</h4>
        {subSections && subSections.length > 0 ? (
          <NumberedSections items={subSections} />
        ) : (
          content && (
            <MarkdownContent className={styles.prose}>
              {content}
            </MarkdownContent>
          )
        )}
        {oneLiner && <p className={styles.categoryLine}>{oneLiner}</p>}
      </div>
    </article>
  );
};
