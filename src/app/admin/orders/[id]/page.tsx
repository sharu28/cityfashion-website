import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminOrderDetailEditor, AdminSignOutButton } from "@/components/admin-order-detail";
import { CatalogShell } from "@/components/catalog-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrdersDb } from "@/lib/cloudflare-bindings";
import { AdminOrderNotFoundError, getOrder } from "@/lib/order-admin";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  let order;
  try {
    order = await getOrder(getOrdersDb(), id);
  } catch (error) {
    if (error instanceof AdminOrderNotFoundError) notFound();
    throw error;
  }

  return (
    <main className="pb-16 pt-24">
      <CatalogShell className="max-w-[1300px] px-3 pt-5 sm:px-5 lg:px-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div>
            <Link href="/admin/orders" className="text-sm font-black text-[var(--text-soft)] underline underline-offset-4">All orders</Link>
            <h1 className="catalog-heading mt-3 text-5xl font-black leading-none text-[var(--text-strong)] sm:text-7xl">{order.reference}</h1>
          </div>
          <AdminSignOutButton />
        </div>
        <AdminOrderDetailEditor initialOrder={order} />
      </CatalogShell>
    </main>
  );
}
