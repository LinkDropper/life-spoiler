"use client";

import { X } from "lucide-react";
import { Fragment } from "react";
import { useTranslations } from "next-intl";

import type { PalaceExplanation } from "@/libs/zi-wei-dou-shu/palace-explanation";

import styles from "./PalaceDetailPanel.module.css";

interface PalaceDetailPanelProps {
  explanation: PalaceExplanation;
  onClose: () => void;
}

/** 명반 칸을 눌렀을 때 아래에 이어지는 설명. 박스 없이 얇은 선 아래 본문으로 흐른다 */
export const PalaceDetailPanel = ({
  explanation,
  onClose,
}: PalaceDetailPanelProps) => {
  const t = useTranslations("fortune.palaceDetail");
  const { palaceName, title, meaning, stars, reading, caution } = explanation;

  return (
    <section
      className={styles.panel}
      role="region"
      aria-live="polite"
      aria-label={`${palaceName} ${title}`}
    >
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h3 className={styles.palaceName}>{palaceName}</h3>
          <p className={styles.title}>{title}</p>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t("close")}
        >
          <X size={24} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <p className={styles.meaning}>{meaning}</p>

      {stars.length > 0 && (
        <dl className={styles.row}>
          <div className={styles.rowInner}>
            <dt className={styles.rowLabel}>{t("starsLabel")}</dt>
            <dd className={styles.stars}>
              {stars.map((star, index) => (
                <Fragment key={`${star.isMain ? "m" : "s"}-${star.rawName}`}>
                  {index > 0 && " · "}
                  {star.isMain ? <b>{star.name}</b> : star.name}
                </Fragment>
              ))}
            </dd>
          </div>
        </dl>
      )}

      {reading && <p className={styles.reading}>{reading}</p>}

      {caution && (
        <dl className={styles.row}>
          <div className={`${styles.rowInner} ${styles.rowText}`}>
            <dt className={styles.rowLabel}>{t("cautionLabel")}</dt>
            <dd className={styles.cautionText}>{caution}</dd>
          </div>
        </dl>
      )}
    </section>
  );
};
