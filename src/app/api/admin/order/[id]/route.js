import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Order from "@/models/order.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

const ALLOWED_STATUS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const ALLOWED_PAYMENT_STATUS = ["unpaid"];

const ALLOWED_DELIVERY_ZONE = ["inside_dhaka", "outside_dhaka"];

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const admin = requireAdmin(auth);
  if (!admin.ok) return admin.res;

  await connectDB();

  const { id } = await params;
  if (!id) return jsonError("Order id missing", 400);

  const order = await Order.findById(id)
    .populate("customer", "name email role status")
    .populate("items.product")
    .lean();

  if (!order) return jsonError("Order not found", 404);

  return NextResponse.json({ order });
}

// PATCH /api/admin/orders/:id
// body: { status?, paymentStatus?, adminNote?, deliveryZone?, shippingAddress? }
export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const admin = requireAdmin(auth);
  if (!admin.ok) return admin.res;

  await connectDB();

  const { id } = await params;
  if (!id) return jsonError("Order id missing", 400);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const update = {};

  if (body.status != null) {
    const s = String(body.status).trim();
    if (!ALLOWED_STATUS.includes(s)) {
      return jsonError("Invalid status", 400, { allowed: ALLOWED_STATUS });
    }
    update.status = s;
  }

  if (body.paymentStatus != null) {
    const ps = String(body.paymentStatus).trim();
    if (!ALLOWED_PAYMENT_STATUS.includes(ps)) {
      return jsonError("Invalid paymentStatus", 400, {
        allowed: ALLOWED_PAYMENT_STATUS,
      });
    }
    update.paymentStatus = ps;
  }

  if (body.adminNote != null) {
    update.adminNote = String(body.adminNote || "").trim();
  }

  if (body.deliveryZone != null) {
    const dz = String(body.deliveryZone).trim();
    if (!ALLOWED_DELIVERY_ZONE.includes(dz)) {
      return jsonError("Invalid deliveryZone", 400, {
        allowed: ALLOWED_DELIVERY_ZONE,
      });
    }
    update.deliveryZone = dz;
    update.shippingFee = dz === "inside_dhaka" ? 70 : 130;
  }

  if (body.shippingAddress != null && typeof body.shippingAddress === "object") {
    const shippingAddress = {};

    if (body.shippingAddress.fullName != null) {
      shippingAddress.fullName = String(body.shippingAddress.fullName).trim();
    }

    if (body.shippingAddress.phone != null) {
      shippingAddress.phone = String(body.shippingAddress.phone).trim();
    }

    if (body.shippingAddress.email != null) {
      shippingAddress.email = String(body.shippingAddress.email).trim().toLowerCase();
    }

    if (body.shippingAddress.city != null) {
      shippingAddress.city = String(body.shippingAddress.city).trim();
    }

    if (body.shippingAddress.addressLine1 != null) {
      shippingAddress.addressLine1 = String(body.shippingAddress.addressLine1).trim();
    }

    for (const key of Object.keys(shippingAddress)) {
      update[`shippingAddress.${key}`] = shippingAddress[key];
    }
  }

  const currentOrder = await Order.findById(id).lean();
  if (!currentOrder) return jsonError("Order not found", 404);

  const subtotal = typeof body.subtotal === "number" ? body.subtotal : currentOrder.subtotal;
  const discount = typeof body.discount === "number" ? body.discount : currentOrder.discount;
  const shippingFee =
    typeof update.shippingFee === "number" ? update.shippingFee : currentOrder.shippingFee;

  update.total = subtotal - discount + shippingFee;

  const order = await Order.findByIdAndUpdate(id, { $set: update }, { new: true })
    .populate("customer", "name email role status")
    .populate("items.product")
    .lean();

  return NextResponse.json({ ok: true, order });
}