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

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.res;

    const admin = requireAdmin(auth);
    if (!admin.ok) return admin.res;

    await connectDB();

    const { searchParams } = new URL(req.url);

    const status = String(searchParams.get("status") || "").trim();
    const paymentStatus = String(searchParams.get("paymentStatus") || "").trim();
    const deliveryZone = String(searchParams.get("deliveryZone") || "").trim();
    const q = String(searchParams.get("q") || "").trim();

    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));
    const skip = Math.max(0, Number(searchParams.get("skip") || 0));

    const filter = {};

    if (status) {
      if (!ALLOWED_STATUS.includes(status)) {
        return jsonError("Invalid status", 400, { allowed: ALLOWED_STATUS });
      }
      filter.status = status;
    }

    if (paymentStatus) {
      if (!ALLOWED_PAYMENT_STATUS.includes(paymentStatus)) {
        return jsonError("Invalid paymentStatus", 400, {
          allowed: ALLOWED_PAYMENT_STATUS,
        });
      }
      filter.paymentStatus = paymentStatus;
    }

    if (deliveryZone) {
      if (!ALLOWED_DELIVERY_ZONE.includes(deliveryZone)) {
        return jsonError("Invalid deliveryZone", 400, {
          allowed: ALLOWED_DELIVERY_ZONE,
        });
      }
      filter.deliveryZone = deliveryZone;
    }

    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { orderNo: new RegExp(safe, "i") },
        { customerEmail: new RegExp(safe, "i") },
        { "shippingAddress.fullName": new RegExp(safe, "i") },
        { "shippingAddress.phone": new RegExp(safe, "i") },
        { "shippingAddress.email": new RegExp(safe, "i") },
        { "shippingAddress.city": new RegExp(safe, "i") },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("customer", "name email role status")
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({ ok: true, total, skip, limit, orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return jsonError("Failed to fetch orders", 500);
  }
}