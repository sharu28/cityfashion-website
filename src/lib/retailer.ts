import { whatsappNumber } from "@/lib/site";
import type { Database } from "@/lib/supabase/types";

export type SourceChannel = "direct" | "organic" | "outreach" | "meta" | "influencer" | "referral";

export type ActivityEventType =
  | "signup_started"
  | "signup_verified"
  | "product_saved"
  | "product_unsaved"
  | "whatsapp_intent";

export type RetailerProfileRow = Database["public"]["Tables"]["retailer_profiles"]["Row"];
export type SavedProductRow = Database["public"]["Tables"]["saved_products"]["Row"];

export type ShortlistItem = {
  category: string;
  coverImage: string | null;
  id: string;
  moq: string;
  slug: string;
  startingPrice: string;
  title: string;
};

export type RetailerSessionPayload = {
  enabled: boolean;
  retailer: {
    firstSeenAt: string;
    id: string;
    lastActiveAt: string;
    phone: string;
    retailerStatus: string;
    sourceChannel: string | null;
    verificationStatus: string;
  } | null;
  shortlist: ShortlistItem[];
};

export type RetailerIntent =
  | {
      productSlug?: string;
      type: "save";
    }
  | {
      productSlug?: string;
      type: "order";
    };

export const sourceCookieName = "cf_source";
export const landingCookieName = "cf_landing";

export function normalizeRetailerPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("94") && digits.length === 11 && digits[2] === "7") {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 10 && digits[1] === "7") {
    return `+94${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith("7")) {
    return `+94${digits}`;
  }

  throw new Error("Use a Sri Lanka mobile number like 0742216040.");
}

export function maskRetailerPhone(phone: string) {
  return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
}

export function getSourceFromCookie(rawValue: string | undefined | null): SourceChannel {
  switch (rawValue) {
    case "organic":
    case "outreach":
    case "meta":
    case "influencer":
    case "referral":
      return rawValue;
    default:
      return "direct";
  }
}

export function buildRetailerWhatsAppLink(args: {
  currentProduct?: ShortlistItem | null;
  shortlist: ShortlistItem[];
}) {
  const shortlist = args.shortlist;
  const products = new Map<string, ShortlistItem>();

  shortlist.forEach((item) => products.set(item.slug, item));

  if (args.currentProduct) {
    products.set(args.currentProduct.slug, args.currentProduct);
  }

  const lines = [
    "Hello City Fashion, I am a retailer.",
    "Please send order details for these styles:",
    ...Array.from(products.values()).map((item) => `- ${item.id} | ${item.title} | MOQ ${item.moq}`),
    "Please share colors, prices, fabric, and sizes.",
  ];

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}
