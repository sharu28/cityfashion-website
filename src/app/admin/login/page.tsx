import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { CatalogShell } from "@/components/catalog-shell";
import { getAdminAccess } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Order admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const access = await getAdminAccess();
  if (access.status === "allowed") redirect("/admin/orders");

  return (
    <main className="min-h-[70vh] pb-16 pt-28">
      <CatalogShell className="max-w-lg px-4">
        <section className="border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
            Private dashboard
          </p>
          <h1 className="catalog-heading mt-3 text-5xl font-black leading-none text-[var(--text-strong)]">
            Order admin
          </h1>
          <AdminLoginForm />
        </section>
      </CatalogShell>
    </main>
  );
}
