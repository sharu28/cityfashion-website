import type { Json } from "@/lib/supabase/types";
import {
  normalizeSriLankaMobile,
  type OrderReceipt,
  OrderValidationError,
  validatePlaceOrderPayload,
} from "@/lib/order-domain";

export type OrderRepository = {
  create(input: {
    customerName: string;
    whatsappPhone: string;
    idempotencyKey: string;
    identityHash: string;
    productTotalLkr: number;
    items: Array<{
      productId: string;
      productSlug: string;
      productTitle: string;
      unitPriceLkr: number;
      quantity: number;
      lineTotalLkr: number;
    }>;
  }): Promise<OrderReceipt>;
};

export type OrderNotifier = {
  sendNewOrder(order: OrderReceipt & {
    customerName: string;
    whatsappPhone: string;
    items: Array<{
      productId: string;
      productTitle: string;
      unitPriceLkr: number;
      quantity: number;
      lineTotalLkr: number;
    }>;
  }): Promise<void>;
};

export type OrderCatalogProduct = {
  id: string;
  slug: string;
  title: string;
  unitPriceLkr: number | null;
};

export class OrderRateLimitError extends Error {
  constructor() {
    super("order_rate_limited");
    this.name = "OrderRateLimitError";
  }
}

export function isOrderRateLimitDatabaseError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      Reflect.get(error, "code") === "P0001" &&
      Reflect.get(error, "message") === "order_rate_limited",
  );
}

export async function submitOrder(
  payload: unknown,
  dependencies: {
    catalog: OrderCatalogProduct[];
    identityHash: string;
    notifier: OrderNotifier;
    repository: OrderRepository;
  },
) {
  const order = validatePlaceOrderPayload(payload);
  const whatsappPhone = normalizeSriLankaMobile(order.whatsappNumber);
  const catalogBySlug = new Map(dependencies.catalog.map((product) => [product.slug, product]));

  const items = order.items.map((item) => {
    const product = catalogBySlug.get(item.productSlug);
    if (!product || !Number.isInteger(product.unitPriceLkr) || Number(product.unitPriceLkr) <= 0) {
      throw new OrderValidationError("style_unavailable");
    }

    const unitPriceLkr = Number(product.unitPriceLkr);
    return {
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      unitPriceLkr,
      quantity: item.quantity,
      lineTotalLkr: unitPriceLkr * item.quantity,
    };
  });
  const productTotalLkr = items.reduce((total, item) => total + item.lineTotalLkr, 0);

  const receipt = await dependencies.repository.create({
    customerName: order.customerName,
    whatsappPhone,
    idempotencyKey: order.idempotencyKey,
    identityHash: dependencies.identityHash,
    productTotalLkr,
    items,
  });

  if (!receipt.duplicate) {
    try {
      await dependencies.notifier.sendNewOrder({
        ...receipt,
        customerName: order.customerName,
        whatsappPhone,
        items: items.map(({ productSlug: _productSlug, ...item }) => item),
      });
    } catch (error) {
      console.error("Order email notification failed.", error);
    }
  }

  return receipt;
}

export function createSupabaseOrderRepository(): OrderRepository {
  return {
    async create(input) {
      const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
      const client = createSupabaseServiceClient();
      const { data, error } = await client.rpc("create_website_order", {
        p_customer_name: input.customerName,
        p_idempotency_key: input.idempotencyKey,
        p_identity_hash: input.identityHash,
        p_items: input.items as unknown as Json,
        p_whatsapp_phone: input.whatsappPhone,
      });

      if (error) {
        if (isOrderRateLimitDatabaseError(error)) throw new OrderRateLimitError();
        throw error;
      }

      const row = data?.[0];
      if (!row) throw new Error("Order storage returned no receipt.");

      return {
        id: row.id,
        publicNumber: row.public_number,
        reference: `CF-${row.public_number}`,
        productTotalLkr: row.product_total_lkr,
        createdAt: row.created_at,
        duplicate: row.duplicate,
      };
    },
  };
}
