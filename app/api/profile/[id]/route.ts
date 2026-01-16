import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const DELETE = async (_request: Request, { params }: RouteParams) => {
  try {
    const { id: profileId } = await params;
    const supabase = await createAuthClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 프로필이 현재 사용자의 것인지 확인
    const { data: profile, error: profileError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .select("id, user_id")
        .eq("id", profileId)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (profile.user_id !== authUser.id) {
      return NextResponse.json(
        { error: "프로필을 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 연관된 운세 기록 삭제
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("fortunes") as any)
      .delete()
      .eq("profile_id", profileId);

    // 프로필 삭제
    const { error: deleteError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any).delete().eq("id", profileId);

    if (deleteError) {
      return NextResponse.json(
        { error: "프로필 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    // 남은 프로필 수 확인하여 profile_completed 업데이트
    const { data: remainingProfiles } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .select("id")
        .eq("user_id", authUser.id);

    if (!remainingProfiles || remainingProfiles.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("users") as any)
        .update({
          profile_completed: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
