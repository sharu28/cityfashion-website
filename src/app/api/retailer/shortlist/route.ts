import { NextRequest, NextResponse } from "next/server";

import { getProduct } from "@/lib/catalog";
import { buildRetailerSessionPayload, logActivityEvent } from "@/lib/retailer-server";
import { createSupabaseRouteHandlerClient, isSupabaseEnabled } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ message: "Retailer sign up is not configured yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "remove" | "save" | "toggle";
    pagePath?: string;
    productSlug?: string;
  };

  if (!body.productSlug) {
    return NextResponse.json({ message: "Product is required." }, { status: 400 });
  }

  const product = getProduct(body.productSlug);

  if (!product) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 });
  }

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

  const { data: existing, error: existingError } = await supabase
    .from("saved_products")
    .select("id")
    .eq("retailer_id", user.id)
    .eq("product_slug", product.slug)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ message: existingError.message }, { status: 400 });
  }

  const shouldRemove = body.action === "remove" || (body.action !== "save" && Boolean(existing));

  if (shouldRemove) {
    const { error } = await supabase
      .from("saved_products")
      .delete()
      .eq("retailer_id", user.id)
      .eq("product_slug", product.slug);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
  } else {
    const { error } = await supabase.from("saved_products").upsert(
      {
        product_id: product.id,
        product_slug: product.slug,
        retailer_id: user.id,
      },
      {
        onConflict: "retailer_id,product_slug",
      },
    );

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
  }

  await logActivityEvent({
    eventType: shouldRemove ? "product_unsaved" : "product_saved",
    pagePath: body.pagePath ?? null,
    productId: product.id,
    productSlug: product.slug,
    request,
    retailerId: user.id,
    supabase,
  });

  const response = NextResponse.json(await buildRetailerSessionPayload(supabase, user));

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
