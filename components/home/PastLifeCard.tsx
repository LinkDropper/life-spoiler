import Image from "next/image";
import { useTranslations } from "next-intl";

import styles from "./PastLifeCard.module.css";

interface PastLifeCardProps {
  onClick?: () => void;
}

export const PastLifeCard = ({ onClick }: PastLifeCardProps) => {
  const t = useTranslations("home.pastLife");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.content}>
        <h2 className={styles.title}>{t("title", { default: "전생 운세" })}</h2>
        <p className={styles.subtitle}>
          {t("subtitle", { default: "전생의 나를 만나보기" })}
        </p>
        <Image
          src="/images/home/previous-life.png"
          alt=""
          width={180}
          height={200}
          className={styles.illustration}
        />
      </div>
      <div className={styles.button}>
        <span>{t("button", { default: "전생 운세 확인하기" })}</span>
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
