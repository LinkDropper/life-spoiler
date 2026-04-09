"use client";

import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Header } from "@/components/face-spoiler/Header";
import { useAuthStatus, useUser } from "@/libs/stores/user";

import styles from "./page.module.css";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
const PAYPAL_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_PAYPAL_CLIENT_KEY ?? "";

const PAYMENT_AMOUNT_KRW = 990;
const PAYMENT_AMOUNT_USD = 0.99;

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

const generateOrderId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

export default function FaceSpoilerPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const authStatus = useAuthStatus();
  const user = useUser();
  const shareId = params.shareId as string;

  const tPayment = useTranslations("payment");
  const tCommon = useTranslations("common");
  const tFace = useTranslations("faceSpoiler.payment");

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

  // 인증 + 리포트 정보 조회
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/face-spoiler/login");
      return;
    }

    if (authStatus !== "authenticated") {
      return;
    }

    const fetchInfo = async () => {
      try {
        const response = await fetch(
          `/api/face-spoiler/payment/info?shareId=${shareId}`
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(
            result.error ??
              tFace("errorCantLoadReport", {
                default: "리포트를 불러올 수 없습니다.",
              })
          );
          setIsLoading(false);
          return;
        }

        // 이미 결제된 리포트는 바로 결과 페이지로
        if (result.data.paidAt) {
          router.replace(`/face-spoiler/r/${shareId}`);
          return;
        }

        setIsLoading(false);
      } catch {
        setError(
          tFace("errorCantLoadReport", {
            default: "리포트를 불러올 수 없습니다.",
          })
        );
        setIsLoading(false);
      }
    };

    fetchInfo();
  }, [authStatus, shareId, router, tFace]);

  // 프로모 적용 여부 확인
  useEffect(() => {
    const checkPromoApplied = async () => {
      if (authStatus !== "authenticated" || !shareId) return;

      try {
        const response = await fetch(
          `/api/face-spoiler/promo/check?shareId=${shareId}`
        );
        const result = await response.json();
        if (result.success && result.hasPromo) {
          setPromoApplied(true);
          setSelectedMethod("PROMO");
        }
      } catch {
        // 무시
      }
    };

    checkPromoApplied();
  }, [authStatus, shareId]);

  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const orderId = generateOrderId();
      const customerName =
        user?.email?.split("@")[0] ??
        tFace("productName", { default: "관상 운세 스포일러" });
      const orderName = tFace("orderName", { default: "관상 운세 스포일러" });

      const successUrl = `${window.location.origin}/face-spoiler/payment/success?shareId=${shareId}`;
      const failUrl = `${window.location.origin}/face-spoiler/payment/fail?shareId=${shareId}`;

      // PayPal 결제
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
          successUrl: `${successUrl}&currency=USD`,
          failUrl,
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
                description: "Face Reading Spoiler",
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
        successUrl,
        failUrl,
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
      const isCanceled =
        err instanceof Error && /취소|cancel/i.test(err.message);
      if (!isCanceled) {
        setError(
          tPayment("paymentError", { default: "결제 중 오류가 발생했어요." })
        );
      }
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    router.push(`/face-spoiler/preview/${shareId}`);
  };

  const handleViewResult = () => {
    router.push(`/face-spoiler/payment/success?shareId=${shareId}&promo=true`);
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
      const response = await fetch("/api/face-spoiler/promo/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          shareId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        showPromoError(
          result.error ||
            tPayment("promoError", { default: "쿠폰 적용에 실패했어요." })
        );
        setIsPromoValidating(false);
        return;
      }

      setPromoApplied(true);
      setShowPromoToast(true);
      setIsPromoValidating(false);

      if (promoToastTimerRef.current) {
        clearTimeout(promoToastTimerRef.current);
      }
      promoToastTimerRef.current = setTimeout(() => {
        setShowPromoToast(false);
      }, 3000);
    } catch {
      showPromoError(
        tPayment("promoError", { default: "쿠폰 적용에 실패했어요." })
      );
      setIsPromoValidating(false);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.loadingState}>
            {tFace("loadingReport", { default: "불러오는 중..." })}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.errorState}>
            <p>{error}</p>
            <button
              type="button"
              className={styles.backBtn}
              onClick={handleBack}
            >
              {tCommon("back", { default: "뒤로가기" })}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      {showPromoToast && (
        <div className={styles.promoToast}>
          <span>
            {tPayment("promoSuccess", { default: "쿠폰이 적용되었어요." })}
          </span>
        </div>
      )}

      {promoErrorMessage && (
        <div className={styles.promoToast}>
          <span>{promoErrorMessage}</span>
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {tPayment("orderTitle", { default: "주문 상품" })}
          </h2>
        </div>

        <div className={styles.productCard}>
          <span className={styles.productName}>
            {tFace("productName", { default: "관상 운세 스포일러" })}
          </span>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {tPayment("paymentMethod", { default: "결제 수단" })}
          </h3>
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
                    ? tPayment("promoAppliedPlaceholder", {
                        default: "쿠폰이 적용되었어요",
                      })
                    : tPayment("promoPlaceholder", {
                        default: "쿠폰 코드를 입력하세요",
                      })
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
                  {tPayment("promoSubmit", { default: "적용" })}
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {tPayment("totalAmount", { default: "결제 금액" })}
          </h3>
        </div>

        <div className={styles.amountCard}>
          <span className={styles.amountLabel}>
            {tPayment("finalAmount", { default: "최종 결제 금액" })}
          </span>
          {promoApplied ? (
            <div className={styles.amountWithDiscount}>
              <span className={styles.originalAmount}>
                {isForeignLocale
                  ? `$${paymentAmount.toFixed(2)}`
                  : `${paymentAmount.toLocaleString()}${tPayment("currency", { default: "원" })}`}
              </span>
              <span className={styles.discountedAmount}>
                {isForeignLocale
                  ? "$0.00"
                  : `0${tPayment("currency", { default: "원" })}`}
              </span>
            </div>
          ) : (
            <span className={styles.amountValue}>
              {isForeignLocale
                ? `$${paymentAmount.toFixed(2)}`
                : `${paymentAmount.toLocaleString()}${tPayment("currency", { default: "원" })}`}
            </span>
          )}
        </div>

        <p className={styles.refundNotice}>
          {tPayment("refundPolicy", {
            default:
              "디지털 콘텐츠 특성상 결제 즉시 제공되어 환불이 불가합니다.",
          })}
        </p>
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={handleBack}
          aria-label={tCommon("back", { default: "뒤로가기" })}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          type="button"
          className={styles.paymentButton}
          onClick={promoApplied ? handleViewResult : handlePayment}
          disabled={
            isProcessing || (selectedMethod === "PROMO" && !promoApplied)
          }
        >
          {isProcessing
            ? tPayment("processing", { default: "결제 진행 중..." })
            : promoApplied
              ? tFace("viewResult", { default: "결과 보기" })
              : tPayment("payButtonSimple", { default: "990원 결제하기" })}
        </button>
      </footer>
    </div>
  );
}
