import Link from "next/link";
import { useTranslations } from "next-intl";

import { trackFortuneEvent } from "@/libs/analytics/fortune";
import type { FortuneScreenType } from "@/libs/analytics/fortune";

import styles from "./screen.module.css";

interface NextShowProps {
  href: string;
  kicker: string;
  name: string;
  body: string;
  button: string;
  fortuneType: FortuneScreenType;
  /** 분석용 다음 운세 키 */
  nextType: string;
}

/**
 * 다음 상영작: 아직 안 본 다음 운세 하나.
 * 결과 경로는 미결제면 예고편으로 보내므로, 소장 여부와 관계없이 같은 링크를 쓴다.
 */
export const NextShow = ({
  href,
  kicker,
  name,
  body,
  button,
  fortuneType,
  nextType,
}: NextShowProps) => {
  const t = useTranslations("fortune.screen.next");

  const handleClick = () => {
    trackFortuneEvent("fortune_next_click", {
      fortune_type: fortuneType,
      next_type: nextType,
    });
  };

  return (
    <section id="next" className={styles.section}>
      <p className={styles.eyebrow}>COMING NEXT</p>
      <h2 className={styles.sectionTitle}>{t("title")}</h2>
      <Link href={href} className={styles.nextShow} onClick={handleClick}>
        <span className={styles.nextKicker}>{kicker}</span>
        <span className={styles.nextTitle}>{name}</span>
        <span className={styles.nextBody}>{body}</span>
        <span className={styles.nextButton}>{button}</span>
      </Link>
    </section>
  );
};
