import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

import type {
  CalendarType,
  Gender,
  ProfileInsert,
  ProfileRow,
  FortuneRow,
  ProfileFreeAccessRow,
} from "@/libs/supabase/types";

export interface ProfileWithFortunes extends ProfileRow {
  fortunes: FortuneRow[];
  profile_free_access: ProfileFreeAccessRow[];
}

export const GET = async () => {
  try {
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

    const { data: profiles, error: profilesError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .select("*, fortunes(*), profile_free_access(*)")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json(
        { error: "프로필 목록을 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ profiles: profiles as ProfileWithFortunes[] });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};

interface ProfileCreateRequest {
  name: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  gender: Gender;
  relationshipStatus: string;
  relationshipStatusCustom?: string;
  occupationStatus: string;
  occupationStatusCustom?: string;
  relationshipToUser?: string;
}

export const POST = async (request: Request) => {
  try {
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

    const body: ProfileCreateRequest = await request.json();

    const profileData: ProfileInsert = {
      user_id: authUser.id,
      name: body.name,
      birth_date: body.birthDate,
      birth_time: body.birthTimeUnknown ? null : body.birthTime || null,
      birth_time_unknown: body.birthTimeUnknown,
      calendar_type: body.calendarType,
      gender: body.gender,
      relationship_status:
        (body.relationshipStatus as ProfileInsert["relationship_status"]) ||
        null,
      relationship_status_custom:
        body.relationshipStatus === "custom"
          ? body.relationshipStatusCustom
          : null,
      occupation_status:
        (body.occupationStatus as ProfileInsert["occupation_status"]) || null,
      occupation_status_custom:
        body.occupationStatus === "custom" ? body.occupationStatusCustom : null,
      relationship_to_user: body.relationshipToUser || null,
    };

    const { data: profile, error: insertError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .insert(profileData)
        .select("id")
        .single();

    if (insertError) {
      return NextResponse.json(
        { error: "프로필 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from("users") as any)
      .update({
        profile_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUser.id);

    if (updateError) {
      return NextResponse.json(
        { error: "프로필 상태 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
