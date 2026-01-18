import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

export const POST = async () => {
  try {
    const supabase = await createAuthClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase signOut error:", error);
      return NextResponse.json(
        { error: "로그아웃에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
