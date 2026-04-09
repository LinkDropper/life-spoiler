import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

interface WalletBalance {
  paid_balance: number;
  bonus_balance: number;
}

export const GET = async () => {
  try {
    const supabase = await createAuthClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ balance: 0 }, { status: 401 });
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("paid_balance, bonus_balance")
      .eq("user_id", user.id)
      .single<WalletBalance>();

    const balance = wallet ? wallet.paid_balance + wallet.bonus_balance : 0;

    return NextResponse.json({ balance });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
