import "server-only";

import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

import { verifyAccessToken } from "@/lib/cloudflare-access";

export type AdminAccess =
  | { status: "allowed"; email: string }
  | { status: "denied" }
  | { status: "unconfigured" };

/**
 * The owner signs in through Cloudflare Access (email one-time code) before a request
 * reaches the Worker. We still check the Access token here so the dashboard stays
 * private even if the Access rule is ever removed by mistake.
 */
export async function getAdminAccess(): Promise<AdminAccess> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim() ?? "";
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN?.trim() ?? "";
  const audience = process.env.CF_ACCESS_AUD?.trim() ?? "";

  if (
    process.env.NODE_ENV === "development" &&
    process.env.ADMIN_DEV_BYPASS === "1" &&
    !audience
  ) {
    return { status: "allowed", email: adminEmail || "dev@localhost" };
  }

  if (!adminEmail || !teamDomain || !audience) return { status: "unconfigured" };

  const headerStore = await headers();
  const cookieStore = await cookies();
  const token =
    headerStore.get("cf-access-jwt-assertion") ?? cookieStore.get("CF_Authorization")?.value ?? null;

  const result = await verifyAccessToken(token, { teamDomain, audience, adminEmail });
  return result ? { status: "allowed", email: result.email } : { status: "denied" };
}

/** For admin pages: anyone who is not the owner sees the normal not-found page. */
export async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status !== "allowed") notFound();
  return access.email;
}
