import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";
import { getUserPromoUsages, PromoError } from "@/libs/services/promo";

/**
 * 프로모션 코드 사용 내역 조회 API
 *
 * GET /api/promo/history
 */
export async function GET() {
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

    const usages = await getUserPromoUsages(user.id);

    return NextResponse.json({
      success: true,
      data: usages,
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

    console.error("Error in GET /api/promo/history:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
