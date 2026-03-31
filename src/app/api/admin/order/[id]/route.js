import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
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

const ALLOWED_PAYMENT_STATUS = ["unpaid", "paid"];
const ALLOWED_DELIVERY_ZONE = ["inside_dhaka", "outside_dhaka"];

function getShippingFee(deliveryZone) {
  return deliveryZone === "inside_dhaka" ? 70 : 130;
}

function calcSubtotal(items = []) {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const lineTotal = Number(item?.lineTotal);
    if (Number.isFinite(lineTotal)) return sum + lineTotal;

    const unitPrice = Number(item?.unitPrice || 0);
    const qty = Number(item?.qty || 0);
    return sum + unitPrice * qty;
  }, 0);
}

function canRestoreStock(oldStatus, newStatus) {
  const restoreStatuses = ["cancelled", "returned"];
  return !restoreStatuses.includes(oldStatus) && restoreStatuses.includes(newStatus);
}

async function restoreOrderStock(order) {
  if (!order?.items?.length) return;

  for (const item of order.items) {
    const qty = Math.max(0, Number(item?.qty || 0));
    if (!qty) continue;

    const productId = item?.product?._id || item?.product;
    const variantBarcode = String(item?.variantBarcode || "").trim();

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) continue;

    if (variantBarcode) {
      await Product.updateOne(
        {
          _id: productId,
          productType: "variable",
          "variants.barcode": variantBarcode,
        },
        {
          $inc: { "variants.$.stockQty": qty },
        }
      );
    } else {
      await Product.updateOne(
        {
          _id: productId,
          productType: "simple",
        },
        {
          $inc: { stockQty: qty },
        }
      );
    }
  }
}

async function getRouteId(params) {
  const resolvedParams = await params;
  return resolvedParams?.id;
}

export async function GET(req, context) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.res;

    const admin = requireAdmin(auth);
    if (!admin.ok) return admin.res;

    await connectDB();

    const id = await getRouteId(context?.params);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return jsonError("Invalid order id", 400);
    }

    const order = await Order.findById(id)
      .populate("customer", "name email role status")
      .populate("items.product")
      .lean();

    if (!order) {
      return jsonError("Order not found", 404);
    }

    return NextResponse.json({ ok: true, order }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/order/[id] error:", error);
    return jsonError("Failed to fetch order", 500);
  }
}

// PATCH /api/admin/order/[id]
// body: { status?, paymentStatus?, adminNote?, deliveryZone?, shippingAddress? }
export async function PATCH(req, context) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.res;

    const admin = requireAdmin(auth);
    if (!admin.ok) return admin.res;

    await connectDB();

    const id = await getRouteId(context?.params);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return jsonError("Invalid order id", 400);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const currentOrder = await Order.findById(id);

    if (!currentOrder) {
      return jsonError("Order not found", 404);
    }

    const update = {};

    if (body.status != null) {
      const nextStatus = String(body.status).trim();

      if (!ALLOWED_STATUS.includes(nextStatus)) {
        return jsonError("Invalid status", 400, { allowed: ALLOWED_STATUS });
      }

      update.status = nextStatus;
    }

    if (body.paymentStatus != null) {
      const nextPaymentStatus = String(body.paymentStatus).trim();

      if (!ALLOWED_PAYMENT_STATUS.includes(nextPaymentStatus)) {
        return jsonError("Invalid paymentStatus", 400, {
          allowed: ALLOWED_PAYMENT_STATUS,
        });
      }

      update.paymentStatus = nextPaymentStatus;
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
      update.shippingFee = getShippingFee(dz);
    }

    if (body.shippingAddress != null) {
      if (
        typeof body.shippingAddress !== "object" ||
        body.shippingAddress === null ||
        Array.isArray(body.shippingAddress)
      ) {
        return jsonError("Invalid shippingAddress", 400);
      }

      const shippingAddress = {};

      if (body.shippingAddress.fullName != null) {
        shippingAddress.fullName = String(body.shippingAddress.fullName).trim();
      }

      if (body.shippingAddress.phone != null) {
        shippingAddress.phone = String(body.shippingAddress.phone).trim();
      }

      if (body.shippingAddress.email != null) {
        shippingAddress.email = String(body.shippingAddress.email)
          .trim()
          .toLowerCase();
      }

      if (body.shippingAddress.city != null) {
        shippingAddress.city = String(body.shippingAddress.city).trim();
      }

      if (body.shippingAddress.addressLine1 != null) {
        shippingAddress.addressLine1 = String(
          body.shippingAddress.addressLine1
        ).trim();
      }

      for (const key of Object.keys(shippingAddress)) {
        update[`shippingAddress.${key}`] = shippingAddress[key];
      }
    }

    const nextStatus = update.status || currentOrder.status;

    if (canRestoreStock(currentOrder.status, nextStatus)) {
      await restoreOrderStock(currentOrder);
    }

    const subtotal = calcSubtotal(currentOrder.items);
    const discount = Math.max(0, Number(currentOrder.discount || 0));
    const shippingFee =
      typeof update.shippingFee === "number"
        ? update.shippingFee
        : Number(currentOrder.shippingFee || 0);

    update.subtotal = subtotal;
    update.discount = discount;
    update.total = Math.max(0, subtotal - discount + shippingFee);

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email role status")
      .populate("items.product")
      .lean();

    return NextResponse.json({ ok: true, order: updatedOrder }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/admin/order/[id] error:", error);
    return jsonError("Failed to update order", 500);
  }
}