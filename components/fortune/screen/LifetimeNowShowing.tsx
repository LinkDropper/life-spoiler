"use client";

import { useTranslations } from "next-intl";

import { trackFortuneEvent } from "@/libs/analytics/fortune";
import type { FortuneSurface } from "@/libs/analytics/fortune";
import { buildAgeLens, parseAgePeriod } from "@/libs/fortune/lifetime-screen";

import { RUNTIME_YEARS } from "./RuntimeTrack";
import styles from "./screen.module.css";

interface AgeScene {
  period: string;
  headline: string;
}

interface LifetimeNowShowingProps {
  name: string;
  age: number;
  scenarios: AgeScene[];
  /** 공유 페이지: "친구가 보낸 본편" */
  badge?: string;
  /** "지금 장면 보기"가 데려갈 요소 id */
  targetId: string;
  surface: FortuneSurface;
}

/**
 * 인생 본편 맨 위 · 지금 상영 중 (기획서 §11, 올해 운세 위쪽 3안과 같은 장치).
 * 지금 나이의 장면: 큰 나이 · 몇 번째 장면 · 그 장면 제목 · 0~99세 장면 막대.
 * 나이가 어느 구간에도 없으면 가장 가까운 장면을 보여 주고 "다음 장면까지"는 숨긴다.
 */
export const LifetimeNowShowing = ({
  name,
  age,
  scenarios,
  badge,
  targetId,
  surface,
}: LifetimeNowShowingProps) => {
  const t = useTranslations("fortune.screen.lifetime.now");
  const lens = buildAgeLens(
    scenarios.map((scene) => scene.period),
    age
  );
  const now = scenarios[lens.nowIndex];
  const percent =
    lens.progress === null ? null : Math.round(lens.progress * 100);
  const ranges = scenarios.map((scene) => parseAgePeriod(scene.period));

  const handleJump = () => {
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackFortuneEvent("fortune_result_jump", {
      fortune_type: "lifetime",
      surface,
      target: "now",
    });
  };

  return (
    <header className={styles.nowShowing}>
      <span className={styles.posterStars} aria-hidden="true" />
      <div className={styles.nowTop}>
        <span className={styles.nowKicker}>
          ● {lens.isOutside ? t("kickerNearest") : "NOW SHOWING"}
        </span>
        <span className={styles.nowCast}>{t("cast", { name })}</span>
      </div>
      {badge && (
        <span
          className={`${styles.pill} ${styles.pillStatus} ${styles.nowBadge}`}
        >
          {badge}
        </span>
      )}
      <div className={styles.nowMonthRow}>
        <b className={styles.nowMonth}>
          {age}
          <span>{t("ageUnit")}</span>
        </b>
        <span className={styles.nowMeta}>
          <span className={styles.nowRank}>
            {t("scene", {
              index: lens.nowIndex + 1,
              period: now?.period ?? "",
            })}
          </span>
          <span className={styles.nowScore}>
            {percent !== null && lens.yearsToNext !== null
              ? t("progressNext", { percent, years: lens.yearsToNext })
              : percent !== null
                ? t("progress", { percent })
                : t("nearest")}
          </span>
        </span>
      </div>
      {now?.headline && <p className={styles.nowHeadline}>{now.headline}</p>}
      <div className={styles.nowFlow}>
        <div className={styles.lifeSegments} aria-hidden="true">
          {ranges.map((range, index) => {
            const start = range?.start ?? 0;
            const end = range?.end ?? RUNTIME_YEARS;
            const span = Math.max(end - start + 1, 1);
            const isNow = index === lens.nowIndex;
            const isPast = index < lens.nowIndex;
            return (
              <span
                key={`${scenarios[index].period}-${index}`}
                className={[
                  styles.lifeSegment,
                  isPast && styles.lifeSegmentPast,
                  isNow && styles.lifeSegmentNow,
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ flexGrow: span }}
              >
                {isNow && percent !== null && (
                  <span
                    className={styles.lifeSegmentHead}
                    style={{ left: `${percent}%` }}
                  />
                )}
              </span>
            );
          })}
        </div>
        <div className={styles.lifeTicks} aria-hidden="true">
          {ranges.map((range, index) => {
            const start = range?.start ?? 0;
            const end = range?.end ?? RUNTIME_YEARS;
            return (
              <span
                key={`${scenarios[index].period}-tick-${index}`}
                className={
                  index === lens.nowIndex ? styles.lifeTickNow : undefined
                }
                style={{ flexGrow: Math.max(end - start + 1, 1) }}
              >
                {start}
              </span>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={handleJump}
      >
        {t("jump")}
      </button>
    </header>
  );
};
