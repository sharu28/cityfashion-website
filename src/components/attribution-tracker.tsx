"use client";

import { useEffect } from "react";

import { landingCookieName, sourceCookieName } from "@/lib/retailer";

const maxAge = 60 * 60 * 24 * 30;

function detectChannel() {
  const params = new URLSearchParams(window.location.search);
  const explicitSource =
    params.get("source") ??
    params.get("channel") ??
    params.get("utm_source") ??
    params.get("ref");

  if (explicitSource) {
    const value = explicitSource.toLowerCase();

    if (value.includes("meta") || value.includes("facebook") || value.includes("instagram")) {
      return "meta";
    }

    if (value.includes("influencer")) {
      return "influencer";
    }

    if (value.includes("outreach") || value.includes("sms") || value.includes("maps")) {
      return "outreach";
    }

    if (value.includes("ref")) {
      return "referral";
    }

    if (value.includes("google") || value.includes("search") || value.includes("seo")) {
      return "organic";
    }
  }

  const referrer = document.referrer.toLowerCase();

  if (referrer.includes("google.")) {
    return "organic";
  }

  if (referrer.includes("facebook.") || referrer.includes("instagram.")) {
    return "meta";
  }

  if (referrer) {
    return "referral";
  }

  return "direct";
}

export function AttributionTracker() {
  useEffect(() => {
    if (!document.cookie.includes(`${sourceCookieName}=`)) {
      document.cookie = `${sourceCookieName}=${detectChannel()}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
    }

    if (!document.cookie.includes(`${landingCookieName}=`)) {
      const landing = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      document.cookie = `${landingCookieName}=${landing}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
    }
  }, []);

  return null;
}
