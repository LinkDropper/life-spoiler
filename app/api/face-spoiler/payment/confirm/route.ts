import { NextRequest, NextResponse } from "next/server";

import { sendFaceReportPaymentNotification } from "@/libs/discord";
import {
  createAuthClient,
  getFaceReportByShareId,
  updateFaceReportPaidAt,
} from "@/libs/supabase";

const SECRET_KEY = process.env.TOSS_SECRET_KEY;
const PAYPAL_SECRET_KEY = process.env.TOSS_PAYPAL_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("TOSS_SECRET_KEY environment variable is required");
}

const EXPECTED_AMOUNT_KRW = 990;
const EXPECTED_AMOUNT_USD = 0.99;

type Currency = "KRW" | "USD";

interface ConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  shareId: string;
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
    const authClient = await createAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "인증이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const body: ConfirmRequest = await request.json();
    const { paymentKey, orderId, amount, shareId, currency = "KRW" } = body;

    if (!paymentKey || !orderId || amount === undefined || !shareId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "필수 파라미터가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    // 소유권 검증
    const report = await getFaceReportByShareId(shareId);
    if (!report) {
      return NextResponse.json(
        {
          success: false,
          code: "REPORT_NOT_FOUND",
          message: "리포트를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }
    if (report.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message: "접근 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    // 금액 검증
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

    // Toss 결제 승인 요청
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

    // paid_at 업데이트
    const updated = await updateFaceReportPaidAt(shareId);
    const updateFailed = !updated;

    if (updateFailed) {
      console.error("face_reports paid_at 업데이트 실패:", { shareId });
    }

    // Discord 알림 (비동기, 실패해도 결제 응답에 영향 없음)
    sendFaceReportPaymentNotification({
      orderId: paymentData.orderId,
      amount: paymentData.totalAmount,
      currency,
      method: paymentData.method,
      shareId,
      userId: user.id,
      userEmail: user.email ?? undefined,
      approvedAt: paymentData.approvedAt,
      updateFailed,
    }).catch((error) => {
      console.error("디스코드 알림 전송 실패:", error);
    });

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
      ...(updateFailed && {
        warning: "결제는 완료되었으나 데이터 동기화에 실패했습니다.",
      }),
    });
  } catch (error) {
    console.error("Face payment confirmation error:", error);
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
