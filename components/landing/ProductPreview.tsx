"use client";

import {
  LayoutGrid,
  Sparkles,
  Coins,
  Briefcase,
  Heart,
  Activity,
  CalendarRange,
  Calendar,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";

import styles from "./ProductPreview.module.css";

const iconMap = {
  chart: LayoutGrid,
  spoiler: Sparkles,
  wealth: Coins,
  career: Briefcase,
  relationship: Heart,
  health: Activity,
  ageScenario: CalendarRange,
  monthly: Calendar,
  goodBadMonths: Star,
};

export const ProductPreview = () => {
  const t = useTranslations("landing.productPreview");

  const items: Array<{ key: keyof typeof iconMap }> = [
    { key: "chart" },
    { key: "spoiler" },
    { key: "wealth" },
    { key: "career" },
    { key: "relationship" },
    { key: "health" },
    { key: "ageScenario" },
  ];

  const yearlyItems: Array<{ key: keyof typeof iconMap }> = [
    { key: "monthly" },
    { key: "goodBadMonths" },
  ];

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>
        {t("title", { default: "990원에 이 모든 것을 받아보세요" })}
      </h2>

      <ul className={styles.list}>
        {items.map((item) => {
          const Icon = iconMap[item.key];
          return (
            <li key={item.key} className={styles.item}>
              <Icon className={styles.icon} size={18} strokeWidth={1.5} />
              <span className={styles.itemText}>
                {t(`items.${item.key}`, { default: item.key })}
              </span>
            </li>
          );
        })}
      </ul>

      <div className={styles.divider} />

      <h3 className={styles.yearlyTitle}>
        {t("yearlyTitle", { default: "올해 운세도 함께 확인 가능" })}
      </h3>

      <ul className={styles.list}>
        {yearlyItems.map((item) => {
          const Icon = iconMap[item.key];
          return (
            <li key={item.key} className={styles.item}>
              <Icon className={styles.icon} size={18} strokeWidth={1.5} />
              <span className={styles.itemText}>
                {t(`yearlyItems.${item.key}`, { default: item.key })}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
