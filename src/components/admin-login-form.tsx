"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-7 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsBusy(true);
        setMessage(null);
        try {
          const response = await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const result = (await response.json()) as { message?: string };
          if (!response.ok) {
            setMessage(result.message || "Could not sign in");
            return;
          }

          router.replace("/admin/orders");
          router.refresh();
        } catch {
          setMessage("Could not sign in");
        } finally {
          setIsBusy(false);
        }
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm font-black text-[var(--text-strong)]">Email</span>
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-12 w-full border border-[var(--line)] bg-white px-4 text-base outline-none focus:border-[var(--text-strong)]"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-black text-[var(--text-strong)]">Password</span>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-12 w-full border border-[var(--line)] bg-white px-4 text-base outline-none focus:border-[var(--text-strong)]"
        />
      </label>
      {message ? <p role="alert" className="text-sm text-[var(--danger)]">{message}</p> : null}
      <button
        type="submit"
        disabled={isBusy}
        className="inline-flex min-h-12 w-full items-center justify-center bg-[var(--text-strong)] px-6 text-sm font-black text-white disabled:opacity-60"
      >
        {isBusy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
