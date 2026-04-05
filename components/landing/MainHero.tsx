import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { getFortuneCount } from "./getFortuneCount";
import styles from "./MainHero.module.css";

export const MainHero = async () => {
  const [t, totalCount] = await Promise.all([
    getTranslations("landing"),
    getFortuneCount(),
  ]);

  const formattedCount = totalCount?.toLocaleString("ko-KR");

  return (
    <section className={styles.container}>
      {formattedCount && (
        <p className={styles.socialProof}>
          {t.rich("reviews.headline", {
            count: formattedCount,
            accent: (chunks) => (
              <span className={styles.socialProofAccent}>{chunks}</span>
            ),
          })}
        </p>
      )}
      <div className={styles.imageWrapper}>
        <div className={styles.imageBorder}>
          <Image
            src="/images/landing/main-image.png"
            alt={t("hero.imageAlt", { default: "운명의 별자리" })}
            fill
            className={styles.mainImage}
            priority
          />
        </div>
      </div>
      <div className={styles.textContainer}>
        <h1 className={styles.title}>
          <span className={styles.titleHighlight}>
            {t("hero.title", {
              default: "내 인생, 언제가 기회일까?",
            })}
          </span>
        </h1>
        <div className={styles.subtitleCard}>
          <ul className={styles.subtitleList}>
            <li className={styles.subtitleItem}>
              {t("hero.subtitle", {
                default: "10년마다 바뀌는 운의 흐름",
              })}
            </li>
            <li className={styles.subtitleItem}>
              {t("hero.subtitleLine2", {
                default: "올해 신경 써야 할 달",
              })}
            </li>
            <li className={styles.subtitleItem}>
              {t("hero.subtitleLine3", {
                default: "나에게 맞는 재물·직업·인연 패턴",
              })}
            </li>
          </ul>
        </div>
        <div className={styles.highlight}>
          <Image
            src="/images/landing/star.svg"
            alt=""
            width={14}
            height={14}
            className={styles.star}
          />
          <span className={styles.highlightText}>
            {t("hero.subtitleHighlight", {
              default: "114개 별이 말해주는 당신만의 지도",
            })}
          </span>
        </div>
      </div>
    </section>
  );
};
