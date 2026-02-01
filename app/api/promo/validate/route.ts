import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { createAuthClient } from "@/libs/supabase";
import { validatePromoCode, PromoError } from "@/libs/services/promo";

import type { FortuneType } from "@/libs/supabase/types";

const RequestSchema = z.object({
  code: z.string().min(1),
  profileId: z.string().uuid(),
  fortuneType: z.enum(["lifetime", "yearly"]),
});

/**
 * 프로모션 코드 유효성 검증 API
 *
 * POST /api/promo/validate
 * Body: { code, profileId, fortuneType }
 */
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
        { success: false, error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const { code, profileId, fortuneType } = parseResult.data;

    const { promoCode } = await validatePromoCode({
      code,
      userId: user.id,
      profileId,
      fortuneType: fortuneType as FortuneType,
    });

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        code: promoCode.code,
        benefitType: promoCode.benefit_type,
        fortuneType: promoCode.fortune_type,
        campaignName: promoCode.campaign_name,
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

    console.error("Error in POST /api/promo/validate:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
