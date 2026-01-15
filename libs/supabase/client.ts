import { createClient } from "@supabase/supabase-js";

import { env } from "@/env";

import type { Database } from "./types";

// ============================================================
// Supabase 클라이언트
// ============================================================

/**
 * 클라이언트 사이드 Supabase 클라이언트 (anon key 사용)
 */
export const createBrowserClient = () => {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * 서버 사이드 Supabase 클라이언트 (service role key 사용)
 * - RLS를 우회하여 모든 데이터에 접근 가능
 * - 서버에서만 사용해야 함
 */
export const createServerClient = () => {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase 서버 환경 변수가 설정되지 않았습니다.");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
