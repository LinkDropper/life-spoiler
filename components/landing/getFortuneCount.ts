import { createClient } from "@supabase/supabase-js";

import { env } from "@/env";
import type { Database } from "@/libs/supabase/types";

export const getFortuneCount = async (): Promise<number | null> => {
  try {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return null;
    }

    const supabase = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const [fortuneRes, compatibilityRes] = await Promise.all([
      supabase.from("fortunes").select("*", { count: "exact", head: true }),
      supabase
        .from("compatibility_pairs")
        .select("*", { count: "exact", head: true }),
    ]);

    if (fortuneRes.error || compatibilityRes.error) {
      return null;
    }

    return (fortuneRes.count ?? 0) + (compatibilityRes.count ?? 0);
  } catch {
    return null;
  }
};
