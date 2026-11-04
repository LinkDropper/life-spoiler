"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { PaymentResultScreen } from "@/components/payment/PaymentResultScreen";
import { PaymentTicket } from "@/components/payment/PaymentTicket";
import {
  getProductNameKey,
  isPaymentFortuneType,
} from "@/components/payment/payment-view";
import { PaymentScreeningLoading } from "@/components/screening";
import { useProfileById } from "@/libs/stores/profile";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tPayment = useTranslations("payment");

  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const profileId = searchParams.get("profileId");
  const rawFortuneType = searchParams.get("fortuneType");
  const fortuneType = isPaymentFortuneType(rawFortuneType)
    ? rawFortuneType
    : null;

  // 궁합은 profileId가 쌍 ID라 이름을 읽을 수 없다. 읽지 못하면 관람권 없이 에러 코드만 보여 준다
  const profile = useProfileById(
    fortuneType === "compatibility" ? null : profileId
  );

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
      } else if (fortuneType === "past_life") {
        router.push(`/fortune/past-life/preview/${profileId}`);
      } else {
        router.push(`/fortune/${fortuneType}/preview/${profileId}`);
      }
    } else {
      router.push("/profiles");
    }
  };

  const ticket =
    fortuneType && profile ? (
      <PaymentTicket
        variant="unpaid"
        ariaLabel={tPayment("unpaidTicketAria")}
        kicker={tPayment("ticketKicker")}
        title={tPayment(getProductNameKey(fortuneType))}
        rows={[
          {
            label: tPayment("ticketAudience"),
            value: tPayment("audienceName", { name: profile.name }),
          },
        ]}
        stub={{
          label: tPayment("stubStatus"),
          value: tPayment("stubUnissued"),
        }}
      />
    ) : undefined;

  return (
    <PaymentResultScreen
      tone="failure"
      title={tPayment("unpaidTitle")}
      lead={message || tPayment("failDescription")}
      ticket={ticket}
      receipt={
        code ? [{ label: tPayment("errorCode"), value: code }] : undefined
      }
      primaryAction={{ label: tPayment("retry"), onClick: handleRetry }}
      secondaryAction={{ label: tPayment("goBack"), onClick: handleGoBack }}
    />
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<PaymentScreeningLoading stage="checkout" />}>
      <PaymentFailContent />
    </Suspense>
  );
}
