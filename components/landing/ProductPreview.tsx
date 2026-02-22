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
  Search,
  FileText,
} from "lucide-react";
import { useTranslations } from "next-intl";

import styles from "./ProductPreview.module.css";

import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  chart: LayoutGrid,
  spoiler: Sparkles,
  wealth: Coins,
  career: Briefcase,
  relationship: Heart,
  health: Activity,
  ageScenario: CalendarRange,
  monthly: Calendar,
  goodBadMonths: Star,
  score: Heart,
  insights: Search,
  scenarios: FileText,
  categories: LayoutGrid,
};

const items: Array<{ key: string }> = [
  { key: "chart" },
  { key: "spoiler" },
  { key: "wealth" },
  { key: "career" },
  { key: "relationship" },
  { key: "health" },
  { key: "ageScenario" },
];

const yearlyItems: Array<{ key: string }> = [
  { key: "monthly" },
  { key: "goodBadMonths" },
];

const compatibilityItems: Array<{ key: string }> = [
  { key: "score" },
  { key: "insights" },
  { key: "scenarios" },
  { key: "categories" },
];

interface FeatureListProps {
  items: Array<{ key: string }>;
  getTranslation: (key: string) => string;
}

const FeatureList = ({ items, getTranslation }: FeatureListProps) => (
  <ul className={styles.list}>
    {items.map((item) => {
      const Icon = iconMap[item.key];
      return (
        <li key={item.key} className={styles.item}>
          <Icon className={styles.icon} size={18} strokeWidth={1.5} />
          <span className={styles.itemText}>{getTranslation(item.key)}</span>
        </li>
      );
    })}
  </ul>
);

export const ProductPreview = () => {
  const t = useTranslations("landing.productPreview");

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>
        {t("title", { default: "커피 한 잔 값에 이 모든 걸 받아보세요" })}
      </h2>

      <FeatureList
        items={items}
        getTranslation={(key) => t(`items.${key}`, { default: key })}
      />

      <div className={styles.divider} />

      <h3 className={styles.yearlyTitle}>
        {t("yearlyTitle", { default: "올해 운세도 함께 확인 가능" })}
      </h3>

      <FeatureList
        items={yearlyItems}
        getTranslation={(key) => t(`yearlyItems.${key}`, { default: key })}
      />

      <div className={styles.divider} />

      <h3 className={styles.compatibilityTitle}>
        {t("compatibilityTitle", { default: "궁합 분석도 받아보세요" })}
      </h3>

      <FeatureList
        items={compatibilityItems}
        getTranslation={(key) =>
          t(`compatibilityItems.${key}`, { default: key })
        }
      />
    </section>
  );
};
