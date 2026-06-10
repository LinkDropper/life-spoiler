"use client";

import type { Locale } from "@/i18n/config";
import type { PalaceExplanation } from "@/libs/zi-wei-dou-shu/palace-explanation";

import styles from "./PalaceDetailPanel.module.css";

const CLOSE_LABEL: Record<Locale, string> = {
  ko: "설명 닫기",
  en: "Close explanation",
  ja: "説明を閉じる",
};

interface PalaceDetailPanelProps {
  explanation: PalaceExplanation;
  locale: Locale;
  onClose: () => void;
}

export const PalaceDetailPanel = ({
  explanation,
  locale,
  onClose,
}: PalaceDetailPanelProps) => {
  const { palaceName, title, meaning, stars, reading, caution } = explanation;

  return (
    <section
      className={styles.detailPanel}
      role="region"
      aria-live="polite"
      aria-label={`${palaceName} ${title}`}
    >
      <header className={styles.header}>
        <span className={styles.headerDot} aria-hidden="true" />
        <div className={styles.headerText}>
          <span className={styles.palaceName}>{palaceName}</span>
          <span className={styles.title}>{title}</span>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={CLOSE_LABEL[locale]}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <div className={styles.body}>
        <p className={styles.meaning}>{meaning}</p>

        {stars.length > 0 && (
          <div className={styles.chips}>
            {stars.map((star) => (
              <span
                key={`${star.isMain ? "m" : "s"}-${star.rawName}`}
                className={`${styles.chip} ${
                  star.isMain ? styles.chipMain : styles.chipMinor
                }`}
              >
                {star.name}
              </span>
            ))}
          </div>
        )}

        {reading && <p className={styles.reading}>{reading}</p>}

        {caution && (
          <p className={styles.caution}>
            <span className={styles.cautionMark} aria-hidden="true">
              💡
            </span>
            {caution}
          </p>
        )}
      </div>
    </section>
  );
};
