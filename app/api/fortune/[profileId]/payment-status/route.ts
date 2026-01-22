import { NextRequest, NextResponse } from "next/server";

import { getFortune } from "@/libs/supabase/fortune";
import type { FortuneType } from "@/libs/supabase/fortune";

interface RouteContext {
  params: Promise<{ profileId: string }>;
}

/**
 * 운세 결제 상태 확인 API
 *
 * GET /api/fortune/[profileId]/payment-status?type=lifetime&year=0
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { profileId } = await context.params;
    const { searchParams } = new URL(request.url);

    const typeParam = searchParams.get("type") || "lifetime";
    const fortuneType: FortuneType =
      typeParam === "lifetime" || typeParam === "yearly"
        ? typeParam
        : "lifetime";

    let year = 0;
    if (fortuneType === "yearly") {
      const yearParam = searchParams.get("year");
      const parsedYear = yearParam
        ? parseInt(yearParam, 10)
        : new Date().getFullYear();
      year = Number.isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
    }

    const fortune = await getFortune(profileId, fortuneType, year);

    if (!fortune) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          paid: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        paid: fortune.paid_at !== null,
        paidAt: fortune.paid_at,
      },
    });
  } catch (error) {
    console.error(
      "Error in GET /api/fortune/[profileId]/payment-status:",
      error
    );
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
