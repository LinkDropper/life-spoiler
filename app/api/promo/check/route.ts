import { NextRequest, NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";
import { hasPromoAppliedToProfile, PromoError } from "@/libs/services/promo";
import type { FortuneType } from "@/libs/supabase/types";

/**
 * 프로필에 프로모션 코드 적용 여부 확인 API
 *
 * GET /api/promo/check?profileId=xxx&fortuneType=yearly
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");
    const fortuneType = searchParams.get("fortuneType");

    if (!profileId || !fortuneType) {
      return NextResponse.json(
        { success: false, error: "profileId와 fortuneType이 필요합니다." },
        { status: 400 }
      );
    }

    if (fortuneType !== "yearly" && fortuneType !== "lifetime") {
      return NextResponse.json(
        { success: false, error: "잘못된 fortuneType입니다." },
        { status: 400 }
      );
    }

    const hasPromo = await hasPromoAppliedToProfile(profileId, fortuneType);

    return NextResponse.json({
      success: true,
      hasPromo,
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

    console.error("Error in GET /api/promo/check:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
