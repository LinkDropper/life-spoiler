import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { createAuthClient } from "@/libs/supabase";
import { rewardReferral, ReferralError } from "@/libs/services/referral";

const RequestSchema = z.object({
  referrerUserId: z.string().uuid(),
});

const ERROR_STATUS_MAP: Record<string, number> = {
  SELF_REFERRAL: 400,
  INVALID_REFERRER: 400,
  ALREADY_REWARDED: 409,
  DATABASE_ERROR: 500,
};

/**
 * 레퍼럴 보상 API
 *
 * POST /api/referral/reward
 * Body: { referrerUserId }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createAuthClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "인증이 필요합니다.",
          errorCode: "UNAUTHORIZED",
        },
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

    const { referrerUserId } = parseResult.data;

    const result = await rewardReferral(user.id, referrerUserId);

    return NextResponse.json({
      success: true,
      referralId: result.referralId,
    });
  } catch (error) {
    if (error instanceof ReferralError) {
      const status = ERROR_STATUS_MAP[error.code] ?? 500;
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: error.code,
        },
        { status }
      );
    }

    console.error("Error in POST /api/referral/reward:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
