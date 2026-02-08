import Image from "next/image";
import { useTranslations } from "next-intl";

import styles from "./LifetimeFortuneCard.module.css";

interface LifetimeFortuneCardProps {
  onClick?: () => void;
}

export const LifetimeFortuneCard = ({ onClick }: LifetimeFortuneCardProps) => {
  const t = useTranslations("home.lifetime");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          {t("title", { default: "인생 운세" })}
        </h2>
        <p className={styles.subtitle}>
          {t("subtitle", { default: "내 사용 설명서 확인하기" })}
        </p>
        <Image
          src="/images/home/lifetime-illustration.png"
          alt=""
          width={181}
          height={181}
          className={styles.illustration}
        />
      </div>
      <div className={styles.button}>
        <span>{t("button", { default: "인생 운세 확인하기" })}</span>
        <Image
          src="/images/home/arrow-right-dark.svg"
          alt=""
          width={18}
          height={18}
        />
      </div>
    </button>
  );
};
