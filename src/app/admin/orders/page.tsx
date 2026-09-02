import type { Metadata } from "next";
import Link from "next/link";

import { AdminSignOutButton } from "@/components/admin-order-detail";
import { CatalogShell } from "@/components/catalog-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/order-admin";
import { formatLkr } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Website orders",
  robots: { index: false, follow: false },
};

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await listOrders();

  return (
    <main className="pb-16 pt-24">
      <CatalogShell className="max-w-[1400px] px-3 pt-5 sm:px-5 lg:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">Private dashboard</p>
            <h1 className="catalog-heading mt-2 text-5xl font-black leading-none text-[var(--text-strong)] sm:text-7xl">Website orders</h1>
          </div>
          <AdminSignOutButton />
        </div>

        {orders.length === 0 ? (
          <p className="py-12 text-sm text-[var(--text-soft)]">No website orders yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto border border-[var(--line)] bg-[var(--panel)]">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-[var(--sand)] text-xs uppercase tracking-[0.1em] text-[var(--text-soft)]">
                <tr>
                  {['Reference', 'Date', 'Customer', 'WhatsApp', 'Styles', 'Product total', 'Status'].map((label) => (
                    <th key={label} className="border-b border-[var(--line)] p-3 font-black">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="p-3"><Link href={`/admin/orders/${order.id}`} className="font-black underline underline-offset-4">{order.reference}</Link></td>
                    <td className="p-3 text-[var(--text-soft)]">{formatOrderDate(order.created_at)}</td>
                    <td className="p-3 font-black">{order.customer_name}</td>
                    <td className="p-3"><a href={`tel:${order.whatsapp_phone}`} className="underline underline-offset-4">{order.whatsapp_phone}</a></td>
                    <td className="p-3">{order.styleCount}</td>
                    <td className="p-3 font-black">{formatLkr(order.product_total_lkr)}</td>
                    <td className="p-3 capitalize">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CatalogShell>
    </main>
  );
}
