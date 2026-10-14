"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import type { DailyCategoryResult } from "@/libs/daily/types";

import { CategoryIcon } from "./CategoryIcon";
import { DailyStars } from "./DailyStars";
import styles from "./DailyCategoryRow.module.css";

interface DailyCategoryRowProps {
  result: DailyCategoryResult;
  /** 펼칠 때 호출 (daily_category_expand 계측) */
  onExpand?: (category: DailyCategoryResult["category"]) => void;
}

/** 카테고리 한 줄: 아이콘 · 라벨 · 별 · 등급명, 탭하면 본문이 펼쳐진다 */
export const DailyCategoryRow = ({
  result,
  onExpand,
}: DailyCategoryRowProps) => {
  const t = useTranslations("daily");
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  const handleToggle = () => {
    if (!isOpen) {
      onExpand?.(result.category);
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className={styles.label}>
          <CategoryIcon category={result.category} className={styles.icon} />
          {t(`category.${result.category}`)}
        </span>
        <DailyStars level={result.level} />
        <svg
          className={isOpen ? styles.chevronOpen : styles.chevron}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      <div id={panelId} className={styles.panel} hidden={!isOpen}>
        <p className={styles.text}>{result.text}</p>
      </div>
    </li>
  );
};
