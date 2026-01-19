import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY =
  process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";
const EXPECTED_AMOUNT = 990;

interface TossPaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
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
    const { paymentKey, orderId, amount } = body;

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

    if (amount !== EXPECTED_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          code: "AMOUNT_MISMATCH",
          message: "결제 금액이 일치하지 않습니다.",
        },
        { status: 400 }
      );
    }

    const encodedSecretKey = Buffer.from(`${SECRET_KEY}:`).toString("base64");

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
