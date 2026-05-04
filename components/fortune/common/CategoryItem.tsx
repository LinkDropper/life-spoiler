"use client";

import { useState } from "react";

import { ChevronIcon } from "./ChevronIcon";
import { MarkdownContent } from "./MarkdownContent";
import { OneLinerAlert } from "./OneLinerAlert";
import { SubSectionList } from "./SubSectionList";

import styles from "./CategoryItem.module.css";

import type { SubSection } from "@/libs/services/ai/types";

export type CategoryKey = "wealth" | "career" | "relationship" | "health";

interface CategoryItemProps {
  categoryKey: CategoryKey;
  label: string;
  headline?: string;
  content?: string;
  /** 신규 구조: heading + body 카드 리스트 */
  subSections?: SubSection[];
  /** 신규 구조: 마무리 alert 한 줄 정리 */
  oneLiner?: string;
  /** oneLiner alert 라벨 (i18n) */
  oneLinerLabel?: string;
  tags?: string[];
  showHashtag?: boolean;
  defaultExpanded?: boolean;
}

export const CategoryItem = ({
  label,
  headline,
  content,
  subSections,
  oneLiner,
  oneLinerLabel,
  tags = [],
  showHashtag = false,
  defaultExpanded = true,
}: CategoryItemProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // 신규 구조 우선 — subSections 가 있으면 그걸 렌더, 없으면 legacy content 폴백
  const hasStructured = !!subSections && subSections.length > 0;

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
          {hasStructured ? (
            <SubSectionList items={subSections!} />
          ) : (
            content && (
              <MarkdownContent className={styles.categoryContent}>
                {content}
              </MarkdownContent>
            )
          )}
          {oneLiner && <OneLinerAlert text={oneLiner} label={oneLinerLabel} />}
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
