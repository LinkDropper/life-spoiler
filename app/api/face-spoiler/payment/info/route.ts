import { NextRequest, NextResponse } from "next/server";

import { createAuthClient, getFaceReportByShareId } from "@/libs/supabase";

/**
 * 관상 리포트 결제 페이지용 정보 조회
 *
 * GET /api/face-spoiler/payment/info?shareId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json(
        { success: false, error: "shareId가 필요합니다." },
        { status: 400 }
      );
    }

    const report = await getFaceReportByShareId(shareId);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "리포트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (report.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        shareId: report.share_id,
        paidAt: report.paid_at,
        characterImagePath: report.character_image_path,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/face-spoiler/payment/info:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
