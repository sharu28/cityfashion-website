import type { Metadata } from "next";

import { CatalogShell } from "@/components/catalog-shell";
import { OrderPage } from "@/components/order-page";

export const metadata: Metadata = {
  title: "Your order",
  description: "Check your City Fashion wholesale order and place it online.",
  alternates: { canonical: "/order" },
};

export default function WebsiteOrderPage() {
  return (
    <main className="overflow-hidden pb-16 pt-20">
      <CatalogShell className="max-w-[1200px] px-3 pt-6 sm:px-5 lg:px-7">
        <OrderPage />
      </CatalogShell>
    </main>
  );
}
