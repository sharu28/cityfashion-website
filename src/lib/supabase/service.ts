import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseServiceClient() {
  const env = getSupabaseServiceEnv();
  if (!env) {
    throw new Error("Website order storage is not configured.");
  }

  return createClient<Database>(env.url, env.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
