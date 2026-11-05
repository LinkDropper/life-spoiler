import { useTranslations } from "next-intl";

import type { YearFlow } from "@/libs/fortune/yearly-screen";

import { YearFlowChart } from "./YearFlowChart";
import styles from "./screen.module.css";

interface YearPosterProps {
  name: string;
  year: number;
  ganji: string;
  title: string;
  tagline?: string | null;
  tags: string[];
  leadStar: string;
  flow: YearFlow;
  /** 이번 달 (그해를 지나는 중일 때만) */
  nowMonth: number | null;
}

/**
 * 올해 운세 예고편 포스터: 연도 숫자 + 그 아래 12개월 흐름 막대(이번 달이 빛남).
 * 제목·카피·장르 칩·출연진 줄은 모두 실제 해석·명반 값이다.
 */
export const YearPoster = ({
  name,
  year,
  ganji,
  title,
  tagline,
  tags,
  leadStar,
  flow,
  nowMonth,
}: YearPosterProps) => {
  const t = useTranslations("fortune.screen");

  return (
    <header className={`${styles.poster} ${styles.yearPoster}`}>
      <div className={styles.posterStars} aria-hidden="true" />
      <p className={styles.posterPresents}>{t("poster.presents")}</p>
      <div className={styles.yearMark}>
        <span className={styles.yearNumber} aria-hidden="true">
          {year}
        </span>
        <span className={styles.yearGanji}>
          {t("yearly.poster.ganji", { ganji })}
        </span>
        <div className={styles.yearFlow}>
          <YearFlowChart
            scores={flow.scores}
            nowMonth={nowMonth}
            showMarks={false}
            glow
            height={110}
          />
        </div>
      </div>
      <div className={styles.posterBody}>
        <div className={styles.posterBadges}>
          <span className={`${styles.pill} ${styles.pillStatus}`}>
            {t("poster.badgeTrailer")}
          </span>
          <span className={`${styles.pill} ${styles.pillMuted}`}>
            RUNTIME 12M
          </span>
        </div>
        <span className={styles.posterStarring}>
          {t("yearly.poster.starring", { name, year })}
        </span>
        <h1 className={styles.posterTitle}>{title}</h1>
        {tagline && <p className={styles.posterTagline}>{tagline}</p>}
        {tags.length > 0 && (
          <ul
            className={styles.genreTags}
            aria-label={t("yearly.poster.genre")}
          >
            {tags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>
        )}
        <dl className={styles.billing}>
          <div>
            <dt>STARRING</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt>LEAD STAR</dt>
            <dd>{leadStar}</dd>
          </div>
          <div>
            <dt>YEAR</dt>
            <dd>{ganji}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
};
