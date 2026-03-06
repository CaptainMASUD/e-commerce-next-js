// app/api/admin/order/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Order from "@/models/order.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const admin = requireAdmin(auth);
  if (!admin.ok) return admin.res;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "").trim();
  const paymentStatus = (searchParams.get("paymentStatus") || "").trim();
  const q = (searchParams.get("q") || "").trim();

  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));
  const skip = Math.max(0, Number(searchParams.get("skip") || 0));

  const filter = {};

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { orderNo: new RegExp(safe, "i") },
      { customerEmail: new RegExp(safe, "i") },
    ];
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("customer", "name email role status")
    .lean();

  const total = await Order.countDocuments(filter);

  return NextResponse.json({ total, skip, limit, orders });
}