import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

import type { UserRow } from "@/libs/supabase/types";
import type { User } from "@/libs/stores/user";

const mapDbUserToUser = (dbUser: UserRow): User => ({
  id: dbUser.id,
  email: dbUser.email,
  name: dbUser.name,
  avatarUrl: dbUser.avatar_url,
  provider: dbUser.provider as User["provider"],
  providerId: dbUser.provider_id,
  createdAt: dbUser.created_at,
  updatedAt: dbUser.updated_at,
  lastLoginAt: dbUser.last_login_at,
});

export const GET = async () => {
  try {
    const supabase = await createAuthClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (dbError || !dbUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: mapDbUserToUser(dbUser),
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
