import { NextResponse } from "next/server";

import { sendSignupNotification } from "@/libs/discord";
import { createAuthClient } from "@/libs/supabase";

import type { OAuthProvider, UserInsert } from "@/libs/supabase/types";

export const GET = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const supabase = await createAuthClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const { user } = data;
    const provider = user.app_metadata.provider as OAuthProvider | undefined;

    if (!provider) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const providerId = user.user_metadata.provider_id ?? user.id;
    const email = user.email ?? "";

    const name =
      user.user_metadata.full_name ?? user.user_metadata.name ?? null;

    const loginTime = new Date().toISOString();

    const userData: UserInsert = {
      id: user.id,
      email,
      name,
      avatar_url: user.user_metadata.avatar_url ?? null,
      provider,
      provider_id: String(providerId),
      last_login_at: loginTime,
    };

    // upsert 실행 후 created_at을 비교하여 신규 사용자 판단 (race condition 방지)
    const { data: upsertedUser, error: upsertError } =
      (await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("users") as any)
        .upsert(userData, { onConflict: "id" })
        .select("created_at")
        .single()) as { data: { created_at: string } | null; error: unknown };

    if (upsertError) {
      console.error("User upsert failed:", upsertError);
    } else if (upsertedUser) {
      const createdAt = new Date(upsertedUser.created_at);
      const lastLoginAt = new Date(loginTime);

      // 생성 시각과 마지막 로그인 시각이 5초 이내면 신규 사용자로 판단
      const isNewUser =
        Math.abs(createdAt.getTime() - lastLoginAt.getTime()) < 5000;

      if (isNewUser) {
        sendSignupNotification({
          userId: user.id,
          email,
          name,
          provider,
          signedUpAt: loginTime,
        }).catch((error) => {
          console.error("Discord 회원가입 알림 전송 실패:", error);
        });
      }
    }

    return NextResponse.redirect(`${origin}/home`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
};
