"use client";

import { useTranslations } from "next-intl";

import { trackFortuneEvent } from "@/libs/analytics/fortune";
import type {
  FortuneScreenType,
  FortuneSurface,
} from "@/libs/analytics/fortune";
import { rankMonths } from "@/libs/fortune/yearly-screen";
import type { MonthLens, YearFlow } from "@/libs/fortune/yearly-screen";

import { YearFlowChart } from "./YearFlowChart";
import styles from "./screen.module.css";

interface NowShowingProps {
  name: string;
  year: number;
  lens: MonthLens;
  flow: YearFlow;
  /** 펼쳐 둘 달의 시나리오 제목 */
  monthHeadline?: string;
  /** 공유 페이지: "친구가 보낸 본편" */
  badge?: string;
  /** "이번 달 장면 보기"가 데려갈 요소 id */
  targetId: string;
  fortuneType: FortuneScreenType;
  surface: FortuneSurface;
}

/**
 * 본편 맨 위 · 지금 상영 중 (기획서 §10, 위쪽 3안).
 * 다시 들어온 사람이 가장 먼저 찾는 "이번 달"을 맨 위에 둔다.
 * 아직 오지 않은 해는 1월, 지난해는 12월을 보여 준다.
 */
export const NowShowing = ({
  name,
  year,
  lens,
  flow,
  monthHeadline,
  badge,
  targetId,
  fortuneType,
  surface,
}: NowShowingProps) => {
  const t = useTranslations("fortune.screen.yearly.now");
  const month = lens.focusMonth;
  const score = flow.scores[month - 1];
  const rank = rankMonths(flow.scores).indexOf(month) + 1;
  const isCaution = flow.cautionMonths.includes(month);

  const rankLabel =
    rank === 1
      ? t("rankBest")
      : rank <= 3
        ? t("rankTop", { rank })
        : isCaution
          ? t("rankCaution")
          : t("rank", { rank });

  const handleJump = () => {
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackFortuneEvent("fortune_result_jump", {
      fortune_type: fortuneType,
      surface,
      target: "now",
    });
  };

  return (
    <header className={styles.nowShowing}>
      <span className={styles.posterStars} aria-hidden="true" />
      <div className={styles.nowTop}>
        <span className={styles.nowKicker}>● {t(`kicker.${lens.mode}`)}</span>
        <span className={styles.nowCast}>{t("cast", { name, year })}</span>
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
          {month}
          <span>{t("monthUnit")}</span>
        </b>
        <span className={styles.nowMeta}>
          <span className={styles.nowRank}>{rankLabel}</span>
          <span className={styles.nowScore}>
            {lens.mode === "current" && lens.today !== null
              ? t("scoreToday", { score, month, day: lens.today })
              : t(`score.${lens.mode}`, { score, year })}
          </span>
        </span>
      </div>
      {monthHeadline && <p className={styles.nowHeadline}>{monthHeadline}</p>}
      <div className={styles.nowFlow}>
        <YearFlowChart
          scores={flow.scores}
          nowMonth={lens.mode === "current" ? month : null}
          bestMonths={flow.bestMonths}
          cautionMonths={flow.cautionMonths}
          height={96}
        />
      </div>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={handleJump}
      >
        {t(`jump.${lens.mode}`, { month })}
      </button>
    </header>
  );
};
