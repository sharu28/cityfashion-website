import { NextRequest, NextResponse } from "next/server";

import { getProduct } from "@/lib/catalog";
import { buildRetailerSessionPayload, getOrderLinkFromSession, logActivityEvent } from "@/lib/retailer-server";
import { createSupabaseRouteHandlerClient, isSupabaseEnabled } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ message: "Retailer sign up is not configured yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    pagePath?: string;
    productSlug?: string;
  };

  const cookiesToSet: Array<{ name: string; options?: object; value: string }> = [];
  const supabase = createSupabaseRouteHandlerClient(request, (items) => cookiesToSet.push(...items));

  if (!supabase) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Retailer login is required." }, { status: 401 });
  }

  const session = await buildRetailerSessionPayload(supabase, user);
  const product = body.productSlug ? getProduct(body.productSlug) : null;

  await logActivityEvent({
    eventType: "whatsapp_intent",
    metadata: {
      shortlistCount: session.shortlist.length,
    },
    pagePath: body.pagePath ?? null,
    productId: product?.id ?? null,
    productSlug: product?.slug ?? null,
    request,
    retailerId: user.id,
    supabase,
  });

  const response = NextResponse.json({
    ok: true,
    url: getOrderLinkFromSession(session, body.productSlug ?? null),
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
