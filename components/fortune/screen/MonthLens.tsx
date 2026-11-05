"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { MarkdownContent } from "@/components/fortune";
import { trackFortuneEvent } from "@/libs/analytics/fortune";
import type {
  FortuneScreenType,
  FortuneSurface,
} from "@/libs/analytics/fortune";
import type {
  MonthLens as MonthLensState,
  YearFlow,
} from "@/libs/fortune/yearly-screen";
import type { YearlyFortuneInterpretation } from "@/libs/services/ai/types";

import styles from "./screen.module.css";
import { useKeepInView } from "./use-keep-in-view";

type MonthScenario = YearlyFortuneInterpretation["monthlyFortunes"][number];

interface MonthLensProps {
  months: MonthScenario[];
  year: number;
  lens: MonthLensState;
  flow: YearFlow;
  fortuneType: FortuneScreenType;
  surface: FortuneSurface;
}

/** 상영 컨트롤 바의 "지금 n월"·맨 위 "이번 달 장면 보기"가 데려갈 요소 id */
export const toMonthSceneId = (month: number): string => `month-scene-${month}`;

/**
 * ACT 4 월별 시나리오 — 가까울수록 크게 (기획서 §10).
 * 이번 달은 펼침(달 안 진행률), 다음 달은 반쯤(한 줄 정리), 나머지는 한 줄. 한 번에 하나만 펼친다.
 * 나이대별 시나리오와 같은 모양(screen.module.css age*)을 쓴다.
 */
export const MonthLens = ({
  months,
  year,
  lens,
  flow,
  fortuneType,
  surface,
}: MonthLensProps) => {
  const t = useTranslations("fortune.screen.yearly.months");
  const baseId = useId();
  const { itemRefs, keepInView } = useKeepInView(`.${styles.agePanelWrap}`);
  const focusIndex = months.findIndex((item) => item.month === lens.focusMonth);
  const [openIndex, setOpenIndex] = useState(focusIndex);
  const [isAllOpen, setIsAllOpen] = useState(false);
  const isCurrent = lens.mode === "current";
  const percent =
    lens.progress === null ? null : Math.round(lens.progress * 100);
  const nowScore = flow.scores[lens.focusMonth - 1];
  const nowIsBest = flow.bestMonths[0] === lens.focusMonth;

  const track = (month: number, expandAll: boolean) => {
    trackFortuneEvent("fortune_month_focus", {
      fortune_type: fortuneType,
      surface,
      month,
      distance: expandAll ? 0 : month - lens.focusMonth,
      expand_all: expandAll,
    });
  };

  const handleToggle = (index: number) => {
    const isOpen = isAllOpen || openIndex === index;
    if (isOpen && !isAllOpen) {
      setOpenIndex(-1);
      return;
    }
    setIsAllOpen(false);
    setOpenIndex(index);
    keepInView(index, openIndex);
    track(months[index].month, false);
  };

  const handleToggleAll = () => {
    if (isAllOpen) {
      setIsAllOpen(false);
      setOpenIndex(focusIndex);
      keepInView(focusIndex, -1);
      return;
    }
    setIsAllOpen(true);
    track(-1, true);
  };

  return (
    <div className={styles.section}>
      <div className={styles.ageSummary}>
        <div>
          <span className={styles.ageSummaryLabel}>
            {t(`summary.${lens.mode}`)}
          </span>
          <span className={`${styles.ageSummaryValue} ${styles.ageSummaryNow}`}>
            {nowIsBest
              ? t("summaryBest", { month: lens.focusMonth })
              : t("summaryMonth", { month: lens.focusMonth })}
          </span>
          <span className={styles.ageSummarySub}>
            {t("summaryScore", { score: nowScore })}
          </span>
        </div>
        <div>
          {isCurrent && lens.monthsLeft !== null ? (
            <>
              <span className={styles.ageSummaryLabel}>{t("left")}</span>
              <span className={styles.ageSummaryValue}>
                {t("leftValue", { count: lens.monthsLeft })}
              </span>
              <span className={styles.ageSummarySub}>
                {lens.nextMonth === null
                  ? t("leftLast")
                  : t("leftSub", { month: lens.nextMonth })}
              </span>
            </>
          ) : (
            <>
              <span className={styles.ageSummaryLabel}>{t("runtime")}</span>
              <span className={styles.ageSummaryValue}>
                {t("runtimeValue", { year })}
              </span>
              <span className={styles.ageSummarySub}>
                {t(`runtimeSub.${lens.mode}`)}
              </span>
            </>
          )}
        </div>
      </div>

      <ol className={styles.ageList}>
        {months.map((item, index) => {
          const { month } = item;
          const isNow = isCurrent && month === lens.focusMonth;
          const isNext = isCurrent && month === lens.nextMonth;
          const isPast = isCurrent && month < lens.focusMonth;
          const isOpen = isAllOpen || openIndex === index;
          const isBest = flow.bestMonths.includes(month);
          const isCaution = flow.cautionMonths.includes(month);
          const panelId = `${baseId}-month-${month}`;
          const itemClass = [
            styles.ageItem,
            isPast && styles.agePast,
            isNow && styles.ageNow,
            isNext && styles.ageNext,
            isOpen && styles.ageOpen,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li
              key={month}
              id={toMonthSceneId(month)}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className={itemClass}
            >
              <span className={styles.ageDot} aria-hidden="true" />
              <button
                type="button"
                className={styles.ageButton}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => handleToggle(index)}
              >
                <span className={styles.ageNumber}>
                  <span className={styles.ageStart}>
                    {month}
                    <span className={styles.monthUnit}>{t("unit")}</span>
                  </span>
                  <span className={styles.ageRange}>
                    {t("score", { score: flow.scores[month - 1] })}
                  </span>
                </span>
                <span className={styles.ageMain}>
                  {(isNow || isNext) && (
                    <span className={styles.ageTag}>
                      {isNow ? t("tagNow") : t("tagNext")}
                    </span>
                  )}
                  <span className={styles.ageHeadRow}>
                    <span className={styles.ageHeadline}>
                      {item.headline}
                      {isBest && (
                        <span
                          className={styles.flowBest}
                          role="img"
                          aria-label={t("markBest")}
                        >
                          {" "}
                          ★
                        </span>
                      )}
                      {isCaution && (
                        <span
                          className={styles.flowCaution}
                          role="img"
                          aria-label={t("markCaution")}
                        >
                          {" "}
                          ▲
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={styles.ageChevron}
                      size={18}
                      aria-hidden="true"
                    />
                  </span>
                  {isNext && !isOpen && item.oneLiner && (
                    <span className={styles.agePeek}>{item.oneLiner}</span>
                  )}
                </span>
              </button>
              <div className={styles.agePanelWrap} inert={!isOpen}>
                <div className={styles.ageCollapse}>
                  <div
                    id={panelId}
                    className={styles.agePanel}
                    role="region"
                    aria-label={t("regionLabel", { month })}
                  >
                    {item.bullets && item.bullets.length > 0 ? (
                      <ul className={styles.ageBullets}>
                        {item.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex}>{bullet}</li>
                        ))}
                      </ul>
                    ) : (
                      item.content && (
                        <MarkdownContent className={styles.prose}>
                          {item.content}
                        </MarkdownContent>
                      )
                    )}
                    {item.oneLiner && (
                      <p className={styles.ageLine}>{item.oneLiner}</p>
                    )}
                    {isNow && percent !== null && lens.today !== null && (
                      <div className={styles.ageProgress}>
                        <span
                          className={styles.ageProgressTrack}
                          role="img"
                          aria-label={t("progress", {
                            month,
                            day: lens.today,
                            percent,
                          })}
                        >
                          <span style={{ width: `${percent}%` }} />
                        </span>
                        <span className={styles.ageProgressLabels}>
                          <span>{t("dayLabel", { month, day: 1 })}</span>
                          <b>
                            {t("progress", {
                              month,
                              day: lens.today,
                              percent,
                            })}
                          </b>
                          <span>
                            {t("dayLabel", {
                              month,
                              day: new Date(year, month, 0).getDate(),
                            })}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className={styles.expandAll}
        aria-pressed={isAllOpen}
        onClick={handleToggleAll}
      >
        {isAllOpen ? t("collapseAll") : t("expandAll")}
      </button>
    </div>
  );
};
