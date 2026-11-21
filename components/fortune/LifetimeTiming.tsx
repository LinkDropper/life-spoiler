"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { toTimingRows } from "@/libs/fortune/lifetime-extras";
import type { TimingSection } from "@/libs/services/ai/types";

import { CategoryItem, SectionHeader } from "./common";

import styles from "./LifetimeTiming.module.css";

interface LifetimeTimingProps {
  /** getVisibleTiming 으로 거른 주제. 빈 배열이면 섹션 자체를 그리지 않는다 */
  topics: TimingSection[];
}

/** 타이밍: 주제별 "가능성이 높은 해"와 "조심할 해"를 연도순으로 */
export const LifetimeTiming = ({ topics }: LifetimeTimingProps) => {
  const t = useTranslations("fortune.lifetime.timing");
  const [expanded, setExpanded] = useState(true);

  if (topics.length === 0) {
    return null;
  }

  return (
    <>
      <SectionHeader
        title={t("sectionTitle")}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />

      {expanded && (
        <section className={styles.section}>
          <div className={styles.lead}>
            <h4 className={styles.leadTitle}>{t("title")}</h4>
            <p className={styles.leadDesc}>{t("desc")}</p>
          </div>

          <div className={styles.topics}>
            {topics.map((topic) => (
              <CategoryItem
                key={topic.topic}
                label={t(`topics.${topic.topic}`)}
                extra={
                  <ul className={styles.rows}>
                    {toTimingRows(topic).map((row) => (
                      <li
                        key={`${row.kind}-${row.year}`}
                        className={styles.row}
                      >
                        <span
                          className={`${styles.yearChip} ${
                            row.kind === "caution"
                              ? styles.caution
                              : styles.likely
                          }`}
                        >
                          {t("yearLabel", { year: String(row.year) })}
                        </span>
                        <div className={styles.rowText}>
                          <h5 className={styles.rowKind}>
                            {t(row.kind === "caution" ? "caution" : "likely")}
                          </h5>
                          <p className={styles.rowReason}>{row.reason}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                }
              />
            ))}
          </div>

          <p className={styles.note}>{t("note")}</p>
        </section>
      )}
    </>
  );
};
