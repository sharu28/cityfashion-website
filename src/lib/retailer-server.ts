import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getProduct } from "@/lib/catalog";
import {
  buildRetailerWhatsAppLink,
  getSourceFromCookie,
  landingCookieName,
  sourceCookieName,
  type ActivityEventType,
  type RetailerSessionPayload,
  type ShortlistItem,
} from "@/lib/retailer";
import type { Database, Json } from "@/lib/supabase/types";

type SupabaseServerClient = SupabaseClient<Database>;

function mapShortlistItem(slug: string): ShortlistItem | null {
  const product = getProduct(slug);

  if (!product) {
    return null;
  }

  return {
    category: product.categoryMeta.name,
    coverImage: product.coverImage,
    id: product.id,
    moq: product.moq,
    slug: product.slug,
    startingPrice: product.startingPrice,
    title: product.title,
  };
}

export async function listShortlistItems(supabase: SupabaseServerClient, retailerId: string) {
  const { data, error } = await supabase
    .from("saved_products")
    .select("product_slug")
    .eq("retailer_id", retailerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((item) => mapShortlistItem(item.product_slug))
    .filter((item): item is ShortlistItem => Boolean(item));
}

export async function buildRetailerSessionPayload(
  supabase: SupabaseServerClient,
  user: User | null,
): Promise<RetailerSessionPayload> {
  if (!user) {
    return {
      enabled: true,
      retailer: null,
      shortlist: [],
    };
  }

  const [{ data: profile, error: profileError }, shortlist] = await Promise.all([
    supabase.from("retailer_profiles").select("*").eq("id", user.id).maybeSingle(),
    listShortlistItems(supabase, user.id),
  ]);

  if (profileError) {
    throw profileError;
  }

  return {
    enabled: true,
    retailer: profile
      ? {
          firstSeenAt: profile.first_seen_at,
          id: profile.id,
          lastActiveAt: profile.last_active_at,
          phone: profile.phone,
          retailerStatus: profile.retailer_status,
          sourceChannel: profile.source_channel,
          verificationStatus: profile.verification_status,
        }
      : {
          firstSeenAt: new Date().toISOString(),
          id: user.id,
          lastActiveAt: new Date().toISOString(),
          phone: user.phone ?? "",
          retailerStatus: "lead",
          sourceChannel: null,
          verificationStatus: user.phone_confirmed_at ? "verified" : "pending",
        },
    shortlist,
  };
}

export async function upsertRetailerProfile(
  supabase: SupabaseServerClient,
  request: NextRequest,
  user: User,
  phone: string,
) {
  const sourceChannel = getSourceFromCookie(request.cookies.get(sourceCookieName)?.value);
  const sourceDetail = request.cookies.get(landingCookieName)?.value ?? null;

  const { error } = await supabase.from("retailer_profiles").upsert(
    {
      id: user.id,
      last_active_at: new Date().toISOString(),
      phone,
      source_channel: sourceChannel,
      source_detail: sourceDetail,
      verification_status: user.phone_confirmed_at ? "verified" : "pending",
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw error;
  }
}

export async function logActivityEvent(args: {
  eventType: ActivityEventType;
  metadata?: Json;
  pagePath?: string | null;
  productId?: string | null;
  productSlug?: string | null;
  request: NextRequest;
  retailerId?: string | null;
  supabase: SupabaseServerClient;
}) {
  const sourceChannel = getSourceFromCookie(args.request.cookies.get(sourceCookieName)?.value);

  const { error } = await args.supabase.from("activity_events").insert({
    event_type: args.eventType,
    metadata: args.metadata ?? null,
    page_path: args.pagePath ?? null,
    product_id: args.productId ?? null,
    product_slug: args.productSlug ?? null,
    retailer_id: args.retailerId ?? null,
    source_channel: sourceChannel,
  });

  if (error) {
    throw error;
  }
}

export function getOrderLinkFromSession(session: RetailerSessionPayload, productSlug?: string | null) {
  const currentProduct = productSlug ? mapShortlistItem(productSlug) : null;

  return buildRetailerWhatsAppLink({
    currentProduct,
    shortlist: session.shortlist,
  });
}
