import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { OrderEmailSender } from "@/lib/order-email";

export function getOrdersDb(): D1Database {
  const db = getCloudflareContext().env.ORDERS_DB;
  if (!db) throw new Error("ORDERS_DB binding is missing.");
  return db;
}

/** Cloudflare `send_email` binding for the owner's order email. Undefined when not set up. */
export function getOrderEmailSender(): OrderEmailSender | undefined {
  const binding = getCloudflareContext().env.ORDER_EMAIL;
  return binding ? { send: (message) => binding.send(message) } : undefined;
}
