"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";
import { useEffect, useState } from "react";

const consentKey = "cityfashion_cookie_consent";
const consentChangedEvent = "cityfashion:consent-changed";
const openConsentEvent = "cityfashion:open-cookie-settings";

type ConsentChoice = "accepted" | "declined";

function applyGoogleConsent(choice: ConsentChoice) {
  const state = choice === "accepted" ? "granted" : "denied";

  window.gtag?.("consent", "update", {
    ad_personalization: state,
    ad_storage: state,
    ad_user_data: state,
    analytics_storage: state,
  });
}

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let preference: string | null = null;

    try {
      preference = window.localStorage.getItem(consentKey);
    } catch {
      preference = null;
    }

    const showInitialChoice = window.setTimeout(() => {
      setIsOpen(preference !== "accepted" && preference !== "declined");
    }, 0);

    const openSettings = () => setIsOpen(true);
    window.addEventListener(openConsentEvent, openSettings);

    return () => {
      window.clearTimeout(showInitialChoice);
      window.removeEventListener(openConsentEvent, openSettings);
    };
  }, []);

  function saveChoice(choice: ConsentChoice) {
    try {
      window.localStorage.setItem(consentKey, choice);
    } catch {
      // The consent update still applies for this page when storage is unavailable.
    }

    applyGoogleConsent(choice);
    window.dispatchEvent(new CustomEvent<ConsentChoice>(consentChangedEvent, { detail: choice }));
    setIsOpen(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-2xl border border-white/15 bg-[var(--hero)] p-4 text-white shadow-2xl sm:bottom-5 sm:p-5" role="dialog" aria-label="Cookie choices" aria-live="polite">
      <p className="text-sm font-black uppercase tracking-[0.12em]">Your privacy choices</p>
      <p className="mt-2 text-sm leading-6 text-white/72">
        We use Google Analytics to understand which styles and campaigns help retailers reach a WhatsApp order. You can allow measurement or use only necessary site features.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => saveChoice("accepted")}
          className="bg-[var(--accent)] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white hover:brightness-110"
        >
          Allow measurement
        </button>
        <button
          type="button"
          onClick={() => saveChoice("declined")}
          className="border border-white/24 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white hover:border-white/50"
        >
          Only necessary
        </button>
        <Link href="/privacy" className="px-2 py-2 text-sm font-bold text-white/68 underline underline-offset-4 hover:text-white">
          Privacy details
        </Link>
      </div>
    </div>
  );
}

export function ConsentAwareVercelAnalytics() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    let preference: string | null = null;

    try {
      preference = window.localStorage.getItem(consentKey);
    } catch {
      preference = null;
    }

    const enableFromSavedChoice = window.setTimeout(() => setIsEnabled(preference === "accepted"), 0);
    const updateFromChoice = (event: Event) => {
      setIsEnabled((event as CustomEvent<ConsentChoice>).detail === "accepted");
    };

    window.addEventListener(consentChangedEvent, updateFromChoice);

    return () => {
      window.clearTimeout(enableFromSavedChoice);
      window.removeEventListener(consentChangedEvent, updateFromChoice);
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(openConsentEvent))}
      className="text-left hover:text-white"
    >
      Cookie settings
    </button>
  );
}
