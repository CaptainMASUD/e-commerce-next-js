import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Cart from "@/models/cart.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { requireAuth } from "@/lib/auth";

function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

function normalizeVariantBarcode(v) {
  return String(v || "").trim();
}

function normalizeShippingAddress(input = {}) {
  return {
    fullName: String(input.fullName || "").trim(),
    phone: String(input.phone || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    city: String(input.city || "").trim(),
    addressLine1: String(input.addressLine1 || "").trim(),
  };
}

function validateShippingAddress(shippingAddress) {
  const requiredFields = ["fullName", "phone", "email", "city", "addressLine1"];

  for (const field of requiredFields) {
    if (!shippingAddress[field]) {
      return `${field} is required`;
    }
  }

  return null;
}

function normalizeDeliveryZone(value) {
  return String(value || "").trim();
}

function getShippingFee(deliveryZone) {
  return deliveryZone === "inside_dhaka" ? 70 : 130;
}

function calcSubtotal(items) {
  return items.reduce((sum, it) => sum + Number(it.lineTotal || 0), 0);
}

// GET /api/customer/orders
// List my orders
export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.res;

    await connectDB();

    const orders = await Order.find({ customer: auth.user.id })
      .sort({ createdAt: -1 })
      .select(
        [
          "orderNo",
          "status",
          "paymentStatus",
          "paymentMethod",
          "subtotal",
          "shippingFee",
          "discount",
          "total",
          "deliveryZone",
          "createdAt",
          "shippingAddress",
          "items",
        ].join(" ")
      )
      .lean();

    return NextResponse.json({ ok: true, orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/customer/orders error:", error);
    return jsonError("Failed to fetch orders", 500);
  }
}

// POST /api/customer/orders
// Place order from cart
// body: { shippingAddress, deliveryZone, noteFromCustomer?, discount? }
export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.res;

    await connectDB();

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    if (!body.shippingAddress || typeof body.shippingAddress !== "object") {
      return jsonError("shippingAddress is required", 400);
    }

    const normalizedShippingAddress = normalizeShippingAddress(body.shippingAddress);
    const addressError = validateShippingAddress(normalizedShippingAddress);

    if (addressError) {
      return jsonError(addressError, 400);
    }

    const deliveryZone = normalizeDeliveryZone(body.deliveryZone);

    if (!["inside_dhaka", "outside_dhaka"].includes(deliveryZone)) {
      return jsonError("Invalid deliveryZone", 400, {
        allowed: ["inside_dhaka", "outside_dhaka"],
      });
    }

    const discount = Number.isFinite(Number(body.discount))
      ? Math.max(0, Number(body.discount))
      : 0;

    const shippingFee = getShippingFee(deliveryZone);

    const cart = await Cart.findOne({ user: auth.user.id }).lean();

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return jsonError("Cart is empty", 400);
    }

    const productIds = cart.items.map((item) => item.product).filter(Boolean);

    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id title image price barcode")
      .lean();

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = [];

    for (const ci of cart.items) {
      const product = productMap.get(String(ci.product));

      if (!product) {
        return jsonError("A product in your cart no longer exists", 400);
      }

      const qty = Math.max(1, Number(ci.qty || 1));

      const unitPrice = Number.isFinite(Number(ci.unitPrice))
        ? Math.max(0, Number(ci.unitPrice))
        : Number.isFinite(Number(product.price))
        ? Math.max(0, Number(product.price))
        : 0;

      const lineTotal = unitPrice * qty;

      orderItems.push({
        product: product._id,
        productBarcode: String(product.barcode || "").trim(),
        variantBarcode: normalizeVariantBarcode(ci.variantBarcode),
        title: String(ci.title || product.title || "").trim(),
        image: String(ci.image || product.image || "").trim(),
        attributes:
          ci.attributes && typeof ci.attributes === "object" && !Array.isArray(ci.attributes)
            ? ci.attributes
            : {},
        qty,
        unitPrice,
        lineTotal,
      });
    }

    if (orderItems.length === 0) {
      return jsonError("Cart is empty", 400);
    }

    const subtotal = calcSubtotal(orderItems);
    const total = Math.max(0, subtotal - discount + shippingFee);

    const order = await Order.create({
      customer: auth.user.id,
      customerEmail: auth.user.email || normalizedShippingAddress.email,

      items: orderItems,
      shippingAddress: normalizedShippingAddress,
      deliveryZone,

      subtotal,
      shippingFee,
      discount,
      total,

      paymentMethod: "cod",
      paymentStatus: "unpaid",
      status: "pending",

      noteFromCustomer: String(body.noteFromCustomer || "").trim(),
    });

    await Cart.updateOne({ user: auth.user.id }, { $set: { items: [] } });

    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customer/orders error:", error);
    return jsonError("Failed to place order", 500);
  }
}
