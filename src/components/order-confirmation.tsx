import Image from "next/image";
import Link from "next/link";

import { formatLkr } from "@/lib/catalog";
import { buildOrderSupportWhatsAppLink } from "@/lib/order-domain";
import {
  buildPlacedOrderWhatsAppLink,
  formatItemSizes,
  formatSriLankaMobile,
  type PlacedOrder,
} from "@/lib/placed-order";

const steps = ["Order placed", "Staff call you", "Order sent"];

export function OrderConfirmation({ order }: { order: PlacedOrder }) {
  const pieceCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const firstName = order.customerName.split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <header className="text-center">
        <span className="confirm-pop mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--whatsapp)]">
          <svg
            aria-hidden
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              className="confirm-tick"
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="confirm-rise mt-6 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Thank you{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="confirm-rise mt-2 text-base text-[var(--text-soft)]">
          Your order is placed.
        </p>
        <p className="confirm-rise mt-5 inline-flex items-center gap-2 bg-[var(--fill)] px-4 py-2 text-sm">
          <span className="text-[var(--text-soft)]">Order number</span>
          <span className="font-semibold tracking-wide">{order.reference}</span>
        </p>
      </header>

      <div className="confirm-rise mt-10" style={{ animationDelay: "120ms" }}>
        <ol className="grid grid-cols-3" aria-label="What happens next">
          {steps.map((step, index) => (
            <li
              key={step}
              className="relative flex flex-col items-center text-center"
            >
              {index > 0 ? (
                <span
                  aria-hidden
                  className="absolute right-[calc(50%+14px)] top-[7px] h-px w-[calc(100%-28px)] bg-[var(--line)]"
                />
              ) : null}
              <span
                aria-hidden
                className={`relative size-[15px] rounded-full ${
                  index === 0
                    ? "bg-[var(--whatsapp)] ring-4 ring-[var(--whatsapp)]/15"
                    : "border border-[var(--line)] bg-white"
                }`}
              />
              <span
                className={`mt-2.5 text-xs ${index === 0 ? "font-semibold" : "text-[var(--text-soft)]"}`}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-center text-base leading-7">
          Our staff will call you on{" "}
          <strong className="whitespace-nowrap font-semibold">
            {formatSriLankaMobile(order.whatsappPhone)}
          </strong>{" "}
          to confirm delivery and payment.
        </p>
        <p className="mt-1 text-center text-sm text-[var(--text-soft)]">
          Wrong number?{" "}
          <a
            href={buildOrderSupportWhatsAppLink(order.reference)}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--ink)] underline underline-offset-4"
          >
            Message us on WhatsApp
          </a>
        </p>

        <div className="mt-8">
          <SendOrderButton order={order} />
        </div>
      </div>

      <section
        className="confirm-rise mt-12 border-t border-[var(--line)]"
        style={{ animationDelay: "200ms" }}
      >
        <div className="flex items-baseline justify-between py-4">
          <p className="label">Your order</p>
          <p className="text-xs text-[var(--text-soft)]">
            {order.items.length} {order.items.length === 1 ? "style" : "styles"}{" "}
            · {pieceCount} pieces
          </p>
        </div>

        <ul className="space-y-4">
          {order.items.map((item) => {
            const sizes = formatItemSizes(item.sizes);
            const details = [
              sizes,
              item.colors?.length ? item.colors.join(", ") : "",
            ].filter(Boolean);
            return (
              <li key={item.productSlug} className="flex gap-4">
                <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-[var(--fill)]">
                  {item.coverImage ? (
                    <Image
                      src={item.coverImage}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold leading-snug">
                      {item.title}
                    </p>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatLkr(item.lineTotalLkr)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {item.title.includes(item.productId)
                      ? ""
                      : `Style ${item.productId} · `}
                    {item.quantity} pcs × {formatLkr(item.unitPriceLkr)}
                  </p>
                  {details.length ? (
                    <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                      {details.join(" · ")}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-baseline justify-between border-t border-[var(--line)] pt-4">
          <div>
            <p className="text-sm font-semibold">Product total</p>
            <p className="text-xs text-[var(--text-soft)]">
              Delivery not included
            </p>
          </div>
          <p className="text-2xl font-semibold tracking-[-0.01em]">
            {formatLkr(order.productTotalLkr)}
          </p>
        </div>
      </section>

      <Link
        href="/#new-arrivals"
        className="confirm-rise mt-10 block text-center text-sm font-semibold underline underline-offset-4"
        style={{ animationDelay: "280ms" }}
      >
        Continue shopping
      </Link>
    </div>
  );
}

function SendOrderButton({ order }: { order: PlacedOrder }) {
  return (
    <div>
      <a
        href={buildPlacedOrderWhatsAppLink(order)}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-13 w-full items-center justify-center gap-2.5 bg-[var(--whatsapp)] px-6 text-sm font-semibold text-white transition hover:brightness-110"
      >
        <svg
          aria-hidden
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
        </svg>
        Send my order on WhatsApp
      </a>
      <p className="mt-2.5 text-center text-xs text-[var(--text-soft)]">
        Keeps a copy of your order in your chat.
      </p>
    </div>
  );
}
