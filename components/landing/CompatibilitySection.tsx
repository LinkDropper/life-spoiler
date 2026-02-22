"use client";

import { useTranslations } from "next-intl";

import { LifetimeProfileCard } from "@/components/fortune/LifetimeProfileCard";

import styles from "./CompatibilitySection.module.css";

const DEMO_SCORES = {
  wealth: 82,
  career: 75,
  relationship: 90,
  health: 68,
};

export const CompatibilitySection = () => {
  const t = useTranslations("landing.compatibility");

  const labels = {
    mainStar: t("demoMainStarLabel"),
    categories: {
      wealth: t("demoCategories.wealth"),
      career: t("demoCategories.career"),
      relationship: t("demoCategories.relationship"),
      health: t("demoCategories.health"),
    },
  };

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>{t("title")}</h2>
      <div className={styles.cardPreview}>
        <LifetimeProfileCard
          mainStars={["자미"]}
          headline={t("demoHeadline")}
          scores={DEMO_SCORES}
          labels={labels}
          isImage={false}
          shouldShowShareButton={false}
        />
      </div>
      <p className={styles.exampleNote}>{t("exampleNote")}</p>
      <p className={styles.description}>{t("description")}</p>
    </section>
  );
};
