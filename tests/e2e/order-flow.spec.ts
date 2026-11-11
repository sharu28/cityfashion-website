import { expect, test } from "@playwright/test";

import { accessToken, formatLkr, pickTwoStyles, queryD1, screenshotter, sentEmailDetail, sentEmails, sentEmailText, sizedStyleFromCatalog } from "./helpers";

// One full order, the way a retailer places it, then the owner's side of it.
// Selectors use roles and visible labels only, so a visual redesign does not break them.

// The first style comes in M - 2XL (size picker); the second has no size range (one quantity).
const [firstStyle, secondStyle] = pickTwoStyles();
const phoneByProject: Record<string, string> = { phone: "077 123 4567", desktop: "0712345678" };
const normalizedByProject: Record<string, string> = { phone: "+94771234567", desktop: "+94712345678" };

test("a retailer places an order and the owner receives it", async ({ page, browser }, testInfo) => {
  const shot = screenshotter(page, testInfo, "order-flow");
  const customerName = `TEST order ${testInfo.project.name}`;
  const whatsapp = phoneByProject[testInfo.project.name];
  // The single quantity box (unsized styles); size rows are labelled "Quantity, size M" and so on.
  const quantity = page.getByLabel("Quantity", { exact: true });

  // 1. Browse: home page, then a category.
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // First visit: the cookie choice box sits over the bottom of the screen until answered.
  const cookieChoice = page.getByRole("dialog", { name: "Cookie choices" });
  await expect(cookieChoice).toBeVisible();
  await shot("home");
  await cookieChoice.getByRole("button", { name: "Only necessary" }).click();
  await expect(cookieChoice).toBeHidden();

  await page.goto(`/category/${firstStyle.category}`);
  const productLink = page.getByRole("link", { name: firstStyle.title }).first();
  await expect(productLink).toBeVisible();
  await shot("category");

  // 2. Open a product.
  await productLink.click();
  await expect(page).toHaveURL(new RegExp(`/products/${firstStyle.slug}$`));
  await expect(page.getByRole("heading", { level: 1, name: firstStyle.title })).toBeVisible();
  await shot("product");

  // 3. Add to order. The first style comes in sizes: it starts at 6 pieces in a mix of sizes,
  //    and the buyer changes sizes one piece at a time, then updates the order.
  const panelButton = page.getByRole("button", { name: /^(Add to order|Update order) · / });
  const sizeQuantity = (size: string) => page.getByLabel(`Quantity, size ${size}`, { exact: true });
  await expect(panelButton).toHaveText(/Add to order · 6 pcs/);
  await expect(sizeQuantity("M")).toHaveValue("1");
  await expect(sizeQuantity("L")).toHaveValue("2");
  await expect(sizeQuantity("XL")).toHaveValue("2");
  await expect(sizeQuantity("2XL")).toHaveValue("1");
  await panelButton.click();
  await expect(page.getByRole("link", { name: /View order · 1 style/ })).toBeVisible();
  await page.getByRole("button", { name: "Add one piece, size M", exact: true }).click();
  await page.getByRole("button", { name: "Add one piece, size M", exact: true }).click();
  await expect(sizeQuantity("M")).toHaveValue("3");
  await page.getByRole("button", { name: "Remove one piece, size M", exact: true }).click();
  await expect(sizeQuantity("M")).toHaveValue("2");
  await expect(panelButton).toHaveText(/Update order · 7 pcs/);
  await panelButton.click();
  await expect(page.getByText("In your order: 7 pcs")).toBeVisible();
  await shot("added-to-order");

  // A second style from another category, with one quantity (staff confirm sizes).
  await page.goto(`/products/${secondStyle.slug}`);
  await expect(quantity).toHaveValue("6");
  await expect(page.getByRole("button", { name: "Remove one piece", exact: true })).toBeDisabled();
  await panelButton.click();
  const expectedTotal = 7 * Number(firstStyle.unitPriceLkr) + 6 * Number(secondStyle.unitPriceLkr);
  const cartLink = page.getByRole("link", { name: /View order · 2 styles/ });
  await expect(cartLink).toContainText(formatLkr(expectedTotal));
  await shot("second-style-added");

  // 4. Review the cart and change a quantity there.
  await cartLink.click();
  await expect(page).toHaveURL(/\/order$/);
  await expect(page.getByRole("heading", { name: "Check your styles" })).toBeVisible();
  await expect(page.getByText("M 2 · L 2 · XL 2 · 2XL 1")).toBeVisible();
  await expect(quantity).toHaveValue("6");
  await page.getByRole("button", { name: "Add one piece", exact: true }).click();
  await expect(quantity).toHaveValue("7");
  const finalTotal = 7 * Number(firstStyle.unitPriceLkr) + 7 * Number(secondStyle.unitPriceLkr);
  await expect(page.getByText(formatLkr(finalTotal), { exact: true }).first()).toBeVisible();
  await shot("cart", { fullPage: true });

  // 5. Checkout with name and WhatsApp number only.
  await page.getByLabel("Name").fill(customerName);
  await page.getByLabel("WhatsApp number").fill(whatsapp);
  await page.getByRole("button", { name: "Place order" }).scrollIntoViewIfNeeded();
  await shot("checkout-filled");
  await page.getByRole("button", { name: "Place order" }).click();

  const referenceHeading = page.getByRole("heading", { level: 1, name: /^CF-\d{4,}$/ });
  await expect(referenceHeading).toBeVisible();
  // The customer must see their order number without scrolling (the form sits low on a phone).
  await expect(referenceHeading).toBeInViewport();
  await expect(page.getByText("Our staff will contact you shortly")).toBeVisible();
  const reference = (await referenceHeading.textContent())!.trim();
  const publicNumber = Number(reference.slice(3));
  await shot("order-received");

  // 6. Stored in D1 with server prices.
  const [order] = queryD1<{
    id: string;
    customer_name: string;
    whatsapp_phone: string;
    product_total_lkr: number;
    status: string;
  }>(`SELECT id, customer_name, whatsapp_phone, product_total_lkr, status FROM orders WHERE public_number = ${publicNumber}`);
  expect(order).toMatchObject({
    customer_name: customerName,
    whatsapp_phone: normalizedByProject[testInfo.project.name],
    product_total_lkr: finalTotal,
    status: "new",
  });
  const items = queryD1<{ product_slug: string; quantity: number; unit_price_lkr: number; line_total_lkr: number }>(
    `SELECT product_slug, quantity, unit_price_lkr, line_total_lkr FROM order_items WHERE order_id = '${order.id}' ORDER BY product_slug`,
  );
  expect(items).toEqual(
    [firstStyle, secondStyle]
      .map((style) => ({
        product_slug: style.slug,
        quantity: 7,
        unit_price_lkr: Number(style.unitPriceLkr),
        line_total_lkr: 7 * Number(style.unitPriceLkr),
      }))
      .sort((a, b) => a.product_slug.localeCompare(b.product_slug)),
  );
  // The sizes the buyer picked on the product page are stored; the unsized style has none.
  const breakdowns = queryD1<{ product_slug: string; size_breakdown: string | null }>(
    `SELECT product_slug, size_breakdown FROM order_items WHERE order_id = '${order.id}'`,
  );
  const breakdownOf = (slug: string) => breakdowns.find((row) => row.product_slug === slug)?.size_breakdown ?? null;
  expect(JSON.parse(breakdownOf(firstStyle.slug) ?? "null")).toEqual([
    { size: "M", quantity: 2 },
    { size: "L", quantity: 2 },
    { size: "XL", quantity: 2 },
    { size: "2XL", quantity: 1 },
  ]);
  expect(breakdownOf(secondStyle.slug)).toBeNull();

  // 7. The owner got exactly one email for it.
  const emails = (await sentEmails()).filter((email) => email.subject === `New order ${reference}`);
  expect(emails).toHaveLength(1);
  expect(emails[0].to).toEqual(["owner@example.test"]);
  expect(emails[0].from).toContain("orders@example.test");
  const emailText = (await sentEmailDetail(emails[0].messageId)).text ?? "";
  expect(emailText).toContain(customerName);
  expect(emailText).toContain(formatLkr(finalTotal));
  expect(emailText).toContain("Sizes: M 2 · L 2 · XL 2 · 2XL 1");
  expect(emailText).toContain(`/admin/orders/${order.id}`);

  // 8. The owner sees it in the dashboard (signed in through Access).
  const owner = await browser.newContext({
    ...testInfo.project.use,
    extraHTTPHeaders: { "Cf-Access-Jwt-Assertion": await accessToken() },
  });
  const ownerPage = await owner.newPage();
  await ownerPage.addInitScript(() => window.localStorage.setItem("cityfashion_cookie_consent", "declined"));
  const ownerShot = screenshotter(ownerPage, testInfo, "admin");
  await ownerPage.goto("/admin/orders");
  await expect(ownerPage.getByRole("heading", { name: "Website orders" })).toBeVisible();
  const orderLink = ownerPage.getByRole("link", { name: reference, exact: true });
  await expect(orderLink).toBeVisible();
  await expect(ownerPage.getByRole("row", { name: new RegExp(reference) })).toContainText(customerName);
  await ownerShot("orders-list");

  await orderLink.click();
  await expect(ownerPage.getByRole("heading", { level: 1, name: reference })).toBeVisible();
  await expect(ownerPage.getByRole("heading", { name: customerName })).toBeVisible();
  await expect(ownerPage.getByText(firstStyle.title).first()).toBeVisible();
  await expect(ownerPage.getByText("Sizes: M 2 · L 2 · XL 2 · 2XL 1")).toBeVisible();
  await ownerShot("order-detail", { fullPage: true });

  // The owner can mark it as cancelled (how a test order is cleared away).
  await ownerPage.getByLabel("Status").selectOption("cancelled");
  await ownerPage.getByRole("button", { name: /save/i }).click();
  await expect(ownerPage.getByText("Changes saved")).toBeVisible();
  expect(queryD1<{ status: string }>(`SELECT status FROM orders WHERE id = '${order.id}'`)[0].status).toBe("cancelled");
  await owner.close();
});

test("placing the same order twice keeps one order and sends one email", async ({ page }, testInfo) => {
  await page.goto(`/products/${firstStyle.slug}`);
  await page.getByRole("button", { name: /^Add to order · / }).click();
  await page.goto("/order");

  const before = (await sentEmails()).length;
  // A double tap on a slow connection: both requests carry the same order key.
  const payload = {
    customerName: `TEST double ${testInfo.project.name}`,
    whatsappNumber: testInfo.project.name === "phone" ? "0770000001" : "0770000002",
    idempotencyKey: crypto.randomUUID(),
    items: [{ productSlug: firstStyle.slug, quantity: 6 }],
  };
  const [first, second] = await Promise.all([
    page.request.post("/api/orders", { data: payload }),
    page.request.post("/api/orders", { data: payload }),
  ]);
  expect([first.status(), second.status()].sort()).toEqual([201, 201]);
  const receipts = [await first.json(), await second.json()];
  expect(receipts[0].reference).toBe(receipts[1].reference);
  expect(receipts.filter((receipt) => receipt.duplicate)).toHaveLength(1);

  const rows = queryD1<{ n: number }>(`SELECT count(*) AS n FROM orders WHERE idempotency_key = '${payload.idempotencyKey}'`);
  expect(rows[0].n).toBe(1);
  await expect.poll(async () => (await sentEmails()).length).toBe(before + 1);
});

test("pieces per size reach the database, the email and the dashboard", async ({ page, browser }, testInfo) => {
  // The API contract for sizes, sent directly (the first test covers the product-page picker).
  const sizedStyle = sizedStyleFromCatalog();
  const payload = {
    customerName: `TEST sizes ${testInfo.project.name}`,
    whatsappNumber: testInfo.project.name === "phone" ? "0770000011" : "0770000012",
    idempotencyKey: crypto.randomUUID(),
    items: [
      {
        productSlug: sizedStyle.slug,
        quantity: 7,
        sizes: [
          { size: "XL", quantity: 3 },
          { size: "M", quantity: 2 },
          { size: "L", quantity: 2 },
        ],
      },
    ],
  };
  const response = await page.request.post("/api/orders", { data: payload });
  expect(response.status()).toBe(201);
  const { id, reference } = (await response.json()) as { id: string; reference: string };

  const [row] = queryD1<{ size_breakdown: string }>(`SELECT size_breakdown FROM order_items WHERE order_id = '${id}'`);
  expect(JSON.parse(row.size_breakdown)).toEqual([
    { size: "M", quantity: 2 },
    { size: "L", quantity: 2 },
    { size: "XL", quantity: 3 },
  ]);

  await expect
    .poll(async () => sentEmailText(`New order ${reference}`))
    .toContain("Sizes: M 2 · L 2 · XL 3");

  const owner = await browser.newContext({
    ...testInfo.project.use,
    extraHTTPHeaders: { "Cf-Access-Jwt-Assertion": await accessToken() },
  });
  const ownerPage = await owner.newPage();
  await ownerPage.goto(`/admin/orders/${id}`);
  await expect(ownerPage.getByText("Sizes: M 2 · L 2 · XL 3")).toBeVisible();
  await owner.close();

  // A size the style does not come in is refused.
  const bad = await page.request.post("/api/orders", {
    data: { ...payload, idempotencyKey: crypto.randomUUID(), items: [{ productSlug: sizedStyle.slug, quantity: 6, sizes: [{ size: "XS", quantity: 6 }] }] },
  });
  expect(bad.status()).toBe(400);
});
