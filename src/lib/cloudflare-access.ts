import { createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from "jose";

export type AccessConfig = {
  /** Full origin of the Access team, e.g. https://cityfashion.cloudflareaccess.com */
  teamDomain: string;
  /** Application Audience (AUD) tag from the Access application. */
  audience: string;
  /** The one email allowed into the dashboard. */
  adminEmail: string;
  /** Test hook; production fetches the team's public keys. */
  jwks?: JWTVerifyGetKey;
};

const jwksByTeam = new Map<string, JWTVerifyGetKey>();

function teamJwks(teamDomain: string) {
  let jwks = jwksByTeam.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", teamDomain));
    jwksByTeam.set(teamDomain, jwks);
  }
  return jwks;
}

export function normalizeTeamDomain(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function sameEmail(a: string | null | undefined, b: string | null | undefined) {
  const left = a?.trim().toLowerCase();
  const right = b?.trim().toLowerCase();
  return Boolean(left && right && left === right);
}

/**
 * Verifies the Cf-Access-Jwt-Assertion token Cloudflare Access adds to each request.
 * Returns the signed-in email when the token is valid for this app and owner, else null.
 */
export async function verifyAccessToken(
  token: string | null | undefined,
  config: AccessConfig,
): Promise<{ email: string } | null> {
  const teamDomain = normalizeTeamDomain(config.teamDomain);
  if (!token || !teamDomain || !config.audience.trim() || !config.adminEmail.trim()) return null;

  try {
    const { payload } = await jwtVerify(token, config.jwks ?? teamJwks(teamDomain), {
      issuer: teamDomain,
      audience: config.audience.trim(),
      algorithms: ["RS256"],
    });
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!sameEmail(email, config.adminEmail)) return null;
    return { email: email! };
  } catch {
    return null;
  }
}
