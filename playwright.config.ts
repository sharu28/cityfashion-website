import { defineConfig, devices } from "@playwright/test";

import { mockUrl, workerUrl } from "./scripts/e2e/test-values.mjs";

// End-to-end tests run against the real Worker build (`wrangler dev`) with a local D1,
// the local send_email simulator and fake Cloudflare Access keys. See scripts/e2e/.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Each D1 check starts a wrangler process (~20 s each on a busy PC), so the full order test needs room.
  timeout: process.env.CAPTURE_SCREENSHOTS === "1" ? 300_000 : 180_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: workerUrl,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    {
      command: "node scripts/e2e/mock-services.mjs",
      url: `${mockUrl}/__health`,
      reuseExistingServer: false,
      stdout: "pipe",
    },
    {
      command: "node scripts/e2e/start-worker.mjs",
      url: `${workerUrl}/robots.txt`,
      reuseExistingServer: false,
      timeout: 15 * 60 * 1000,
      stdout: "pipe",
    },
  ],
});
