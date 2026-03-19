// app/api/admin/products/[id]/route.js
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "@/utils/cloudinary";
import { requireAuth, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_PRODUCT_TYPE = new Set(["simple", "variable"]);
const ALLOWED_GALLERY_MODE = new Set(["replace", "append", "keep"]);

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

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

const LIMITS = {
  titleMax: 180,
  slugMax: 220,
  barcodeMax: 120,
  tagsMax: 60,
  tagLengthMax: 50,

  highlightsMax: 100,
  highlightLengthMax: 250,

  specificationKeyMax: 80,
  specificationLabelMax: 120,
  specificationUnitMax: 40,
  specificationsMax: 300,

  descriptionBlocksMax: 100,
  galleryImagesMax: 30,
  variantImagesMax: 10,
  variantsMax: 500,
  attributeKeyMax: 50,
  attributeValueMax: 120,
  attributesPerVariantMax: 20,
  uploadFileMaxBytes: 10 * 1024 * 1024,
};

// ---------- helpers ----------
function isValidObjectId(v) {
  return mongoose.Types.ObjectId.isValid(String(v || ""));
}

function toNumber(v, fallback = undefined) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v, fallback = undefined) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return fallback;
}

function normalizeString(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function safeJsonParse(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function badRequest(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

function validateTextLength(value, max, fieldName) {
  if (value == null) return null;
  const s = String(value);
  if (s.length > max) return `${fieldName} is too long. Max ${max} characters.`;
  return null;
}

function normalizeAttributeKey(key) {
  const raw = String(key || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.length > LIMITS.attributeKeyMax) return "";
  if (raw.startsWith("$")) return "";
  if (RESERVED_ATTRIBUTE_KEYS.has(raw)) return "";
  return raw;
}

function normalizeAttributeValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.slice(0, LIMITS.attributeValueMax);
}

function normalizeAttributes(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const out = {};
  let count = 0;

  for (const [k, v] of Object.entries(source)) {
    if (count >= LIMITS.attributesPerVariantMax) break;

    const key = normalizeAttributeKey(k);
    const value = normalizeAttributeValue(v);

    if (!key || !value) continue;

    out[key] = value;
    count += 1;
  }

  return out;
}

function getVariantAttrsObject(variant) {
  if (!variant) return {};
  if (variant.attributes instanceof Map) return Object.fromEntries(variant.attributes.entries());
  if (variant.attributes && typeof variant.attributes === "object" && !Array.isArray(variant.attributes)) {
    return variant.attributes;
  }
  return {};
}

function getAttributeSignature(attrs) {
  return Object.entries(attrs || {})
    .map(([k, v]) => [String(k).trim().toLowerCase(), String(v).trim()])
    .filter(([k, v]) => k && v)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("||");
}

function matchesSelection(variantAttrs, selection) {
  const attrs = normalizeAttributes(variantAttrs);
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
    const parsed = safeJsonParse(selectionJson, {});
    Object.assign(selection, normalizeAttributes(parsed));
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

function dedupeByUrl(images) {
  const seen = new Set();
  const out = [];
  for (const img of images || []) {
    const key = String(img?.url || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(img);
  }
  return out;
}

function normalizeImages(raw) {
  if (!Array.isArray(raw)) return [];
  return dedupeByUrl(
    raw
      .filter((img) => img && typeof img === "object" && img.url)
      .map((img, idx) => ({
        url: String(img.url).trim(),
        publicId: img.publicId ? String(img.publicId).trim() : "",
        alt: img.alt ? String(img.alt).trim() : "",
        order: typeof img.order === "number" ? img.order : idx,
      }))
  );
}

function normalizeDescriptionBlocks(raw, fallback = undefined) {
  if (raw === undefined) return fallback;
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, LIMITS.descriptionBlocksMax)
    .filter((b) => b && typeof b === "object")
    .map((b, idx) => ({
      title: normalizeString(b.title, ""),
      details: typeof b.details === "string" ? b.details : String(b.details ?? ""),
      order: Number.isFinite(Number(b.order)) ? Number(b.order) : idx,
    }))
    .filter((b) => b.title || (b.details && String(b.details).trim()))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeHighlights(raw, fallback = undefined) {
  if (raw === undefined) return fallback;
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .map((v) => v.slice(0, LIMITS.highlightLengthMax))
    ),
  ].slice(0, LIMITS.highlightsMax);
}

function normalizeSpecificationValue(value, valueType) {
  if (valueType === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  if (valueType === "boolean") {
    if (typeof value === "boolean") return value;
    const s = String(value).trim().toLowerCase();
    if (["true", "1", "yes"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
    return null;
  }

  if (valueType === "list") {
    if (Array.isArray(value)) {
      return [...new Set(value.map((v) => String(v ?? "").trim()).filter(Boolean))];
    }
    if (value === null || value === undefined) return [];
    return [...new Set(String(value).split(",").map((v) => v.trim()).filter(Boolean))];
  }

  return String(value ?? "").trim();
}

function normalizeSpecifications(raw, fallback = undefined) {
  if (raw === undefined) return fallback;
  if (!Array.isArray(raw)) return [];

  const cleaned = raw
    .slice(0, LIMITS.specificationsMax)
    .filter((s) => s && typeof s === "object")
    .map((s, idx) => {
      const valueType = ["text", "number", "boolean", "list"].includes(String(s.valueType || "text"))
        ? String(s.valueType || "text")
        : "text";

      const key = normalizeString(s.key).toLowerCase().slice(0, LIMITS.specificationKeyMax);
      const label = normalizeString(s.label).slice(0, LIMITS.specificationLabelMax);
      const value = normalizeSpecificationValue(s.value, valueType);

      return {
        key,
        label,
        value,
        valueType,
        unit: normalizeString(s.unit).slice(0, LIMITS.specificationUnitMax),
        isFilterable: toBool(s.isFilterable, false),
        isComparable: s.isComparable !== false,
        isHighlighted: toBool(s.isHighlighted, false),
        order: Number.isFinite(Number(s.order)) ? Number(s.order) : idx,
      };
    })
    .filter((s) => s.key && s.label)
    .filter((s) => {
      if (s.valueType === "list") return Array.isArray(s.value) && s.value.length > 0;
      if (s.valueType === "number" || s.valueType === "boolean") return s.value !== null;
      return String(s.value ?? "").trim() !== "";
    });

  const seen = new Set();
  const uniq = [];

  for (const s of cleaned) {
    const valueKey = Array.isArray(s.value) ? s.value.join("|").toLowerCase() : String(s.value).toLowerCase();
    const sig = `${s.key}||${valueKey}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    uniq.push(s);
  }

  return uniq.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeVariants(raw, fallback = undefined) {
  if (raw === undefined) return fallback;
  if (!Array.isArray(raw)) return [];

  return raw
    .slice(0, LIMITS.variantsMax)
    .filter((v) => v && typeof v === "object")
    .map((v) => ({
      barcode: normalizeString(v.barcode, "").slice(0, LIMITS.barcodeMax),
      attributes: normalizeAttributes(v.attributes),
      price: toNumber(v.price, undefined),
      salePrice: toNumber(v.salePrice, undefined),
      stockQty: Math.max(0, toNumber(v.stockQty, 0) ?? 0),
      images: normalizeImages(v.images).slice(0, LIMITS.variantImagesMax),
      isActive: toBool(v.isActive, true),
    }));
}

function normalizeTags(raw, fallback = undefined) {
  if (raw === undefined) return fallback;
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((t) => String(t).trim())
        .filter(Boolean)
        .map((t) => t.slice(0, LIMITS.tagLengthMax))
    ),
  ].slice(0, LIMITS.tagsMax);
}

function validateEnums(productType) {
  if (productType && !ALLOWED_PRODUCT_TYPE.has(productType)) {
    return "Invalid productType. Use: simple | variable";
  }
  return null;
}

function pluckPublicIds(product) {
  const ids = [
    product?.primaryImage?.publicId,
    ...(product?.galleryImages || []).map((i) => i?.publicId),
    ...(product?.variants || []).flatMap((v) => (v?.images || []).map((img) => img?.publicId)),
  ].filter(Boolean);

  return [...new Set(ids)];
}

function validateUploadedFile(file, label = "file") {
  if (!file) return null;

  if (typeof file.size === "number" && file.size > LIMITS.uploadFileMaxBytes) {
    return `${label} is too large. Max ${Math.floor(LIMITS.uploadFileMaxBytes / (1024 * 1024))}MB.`;
  }

  if (file.type && !ALLOWED_IMAGE_MIME.has(file.type)) {
    return `${label} must be one of: ${[...ALLOWED_IMAGE_MIME].join(", ")}`;
  }

  return null;
}

function validateImageCollections(product) {
  if (!product?.primaryImage?.url) return "primaryImage is required.";

  const galleryImages = Array.isArray(product.galleryImages) ? product.galleryImages : [];
  if (galleryImages.length > LIMITS.galleryImagesMax) {
    return `galleryImages limit exceeded. Max ${LIMITS.galleryImagesMax}.`;
  }

  const primaryUrl = String(product.primaryImage.url || "").trim().toLowerCase();
  const duplicatePrimaryInGallery = galleryImages.some(
    (img) => String(img?.url || "").trim().toLowerCase() === primaryUrl
  );
  if (duplicatePrimaryInGallery) {
    return "primaryImage should not be duplicated inside galleryImages.";
  }

  for (const [i, variant] of (product.variants || []).entries()) {
    const images = Array.isArray(variant?.images) ? variant.images : [];
    if (images.length > LIMITS.variantImagesMax) {
      return `Variant #${i + 1} exceeds max variant images (${LIMITS.variantImagesMax}).`;
    }
  }

  return null;
}

function validateVariableVariants(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return { ok: false, message: "productType=variable requires variants." };
  }

  if (variants.length > LIMITS.variantsMax) {
    return { ok: false, message: `Too many variants. Max ${LIMITS.variantsMax}.` };
  }

  const active = variants.filter((v) => v?.isActive !== false);
  if (!active.length) {
    return { ok: false, message: "At least one active variant is required." };
  }

  const barcodeSeen = new Set();
  const signatureSeen = new Set();
  let hasAnyAttributes = false;

  for (const [idx, variant] of active.entries()) {
    const n = idx + 1;

    const barcode = normalizeString(variant?.barcode, "");
    if (!barcode) {
      return { ok: false, message: `Each active variant requires a barcode. Problem at variant #${n}.` };
    }

    const barcodeKey = barcode.toLowerCase();
    if (barcodeSeen.has(barcodeKey)) {
      return { ok: false, message: `Duplicate barcode found inside submitted variants: "${barcode}".` };
    }
    barcodeSeen.add(barcodeKey);

    if (typeof variant?.price !== "number" || variant.price < 0) {
      return { ok: false, message: `Each active variant requires a valid price. Problem at variant #${n}.` };
    }

    if (typeof variant?.salePrice === "number" && variant.salePrice > variant.price) {
      return { ok: false, message: `Variant salePrice cannot exceed variant price. Problem at variant #${n}.` };
    }

    if (typeof variant?.stockQty !== "number" || variant.stockQty < 0) {
      return { ok: false, message: `Invalid stockQty in variant #${n}.` };
    }

    const attrs = normalizeAttributes(getVariantAttrsObject(variant));
    if (!Object.keys(attrs).length) {
      return {
        ok: false,
        message: `Each active variant should have at least one attribute combination. Problem at variant #${n}.`,
      };
    }

    if (Object.keys(attrs).length > LIMITS.attributesPerVariantMax) {
      return {
        ok: false,
        message: `Variant #${n} exceeds max attributes (${LIMITS.attributesPerVariantMax}).`,
      };
    }

    hasAnyAttributes = true;

    const sig = getAttributeSignature(attrs);
    if (!sig) {
      return { ok: false, message: `Invalid attributes in variant #${n}.` };
    }

    if (signatureSeen.has(sig)) {
      return {
        ok: false,
        message: "Duplicate variant combination found. Each active variant must have a unique attribute combination.",
      };
    }
    signatureSeen.add(sig);
  }

  if (!hasAnyAttributes) {
    return {
      ok: false,
      message: "Variable products require attributes on variants so option matching can work dynamically.",
    };
  }

  return { ok: true };
}

function buildVariantMeta(product, selection = {}) {
  const allVariants = Array.isArray(product?.variants) ? product.variants : [];
  const activeVariants = allVariants.filter((v) => v?.isActive !== false);

  const normalizedSelection = normalizeAttributes(selection);
  const filteredVariants = activeVariants.filter((v) =>
    matchesSelection(getVariantAttrsObject(v), normalizedSelection)
  );

  const attributeKeySet = new Set();
  const allOptionSets = {};
  const filteredOptionSets = {};

  for (const variant of activeVariants) {
    const attrs = normalizeAttributes(getVariantAttrsObject(variant));
    for (const [key, value] of Object.entries(attrs)) {
      attributeKeySet.add(key);
      if (!allOptionSets[key]) allOptionSets[key] = new Set();
      allOptionSets[key].add(value);
    }
  }

  for (const variant of filteredVariants) {
    const attrs = normalizeAttributes(getVariantAttrsObject(variant));
    for (const [key, value] of Object.entries(attrs)) {
      if (!filteredOptionSets[key]) filteredOptionSets[key] = new Set();
      filteredOptionSets[key].add(value);
    }
  }

  const attributeKeys = [...attributeKeySet].sort((a, b) => a.localeCompare(b));

  const allOptions = Object.fromEntries(
    attributeKeys.map((k) => [k, [...(allOptionSets[k] || new Set())].sort((a, b) => a.localeCompare(b))])
  );

  const availableOptions = Object.fromEntries(
    attributeKeys.map((k) => [k, [...(filteredOptionSets[k] || new Set())].sort((a, b) => a.localeCompare(b))])
  );

  const variantMatrix = activeVariants.map((variant) => ({
    barcode: normalizeString(variant?.barcode, ""),
    attributes: normalizeAttributes(getVariantAttrsObject(variant)),
    price: typeof variant?.price === "number" ? variant.price : null,
    salePrice: typeof variant?.salePrice === "number" ? variant.salePrice : null,
    stockQty: typeof variant?.stockQty === "number" ? variant.stockQty : 0,
    isActive: variant?.isActive !== false,
    imageCount: Array.isArray(variant?.images) ? variant.images.length : 0,
  }));

  const matchingVariantMatrix = filteredVariants.map((variant) => ({
    barcode: normalizeString(variant?.barcode, ""),
    attributes: normalizeAttributes(getVariantAttrsObject(variant)),
    price: typeof variant?.price === "number" ? variant.price : null,
    salePrice: typeof variant?.salePrice === "number" ? variant.salePrice : null,
    stockQty: typeof variant?.stockQty === "number" ? variant.stockQty : 0,
    isActive: variant?.isActive !== false,
    imageCount: Array.isArray(variant?.images) ? variant.images.length : 0,
  }));

  return {
    selection: normalizedSelection,
    attributeKeys,
    allOptions,
    availableOptions,
    totalActiveVariants: activeVariants.length,
    matchingVariantCount: filteredVariants.length,
    variantMatrix,
    matchingVariantMatrix,
  };
}

function getVariantImageFieldNames(index) {
  return [
    `variantImages_${index}`,
    `variantImages[${index}]`,
    `variantImages.${index}`,
    `variantImage_${index}`,
    `variantImage[${index}]`,
    `variantImage.${index}`,
  ];
}

function collectVariantImageFiles(form, index) {
  const out = [];
  const seen = new Set();

  for (const fieldName of getVariantImageFieldNames(index)) {
    const files = form.getAll(fieldName) || [];
    for (const file of files) {
      if (!file || typeof file === "string") continue;

      const key = [
        fieldName,
        normalizeString(file.name),
        String(file.size ?? ""),
        normalizeString(file.type),
      ].join("||");

      if (seen.has(key)) continue;
      seen.add(key);
      out.push(file);
    }
  }

  return out;
}

async function uploadVariantImagesToVariants(form, variants) {
  if (!Array.isArray(variants) || !variants.length) return variants;

  const nextVariants = [...variants];

  for (let i = 0; i < nextVariants.length; i += 1) {
    const existingImages = Array.isArray(nextVariants[i]?.images) ? nextVariants[i].images : [];
    const files = collectVariantImageFiles(form, i);

    if (!files.length) {
      nextVariants[i] = {
        ...nextVariants[i],
        images: normalizeImages(existingImages).slice(0, LIMITS.variantImagesMax),
      };
      continue;
    }

    if (files.length > LIMITS.variantImagesMax) {
      throw new Error(`Variant #${i + 1} exceeds max variant images (${LIMITS.variantImagesMax}).`);
    }

    for (let j = 0; j < files.length; j += 1) {
      const err = validateUploadedFile(files[j], `variantImage #${i + 1}.${j + 1}`);
      if (err) throw new Error(err);
    }

    const uploadedImages = [];
    for (const file of files) {
      const buf = await fileToBuffer(file);
      const up = await uploadBufferToCloudinary(buf, { folder: "products/variants" });

      if (!up?.success || !up?.url) {
        throw new Error(`Variant image upload failed for variant #${i + 1}.`);
      }

      uploadedImages.push({
        url: up.url,
        publicId: up.publicId || "",
        alt: "",
        order: uploadedImages.length,
      });
    }

    const mergedImages = normalizeImages([...existingImages, ...uploadedImages]).slice(
      0,
      LIMITS.variantImagesMax
    );

    nextVariants[i] = {
      ...nextVariants[i],
      images: mergedImages,
    };
  }

  return nextVariants;
}

async function validateBrandBelongsToCategory(brandId, categoryId) {
  if (!brandId || !categoryId) return { ok: false, message: "brand and category are required." };

  const brand = await Brand.findById(brandId).select("categoryIds isActive").lean();
  if (!brand) return { ok: false, message: "Invalid brand: brand not found." };
  if (brand.isActive === false) return { ok: false, message: "Invalid brand: brand is inactive." };

  const catIdStr = String(categoryId);
  const brandCats = Array.isArray(brand.categoryIds) ? brand.categoryIds.map(String) : [];
  if (!brandCats.includes(catIdStr)) return { ok: false, message: "Brand does not belong to the selected category." };

  return { ok: true };
}

async function resolveEmbeddedSubcategory(categoryId, subcategoryId) {
  if (!categoryId || !subcategoryId) return null;
  const cat = await Category.findById(categoryId).select("subcategories isActive").lean();
  if (!cat) return null;
  if (cat.isActive === false) return null;
  if (!cat?.subcategories?.length) return null;

  const sid = String(subcategoryId);
  return cat.subcategories.find((s) => String(s?._id) === sid) || null;
}

async function getIdFromContext(ctx) {
  const { params } = ctx || {};
  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const id = resolvedParams?.id ? String(resolvedParams.id) : "";
  return id;
}

async function reFetch(id, selection = {}) {
  const saved = await Product.findById(id)
    .populate({ path: "category", select: "name slug subcategories" })
    .populate({ path: "brand", select: "name slug image categoryIds" })
    .lean({ virtuals: true });

  let subcategoryObj = null;
  if (saved?.subcategory && saved?.category?.subcategories?.length) {
    const subId = String(saved.subcategory);
    subcategoryObj = saved.category.subcategories.find((s) => String(s?._id) === subId) || null;
  }

  return {
    ...saved,
    subcategoryObj,
    variants: Array.isArray(saved?.variants) ? saved.variants : [],
    specifications: Array.isArray(saved?.specifications) ? saved.specifications : [],
    highlights: Array.isArray(saved?.highlights) ? saved.highlights : [],
    description: Array.isArray(saved?.description) ? saved.description : [],
    tags: Array.isArray(saved?.tags) ? saved.tags : [],
    galleryImages: Array.isArray(saved?.galleryImages) ? saved.galleryImages : [],
    variantMeta: saved?.productType === "variable" ? buildVariantMeta(saved, selection) : null,
  };
}

// ---------- GET ONE ----------
export async function GET(req, ctx) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    const id = await getIdFromContext(ctx);
    if (!id || !isValidObjectId(id)) return badRequest("Invalid id");

    await connectDB();

    const selection = buildSelectionFromRequest(req);

    const product = await Product.findById(id)
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image categoryIds" })
      .lean({ virtuals: true });

    if (!product) return badRequest("Not found", 404);

    let subcategoryObj = null;
    if (product.subcategory && product.category?.subcategories?.length) {
      const subId = String(product.subcategory);
      subcategoryObj = product.category.subcategories.find((s) => String(s?._id) === subId) || null;
    }

    const url = new URL(req.url);
    const onlyMatchingVariants = toBool(url.searchParams.get("onlyMatchingVariants"), false);

    const fullVariants = Array.isArray(product.variants) ? product.variants : [];
    const activeVariants = fullVariants.filter((v) => v?.isActive !== false);
    const matchingVariants = Object.keys(selection).length
      ? activeVariants.filter((v) => matchesSelection(getVariantAttrsObject(v), selection))
      : activeVariants;

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        subcategoryObj,
        variants: onlyMatchingVariants ? matchingVariants : fullVariants,
        specifications: Array.isArray(product.specifications) ? product.specifications : [],
        highlights: Array.isArray(product.highlights) ? product.highlights : [],
        description: Array.isArray(product.description) ? product.description : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
        galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages : [],
        variantMeta: product.productType === "variable" ? buildVariantMeta(product, selection) : null,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);
    return badRequest(error?.message || "Failed to fetch product", 500);
  }
}

// ---------- PATCH (JSON or multipart/form-data) ----------
export async function PATCH(req, ctx) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    const id = await getIdFromContext(ctx);
    if (!id || !isValidObjectId(id)) return badRequest("Invalid id");

    await connectDB();

    const product = await Product.findById(id);
    if (!product) return badRequest("Not found", 404);

    const contentType = req.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let patch = {};
    let files = { primaryImage: null, galleryImages: [], form: null };
    let galleryMode = "keep";

    if (isJson) {
      const body = await req.json();

      patch.title = body.title;
      patch.slug = body.slug;

      patch.category = body.category;
      patch.subcategory = body.subcategory;
      patch.brand = body.brand;

      patch.barcode = body.barcode;

      patch.price = body.price;
      patch.salePrice = body.salePrice;
      patch.stockQty = body.stockQty;

      patch.productType = body.productType;
      patch.variants = body.variants;

      patch.isNew = body.isNew;
      patch.isTrending = body.isTrending;

      patch.primaryImage = body.primaryImage;
      patch.galleryImages = body.galleryImages;

      patch.tags = body.tags;
      patch.description = body.description;
      patch.specifications = body.specifications;
      patch.highlights = body.highlights;

      galleryMode = normalizeString(body.galleryMode, "keep") || "keep";
    } else {
      const form = await req.formData();
      files.form = form;

      if (form.get("title") != null) patch.title = form.get("title");
      if (form.get("slug") != null) patch.slug = form.get("slug");

      if (form.get("category") != null) patch.category = form.get("category");
      if (form.get("subcategory") != null) patch.subcategory = form.get("subcategory");
      if (form.get("brand") != null) patch.brand = form.get("brand");

      if (form.get("barcode") != null) patch.barcode = form.get("barcode");

      if (form.get("price") != null) patch.price = form.get("price");
      if (form.get("salePrice") != null) patch.salePrice = form.get("salePrice");
      if (form.get("stockQty") != null) patch.stockQty = form.get("stockQty");

      if (form.get("productType") != null) patch.productType = form.get("productType");
      if (form.get("variants") != null) patch.variants = safeJsonParse(form.get("variants"), undefined);

      if (form.get("isNew") != null) patch.isNew = form.get("isNew");
      if (form.get("isTrending") != null) patch.isTrending = form.get("isTrending");

      if (form.get("primaryImageJson") != null) {
        patch.primaryImage = safeJsonParse(form.get("primaryImageJson"), undefined);
      }
      if (form.get("galleryImagesJson") != null) {
        patch.galleryImages = safeJsonParse(form.get("galleryImagesJson"), undefined);
      }

      if (form.get("tags") != null) patch.tags = safeJsonParse(form.get("tags"), undefined);
      if (form.get("description") != null) patch.description = safeJsonParse(form.get("description"), undefined);
      if (form.get("specifications") != null) {
        patch.specifications = safeJsonParse(form.get("specifications"), undefined);
      }
      if (form.get("highlights") != null) {
        patch.highlights = safeJsonParse(form.get("highlights"), undefined);
      }

      const newPrimary = form.get("primaryImage");
      if (newPrimary && typeof newPrimary !== "string") files.primaryImage = newPrimary;

      const galleryFiles = form.getAll("galleryImages") || [];
      files.galleryImages = galleryFiles.filter((f) => f && typeof f !== "string");

      galleryMode = normalizeString(form.get("galleryMode"), "keep") || "keep";
    }

    if (!ALLOWED_GALLERY_MODE.has(galleryMode)) galleryMode = "keep";

    const primaryFileError = validateUploadedFile(files.primaryImage, "primaryImage");
    if (primaryFileError) return badRequest(primaryFileError);

    if (files.galleryImages.length > LIMITS.galleryImagesMax) {
      return badRequest(`Too many uploaded galleryImages. Max ${LIMITS.galleryImagesMax}.`);
    }

    for (let i = 0; i < files.galleryImages.length; i += 1) {
      const err = validateUploadedFile(files.galleryImages[i], `galleryImage #${i + 1}`);
      if (err) return badRequest(err);
    }

    if (files.form) {
      const variantsForValidation =
        patch.variants !== undefined
          ? normalizeVariants(patch.variants, product.variants) ?? product.variants
          : Array.isArray(product.variants)
            ? product.variants
            : [];

      for (let i = 0; i < variantsForValidation.length; i += 1) {
        const variantFiles = collectVariantImageFiles(files.form, i);

        if (variantFiles.length > LIMITS.variantImagesMax) {
          return badRequest(`Variant #${i + 1} exceeds max variant images (${LIMITS.variantImagesMax}).`);
        }

        for (let j = 0; j < variantFiles.length; j += 1) {
          const err = validateUploadedFile(variantFiles[j], `variantImage #${i + 1}.${j + 1}`);
          if (err) return badRequest(err);
        }
      }
    }

    // -------- apply patch to mongoose doc --------
    if (patch.title !== undefined) {
      const title = normalizeString(patch.title);
      const err = validateTextLength(title, LIMITS.titleMax, "title");
      if (err) return badRequest(err);
      product.title = title;
    }

    if (patch.slug !== undefined) {
      const slug = normalizeString(patch.slug).toLowerCase();
      const err = validateTextLength(slug, LIMITS.slugMax, "slug");
      if (err) return badRequest(err);
      product.slug = slug;
    }

    if (patch.category !== undefined) {
      const categoryId = normalizeString(patch.category);
      if (!categoryId || !isValidObjectId(categoryId)) return badRequest("Invalid category");
      product.category = categoryId;
    }

    if (patch.brand !== undefined) {
      const brandId = normalizeString(patch.brand);
      if (!brandId || !isValidObjectId(brandId)) return badRequest("Invalid brand");
      product.brand = brandId;
    }

    if (patch.subcategory !== undefined) {
      const subVal = normalizeString(patch.subcategory);
      if (subVal && !isValidObjectId(subVal)) return badRequest("Invalid subcategory");
      product.subcategory = subVal ? subVal : null;
    }

    if (patch.barcode !== undefined) {
      const barcode = normalizeString(patch.barcode, "").slice(0, LIMITS.barcodeMax);
      product.barcode = barcode;
    }

    if (patch.price !== undefined) {
      const n = toNumber(patch.price, undefined);
      if (typeof n !== "number" || n < 0) return badRequest("Invalid price");
      product.price = n;
    }

    if (patch.salePrice !== undefined) {
      const sp = patch.salePrice === null ? null : toNumber(patch.salePrice, null);
      product.salePrice = typeof sp === "number" && sp >= 0 ? sp : sp === null ? null : null;
    }

    if (patch.stockQty !== undefined) {
      const n = toNumber(patch.stockQty, undefined);
      if (typeof n !== "number" || n < 0) return badRequest("Invalid stockQty");
      product.stockQty = n;
    }

    if (patch.productType !== undefined) {
      const pt = normalizeString(patch.productType, product.productType || "simple");
      product.productType = pt;
    }

    if (patch.variants !== undefined) {
      product.variants = normalizeVariants(patch.variants, product.variants) ?? product.variants;
    }

    if (patch.isNew !== undefined) {
      const b = toBool(patch.isNew, product.isNew);
      if (b !== undefined) product.isNew = b;
    }

    if (patch.isTrending !== undefined) {
      const b = toBool(patch.isTrending, product.isTrending);
      if (b !== undefined) product.isTrending = b;
    }

    if (patch.tags !== undefined) {
      product.tags = normalizeTags(patch.tags, product.tags) ?? product.tags;
    }

    if (patch.description !== undefined) {
      product.description = normalizeDescriptionBlocks(patch.description, product.description) ?? product.description;
    }

    if (patch.specifications !== undefined) {
      product.specifications =
        normalizeSpecifications(patch.specifications, product.specifications) ?? product.specifications;
    }

    if (patch.highlights !== undefined) {
      product.highlights = normalizeHighlights(patch.highlights, product.highlights) ?? product.highlights;
    }

    if (patch.primaryImage !== undefined && patch.primaryImage && typeof patch.primaryImage === "object") {
      const arr = normalizeImages([patch.primaryImage]);
      if (arr[0]?.url) product.primaryImage = arr[0];
    }

    if (patch.galleryImages !== undefined && Array.isArray(patch.galleryImages)) {
      product.galleryImages = normalizeImages(patch.galleryImages).slice(0, LIMITS.galleryImagesMax);
    }

    // -------- validations --------
    const enumError = validateEnums(product.productType);
    if (enumError) return badRequest(enumError);

    if (!product.title) return badRequest("title is required");
    if (!product.slug) return badRequest("slug is required");
    if (!product.category || !product.brand) {
      return badRequest("category and brand are required");
    }

    const titleErr = validateTextLength(product.title, LIMITS.titleMax, "title");
    if (titleErr) return badRequest(titleErr);

    const slugErr = validateTextLength(product.slug, LIMITS.slugMax, "slug");
    if (slugErr) return badRequest(slugErr);

    const brandCheck = await validateBrandBelongsToCategory(product.brand, product.category);
    if (!brandCheck.ok) return badRequest(brandCheck.message);

    if (product.subcategory) {
      const subObj = await resolveEmbeddedSubcategory(product.category, product.subcategory);
      if (!subObj) {
        return badRequest("Subcategory does not belong to selected category");
      }
    }

    if (product.productType === "variable") {
      if (files.form) {
        product.variants = await uploadVariantImagesToVariants(
          files.form,
          Array.isArray(product.variants) ? product.variants : []
        );
      }

      const check = validateVariableVariants(product.variants);
      if (!check.ok) return badRequest(check.message);

      product.barcode = "";
      product.stockQty = 0;
      product.salePrice = null;
    } else {
      if (typeof product.price !== "number" || product.price < 0) {
        return badRequest("price is required for simple products");
      }
      if (typeof product.salePrice === "number" && product.salePrice > product.price) {
        return badRequest("Sale price cannot exceed price");
      }
      if (typeof product.stockQty !== "number" || product.stockQty < 0) {
        return badRequest("Invalid stockQty");
      }

      product.variants = [];
    }

    const imageValidationError = validateImageCollections(product);
    if (imageValidationError) return badRequest(imageValidationError);

    // -------- image updates (multipart only) --------
    if (files.primaryImage) {
      const oldPublicId = product.primaryImage?.publicId;

      const buf = await fileToBuffer(files.primaryImage);
      const up = await uploadBufferToCloudinary(buf, { folder: "products/primary" });

      if (!up?.success) return badRequest("Primary upload failed", 500);

      product.primaryImage = { url: up.url, publicId: up.publicId || "", alt: "", order: 0 };

      if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    }

    if (files.galleryImages.length && galleryMode !== "keep") {
      const uploaded = [];

      for (const gf of files.galleryImages) {
        const buf = await fileToBuffer(gf);
        const up = await uploadBufferToCloudinary(buf, { folder: "products/gallery" });

        if (up?.success) {
          uploaded.push({
            url: up.url,
            publicId: up.publicId || "",
            alt: "",
            order: uploaded.length,
          });
        }
      }

      if (uploaded.length) {
        if (galleryMode === "replace") {
          const oldPublicIds = (product.galleryImages || []).map((i) => i?.publicId).filter(Boolean);
          for (const pid of oldPublicIds) await deleteFromCloudinary(pid);
          product.galleryImages = uploaded.slice(0, LIMITS.galleryImagesMax);
        } else if (galleryMode === "append") {
          const current = Array.isArray(product.galleryImages) ? product.galleryImages : [];
          const baseOrder = current.length;
          product.galleryImages = [...current, ...uploaded.map((x, i) => ({ ...x, order: baseOrder + i }))].slice(
            0,
            LIMITS.galleryImagesMax
          );
        }
      }
    }

    // final image sanity
    product.galleryImages = normalizeImages(product.galleryImages).slice(0, LIMITS.galleryImagesMax);
    if (Array.isArray(product.variants)) {
      product.variants = product.variants.map((variant) => ({
        ...variant,
        images: normalizeImages(variant?.images).slice(0, LIMITS.variantImagesMax),
      }));
    }

    // -------- save (runs ProductSchema pre("save")) --------
    await product.save();

    const responseProduct = await reFetch(product._id);

    return NextResponse.json({
      success: true,
      product: responseProduct,
    });
  } catch (error) {
    console.error("PATCH /api/admin/products/[id] error:", error);

    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return badRequest("Slug already exists. Please use a unique slug.", 409);
    }

    if (error?.code === 11000 && (error?.keyPattern?.barcode || error?.keyPattern?.["variants.barcode"])) {
      return badRequest("Barcode already exists. Please use a unique barcode.", 409);
    }

    return badRequest(error?.message || "Failed to update product", 500);
  }
}

// ---------- DELETE (HARD DELETE + CLOUDINARY CLEANUP) ----------
export async function DELETE(req, ctx) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    const id = await getIdFromContext(ctx);
    if (!id || !isValidObjectId(id)) return badRequest("Invalid id");

    await connectDB();

    const product = await Product.findById(id);
    if (!product) return badRequest("Not found", 404);

    const ids = pluckPublicIds(product);
    for (const pid of ids) await deleteFromCloudinary(pid);

    await Product.deleteOne({ _id: id });

    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] error:", error);
    return badRequest(error?.message || "Failed to delete product", 500);
  }
}