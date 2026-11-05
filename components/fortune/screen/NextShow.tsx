import Link from "next/link";
import { useTranslations } from "next-intl";

import { trackFortuneEvent } from "@/libs/analytics/fortune";
import { YEARLY_AFTER_LIFETIME_PER_100 } from "@/libs/home/home-profile";

import styles from "./screen.module.css";

interface NextShowProps {
  profileId: string;
  year: number;
}

/**
 * 다음 상영작: 인생 본편 다음 편은 올해 운세.
 * 결과 경로는 미결제면 예고편으로 보내므로, 소장 여부와 관계없이 같은 링크를 쓴다.
 */
export const NextShow = ({ profileId, year }: NextShowProps) => {
  const t = useTranslations("fortune.screen.next");

  const handleClick = () => {
    trackFortuneEvent("fortune_next_click", {
      fortune_type: "lifetime",
      next_type: "yearly",
    });
  };

  return (
    <section id="next" className={styles.section}>
      <p className={styles.eyebrow}>COMING NEXT</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <Link
        href={`/fortune/yearly/${profileId}`}
        className={styles.nextShow}
        onClick={handleClick}
      >
        <span className={styles.nextKicker}>TRAILER · {year}</span>
        <span className={styles.nextTitle}>{t("name")}</span>
        <span className={styles.nextBody}>
          {t("body", { count: YEARLY_AFTER_LIFETIME_PER_100, year })}
        </span>
        <span className={styles.nextButton}>{t("button")}</span>
      </Link>
    </section>
  );
};
