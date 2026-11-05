import { useTranslations } from "next-intl";

import type { ConstellationStar } from "@/libs/fortune/lifetime-screen";

import { ConstellationArt } from "./ConstellationArt";
import styles from "./screen.module.css";

interface FilmPosterProps {
  variant: "preview" | "feature";
  title: string;
  tagline?: string | null;
  name: string;
  leadStar: string;
  wuxingJu: string;
  stars: ConstellationStar[];
  starLabels: string[];
}

/** 예고편 포스터 / 본편 타이틀 카드. 제목·카피·출연진 줄은 모두 실제 해석·명반 값이다 */
export const FilmPoster = ({
  variant,
  title,
  tagline,
  name,
  leadStar,
  wuxingJu,
  stars,
  starLabels,
}: FilmPosterProps) => {
  const t = useTranslations("fortune.screen.poster");
  const isPreview = variant === "preview";

  return (
    <header
      className={`${styles.poster} ${
        isPreview ? styles.posterPreview : styles.posterFeature
      }`}
    >
      <div className={styles.posterStars} aria-hidden="true" />
      {isPreview && (
        <>
          <p className={styles.posterPresents}>{t("presents")}</p>
          <ConstellationArt
            className={styles.posterConstellation}
            stars={stars}
            labels={starLabels}
          />
          <div className={styles.posterFade} aria-hidden="true" />
        </>
      )}
      <div className={styles.posterBody}>
        <div className={styles.posterBadges}>
          <span className={`${styles.pill} ${styles.pillStatus}`}>
            {isPreview ? t("badgeTrailer") : t("badgeFeature")}
          </span>
          <span className={`${styles.pill} ${styles.pillMuted}`}>
            {t("runtime")}
          </span>
        </div>
        <span className={styles.posterStarring}>{t("starring", { name })}</span>
        <h1 className={styles.posterTitle}>{title}</h1>
        {tagline && <p className={styles.posterTagline}>{tagline}</p>}
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
            <dt>ORIGINAL</dt>
            <dd>{wuxingJu}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
};
