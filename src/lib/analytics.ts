import { track } from "@vercel/analytics";

type AnalyticsValue = boolean | number | string;
type AnalyticsProperties = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const vercelEventNames: Record<string, string> = {
  login: "Retailer Login Completed",
  otp_requested: "OTP Requested",
  shortlist_updated: "Shortlist Updated",
  view_item: "Product Viewed",
  whatsapp_order_started: "WhatsApp Order Started",
};

function flatProperties(properties: AnalyticsProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, AnalyticsValue] =>
      ["boolean", "number", "string"].includes(typeof entry[1]),
    ),
  );
}

export function trackAnalyticsEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.gtag?.("event", name, {
    ...properties,
    transport_type: "beacon",
  });

  const vercelName = vercelEventNames[name];

  if (vercelName) {
    track(vercelName, flatProperties(properties));
  }
}
