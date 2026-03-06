// app/api/customer/cart/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model"; // adjust path/name if different
import { requireAuth } from "@/lib/auth";

// Helpers
function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

function normalizeVariantBarcode(v) {
  return (v || "").trim();
}

function sameItem(a, b) {
  // a,b: { product, variantBarcode }
  const ap = String(a.product);
  const bp = String(b.product);
  const av = normalizeVariantBarcode(a.variantBarcode);
  const bv = normalizeVariantBarcode(b.variantBarcode);
  return ap === bp && av === bv;
}

async function getOrCreateUserCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

// GET /api/customer/cart
// returns current user's cart
export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  await connectDB();

  const cart = await Cart.findOne({ user: auth.user.id })
    .populate("items.product")
    .lean();

  return NextResponse.json({ cart: cart || { user: auth.user.id, items: [] } });
}

// POST /api/customer/cart
// body: { action: "add"|"setQty"|"remove"|"clear", productId, variantBarcode?, qty?, snapshot? }
// snapshot optional: { title, image, unitPrice }
export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  await connectDB();

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const action = String(body.action || "").trim();

  // CLEAR cart
  if (action === "clear") {
    const cart = await getOrCreateUserCart(auth.user.id);
    cart.items = [];
    await cart.save();
    return NextResponse.json({ ok: true, cart });
  }

  const productId = body.productId;
  if (!productId) return jsonError("productId is required", 400);

  const variantBarcode = normalizeVariantBarcode(body.variantBarcode);
  const qtyRaw = body.qty;

  // validate product exists
  const product = await Product.findById(productId).select("_id title image price").lean();
  if (!product) return jsonError("Product not found", 404);

  const cart = await getOrCreateUserCart(auth.user.id);

  const key = { product: productId, variantBarcode };
  const idx = cart.items.findIndex((it) => sameItem(it, key));

  // ADD item (increase if exists)
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
      // keep snapshots fresh if provided
      cart.items[idx].title = title;
      cart.items[idx].image = image;
      cart.items[idx].unitPrice = unitPrice;
    } else {
      cart.items.push({
        product: productId,
        variantBarcode,
        qty,
        title,
        image,
        unitPrice,
      });
    }

    await cart.save();
    return NextResponse.json({ ok: true, cart });
  }

  // SET QTY (absolute)
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

  // REMOVE item
  if (action === "remove") {
    if (idx < 0) return jsonError("Item not found in cart", 404);

    cart.items.splice(idx, 1);
    await cart.save();
    return NextResponse.json({ ok: true, cart });
  }

  return jsonError("Invalid action. Use add | setQty | remove | clear", 400);
}