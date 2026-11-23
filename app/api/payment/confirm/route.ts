import { NextRequest, NextResponse, after } from "next/server";

import { logUtmEvent, readAttributionCookies } from "@/libs/attribution";
import { sendPaymentNotification } from "@/libs/discord";
import {
  isYearlyEdition,
  resolveTargetYear,
} from "@/libs/fortune/yearly-editions";
import {
  FIRST_PAYMENT_AMOUNT_KRW,
  NORMAL_AMOUNT_KRW,
  NORMAL_AMOUNT_USD,
} from "@/libs/services/payment/first-payment-event";
import { isFirstPaymentEligible } from "@/libs/services/payment/first-payment-eligibility";
import {
  fetchTossPayment,
  isApprovedPaymentForOrder,
} from "@/libs/services/payment/toss-payment";
import type { TossPayment } from "@/libs/services/payment/toss-payment";
import {
  createServerClient,
  updateCompatibilityPaidAt,
  updateFortunePaidAt,
} from "@/libs/supabase";
import type { FortuneType } from "@/libs/supabase";

// 국내 결제용 시크릿 키
const SECRET_KEY = process.env.TOSS_SECRET_KEY;
// PayPal(해외 간편결제) API 개별 연동용 시크릿 키
const PAYPAL_SECRET_KEY = process.env.TOSS_PAYPAL_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("TOSS_SECRET_KEY environment variable is required");
}

type Currency = "KRW" | "USD";

interface TossPaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  profileId?: string;
  fortuneType?: FortuneType;
  year?: number;
  currency?: Currency;
}

interface TossPaymentError {
  code: string;
  message: string;
}

/**
 * 이미 승인된 결제에 대한 재요청 응답.
 * paid_at·디스코드 알림은 첫 승인 때 처리됐으므로 다시 하지 않는다.
 */
const buildAlreadyApprovedResponse = (payment: TossPayment) => {
  return NextResponse.json({
    success: true,
    alreadyProcessed: true,
    data: {
      paymentKey: payment.paymentKey,
      orderId: payment.orderId,
      status: payment.status,
      totalAmount: payment.totalAmount,
      method: payment.method,
      approvedAt: payment.approvedAt,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body: TossPaymentConfirmRequest = await request.json();
    const {
      paymentKey,
      orderId,
      amount,
      profileId,
      fortuneType,
      year,
      currency = "KRW",
    } = body;

    if (!paymentKey || !orderId || amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "필수 파라미터가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    // PayPal(USD) 결제는 별도 시크릿 키 사용
    const secretKey = currency === "USD" ? PAYPAL_SECRET_KEY : SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          code: "CONFIGURATION_ERROR",
          message: "결제 설정이 올바르지 않습니다.",
        },
        { status: 500 }
      );
    }

    const encodedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");

    // 결제 완료 페이지는 paymentKey를 URL에 담은 채 승인을 요청하므로
    // 새로고침·뒤로가기·탭 복원으로 다시 들어오면 같은 결제를 또 승인하려 한다.
    // 이미 승인된 결제면 금액 검증·승인 호출 없이 그대로 성공을 돌려준다.
    // (첫 결제 할인 결제는 승인 뒤 자격이 사라져 금액 검증에서 막히므로 그보다 먼저 확인)
    const existingPayment = await fetchTossPayment(
      paymentKey,
      encodedSecretKey
    );
    if (isApprovedPaymentForOrder(existingPayment, orderId)) {
      return buildAlreadyApprovedResponse(existingPayment);
    }

    // 예상 결제 금액을 서버에서 독립적으로 결정 (클라이언트 금액 신뢰 안 함).
    // 국내(KRW)이고 본편 운세 첫 결제 자격이 확정되면 100원, 아니면 정상가.
    let expectedAmount: number;
    if (currency === "USD") {
      expectedAmount = NORMAL_AMOUNT_USD;
    } else {
      const eligibleForFirstPayment =
        profileId && fortuneType
          ? await isFirstPaymentEligible(fortuneType, profileId)
          : false;
      expectedAmount = eligibleForFirstPayment
        ? FIRST_PAYMENT_AMOUNT_KRW
        : NORMAL_AMOUNT_KRW;
    }

    if (amount !== expectedAmount) {
      return NextResponse.json(
        {
          success: false,
          code: "AMOUNT_MISMATCH",
          message: "결제 금액이 일치하지 않습니다.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodedSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as TossPaymentError;

      // 위 사전 조회와 승인 사이에 같은 결제의 다른 요청이 먼저 승인한 경우
      if (errorData.code === "ALREADY_PROCESSED_PAYMENT") {
        const approvedPayment = await fetchTossPayment(
          paymentKey,
          encodedSecretKey
        );
        if (isApprovedPaymentForOrder(approvedPayment, orderId)) {
          return buildAlreadyApprovedResponse(approvedPayment);
        }
      }

      console.error("TossPayments API error:", errorData);
      return NextResponse.json(
        {
          success: false,
          code: errorData.code || "PAYMENT_CONFIRM_FAILED",
          message: errorData.message || "결제 승인에 실패했습니다.",
        },
        { status: response.status }
      );
    }

    const paymentData = data as TossPayment;

    // 결제 승인 성공 시 paid_at 업데이트
    let fortuneUpdateFailed = false;
    if (profileId && fortuneType) {
      if (fortuneType === "compatibility") {
        // 궁합: compatibility_pairs 테이블의 paid_at 업데이트 (profileId에 pairId가 전달됨)
        const updateSuccess = await updateCompatibilityPaidAt(profileId);
        if (!updateSuccess) {
          fortuneUpdateFailed = true;
          console.error("Compatibility paid_at 업데이트 실패:", {
            pairId: profileId,
          });
        }
      } else {
        // 일반 운세: fortunes 테이블의 paid_at 업데이트
        const yearValue = isYearlyEdition(fortuneType)
          ? (year ?? resolveTargetYear(fortuneType))
          : 0;
        const updateSuccess = await updateFortunePaidAt(
          profileId,
          fortuneType,
          yearValue
        );
        if (!updateSuccess) {
          fortuneUpdateFailed = true;
          console.error("paid_at 업데이트 실패:", {
            profileId,
            fortuneType,
            year: yearValue,
          });
        }
      }
    }

    const { attribution, visitorId } = readAttributionCookies(request.cookies);

    after(() =>
      logUtmEvent({
        eventType: "payment",
        attribution,
        visitorId,
        orderId: paymentData.orderId,
        amount: paymentData.totalAmount,
        currency,
        product: fortuneType,
      })
    );

    // 디스코드 결제 알림 전송 (비동기로 실행, 실패해도 결제 응답에 영향 없음)
    if (profileId && fortuneType) {
      const yearValue = isYearlyEdition(fortuneType)
        ? (year ?? resolveTargetYear(fortuneType))
        : undefined;

      // 프로필 이름 조회
      let profileName: string | undefined;
      try {
        const supabase = createServerClient();

        if (fortuneType === "compatibility") {
          // 궁합: compatibility_pairs → profiles 조인으로 두 이름 조회
          const { data: pair } = await supabase
            .from("compatibility_pairs")
            .select("profile_a_id, profile_b_id")
            .eq("id", profileId)
            .single();

          if (pair) {
            const { data: profileA } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", (pair as { profile_a_id: string }).profile_a_id)
              .single<{ name: string }>();
            const { data: profileB } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", (pair as { profile_b_id: string }).profile_b_id)
              .single<{ name: string }>();
            const nameA = profileA?.name ?? "?";
            const nameB = profileB?.name ?? "?";
            profileName = `${nameA} × ${nameB}`;
          }
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", profileId)
            .single<{ name: string }>();
          profileName = profile?.name;
        }
      } catch (error) {
        // 프로필 조회 실패 시 무시하되, 에러는 기록
        console.error("프로필 이름 조회 실패:", error);
      }

      sendPaymentNotification({
        orderId: paymentData.orderId,
        amount: paymentData.totalAmount,
        currency,
        method: paymentData.method,
        fortuneType,
        profileId,
        profileName,
        approvedAt: paymentData.approvedAt,
        year: yearValue,
        fortuneUpdateFailed,
        attribution,
      }).catch((error) => {
        console.error("디스코드 알림 전송 실패:", error);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentKey: paymentData.paymentKey,
        orderId: paymentData.orderId,
        status: paymentData.status,
        totalAmount: paymentData.totalAmount,
        method: paymentData.method,
        approvedAt: paymentData.approvedAt,
      },
      ...(fortuneUpdateFailed && {
        warning: "결제는 완료되었으나 데이터 동기화에 실패했습니다.",
      }),
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
