import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import styles from "./screen.module.css";

interface EndCreditsProps {
  name: string;
  leadStar: string;
  wuxingJu: string;
  /** 크레딧 아래 버튼들 */
  children: ReactNode;
}

/** 엔딩 크레딧. 버튼은 화면마다 다르다(본편: 공유·관람평, 공유 페이지: 내 예고편) */
export const EndCredits = ({
  name,
  leadStar,
  wuxingJu,
  children,
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
      <div className={styles.creditsActions}>{children}</div>
    </section>
  );
};
