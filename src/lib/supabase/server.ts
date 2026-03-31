import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSupabaseEnv, isSupabaseEnabled } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

type ResponseCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function createSupabaseServerComponentClient() {
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot always persist cookies during render.
        }
      },
    },
  });
}

export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  applyCookies: (cookiesToSet: ResponseCookie[]) => void,
) {
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        applyCookies(cookiesToSet);
      },
    },
  });
}

export function createSupabaseProxyClient(request: NextRequest, response: NextResponse) {
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

export { isSupabaseEnabled };
