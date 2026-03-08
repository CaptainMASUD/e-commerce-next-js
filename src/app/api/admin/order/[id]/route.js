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

const ALLOWED_PAYMENT_STATUS = ["unpaid"]; // extend later if you add paid/refunded etc

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

// PATCH /api/admin/order/:id
// body: { status?, paymentStatus?, adminNote? }
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

  const order = await Order.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();

  if (!order) return jsonError("Order not found", 404);

  return NextResponse.json({ ok: true, order });
}