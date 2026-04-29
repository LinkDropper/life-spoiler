"use client";

import { useState } from "react";

import { ChevronIcon } from "./ChevronIcon";
import { MarkdownContent } from "./MarkdownContent";

import styles from "./CategoryItem.module.css";

export type CategoryKey = "wealth" | "career" | "relationship" | "health";

interface CategoryItemProps {
  categoryKey: CategoryKey;
  label: string;
  headline?: string;
  content: string;
  tags?: string[];
  showHashtag?: boolean;
  defaultExpanded?: boolean;
}

export const CategoryItem = ({
  label,
  headline,
  content,
  tags = [],
  showHashtag = false,
  defaultExpanded = true,
}: CategoryItemProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={styles.categoryCard}>
      <button
        type="button"
        className={styles.categoryHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={styles.categoryLabel}>{label}</span>
        <ChevronIcon expanded={expanded} size="small" />
      </button>
      {expanded && (
        <>
          {headline && <h4 className={styles.categoryHeadline}>{headline}</h4>}
          <MarkdownContent className={styles.categoryContent}>
            {content}
          </MarkdownContent>
          {tags.length > 0 && (
            <div className={styles.categoryTags}>
              {tags.map((tag, idx) => (
                <span key={idx} className={styles.tag}>
                  {showHashtag ? `#${tag}` : tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
