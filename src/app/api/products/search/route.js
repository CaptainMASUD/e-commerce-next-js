import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";

export const dynamic = "force-dynamic";

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

function normalizeString(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function getStockStatus(stock) {
  return stock > 0 ? "in_stock" : "out_of_stock";
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

function getAvailableStock(product) {
  if (!product) return 0;

  if (product.productType === "variable") {
    const activeVariants = Array.isArray(product.variants)
      ? product.variants.filter((v) => v?.isActive !== false)
      : [];

    return activeVariants.reduce((sum, v) => {
      const qty = isNum(v?.stockQty) ? v.stockQty : 0;
      return sum + Math.max(qty, 0);
    }, 0);
  }

  return Math.max(toNumberOr(0, product.stockQty), 0);
}

const pickSearchFields = () => ({
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

async function resolveBrandBySlug(brandSlug) {
  if (!brandSlug) return null;

  const slug = String(brandSlug).trim().toLowerCase();
  if (!slug) return null;

  const brand = await Brand.findOne({ slug, isActive: { $ne: false } })
    .select("_id name slug")
    .lean();

  return brand || null;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const q = normalizeString(searchParams.get("q"));
    const brand = normalizeString(searchParams.get("brand"));
    const category = normalizeString(searchParams.get("category"));
    const categorySlug = normalizeString(searchParams.get("categorySlug"));
    const subSlug = normalizeString(searchParams.get("subSlug"));
    const inStock = normalizeString(searchParams.get("inStock")).toLowerCase();
    const sort = normalizeString(searchParams.get("sort"), "relevance").toLowerCase();

    const page = Math.max(toInt(searchParams.get("page"), 1), 1);
    const limit = Math.min(Math.max(toInt(searchParams.get("limit"), 12), 1), 50);
    const skip = (page - 1) * limit;

    if (!q) {
      return NextResponse.json({
        success: true,
        page,
        limit,
        total: 0,
        hasMore: false,
        products: [],
      });
    }

    const filter = {
      $text: { $search: q },
    };

    let resolvedCategory = null;

    if (categorySlug) {
      resolvedCategory = await resolveCategoryBySlug(categorySlug);

      if (!resolvedCategory) {
        return NextResponse.json({
          success: true,
          page,
          limit,
          total: 0,
          hasMore: false,
          products: [],
        });
      }

      const catId = toObjId(resolvedCategory._id);
      if (!catId) {
        return NextResponse.json({
          success: true,
          page,
          limit,
          total: 0,
          hasMore: false,
          products: [],
        });
      }

      filter.category = catId;

      if (subSlug) {
        const subId = findSubIdInCategory(resolvedCategory, subSlug);
        if (!subId) {
          return NextResponse.json({
            success: true,
            page,
            limit,
            total: 0,
            hasMore: false,
            products: [],
          });
        }
        filter.subcategory = subId;
      }
    } else if (subSlug) {
      resolvedCategory = await resolveCategoryBySubSlug(subSlug);

      if (!resolvedCategory) {
        return NextResponse.json({
          success: true,
          page,
          limit,
          total: 0,
          hasMore: false,
          products: [],
        });
      }

      const catId = toObjId(resolvedCategory._id);
      if (!catId) {
        return NextResponse.json({
          success: true,
          page,
          limit,
          total: 0,
          hasMore: false,
          products: [],
        });
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

    if (brand) {
      const brandId = toObjId(brand);

      if (brandId) {
        filter.brand = brandId;
      } else {
        const brandDoc = await resolveBrandBySlug(brand);
        if (brandDoc?._id) filter.brand = toObjId(brandDoc._id);
      }
    }

    const pipeline = [{ $match: filter }];

    pipeline.push({
      $addFields: {
        score: { $meta: "textScore" },
        _new: { $cond: [{ $eq: ["$isNew", true] }, 1, 0] },
        _trending: { $cond: [{ $eq: ["$isTrending", true] }, 1, 0] },

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

    if (inStock === "1" || inStock === "true") {
      pipeline.push({ $match: { _inStock: true } });
    }

    if (inStock === "0" || inStock === "false") {
      pipeline.push({ $match: { _inStock: false } });
    }

    if (sort === "price_asc") {
      pipeline.push({ $sort: { _effPrice: 1, score: -1, _trending: -1, _new: -1, createdAt: -1 } });
    } else if (sort === "price_desc") {
      pipeline.push({ $sort: { _effPrice: -1, score: -1, _trending: -1, _new: -1, createdAt: -1 } });
    } else if (sort === "latest") {
      pipeline.push({ $sort: { createdAt: -1, score: -1, _trending: -1, _new: -1 } });
    } else {
      pipeline.push({ $sort: { score: -1, _trending: -1, _new: -1, createdAt: -1 } });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const rowsPipeline = [...pipeline, { $skip: skip }, { $limit: limit }, { $project: { _id: 1, score: 1 } }];

    const [countRows, rows] = await Promise.all([
      Product.aggregate(countPipeline),
      Product.aggregate(rowsPipeline),
    ]);

    const total = countRows?.[0]?.total || 0;
    const ids = rows.map((r) => r._id);

    if (!ids.length) {
      return NextResponse.json({
        success: true,
        page,
        limit,
        total,
        hasMore: false,
        products: [],
      });
    }

    const populated = await Product.find({ _id: { $in: ids } })
      .select(pickSearchFields())
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "brand", select: "name slug image" })
      .lean({ virtuals: true });

    const byId = new Map(populated.map((p) => [String(p._id), p]));
    const scoreById = new Map(rows.map((r) => [String(r._id), r.score || 0]));
    const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);

    const products = ordered.map((p) => {
      const productType = p.productType || "simple";

      const finalPrice = getProductFinalPrice(p);
      const normalPrice = getProductNormalPrice(p, finalPrice);
      const hasDiscount = finalPrice > 0 && normalPrice > 0 && finalPrice < normalPrice;
      const availableStock = isNum(p.availableStock) ? p.availableStock : getAvailableStock(p);

      return {
        _id: p._id,
        name: p.title || "",
        slug: p.slug || "",

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
              image: p.brand.image || null,
            }
          : null,

        image: p.primaryImage?.url || "",
        primaryImage: toSafeImage(p.primaryImage),

        barcode: normalizeString(p.barcode),

        normalPrice,
        finalPrice,
        discountPrice: hasDiscount ? finalPrice : null,
        discountAmount: hasDiscount ? Math.max(normalPrice - finalPrice, 0) : 0,
        discountPercent:
          hasDiscount && normalPrice > 0
            ? Math.round(((normalPrice - finalPrice) / normalPrice) * 100)
            : 0,

        salePrice: isNum(p.salePrice) ? p.salePrice : null,

        isNew: !!p.isNew,
        isTrending: !!p.isTrending,

        productType,
        availableStock,
        stockStatus: getStockStatus(availableStock),
        inStockNow: availableStock > 0,

        tags: Array.isArray(p.tags) ? p.tags : [],
        createdAt: p.createdAt,
        searchScore: scoreById.get(String(p._id)) || 0,
      };
    });

    return NextResponse.json({
      success: true,
      q,
      page,
      limit,
      total,
      hasMore: skip + products.length < total,
      products,
    });
  } catch (error) {
    console.error("GET /api/products/search error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to search products",
      },
      { status: 500 }
    );
  }
}