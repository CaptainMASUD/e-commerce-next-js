import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";

export const dynamic = "force-dynamic";

/* -------------------- small utils -------------------- */

function normalizeString(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function escapeRegex(v = "") {
  return String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

function toNumberOr(defaultValue, value) {
  return isNum(value) ? value : defaultValue;
}

function toSafeImage(image) {
  if (!image || typeof image !== "object") return null;

  const url = normalizeString(image.url);
  if (!url) return null;

  return {
    url,
    publicId: normalizeString(image.publicId),
    alt: normalizeString(image.alt),
    order: typeof image.order === "number" ? image.order : 0,
  };
}

/* -------------------- pricing helpers -------------------- */

function getVariantFinalPrice(variant) {
  if (!variant) return 0;

  const price = toNumberOr(0, variant.price);
  const salePrice =
    typeof variant.salePrice === "number" && !Number.isNaN(variant.salePrice)
      ? variant.salePrice
      : null;

  return salePrice !== null ? salePrice : price;
}

function getProductFinalPrice(product) {
  if (!product) return 0;

  if (product.productType === "variable") {
    const activeVariants = Array.isArray(product.variants)
      ? product.variants.filter((v) => v?.isActive !== false)
      : [];

    if (!activeVariants.length) {
      return toNumberOr(0, product.price);
    }

    const finals = activeVariants
      .map((v) => getVariantFinalPrice(v))
      .filter((n) => typeof n === "number" && !Number.isNaN(n) && n >= 0);

    if (!finals.length) return toNumberOr(0, product.price);
    return Math.min(...finals);
  }

  const price = toNumberOr(0, product.price);
  const salePrice =
    typeof product.salePrice === "number" && !Number.isNaN(product.salePrice)
      ? product.salePrice
      : null;

  return salePrice !== null ? salePrice : price;
}

function getProductNormalPrice(product, finalPrice = 0) {
  if (!product) return 0;

  if (product.productType === "variable") {
    const activeVariants = Array.isArray(product.variants)
      ? product.variants.filter((v) => v?.isActive !== false)
      : [];

    const prices = activeVariants
      .map((v) => (isNum(v?.price) ? v.price : null))
      .filter((n) => isNum(n) && n >= 0);

    return prices.length ? Math.min(...prices) : finalPrice;
  }

  return isNum(product.price) ? product.price : 0;
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

/* -------------------- brand helpers -------------------- */

async function resolveBrandBySlug(brandSlug) {
  if (!brandSlug) return null;

  const slug = String(brandSlug).trim().toLowerCase();
  if (!slug) return null;

  const brand = await Brand.findOne({ slug, isActive: { $ne: false } })
    .select("_id name slug")
    .lean();

  return brand || null;
}

/* -------------------- field selection -------------------- */

const pickSuggestFields = () => ({
  title: 1,
  slug: 1,
  category: 1,
  brand: 1,
  barcode: 1,
  price: 1,
  salePrice: 1,
  productType: 1,
  variants: 1,
  primaryImage: 1,
  isNew: 1,
  isTrending: 1,
  tags: 1,
  createdAt: 1,
});

/* -------------------- route -------------------- */

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const q = normalizeString(searchParams.get("q"));
    const category = normalizeString(searchParams.get("category"));
    const categorySlug = normalizeString(searchParams.get("categorySlug"));
    const subSlug = normalizeString(searchParams.get("subSlug"));
    const brand = normalizeString(searchParams.get("brand"));
    const limit = Math.min(Math.max(toInt(searchParams.get("limit"), 6), 1), 10);

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        q,
        suggestions: [],
      });
    }

    const filter = {};

    /* ---------- category / subcategory resolving ---------- */
    let resolvedCategory = null;

    if (categorySlug) {
      resolvedCategory = await resolveCategoryBySlug(categorySlug);

      if (!resolvedCategory) {
        return NextResponse.json({ success: true, q, suggestions: [] });
      }

      const catId = toObjId(resolvedCategory._id);
      if (!catId) {
        return NextResponse.json({ success: true, q, suggestions: [] });
      }

      filter.category = catId;

      if (subSlug) {
        const subId = findSubIdInCategory(resolvedCategory, subSlug);
        if (!subId) {
          return NextResponse.json({ success: true, q, suggestions: [] });
        }
        filter.subcategory = subId;
      }
    } else if (subSlug) {
      resolvedCategory = await resolveCategoryBySubSlug(subSlug);

      if (!resolvedCategory) {
        return NextResponse.json({ success: true, q, suggestions: [] });
      }

      const catId = toObjId(resolvedCategory._id);
      if (!catId) {
        return NextResponse.json({ success: true, q, suggestions: [] });
      }

      filter.category = catId;

      const subId = findSubIdInCategory(resolvedCategory, subSlug);
      if (subId) filter.subcategory = subId;
    } else if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = toObjId(category);
      } else {
        const cat = await resolveCategoryBySlug(category);
        if (cat?._id) filter.category = toObjId(cat._id);
      }
    }

    /* ---------- brand resolving ---------- */
    if (brand) {
      const brandId = toObjId(brand);

      if (brandId) {
        filter.brand = brandId;
      } else {
        const brandDoc = await resolveBrandBySlug(brand);
        if (brandDoc?._id) filter.brand = toObjId(brandDoc._id);
      }
    }

    /* ---------- matching strategy ---------- */
    const escapedQ = escapeRegex(q);
    const startsWithRegex = new RegExp(`^${escapedQ}`, "i");
    const containsRegex = new RegExp(escapedQ, "i");

    const matchStage = {
      ...filter,
      $or: [
        { title: startsWithRegex },
        { title: containsRegex },
        { tags: containsRegex },
        { barcode: containsRegex },
        { "variants.barcode": containsRegex },
      ],
    };

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          _titleStarts: {
            $cond: [{ $regexMatch: { input: "$title", regex: startsWithRegex } }, 1, 0],
          },
          _titleContains: {
            $cond: [{ $regexMatch: { input: "$title", regex: containsRegex } }, 1, 0],
          },
          _barcodeMatch: {
            $cond: [
              {
                $or: [
                  { $regexMatch: { input: { $ifNull: ["$barcode", ""] }, regex: containsRegex } },
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: { $ifNull: ["$variants", []] },
                            as: "v",
                            cond: {
                              $regexMatch: {
                                input: { $ifNull: ["$$v.barcode", ""] },
                                regex: containsRegex,
                              },
                            },
                          },
                        },
                      },
                      0,
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
          _tagMatch: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ["$tags", []] },
                        as: "t",
                        cond: { $regexMatch: { input: "$$t", regex: containsRegex } },
                      },
                    },
                  },
                  0,
                ],
              },
              1,
              0,
            ],
          },
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
        },
      },
      {
        $sort: {
          _titleStarts: -1,
          _barcodeMatch: -1,
          _titleContains: -1,
          _tagMatch: -1,
          isTrending: -1,
          isNew: -1,
          createdAt: -1,
        },
      },
      { $limit: limit },
      { $project: { _id: 1 } },
    ];

    const rows = await Product.aggregate(pipeline);
    const ids = rows.map((r) => r._id);

    if (!ids.length) {
      return NextResponse.json({
        success: true,
        q,
        suggestions: [],
      });
    }

    const populated = await Product.find({ _id: { $in: ids } })
      .select(pickSuggestFields())
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "brand", select: "name slug" })
      .lean({ virtuals: true });

    const byId = new Map(populated.map((p) => [String(p._id), p]));
    const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);

    const suggestions = ordered.map((p) => {
      const finalPrice = getProductFinalPrice(p);
      const normalPrice = getProductNormalPrice(p, finalPrice);
      const hasDiscount = finalPrice > 0 && normalPrice > 0 && finalPrice < normalPrice;

      return {
        _id: p._id,
        name: p.title || "",
        slug: p.slug || "",
        image: p.primaryImage?.url || "",
        primaryImage: toSafeImage(p.primaryImage),

        category: p.category
          ? {
              _id: p.category._id,
              name: p.category.name || "",
              slug: p.category.slug || "",
            }
          : null,

        brand: p.brand
          ? {
              _id: p.brand._id,
              name: p.brand.name || "",
              slug: p.brand.slug || "",
            }
          : null,

        normalPrice,
        finalPrice,
        discountPrice: hasDiscount ? finalPrice : null,
        isNew: !!p.isNew,
        isTrending: !!p.isTrending,
      };
    });

    return NextResponse.json({
      success: true,
      q,
      suggestions,
    });
  } catch (error) {
    console.error("GET /api/products/search/suggest error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch suggestions",
      },
      { status: 500 }
    );
  }
}