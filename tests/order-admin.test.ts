import { describe, expect, it } from "vitest";

import {
  buildPaymentWhatsAppLink,
  calculateFinalTotal,
  canTransitionOrder,
} from "@/lib/order-admin-shared";

describe("admin order rules", () => {
  it("allows only the approved status graph", () => {
    expect(canTransitionOrder("new", "confirmed")).toBe(true);
    expect(canTransitionOrder("confirmed", "paid")).toBe(true);
    expect(canTransitionOrder("paid", "completed")).toBe(true);
    expect(canTransitionOrder("new", "paid")).toBe(false);
    expect(canTransitionOrder("paid", "cancelled")).toBe(false);
  });

  it("adds delivery to the product total", () => {
    expect(calculateFinalTotal(18000, 600)).toBe(18600);
    expect(calculateFinalTotal(18000, null)).toBe(null);
  });

  it("builds a payment message with the reference and final amount", () => {
    const url = buildPaymentWhatsAppLink({
      reference: "CF-1001",
      whatsappPhone: "+94771234567",
      productTotalLkr: 18000,
      deliveryChargeLkr: 600,
      paymentInstructions: "Bank transfer: City Fashion account",
    });
    expect(decodeURIComponent(url)).toContain("CF-1001");
    expect(decodeURIComponent(url)).toContain("Rs. 18,600");
    expect(decodeURIComponent(url)).toContain("Bank transfer");
  });
});
