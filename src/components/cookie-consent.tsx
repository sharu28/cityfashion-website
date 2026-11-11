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
    // Sits under the sticky header so it never covers the order bar or the WhatsApp button.
    <div className="fixed inset-x-0 top-14 z-[45] border-b border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] sm:px-6 lg:px-10" role="dialog" aria-label="Cookie choices" aria-live="polite">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs leading-5 text-[var(--text-soft)]">
          <span className="font-semibold text-[var(--ink)]">Your privacy choices. </span>
          We use Google Analytics to understand which styles and campaigns help retailers reach a WhatsApp order. You can allow measurement or use only necessary site features.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => saveChoice("accepted")}
            className="min-h-10 bg-[var(--ink)] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-white"
          >
            Allow measurement
          </button>
          <button
            type="button"
            onClick={() => saveChoice("declined")}
            className="min-h-10 border border-[var(--ink)] px-4 text-xs font-semibold uppercase tracking-[0.08em]"
          >
            Only necessary
          </button>
          <Link href="/privacy" className="px-1 text-xs underline underline-offset-4">
            Privacy details
          </Link>
        </div>
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
      className="text-left hover:text-[var(--ink)]"
    >
      Cookie settings
    </button>
  );
}
