// @vitest-environment node
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";

import { normalizeTeamDomain, sameEmail, verifyAccessToken } from "@/lib/cloudflare-access";

const teamDomain = "https://cityfashion.cloudflareaccess.com";
const audience = "test-aud-tag";
const adminEmail = "owner@example.com";

let privateKey: CryptoKey;
let jwks: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const publicJwk = { ...(await exportJWK(pair.publicKey)), kid: "test-key", alg: "RS256" };
  jwks = createLocalJWKSet({ keys: [publicJwk] });
});

function token(overrides: { email?: string; aud?: string; iss?: string; expiresIn?: string | number } = {}) {
  return new SignJWT({ email: overrides.email ?? adminEmail })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(overrides.iss ?? teamDomain)
    .setAudience(overrides.aud ?? audience)
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? "1h")
    .sign(privateKey);
}

const config = () => ({ teamDomain, audience, adminEmail, jwks });

describe("Cloudflare Access token check", () => {
  it("accepts a valid token for the owner", async () => {
    await expect(verifyAccessToken(await token(), config())).resolves.toEqual({ email: adminEmail });
  });

  it("matches the owner email without caring about case", async () => {
    await expect(verifyAccessToken(await token({ email: "Owner@Example.com" }), config())).resolves.toEqual({
      email: "Owner@Example.com",
    });
  });

  it("rejects a missing token", async () => {
    await expect(verifyAccessToken(null, config())).resolves.toBeNull();
    await expect(verifyAccessToken("", config())).resolves.toBeNull();
    await expect(verifyAccessToken("not-a-jwt", config())).resolves.toBeNull();
  });

  it("rejects a token for another Access application", async () => {
    await expect(verifyAccessToken(await token({ aud: "other-app" }), config())).resolves.toBeNull();
  });

  it("rejects a token from another Access team", async () => {
    await expect(
      verifyAccessToken(await token({ iss: "https://someone-else.cloudflareaccess.com" }), config()),
    ).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired = await token({ expiresIn: Math.floor(Date.now() / 1000) - 60 });
    await expect(verifyAccessToken(expired, config())).resolves.toBeNull();
  });

  it("rejects a valid token for someone who is not the owner", async () => {
    await expect(verifyAccessToken(await token({ email: "staff@example.com" }), config())).resolves.toBeNull();
  });

  it("rejects everything when Access is not configured", async () => {
    const valid = await token();
    await expect(verifyAccessToken(valid, { ...config(), audience: "" })).resolves.toBeNull();
    await expect(verifyAccessToken(valid, { ...config(), adminEmail: " " })).resolves.toBeNull();
    await expect(verifyAccessToken(valid, { ...config(), teamDomain: "" })).resolves.toBeNull();
  });

  it("normalizes team domain and compares emails safely", () => {
    expect(normalizeTeamDomain("cityfashion.cloudflareaccess.com/")).toBe(teamDomain);
    expect(normalizeTeamDomain(teamDomain)).toBe(teamDomain);
    expect(sameEmail("A@B.com", " a@b.com ")).toBe(true);
    expect(sameEmail(null, "a@b.com")).toBe(false);
    expect(sameEmail("a@b.com", "   ")).toBe(false);
  });
});
