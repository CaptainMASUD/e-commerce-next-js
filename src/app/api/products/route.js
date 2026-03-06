// src/app/api/products/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";
import Category from "@/models/category.model";

export const dynamic = "force-dynamic";

/* -------------------- selection -------------------- */

const pickListFields = () => ({
  title: 1,
  slug: 1,
  category: 1,
  subcategory: 1,
  brand: 1,

  barcode: 1,

  price: 1,
  salePrice: 1,

  productType: 1,
  stockQty: 1,
  variants: 1,

  primaryImage: 1,

  isNew: 1,
  isTrending: 1,

  tags: 1,
  createdAt: 1,
});

/* -------------------- small utils -------------------- */

function toInt(v, fallback) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toObjId(v) {
  const raw = String(v ?? "").trim();
  return mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null;
}

function isNum(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function minNumber(list, fallback = 0) {
  const nums = (Array.isArray(list) ? list : []).filter((x) => isNum(x) && x >= 0);
  if (!nums.length) return fallback;
  return Math.min(...nums);
}

/* -------------------- category helpers -------------------- */

async function resolveCategoryBySlug(categorySlug) {
  if (!categorySlug) return null;
  const slug = String(categorySlug).trim().toLowerCase();
  if (!slug) return null;

  const cat = await Category.findOne({ slug, isActive: { $ne: false } })
    .select("_id name slug subcategories")
    .lean();

  return cat || null;
}

function findSubIdInCategory(cat, subSlug) {
  if (!cat || !subSlug) return null;
  const s = String(subSlug).trim().toLowerCase();
  if (!s) return null;

  const subs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
  const found = subs.find((x) => String(x?.slug || "").trim().toLowerCase() === s);

  return found?._id || null;
}

async function resolveCategoryBySubSlug(subSlug) {
  if (!subSlug) return null;
  const s = String(subSlug).trim().toLowerCase();
  if (!s) return null;

  const cat = await Category.findOne({
    isActive: { $ne: false },
    "subcategories.slug": s,
  })
    .select("_id name slug subcategories")
    .lean();

  return cat || null;
}

/* -------------------- route -------------------- */

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const q = searchParams.get("q");
    const sort = (searchParams.get("sort") || "latest").trim().toLowerCase();
    const only = (searchParams.get("only") || "").trim().toLowerCase();
    const inStock = (searchParams.get("inStock") || "").trim();

    // slug params
    const categorySlug = searchParams.get("categorySlug");
    const subSlug = searchParams.get("subSlug");

    const limit = Math.min(toInt(searchParams.get("limit"), 24), 100);
    const page = Math.max(toInt(searchParams.get("page"), 1), 1);
    const skip = (page - 1) * limit;

    const filter = {};

    /* ---------- category/subcategory resolving ---------- */
    let resolvedCategory = null;

    if (categorySlug) {
      resolvedCategory = await resolveCategoryBySlug(categorySlug);
      if (!resolvedCategory) {
        return NextResponse.json({ success: true, page, limit, products: [] }, { status: 200 });
      }

      const catId = toObjId(resolvedCategory._id);
      if (!catId) return NextResponse.json({ success: true, page, limit, products: [] }, { status: 200 });

      filter.category = catId;

      if (subSlug) {
        const subId = findSubIdInCategory(resolvedCategory, subSlug);
        if (!subId) {
          return NextResponse.json({ success: true, page, limit, products: [] }, { status: 200 });
        }
        filter.subcategory = subId;
      }
    } else if (subSlug) {
      resolvedCategory = await resolveCategoryBySubSlug(subSlug);
      if (!resolvedCategory) {
        return NextResponse.json({ success: true, page, limit, products: [] }, { status: 200 });
      }

      const catId = toObjId(resolvedCategory._id);
      if (!catId) return NextResponse.json({ success: true, page, limit, products: [] }, { status: 200 });

      filter.category = catId;

      const subId = findSubIdInCategory(resolvedCategory, subSlug);
      if (subId) filter.subcategory = subId;
    } else if (category) {
      const raw = String(category).trim();
      if (mongoose.Types.ObjectId.isValid(raw)) {
        filter.category = toObjId(raw);
      } else {
        const cat = await resolveCategoryBySlug(raw);
        if (cat) filter.category = toObjId(cat._id);
      }
    }

    /* ---------- brand (ObjectId in model) ---------- */
    if (brand) {
      const b = toObjId(brand);
      if (b) filter.brand = b;
      // if not valid ObjectId, ignore (otherwise it will match nothing)
    }

    /* ---------- text search ---------- */
    if (q) filter.$text = { $search: String(q) };

    /* ---------- pipeline for ordering ---------- */
    const pipeline = [{ $match: filter }];

    pipeline.push({
      $addFields: {
        _new: { $cond: [{ $eq: ["$isNew", true] }, 1, 0] },
        _trending: { $cond: [{ $eq: ["$isTrending", true] }, 1, 0] },

        // ✅ effective selling price for sorting:
        // simple: salePrice ?? price
        // variable: MIN(active variants (salePrice ?? price))
        _effPrice: {
          $cond: [
            { $eq: ["$productType", "variable"] },
            {
              $let: {
                vars: {
                  activeVariants: {
                    $filter: {
                      input: { $ifNull: ["$variants", []] },
                      as: "v",
                      cond: { $ne: ["$$v.isActive", false] },
                    },
                  },
                },
                in: {
                  $cond: [
                    { $gt: [{ $size: "$$activeVariants" }, 0] },
                    {
                      $min: {
                        $map: {
                          input: "$$activeVariants",
                          as: "v",
                          in: { $ifNull: ["$$v.salePrice", "$$v.price"] },
                        },
                      },
                    },
                    { $ifNull: ["$salePrice", "$price"] },
                  ],
                },
              },
            },
            { $ifNull: ["$salePrice", "$price"] },
          ],
        },

        // ✅ in stock:
        // simple: stockQty > 0
        // variable: sum(active variants stockQty) > 0
        _inStock: {
          $cond: [
            { $eq: ["$productType", "variable"] },
            {
              $let: {
                vars: {
                  activeVariants: {
                    $filter: {
                      input: { $ifNull: ["$variants", []] },
                      as: "v",
                      cond: { $ne: ["$$v.isActive", false] },
                    },
                  },
                },
                in: {
                  $gt: [
                    {
                      $sum: {
                        $map: {
                          input: "$$activeVariants",
                          as: "v",
                          in: { $max: [{ $ifNull: ["$$v.stockQty", 0] }, 0] },
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
            { $gt: [{ $max: [{ $ifNull: ["$stockQty", 0] }, 0] }, 0] },
          ],
        },
      },
    });

    // only filters
    if (only === "new") pipeline.push({ $match: { _new: 1 } });
    if (only === "trending") pipeline.push({ $match: { _trending: 1 } });

    if (inStock === "1") pipeline.push({ $match: { _inStock: true } });
    if (inStock === "0") pipeline.push({ $match: { _inStock: false } });

    // sorting
    if (q) {
      pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
      pipeline.push({ $sort: { score: -1, _trending: -1, _new: -1, createdAt: -1 } });
    } else if (sort === "price_asc") {
      pipeline.push({ $sort: { _effPrice: 1, createdAt: -1 } });
    } else if (sort === "price_desc") {
      pipeline.push({ $sort: { _effPrice: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { _trending: -1, _new: -1, createdAt: -1 } });
    }

    pipeline.push({ $skip: skip }, { $limit: limit }, { $project: { _id: 1 } });

    const rows = await Product.aggregate(pipeline);
    const ids = rows.map((r) => r._id);

    if (!ids.length) {
      return NextResponse.json({ success: true, page, limit, products: [] });
    }

    // fetch full docs (virtuals included)
    const populated = await Product.find({ _id: { $in: ids } })
      .select(pickListFields())
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "brand", select: "name slug" })
      .lean({ virtuals: true });

    const byId = new Map(populated.map((p) => [String(p._id), p]));
    const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);

    // ✅ response based on YOUR model rules
    const products = ordered.map((p) => {
      const productType = p.productType || "simple";
      const isVariable = productType === "variable";

      // selling price (your model virtual does same logic)
      let finalPrice = 0;

      if (isVariable) {
        const vars = Array.isArray(p.variants) ? p.variants : [];
        const active = vars.filter((v) => v?.isActive !== false);
        const finals = active
          .map((v) => (isNum(v?.salePrice) ? v.salePrice : isNum(v?.price) ? v.price : null))
          .filter((n) => isNum(n) && n >= 0);

        finalPrice = finals.length ? Math.min(...finals) : (isNum(p.price) ? p.price : 0);
      } else {
        finalPrice = isNum(p.salePrice) ? p.salePrice : isNum(p.price) ? p.price : 0;
      }

      // regular price:
      // simple => product.price
      // variable => min(active variants.price)
      let normalPrice = 0;

      if (!isVariable) {
        normalPrice = isNum(p.price) ? p.price : 0;
      } else {
        const vars = Array.isArray(p.variants) ? p.variants : [];
        const active = vars.filter((v) => v?.isActive !== false);
        normalPrice = minNumber(
          active.map((v) => (isNum(v?.price) ? v.price : null)),
          finalPrice
        );
      }

      const hasDiscount = finalPrice > 0 && normalPrice > 0 && finalPrice < normalPrice;

      const availableStock = isNum(p.availableStock) ? p.availableStock : 0;

      return {
        _id: p._id,
        name: p.title,
        slug: p.slug,

        category: p.category,
        brand: p.brand,

        image: p.primaryImage?.url || "",

        // ✅ regular & selling
        normalPrice,
        finalPrice,

        // ✅ only when discounted
        discountPrice: hasDiscount ? finalPrice : null,

        // keep for compatibility (simple only)
        salePrice: isNum(p.salePrice) ? p.salePrice : null,

        isNew: !!p.isNew,
        isTrending: !!p.isTrending,

        productType,
        availableStock,
        inStockNow: availableStock > 0,

        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({ success: true, page, limit, products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}