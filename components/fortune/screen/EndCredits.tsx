import { useTranslations } from "next-intl";
import { Fragment } from "react";
import type { ReactNode } from "react";

import styles from "./screen.module.css";

interface EndCreditsProps {
  name: string;
  /** STARRING과 PRESENTED BY 사이 줄 (인생: LEAD STAR·ORIGINAL, 올해: YEAR·BEST MONTH) */
  rows: { label: string; value: string }[];
  /** 기본 THE END (올해: THE END · 2026) */
  endLabel?: string;
  /** 크레딧 아래 버튼들 */
  children: ReactNode;
}

/** 엔딩 크레딧. 버튼은 화면마다 다르다(본편: 공유·관람평, 공유 페이지: 내 예고편) */
export const EndCredits = ({
  name,
  rows,
  endLabel = "THE END",
  children,
}: EndCreditsProps) => {
  const t = useTranslations("fortune.screen.credits");

  return (
    <section id="end" className={styles.credits}>
      <span className={styles.creditsEnd}>{endLabel}</span>
      <dl className={styles.creditsList}>
        <dt>STARRING</dt>
        <dd>{name}</dd>
        {rows.map((row) => (
          <Fragment key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </Fragment>
        ))}
        <dt>PRESENTED BY</dt>
        <dd>{t("presentedBy")}</dd>
      </dl>
      <div className={styles.creditsActions}>{children}</div>
    </section>
  );
};
