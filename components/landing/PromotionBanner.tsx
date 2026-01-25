import { getTranslations } from "next-intl/server";

import styles from "./PromotionBanner.module.css";

export const PromotionBanner = async () => {
  const t = await getTranslations("landing.promotion");

  return (
    <div className={styles.container}>
      <div className={styles.badge}>{t("badge", { default: "런칭 특가" })}</div>
      <div className={styles.priceRow}>
        <span className={styles.originalPrice}>
          {t("originalPrice", { default: "9,900원" })}
        </span>
        <span className={styles.arrow}>→</span>
        <span className={styles.discountedPrice}>
          {t("discountedPrice", { default: "990원" })}
        </span>
      </div>
      <p className={styles.text}>
        {t("text", { default: "커피 한 잔 값으로 평생 운세 지도를" })}
      </p>
    </div>
  );
};
