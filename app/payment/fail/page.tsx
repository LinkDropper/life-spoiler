"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";

import styles from "./page.module.css";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tPayment = useTranslations("payment");

  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const profileId = searchParams.get("profileId");
  const fortuneType = searchParams.get("fortuneType") as
    | "yearly"
    | "lifetime"
    | "compatibility"
    | null;

  const handleRetry = () => {
    if (profileId && fortuneType) {
      router.push(`/payment/${fortuneType}/${profileId}`);
    } else {
      router.push("/profiles");
    }
  };

  const handleGoBack = () => {
    if (profileId && fortuneType) {
      if (fortuneType === "compatibility") {
        router.push(`/compatibility/${profileId}/fortune/preview`);
      } else {
        router.push(`/fortune/${fortuneType}/preview/${profileId}`);
      }
    } else {
      router.push("/profiles");
    }
  };

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        <div className={styles.resultCard}>
          <div className={styles.iconError}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="24" cy="24" r="24" fill="#FF6B6B" fillOpacity="0.1" />
              <path
                d="M18 18L30 30M30 18L18 30"
                stroke="#FF6B6B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className={styles.title}>{tPayment("failTitle")}</h2>
          <p className={styles.description}>
            {message || tPayment("failDescription")}
          </p>

          {code && (
            <div className={styles.errorInfo}>
              <span className={styles.errorLabel}>{tPayment("errorCode")}</span>
              <span className={styles.errorCode}>{code}</span>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleRetry}
            >
              {tPayment("retry")}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoBack}
            >
              {tPayment("goBack")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PaymentFailContent />
    </Suspense>
  );
}
