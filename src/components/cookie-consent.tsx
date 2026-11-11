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
    // A small card in the bottom-left corner: clear of the header, the order bar and the WhatsApp button.
    <div
      className="fixed bottom-[calc(0.75rem+var(--order-bar-h,0px))] left-3 right-[5.25rem] z-[45] border border-[var(--line)] bg-white p-3 text-[var(--ink)] shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:bottom-[calc(1.25rem+var(--order-bar-h,0px))] sm:left-5 sm:right-auto sm:w-[22rem]"
      role="dialog"
      aria-label="Cookie choices"
      aria-live="polite"
    >
      <p className="text-xs leading-5 text-[var(--text-soft)]">
        We use Google Analytics to see which styles buyers like.{" "}
        <Link href="/privacy" className="text-[var(--ink)] underline underline-offset-2">
          Privacy
        </Link>
      </p>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => saveChoice("accepted")}
          className="min-h-10 flex-1 bg-[var(--ink)] px-3 text-xs font-semibold text-white"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={() => saveChoice("declined")}
          className="min-h-10 flex-1 border border-[var(--ink)] px-3 text-xs font-semibold"
        >
          Only necessary
        </button>
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
