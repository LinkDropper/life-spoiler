import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

import { hasPromoAppliedToFaceReport } from "@/libs/face-spoiler/promo";
import { PromoError } from "@/libs/services/promo";
import { createAuthClient } from "@/libs/supabase";

const QuerySchema = z.object({
  shareId: z.string().min(1),
});

/**
 * 관상 리포트에 프로모션 코드 적용 여부 확인
 *
 * GET /api/face-spoiler/promo/check?shareId=xxx
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
      shareId: searchParams.get("shareId"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const { shareId } = parseResult.data;
    const hasPromo = await hasPromoAppliedToFaceReport(shareId);

    return NextResponse.json({ success: true, hasPromo });
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

    console.error("Error in GET /api/face-spoiler/promo/check:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
