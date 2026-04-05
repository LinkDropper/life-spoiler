"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useUser, useAuthStatus } from "@/libs/stores/user";

import styles from "./PromotionBanner.module.css";

export const PromotionBanner = () => {
  const router = useRouter();
  const user = useUser();
  const authStatus = useAuthStatus();
  const t = useTranslations("landing.promotion");

  const handleClick = () => {
    if (authStatus !== "authenticated" || !user) {
      router.push("/login");
      return;
    }

    router.push("/home");
  };

  return (
    <div className={styles.container}>
      <div className={styles.badge}>
        {t("badge", { default: "이번 달만 90% 할인" })}
      </div>
      <div className={styles.priceWrapper}>
        <span className={styles.originalPrice}>
          {t("originalPrice", { default: "9,900원" })}
        </span>
        <span className={styles.price}>{t("price", { default: "990원" })}</span>
      </div>
      <p className={styles.text}>
        {t("text", {
          default: "커피 한 잔 값으로, 내 인생의 골든타임을 확인하세요",
        })}
      </p>
      <button type="button" className={styles.ctaButton} onClick={handleClick}>
        {t("ctaButton", { default: "지금 바로 확인하기" })}
      </button>
    </div>
  );
};
