import "server-only";

import type { OrderNotifier } from "@/lib/order-service";
import { siteUrl } from "@/lib/site";
import { formatSizeBreakdown } from "@/lib/sizes";

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatLkr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

/** The part of Cloudflare's `send_email` binding this file uses. */
export type OrderEmailSender = {
  send(message: {
    to: string[];
    from: SenderAddress;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
};

/** A bare address, or an address with a display name. */
type SenderAddress = string | { email: string; name: string };

/** Reads "Name <address>" or a bare address. */
export function parseEmailAddress(value: string): SenderAddress | null {
  const trimmed = value.trim();
  const named = /^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/.exec(trimmed);
  if (named) {
    const name = named[1].replace(/^"|"$/g, "").trim();
    return name ? { email: named[2], name } : named[2];
  }
  return /^[^<>\s]+@[^<>\s]+$/.test(trimmed) ? trimmed : null;
}

export function createCloudflareOrderNotifier(sender: OrderEmailSender | undefined): OrderNotifier {
  return {
    async sendNewOrder(order) {
      const from = parseEmailAddress(process.env.ORDER_EMAIL_FROM ?? "");
      const to = (process.env.ORDER_NOTIFICATION_EMAIL ?? "")
        .split(",")
        .map((address) => address.trim())
        .filter(Boolean);
      if (!sender || !from || to.length === 0) {
        throw new Error("Order email is not configured.");
      }

      const lines = order.items.map(
        (item) =>
          `${item.productTitle} (${item.productId}) — ${item.quantity} × ${formatLkr(item.unitPriceLkr)} = ${formatLkr(item.lineTotalLkr)}
  Sizes: ${formatSizeBreakdown(item.sizes) || "staff to confirm"}`,
      );
      const adminUrl = `${siteUrl}/admin/orders/${encodeURIComponent(order.id)}`;
      const text = [
        `New website order ${order.reference}`,
        `Customer: ${order.customerName}`,
        `WhatsApp: ${order.whatsappPhone}`,
        "",
        ...lines,
        "",
        `Product total: ${formatLkr(order.productTotalLkr)}`,
        `Placed: ${order.createdAt}`,
        `Open order: ${adminUrl}`,
      ].join("\n");
      const htmlLines = order.items
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.productTitle)}</strong> (${escapeHtml(item.productId)}) — ${escapeHtml(item.quantity)} × ${escapeHtml(formatLkr(item.unitPriceLkr))} = ${escapeHtml(formatLkr(item.lineTotalLkr))}<br>Sizes: ${escapeHtml(formatSizeBreakdown(item.sizes) || "staff to confirm")}</li>`,
        )
        .join("");
      const html = `
        <h1>New website order ${escapeHtml(order.reference)}</h1>
        <p><strong>Customer:</strong> ${escapeHtml(order.customerName)}</p>
        <p><strong>WhatsApp:</strong> ${escapeHtml(order.whatsappPhone)}</p>
        <ul>${htmlLines}</ul>
        <p><strong>Product total:</strong> ${escapeHtml(formatLkr(order.productTotalLkr))}</p>
        <p><strong>Placed:</strong> ${escapeHtml(order.createdAt)}</p>
        <p><a href="${escapeHtml(adminUrl)}">Open order</a></p>
      `;

      // Cloudflare Email Routing. Sends only reach verified destination addresses.
      try {
        await sender.send({ to, from, subject: `New order ${order.reference}`, text, html });
      } catch (error) {
        const code = (error as { code?: unknown })?.code;
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Cloudflare email failed${typeof code === "string" ? ` (${code})` : ""}: ${message.slice(0, 300)}`);
      }
    },
  };
}
