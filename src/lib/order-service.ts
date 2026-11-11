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
