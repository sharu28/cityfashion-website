import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getOrdersDb(): D1Database {
  const db = getCloudflareContext().env.ORDERS_DB;
  if (!db) throw new Error("ORDERS_DB binding is missing.");
  return db;
}
