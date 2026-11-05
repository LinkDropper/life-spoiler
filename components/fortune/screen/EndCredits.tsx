import { useTranslations } from "next-intl";

import styles from "./screen.module.css";

interface EndCreditsProps {
  name: string;
  leadStar: string;
  wuxingJu: string;
  onShare: () => void;
  onReview: () => void;
}

/** 엔딩 크레딧 + 본편 공유·관람평 */
export const EndCredits = ({
  name,
  leadStar,
  wuxingJu,
  onShare,
  onReview,
}: EndCreditsProps) => {
  const t = useTranslations("fortune.screen.credits");

  return (
    <section id="end" className={styles.credits}>
      <span className={styles.creditsEnd}>THE END</span>
      <dl className={styles.creditsList}>
        <dt>STARRING</dt>
        <dd>{name}</dd>
        <dt>LEAD STAR</dt>
        <dd>{leadStar}</dd>
        <dt>ORIGINAL</dt>
        <dd>{wuxingJu}</dd>
        <dt>PRESENTED BY</dt>
        <dd>{t("presentedBy")}</dd>
      </dl>
      <div className={styles.creditsActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onShare}
        >
          {t("share")}
        </button>
        <button type="button" className={styles.ghostButton} onClick={onReview}>
          {t("review")}
        </button>
      </div>
    </section>
  );
};
