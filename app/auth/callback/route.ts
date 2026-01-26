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

    const userData: UserInsert = {
      id: user.id,
      email,
      name,
      avatar_url: user.user_metadata.avatar_url ?? null,
      provider,
      provider_id: String(providerId),
      last_login_at: new Date().toISOString(),
    };

    // 신규 사용자인지 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser } = (await (supabase.from("users") as any)
      .select("id")
      .eq("id", user.id)
      .single()) as { data: { id: string } | null };

    const isNewUser = !existingUser;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("users") as any).upsert(userData, {
      onConflict: "id",
    });

    // 신규 회원가입인 경우 Discord 알림 전송
    if (isNewUser) {
      sendSignupNotification({
        userId: user.id,
        email,
        name,
        provider,
        signedUpAt: new Date().toISOString(),
      }).catch((error) => {
        console.error("Discord 회원가입 알림 전송 실패:", error);
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = (await (supabase.from("profiles") as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)) as { count: number | null };

    const hasProfile = (count ?? 0) > 0;
    const redirectPath = hasProfile ? "/profiles" : "/profile/setup";

    return NextResponse.redirect(`${origin}${redirectPath}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
};
