import { NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient, isSupabaseEnabled } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true });
  }

  const cookiesToSet: Array<{ name: string; options?: object; value: string }> = [];
  const supabase = createSupabaseRouteHandlerClient(request, (items) => cookiesToSet.push(...items));

  if (!supabase) {
    return NextResponse.json({ ok: true });
  }

  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
