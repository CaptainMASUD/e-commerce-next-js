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

function isNum(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function toNumberOr(defaultValue, value) {
  return isNum(value) ? value : defaultValue;
}

function getStockStatus(stock) {
  return stock > 0 ? "in_stock" : "out_of_stock";
}

function toSafeImage(image) {
  if (!image) return null;

  if (typeof image === "string") {
    const url = normalizeString(image);
    if (!url) return null;

    return {
      url,
      publicId: "",
      alt: "",
      order: 0,
    };
  }

  if (typeof image !== "object") return null;

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

function mergeImages(...groups) {
  const out = [];
  const seen = new Set();

  for (const group of groups) {
    const safeGroup = toSafeImages(group);
    for (const img of safeGroup) {
      const key = String(img?.url || "").trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(img);
    }
  }

  return out;
}

function normalizeAttributeKey(key) {
  const raw = String(key || "").trim().toLowerCase();
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

function getCombinationKey(attributes) {
  const attrs = normalizeAttributes(attributes);
  const keys = Object.keys(attrs).sort((a, b) => a.localeCompare(b));
  return keys.map((k) => `${k}:${attrs[k]}`).join("|");
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

    if (!activeVariants.length) return toNumberOr(0, product.price);

    const finals = activeVariants
      .map((v) => getVariantFinalPrice(v))
      .filter((n) => typeof n === "number" && !Number.isNaN(n) && n >= 0);

    return finals.length ? Math.min(...finals) : toNumberOr(0, product.price);
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

function buildOptionDefinitions(variants) {
  const map = new Map();

  for (const variant of variants) {
    const attrs = normalizeAttributes(variant?.attributes);

    for (const [key, value] of Object.entries(attrs)) {
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: key
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
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
    values: Array.from(item.values).sort((a, b) => a.localeCompare(b)),
  }));
}

function buildVariantOptionState(variants, selection = {}) {
  const safeSelection = normalizeAttributes(selection);
  const activeVariants = Array.isArray(variants)
    ? variants.filter((v) => v?.isActive !== false)
    : [];

  const attributeKeySet = new Set();
  for (const variant of activeVariants) {
    const attrs = normalizeAttributes(variant?.attributes);
    Object.keys(attrs).forEach((k) => attributeKeySet.add(k));
  }

  const attributeKeys = [...attributeKeySet].sort((a, b) => a.localeCompare(b));
  const allOptions = {};
  const availableOptions = {};
  const optionStatus = {};

  for (const key of attributeKeys) {
    const fullSet = new Set();
    const availableSet = new Set();
    optionStatus[key] = {};

    for (const variant of activeVariants) {
      const attrs = normalizeAttributes(variant?.attributes);
      const currentValue = attrs[key];
      if (currentValue) fullSet.add(currentValue);

      const selectionWithoutCurrent = { ...safeSelection };
      delete selectionWithoutCurrent[key];

      if (matchesSelection(attrs, selectionWithoutCurrent) && currentValue) {
        availableSet.add(currentValue);

        if (!optionStatus[key][currentValue]) {
          optionStatus[key][currentValue] = { total: 0, inStock: 0 };
        }
        optionStatus[key][currentValue].total += 1;

        if (toNumberOr(0, variant.stockQty) > 0) {
          optionStatus[key][currentValue].inStock += 1;
        }
      }
    }

    allOptions[key] = [...fullSet].sort((a, b) => a.localeCompare(b));
    availableOptions[key] = [...availableSet].sort((a, b) => a.localeCompare(b));
  }

  const matchingVariants = activeVariants.filter((variant) =>
    matchesSelection(variant?.attributes, safeSelection)
  );

  const exactMatch =
    Object.keys(safeSelection).length > 0
      ? matchingVariants.find((variant) => {
          const attrs = normalizeAttributes(variant?.attributes);
          const attrKeys = Object.keys(attrs).sort();
          const selectedKeys = Object.keys(safeSelection).sort();
          if (attrKeys.length !== selectedKeys.length) return false;
          return matchesSelection(attrs, safeSelection);
        }) || null
      : null;

  return {
    selection: safeSelection,
    attributeKeys,
    allOptions,
    availableOptions,
    optionStatus,
    matchingVariantCount: matchingVariants.length,
    matchingBarcodes: matchingVariants.map((v) => normalizeString(v?.barcode)).filter(Boolean),
    exactMatchBarcode: exactMatch ? normalizeString(exactMatch.barcode) : null,
    exactMatchExists: !!exactMatch,
    exactMatchInStock: exactMatch ? toNumberOr(0, exactMatch.stockQty) > 0 : false,
  };
}

function toSafeSpecification(spec, index = 0) {
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

  return {
    key,
    label,
    value,
    valueType: normalizeString(spec.valueType || "text").toLowerCase(),
    unit: normalizeString(spec.unit),
    group: normalizeString(spec.group),
    isFilterable: !!spec.isFilterable,
    isComparable: spec.isComparable !== false,
    isHighlighted: !!spec.isHighlighted,
    order: typeof spec.order === "number" ? spec.order : index,
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

    const selection = buildSelectionFromRequest(req);
    const url = new URL(req.url);

    const onlyMatchingVariants =
      String(url.searchParams.get("onlyMatchingVariants") || "").trim().toLowerCase() === "true";

    const product = await Product.findOne({ slug })
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image" })
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
    const normalPrice = getProductNormalPrice(product, finalPrice);
    const discountAmount = Math.max(normalPrice - finalPrice, 0);
    const discountPercent =
      normalPrice > 0 ? Math.round((discountAmount / normalPrice) * 100) : 0;

    const activeVariants = Array.isArray(product.variants)
      ? product.variants.filter((v) => v?.isActive !== false)
      : [];

    const safeVariants = activeVariants.map((v, index) => {
      const variantPrice = isNum(v?.price) ? v.price : null;
      const variantSalePrice =
        typeof v.salePrice === "number" && !Number.isNaN(v.salePrice) ? v.salePrice : null;
      const variantFinalPrice = getVariantFinalPrice(v);
      const variantDiscountAmount =
        typeof variantPrice === "number" ? Math.max(variantPrice - variantFinalPrice, 0) : 0;
      const variantDiscountPercent =
        typeof variantPrice === "number" && variantPrice > 0
          ? Math.round((variantDiscountAmount / variantPrice) * 100)
          : 0;

      const attributes = normalizeAttributes(v?.attributes);
      const stockQty = Math.max(toNumberOr(0, v.stockQty), 0);

      const images = mergeImages(
        Array.isArray(v?.images) ? v.images : [],
        v?.primaryImage ? [v.primaryImage] : [],
        Array.isArray(v?.galleryImages) ? v.galleryImages : []
      );

      return {
        id: normalizeString(v?.barcode) || `variant_${index + 1}`,
        barcode: normalizeString(v?.barcode),
        attributes,
        combinationKey: getCombinationKey(attributes),
        price: variantPrice,
        salePrice: variantSalePrice,
        finalPrice: variantFinalPrice,
        discountAmount: variantDiscountAmount,
        discountPercent: variantDiscountPercent,
        stockQty,
        stockStatus: getStockStatus(stockQty),
        inStockNow: stockQty > 0,
        images,
        primaryImage: images[0] || null,
        isActive: v?.isActive !== false,
      };
    });

    const optionDefinitions =
      product.productType === "variable" ? buildOptionDefinitions(safeVariants) : [];

    const variantState =
      product.productType === "variable"
        ? buildVariantOptionState(safeVariants, selection)
        : null;

    const visibleVariants =
      product.productType === "variable" && onlyMatchingVariants && variantState
        ? safeVariants.filter((variant) =>
            matchesSelection(variant.attributes, variantState.selection)
          )
        : safeVariants;

    const exactSelectedVariant =
      product.productType === "variable" && variantState?.exactMatchBarcode
        ? safeVariants.find(
            (variant) => normalizeString(variant.barcode) === variantState.exactMatchBarcode
          ) || null
        : null;

    const bestMatchedVariant =
      product.productType === "variable"
        ? safeVariants.find((variant) => matchesSelection(variant.attributes, selection)) || null
        : null;

    const mediaSourceVariant = exactSelectedVariant || bestMatchedVariant || null;

    const availableStock = toNumberOr(0, product.availableStock || getAvailableStock(product));

    const mergedSelectedMedia =
      product.productType === "variable"
        ? mergeImages(
            mediaSourceVariant?.images || [],
            product.primaryImage ? [product.primaryImage] : [],
            product.galleryImages || []
          )
        : mergeImages(
            product.primaryImage ? [product.primaryImage] : [],
            product.galleryImages || []
          );

    const responseProduct = {
      _id: product._id,
      title: product.title || "",
      slug: product.slug || "",

      brand: product.brand
        ? {
            _id: product.brand._id,
            name: product.brand.name || "",
            slug: product.brand.slug || "",
            image: product.brand.image || null,
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

      normalPrice,
      finalPrice,
      discountAmount,
      discountPercent,

      availableStock,
      stockStatus: getStockStatus(availableStock),
      inStockNow: availableStock > 0,

      isNew: !!product.isNew,
      isTrending: !!product.isTrending,

      primaryImage: toSafeImage(product.primaryImage),
      galleryImages: toSafeImages(product.galleryImages),

      tags: Array.isArray(product.tags) ? product.tags : [],

      specifications: Array.isArray(product.specifications)
        ? product.specifications
            .map((s, index) => toSafeSpecification(s, index))
            .filter(Boolean)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : [],

      highlights: Array.isArray(product.highlights)
        ? product.highlights.map((h) => normalizeString(h)).filter(Boolean)
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

      optionDefinitions,
      variants: visibleVariants,
      variantState: product.productType === "variable" ? variantState : null,
      selectedVariant: product.productType === "variable" ? exactSelectedVariant : null,
      previewVariant: product.productType === "variable" ? mediaSourceVariant : null,
      selectedMedia: mergedSelectedMedia,

      isSelectionAvailable:
        product.productType === "variable" && variantState
          ? variantState.exactMatchExists
          : true,

      isSelectionInStock:
        product.productType === "variable" && variantState
          ? variantState.exactMatchInStock
          : availableStock > 0,
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