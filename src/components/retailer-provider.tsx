"use client";

import Link from "next/link";
import { createContext, startTransition, useContext, useEffect, useState } from "react";

import { getProduct } from "@/lib/catalog";
import { trackAnalyticsEvent, trackAnalyticsEventBeforeNavigation } from "@/lib/analytics";
import {
  buildRetailerWhatsAppLink,
  type RetailerIntent,
  type RetailerSessionPayload,
  type ShortlistItem,
} from "@/lib/retailer";

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

const guestShortlistKey = "city-fashion-guest-shortlist";

function mapProductToShortlistItem(productSlug: string): ShortlistItem | null {
  const product = getProduct(productSlug);

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

function readGuestShortlist() {
  try {
    const slugs = JSON.parse(window.localStorage.getItem(guestShortlistKey) ?? "[]") as string[];

    return slugs
      .map(mapProductToShortlistItem)
      .filter((item): item is ShortlistItem => Boolean(item));
  } catch {
    return [];
  }
}

function writeGuestShortlist(shortlist: ShortlistItem[]) {
  window.localStorage.setItem(guestShortlistKey, JSON.stringify(shortlist.map((item) => item.slug)));
}

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

    const nextSession = payload as RetailerSessionPayload;

    setSession(nextSession.enabled ? nextSession : { ...nextSession, shortlist: readGuestShortlist() });
    setIsLoaded(true);
  }

  useEffect(() => {
    void refreshSession().catch(() => {
      setSession({
        enabled: false,
        retailer: null,
        shortlist: readGuestShortlist(),
      });
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
      trackAnalyticsEvent("otp_requested", {
        intent: intent?.type ?? "login",
      });
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
      trackAnalyticsEvent("login", {
        intent: intent?.type ?? "login",
        method: "phone_otp",
      });
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
    const product = mapProductToShortlistItem(productSlug);
    const wasSaved = activeSession.shortlist.some((item) => item.slug === productSlug);

    if (!activeSession.enabled) {
      if (!product) {
        return;
      }

      setSession((currentSession) => {
        const isSaved = currentSession.shortlist.some((item) => item.slug === productSlug);
        const shortlist = isSaved
          ? currentSession.shortlist.filter((item) => item.slug !== productSlug)
          : [product, ...currentSession.shortlist];

        writeGuestShortlist(shortlist);
        return { ...currentSession, shortlist };
      });
      trackAnalyticsEvent("shortlist_updated", {
        action: wasSaved ? "removed" : "saved",
        item_category: product.category,
        item_id: product.id,
        item_name: product.title,
        retailer_status: "guest",
      });
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

    if (product) {
      trackAnalyticsEvent("shortlist_updated", {
        action: wasSaved ? "removed" : "saved",
        item_category: product.category,
        item_id: product.id,
        item_name: product.title,
        retailer_status: "authenticated",
      });
    }
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
    const currentProduct = productSlug ? mapProductToShortlistItem(productSlug) : null;

    if (!activeSession.enabled) {
      trackAnalyticsEventBeforeNavigation(
        "whatsapp_order_started",
        {
          item_category: currentProduct?.category,
          item_id: currentProduct?.id,
          item_name: currentProduct?.title,
          retailer_status: "guest",
          shortlist_size: activeSession.shortlist.length,
        },
        buildRetailerWhatsAppLink({
          currentProduct,
          shortlist: activeSession.shortlist,
        }),
      );
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

    trackAnalyticsEventBeforeNavigation(
      "whatsapp_order_started",
      {
        item_category: currentProduct?.category,
        item_id: currentProduct?.id,
        item_name: currentProduct?.title,
        retailer_status: "authenticated",
        shortlist_size: activeSession.shortlist.length,
      },
      payload.url,
    );
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
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[rgba(24,22,19,0.48)] p-4 sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel)] shadow-[0_28px_80px_rgba(33,31,27,0.22)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Retailer access</p>
                  <h2 className="mt-2 text-3xl font-bold leading-[1.06] tracking-[-0.01em] text-[var(--text-strong)]">
                    {copy.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{copy.body}</p>
                </div>
                <button
                  type="button"
                  onClick={closeAuth}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sand)] text-sm font-bold text-[var(--text-strong)] transition hover:bg-[var(--sand-strong)] active:scale-[0.98]"
                  aria-label="Close retailer login"
                >
                  X
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              {!session.enabled ? (
                <div className="rounded-[1.1rem] bg-[var(--sand)] p-4 text-sm leading-6 text-[var(--text-soft)]">
                  Supabase keys are not added yet. Add them in `.env.local` to turn on phone login.
                </div>
              ) : otpStep === "phone" ? (
                <RetailerPhoneForm />
              ) : (
                <RetailerOtpForm />
              )}

              {errorMessage ? (
                <div className="rounded-[1.1rem] border border-[rgba(157,74,60,0.2)] bg-[rgba(255,236,230,0.9)] px-4 py-3 text-sm text-[var(--danger)]">
                  {errorMessage}
                </div>
              ) : null}

              <div className="rounded-[1.1rem] bg-[var(--accent-soft)] px-4 py-4 text-sm leading-6 text-[var(--text-soft)]">
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
          className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-base text-[var(--text-strong)] outline-none transition focus:border-[var(--whatsapp)]"
        />
      </label>
      <button
        type="submit"
        disabled={isAuthBusy}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--whatsapp)] px-6 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
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
      <div className="rounded-[1rem] bg-[var(--sand)] px-4 py-4 text-sm leading-6 text-[var(--text-soft)]">
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
          className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-center text-2xl tracking-[0.4em] text-[var(--text-strong)] outline-none transition focus:border-[var(--whatsapp)]"
        />
      </label>
      <button
        type="submit"
        disabled={isAuthBusy}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--whatsapp)] px-6 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
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
  const { enabled, isLoaded, retailer, shortlist } = useRetailer();

  if (!isLoaded) {
    return (
      <div className="rounded-[1.1rem] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--text-soft)]">
        Checking retailer access...
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--text-soft)]">
        Saved on this device: <span className="font-semibold text-[var(--text-strong)]">{shortlist.length}</span>. Send the list on WhatsApp when ready.
      </div>
    );
  }

  if (!retailer) {
    return (
      <div className="rounded-[1.1rem] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--text-soft)]">
        Sign up with phone OTP to save styles and order faster.
      </div>
    );
  }

  return (
    <div className="rounded-[1.1rem] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--text-soft)]">
      Logged in with <span className="font-semibold text-[var(--text-strong)]">{retailer.phone}</span>. Saved styles:{" "}
      <span className="font-semibold text-[var(--text-strong)]">{shortlist.length}</span>.
    </div>
  );
}

export function RetailerShortlistInlineLink() {
  const { shortlist } = useRetailer();

  return (
    <Link href="/shortlist" className="inline-flex min-h-11 items-center gap-2 border border-white/18 px-4 py-2 text-[0.78rem] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[var(--text-strong)] active:scale-[0.98]">
      Shortlist
      <span className="bg-white px-2 py-0.5 text-xs text-[var(--text-strong)]">{shortlist.length}</span>
    </Link>
  );
}
