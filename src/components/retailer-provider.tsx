"use client";

import Link from "next/link";
import { createContext, startTransition, useContext, useEffect, useState } from "react";

import type { RetailerIntent, RetailerSessionPayload } from "@/lib/retailer";

type RetailerContextValue = {
  authOpen: boolean;
  closeAuth: () => void;
  enabled: boolean;
  errorMessage: string | null;
  isAuthBusy: boolean;
  isLoaded: boolean;
  isSaved: (productSlug: string) => boolean;
  maskedPhone: string;
  openAuth: (intent?: RetailerIntent) => void;
  otpPhone: string;
  retailer: RetailerSessionPayload["retailer"];
  sendOtp: (phone: string) => Promise<boolean>;
  shortlist: RetailerSessionPayload["shortlist"];
  signOut: () => Promise<void>;
  startOrder: (productSlug?: string) => Promise<void>;
  toggleShortlist: (productSlug: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
};

const RetailerContext = createContext<RetailerContextValue | null>(null);

const emptySession: RetailerSessionPayload = {
  enabled: true,
  retailer: null,
  shortlist: [],
};

function intentCopy(intent: RetailerIntent | null) {
  if (intent?.type === "save") {
    return {
      body: "Sign up with your phone to save styles and come back later.",
      title: "Save your shortlist",
    };
  }

  if (intent?.type === "order") {
    return {
      body: "Sign up with your phone before starting the WhatsApp order flow.",
      title: "Retailer login",
    };
  }

  return {
    body: "Use your phone number to save styles and order faster on WhatsApp.",
    title: "Retailer login",
  };
}

export function RetailerProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<RetailerSessionPayload>(emptySession);
  const [isLoaded, setIsLoaded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [intent, setIntent] = useState<RetailerIntent | null>(null);
  const [otpPhone, setOtpPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpStep, setOtpStep] = useState<"otp" | "phone">("phone");
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refreshSession() {
    const response = await fetch("/api/retailer/me", {
      cache: "no-store",
    });

    const payload = (await response.json()) as RetailerSessionPayload | { message?: string };

    if (!response.ok) {
      throw new Error("Could not refresh retailer session.");
    }

    setSession(payload as RetailerSessionPayload);
    setIsLoaded(true);
  }

  useEffect(() => {
    void refreshSession().catch(() => {
      setIsLoaded(true);
    });
  }, []);

  async function performPendingIntent(nextSession: RetailerSessionPayload) {
    if (!intent) {
      return;
    }

    if (intent.type === "save" && intent.productSlug) {
      await runShortlistToggle(intent.productSlug, nextSession);
      return;
    }

    if (intent.type === "order") {
      await runOrder(intent.productSlug, nextSession);
    }
  }

  function closeAuth() {
    setAuthOpen(false);
    setOtpStep("phone");
    setErrorMessage(null);
  }

  function openAuth(nextIntent: RetailerIntent = { type: "order" }) {
    setIntent(nextIntent);
    setAuthOpen(true);
    setOtpStep("phone");
    setErrorMessage(null);
  }

  async function sendOtp(phone: string) {
    setIsAuthBusy(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/send-otp", {
        body: JSON.stringify({
          pagePath: window.location.pathname,
          phone,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as { message?: string; phone?: string };

      if (!response.ok || !payload.phone) {
        throw new Error(payload.message ?? "Could not send OTP.");
      }

      setOtpPhone(payload.phone);
      setMaskedPhone(payload.phone);
      setOtpStep("otp");
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not send OTP.");
      return false;
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function verifyOtp(otp: string) {
    setIsAuthBusy(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        body: JSON.stringify({
          otp,
          pagePath: window.location.pathname,
          phone: otpPhone,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as RetailerSessionPayload | { message?: string };

      if (!response.ok) {
        throw new Error("message" in payload ? payload.message ?? "Could not verify OTP." : "Could not verify OTP.");
      }

      const nextSession = payload as RetailerSessionPayload;
      setSession(nextSession);
      closeAuth();
      await performPendingIntent(nextSession);
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not verify OTP.");
      return false;
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function runShortlistToggle(productSlug: string, sessionOverride?: RetailerSessionPayload) {
    const activeSession = sessionOverride ?? session;

    if (!activeSession.enabled) {
      openAuth({ productSlug, type: "save" });
      return;
    }

    if (!activeSession.retailer) {
      openAuth({ productSlug, type: "save" });
      return;
    }

    const response = await fetch("/api/retailer/shortlist", {
      body: JSON.stringify({
        pagePath: window.location.pathname,
        productSlug,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = (await response.json()) as RetailerSessionPayload | { message?: string };

    if (!response.ok) {
      throw new Error("message" in payload ? payload.message ?? "Could not update shortlist." : "Could not update shortlist.");
    }

    startTransition(() => {
      setSession(payload as RetailerSessionPayload);
    });
  }

  async function toggleShortlist(productSlug: string) {
    try {
      setErrorMessage(null);
      await runShortlistToggle(productSlug);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update shortlist.");
      setAuthOpen(true);
    }
  }

  async function runOrder(productSlug?: string, sessionOverride?: RetailerSessionPayload) {
    const activeSession = sessionOverride ?? session;

    if (!activeSession.enabled) {
      openAuth({ productSlug, type: "order" });
      return;
    }

    if (!activeSession.retailer) {
      openAuth({ productSlug, type: "order" });
      return;
    }

    const response = await fetch("/api/retailer/whatsapp-intent", {
      body: JSON.stringify({
        pagePath: window.location.pathname,
        productSlug,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = (await response.json()) as { message?: string; url?: string };

    if (!response.ok || !payload.url) {
      throw new Error(payload.message ?? "Could not start WhatsApp order.");
    }

    window.location.href = payload.url;
  }

  async function startOrder(productSlug?: string) {
    try {
      setErrorMessage(null);
      await runOrder(productSlug);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not start WhatsApp order.");
      setAuthOpen(true);
    }
  }

  async function signOut() {
    await fetch("/api/auth/sign-out", {
      method: "POST",
    });

    setSession({
      enabled: session.enabled,
      retailer: null,
      shortlist: [],
    });
  }

  const value: RetailerContextValue = {
    authOpen,
    closeAuth,
    enabled: session.enabled,
    errorMessage,
    isAuthBusy,
    isLoaded,
    isSaved: (productSlug) => session.shortlist.some((item) => item.slug === productSlug),
    maskedPhone,
    openAuth,
    otpPhone,
    retailer: session.retailer,
    sendOtp,
    shortlist: session.shortlist,
    signOut,
    startOrder,
    toggleShortlist,
    verifyOtp,
  };

  const copy = intentCopy(intent);

  return (
    <RetailerContext.Provider value={value}>
      {children}
      {authOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[rgba(24,17,14,0.45)] p-4 sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-[rgba(76,54,34,0.12)] bg-[var(--panel)] shadow-[0_28px_80px_rgba(37,25,20,0.22)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--text-soft)]">Retailer access</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                    {copy.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{copy.body}</p>
                </div>
                <button
                  type="button"
                  onClick={closeAuth}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sand)] text-xl text-[var(--text-strong)]"
                  aria-label="Close retailer login"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              {!session.enabled ? (
                <div className="rounded-[1.5rem] bg-[var(--sand)] p-4 text-sm leading-6 text-[var(--text-soft)]">
                  Supabase keys are not added yet. Add them in `.env.local` to turn on phone login.
                </div>
              ) : otpStep === "phone" ? (
                <RetailerPhoneForm />
              ) : (
                <RetailerOtpForm />
              )}

              {errorMessage ? (
                <div className="rounded-[1.5rem] border border-[rgba(177,89,76,0.16)] bg-[rgba(255,236,230,0.9)] px-4 py-3 text-sm text-[rgba(122,59,44,0.94)]">
                  {errorMessage}
                </div>
              ) : null}

              <div className="rounded-[1.5rem] bg-[rgba(243,215,186,0.46)] px-4 py-4 text-sm leading-6 text-[var(--text-soft)]">
                <p className="font-semibold text-[var(--text-strong)]">Why we ask for phone login</p>
                <p className="mt-2">Retailers can save styles, stay logged in, and start WhatsApp orders faster later.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </RetailerContext.Provider>
  );
}

function RetailerPhoneForm() {
  const { isAuthBusy, sendOtp } = useRetailer();
  const [phone, setPhone] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await sendOtp(phone);
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--text-strong)]">Mobile number</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="074 221 6040"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-base text-[var(--text-strong)] outline-none transition focus:border-[rgba(185,120,55,0.42)]"
        />
      </label>
      <button
        type="submit"
        disabled={isAuthBusy}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--text-strong)] px-6 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isAuthBusy ? "Sending code..." : "Send OTP"}
      </button>
      <p className="text-xs leading-5 text-[var(--text-soft)]">Sri Lanka mobile numbers only. We will send a one-time code by SMS.</p>
    </form>
  );
}

function RetailerOtpForm() {
  const { isAuthBusy, maskedPhone, otpPhone, verifyOtp } = useRetailer();
  const [otp, setOtp] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await verifyOtp(otp);
      }}
    >
      <div className="rounded-[1.5rem] bg-[var(--sand)] px-4 py-4 text-sm leading-6 text-[var(--text-soft)]">
        Code sent to <span className="font-semibold text-[var(--text-strong)]">{maskedPhone || otpPhone}</span>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--text-strong)]">OTP code</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-center text-2xl tracking-[0.4em] text-[var(--text-strong)] outline-none transition focus:border-[rgba(185,120,55,0.42)]"
        />
      </label>
      <button
        type="submit"
        disabled={isAuthBusy}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--whatsapp)] px-6 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isAuthBusy ? "Checking code..." : "Verify and continue"}
      </button>
    </form>
  );
}

export function useRetailer() {
  const context = useContext(RetailerContext);

  if (!context) {
    throw new Error("useRetailer must be used inside RetailerProvider.");
  }

  return context;
}

export function RetailerStatusCard() {
  const { isLoaded, retailer, shortlist } = useRetailer();

  if (!isLoaded) {
    return (
      <div className="rounded-[1.7rem] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--text-soft)]">
        Checking retailer access...
      </div>
    );
  }

  if (!retailer) {
    return (
      <div className="rounded-[1.7rem] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--text-soft)]">
        Sign up with phone OTP to save styles and order faster.
      </div>
    );
  }

  return (
    <div className="rounded-[1.7rem] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--text-soft)]">
      Logged in with <span className="font-semibold text-[var(--text-strong)]">{retailer.phone}</span>. Saved styles:{" "}
      <span className="font-semibold text-[var(--text-strong)]">{shortlist.length}</span>.
    </div>
  );
}

export function RetailerShortlistInlineLink() {
  const { shortlist } = useRetailer();

  return (
    <Link href="/shortlist" className="inline-flex items-center gap-2 rounded-full bg-[var(--sand)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)]">
      Shortlist
      <span className="rounded-full bg-white px-2 py-0.5 text-xs">{shortlist.length}</span>
    </Link>
  );
}
