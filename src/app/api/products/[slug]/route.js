// src/app/api/products/[slug]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";

export const dynamic = "force-dynamic";

const RESERVED_ATTRIBUTE_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "$where",
  "$expr",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$ne",
  "$in",
  "$nin",
  "$regex",
  "$or",
  "$and",
  "$nor",
  "$not",
  "$set",
  "$unset",
  "$push",
  "$pull",
  "$inc",
]);

function normalizeString(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
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

function toSafeImages(images) {
  if (!Array.isArray(images)) return [];

  const seen = new Set();

  return images
    .map((img) => toSafeImage(img))
    .filter((img) => {
      if (!img?.url) return false;
      const key = img.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function toNumberOr(defaultValue, value) {
  return typeof value === "number" && !Number.isNaN(value) ? value : defaultValue;
}

function normalizeAttributeKey(key) {
  const raw = String(key || "").trim();
  if (!raw) return "";
  if (raw.startsWith("$")) return "";
  if (RESERVED_ATTRIBUTE_KEYS.has(raw)) return "";
  return raw;
}

function normalizeAttributeValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw;
}

function normalizeAttributes(raw) {
  const src =
    raw instanceof Map
      ? Object.fromEntries(raw.entries())
      : raw && typeof raw === "object" && !Array.isArray(raw)
      ? raw
      : {};

  const out = {};

  for (const [k, v] of Object.entries(src)) {
    const key = normalizeAttributeKey(k);
    const value = normalizeAttributeValue(v);
    if (!key || !value) continue;
    out[key] = value;
  }

  return out;
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

function getProductDiscountAmount(product, finalPrice) {
  if (!product) return 0;

  if (product.productType === "variable") {
    return 0;
  }

  const price = toNumberOr(0, product.price);
  return Math.max(price - finalPrice, 0);
}

function getProductDiscountPercent(product, discountAmount) {
  if (!product) return 0;

  if (product.productType === "variable") {
    return 0;
  }

  const price = toNumberOr(0, product.price);
  if (price <= 0) return 0;

  return Math.round((discountAmount / price) * 100);
}

function getStockStatus(stock) {
  return stock > 0 ? "in_stock" : "out_of_stock";
}

function matchesSelection(attributes, selection) {
  const attrs = normalizeAttributes(attributes);
  const sel = normalizeAttributes(selection);

  for (const [key, value] of Object.entries(sel)) {
    if (attrs[key] !== value) return false;
  }

  return true;
}

function buildSelectionFromRequest(req) {
  const url = new URL(req.url);
  const selection = {};

  const selectionJson = url.searchParams.get("selection");
  if (selectionJson) {
    try {
      Object.assign(selection, normalizeAttributes(JSON.parse(selectionJson)));
    } catch {
      // ignore invalid selection json
    }
  }

  for (const [key, value] of url.searchParams.entries()) {
    if (!key.startsWith("attr_")) continue;
    const attrKey = normalizeAttributeKey(key.slice(5));
    const attrValue = normalizeAttributeValue(value);
    if (!attrKey || !attrValue) continue;
    selection[attrKey] = attrValue;
  }

  return selection;
}

function buildVariantOptionState(variants, selection = {}) {
  const safeSelection = normalizeAttributes(selection);
  const activeVariants = Array.isArray(variants) ? variants.filter((v) => v?.isActive !== false) : [];

  const attributeKeySet = new Set();
  for (const variant of activeVariants) {
    const attrs = normalizeAttributes(variant?.attributes);
    Object.keys(attrs).forEach((k) => attributeKeySet.add(k));
  }

  const attributeKeys = [...attributeKeySet].sort((a, b) => a.localeCompare(b));

  const allOptions = {};
  const availableOptions = {};

  for (const key of attributeKeys) {
    allOptions[key] = [];
    availableOptions[key] = [];
  }

  for (const key of attributeKeys) {
    const fullSet = new Set();
    const availableSet = new Set();

    for (const variant of activeVariants) {
      const attrs = normalizeAttributes(variant?.attributes);
      const currentValue = attrs[key];
      if (currentValue) fullSet.add(currentValue);

      const selectionWithoutCurrent = { ...safeSelection };
      delete selectionWithoutCurrent[key];

      if (matchesSelection(attrs, selectionWithoutCurrent) && currentValue) {
        availableSet.add(currentValue);
      }
    }

    allOptions[key] = [...fullSet].sort((a, b) => a.localeCompare(b));
    availableOptions[key] = [...availableSet].sort((a, b) => a.localeCompare(b));
  }

  const matchingVariants = activeVariants.filter((variant) =>
    matchesSelection(variant?.attributes, safeSelection)
  );

  const exactMatch =
    safeSelection && Object.keys(safeSelection).length
      ? matchingVariants.find((variant) => {
          const attrs = normalizeAttributes(variant?.attributes);
          const attrKeys = Object.keys(attrs);
          const selectedKeys = Object.keys(safeSelection);
          if (attrKeys.length !== selectedKeys.length) return false;
          return matchesSelection(attrs, safeSelection);
        }) || null
      : null;

  return {
    selection: safeSelection,
    attributeKeys,
    allOptions,
    availableOptions,
    matchingVariantCount: matchingVariants.length,
    matchingBarcodes: matchingVariants.map((v) => normalizeString(v?.barcode)).filter(Boolean),
    exactMatchBarcode: exactMatch ? normalizeString(exactMatch.barcode) : null,
  };
}

export async function GET(req, context) {
  try {
    await connectDB();

    const resolvedParams =
      typeof context?.params?.then === "function"
        ? await context.params
        : context?.params;

    const slug = String(resolvedParams?.slug || "")
      .trim()
      .toLowerCase();

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Product slug is required" },
        { status: 400 }
      );
    }

    const selection = buildSelectionFromRequest(req);
    const url = new URL(req.url);
    const onlyMatchingVariants =
      String(url.searchParams.get("onlyMatchingVariants") || "").trim().toLowerCase() === "true";

    const product = await Product.findOne({ slug })
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug" })
      .lean({ virtuals: true });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    let subcategoryObj = null;

    if (product.subcategory && Array.isArray(product.category?.subcategories)) {
      const subId = String(product.subcategory);
      subcategoryObj =
        product.category.subcategories.find((s) => String(s?._id) === subId) || null;
    }

    const finalPrice = getProductFinalPrice(product);
    const discountAmount = getProductDiscountAmount(product, finalPrice);
    const discountPercent = getProductDiscountPercent(product, discountAmount);

    const activeVariants = Array.isArray(product.variants)
      ? product.variants.filter((v) => v?.isActive !== false)
      : [];

    const safeVariants = activeVariants.map((v) => {
      const variantPrice = toNumberOr(0, v.price);
      const variantSalePrice =
        typeof v.salePrice === "number" && !Number.isNaN(v.salePrice)
          ? v.salePrice
          : null;
      const variantFinalPrice = getVariantFinalPrice(v);
      const variantDiscountAmount = Math.max(variantPrice - variantFinalPrice, 0);
      const variantDiscountPercent =
        variantPrice > 0
          ? Math.round((variantDiscountAmount / variantPrice) * 100)
          : 0;

      const attributes = normalizeAttributes(v?.attributes);
      const stockQty = toNumberOr(0, v.stockQty);

      return {
        barcode: normalizeString(v.barcode),
        attributes,
        price: variantPrice,
        salePrice: variantSalePrice,
        finalPrice: variantFinalPrice,
        discountAmount: variantDiscountAmount,
        discountPercent: variantDiscountPercent,
        stockStatus: getStockStatus(stockQty),
        inStockNow: stockQty > 0,
        images: toSafeImages(v.images),
        isActive: !!v.isActive,
      };
    });

    const variantState =
      product.productType === "variable"
        ? buildVariantOptionState(safeVariants, selection)
        : null;

    const visibleVariants =
      product.productType === "variable" && onlyMatchingVariants && variantState
        ? safeVariants.filter((variant) => matchesSelection(variant.attributes, variantState.selection))
        : safeVariants;

    const availableStock = toNumberOr(0, product.availableStock);

    const responseProduct = {
      _id: product._id,
      title: product.title || "",
      slug: product.slug || "",

      brand: product.brand
        ? {
            _id: product.brand._id,
            name: product.brand.name || "",
            slug: product.brand.slug || "",
          }
        : null,

      category: product.category
        ? {
            _id: product.category._id,
            name: product.category.name || "",
            slug: product.category.slug || "",
          }
        : null,

      subcategory: subcategoryObj
        ? {
            _id: subcategoryObj._id,
            name: subcategoryObj.name || "",
            slug: subcategoryObj.slug || "",
          }
        : null,

      productType: product.productType || "simple",

      barcode: product.barcode || "",

      price: toNumberOr(0, product.price),
      salePrice:
        typeof product.salePrice === "number" && !Number.isNaN(product.salePrice)
          ? product.salePrice
          : null,

      finalPrice,
      discountAmount,
      discountPercent,

      stockStatus: getStockStatus(availableStock),
      inStockNow: availableStock > 0,

      isNew: !!product.isNew,
      isTrending: !!product.isTrending,

      primaryImage: toSafeImage(product.primaryImage),
      galleryImages: toSafeImages(product.galleryImages),

      tags: Array.isArray(product.tags) ? product.tags : [],

      features: Array.isArray(product.features)
        ? product.features
            .map((f, index) => ({
              label: f?.label || "",
              value: f?.value || "",
              isKey: !!f?.isKey,
              order: typeof f?.order === "number" ? f.order : index,
              group: f?.group || "",
            }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : [],

      description: Array.isArray(product.description)
        ? product.description
            .map((d, index) => ({
              title: d?.title || "",
              details: d?.details || "",
              order: typeof d?.order === "number" ? d.order : index,
            }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : [],

      variants: visibleVariants,

      variantState: product.productType === "variable" ? variantState : null,
    };

    return NextResponse.json({
      success: true,
      product: responseProduct,
    });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}