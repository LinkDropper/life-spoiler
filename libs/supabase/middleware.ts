import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export interface SessionCookie {
  name: string;
  value: string;
  options: CookieOptions;
}

const AUTH_COOKIE_PREFIX = "sb-";

const hasAuthCookie = (request: NextRequest) =>
  request.cookies
    .getAll()
    .some(({ name }) => name.startsWith(AUTH_COOKIE_PREFIX));

/**
 * 만료된 Supabase 세션을 middleware에서 먼저 갱신한다.
 *
 * Server Component는 쿠키를 쓸 수 없어서, 거기서 토큰이 회전되면 새 refresh
 * token이 버려지고 브라우저에는 폐기된 토큰만 남는다(`refresh_token_not_found`).
 * 갱신을 여기로 모으면 새 토큰이 요청 쿠키(이번 렌더링)와 반환값(응답 쿠키)
 * 양쪽에 반영된다. 호출자는 반환된 쿠키를 응답에 그대로 실어야 한다.
 */
export const refreshSupabaseSession = async (
  request: NextRequest
): Promise<SessionCookie[]> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !hasAuthCookie(request)) {
    return [];
  }

  let sessionCookies: SessionCookie[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        sessionCookies = cookiesToSet;
      },
    },
  });

  // getClaims는 액세스 토큰이 만료됐을 때만 갱신 요청을 보낸다.
  await supabase.auth.getClaims();

  return sessionCookies;
};
