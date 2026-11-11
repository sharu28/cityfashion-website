import type { Metadata } from "next";

import { OrderPage } from "@/components/order-page";

export const metadata: Metadata = {
  title: "Your order",
  description: "Check your City Fashion wholesale order and place it online.",
  alternates: { canonical: "/order" },
};

export default function WebsiteOrderPage() {
  return (
    <main className="pb-16">
      <OrderPage />
    </main>
  );
}
