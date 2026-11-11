import type { OrderReceipt } from "@/lib/order-domain";
import { OrderRateLimitError, type OrderRepository } from "@/lib/order-service";

type CreateOrderInput = Parameters<OrderRepository["create"]>[0];

export class OrderStorageValidationError extends Error {
  constructor(
    public code:
      | "invalid_customer_name"
      | "invalid_whatsapp_phone"
      | "invalid_identity"
      | "invalid_order_items"
      | "order_total_too_large",
  ) {
    super(code);
    this.name = "OrderStorageValidationError";
  }
}

const maxTotalLkr = 2_147_483_647;
const rateLimitWindowMs = 15 * 60 * 1000;
const rateLimitMaxAttempts = 5;
const attemptRetentionMs = 7 * 24 * 60 * 60 * 1000;
const firstPublicNumber = 1001;

type ReceiptRow = {
  id: string;
  public_number: number;
  product_total_lkr: number;
  created_at: string;
};

function toReceipt(row: ReceiptRow, duplicate: boolean): OrderReceipt {
  return {
    id: row.id,
    publicNumber: row.public_number,
    reference: `CF-${row.public_number}`,
    productTotalLkr: row.product_total_lkr,
    createdAt: row.created_at,
    duplicate,
  };
}

function validate(input: CreateOrderInput) {
  const name = input.customerName.trim();
  if (name.length < 1 || name.length > 100) {
    throw new OrderStorageValidationError("invalid_customer_name");
  }
  if (!/^\+947\d{8}$/.test(input.whatsappPhone)) {
    throw new OrderStorageValidationError("invalid_whatsapp_phone");
  }
  if (typeof input.identityHash !== "string" || input.identityHash.length < 32) {
    throw new OrderStorageValidationError("invalid_identity");
  }
  if (!input.idempotencyKey || !Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderStorageValidationError("invalid_order_items");
  }

  let total = 0;
  for (const item of input.items) {
    if (
      !item.productId?.trim() ||
      !item.productSlug?.trim() ||
      !item.productTitle?.trim() ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 6 ||
      !Number.isInteger(item.unitPriceLkr) ||
      item.unitPriceLkr <= 0
    ) {
      throw new OrderStorageValidationError("invalid_order_items");
    }
    total += item.unitPriceLkr * item.quantity;
    if (total > maxTotalLkr) throw new OrderStorageValidationError("order_total_too_large");
  }

  return { name, total };
}

export function createD1OrderRepository(
  db: D1Database,
  options: { now?: () => Date } = {},
): OrderRepository {
  const now = options.now ?? (() => new Date());

  async function findByIdempotencyKey(key: string) {
    return db
      .prepare(
        "SELECT id, public_number, product_total_lkr, created_at FROM orders WHERE idempotency_key = ?",
      )
      .bind(key)
      .first<ReceiptRow>();
  }

  return {
    async create(input) {
      const { name, total } = validate(input);

      const existing = await findByIdempotencyKey(input.idempotencyKey);
      if (existing) return toReceipt(existing, true);

      const current = now();
      const createdAt = current.toISOString();
      const windowStart = new Date(current.getTime() - rateLimitWindowMs).toISOString();
      const retentionStart = new Date(current.getTime() - attemptRetentionMs).toISOString();
      const orderId = crypto.randomUUID();

      // D1 runs a batch as one transaction, and writes to one database are serialized,
      // so the attempt check, the order number and the inserts cannot interleave.
      const statements = [
        db
          .prepare("DELETE FROM order_submission_attempts WHERE identity_hash = ? AND created_at < ?")
          .bind(input.identityHash, retentionStart),
        db
          .prepare(
            `INSERT INTO order_submission_attempts (id, identity_hash, created_at)
             SELECT ?1, ?2, ?3
             WHERE (SELECT count(*) FROM order_submission_attempts
                    WHERE identity_hash = ?2 AND created_at > ?4) < ?5`,
          )
          .bind(orderId, input.identityHash, createdAt, windowStart, rateLimitMaxAttempts),
        db
          .prepare(
            `INSERT INTO orders (id, public_number, idempotency_key, customer_name, whatsapp_phone,
                                 product_total_lkr, status, created_at, updated_at)
             SELECT ?1, COALESCE((SELECT max(public_number) FROM orders), ?2) + 1, ?3, ?4, ?5, ?6, 'new', ?7, ?7
             WHERE EXISTS (SELECT 1 FROM order_submission_attempts WHERE id = ?1)
             ON CONFLICT (idempotency_key) DO NOTHING`,
          )
          .bind(orderId, firstPublicNumber - 1, input.idempotencyKey, name, input.whatsappPhone, total, createdAt),
        ...input.items.map((item) =>
          db
            .prepare(
              `INSERT INTO order_items (id, order_id, product_id, product_slug, product_title,
                                        unit_price_lkr, quantity, line_total_lkr, created_at)
               SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9
               WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?2)`,
            )
            .bind(
              crypto.randomUUID(),
              orderId,
              item.productId,
              item.productSlug,
              item.productTitle,
              item.unitPriceLkr,
              item.quantity,
              item.unitPriceLkr * item.quantity,
              createdAt,
            ),
        ),
      ];

      const results = await db.batch(statements);
      const attemptInserted = (results[1]?.meta.changes ?? 0) > 0;
      const orderInserted = (results[2]?.meta.changes ?? 0) > 0;

      if (!attemptInserted) throw new OrderRateLimitError();

      if (!orderInserted) {
        const raced = await findByIdempotencyKey(input.idempotencyKey);
        if (raced) return toReceipt(raced, true);
        throw new Error("Order storage did not save the order.");
      }

      const row = await db
        .prepare("SELECT id, public_number, product_total_lkr, created_at FROM orders WHERE id = ?")
        .bind(orderId)
        .first<ReceiptRow>();
      if (!row) throw new Error("Order storage returned no receipt.");
      return toReceipt(row, false);
    },
  };
}
