import { NextRequest, NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/face-spoiler/profile/[id]
 *
 * 지정한 관상 프로필을 삭제한다. face_reports는 FK cascade로 함께 삭제된다.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

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

    const { data: existing, error: fetchError } = await supabase
      .from("face_profiles")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching face profile:", fetchError);
      return NextResponse.json(
        { success: false, error: "프로필 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("face_profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting face profile:", deleteError);
      return NextResponse.json(
        { success: false, error: "프로필 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/face-spoiler/profile/[id]:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
