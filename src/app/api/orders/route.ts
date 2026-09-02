import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { allProducts } from "@/lib/catalog";
import {
  normalizeSriLankaMobile,
  OrderValidationError,
} from "@/lib/order-domain";
import { createResendOrderNotifier } from "@/lib/order-email";
import {
  createSupabaseOrderRepository,
  OrderRateLimitError,
  submitOrder,
} from "@/lib/order-service";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";

const maxBodyBytes = 20 * 1024;
const recoveryMessage =
  "We could not place your order. Your items are still saved. Try again or message us on WhatsApp.";

function response(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function firstForwardedIp(request: Request) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function validationMessage(code: OrderValidationError["code"]) {
  if (code === "invalid_name") return "Enter your name";
  if (code === "invalid_phone") return "Enter a valid WhatsApp number";
  if (code === "style_unavailable") return "This style is no longer available to order";
  return "Check your order and try again";
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return response("Check your order and try again", 400);
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > maxBodyBytes) {
      return response("Check your order and try again", 400);
    }
    payload = JSON.parse(body);
  } catch {
    return response("Check your order and try again", 400);
  }

  const serviceEnv = getSupabaseServiceEnv();
  const rateLimitSalt = process.env.ORDER_RATE_LIMIT_SALT;
  if (!serviceEnv || !rateLimitSalt) return response(recoveryMessage, 503);

  try {
    const phoneValue =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? Reflect.get(payload, "whatsappNumber")
        : "";
    const normalizedPhone = normalizeSriLankaMobile(
      typeof phoneValue === "string" ? phoneValue : "",
    );
    const identityHash = createHash("sha256")
      .update(`${rateLimitSalt}|${firstForwardedIp(request)}|${normalizedPhone}`)
      .digest("hex");

    const receipt = await submitOrder(payload, {
      catalog: allProducts,
      identityHash,
      notifier: createResendOrderNotifier(),
      repository: createSupabaseOrderRepository(),
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return response(validationMessage(error.code), error.code === "style_unavailable" ? 409 : 400);
    }
    if (error instanceof OrderRateLimitError) {
      return response("Please wait before placing another order", 429);
    }

    console.error("Website order submission failed.", error);
    return response(recoveryMessage, 503);
  }
}
