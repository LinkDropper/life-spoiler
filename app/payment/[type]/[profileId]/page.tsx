"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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

const CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ||
  "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

const PAYMENT_AMOUNT = 990;

type FortuneType = "yearly" | "lifetime";

type PaymentMethod = "CARD" | "TOSSPAY" | "KAKAOPAY" | "NAVERPAY";

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
  NAVERPAY: "네이버페이",
};

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "KAKAOPAY",
    labelKey: "methodKakaoPay",
    logo: "/images/payment/kakaopay-logo.png",
    logoWidth: 44,
    logoHeight: 18,
  },
  {
    id: "NAVERPAY",
    labelKey: "methodNaverPay",
    logo: "/images/payment/naverpay-logo.svg",
    logoWidth: 44,
    logoHeight: 17,
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

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const user = useUser();
  const profileId = params.profileId as string;
  const fortuneType = params.type as FortuneType;

  const tPayment = useTranslations("payment");
  const tCommon = useTranslations("common");

  const cachedProfile = useProfileById(profileId);
  const isProfilesLoaded = useIsProfilesLoaded();
  const { fetchProfiles } = useProfileActions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CARD");
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
      const tossPayments = await loadTossPayments(CLIENT_KEY);

      const payment = tossPayments.payment({
        customerKey: user?.id ?? ANONYMOUS,
      });

      const orderId = generateOrderId();
      const orderName =
        fortuneType === "yearly"
          ? tPayment("orderNameYearly", { name: cachedProfile.name })
          : tPayment("orderNameLifetime", { name: cachedProfile.name });

      const basePaymentConfig = {
        amount: {
          currency: "KRW",
          value: PAYMENT_AMOUNT,
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
    } catch {
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
          {PAYMENT_METHODS.map((method) => (
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
            {PAYMENT_AMOUNT.toLocaleString()}
            {tPayment("currency")}
          </span>
        </div>

        <p className={styles.refundNotice}>{tPayment("refundPolicy")}</p>
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
