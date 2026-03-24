import { NextRequest, NextResponse } from "next/server";

import {
  createAuthClient,
  createServerClient,
  updateFortunePaidAt,
  updateCompatibilityPaidAt,
} from "@/libs/supabase";
import type { FortuneType } from "@/libs/supabase";

const STAR_COST = 3;

interface SpendRequest {
  fortuneType: FortuneType;
  profileId: string;
  year?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", message: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body: SpendRequest = await request.json();
    const { fortuneType, profileId, year } = body;

    if (!fortuneType || !profileId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "필수 파라미터가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 1. 지갑 조회
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

    const totalBalance = wallet
      ? wallet.paid_balance + wallet.bonus_balance
      : 0;

    if (!wallet || totalBalance < STAR_COST) {
      return NextResponse.json(
        {
          success: false,
          code: "INSUFFICIENT_BALANCE",
          message: "별조각이 부족합니다.",
          balance: totalBalance,
        },
        { status: 400 }
      );
    }

    // 2. 유료 별조각 먼저 차감, 부족하면 보너스에서 차감
    let paidDelta = 0;
    let bonusDelta = 0;

    if (wallet.paid_balance >= STAR_COST) {
      paidDelta = -STAR_COST;
    } else {
      paidDelta = -wallet.paid_balance;
      bonusDelta = -(STAR_COST - wallet.paid_balance);
    }

    const newPaidBalance = wallet.paid_balance + paidDelta;
    const newBonusBalance = wallet.bonus_balance + bonusDelta;

    // Optimistic locking: 읽을 때의 잔액과 일치할 때만 업데이트
    const { data: updated, error: updateError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("wallets") as any)
        .update({
          paid_balance: newPaidBalance,
          bonus_balance: newBonusBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id)
        .eq("paid_balance", wallet.paid_balance)
        .eq("bonus_balance", wallet.bonus_balance)
        .select("id")
        .single();

    if (updateError || !updated) {
      console.error("지갑 차감 실패 (동시성 충돌):", updateError);
      return NextResponse.json(
        {
          success: false,
          code: "WALLET_UPDATE_FAILED",
          message: "별조각 차감에 실패했습니다. 다시 시도해주세요.",
        },
        { status: 409 }
      );
    }

    // 3. wallet_transactions 기록
    const { error: txError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("wallet_transactions") as any).insert({
        user_id: user.id,
        type: "spend",
        amount: STAR_COST,
        paid_delta: paidDelta,
        bonus_delta: bonusDelta,
        balance_after_paid: newPaidBalance,
        balance_after_bonus: newBonusBalance,
        description: `운세 열람: ${fortuneType} (${profileId})`,
      });

    if (txError) {
      console.error("거래 기록 실패:", txError);
    }

    // 4. paid_at 업데이트
    let paidAtFailed = false;
    if (fortuneType === "compatibility") {
      const success = await updateCompatibilityPaidAt(profileId);
      if (!success) paidAtFailed = true;
    } else {
      const yearValue =
        fortuneType === "yearly" ? (year ?? new Date().getFullYear()) : 0;
      const success = await updateFortunePaidAt(
        profileId,
        fortuneType,
        yearValue
      );
      if (!success) paidAtFailed = true;
    }

    if (paidAtFailed) {
      console.error("paid_at 업데이트 실패:", { profileId, fortuneType });
    }

    return NextResponse.json({
      success: true,
      balance: newPaidBalance + newBonusBalance,
      ...(paidAtFailed && {
        warning: "별조각은 차감되었으나 운세 활성화에 실패했습니다.",
      }),
    });
  } catch (error) {
    console.error("Wallet spend error:", error);
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
