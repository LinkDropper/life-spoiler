"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { PaymentResultScreen } from "@/components/payment/PaymentResultScreen";
import { PaymentTicket } from "@/components/payment/PaymentTicket";
import {
  formatPaymentAmount,
  getProductNameKey,
  getShortProductKey,
  isPaymentFortuneType,
} from "@/components/payment/payment-view";
import { PaymentScreeningLoading } from "@/components/screening";
import { trackPurchase } from "@/libs/analytics";
import {
  isYearlyEdition,
  resolveTargetYear,
} from "@/libs/fortune/yearly-editions";
import { useProfileById } from "@/libs/stores/profile";

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
    | "yearly_2027"
    | null;
  const currency = (searchParams.get("currency") as "KRW" | "USD") || "KRW";

  const hasConfirmedRef = useRef(false);

  // 승인 후 전체 새로고침으로 들어오므로 스토어가 늦게 채워질 수 있다. 궁합은 쌍 ID라 이름을 읽지 않는다
  const profile = useProfileById(
    fortuneType === "compatibility" ? null : profileId
  );

  useEffect(() => {
    if (hasConfirmedRef.current) return;
    hasConfirmedRef.current = true;

    const confirmPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        setError(tPayment("missingPaymentInfo"));
        setIsConfirming(false);
        return;
      }

      try {
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
              fortuneType && isYearlyEdition(fortuneType)
                ? resolveTargetYear(fortuneType)
                : undefined,
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
                      : fortuneType === "yearly_2027"
                        ? tPayment("productNameYearly2027")
                        : tPayment("productNameLifetime"),
                price: Number(amount),
                quantity: 1,
              },
            ],
          });
        }
      } catch {
        setError(tPayment("confirmError"));
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewFortune = () => {
    if (profileId && fortuneType) {
      if (fortuneType === "compatibility") {
        router.push(`/compatibility/${profileId}/fortune/result`);
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
    router.push("/profiles");
  };

  if (isConfirming) {
    return <PaymentScreeningLoading stage="confirm" />;
  }

  const validFortuneType = isPaymentFortuneType(fortuneType)
    ? fortuneType
    : null;
  const audienceText = profile
    ? tPayment("audienceName", { name: profile.name })
    : null;
  const productName = validFortuneType
    ? tPayment(getProductNameKey(validFortuneType))
    : null;

  if (error) {
    // 서버가 내려준 문구는 한국어뿐이라 로케일별 기본 문구(confirmError)를 쓴다
    return (
      <PaymentResultScreen
        tone="failure"
        title={tPayment("confirmFailedTitle")}
        lead={error}
        ticket={
          productName && (
            <PaymentTicket
              variant="void"
              ariaLabel={tPayment("voidTicketAria")}
              kicker={tPayment("ticketKicker")}
              title={tPayment("voidTicketTitle")}
              subtitle={
                audienceText ? `${productName} · ${audienceText}` : productName
              }
            />
          )
        }
        primaryAction={{
          label: tPayment("goToProfiles"),
          onClick: handleGoHome,
        }}
      />
    );
  }

  const getLeadText = (): string => {
    if (!validFortuneType) {
      return tPayment("successDescription");
    }
    const product = tPayment(getShortProductKey(validFortuneType));
    return profile
      ? tPayment("issuedLead", { name: profile.name, product })
      : tPayment("issuedLeadAnonymous", { product });
  };

  const isForeign = currency === "USD";

  return (
    <PaymentResultScreen
      tone="success"
      title={tPayment("issuedTitle")}
      lead={getLeadText()}
      ticket={
        productName && (
          <PaymentTicket
            variant="issued"
            ariaLabel={tPayment("issuedTicketAria")}
            kicker={tPayment("ticketKicker")}
            title={productName}
            rows={[
              ...(audienceText
                ? [{ label: tPayment("ticketAudience"), value: audienceText }]
                : []),
              {
                label: tPayment("ticketPeriod"),
                value: tPayment("ticketPeriodValue"),
              },
            ]}
            stub={{
              label: tPayment("stubFeature"),
              value: tPayment("stubEnter"),
            }}
          />
        )
      }
      receipt={
        isConfirmed
          ? [
              { label: tPayment("orderNumber"), value: orderId ?? "" },
              {
                label: tPayment("paidAmount"),
                value: formatPaymentAmount(
                  Number(amount),
                  isForeign,
                  tPayment("currency")
                ),
              },
            ]
          : undefined
      }
      hint={tPayment("issuedHint")}
      primaryAction={{
        label: tPayment("viewFortune"),
        onClick: handleViewFortune,
      }}
      secondaryAction={{
        label: tPayment("goToProfiles"),
        onClick: handleGoHome,
      }}
    />
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentScreeningLoading stage="confirm" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
