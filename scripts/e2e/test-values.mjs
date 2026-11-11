// Fake, test-only values for the local end-to-end run. None of these work outside this PC.
import path from "node:path";

export const workerPort = 8787;
export const mockPort = 8788;
export const workerUrl = `http://127.0.0.1:${workerPort}`;
export const mockUrl = `http://127.0.0.1:${mockPort}`;
export const persistDir = path.resolve(".wrangler", "e2e-state");
export const envFile = path.resolve(".wrangler", "e2e.env");

export const adminEmail = "owner@example.test";
export const accessAudience = "e2e-access-aud";

export const workerVars = {
  ADMIN_EMAIL: adminEmail,
  ORDER_NOTIFICATION_EMAIL: adminEmail,
  ORDER_EMAIL_FROM: "City Fashion Test <orders@example.test>",
  ORDER_RATE_LIMIT_SALT: "e2e-only-salt-not-a-secret",
  CF_ACCESS_TEAM_DOMAIN: mockUrl,
  CF_ACCESS_AUD: accessAudience,
  PAYMENT_INSTRUCTIONS: "Test bank transfer details",
};
