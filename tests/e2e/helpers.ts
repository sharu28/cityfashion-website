import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { Page, TestInfo } from "@playwright/test";

import { adminEmail, mockUrl, persistDir, workerUrl } from "../../scripts/e2e/test-values.mjs";

type GeneratedProduct = {
  id: string;
  slug: string;
  title: string;
  category: string;
  unitPriceLkr: number | null;
  sizeRange?: string;
};

const products = JSON.parse(
  fs.readFileSync(path.resolve("data/generated/products.generated.json"), "utf8"),
) as GeneratedProduct[];

/** Two orderable styles from different categories, read from the live catalog data. */
/** Two orderable styles from different categories: the first comes in M - 2XL, the second has no size range. */
export function pickTwoStyles() {
  const orderable = products.filter((product) => Number.isInteger(product.unitPriceLkr) && Number(product.unitPriceLkr) > 0);
  const first = orderable.find((product) => /^M\s*-\s*2XL$/i.test(product.sizeRange?.trim() ?? ""));
  const second = orderable.find((product) => product.category !== first?.category && !product.sizeRange?.trim());
  if (!first || !second) {
    throw new Error("The catalog needs an orderable M - 2XL style and an orderable unsized style in another category.");
  }
  return [first, second] as const;
}

/** An orderable style that comes in M, L and XL (for the per-size order test). */
export function sizedStyleFromCatalog() {
  const style = products.find(
    (product) => Number(product.unitPriceLkr) > 0 && /^M\s*-\s*(XL|2XL|3XL)$/i.test(product.sizeRange?.trim() ?? ""),
  );
  if (!style) throw new Error("The catalog needs an orderable style with a size range like M - 2XL.");
  return style;
}

/** Saves a screenshot of what the customer sees, when CAPTURE_SCREENSHOTS=1. */
export function screenshotter(page: Page, testInfo: TestInfo, folder: string) {
  let step = 0;
  return async (name: string, options: { fullPage?: boolean } = {}) => {
    step += 1;
    if (process.env.CAPTURE_SCREENSHOTS !== "1") return;
    const file = path.resolve(
      "docs/screenshots",
      folder,
      testInfo.project.name,
      `${String(step).padStart(2, "0")}-${name}.png`,
    );
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    await page.screenshot({ path: file, fullPage: options.fullPage ?? false, animations: "disabled" });
  };
}

export async function accessToken(email = adminEmail, overrides: { aud?: string } = {}) {
  const url = new URL("/__access-token", mockUrl);
  url.searchParams.set("email", email);
  if (overrides.aud) url.searchParams.set("aud", overrides.aud);
  const response = await fetch(url);
  return ((await response.json()) as { token: string }).token;
}

export type SentEmail = { messageId: string; from: string; to: string[]; subject: string };
export type SentEmailDetail = SentEmail & { text?: string; html?: string };

// `wrangler dev` does not send email: the send_email binding stores each message,
// and the local explorer API lists them.
const sentEmailApi = new URL("/cdn-cgi/local/explorer/api/local/email/sending", workerUrl);

export async function sentEmails() {
  const emails: SentEmail[] = [];
  let cursor: string | undefined;
  do {
    const url = new URL(sentEmailApi);
    url.searchParams.set("per_page", "100");
    if (cursor) url.searchParams.set("cursor", cursor);
    const body = (await (await fetch(url)).json()) as {
      result: SentEmail[];
      result_info?: { cursor?: string; has_more?: boolean };
    };
    emails.push(...body.result);
    cursor = body.result_info?.has_more ? body.result_info.cursor : undefined;
  } while (cursor);
  return emails;
}

export async function sentEmailDetail(messageId: string) {
  const url = new URL(sentEmailApi);
  url.searchParams.set("email_id", messageId);
  const body = (await (await fetch(url)).json()) as { result: SentEmailDetail };
  return body.result;
}

/** The text of the one email with this subject, or "" while none has arrived. */
export async function sentEmailText(subject: string) {
  const email = (await sentEmails()).find((entry) => entry.subject === subject);
  return email ? ((await sentEmailDetail(email.messageId)).text ?? "") : "";
}

/** Reads the local D1 database the Worker is using. */
export function queryD1<T = Record<string, unknown>>(sql: string): T[] {
  const wrangler = path.resolve("node_modules/wrangler/bin/wrangler.js");
  const output = execFileSync(
    process.execPath,
    [wrangler, "d1", "execute", "cityfashion-orders", "--local", "--persist-to", persistDir, "--json", "--command", sql],
    { encoding: "utf8" },
  );
  const parsed = JSON.parse(output.slice(output.indexOf("["))) as Array<{ results: T[] }>;
  return parsed[0]?.results ?? [];
}

export function formatLkr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}
