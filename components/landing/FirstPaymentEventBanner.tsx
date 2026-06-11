"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { isFirstPaymentEventActive } from "@/libs/services/payment/first-payment-event";
import { useUser, useAuthStatus } from "@/libs/stores/user";

import styles from "./FirstPaymentEventBanner.module.css";

export const FirstPaymentEventBanner = () => {
  const router = useRouter();
  const locale = useLocale();
  const user = useUser();
  const authStatus = useAuthStatus();
  const t = useTranslations("landing.eventFirstPayment");

  if (locale !== "ko" || !isFirstPaymentEventActive()) {
    return null;
  }

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
        {t("badge", { default: "첫 결제 100원" })}
      </div>
      <div className={styles.priceWrapper}>
        <span className={styles.originalPrice}>
          {t("originalPrice", { default: "990원" })}
        </span>
        <span className={styles.price}>{t("price", { default: "100원" })}</span>
      </div>
      <p className={styles.text}>
        {t("text", {
          default: "본편 운세 첫 결제 1건을 100원에. 1인 1회 한정이에요.",
        })}
      </p>
      <button type="button" className={styles.ctaButton} onClick={handleClick}>
        {authStatus === "authenticated"
          ? t("ctaButtonAuthenticated", {
              default: "100원으로 내 운세 보기",
            })
          : t("ctaButton", { default: "100원으로 시작하기" })}
      </button>
    </div>
  );
};
