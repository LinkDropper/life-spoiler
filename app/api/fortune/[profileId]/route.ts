import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@/libs/supabase/client";
import { getFortune } from "@/libs/supabase/fortune";
import type { FortuneType } from "@/libs/supabase/fortune";
import type { Database, ProfileRow } from "@/libs/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseDB = SupabaseClient<Database>;

interface RouteContext {
  params: Promise<{ profileId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { profileId } = await context.params;
    const { searchParams } = new URL(request.url);

    const fortuneType = (searchParams.get("type") || "lifetime") as FortuneType;
    const year =
      fortuneType === "yearly"
        ? parseInt(
            searchParams.get("year") || String(new Date().getFullYear()),
            10
          )
        : 0;

    const supabase = createServerClient() as SupabaseDB;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "name, birth_date, birth_time, birth_time_unknown, calendar_type, gender"
      )
      .eq("id", profileId)
      .single<
        Pick<
          ProfileRow,
          | "name"
          | "birth_date"
          | "birth_time"
          | "birth_time_unknown"
          | "calendar_type"
          | "gender"
        >
      >();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const fortune = await getFortune(profileId, fortuneType, year);

    if (!fortune) {
      return NextResponse.json(
        { success: false, error: "운세 데이터를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile,
        fortune: fortune.result,
        year: fortuneType === "yearly" ? year : undefined,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/fortune/[profileId]:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
