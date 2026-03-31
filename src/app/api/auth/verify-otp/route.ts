import { NextRequest, NextResponse } from "next/server";

import { buildRetailerSessionPayload, logActivityEvent, upsertRetailerProfile } from "@/lib/retailer-server";
import { normalizeRetailerPhone } from "@/lib/retailer";
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
    otp?: string;
    pagePath?: string;
    phone?: string;
  };

  if (!body.phone || !body.otp) {
    return NextResponse.json({ message: "Phone number and OTP are required." }, { status: 400 });
  }

  try {
    const phone = normalizeRetailerPhone(body.phone);
    const cookiesToSet: Array<{ name: string; options?: object; value: string }> = [];
    const supabase = createSupabaseRouteHandlerClient(request, (items) => cookiesToSet.push(...items));

    if (!supabase) {
      return NextResponse.json({ message: "Supabase is not configured." }, { status: 503 });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: body.otp,
      type: "sms",
    });

    if (error || !data.user) {
      return NextResponse.json({ message: error?.message ?? "Could not verify OTP." }, { status: 400 });
    }

    await upsertRetailerProfile(supabase, request, data.user, phone);

    await logActivityEvent({
      eventType: "signup_verified",
      pagePath: body.pagePath ?? null,
      request,
      retailerId: data.user.id,
      supabase,
    });

    const session = await buildRetailerSessionPayload(supabase, data.user);
    const response = NextResponse.json(session);

    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify OTP.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
