import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@/libs/supabase/client";
import { getFortune, updateFortunePaidAt } from "@/libs/supabase/fortune";
import type { FortuneType } from "@/libs/supabase/fortune";

interface RouteContext {
  params: Promise<{ profileId: string }>;
}

/**
 * profile_free_access 테이블에서 유효한 free access가 있는지 확인
 */
const checkFreeAccess = async (
  profileId: string,
  fortuneType: FortuneType
): Promise<boolean> => {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("profile_free_access")
      .select("id")
      .eq("profile_id", profileId)
      .eq("fortune_type", fortuneType)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle();

    if (error) {
      console.error("Free access 확인 실패:", error);
      return false;
    }

    return data !== null;
  } catch {
    return false;
  }
};

/**
 * 운세 결제 상태 확인 API
 *
 * GET /api/fortune/[profileId]/payment-status?type=lifetime&year=0
 *
 * - fortunes 테이블의 paid_at 확인
 * - profile_free_access가 있고 유효하면 paid_at을 업데이트하고 paid: true 반환
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

    // fortune이 없으면 아직 운세를 조회하지 않은 상태
    if (!fortune) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          paid: false,
        },
      });
    }

    // 이미 결제됨
    if (fortune.paid_at !== null) {
      return NextResponse.json({
        success: true,
        data: {
          exists: true,
          paid: true,
          paidAt: fortune.paid_at,
        },
      });
    }

    // paid_at이 없으면 free access 확인
    const hasFreeAccess = await checkFreeAccess(profileId, fortuneType);

    if (hasFreeAccess) {
      // free access가 있으면 paid_at을 현재 시간으로 업데이트
      const updated = await updateFortunePaidAt(profileId, fortuneType, year);

      if (updated) {
        return NextResponse.json({
          success: true,
          data: {
            exists: true,
            paid: true,
            paidAt: new Date().toISOString(),
            freeAccess: true,
          },
        });
      }
    }

    // free access가 없거나 업데이트 실패
    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        paid: false,
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
