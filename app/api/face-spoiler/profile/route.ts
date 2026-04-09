import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

import { createAuthClient } from "@/libs/supabase";

import type { FaceProfileRow } from "@/libs/supabase/types";

const CreateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력해주세요.")
    .max(30, "이름은 30자 이내로 입력해주세요."),
  gender: z.enum(["male", "female"]),
});

/**
 * GET /api/face-spoiler/profile
 *
 * 현재 로그인한 사용자의 관상 프로필 목록을 반환한다.
 */
export async function GET() {
  try {
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

    const { data, error } = await supabase
      .from("face_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching face profiles:", error);
      return NextResponse.json(
        { success: false, error: "프로필을 불러오지 못했습니다." },
        { status: 500 }
      );
    }

    const profiles = (data ?? []) as FaceProfileRow[];

    return NextResponse.json({
      success: true,
      data: { profiles },
    });
  } catch (error) {
    console.error("Error in GET /api/face-spoiler/profile:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/face-spoiler/profile
 *
 * 새로운 관상 프로필을 생성한다.
 */
export async function POST(request: NextRequest) {
  try {
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

    const body: unknown = await request.json().catch(() => null);
    const parseResult = CreateProfileSchema.safeParse(body);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message ?? "잘못된 요청입니다.",
        },
        { status: 400 }
      );
    }

    const { name, gender } = parseResult.data;

    const { data, error } = await supabase
      .from("face_profiles")
      .insert({
        user_id: user.id,
        name,
        gender,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error inserting face profile:", error);
      return NextResponse.json(
        { success: false, error: "프로필을 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { profile: data as FaceProfileRow },
    });
  } catch (error) {
    console.error("Error in POST /api/face-spoiler/profile:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
