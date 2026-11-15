import { NextRequest, NextResponse } from "next/server";

import {
  isYearlyEdition,
  resolveTargetYear,
} from "@/libs/fortune/yearly-editions";
import { getFortune, updateFortunePaidAt } from "@/libs/supabase/fortune";
import type { FortuneType } from "@/libs/supabase/fortune";
import { hasFreeAccess } from "@/libs/supabase/fortune-access";

interface RouteContext {
  params: Promise<{ profileId: string }>;
}

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
      typeParam === "lifetime" ||
      typeParam === "yearly" ||
      typeParam === "past_life" ||
      typeParam === "yearly_2027"
        ? typeParam
        : "lifetime";

    let year = 0;
    if (isYearlyEdition(fortuneType)) {
      const defaultYear = resolveTargetYear(fortuneType);
      const yearParam = searchParams.get("year");
      const parsedYear = yearParam ? parseInt(yearParam, 10) : defaultYear;
      year = Number.isNaN(parsedYear) ? defaultYear : parsedYear;
    }

    const fortune = await getFortune(profileId, fortuneType, year);

    // fortune이 없으면 아직 운세를 조회하지 않은 상태
    // 하지만 free access가 있을 수 있으므로 확인 필요
    if (!fortune) {
      const freeAccess = await hasFreeAccess(profileId, fortuneType);

      if (freeAccess) {
        // free access가 있으면 결과 페이지에서 fortune 생성 후 접근 가능
        return NextResponse.json({
          success: true,
          data: {
            exists: false,
            paid: true, // free access로 인해 결제된 것으로 처리
            freeAccess: true,
          },
        });
      }

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
    const freeAccess = await hasFreeAccess(profileId, fortuneType);

    if (freeAccess) {
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
