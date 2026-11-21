"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { isFirstPaymentEventActive } from "@/libs/services/payment/first-payment-event";
import { useUser, useAuthStatus } from "@/libs/stores/user";

import styles from "./PromotionBanner.module.css";

export const PromotionBanner = () => {
  const router = useRouter();
  const locale = useLocale();
  const user = useUser();
  const authStatus = useAuthStatus();
  const t = useTranslations("landing.promotion");

  // 첫 결제 100원 이벤트 기간(ko)에는 FirstPaymentEventBanner가 노출되므로
  // 핑크 배너 중복을 막기 위해 990원 배너는 숨긴다.
  if (locale === "ko" && isFirstPaymentEventActive()) {
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
        {authStatus === "authenticated"
          ? t("ctaButtonAuthenticated", {
              default: "내 결과 확인하기",
            })
          : t("ctaButton", { default: "지금 바로 확인하기" })}
      </button>
    </div>
  );
};
