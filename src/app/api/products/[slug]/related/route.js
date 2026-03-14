// src/app/api/products/[slug]/related/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";

export const dynamic = "force-dynamic";

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

function toInt(v, fallback) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function isNum(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function normalizeString(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function minNumber(list, fallback = 0) {
  const nums = (Array.isArray(list) ? list : []).filter((x) => isNum(x) && x >= 0);
  if (!nums.length) return fallback;
  return Math.min(...nums);
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

export async function GET(req, context) {
  try {
    await connectDB();

    const resolvedParams =
      typeof context?.params?.then === "function"
        ? await context.params
        : context?.params;

    const slug = String(resolvedParams?.slug || "").trim().toLowerCase();

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Product slug is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(toInt(searchParams.get("limit"), 8), 1), 24);

    const currentProduct = await Product.findOne({ slug })
      .select("_id slug category subcategory brand tags productType")
      .lean();

    if (!currentProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    if (!currentProduct.category) {
      return NextResponse.json({ success: true, products: [] });
    }

    const baseMatch = {
      _id: { $ne: new mongoose.Types.ObjectId(currentProduct._id) },
      category: new mongoose.Types.ObjectId(currentProduct.category),
    };

    const currentSubcategory = currentProduct.subcategory
      ? new mongoose.Types.ObjectId(currentProduct.subcategory)
      : null;

    const currentBrand = currentProduct.brand
      ? new mongoose.Types.ObjectId(currentProduct.brand)
      : null;

    const currentTags = Array.isArray(currentProduct.tags)
      ? currentProduct.tags.map((t) => String(t).trim()).filter(Boolean)
      : [];

    const pipeline = [
      { $match: baseMatch },
      {
        $addFields: {
          _sameSubcategory: currentSubcategory
            ? { $cond: [{ $eq: ["$subcategory", currentSubcategory] }, 1, 0] }
            : 0,

          _sameBrand: currentBrand
            ? { $cond: [{ $eq: ["$brand", currentBrand] }, 1, 0] }
            : 0,

          _tagMatchCount:
            currentTags.length > 0
              ? { $size: { $setIntersection: [{ $ifNull: ["$tags", []] }, currentTags] } }
              : 0,

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
      },
      {
        $sort: {
          _sameSubcategory: -1,
          _sameBrand: -1,
          _tagMatchCount: -1,
          isTrending: -1,
          isNew: -1,
          _inStock: -1,
          createdAt: -1,
        },
      },
      { $limit: limit },
      { $project: { _id: 1 } },
    ];

    const rows = await Product.aggregate(pipeline);
    const ids = rows.map((r) => r._id);

    if (!ids.length) {
      return NextResponse.json({ success: true, products: [] });
    }

    const populated = await Product.find({ _id: { $in: ids } })
      .select(pickListFields())
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "brand", select: "name slug image" })
      .lean({ virtuals: true });

    const byId = new Map(populated.map((p) => [String(p._id), p]));
    const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);

    const products = ordered.map((p) => {
      const productType = p.productType || "simple";
      const isVariable = productType === "variable";

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

        normalPrice,
        finalPrice,
        discountPrice: hasDiscount ? finalPrice : null,
        discountAmount: hasDiscount ? Math.max(normalPrice - finalPrice, 0) : 0,
        discountPercent:
          hasDiscount && normalPrice > 0
            ? Math.round(((normalPrice - finalPrice) / normalPrice) * 100)
            : 0,

        isNew: !!p.isNew,
        isTrending: !!p.isTrending,

        productType,
        availableStock,
        inStockNow: availableStock > 0,

        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET /api/products/[slug]/related error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch related products",
      },
      { status: 500 }
    );
  }
}