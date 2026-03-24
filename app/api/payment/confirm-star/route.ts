import { NextRequest, NextResponse } from "next/server";

import { sendPaymentNotification } from "@/libs/discord";
import { STAR_PACKAGES } from "@/libs/star-packages";
import type { StarPackageId } from "@/libs/star-packages";
import { createAuthClient, createServerClient } from "@/libs/supabase";

// 국내 결제용 시크릿 키
const SECRET_KEY = process.env.TOSS_SECRET_KEY;
// PayPal(해외 간편결제) API 개별 연동용 시크릿 키
const PAYPAL_SECRET_KEY = process.env.TOSS_PAYPAL_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("TOSS_SECRET_KEY environment variable is required");
}

type Currency = "KRW" | "USD";

interface ConfirmStarRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  packageId: StarPackageId;
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
    // 인증된 유저 확인
    const supabaseAuth = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "인증이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const body: ConfirmStarRequest = await request.json();
    const { paymentKey, orderId, amount, packageId, currency = "KRW" } = body;

    if (!paymentKey || !orderId || amount === undefined || !packageId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "필수 파라미터가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    // 상품 존재 여부 확인
    const starPackage = STAR_PACKAGES[packageId];
    if (!starPackage) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PACKAGE",
          message: "유효하지 않은 상품입니다.",
        },
        { status: 400 }
      );
    }

    // 금액 검증
    const expectedAmount =
      currency === "USD" ? starPackage.priceUSD : starPackage.priceKRW;

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

    // Toss 결제 승인
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

    // 결제 승인 성공 → 지갑에 별조각 충전
    const supabase = createServerClient();
    let walletUpdateFailed = false;

    try {
      interface WalletData {
        id: string;
        paid_balance: number;
        bonus_balance: number;
      }

      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, paid_balance, bonus_balance")
        .eq("user_id", user.id)
        .single<WalletData>();

      if (wallet) {
        const { error: walletUpdateError } =
          await // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from("wallets") as any)
            .update({
              paid_balance: wallet.paid_balance + starPackage.paidFragments,
              bonus_balance: wallet.bonus_balance + starPackage.bonusFragments,
              updated_at: new Date().toISOString(),
            })
            .eq("id", wallet.id);

        if (walletUpdateError) {
          throw new Error(`지갑 업데이트 실패: ${walletUpdateError.message}`);
        }

        // wallet_transactions 기록
        const { error: txError } =
          await // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from("wallet_transactions") as any).insert({
            user_id: user.id,
            type: "purchase",
            amount: starPackage.totalFragments,
            paid_delta: starPackage.paidFragments,
            bonus_delta: starPackage.bonusFragments,
            balance_after_paid: wallet.paid_balance + starPackage.paidFragments,
            balance_after_bonus:
              wallet.bonus_balance + starPackage.bonusFragments,
            description: `별조각 충전: ${packageId} (${orderId})`,
          });

        if (txError) {
          console.error("거래 기록 실패:", txError);
        }
      } else {
        // 지갑이 없으면 새로 생성
        const { data: newWallet, error: insertError } =
          await // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from("wallets") as any)
            .insert({
              user_id: user.id,
              paid_balance: starPackage.paidFragments,
              bonus_balance: starPackage.bonusFragments,
            })
            .select("id")
            .single();

        if (insertError) {
          throw new Error(`지갑 생성 실패: ${insertError.message}`);
        }

        if (newWallet) {
          const { error: txError } =
            await // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase.from("wallet_transactions") as any).insert({
              user_id: user.id,
              type: "purchase",
              amount: starPackage.totalFragments,
              paid_delta: starPackage.paidFragments,
              bonus_delta: starPackage.bonusFragments,
              balance_after_paid: starPackage.paidFragments,
              balance_after_bonus: starPackage.bonusFragments,
              description: `별조각 충전: ${packageId} (${orderId})`,
            });

          if (txError) {
            console.error("거래 기록 실패:", txError);
          }
        }
      }
    } catch (error) {
      walletUpdateFailed = true;
      console.error("지갑 업데이트 실패:", error);
    }

    // 디스코드 알림 전송 (비동기, 실패해도 결제 응답에 영향 없음)
    sendPaymentNotification({
      orderId: paymentData.orderId,
      amount: paymentData.totalAmount,
      currency,
      method: paymentData.method,
      fortuneType: "star_charge",
      profileId: user.id,
      profileName: `별조각 충전 (${packageId})`,
      approvedAt: paymentData.approvedAt,
      fortuneUpdateFailed: walletUpdateFailed,
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
        totalFragments: starPackage.totalFragments,
      },
      ...(walletUpdateFailed && {
        warning: "결제는 완료되었으나 별조각 충전에 실패했습니다.",
      }),
    });
  } catch (error) {
    console.error("Star payment confirmation error:", error);
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
