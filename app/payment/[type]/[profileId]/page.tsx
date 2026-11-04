"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

import { HeaderClient } from "@/components/landing";
import { PaymentCouponSection } from "@/components/payment/PaymentCouponSection";
import { PaymentMethodFieldset } from "@/components/payment/PaymentMethodFieldset";
import { PaymentResultScreen } from "@/components/payment/PaymentResultScreen";
import { PaymentTicket } from "@/components/payment/PaymentTicket";
import {
  formatPaymentAmount,
  getProductNameKey,
  getShortProductKey,
  isPaymentFortuneType,
  resolveAmountDisplay,
} from "@/components/payment/payment-view";
import type { OwnedCoupon } from "@/components/payment/payment-view";
import { PaymentScreeningLoading } from "@/components/screening";
import {
  isYearlyEdition,
  resolveTargetYear,
} from "@/libs/fortune/yearly-editions";
import {
  useProfileById,
  useIsProfilesLoaded,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus, useUser } from "@/libs/stores/user";
import { FIRST_PAYMENT_AMOUNT_KRW } from "@/libs/services/payment/first-payment-event";
import type { FortuneType } from "@/libs/supabase";
import { useFirstPaymentEligibility } from "@/libs/hooks/payment";

import styles from "./page.module.css";

// 국내 결제용 클라이언트 키
const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
// PayPal(해외 간편결제) API 개별 연동용 클라이언트 키
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

// 시안 순서: 간편결제(카카오페이, 토스페이) -> 카드 -> Apple Pay -> 쿠폰
const PAYMENT_METHODS_KO: PaymentMethodOption[] = [
  { id: "KAKAOPAY", labelKey: "methodKakaoPay" },
  { id: "TOSSPAY", labelKey: "methodTossPay" },
  { id: "CARD", labelKey: "methodCard" },
  { id: "APPLEPAY", labelKey: "methodApplePay" },
  PAYMENT_METHOD_PROMO,
];

const PAYMENT_METHODS_FOREIGN: PaymentMethodOption[] = [
  { id: "PAYPAL", labelKey: "methodPayPal" },
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

  // 첫 결제 100원 이벤트 자격 (국내 KRW 전용) — 공용 훅으로 서버 확인
  const firstPaymentApplied = useFirstPaymentEligibility(
    profileId,
    fortuneType
  );
  const effectiveKrwAmount = firstPaymentApplied
    ? FIRST_PAYMENT_AMOUNT_KRW
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

  const [ownedCoupons, setOwnedCoupons] = useState<OwnedCoupon[]>([]);

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

    if (!isPaymentFortuneType(fortuneType)) {
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

  // 프로모 코드 적용 여부 확인 (궁합은 profileId 가 compatibility_pairs.id)
  useEffect(() => {
    const checkPromoApplied = async () => {
      if (authStatus !== "authenticated" || !profileId || !fortuneType) {
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

  // 보유 쿠폰 목록 조회
  useEffect(() => {
    const fetchOwnedCoupons = async () => {
      if (authStatus !== "authenticated") return;

      try {
        const response = await fetch("/api/coupon/list");
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const filtered = result.data.filter(
            (c: OwnedCoupon) =>
              c.status === "active" &&
              (c.fortuneType === "all" || c.fortuneType === fortuneType)
          );
          setOwnedCoupons(filtered);
        }
      } catch {
        // 쿠폰 목록 로딩 실패 시 무시
      }
    };

    fetchOwnedCoupons();
  }, [authStatus, fortuneType]);

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
          ? tPayment("orderNameYearly", {
              name: cachedProfile?.name ?? "",
            })
          : fortuneType === "yearly_2027"
            ? tPayment("orderNameYearly2027", {
                name: cachedProfile?.name ?? "",
              })
            : fortuneType === "past_life"
              ? tPayment("orderNamePastLife", {
                  name: cachedProfile?.name ?? "",
                })
              : tPayment("orderNameLifetime", {
                  name: cachedProfile?.name ?? "",
                });

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
                  : isYearlyEdition(fortuneType)
                    ? `${resolveTargetYear(fortuneType)} Yearly Fortune`
                    : fortuneType === "past_life"
                      ? "Past Life Fortune"
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
          value: effectiveKrwAmount,
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
    } else if (fortuneType === "past_life") {
      router.push(`/fortune/past-life/preview/${profileId}`);
    } else {
      router.push(`/fortune/${fortuneType}/preview/${profileId}`);
    }
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
    return <PaymentScreeningLoading stage="checkout" />;
  }

  if (error) {
    return (
      <PaymentResultScreen
        tone="failure"
        title={error}
        primaryAction={{ label: tCommon("back"), onClick: handleBack }}
      />
    );
  }

  const handleViewFortune = () => {
    if (isCompatibility) {
      router.push(`/compatibility/${profileId}/fortune/result`);
    } else if (fortuneType === "past_life") {
      router.push(`/fortune/past-life/${profileId}`);
    } else {
      router.push(`/fortune/${fortuneType}/${profileId}`);
    }
  };

  const amountDisplay = resolveAmountDisplay({
    isForeign: isForeignLocale,
    firstPaymentApplied,
    couponApplied: promoApplied,
  });
  const formatAmount = (value: number): string =>
    formatPaymentAmount(value, isForeignLocale, tPayment("currency"));
  const currentAmountText = formatAmount(amountDisplay.amount);
  const originalAmountText =
    amountDisplay.originalAmount === null
      ? undefined
      : formatAmount(amountDisplay.originalAmount);

  const profileName = cachedProfile?.name ?? "";
  const hasCompatibilityNames = isCompatibility && nameA !== "" && nameB !== "";
  const hasAudience = isCompatibility ? hasCompatibilityNames : true;
  const audienceText = isCompatibility
    ? tPayment("audienceCouple", { nameA, nameB })
    : tPayment("audienceName", { name: profileName });
  const shortProduct = tPayment(getShortProductKey(fortuneType));

  const getLeadText = (): string => {
    if (!hasAudience) {
      return tPayment("checkoutLeadAnonymous", { product: shortProduct });
    }
    if (isCompatibility) {
      return tPayment("checkoutLeadCompatibility", { nameA, nameB });
    }
    return tPayment("checkoutLead", {
      name: profileName,
      product: shortProduct,
    });
  };

  const benefitText =
    amountDisplay.benefit === "coupon"
      ? tPayment("benefitCoupon")
      : amountDisplay.benefit === "firstPayment"
        ? tPayment("benefitFirstPayment")
        : null;

  const ticketRows = [
    ...(hasAudience
      ? [{ label: tPayment("ticketAudience"), value: audienceText }]
      : []),
    ...(benefitText
      ? [{ label: tPayment("ticketBenefit"), value: benefitText }]
      : []),
    {
      label: tPayment("ticketPeriod"),
      value: tPayment("ticketPeriodValue"),
    },
  ];

  const methods = paymentMethods.map((method) => ({
    id: method.id,
    label: tPayment(method.labelKey),
  }));

  return (
    <div className={styles.page}>
      <HeaderClient />

      {showPromoToast && (
        <div className={styles.toast} role="status">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>{tPayment("promoSuccess")}</span>
        </div>
      )}

      {promoErrorMessage && (
        <div className={styles.toast} role="alert">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 6v8M12 18h.01" />
          </svg>
          <span>{promoErrorMessage}</span>
        </div>
      )}

      <div className={styles.flow}>
        <main className={styles.main}>
          <h1 className={styles.title}>{tPayment("ticketTitle")}</h1>
          <p className={styles.lead}>{getLeadText()}</p>

          <PaymentTicket
            variant="pending"
            ariaLabel={tPayment("orderTitle")}
            kicker={tPayment("ticketKicker")}
            title={tPayment(getProductNameKey(fortuneType))}
            rows={ticketRows}
            stub={{
              label: tPayment("ticketAmount"),
              originalValue: originalAmountText,
              originalSrLabel: tPayment("listPrice"),
              value: currentAmountText,
            }}
          />

          <PaymentMethodFieldset
            legend={tPayment("paymentMethod")}
            methods={methods}
            selected={selectedMethod}
            onSelect={setSelectedMethod}
          >
            {selectedMethod === "PROMO" && (
              <PaymentCouponSection
                ownedCoupons={ownedCoupons}
                promoCode={promoCode}
                isApplied={promoApplied}
                isValidating={isPromoValidating}
                onCodeChange={setPromoCode}
                onSubmit={handlePromoSubmit}
              />
            )}
          </PaymentMethodFieldset>

          <ul className={styles.notice}>
            <li>{tPayment("refundPolicy")}</li>
            <li>{tPayment("viewPeriod")}</li>
          </ul>
        </main>

        <div
          className={styles.bar}
          role="group"
          aria-label={tPayment("barLabel")}
        >
          <button
            type="button"
            className={styles.back}
            onClick={handleBack}
            aria-label={tCommon("back")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className={styles.total}>
            <span className={styles.totalLabel}>{tPayment("totalAmount")}</span>
            <p className={styles.totalValue}>
              {originalAmountText && (
                <del>
                  <span className={styles.srOnly}>
                    {tPayment("listPrice")}{" "}
                  </span>
                  {originalAmountText}
                </del>
              )}
              <strong>{currentAmountText}</strong>
            </p>
          </div>
          <button
            type="button"
            className={styles.submit}
            onClick={promoApplied ? handleViewFortune : handlePayment}
            disabled={
              isProcessing || (selectedMethod === "PROMO" && !promoApplied)
            }
          >
            {isProcessing
              ? tPayment("processing")
              : promoApplied
                ? tPayment("viewFortune")
                : tPayment("payAction")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentScreeningLoading stage="checkout" />}>
      <PaymentPageContent />
    </Suspense>
  );
}
