import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

import type { OAuthProvider, UserInsert } from "@/libs/supabase/types";

export const GET = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createAuthClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { user } = data;
  const provider = (user.app_metadata.provider ?? "kakao") as OAuthProvider;
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

  await (supabase.from("users") as any).upsert(userData, { onConflict: "id" });

  return NextResponse.redirect(`${origin}${next}`);
};
