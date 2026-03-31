import { NextRequest, NextResponse } from "next/server";

import { normalizeRetailerPhone } from "@/lib/retailer";
import { logActivityEvent } from "@/lib/retailer-server";
import { createSupabaseRouteHandlerClient, isSupabaseEnabled } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json(
      {
        message: "Retailer sign up will work after Supabase keys are added.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    pagePath?: string;
    phone?: string;
  };

  if (!body.phone) {
    return NextResponse.json({ message: "Phone number is required." }, { status: 400 });
  }

  try {
    const phone = normalizeRetailerPhone(body.phone);
    const cookiesToSet: Array<{ name: string; options?: object; value: string }> = [];
    const supabase = createSupabaseRouteHandlerClient(request, (items) => cookiesToSet.push(...items));

    if (!supabase) {
      return NextResponse.json({ message: "Supabase is not configured." }, { status: 503 });
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: "sms",
      },
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    await logActivityEvent({
      eventType: "signup_started",
      pagePath: body.pagePath ?? null,
      request,
      supabase,
    });

    const response = NextResponse.json({
      ok: true,
      phone,
    });

    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send OTP.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
