import { expect, test } from "@playwright/test";

import { accessToken, screenshotter } from "./helpers";

// The dashboard must stay private even without the Cloudflare Access rule in front of it.

test("the dashboard is hidden without an Access sign-in", async ({ page }, testInfo) => {
  const response = await page.goto("/admin/orders");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Website orders" })).toHaveCount(0);
  await screenshotter(page, testInfo, "admin-locked")("not-signed-in");
});

test("the dashboard is hidden for someone who is not the owner", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    ...testInfo.project.use,
    extraHTTPHeaders: { "Cf-Access-Jwt-Assertion": await accessToken("someone@example.test") },
  });
  const page = await context.newPage();
  const response = await page.goto("/admin/orders");
  expect(response?.status()).toBe(404);
  await context.close();
});

test("the dashboard refuses a token for another Access app", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    ...testInfo.project.use,
    extraHTTPHeaders: { "Cf-Access-Jwt-Assertion": await accessToken(undefined, { aud: "another-app" }) },
  });
  const page = await context.newPage();
  expect((await page.goto("/admin/orders"))?.status()).toBe(404);
  await context.close();
});

test("order changes need an Access sign-in", async ({ request }) => {
  const response = await request.patch("/api/admin/orders/any-id", { data: { status: "cancelled" } });
  expect(response.status()).toBe(403);
});
