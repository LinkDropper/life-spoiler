import { NextResponse } from "next/server";

import { createAuthClient, createServerClient } from "@/libs/supabase";

export const DELETE = async () => {
  try {
    const authClient = await createAuthClient();

    // 현재 로그인한 사용자 확인
    const {
      data: { user: authUser },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    // Service Role 클라이언트로 데이터 삭제
    const serverClient = createServerClient();

    // 1. 사용자의 프로필 ID 목록 조회
    const { data: profiles, error: profilesError } = await serverClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .returns<{ id: string }[]>();

    if (profilesError) {
      console.error("프로필 조회 실패:", profilesError);
      return NextResponse.json(
        { error: "회원탈퇴 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 2. 프로필에 연결된 모든 운세 데이터 삭제
    if (profiles && profiles.length > 0) {
      const profileIds = profiles.map((profile) => profile.id);

      const { error: fortunesError } = await serverClient
        .from("fortunes")
        .delete()
        .in("profile_id", profileIds);

      if (fortunesError) {
        console.error("운세 데이터 삭제 실패:", fortunesError);
        return NextResponse.json(
          { error: "회원탈퇴 처리 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }

    // 3. 사용자의 모든 프로필 삭제
    const { error: deleteProfilesError } = await serverClient
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (deleteProfilesError) {
      console.error("프로필 삭제 실패:", deleteProfilesError);
      return NextResponse.json(
        { error: "회원탈퇴 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 4. users 테이블에서 사용자 삭제
    const { error: deleteUserError } = await serverClient
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteUserError) {
      console.error("사용자 삭제 실패:", deleteUserError);
      return NextResponse.json(
        { error: "회원탈퇴 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 5. Auth 사용자 삭제 (Service Role 필요)
    const { error: deleteAuthError } =
      await serverClient.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("Auth 사용자 삭제 실패:", deleteAuthError);
      // 이미 DB에서 삭제되었으므로 에러를 반환하지 않고 진행
    }

    // 6. 세션 로그아웃
    await authClient.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("회원탈퇴 처리 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
