import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sendSignupNotification } from "@/libs/discord";
import { logger } from "@/libs/logger";
import { createAuthClient } from "@/libs/supabase";
import { OWNER_TOKEN_COOKIE } from "@/libs/universe/constants";
import { claimUniverseByOwnerToken } from "@/libs/universe/service";

import type { OAuthProvider, UserInsert } from "@/libs/supabase/types";

const DEFAULT_REDIRECT_PATH = "/home";
const ALLOWED_REDIRECT_PATHS = ["/home", "/face-spoiler"];

const PATH_BOUNDARY_CHARS = ["/", "?", "#"];

const resolveNextPath = (value: string | null) => {
  if (!value) {
    return DEFAULT_REDIRECT_PATH;
  }
  if (!value.startsWith("/")) {
    return DEFAULT_REDIRECT_PATH;
  }
  const isAllowed = ALLOWED_REDIRECT_PATHS.some((allowed) => {
    if (value === allowed) {
      return true;
    }
    if (!value.startsWith(allowed)) {
      return false;
    }
    const nextChar = value[allowed.length];
    return PATH_BOUNDARY_CHARS.includes(nextChar);
  });
  return isAllowed ? value : DEFAULT_REDIRECT_PATH;
};

export const GET = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = resolveNextPath(searchParams.get("next"));

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
      const ownerToken = (await cookies()).get(OWNER_TOKEN_COOKIE)?.value;

      if (ownerToken) {
        try {
          await claimUniverseByOwnerToken(user.id, ownerToken);
        } catch (error) {
          logger.error(
            "[universe] 계정 귀속 실패",
            error instanceof Error ? error : new Error(String(error)),
            { userId: user.id }
          );
        }
      }

      const createdAt = new Date(upsertedUser.created_at);
      const lastLoginAt = new Date(loginTime);

      // 생성 시각과 마지막 로그인 시각이 5초 이내면 신규 사용자로 판단
      const isNewUser =
        Math.abs(createdAt.getTime() - lastLoginAt.getTime()) < 5000;

      if (isNewUser) {
        const service = nextPath.startsWith("/face-spoiler")
          ? "face-spoiler"
          : "life-spoiler";

        sendSignupNotification({
          userId: user.id,
          email,
          name,
          provider,
          signedUpAt: loginTime,
          service,
        }).catch((error) => {
          console.error("Discord 회원가입 알림 전송 실패:", error);
        });

        const redirectUrl = new URL(`${origin}${nextPath}`);
        redirectUrl.searchParams.set("new", "1");
        return NextResponse.redirect(redirectUrl.toString());
      }
    }

    return NextResponse.redirect(`${origin}${nextPath}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
};
