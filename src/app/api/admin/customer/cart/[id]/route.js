// app/api/admin/customer/cart/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

function normalizeVariantBarcode(v) {
  return (v || "").trim();
}

function sameItem(a, b) {
  return String(a.product) === String(b.product) && normalizeVariantBarcode(a.variantBarcode) === normalizeVariantBarcode(b.variantBarcode);
}

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const admin = requireAdmin(auth);
  if (!admin.ok) return admin.res;

  await connectDB();

  const cartId = params?.id;
  if (!cartId) return jsonError("Cart id missing", 400);

  const cart = await Cart.findById(cartId)
    .populate("user", "name email role status")
    .populate("items.product")
    .lean();

  if (!cart) return jsonError("Cart not found", 404);

  return NextResponse.json({ cart });
}

// PATCH /api/admin/customer/cart/:id
// body: { action: "add"|"setQty"|"remove", productId, variantBarcode?, qty?, snapshot? }
export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const admin = requireAdmin(auth);
  if (!admin.ok) return admin.res;

  await connectDB();

  const cartId = params?.id;
  if (!cartId) return jsonError("Cart id missing", 400);

  const cart = await Cart.findById(cartId);
  if (!cart) return jsonError("Cart not found", 404);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const action = String(body.action || "").trim();
  const productId = body.productId;
  const variantBarcode = normalizeVariantBarcode(body.variantBarcode);
  const qtyRaw = body.qty;

  if (!["add", "setQty", "remove"].includes(action)) {
    return jsonError("Invalid action. Use add | setQty | remove", 400);
  }
  if (!productId) return jsonError("productId is required", 400);

  const product = await Product.findById(productId).select("_id title image price").lean();
  if (!product) return jsonError("Product not found", 404);

  const key = { product: productId, variantBarcode };
  const idx = cart.items.findIndex((it) => sameItem(it, key));

  if (action === "add") {
    const addQty = Number.isFinite(Number(qtyRaw)) ? Number(qtyRaw) : 1;
    const qty = Math.max(1, addQty);

    const snapshot = body.snapshot || {};
    const title = snapshot.title ?? product.title ?? "";
    const image = snapshot.image ?? product.image ?? "";
    const unitPrice = Number.isFinite(Number(snapshot.unitPrice))
      ? Math.max(0, Number(snapshot.unitPrice))
      : Number.isFinite(Number(product.price))
      ? Math.max(0, Number(product.price))
      : 0;

    if (idx >= 0) {
      cart.items[idx].qty = Math.max(1, (cart.items[idx].qty || 1) + qty);
      cart.items[idx].title = title;
      cart.items[idx].image = image;
      cart.items[idx].unitPrice = unitPrice;
    } else {
      cart.items.push({ product: productId, variantBarcode, qty, title, image, unitPrice });
    }

    await cart.save();
    return NextResponse.json({ ok: true, cart });
  }

  if (action === "setQty") {
    const qty = Number(qtyRaw);
    if (!Number.isFinite(qty)) return jsonError("qty must be a number", 400);

    if (idx < 0) return jsonError("Item not found in cart", 404);

    if (qty <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].qty = Math.max(1, qty);
    }

    await cart.save();
    return NextResponse.json({ ok: true, cart });
  }

  if (action === "remove") {
    if (idx < 0) return jsonError("Item not found in cart", 404);
    cart.items.splice(idx, 1);
    await cart.save();
    return NextResponse.json({ ok: true, cart });
  }
}

// DELETE /api/admin/customer/cart/:id -> clear cart
export async function DELETE(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const admin = requireAdmin(auth);
  if (!admin.ok) return admin.res;

  await connectDB();

  const cartId = params?.id;
  if (!cartId) return jsonError("Cart id missing", 400);

  const cart = await Cart.findById(cartId);
  if (!cart) return jsonError("Cart not found", 404);

  cart.items = [];
  await cart.save();

  return NextResponse.json({ ok: true, cart });
}