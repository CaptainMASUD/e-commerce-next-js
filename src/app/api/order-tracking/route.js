import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Order from "@/models/order.model";

function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

function normalizeOrderNo(value) {
  return String(value || "").trim().toUpperCase();
}

// GET /api/order-tracking?orderNo=ORD-20260312-ABCD
export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const orderNo = normalizeOrderNo(searchParams.get("orderNo"));

  if (!orderNo) {
    return jsonError("orderNo is required", 400);
  }

  const order = await Order.findOne({ orderNo })
    .select(
      "orderNo status paymentStatus paymentMethod subtotal shippingFee discount total deliveryZone createdAt shippingAddress items"
    )
    .lean();

  if (!order) {
    return jsonError("Order not found", 404);
  }

  return NextResponse.json(
    {
      ok: true,
      tracking: {
        orderNo: order.orderNo,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        discount: order.discount,
        total: order.total,
        deliveryZone: order.deliveryZone,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        items: order.items,
      },
    },
    { status: 200 }
  );
}