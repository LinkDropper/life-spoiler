import Image from "next/image";
import { useTranslations } from "next-intl";

import styles from "./CompatibilityFortuneCard.module.css";

interface CompatibilityFortuneCardProps {
  onClick?: () => void;
}

export const CompatibilityFortuneCard = ({
  onClick,
}: CompatibilityFortuneCardProps) => {
  const t = useTranslations("home.compatibility");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.content}>
        <h2 className={styles.title}>{t("title", { default: "궁합 운세" })}</h2>
        <p className={styles.subtitle}>
          {t("subtitle", { default: "내 인간관계 분석하기" })}
        </p>
        <Image
          src="/images/home/compatibility-illustration.svg"
          alt=""
          width={193}
          height={213}
          className={styles.illustration}
        />
      </div>
      <div className={styles.button}>
        <span>{t("button", { default: "궁합 운세 확인하기" })}</span>
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
