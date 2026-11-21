import Image from "next/image";
import { useTranslations } from "next-intl";

import styles from "./FaceReadingCard.module.css";

interface FaceReadingCardProps {
  onClick?: () => void;
}

export const FaceReadingCard = ({ onClick }: FaceReadingCardProps) => {
  const t = useTranslations("home.faceReading");

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.content}>
        <h2 className={styles.title}>{t("title", { default: "관상 운세" })}</h2>
        <p className={styles.subtitle}>
          {t("subtitle", { default: "얼굴에 담긴 내 성향 보기" })}
        </p>
        <Image
          src="/images/home/face-spoiler.png"
          alt=""
          width={153}
          height={153}
          className={styles.illustration}
        />
      </div>
      <div className={styles.button}>
        <span>{t("button", { default: "관상 운세 확인하기" })}</span>
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
