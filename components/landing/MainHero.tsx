import Image from "next/image";
import { getTranslations } from "next-intl/server";

import styles from "./MainHero.module.css";

export const MainHero = async () => {
  const t = await getTranslations("landing.hero");

  return (
    <section className={styles.container}>
      <div className={styles.imageWrapper}>
        <div className={styles.imageBorder}>
          <Image
            src="/images/landing/main-image.png"
            alt={t("imageAlt", { default: "운명의 별자리" })}
            fill
            className={styles.mainImage}
            priority
          />
        </div>
      </div>
      <div className={styles.textContainer}>
        <h1 className={styles.title}>
          <span className={styles.titleHighlight}>
            {t("title", { default: "당신의 인생 시나리오" })}
          </span>
          <br />
          {t("titleSub", { default: "미리 확인하시겠습니까?" })}
        </h1>
        <div className={styles.subtitle}>
          {t("subtitle", { default: "사주보다 더 정밀한" })}{" "}
          <span className={styles.subtitleHighlight}>
            {t("subtitleHighlight", { default: "자미두수" })}
          </span>
          <Image
            src="/images/landing/star.svg"
            alt=""
            width={14}
            height={14}
            className={styles.star}
          />
          <div className={styles.underlineWrapper}>
            <Image
              src="/images/landing/bottom-line1.svg"
              alt=""
              width={52}
              height={4}
              className={styles.underline1}
            />
            <Image
              src="/images/landing/bottom-line2.svg"
              alt=""
              width={49}
              height={4}
              className={styles.underline2}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
