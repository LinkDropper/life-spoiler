import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

export const createBrowserClient = (): SupabaseClient<Database> => {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  browserClient = createSSRBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
  return browserClient;
};
