import { NextRequest, NextResponse } from "next/server";

import { sendPaymentNotification } from "@/libs/discord";
import { createServerClient, updateFortunePaidAt } from "@/libs/supabase";
import type { FortuneType } from "@/libs/supabase";

// 국내 결제용 시크릿 키
const SECRET_KEY = process.env.TOSS_SECRET_KEY;
// PayPal(해외 간편결제) API 개별 연동용 시크릿 키
const PAYPAL_SECRET_KEY = process.env.TOSS_PAYPAL_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("TOSS_SECRET_KEY environment variable is required");
}

// 예상 결제 금액
const EXPECTED_AMOUNT_KRW = 990;
const EXPECTED_AMOUNT_USD = 0.99;

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

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  [key: string]: unknown;
}

interface TossPaymentError {
  code: string;
  message: string;
}

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

    // 통화에 따른 예상 금액 검증
    const expectedAmount =
      currency === "USD" ? EXPECTED_AMOUNT_USD : EXPECTED_AMOUNT_KRW;

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

    const paymentData = data as TossPaymentResponse;

    // 결제 승인 성공 시 fortunes 테이블의 paid_at 업데이트
    let fortuneUpdateFailed = false;
    if (profileId && fortuneType) {
      const yearValue =
        fortuneType === "yearly" ? (year ?? new Date().getFullYear()) : 0;
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

    // 디스코드 결제 알림 전송 (비동기로 실행, 실패해도 결제 응답에 영향 없음)
    if (profileId && fortuneType) {
      const yearValue =
        fortuneType === "yearly"
          ? (year ?? new Date().getFullYear())
          : undefined;

      // 프로필 이름 조회
      let profileName: string | undefined;
      try {
        const supabase = createServerClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", profileId)
          .single<{ name: string }>();
        profileName = profile?.name;
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
