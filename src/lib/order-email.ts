import "server-only";

import { Resend } from "resend";

import type { OrderNotifier } from "@/lib/order-service";
import { siteUrl } from "@/lib/site";

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
          `${item.productTitle} (${item.productId}) — ${item.quantity} × ${formatLkr(item.unitPriceLkr)} = ${formatLkr(item.lineTotalLkr)}`,
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
            `<li><strong>${escapeHtml(item.productTitle)}</strong> (${escapeHtml(item.productId)}) — ${escapeHtml(item.quantity)} × ${escapeHtml(formatLkr(item.unitPriceLkr))} = ${escapeHtml(formatLkr(item.lineTotalLkr))}</li>`,
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

      const result = await new Resend(apiKey).emails.send({
        from,
        to,
        subject: `New order ${order.reference}`,
        text,
        html,
      });
      if (result.error) throw result.error;
    },
  };
}
