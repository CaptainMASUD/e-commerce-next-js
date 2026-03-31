import { NextResponse } from "next/server";
import mongoose from "mongoose";
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
// Place order from cart and deduct stock atomically
export async function POST(req) {
  let session;

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

    session = await mongoose.startSession();

    let createdOrder = null;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: auth.user.id }).session(session).lean();

      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      const productIds = [...new Set(cart.items.map((item) => String(item.product)).filter(Boolean))];

      const products = await Product.find({ _id: { $in: productIds } })
        .select(
          [
            "_id",
            "title",
            "barcode",
            "price",
            "salePrice",
            "productType",
            "stockQty",
            "variants",
            "primaryImage",
          ].join(" ")
        )
        .session(session)
        .lean();

      const productMap = new Map(products.map((p) => [String(p._id), p]));
      const orderItems = [];

      for (const ci of cart.items) {
        const productId = String(ci.product || "");
        const product = productMap.get(productId);

        if (!product) {
          throw new Error("A product in your cart no longer exists");
        }

        const qty = Math.max(1, Number(ci.qty || 1));
        const variantBarcode = normalizeVariantBarcode(ci.variantBarcode);

        let unitPrice = 0;
        let productBarcode = String(product.barcode || "").trim();
        let image = String(product?.primaryImage?.url || "").trim();
        let title = String(ci.title || product.title || "").trim();

        if (product.productType === "variable") {
          if (!variantBarcode) {
            throw new Error(`Variant barcode is required for "${product.title}"`);
          }

          const matchedVariant = Array.isArray(product.variants)
            ? product.variants.find((v) => String(v?.barcode || "").trim() === variantBarcode)
            : null;

          if (!matchedVariant || matchedVariant.isActive === false) {
            throw new Error(`Selected variant is unavailable for "${product.title}"`);
          }

          const variantStock = Number(matchedVariant.stockQty || 0);
          if (variantStock < qty) {
            throw new Error(`Insufficient stock for "${product.title}" (${variantBarcode})`);
          }

          const variantPrice =
            typeof matchedVariant.salePrice === "number"
              ? matchedVariant.salePrice
              : typeof matchedVariant.price === "number"
                ? matchedVariant.price
                : typeof product.salePrice === "number"
                  ? product.salePrice
                  : Number(product.price || 0);

          unitPrice = Math.max(0, Number(ci.unitPrice || variantPrice || 0));
          productBarcode = String(product.barcode || "").trim();
          image =
            String(ci.image || "").trim() ||
            String(matchedVariant?.images?.[0]?.url || "").trim() ||
            String(product?.primaryImage?.url || "").trim();

          const stockUpdate = await Product.updateOne(
            {
              _id: product._id,
              productType: "variable",
              variants: {
                $elemMatch: {
                  barcode: variantBarcode,
                  isActive: true,
                  stockQty: { $gte: qty },
                },
              },
            },
            {
              $inc: { "variants.$.stockQty": -qty },
            },
            { session }
          );

          if (stockUpdate.modifiedCount !== 1) {
            throw new Error(`Insufficient stock for "${product.title}" (${variantBarcode})`);
          }
        } else {
          const currentStock = Number(product.stockQty || 0);

          if (currentStock < qty) {
            throw new Error(`Insufficient stock for "${product.title}"`);
          }

          const simplePrice =
            typeof product.salePrice === "number"
              ? product.salePrice
              : Number(product.price || 0);

          unitPrice = Math.max(0, Number(ci.unitPrice || simplePrice || 0));

          const stockUpdate = await Product.updateOne(
            {
              _id: product._id,
              productType: "simple",
              stockQty: { $gte: qty },
            },
            {
              $inc: { stockQty: -qty },
            },
            { session }
          );

          if (stockUpdate.modifiedCount !== 1) {
            throw new Error(`Insufficient stock for "${product.title}"`);
          }
        }

        const lineTotal = unitPrice * qty;

        orderItems.push({
          product: product._id,
          productBarcode,
          variantBarcode,
          title,
          image,
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
        throw new Error("Cart is empty");
      }

      const subtotal = calcSubtotal(orderItems);
      const total = Math.max(0, subtotal - discount + shippingFee);

      const [order] = await Order.create(
        [
          {
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
          },
        ],
        { session }
      );

      createdOrder = order;

      await Cart.updateOne({ user: auth.user.id }, { $set: { items: [] } }, { session });
    });

    return NextResponse.json({ ok: true, order: createdOrder }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customer/orders error:", error);

    const message = String(error?.message || "");

    if (
      message.includes("Cart is empty") ||
      message.includes("Insufficient stock") ||
      message.includes("Variant barcode is required") ||
      message.includes("unavailable") ||
      message.includes("no longer exists")
    ) {
      return jsonError(message, 400);
    }

    return jsonError("Failed to place order", 500);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}