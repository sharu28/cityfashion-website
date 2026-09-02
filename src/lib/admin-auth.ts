import type { User } from "@supabase/supabase-js";

export function isAllowedAdminEmail(
  email: string | null | undefined,
  allowedEmail = process.env.ADMIN_EMAIL,
) {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedAllowedEmail = allowedEmail?.trim().toLowerCase();
  return Boolean(
    normalizedEmail &&
      normalizedAllowedEmail &&
      normalizedEmail === normalizedAllowedEmail,
  );
}

export type AdminAccess =
  | { status: "allowed"; user: User }
  | { status: "signed_out" }
  | { status: "forbidden" }
  | { status: "unconfigured" };

export async function getAdminAccess(): Promise<AdminAccess> {
  const allowedEmail = process.env.ADMIN_EMAIL;
  if (!allowedEmail?.trim()) return { status: "unconfigured" };

  const { createSupabaseServerComponentClient } = await import("@/lib/supabase/server");
  const client = await createSupabaseServerComponentClient();
  if (!client) return { status: "unconfigured" };

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { status: "signed_out" };
  if (!isAllowedAdminEmail(data.user.email, allowedEmail)) return { status: "forbidden" };

  return { status: "allowed", user: data.user };
}

export async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "allowed") return access.user;

  const { redirect } = await import("next/navigation");
  redirect("/admin/login");
}
