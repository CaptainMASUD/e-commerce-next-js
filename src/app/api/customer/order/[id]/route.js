import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Order from "@/models/order.model";
import { requireAuth } from "@/lib/auth";

function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

// GET /api/customer/order/:id
export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  await connectDB();

  const orderId = params?.id;
  if (!orderId) {
    return jsonError("Order id missing", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return jsonError("Invalid order id", 400);
  }

  const order = await Order.findOne({
    _id: orderId,
    customer: auth.user.id,
  }).lean();

  if (!order) {
    return jsonError("Order not found", 404);
  }

  return NextResponse.json({ ok: true, order }, { status: 200 });
}