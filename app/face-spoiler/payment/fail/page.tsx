"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { Header } from "@/components/face-spoiler/Header";

import styles from "./page.module.css";

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tFace = useTranslations("faceSpoiler.payment");
  const tPayment = useTranslations("payment");

  const shareId = searchParams.get("shareId");
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  const handleRetry = () => {
    if (shareId) {
      router.push(`/face-spoiler/payment/${shareId}`);
    } else {
      router.push("/face-spoiler/profiles");
    }
  };

  const handleBackToUpload = () => {
    router.push("/face-spoiler/profiles");
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.resultCard}>
          <div className={styles.icon}>⚠️</div>
          <h2 className={styles.title}>
            {tFace("failTitle", { default: "결제에 실패했습니다" })}
          </h2>
          <p className={styles.description}>
            {message ??
              tPayment("paymentError", {
                default: "결제 중 오류가 발생했어요.",
              })}
          </p>
          {code && (
            <p className={styles.errorCode}>
              {tFace("failErrorCodeLabel", { default: "에러 코드" })}: {code}
            </p>
          )}

          <div className={styles.buttonGroup}>
            {shareId && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleRetry}
              >
                {tFace("retryPayment", { default: "다시 시도하기" })}
              </button>
            )}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleBackToUpload}
            >
              {tFace("goToUpload", { default: "업로드로 돌아가기" })}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FaceSpoilerPaymentFailPage() {
  return (
    <Suspense fallback={null}>
      <PaymentFailContent />
    </Suspense>
  );
}
