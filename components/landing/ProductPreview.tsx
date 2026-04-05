"use client";

import {
  LayoutGrid,
  Sparkles,
  CalendarRange,
  Calendar,
  Heart,
} from "lucide-react";
import { useTranslations } from "next-intl";

import styles from "./ProductPreview.module.css";

import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  chart: LayoutGrid,
  spoiler: Sparkles,
  ageScenario: CalendarRange,
  monthly: Calendar,
  score: Heart,
};

const mainItems: Array<{ key: string }> = [
  { key: "chart" },
  { key: "spoiler" },
  { key: "ageScenario" },
];

const mainYearlyItems: Array<{ key: string }> = [{ key: "monthly" }];

const mainCompatibilityItems: Array<{ key: string }> = [{ key: "score" }];

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
        items={mainItems}
        getTranslation={(key) => t(`items.${key}`, { default: key })}
      />
      <p className={styles.moreText}>
        {t("moreLifetime", { default: "+4가지 영역별 상세 분석" })}
      </p>

      <div className={styles.divider} />

      <h3 className={styles.yearlyTitle}>
        {t("yearlyTitle", { default: "올해 운세도 함께 확인 가능" })}
      </h3>

      <FeatureList
        items={mainYearlyItems}
        getTranslation={(key) => t(`yearlyItems.${key}`, { default: key })}
      />
      <p className={styles.moreText}>
        {t("moreYearly", {
          default: "+좋은 달 / 조심할 달 분석",
        })}
      </p>

      <div className={styles.divider} />

      <h3 className={styles.compatibilityTitle}>
        {t("compatibilityTitle", { default: "궁합 분석도 받아보세요" })}
      </h3>

      <FeatureList
        items={mainCompatibilityItems}
        getTranslation={(key) =>
          t(`compatibilityItems.${key}`, { default: key })
        }
      />
      <p className={styles.moreText}>
        {t("moreCompatibility", { default: "+3가지 상세 분석" })}
      </p>
    </section>
  );
};
