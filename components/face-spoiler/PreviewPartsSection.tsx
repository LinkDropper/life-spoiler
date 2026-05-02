"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import styles from "./PreviewPartsSection.module.css";

import type { PartsSubSection } from "@/libs/face-spoiler/preview-parser";

interface PreviewPartsSectionProps {
  /** 헤더 라벨 (예: "부위별 관상"). */
  title: string;
  /** sub-section 카드들. */
  items: PartsSubSection[];
  /** 마지막 한 줄 평 (있으면 마지막 카드로 추가 노출). */
  summary: string | null;
  /** 한 줄 평 카드의 라벨 (예: "한 줄 평"). */
  summaryLabel: string;
  /** 기본 펼침 여부. 디자인 기본값은 펼침(true). */
  defaultExpanded?: boolean;
}

export const PreviewPartsSection = ({
  title,
  items,
  summary,
  summaryLabel,
  defaultExpanded = true,
}: PreviewPartsSectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (items.length === 0 && !summary) return null;

  const handleToggle = () => setExpanded((prev) => !prev);

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <span className={styles.title}>{title}</span>
        <svg
          className={`${styles.chevron} ${
            expanded ? styles.chevronUp : styles.chevronDown
          }`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.55806 7.05806C9.80214 6.81398 10.1979 6.81398 10.4419 7.05806L15.4419 12.0581C15.686 12.3021 15.686 12.6979 15.4419 12.9419C15.1979 13.186 14.8021 13.186 14.5581 12.9419L10 8.38388L5.44194 12.9419C5.19786 13.186 4.80214 13.186 4.55806 12.9419C4.31398 12.6979 4.31398 12.3021 4.55806 12.0581L9.55806 7.05806Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {expanded && (
        <div className={styles.cards}>
          {items.map((item, idx) => (
            <article key={`${item.name}-${idx}`} className={styles.card}>
              <h3 className={styles.cardTitle}>{item.name}</h3>
              <div className={styles.cardBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.body}
                </ReactMarkdown>
              </div>
            </article>
          ))}
          {summary && (
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>{summaryLabel}</h3>
              <div className={styles.cardBody}>
                <p>{summary}</p>
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
};
