"use client";

import { useMemo, useState } from "react";

import { formatLkr } from "@/lib/catalog";
import {
  type AdminOrderDetail,
  buildPaymentWhatsAppLink,
  calculateFinalTotal,
  canTransitionOrder,
  orderStatuses,
  type OrderStatus,
} from "@/lib/order-admin-shared";

export function AdminSignOutButton() {
  // Ends the Cloudflare Access session for this site.
  return (
    <a
      href="/cdn-cgi/access/logout"
      className="inline-flex min-h-11 items-center justify-center border border-[var(--line)] px-4 text-sm font-black text-[var(--text-strong)]"
    >
      Sign out
    </a>
  );
}

export function AdminOrderDetailEditor({ initialOrder }: { initialOrder: AdminOrderDetail }) {
  const [order, setOrder] = useState(initialOrder);
  const [status, setStatus] = useState<OrderStatus>(initialOrder.status);
  const [deliveryCharge, setDeliveryCharge] = useState(
    initialOrder.delivery_charge_lkr === null ? "" : String(initialOrder.delivery_charge_lkr),
  );
  const [privateNote, setPrivateNote] = useState(initialOrder.private_note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const deliveryChargeLkr = deliveryCharge === "" ? null : Number(deliveryCharge);
  const finalTotal =
    Number.isInteger(deliveryChargeLkr) && Number(deliveryChargeLkr) >= 0
      ? calculateFinalTotal(order.product_total_lkr, deliveryChargeLkr)
      : null;
  const paymentLink = useMemo(() => {
    if (status !== "confirmed" || finalTotal === null) return null;
    return buildPaymentWhatsAppLink({
      reference: order.reference,
      whatsappPhone: order.whatsapp_phone,
      productTotalLkr: order.product_total_lkr,
      deliveryChargeLkr,
      paymentInstructions: order.paymentInstructions,
    });
  }, [deliveryChargeLkr, finalTotal, order, status]);
  const phoneDigits = order.whatsapp_phone.replace(/\D/g, "");

  return (
    <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
      <section className="border border-[var(--line)] bg-[var(--panel)]">
        <div className="border-b border-[var(--line)] p-5">
          <p className="text-sm font-black text-[var(--text-soft)]">Customer</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--text-strong)]">{order.customer_name}</h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">{order.whatsapp_phone}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`tel:${order.whatsapp_phone}`} className="inline-flex min-h-11 items-center bg-[var(--text-strong)] px-4 text-sm font-black text-white">
              Call customer
            </a>
            <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center bg-[var(--whatsapp)] px-4 text-sm font-black text-white">
              Open WhatsApp
            </a>
          </div>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {order.items.map((item) => (
            <div key={item.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-mono text-xs font-black text-[var(--text-soft)]">Style {item.product_id}</p>
                <p className="mt-1 font-black text-[var(--text-strong)]">{item.product_title}</p>
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  {item.quantity} × {formatLkr(item.unit_price_lkr)}
                </p>
              </div>
              <p className="font-black text-[var(--text-strong)]">{formatLkr(item.line_total_lkr)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-[var(--line)] bg-[var(--panel)] p-5 lg:sticky lg:top-24">
        <div className="grid grid-cols-2 gap-px bg-[var(--line)]">
          <div className="bg-[var(--panel)] p-4">
            <p className="text-xs font-black text-[var(--text-soft)]">Product total</p>
            <p className="mt-2 text-xl font-black">{formatLkr(order.product_total_lkr)}</p>
          </div>
          <div className="bg-[var(--accent-soft)] p-4">
            <p className="text-xs font-black text-[var(--text-soft)]">Final amount</p>
            <p className="mt-2 text-xl font-black">{finalTotal === null ? "—" : formatLkr(finalTotal)}</p>
          </div>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsBusy(true);
            setMessage(null);
            try {
              const response = await fetch(`/api/admin/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status,
                  deliveryChargeLkr,
                  privateNote,
                }),
              });
              const result = (await response.json()) as AdminOrderDetail & { message?: string };
              if (!response.ok) {
                setMessage(result.message || "Could not save changes");
                return;
              }
              setOrder(result);
              setStatus(result.status);
              setDeliveryCharge(result.delivery_charge_lkr === null ? "" : String(result.delivery_charge_lkr));
              setPrivateNote(result.private_note ?? "");
              setMessage("Changes saved");
            } catch {
              setMessage("Could not save changes");
            } finally {
              setIsBusy(false);
            }
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-black">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)} className="min-h-12 w-full border border-[var(--line)] bg-white px-3">
              {orderStatuses.map((option) => (
                <option
                  key={option}
                  value={option}
                  disabled={option !== order.status && !canTransitionOrder(order.status, option)}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-black">Delivery charge</span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={deliveryCharge}
              onChange={(event) => setDeliveryCharge(event.target.value)}
              className="min-h-12 w-full border border-[var(--line)] bg-white px-4"
            />
            <span className="block text-xs text-[var(--text-soft)]">Enter 0 for pickup.</span>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-black">Private note</span>
            <textarea
              maxLength={2000}
              rows={5}
              value={privateNote}
              onChange={(event) => setPrivateNote(event.target.value)}
              className="w-full border border-[var(--line)] bg-white p-4"
            />
          </label>
          {message ? <p role="status" className="text-sm text-[var(--text-soft)]">{message}</p> : null}
          <button type="submit" disabled={isBusy} className="inline-flex min-h-12 w-full items-center justify-center bg-[var(--text-strong)] px-5 text-sm font-black text-white disabled:opacity-60">
            {isBusy ? "Saving..." : "Save changes"}
          </button>
        </form>

        {paymentLink ? (
          <a href={paymentLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-12 w-full items-center justify-center bg-[var(--whatsapp)] px-5 text-center text-sm font-black text-white">
            Message payment details
          </a>
        ) : (
          <button type="button" disabled className="mt-3 inline-flex min-h-12 w-full items-center justify-center border border-[var(--line)] px-5 text-sm font-black text-[var(--text-soft)] opacity-60">
            Message payment details
          </button>
        )}
      </section>
    </div>
  );
}
