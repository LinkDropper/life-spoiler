import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { applyPromoCodeToFaceReport } from "@/libs/face-spoiler/promo";
import { PromoError } from "@/libs/services/promo";
import { createAuthClient } from "@/libs/supabase";

const RequestSchema = z.object({
  code: z.string().min(1),
  shareId: z.string().min(1),
});

/**
 * 관상 리포트에 프로모션 코드 적용
 *
 * POST /api/face-spoiler/promo/apply
 * Body: { code, shareId }
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

    const { code, shareId } = parseResult.data;

    const result = await applyPromoCodeToFaceReport({
      code,
      userId: user.id,
      shareId,
    });

    return NextResponse.json({
      success: true,
      data: {
        code: result.promoCode.code,
        benefitType: result.promoCode.benefit_type,
        campaignName: result.promoCode.campaign_name,
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

    console.error("Error in POST /api/face-spoiler/promo/apply:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
