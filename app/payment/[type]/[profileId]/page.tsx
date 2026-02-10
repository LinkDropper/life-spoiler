"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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

type FortuneType = "yearly" | "lifetime" | "compatibility";

type PaymentMethod =
  | "CARD"
  | "TOSSPAY"
  | "KAKAOPAY"
  | "APPLEPAY"
  | "PAYPAL"
  | "PROMO";

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
  APPLEPAY: "애플페이",
};

const PAYMENT_METHOD_PROMO: PaymentMethodOption = {
  id: "PROMO",
  labelKey: "methodPromo",
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
    id: "APPLEPAY",
    labelKey: "methodApplePay",
    logo: "/images/payment/applepay-logo.svg",
    logoWidth: 50,
    logoHeight: 20,
  },
  {
    id: "TOSSPAY",
    labelKey: "methodTossPay",
  },
  {
    id: "CARD",
    labelKey: "methodCard",
  },
  PAYMENT_METHOD_PROMO,
];

const PAYMENT_METHODS_FOREIGN: PaymentMethodOption[] = [
  {
    id: "PAYPAL",
    labelKey: "methodPayPal",
    logo: "/images/payment/paypal-logo.svg",
    logoWidth: 60,
    logoHeight: 16,
  },
  PAYMENT_METHOD_PROMO,
];

function PaymentPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const authStatus = useAuthStatus();
  const user = useUser();
  const profileId = params.profileId as string;
  const fortuneType = params.type as FortuneType;

  const isCompatibility = fortuneType === "compatibility";

  // 궁합: URL 쿼리 파라미터에서 이름 가져오기
  const nameA = searchParams.get("nameA") ?? "";
  const nameB = searchParams.get("nameB") ?? "";

  const tPayment = useTranslations("payment");
  const tCommon = useTranslations("common");

  // 궁합일 때는 프로필 스토어 조회를 스킵
  const cachedProfile = useProfileById(isCompatibility ? "" : profileId);
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
  const [promoCode, setPromoCode] = useState("");
  const [isPromoValidating, setIsPromoValidating] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [showPromoToast, setShowPromoToast] = useState(false);
  const [promoErrorMessage, setPromoErrorMessage] = useState<string | null>(
    null
  );

  const promoToastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const promoErrorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (promoToastTimerRef.current) {
        clearTimeout(promoToastTimerRef.current);
      }
      if (promoErrorTimerRef.current) {
        clearTimeout(promoErrorTimerRef.current);
      }
    };
  }, []);

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

    if (
      fortuneType !== "yearly" &&
      fortuneType !== "lifetime" &&
      fortuneType !== "compatibility"
    ) {
      setError(tPayment("invalidFortuneType"));
      setIsLoading(false);
      return;
    }

    // 궁합이 아닌 경우에만 프로필 확인
    if (!isCompatibility && !cachedProfile) {
      setError(tPayment("profileNotFound"));
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [
    authStatus,
    isProfilesLoaded,
    isCompatibility,
    cachedProfile,
    fortuneType,
    router,
    tPayment,
  ]);

  // 프로모 코드 적용 여부 확인 (궁합은 프로모 미지원)
  useEffect(() => {
    const checkPromoApplied = async () => {
      if (
        isCompatibility ||
        authStatus !== "authenticated" ||
        !profileId ||
        !fortuneType
      ) {
        return;
      }

      try {
        const response = await fetch(
          `/api/promo/check?profileId=${profileId}&fortuneType=${fortuneType}`
        );
        const result = await response.json();

        if (result.success && result.hasPromo) {
          setPromoApplied(true);
          setSelectedMethod("PROMO");
        }
      } catch {
        // 에러 시 무시 (쿠폰 미적용 상태로 유지)
      }
    };

    checkPromoApplied();
  }, [authStatus, profileId, fortuneType, isCompatibility]);

  const handlePayment = async () => {
    if (isProcessing) return;
    if (!isCompatibility && !cachedProfile) return;

    setIsProcessing(true);

    try {
      const orderId = generateOrderId();
      const customerName = isCompatibility
        ? `${nameA} × ${nameB}`
        : (cachedProfile?.name ?? "");
      const orderName = isCompatibility
        ? tPayment("orderNameCompatibility", { nameA, nameB })
        : fortuneType === "yearly"
          ? tPayment("orderNameYearly", { name: cachedProfile?.name ?? "" })
          : tPayment("orderNameLifetime", { name: cachedProfile?.name ?? "" });

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
          customerName,
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
                description: isCompatibility
                  ? "Compatibility Fortune"
                  : fortuneType === "yearly"
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
        customerName,
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
    if (isCompatibility) {
      router.push(`/compatibility/${profileId}/fortune/preview`);
    } else {
      router.push(`/fortune/${fortuneType}/preview/${profileId}`);
    }
  };

  const getProductName = () => {
    if (isCompatibility) {
      return tPayment("productNameCompatibility");
    }
    if (fortuneType === "yearly") {
      return tPayment("productNameYearly");
    }
    return tPayment("productNameLifetime");
  };

  const showPromoError = (message: string) => {
    if (promoErrorTimerRef.current) {
      clearTimeout(promoErrorTimerRef.current);
    }
    setPromoErrorMessage(message);
    promoErrorTimerRef.current = setTimeout(() => {
      setPromoErrorMessage(null);
    }, 3000);
  };

  const handlePromoSubmit = async () => {
    if (!promoCode.trim() || isPromoValidating || promoApplied) return;

    setIsPromoValidating(true);
    setPromoErrorMessage(null);

    try {
      const response = await fetch("/api/promo/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          profileId,
          fortuneType,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        showPromoError(result.error || tPayment("promoError"));
        setIsPromoValidating(false);
        return;
      }

      // 쿠폰 적용 성공
      setPromoApplied(true);
      setShowPromoToast(true);
      setIsPromoValidating(false);

      // 3초 후 토스트 숨김
      if (promoToastTimerRef.current) {
        clearTimeout(promoToastTimerRef.current);
      }
      promoToastTimerRef.current = setTimeout(() => {
        setShowPromoToast(false);
      }, 3000);
    } catch {
      showPromoError(tPayment("promoError"));
      setIsPromoValidating(false);
    }
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

  const handleViewFortune = () => {
    if (isCompatibility) {
      router.push(`/compatibility/${profileId}`);
    } else {
      router.push(`/fortune/${fortuneType}/${profileId}`);
    }
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      {showPromoToast && (
        <div className={styles.promoToast}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.00004 10.78L3.22004 8L2.27337 8.94L6.00004 12.6667L14 4.66667L13.06 3.72667L6.00004 10.78Z"
              fill="white"
            />
          </svg>
          <span>{tPayment("promoSuccess")}</span>
        </div>
      )}

      {promoErrorMessage && (
        <div className={styles.promoToast}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1.33334C4.32 1.33334 1.33334 4.32001 1.33334 8.00001C1.33334 11.68 4.32 14.6667 8 14.6667C11.68 14.6667 14.6667 11.68 14.6667 8.00001C14.6667 4.32001 11.68 1.33334 8 1.33334ZM8.66667 11.3333H7.33334V10H8.66667V11.3333ZM8.66667 8.66668H7.33334V4.66668H8.66667V8.66668Z"
              fill="#FF6B6B"
            />
          </svg>
          <span>{promoErrorMessage}</span>
        </div>
      )}

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

          {selectedMethod === "PROMO" && (
            <div className={styles.promoInputContainer}>
              <input
                type="text"
                className={`${styles.promoInput} ${promoApplied ? styles.promoInputApplied : ""}`}
                placeholder={
                  promoApplied
                    ? tPayment("promoAppliedPlaceholder")
                    : tPayment("promoPlaceholder")
                }
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={isPromoValidating || promoApplied}
              />
              {!promoApplied && (
                <button
                  type="button"
                  className={styles.promoSubmitBtn}
                  onClick={handlePromoSubmit}
                  disabled={!promoCode.trim() || isPromoValidating}
                >
                  {tPayment("promoSubmit")}
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{tPayment("totalAmount")}</h3>
        </div>

        <div className={styles.amountCard}>
          <span className={styles.amountLabel}>{tPayment("finalAmount")}</span>
          {promoApplied ? (
            <div className={styles.amountWithDiscount}>
              <span className={styles.originalAmount}>
                {isForeignLocale
                  ? `$${paymentAmount.toFixed(2)}`
                  : `${paymentAmount.toLocaleString()}${tPayment("currency")}`}
              </span>
              <span className={styles.discountedAmount}>
                {isForeignLocale ? "$0.00" : `0${tPayment("currency")}`}
              </span>
            </div>
          ) : (
            <span className={styles.amountValue}>
              {isForeignLocale
                ? `$${paymentAmount.toFixed(2)}`
                : `${paymentAmount.toLocaleString()}${tPayment("currency")}`}
            </span>
          )}
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
          onClick={promoApplied ? handleViewFortune : handlePayment}
          disabled={
            isProcessing || (selectedMethod === "PROMO" && !promoApplied)
          }
        >
          {isProcessing
            ? tPayment("processing")
            : promoApplied
              ? tPayment("viewFortune")
              : tPayment("payButtonSimple")}
        </button>
      </footer>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PaymentPageContent />
    </Suspense>
  );
}
