import { useTranslations } from "next-intl";

import { toTimingRows } from "@/libs/fortune/lifetime-extras";
import type { TimingSection } from "@/libs/services/ai/types";

import extras from "./LifetimeExtras.module.css";
import styles from "./screen.module.css";

interface LifetimeTimingProps {
  /** getVisibleTiming 으로 거른 주제만 넘긴다 (빈 배열이면 아무것도 그리지 않음) */
  topics: TimingSection[];
}

/** ACT 5 타이밍: 주제별 "가능성이 높은 해"와 "조심할 해"를 연도순으로 */
export const LifetimeTiming = ({ topics }: LifetimeTimingProps) => {
  const t = useTranslations("fortune.screen.timing");

  if (topics.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>TIMING</p>
      <p className={styles.lead}>{t("title")}</p>
      <p className={styles.sectionDesc}>{t("desc")}</p>

      {topics.map((topic) => (
        <div key={topic.topic} className={extras.topic}>
          <h3 className={extras.topicTitle}>{t(`topics.${topic.topic}`)}</h3>
          <ul className={extras.rows}>
            {toTimingRows(topic).map((row) => (
              <li
                key={`${row.kind}-${row.year}`}
                className={`${extras.row} ${
                  row.kind === "caution" ? extras.rowCaution : ""
                }`}
              >
                <span className={extras.year}>
                  {row.year}
                  <span className={extras.yearUnit}>{t("yearUnit")}</span>
                </span>
                <span className={extras.rowText}>
                  <b>{t(row.kind === "caution" ? "caution" : "likely")}</b>
                  <span>{row.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className={extras.note}>{t("note")}</p>
    </section>
  );
};
