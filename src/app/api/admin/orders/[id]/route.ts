import { NextResponse } from "next/server";

import { getAdminAccess } from "@/lib/admin-auth";
import { getOrdersDb } from "@/lib/cloudflare-bindings";
import {
  type AdminOrderPatch,
  AdminOrderNotFoundError,
  AdminOrderValidationError,
  orderStatuses,
  updateOrder,
} from "@/lib/order-admin";

const allowedKeys = new Set(["status", "deliveryChargeLkr", "privateNote"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccess();
  if (access.status !== "allowed") return NextResponse.json({ message: "Access denied" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body) || Object.keys(body).some((key) => !allowedKeys.has(key))) {
    return NextResponse.json({ message: "Check the changes and try again" }, { status: 400 });
  }

  if (
    ("status" in body &&
      (typeof body.status !== "string" ||
        !orderStatuses.includes(body.status as (typeof orderStatuses)[number]))) ||
    ("deliveryChargeLkr" in body &&
      body.deliveryChargeLkr !== null &&
      (typeof body.deliveryChargeLkr !== "number" ||
        !Number.isInteger(body.deliveryChargeLkr) ||
        body.deliveryChargeLkr < 0)) ||
    ("privateNote" in body &&
      body.privateNote !== null &&
      typeof body.privateNote !== "string")
  ) {
    return NextResponse.json({ message: "Check the changes and try again" }, { status: 400 });
  }

  const patch: AdminOrderPatch = {};
  if ("status" in body) patch.status = body.status as AdminOrderPatch["status"];
  if ("deliveryChargeLkr" in body) patch.deliveryChargeLkr = body.deliveryChargeLkr as number | null;
  if ("privateNote" in body) patch.privateNote = body.privateNote as string | null;

  try {
    const { id } = await params;
    return NextResponse.json(await updateOrder(getOrdersDb(), id, patch));
  } catch (error) {
    if (error instanceof AdminOrderValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof AdminOrderNotFoundError) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    console.error("Admin order update failed.", error);
    return NextResponse.json({ message: "Could not save changes" }, { status: 500 });
  }
}
