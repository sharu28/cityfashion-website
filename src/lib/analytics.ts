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

function trackVercelEvent(name: string, properties: AnalyticsProperties) {
  const vercelName = vercelEventNames[name];

  if (vercelName) {
    track(vercelName, flatProperties(properties));
  }
}

export function trackAnalyticsEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.gtag?.("event", name, {
    ...properties,
    transport_type: "beacon",
  });

  trackVercelEvent(name, properties);
}

export function trackAnalyticsEventBeforeNavigation(
  name: string,
  properties: AnalyticsProperties,
  destination: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  let fallbackId: number | undefined;
  let hasNavigated = false;

  const navigate = () => {
    if (hasNavigated) {
      return;
    }

    hasNavigated = true;

    if (fallbackId !== undefined) {
      window.clearTimeout(fallbackId);
    }

    window.location.assign(destination);
  };

  trackVercelEvent(name, properties);

  if (!window.gtag) {
    navigate();
    return;
  }

  window.gtag("event", name, {
    ...properties,
    event_callback: navigate,
    event_timeout: 1500,
    transport_type: "beacon",
  });

  fallbackId = window.setTimeout(navigate, 1700);
}
