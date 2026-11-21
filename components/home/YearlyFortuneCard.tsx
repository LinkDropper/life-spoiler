import Image from "next/image";
import { useTranslations } from "next-intl";

import styles from "./YearlyFortuneCard.module.css";

interface YearlyFortuneCardProps {
  onClick?: () => void;
}

export const YearlyFortuneCard = ({ onClick }: YearlyFortuneCardProps) => {
  const t = useTranslations("home.yearly");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.content}>
        <h2 className={styles.title}>{t("title", { default: "올해 운세" })}</h2>
        <p className={styles.subtitle}>
          {t("subtitle", { default: "올해 공략 방법 보기" })}
        </p>
        <Image
          src="/images/home/yearly-illustration.png"
          alt=""
          width={368}
          height={368}
          className={styles.illustration}
        />
      </div>
      <div className={styles.button}>
        <span>{t("button", { default: "올해 운세 확인하기" })}</span>
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
