"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import { STAR_PACKAGES } from "@/libs/star-packages";
import type { StarPackageId } from "@/libs/star-packages";
import { trackPurchase } from "@/libs/analytics";

import styles from "./page.module.css";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tPayment = useTranslations("payment");

  const [isConfirming, setIsConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const profileId = searchParams.get("profileId");
  const fortuneType = searchParams.get("fortuneType") as
    | "yearly"
    | "lifetime"
    | "compatibility"
    | "past_life"
    | null;
  const currency = (searchParams.get("currency") as "KRW" | "USD") || "KRW";
  const packageId = searchParams.get("packageId") as StarPackageId | null;

  const isStarPurchase = !!packageId;
  const starPackage =
    packageId && STAR_PACKAGES[packageId] ? STAR_PACKAGES[packageId] : null;

  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        setError(tPayment("missingPaymentInfo"));
        setIsConfirming(false);
        return;
      }

      try {
        // 별조각 결제인 경우 confirm-star API 호출
        if (isStarPurchase && packageId) {
          const response = await fetch("/api/payment/confirm-star", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: Number(amount),
              packageId,
              currency,
            }),
          });

          await response.json();

          if (!response.ok) {
            throw new Error(tPayment("confirmError"));
          }

          setIsConfirmed(true);

          // GA 결제 이벤트 전송
          if (orderId && amount && starPackage) {
            trackPurchase({
              transaction_id: orderId,
              value: Number(amount),
              currency,
              items: [
                {
                  item_id: `star_${packageId}`,
                  item_name: `Star Package - ${packageId}`,
                  price: Number(amount),
                  quantity: 1,
                },
              ],
            });
          }
        } else {
          // 기존 운세 결제 흐름
          const response = await fetch("/api/payment/confirm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: Number(amount),
              profileId: profileId ?? undefined,
              fortuneType: fortuneType ?? undefined,
              year:
                fortuneType === "yearly" ? new Date().getFullYear() : undefined,
              currency,
            }),
          });

          await response.json();

          if (!response.ok) {
            throw new Error(tPayment("confirmError"));
          }

          setIsConfirmed(true);

          // GA 결제 이벤트 전송
          if (orderId && amount && fortuneType) {
            trackPurchase({
              transaction_id: orderId,
              value: Number(amount),
              currency,
              items: [
                {
                  item_id: fortuneType,
                  item_name:
                    fortuneType === "compatibility"
                      ? tPayment("productNameCompatibility")
                      : fortuneType === "yearly"
                        ? tPayment("productNameYearly")
                        : tPayment("productNameLifetime"),
                  price: Number(amount),
                  quantity: 1,
                },
              ],
            });
          }
        }
      } catch {
        setError(tPayment("confirmError"));
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [
    paymentKey,
    orderId,
    amount,
    profileId,
    fortuneType,
    currency,
    tPayment,
    isStarPurchase,
    packageId,
    starPackage,
  ]);

  // 별조각 결제 후 운세 프리뷰로 돌아갈 경로
  const returnPath = (() => {
    if (!isStarPurchase) return null;
    try {
      return sessionStorage.getItem("starChargeReturnPath");
    } catch {
      return null;
    }
  })();

  const handleViewFortune = () => {
    if (isStarPurchase) {
      if (returnPath) {
        try {
          sessionStorage.removeItem("starChargeReturnPath");
        } catch {
          // ignore
        }
        router.push(returnPath);
      } else {
        router.push("/home");
      }
      return;
    }
    if (profileId && fortuneType) {
      if (fortuneType === "compatibility") {
        router.push(`/compatibility/${profileId}`);
      } else if (fortuneType === "past_life") {
        router.push(`/fortune/past-life/${profileId}`);
      } else {
        router.push(`/fortune/${fortuneType}/${profileId}`);
      }
    } else {
      router.push("/profiles");
    }
  };

  const handleGoHome = () => {
    if (isStarPurchase) {
      router.push("/home");
      return;
    }
    router.push("/profiles");
  };

  if (isConfirming) {
    if (isStarPurchase) {
      return (
        <div className={styles.page}>
          <HeaderClient />
          <main className={styles.main}>
            <div className={styles.resultCard}>
              <p className={styles.description}>
                {tPayment("confirmingPayment")}
              </p>
            </div>
          </main>
        </div>
      );
    }
    return <Loading />;
  }

  if (error) {
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
                <circle
                  cx="24"
                  cy="24"
                  r="24"
                  fill="#FF6B6B"
                  fillOpacity="0.1"
                />
                <path
                  d="M24 16V26"
                  stroke="#FF6B6B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="24" cy="32" r="1.5" fill="#FF6B6B" />
              </svg>
            </div>
            <h2 className={styles.title}>{tPayment("confirmFailed")}</h2>
            <p className={styles.description}>{error}</p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleGoHome}
            >
              {tPayment("goToProfiles")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        <div className={styles.resultCard}>
          <div className={styles.iconSuccess}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="24" cy="24" r="24" fill="#4ADE80" fillOpacity="0.1" />
              <path
                d="M16 24L22 30L32 18"
                stroke="#4ADE80"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className={styles.title}>
            {isStarPurchase
              ? tPayment("starSuccessTitle")
              : tPayment("successTitle")}
          </h2>
          <p className={styles.description}>
            {isStarPurchase && starPackage
              ? tPayment("starSuccessDescription", {
                  count: starPackage.totalFragments,
                })
              : tPayment("successDescription")}
          </p>

          {isConfirmed && (
            <div className={styles.orderSummary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>
                  {tPayment("orderNumber")}
                </span>
                <span className={styles.summaryValue}>{orderId}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>
                  {tPayment("paidAmount")}
                </span>
                <span className={styles.summaryValue}>
                  {currency === "USD"
                    ? `$${Number(amount).toFixed(2)}`
                    : `${Number(amount).toLocaleString()}${tPayment("currency")}`}
                </span>
              </div>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleViewFortune}
            >
              {isStarPurchase
                ? returnPath
                  ? tPayment("goToFortune")
                  : tPayment("goHome")
                : tPayment("viewFortune")}
            </button>
            {!isStarPurchase && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleGoHome}
              >
                {tPayment("goToProfiles")}
              </button>
            )}
            {isStarPurchase && returnPath && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleGoHome}
              >
                {tPayment("goHome")}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
