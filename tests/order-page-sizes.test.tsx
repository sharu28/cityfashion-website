import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderCartProvider } from "@/components/order-cart-provider";
import { OrderPage } from "@/components/order-page";
import { OrderSizesProvider } from "@/components/order-sizes-provider";

vi.mock("@/lib/sizes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sizes")>()),
  SIZE_ORDERS_SENT: true,
}));

const productSlug = "style-1390-printed-long-frock";

describe("OrderPage with size orders switched on", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("sends the size split with each sized item", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "x", publicNumber: 1001, reference: "CF-1001", productTotalLkr: 9000, createdAt: "", duplicate: false }),
    });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("city-fashion-order-cart-v1", JSON.stringify([{ productSlug, quantity: 6 }]));
    const user = userEvent.setup();
    render(
      <OrderCartProvider>
        <OrderSizesProvider>
          <OrderPage />
        </OrderSizesProvider>
      </OrderCartProvider>,
    );

    await screen.findByText("Style 1390 Printed Long Frock");
    await user.type(screen.getByLabelText("Name"), "Nimali");
    await user.type(screen.getByLabelText("WhatsApp number"), "0742216040");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(options.body)).items).toEqual([
      {
        productSlug,
        quantity: 6,
        sizes: [
          { size: "M", quantity: 1 },
          { size: "L", quantity: 2 },
          { size: "XL", quantity: 2 },
          { size: "2XL", quantity: 1 },
        ],
      },
    ]);
  });
});
