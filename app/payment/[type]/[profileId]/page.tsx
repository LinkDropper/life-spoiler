"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  useProfileById,
  useIsProfilesLoaded,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus, useUser } from "@/libs/stores/user";

import styles from "./page.module.css";

// 국내 결제용 클라이언트 키
const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
// PayPal(해외 간편결제) API 개별 연동용 클라이언트 키
const PAYPAL_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_PAYPAL_CLIENT_KEY ?? "";

const PAYMENT_AMOUNT_KRW = 990;
const PAYMENT_AMOUNT_USD = 0.99;

type FortuneType = "yearly" | "lifetime";

type PaymentMethod = "CARD" | "TOSSPAY" | "KAKAOPAY" | "PAYPAL";

interface PaymentMethodOption {
  id: PaymentMethod;
  labelKey: string;
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
}

const generateOrderId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

const EASY_PAY_MAP: Record<string, string> = {
  TOSSPAY: "토스페이",
  KAKAOPAY: "카카오페이",
};

const PAYMENT_METHODS_KO: PaymentMethodOption[] = [
  {
    id: "KAKAOPAY",
    labelKey: "methodKakaoPay",
    logo: "/images/payment/kakaopay-logo.png",
    logoWidth: 44,
    logoHeight: 18,
  },
  {
    id: "TOSSPAY",
    labelKey: "methodTossPay",
  },
  {
    id: "CARD",
    labelKey: "methodCard",
  },
];

const PAYMENT_METHODS_FOREIGN: PaymentMethodOption[] = [
  {
    id: "PAYPAL",
    labelKey: "methodPayPal",
    logo: "/images/payment/paypal-logo.svg",
    logoWidth: 60,
    logoHeight: 16,
  },
];

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const authStatus = useAuthStatus();
  const user = useUser();
  const profileId = params.profileId as string;
  const fortuneType = params.type as FortuneType;

  const tPayment = useTranslations("payment");
  const tCommon = useTranslations("common");

  const cachedProfile = useProfileById(profileId);
  const isProfilesLoaded = useIsProfilesLoaded();
  const { fetchProfiles } = useProfileActions();

  const isForeignLocale = locale === "en" || locale === "ja";
  const paymentMethods = isForeignLocale
    ? PAYMENT_METHODS_FOREIGN
    : PAYMENT_METHODS_KO;
  const paymentAmount = isForeignLocale
    ? PAYMENT_AMOUNT_USD
    : PAYMENT_AMOUNT_KRW;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    isForeignLocale ? "PAYPAL" : "KAKAOPAY"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (authStatus === "authenticated" && !isProfilesLoaded) {
      fetchProfiles();
    }
  }, [authStatus, isProfilesLoaded, fetchProfiles]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (authStatus !== "authenticated" || !isProfilesLoaded) {
      return;
    }

    if (!cachedProfile) {
      setError(tPayment("profileNotFound"));
      setIsLoading(false);
      return;
    }

    if (fortuneType !== "yearly" && fortuneType !== "lifetime") {
      setError(tPayment("invalidFortuneType"));
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [
    authStatus,
    isProfilesLoaded,
    cachedProfile,
    fortuneType,
    router,
    tPayment,
  ]);

  const handlePayment = async () => {
    if (!cachedProfile || isProcessing) return;

    setIsProcessing(true);

    try {
      const orderId = generateOrderId();
      const orderName =
        fortuneType === "yearly"
          ? tPayment("orderNameYearly", { name: cachedProfile.name })
          : tPayment("orderNameLifetime", { name: cachedProfile.name });

      // PayPal 결제 (v2 결제창 - API 개별 연동 방식)
      if (selectedMethod === "PAYPAL") {
        const tossPayments = await loadTossPayments(PAYPAL_CLIENT_KEY);
        const customerKey = user?.id ?? ANONYMOUS;
        const payment = tossPayments.payment({ customerKey });

        await payment.requestPayment({
          method: "FOREIGN_EASY_PAY",
          amount: {
            currency: "USD",
            value: PAYMENT_AMOUNT_USD,
          },
          orderId,
          orderName,
          successUrl: `${window.location.origin}/payment/success?profileId=${profileId}&fortuneType=${fortuneType}&currency=USD`,
          failUrl: `${window.location.origin}/payment/fail?profileId=${profileId}&fortuneType=${fortuneType}`,
          customerEmail: user?.email || "customer@example.com",
          customerName: cachedProfile.name,
          customerMobilePhone: "01012341234",
          foreignEasyPay: {
            provider: "PAYPAL",
            country: "KR",
            products: [
              {
                name: orderName,
                quantity: 1,
                unitAmount: PAYMENT_AMOUNT_USD,
                currency: "USD",
                description:
                  fortuneType === "yearly"
                    ? "2025 Yearly Fortune"
                    : "Lifetime Fortune",
              },
            ],
          },
        });
        return;
      }

      // 국내 결제 (KRW)
      const tossPayments = await loadTossPayments(CLIENT_KEY);

      const payment = tossPayments.payment({
        customerKey: user?.id ?? ANONYMOUS,
      });

      const basePaymentConfig = {
        amount: {
          currency: "KRW",
          value: PAYMENT_AMOUNT_KRW,
        },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success?profileId=${profileId}&fortuneType=${fortuneType}`,
        failUrl: `${window.location.origin}/payment/fail?profileId=${profileId}&fortuneType=${fortuneType}`,
        customerEmail: user?.email || undefined,
        customerName: cachedProfile.name,
      };

      if (selectedMethod === "CARD") {
        await payment.requestPayment({
          method: "CARD",
          ...basePaymentConfig,
          card: {
            useEscrow: false,
            flowMode: "DEFAULT",
            useCardPoint: false,
            useAppCardOnly: false,
          },
        });
      } else {
        await payment.requestPayment({
          method: "CARD",
          ...basePaymentConfig,
          card: {
            useEscrow: false,
            flowMode: "DIRECT",
            easyPay: EASY_PAY_MAP[selectedMethod],
            useCardPoint: false,
            useAppCardOnly: false,
          },
        });
      }
    } catch (err) {
      // 사용자 취소인 경우 에러 표시하지 않음
      const isCanceled =
        err instanceof Error && /취소|cancel/i.test(err.message);

      if (!isCanceled) {
        setError(tPayment("paymentError"));
      }
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    router.push(`/fortune/${fortuneType}/preview/${profileId}`);
  };

  const getProductName = () => {
    if (fortuneType === "yearly") {
      return tPayment("productNameYearly");
    }
    return tPayment("productNameLifetime");
  };

  if (authStatus === "loading" || isLoading || !isProfilesLoaded) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={styles.main}>
          <div className={styles.error}>
            <p>{error}</p>
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBack}
            >
              {tCommon("back")}
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
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{tPayment("orderTitle")}</h2>
        </div>

        <div className={styles.productCard}>
          <span className={styles.productName}>{getProductName()}</span>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{tPayment("paymentMethod")}</h3>
        </div>

        <div className={styles.methodList}>
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              type="button"
              className={styles.methodItem}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className={styles.radioButton}>
                <div
                  className={`${styles.radioOuter} ${
                    selectedMethod === method.id
                      ? styles.radioOuterSelected
                      : ""
                  }`}
                >
                  {selectedMethod === method.id && (
                    <div className={styles.radioInner} />
                  )}
                </div>
                <span className={styles.methodLabel}>
                  {tPayment(method.labelKey)}
                </span>
                {method.logo && (
                  <Image
                    src={method.logo}
                    alt={tPayment(method.labelKey)}
                    width={method.logoWidth || 44}
                    height={method.logoHeight || 18}
                    className={styles.methodLogo}
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{tPayment("totalAmount")}</h3>
        </div>

        <div className={styles.amountCard}>
          <span className={styles.amountLabel}>{tPayment("finalAmount")}</span>
          <span className={styles.amountValue}>
            {isForeignLocale
              ? `$${paymentAmount.toFixed(2)}`
              : `${paymentAmount.toLocaleString()}${tPayment("currency")}`}
          </span>
        </div>

        <p className={styles.refundNotice}>{tPayment("refundPolicy")}</p>
        <p className={styles.refundNotice}>{tPayment("viewPeriod")}</p>
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={handleBack}
          aria-label={tCommon("back")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
              fill="#18181B"
            />
          </svg>
        </button>
        <button
          type="button"
          className={styles.paymentButton}
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? tPayment("processing") : tPayment("payButtonSimple")}
        </button>
      </footer>
    </div>
  );
}
