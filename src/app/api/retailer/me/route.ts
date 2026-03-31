import { NextRequest, NextResponse } from "next/server";

import { buildRetailerSessionPayload } from "@/lib/retailer-server";
import { createSupabaseRouteHandlerClient, isSupabaseEnabled } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({
      enabled: false,
      retailer: null,
      shortlist: [],
    });
  }

  const cookiesToSet: Array<{ name: string; options?: object; value: string }> = [];
  const supabase = createSupabaseRouteHandlerClient(request, (items) => cookiesToSet.push(...items));

  if (!supabase) {
    return NextResponse.json({
      enabled: false,
      retailer: null,
      shortlist: [],
    });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  const response = NextResponse.json(await buildRetailerSessionPayload(supabase, user));

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
