import Image from "next/image";
import { useTranslations } from "next-intl";

import styles from "./NextYearFortuneCard.module.css";

interface NextYearFortuneCardProps {
  onClick?: () => void;
}

export const NextYearFortuneCard = ({ onClick }: NextYearFortuneCardProps) => {
  const t = useTranslations("home.yearly2027");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.content}>
        <h2 className={styles.title}>{t("title", { default: "내년 운세" })}</h2>
        <p className={styles.subtitle}>
          {t("subtitle", { default: "2027년 공략 방법 미리 보기" })}
        </p>
        <Image
          src="/images/home/2027-yearly.png"
          alt=""
          width={368}
          height={368}
          className={styles.illustration}
        />
      </div>
      <div className={styles.button}>
        <span>{t("button", { default: "내년 운세 확인하기" })}</span>
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
