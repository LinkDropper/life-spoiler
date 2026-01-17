import Image from "next/image";
import { getTranslations } from "next-intl/server";

import styles from "./PromotionBanner.module.css";

export const PromotionBanner = async () => {
  const t = await getTranslations("landing.promotion");

  return (
    <div className={styles.container}>
      <Image
        src="/images/landing/sparkle-left.svg"
        alt=""
        width={16}
        height={16}
      />
      <span className={styles.text}>
        {t("text", { default: "990원으로 당신만의 운명을 탐험하세요" })}
      </span>
      <Image
        src="/images/landing/sparkle-right.svg"
        alt=""
        width={16}
        height={16}
      />
    </div>
  );
};
