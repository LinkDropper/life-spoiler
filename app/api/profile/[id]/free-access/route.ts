import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";
import { getProfileFreeAccessMap } from "@/libs/supabase/profile-free-access";

import type { ProfileRow } from "@/libs/supabase/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 프로필의 무료 접근 권한 조회 API
 *
 * GET /api/profile/[id]/free-access
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: profileId } = await params;
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

    // 프로필이 현재 사용자의 것인지 확인
    const { data: profile, error: profileError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await (supabase.from("profiles") as any)
        .select("id, user_id")
        .eq("id", profileId)
        .single()) as { data: ProfileRow | null; error: Error | null };

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const freeAccessMap = await getProfileFreeAccessMap(profileId);

    return NextResponse.json({
      success: true,
      data: freeAccessMap,
    });
  } catch (error) {
    console.error("Error in GET /api/profile/[id]/free-access:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
