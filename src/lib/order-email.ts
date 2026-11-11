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

export function createResendOrderNotifier(): OrderNotifier {
  return {
    async sendNewOrder(order) {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.ORDER_EMAIL_FROM;
      const to = process.env.ORDER_NOTIFICATION_EMAIL;
      if (!apiKey || !from || !to) {
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

      // Resend HTTP API. RESEND_API_BASE_URL is only set by the local test setup.
      const baseUrl = (process.env.RESEND_API_BASE_URL || "https://api.resend.com").replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `order-${order.id}`,
        },
        body: JSON.stringify({
          from,
          to: to.split(",").map((address) => address.trim()).filter(Boolean),
          subject: `New order ${order.reference}`,
          text,
          html,
        }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Resend returned ${response.status}: ${detail.slice(0, 300)}`);
      }
    },
  };
}
