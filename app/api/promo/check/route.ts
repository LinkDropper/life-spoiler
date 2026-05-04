import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

import { createAuthClient } from "@/libs/supabase";
import { hasPromoAppliedToProfile, PromoError } from "@/libs/services/promo";
import type { FortuneType } from "@/libs/supabase/types";

const QuerySchema = z.object({
  profileId: z.string().uuid(),
  fortuneType: z.enum(["lifetime", "yearly", "past_life", "compatibility"]),
});

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
    const parseResult = QuerySchema.safeParse({
      profileId: searchParams.get("profileId"),
      fortuneType: searchParams.get("fortuneType"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const { profileId, fortuneType } = parseResult.data;

    const hasPromo = await hasPromoAppliedToProfile(
      profileId,
      fortuneType as FortuneType
    );

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
