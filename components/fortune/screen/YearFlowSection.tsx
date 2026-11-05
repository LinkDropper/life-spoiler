import { useTranslations } from "next-intl";

import type { MonthLens, YearFlow } from "@/libs/fortune/yearly-screen";

import { YearFlowChart } from "./YearFlowChart";
import styles from "./screen.module.css";

interface YearFlowSectionProps {
  flow: YearFlow;
  lens: MonthLens;
  /** 예고편: 조심할 달을 가린다 */
  isPreview?: boolean;
  /** 제목에 쓰는 연도 (내년 운세: 2027년의 흐름) */
  year: number;
}

/** 올해의 흐름: 12막대 + 범례 + 가장 좋은 달 · 조심할 달 */
export const YearFlowSection = ({
  flow,
  lens,
  isPreview = false,
  year: flowYear,
}: YearFlowSectionProps) => {
  const t = useTranslations("fortune.screen.yearly.flow");
  const nowMonth = lens.mode === "current" ? lens.focusMonth : null;
  const [best] = flow.bestMonths;
  const [caution] = flow.cautionMonths;

  const bestSub = (() => {
    if (nowMonth === null) {
      return t("bestSubYear");
    }
    if (best === nowMonth) {
      return t("bestSubNow");
    }
    return best > nowMonth
      ? t("bestSubAhead", { count: best - nowMonth })
      : t("bestSubPassed");
  })();

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>THE YEAR</p>
      <h2 className={styles.sectionTitle}>
        {t("title", {
          year: flowYear,
          when: lens.mode === "upcoming" ? "upcoming" : "current",
        })}
      </h2>
      <p className={styles.sectionDesc}>{t("desc")}</p>
      <div className={styles.flowPanel}>
        <YearFlowChart
          scores={flow.scores}
          nowMonth={nowMonth}
          bestMonths={flow.bestMonths}
          cautionMonths={flow.cautionMonths}
          lockCaution={isPreview}
          height={140}
        />
      </div>
      <p className={styles.flowLegend}>
        <span>
          <b className={styles.flowBest}>★</b> {t("legendBest")}
        </span>
        <span>
          <b className={isPreview ? styles.flowLocked : styles.flowCaution}>
            {isPreview ? "?" : "▲"}
          </b>{" "}
          {t("legendCaution")}
        </span>
        {nowMonth !== null && (
          <span>
            <i className={styles.flowNowSwatch} /> {t("legendNow")}
          </span>
        )}
      </p>
      <div className={styles.ageSummary}>
        <div>
          <span className={styles.ageSummaryLabel}>{t("best")}</span>
          <span className={`${styles.ageSummaryValue} ${styles.ageSummaryNow}`}>
            {t("monthScore", { month: best, score: flow.scores[best - 1] })}
          </span>
          <span className={styles.ageSummarySub}>{bestSub}</span>
        </div>
        <div>
          <span className={styles.ageSummaryLabel}>{t("caution")}</span>
          {isPreview ? (
            <>
              <span
                className={`${styles.ageSummaryValue} ${styles.keywordLocked}`}
                aria-hidden="true"
              >
                {t("cautionPlaceholder")}
              </span>
              <span className={styles.ageSummarySub}>{t("cautionLocked")}</span>
            </>
          ) : (
            <>
              <span className={styles.ageSummaryValue}>
                {t("monthScore", {
                  month: caution,
                  score: flow.scores[caution - 1],
                })}
              </span>
              <span className={styles.ageSummarySub}>{t("cautionSub")}</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
