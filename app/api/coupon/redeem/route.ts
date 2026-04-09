import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { createAuthClient } from "@/libs/supabase";
import { redeemStarCoupon, PromoError } from "@/libs/services/promo";

const RequestSchema = z.object({
  code: z.string().min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const supabase = await createAuthClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "쿠폰 코드를 입력해주세요." },
        { status: 400 }
      );
    }

    const { code } = parseResult.data;

    const result = await redeemStarCoupon(code, user.id);

    return NextResponse.json({
      success: true,
      data: {
        starAmount: result.starAmount,
        campaignName: result.campaignName,
      },
    });
  } catch (error) {
    if (error instanceof PromoError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: error.code,
        },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/coupon/redeem:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
