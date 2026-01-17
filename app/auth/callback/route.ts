import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

import type { OAuthProvider, UserInsert } from "@/libs/supabase/types";

export const GET = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profiles";

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

    const userData: UserInsert = {
      id: user.id,
      email,
      name: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
      avatar_url: user.user_metadata.avatar_url ?? null,
      provider,
      provider_id: String(providerId),
      last_login_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbUser } = (await (supabase.from("users") as any)
      .upsert(userData, { onConflict: "id" })
      .select("profile_completed")
      .single()) as { data: { profile_completed: boolean } | null };

    const redirectPath = dbUser?.profile_completed ? next : "/profile/setup";

    return NextResponse.redirect(`${origin}${redirectPath}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
};
