import { getTranslations } from "next-intl/server";

import { REVIEW_KEYS } from "@/constants/reviews";

import { ReviewCarousel } from "./ReviewCarousel";
import styles from "./ReviewSection.module.css";

export const ReviewSection = async () => {
  const t = await getTranslations("landing.reviews");

  const reviews = REVIEW_KEYS.map((key) => ({
    key,
    name: t(`items.${key}.name`),
    content: t(`items.${key}.content`),
  }));

  return (
    <section className={styles.container}>
      <ReviewCarousel reviews={reviews} />
    </section>
  );
};
