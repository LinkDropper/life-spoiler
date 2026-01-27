import { getTranslations } from "next-intl/server";

import styles from "./PromotionBanner.module.css";

export const PromotionBanner = async () => {
  const t = await getTranslations("landing.promotion");

  return (
    <div className={styles.container}>
      <div className={styles.badge}>
        {t("badge", { default: "런칭 기념 90% OFF" })}
      </div>
      <div className={styles.priceWrapper}>
        <span className={styles.originalPrice}>
          {t("originalPrice", { default: "9,900원" })}
        </span>
        <span className={styles.price}>{t("price", { default: "990원" })}</span>
      </div>
      <p className={styles.text}>
        {t("text", { default: "커피 한 잔 값으로 평생 운세 지도를" })}
      </p>
    </div>
  );
};
