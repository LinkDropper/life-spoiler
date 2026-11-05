"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";

import { MarkdownContent } from "@/components/fortune";
import { trackFortuneEvent } from "@/libs/analytics/fortune";
import type { FortuneSurface } from "@/libs/analytics/fortune";
import { buildAgeLens, parseAgePeriod } from "@/libs/fortune/lifetime-screen";
import type { FortuneInterpretation } from "@/libs/services/ai/types";

import styles from "./screen.module.css";
import { useKeepInView } from "./use-keep-in-view";

type AgeScenario = FortuneInterpretation["ageScenarios"][number];

interface AgeLensProps {
  scenarios: AgeScenario[];
  age: number;
  birthTimeUnknown: boolean;
  surface: FortuneSurface;
}

/** 러닝타임 바의 "지금 n세" 칩이 데려갈 시기 요소 id */
export const toAgeSceneId = (index: number): string => `age-scene-${index}`;

/**
 * ACT 4 나이대별 시나리오 — 가까울수록 크게 (기획서 §9).
 * 지금 시기는 펼침, 다음 시기는 반쯤(한 줄 정리), 나머지는 한 줄. 한 번에 하나만 펼친다.
 */
export const AgeLens = ({
  scenarios,
  age,
  birthTimeUnknown,
  surface,
}: AgeLensProps) => {
  const t = useTranslations("fortune.screen.age");
  const baseId = useId();
  const { itemRefs, keepInView } = useKeepInView(`.${styles.agePanelWrap}`);
  const lens = useMemo(
    () =>
      buildAgeLens(
        scenarios.map((scenario) => scenario.period),
        age
      ),
    [scenarios, age]
  );
  const [focusIndex, setFocusIndex] = useState(lens.nowIndex);
  const [isAllOpen, setIsAllOpen] = useState(false);

  const handleToggle = (index: number) => {
    const isOpen = isAllOpen || focusIndex === index;
    if (isOpen && !isAllOpen) {
      setFocusIndex(-1);
      return;
    }
    setIsAllOpen(false);
    setFocusIndex(index);
    keepInView(index, focusIndex);
    trackFortuneEvent("fortune_age_focus", {
      fortune_type: "lifetime",
      surface,
      index,
      distance: index - lens.nowIndex,
      expand_all: false,
    });
  };

  const handleToggleAll = () => {
    if (isAllOpen) {
      setIsAllOpen(false);
      setFocusIndex(lens.nowIndex);
      keepInView(lens.nowIndex, -1);
      return;
    }
    setIsAllOpen(true);
    trackFortuneEvent("fortune_age_focus", {
      fortune_type: "lifetime",
      surface,
      index: -1,
      distance: 0,
      expand_all: true,
    });
  };

  const nowScenario = scenarios[lens.nowIndex];
  const nowRange = nowScenario ? parseAgePeriod(nowScenario.period) : null;
  const nextScenario =
    lens.nextIndex >= 0 ? scenarios[lens.nextIndex] : undefined;
  const nextRange = nextScenario ? parseAgePeriod(nextScenario.period) : null;
  const percent =
    lens.progress === null ? null : Math.round(lens.progress * 100);

  return (
    <div className={styles.section}>
      <div className={styles.ageSummary}>
        <div>
          <span className={styles.ageSummaryLabel}>
            {lens.isOutside ? t("summaryNearest") : t("summaryNow")}
          </span>
          <span className={`${styles.ageSummaryValue} ${styles.ageSummaryNow}`}>
            {nowScenario?.period}
          </span>
          <span className={styles.ageSummarySub}>
            {percent === null
              ? t("ageNow", { age })
              : t("summaryNowSub", { age, percent })}
          </span>
        </div>
        {lens.yearsToNext !== null && nextRange && (
          <div>
            <span className={styles.ageSummaryLabel}>{t("summaryNext")}</span>
            <span className={styles.ageSummaryValue}>
              {t("years", { count: lens.yearsToNext })}
            </span>
            <span className={styles.ageSummarySub}>
              {t("fromAge", { age: nextRange.start })}
            </span>
          </div>
        )}
      </div>
      {birthTimeUnknown && (
        <p className={styles.sectionDesc}>{t("birthTimeNote")}</p>
      )}

      <ol className={styles.ageList}>
        {scenarios.map((scenario, index) => {
          const range = parseAgePeriod(scenario.period);
          const isNow = index === lens.nowIndex;
          const isNext = index === lens.nextIndex;
          const isPast = index < lens.nowIndex;
          const isOpen = isAllOpen || focusIndex === index;
          const panelId = `${baseId}-age-${index}`;
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
              key={`${scenario.period}-${index}`}
              id={toAgeSceneId(index)}
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
                    {range ? range.start : scenario.period}
                  </span>
                  <span className={styles.ageRange}>{scenario.period}</span>
                </span>
                <span className={styles.ageMain}>
                  {(isNow || isNext) && (
                    <span className={styles.ageTag}>
                      {isNow ? t("tagNow") : t("tagNext")}
                    </span>
                  )}
                  <span className={styles.ageHeadRow}>
                    <span className={styles.ageHeadline}>
                      {scenario.headline}
                    </span>
                    <ChevronDown
                      className={styles.ageChevron}
                      size={18}
                      aria-hidden="true"
                    />
                  </span>
                  {isNext && !isOpen && scenario.oneLiner && (
                    <span className={styles.agePeek}>{scenario.oneLiner}</span>
                  )}
                </span>
              </button>
              <div className={styles.agePanelWrap} inert={!isOpen}>
                <div className={styles.ageCollapse}>
                  <div
                    id={panelId}
                    className={styles.agePanel}
                    role="region"
                    aria-label={scenario.period}
                  >
                    {scenario.bullets && scenario.bullets.length > 0 ? (
                      <ul className={styles.ageBullets}>
                        {scenario.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex}>{bullet}</li>
                        ))}
                      </ul>
                    ) : (
                      scenario.content && (
                        <MarkdownContent className={styles.prose}>
                          {scenario.content}
                        </MarkdownContent>
                      )
                    )}
                    {scenario.oneLiner && (
                      <p className={styles.ageLine}>{scenario.oneLiner}</p>
                    )}
                    {isNow && percent !== null && nowRange && (
                      <div className={styles.ageProgress}>
                        <span
                          className={styles.ageProgressTrack}
                          role="img"
                          aria-label={t("summaryNowSub", { age, percent })}
                        >
                          <span style={{ width: `${percent}%` }} />
                        </span>
                        <span className={styles.ageProgressLabels}>
                          <span>{t("ageLabel", { age: nowRange.start })}</span>
                          <b>{t("summaryNowSub", { age, percent })}</b>
                          <span>
                            {nowRange.end === null
                              ? ""
                              : t("ageLabel", { age: nowRange.end })}
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
