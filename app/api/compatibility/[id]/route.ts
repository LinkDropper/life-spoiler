import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const DELETE = async (_request: Request, { params }: RouteParams) => {
  try {
    const { id: pairId } = await params;
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

    const { data: pair, error: pairError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await (supabase.from("compatibility_pairs") as any)
        .select("user_id")
        .eq("id", pairId)
        .single()) as {
        data: { user_id: string } | null;
        error: Error | null;
      };

    if (pairError || !pair) {
      return NextResponse.json(
        { error: "궁합을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (pair.user_id !== authUser.id) {
      return NextResponse.json(
        { error: "궁합을 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error: deleteError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("compatibility_pairs") as any)
        .delete()
        .eq("id", pairId);

    if (deleteError) {
      return NextResponse.json(
        { error: "궁합 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/compatibility/[id] error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
