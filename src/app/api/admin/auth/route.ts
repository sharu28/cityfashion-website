import { NextRequest, NextResponse } from "next/server";

import { isAllowedAdminEmail } from "@/lib/admin-auth";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

type ResponseCookie = { name: string; value: string; options?: object };

function withCookies(response: NextResponse, cookiesToSet: ResponseCookie[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const allowedEmail = process.env.ADMIN_EMAIL;
  if (!allowedEmail?.trim()) {
    return NextResponse.json({ message: "Admin access is not configured" }, { status: 503 });
  }
  if (!body.email || !body.password) {
    return NextResponse.json({ message: "Enter email and password" }, { status: 400 });
  }
  if (!isAllowedAdminEmail(body.email, allowedEmail)) {
    return NextResponse.json({ message: "This account cannot access orders" }, { status: 403 });
  }

  const cookiesToSet: ResponseCookie[] = [];
  const client = createSupabaseRouteHandlerClient(request, (items) => cookiesToSet.push(...items));
  if (!client) {
    return NextResponse.json({ message: "Admin access is not configured" }, { status: 503 });
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: body.email.trim(),
    password: body.password,
  });
  if (error || !data.user) {
    return withCookies(
      NextResponse.json({ message: "Email or password is not correct" }, { status: 401 }),
      cookiesToSet,
    );
  }
  if (!isAllowedAdminEmail(data.user.email, allowedEmail)) {
    await client.auth.signOut();
    return withCookies(
      NextResponse.json({ message: "This account cannot access orders" }, { status: 403 }),
      cookiesToSet,
    );
  }

  return withCookies(NextResponse.json({ ok: true }), cookiesToSet);
}

export async function DELETE(request: NextRequest) {
  const cookiesToSet: ResponseCookie[] = [];
  const client = createSupabaseRouteHandlerClient(request, (items) => cookiesToSet.push(...items));
  if (!client) {
    return NextResponse.json({ message: "Admin access is not configured" }, { status: 503 });
  }

  await client.auth.signOut();
  return withCookies(NextResponse.json({ ok: true }), cookiesToSet);
}
