type AnalyticsProperties = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
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
