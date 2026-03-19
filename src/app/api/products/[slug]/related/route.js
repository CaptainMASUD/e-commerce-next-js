// src/app/api/products/[slug]/related/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";

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
  galleryImages: 1,

  isNew: 1,
  isTrending: 1,

  tags: 1,
  specifications: 1,
  highlights: 1,

  createdAt: 1,
});

/* -------------------- small utils -------------------- */

function toInt(v, fallback) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
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

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function minNumber(list, fallback = 0) {
  const nums = safeArray(list).filter((x) => isNum(x) && x >= 0);
  if (!nums.length) return fallback;
  return Math.min(...nums);
}

/* -------------------- media helpers -------------------- */

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

function toSafeImages(images) {
  return safeArray(images)
    .map((img) => toSafeImage(img))
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
    const activeVariants = safeArray(product.variants).filter((v) => v?.isActive !== false);

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
    const activeVariants = safeArray(product.variants).filter((v) => v?.isActive !== false);

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
    const activeVariants = safeArray(product.variants).filter((v) => v?.isActive !== false);

    return activeVariants.reduce((sum, v) => {
      const qty = isNum(v?.stockQty) ? v.stockQty : 0;
      return sum + Math.max(qty, 0);
    }, 0);
  }

  return Math.max(toNumberOr(0, product.stockQty), 0);
}

/* -------------------- spec helpers -------------------- */

function toSafeSpecification(spec) {
  if (!spec || typeof spec !== "object") return null;

  const key = normalizeString(spec.key).toLowerCase();
  const label = normalizeString(spec.label);
  if (!key || !label) return null;

  let value = spec.value;

  if (Array.isArray(value)) {
    value = value.map((v) => normalizeString(v)).filter(Boolean);
  } else if (typeof value === "boolean") {
    value = value;
  } else if (typeof value === "number") {
    value = value;
  } else {
    value = normalizeString(value);
  }

  const valueType = normalizeString(spec.valueType || "text").toLowerCase();

  return {
    key,
    label,
    value,
    valueType: ["text", "number", "boolean", "list"].includes(valueType) ? valueType : "text",
    unit: normalizeString(spec.unit),
    isFilterable: !!spec.isFilterable,
    isComparable: spec.isComparable !== false,
    isHighlighted: !!spec.isHighlighted,
    order: typeof spec.order === "number" ? spec.order : 0,
  };
}

function toSafeSpecifications(specs) {
  return safeArray(specs)
    .map((s) => toSafeSpecification(s))
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/* -------------------- variant helpers -------------------- */

function normalizeVariantAttributes(attributes) {
  if (!attributes || typeof attributes !== "object") return {};

  const entries =
    attributes instanceof Map ? Array.from(attributes.entries()) : Object.entries(attributes);

  const out = {};

  for (const [key, value] of entries) {
    const k = normalizeString(key).toLowerCase();
    const v = normalizeString(value);
    if (!k || !v) continue;
    out[k] = v;
  }

  return out;
}

function getCombinationKey(attributes) {
  const attrs = normalizeVariantAttributes(attributes);
  const sortedKeys = Object.keys(attrs).sort();

  return sortedKeys.map((k) => `${k}:${attrs[k]}`).join("|");
}

function toSafeVariantSummary(variant, index = 0) {
  if (!variant || typeof variant !== "object") return null;

  const attributes = normalizeVariantAttributes(variant.attributes);
  const images = toSafeImages(variant.images);
  const price = isNum(variant.price) ? variant.price : null;
  const salePrice = isNum(variant.salePrice) ? variant.salePrice : null;
  const finalPrice =
    typeof salePrice === "number" && salePrice >= 0
      ? salePrice
      : typeof price === "number"
        ? price
        : 0;

  return {
    id: normalizeString(variant.barcode) || `variant_${index + 1}`,
    barcode: normalizeString(variant.barcode),
    attributes,
    combinationKey: getCombinationKey(attributes),
    price,
    salePrice,
    finalPrice,
    stockQty: Math.max(toNumberOr(0, variant.stockQty), 0),
    isActive: variant.isActive !== false,
    inStock: Math.max(toNumberOr(0, variant.stockQty), 0) > 0,
    images,
    primaryImage: images[0] || null,
  };
}

function buildOptionDefinitionsFromVariants(variants) {
  const map = new Map();

  for (const variant of safeArray(variants)) {
    const attrs = normalizeVariantAttributes(variant?.attributes);

    for (const [key, value] of Object.entries(attrs)) {
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: key
            .split("_")
            .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
            .join(" "),
          values: new Set(),
        });
      }

      map.get(key).values.add(value);
    }
  }

  return Array.from(map.values()).map((item) => ({
    key: item.key,
    label: item.label,
    values: Array.from(item.values),
  }));
}

function buildAvailableCombinations(variants) {
  return safeArray(variants)
    .filter((v) => v?.isActive !== false)
    .map((v) => ({
      attributes: normalizeVariantAttributes(v.attributes),
      combinationKey: getCombinationKey(v.attributes),
      stockQty: Math.max(toNumberOr(0, v.stockQty), 0),
      inStock: Math.max(toNumberOr(0, v.stockQty), 0) > 0,
      barcode: normalizeString(v.barcode),
    }));
}

function buildAvailableOptionsMatrix(variants) {
  const matrix = {};
  const active = safeArray(variants).filter((v) => v?.isActive !== false);

  for (const variant of active) {
    const attrs = normalizeVariantAttributes(variant.attributes);

    for (const [key, value] of Object.entries(attrs)) {
      if (!matrix[key]) matrix[key] = {};
      if (!matrix[key][value]) matrix[key][value] = { total: 0, inStock: 0 };

      matrix[key][value].total += 1;
      if (Math.max(toNumberOr(0, variant.stockQty), 0) > 0) {
        matrix[key][value].inStock += 1;
      }
    }
  }

  return matrix;
}

/* -------------------- route -------------------- */

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

    const includeVariants = ["1", "true", "yes"].includes(
      String(searchParams.get("includeVariants") || "").trim().toLowerCase()
    );

    const includeSpecs = ["1", "true", "yes"].includes(
      String(searchParams.get("includeSpecs") || "").trim().toLowerCase()
    );

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
              ? {
                  $size: {
                    $setIntersection: [{ $ifNull: ["$tags", []] }, currentTags],
                  },
                }
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

          _new: { $cond: [{ $eq: ["$isNew", true] }, 1, 0] },
          _trending: { $cond: [{ $eq: ["$isTrending", true] }, 1, 0] },
        },
      },
      {
        $sort: {
          _sameSubcategory: -1,
          _sameBrand: -1,
          _tagMatchCount: -1,
          _trending: -1,
          _new: -1,
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

      const finalPrice = getProductFinalPrice(p);
      const normalPrice = getProductNormalPrice(p, finalPrice);
      const hasDiscount = finalPrice > 0 && normalPrice > 0 && finalPrice < normalPrice;
      const availableStock = isNum(p.availableStock) ? p.availableStock : getAvailableStock(p);

      const variantSummaries =
        productType === "variable"
          ? safeArray(p.variants)
              .map((v, i) => toSafeVariantSummary(v, i))
              .filter(Boolean)
          : [];

      const optionDefinitions =
        productType === "variable" ? buildOptionDefinitionsFromVariants(variantSummaries) : [];

      const availableCombinations =
        productType === "variable" ? buildAvailableCombinations(variantSummaries) : [];

      const availableOptionsMatrix =
        productType === "variable" ? buildAvailableOptionsMatrix(variantSummaries) : {};

      const baseProduct = {
        _id: p._id,
        name: p.title || "",
        title: p.title || "",
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
        galleryImages: toSafeImages(p.galleryImages),

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
      };

      if (includeSpecs) {
        baseProduct.specifications = toSafeSpecifications(p.specifications);
        baseProduct.highlights = safeArray(p.highlights)
          .map((x) => normalizeString(x))
          .filter(Boolean);
      }

      if (includeVariants && productType === "variable") {
        baseProduct.optionDefinitions = optionDefinitions;
        baseProduct.availableOptionsMatrix = availableOptionsMatrix;
        baseProduct.availableCombinations = availableCombinations;
        baseProduct.variants = variantSummaries;
      }

      return baseProduct;
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