// app/api/admin/products/route.js
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";
import { uploadBufferToCloudinary } from "@/utils/cloudinary";
import { requireAuth, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_PRODUCT_TYPE = new Set(["simple", "variable"]);
const ALLOWED_SORT_BY = new Set(["createdAt", "updatedAt", "title", "price"]);
const ALLOWED_SORT_ORDER = new Set(["asc", "desc"]);

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
  specificationGroupMax: 80,
  specificationsMax: 300,
  descriptionBlocksMax: 100,
  galleryImagesMax: 30,
  variantImagesMax: 10,
  variantsMax: 500,
  attributeKeyMax: 50,
  attributeValueMax: 120,
  attributesPerVariantMax: 20,
  uploadFileMaxBytes: 10 * 1024 * 1024,
  defaultPageSize: 20,
  maxPageSize: 100,
  searchMax: 120,
};

// ---------- generic helpers ----------
function badRequest(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

function isValidObjectId(v) {
  return mongoose.Types.ObjectId.isValid(String(v || ""));
}

function toNumber(v, fallback = null) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v, fallback = false) {
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

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateTextLength(value, max, fieldName) {
  if (value == null) return null;
  const s = String(value);
  if (s.length > max) return `${fieldName} is too long. Max ${max} characters.`;
  return null;
}

async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ---------- attribute / variant helpers ----------
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

// ---------- media / payload normalization ----------
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

function normalizeDescriptionBlocks(raw) {
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

function normalizeHighlights(raw) {
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

function normalizeSpecifications(raw) {
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
        group: normalizeString(s.group).slice(0, LIMITS.specificationGroupMax),
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

function normalizeVariants(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, LIMITS.variantsMax)
    .filter((v) => v && typeof v === "object")
    .map((v) => ({
      barcode: normalizeString(v.barcode, "").slice(0, LIMITS.barcodeMax),
      attributes: normalizeAttributes(v.attributes),
      price: toNumber(v.price, null),
      salePrice: toNumber(v.salePrice, null),
      stockQty: Math.max(0, toNumber(v.stockQty, 0) ?? 0),
      images: normalizeImages(v.images).slice(0, LIMITS.variantImagesMax),
      isActive: toBool(v.isActive, true),
    }));
}

function normalizeTags(raw) {
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

function validateImageCollections({ primaryImage, galleryImages = [], variants = [] }) {
  if (!primaryImage?.url) return "primaryImage is required.";

  if (galleryImages.length > LIMITS.galleryImagesMax) {
    return `galleryImages limit exceeded. Max ${LIMITS.galleryImagesMax}.`;
  }

  const primaryUrl = String(primaryImage.url || "").trim().toLowerCase();
  const duplicatePrimaryInGallery = galleryImages.some(
    (img) => String(img?.url || "").trim().toLowerCase() === primaryUrl
  );
  if (duplicatePrimaryInGallery) {
    return "primaryImage should not be duplicated inside galleryImages.";
  }

  for (const [i, variant] of variants.entries()) {
    const images = Array.isArray(variant?.images) ? variant.images : [];
    if (images.length > LIMITS.variantImagesMax) {
      return `Variant #${i + 1} exceeds max variant images (${LIMITS.variantImagesMax}).`;
    }
  }

  return null;
}

function validateVariableVariants(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return { ok: false, message: "productType=variable requires variants (JSON in 'variants')." };
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

  for (let idx = 0; idx < active.length; idx += 1) {
    const variant = active[idx];
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

  return { ok: true };
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

async function uploadVariantImagesFromForm(form, variants) {
  if (!Array.isArray(variants) || !variants.length) return variants;

  const nextVariants = [...variants];

  for (let i = 0; i < nextVariants.length; i += 1) {
    const existingImages = Array.isArray(nextVariants[i]?.images) ? nextVariants[i].images : [];
    const files = collectVariantImageFiles(form, i);

    if (!files.length) {
      nextVariants[i] = {
        ...nextVariants[i],
        images: existingImages.slice(0, LIMITS.variantImagesMax),
      };
      continue;
    }

    if (files.length > LIMITS.variantImagesMax) {
      throw new Error(`Variant #${i + 1} exceeds max variant images (${LIMITS.variantImagesMax}).`);
    }

    for (let j = 0; j < files.length; j += 1) {
      const err = validateUploadedFile(files[j], `variantImage #${i + 1}.${j + 1}`);
      if (err) {
        throw new Error(err);
      }
    }

    const uploadedImages = [];
    for (const file of files) {
      const buffer = await fileToBuffer(file);
      const uploaded = await uploadBufferToCloudinary(buffer, { folder: "products/variants" });

      if (!uploaded?.success || !uploaded?.url) {
        throw new Error(`Variant image upload failed for variant #${i + 1}.`);
      }

      uploadedImages.push({
        url: uploaded.url,
        publicId: uploaded.publicId || "",
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

// ---------- relationship validators ----------
async function resolveEmbeddedSubcategory(categoryId, subcategoryId) {
  if (!categoryId || !subcategoryId) return null;
  const cat = await Category.findById(categoryId).select("subcategories isActive").lean();
  if (!cat) return null;
  if (cat.isActive === false) return null;
  if (!cat?.subcategories?.length) return null;

  const sid = String(subcategoryId);
  return cat.subcategories.find((s) => String(s?._id) === sid) || null;
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

// ---------- cursor / listing helpers ----------
function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor) {
  try {
    const raw = Buffer.from(String(cursor), "base64url").toString("utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getSortConfig(url) {
  const sortByRaw = normalizeString(url.searchParams.get("sortBy"), "createdAt");
  const sortOrderRaw = normalizeString(url.searchParams.get("sortOrder"), "desc").toLowerCase();

  const sortBy = ALLOWED_SORT_BY.has(sortByRaw) ? sortByRaw : "createdAt";
  const sortOrder = ALLOWED_SORT_ORDER.has(sortOrderRaw) ? sortOrderRaw : "desc";
  const direction = sortOrder === "asc" ? 1 : -1;

  return { sortBy, sortOrder, direction };
}

function sanitizeSearchTerm(value) {
  return normalizeString(value, "").slice(0, LIMITS.searchMax);
}

function buildBaseMatch(url) {
  const q = {};
  const search = sanitizeSearchTerm(url.searchParams.get("search"));

  const category = normalizeString(url.searchParams.get("category"));
  if (category) {
    if (!isValidObjectId(category)) return { error: "Invalid category filter" };
    q.category = new mongoose.Types.ObjectId(category);
  }

  const brand = normalizeString(url.searchParams.get("brand"));
  if (brand) {
    if (!isValidObjectId(brand)) return { error: "Invalid brand filter" };
    q.brand = new mongoose.Types.ObjectId(brand);
  }

  const subcategory = normalizeString(url.searchParams.get("subcategory"));
  if (subcategory) {
    if (!isValidObjectId(subcategory)) return { error: "Invalid subcategory filter" };
    q.subcategory = new mongoose.Types.ObjectId(subcategory);
  }

  const productType = normalizeString(url.searchParams.get("productType"));
  if (productType) {
    if (!ALLOWED_PRODUCT_TYPE.has(productType)) return { error: "Invalid productType filter" };
    q.productType = productType;
  }

  const isNewParam = url.searchParams.get("isNew");
  if (isNewParam !== null) q.isNew = toBool(isNewParam, false);

  const isTrendingParam = url.searchParams.get("isTrending");
  if (isTrendingParam !== null) q.isTrending = toBool(isTrendingParam, false);

  const createdFrom = normalizeString(url.searchParams.get("createdFrom"));
  const createdTo = normalizeString(url.searchParams.get("createdTo"));
  if (createdFrom || createdTo) {
    q.createdAt = {};
    if (createdFrom) {
      const d = new Date(createdFrom);
      if (Number.isNaN(d.getTime())) return { error: "Invalid createdFrom date" };
      q.createdAt.$gte = d;
    }
    if (createdTo) {
      const d = new Date(createdTo);
      if (Number.isNaN(d.getTime())) return { error: "Invalid createdTo date" };
      q.createdAt.$lte = d;
    }
  }

  const tag = normalizeString(url.searchParams.get("tag"));
  if (tag) {
    q.tags = tag;
  }

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    q.$or = [
      { title: rx },
      { slug: rx },
      { barcode: rx },
      { tags: rx },
      { "variants.barcode": rx },
    ];
  }

  return { query: q, search };
}

function getListOptions(url) {
  return {
    includeVariants: toBool(url.searchParams.get("includeVariants"), false),
    includeGallery: toBool(url.searchParams.get("includeGallery"), false),
    includeDescription: toBool(url.searchParams.get("includeDescription"), false),
    includeSpecifications: toBool(url.searchParams.get("includeSpecifications"), false),
    includeHighlights: toBool(url.searchParams.get("includeHighlights"), false),
    includeCount: toBool(url.searchParams.get("includeCount"), false),
  };
}

function getRequestedComputedFilters(url) {
  const stockStatus = normalizeString(url.searchParams.get("stockStatus")).toLowerCase();
  if (stockStatus && !["in_stock", "out_of_stock"].includes(stockStatus)) {
    return { error: "Invalid stockStatus filter. Use: in_stock | out_of_stock" };
  }

  const hasSaleParam = url.searchParams.get("hasSale");
  const hasSale = hasSaleParam !== null ? toBool(hasSaleParam, false) : null;

  const minPriceRaw = url.searchParams.get("minPrice");
  const maxPriceRaw = url.searchParams.get("maxPrice");

  let minPrice = null;
  let maxPrice = null;

  if (minPriceRaw !== null) {
    minPrice = Number(minPriceRaw);
    if (!Number.isFinite(minPrice) || minPrice < 0) return { error: "Invalid minPrice" };
  }

  if (maxPriceRaw !== null) {
    maxPrice = Number(maxPriceRaw);
    if (!Number.isFinite(maxPrice) || maxPrice < 0) return { error: "Invalid maxPrice" };
  }

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { error: "minPrice cannot be greater than maxPrice" };
  }

  return { stockStatus, hasSale, minPrice, maxPrice };
}

function buildCursorFilter({ cursor, sortBy, direction }) {
  if (!cursor) return null;

  const decoded = decodeCursor(cursor);
  if (!decoded || !decoded.lastId || !isValidObjectId(decoded.lastId)) return null;
  if (!Object.prototype.hasOwnProperty.call(decoded, "lastValue")) return null;

  const lastId = new mongoose.Types.ObjectId(String(decoded.lastId));
  const lastValue = decoded.lastValue;

  const field = sortBy === "price" ? "effectivePrice" : sortBy;

  if (field === "createdAt" || field === "updatedAt") {
    const dateValue = new Date(lastValue);
    if (Number.isNaN(dateValue.getTime())) return null;

    return direction === -1
      ? {
          $or: [
            { [field]: { $lt: dateValue } },
            { [field]: dateValue, _id: { $lt: lastId } },
          ],
        }
      : {
          $or: [
            { [field]: { $gt: dateValue } },
            { [field]: dateValue, _id: { $gt: lastId } },
          ],
        };
  }

  if (field === "title") {
    const strValue = String(lastValue ?? "");
    return direction === -1
      ? {
          $or: [
            { title: { $lt: strValue } },
            { title: strValue, _id: { $lt: lastId } },
          ],
        }
      : {
          $or: [
            { title: { $gt: strValue } },
            { title: strValue, _id: { $gt: lastId } },
          ],
        };
  }

  if (field === "effectivePrice") {
    const numValue = Number(lastValue);
    if (!Number.isFinite(numValue)) return null;

    return direction === -1
      ? {
          $or: [
            { effectivePrice: { $lt: numValue } },
            { effectivePrice: numValue, _id: { $lt: lastId } },
          ],
        }
      : {
          $or: [
            { effectivePrice: { $gt: numValue } },
            { effectivePrice: numValue, _id: { $gt: lastId } },
          ],
        };
  }

  return null;
}

function makeSingleProduct(product, options = {}) {
  const {
    includeVariants = false,
    includeGallery = false,
    includeDescription = false,
    includeSpecifications = false,
    includeHighlights = false,
  } = options;

  let subcategoryObj = null;
  if (product?.subcategory && product?.category?.subcategories?.length) {
    const subId = String(product.subcategory);
    subcategoryObj = product.category.subcategories.find((s) => String(s?._id) === subId) || null;
  }

  const base = {
    ...product,
    subcategoryObj,
    tags: Array.isArray(product?.tags) ? product.tags : [],
    galleryImages: includeGallery && Array.isArray(product?.galleryImages) ? product.galleryImages : [],
    description: includeDescription && Array.isArray(product?.description) ? product.description : [],
    specifications: includeSpecifications && Array.isArray(product?.specifications) ? product.specifications : [],
    highlights: includeHighlights && Array.isArray(product?.highlights) ? product.highlights : [],
  };

  if (!includeVariants) delete base.variants;
  if (!includeGallery) delete base.galleryImages;
  if (!includeDescription) delete base.description;
  if (!includeSpecifications) delete base.specifications;
  if (!includeHighlights) delete base.highlights;

  return base;
}

function buildAggregationPipeline({
  baseMatch,
  computedFilters,
  cursorFilter,
  sortBy,
  direction,
  limit,
  options,
}) {
  const {
    includeVariants,
    includeGallery,
    includeDescription,
    includeSpecifications,
    includeHighlights,
  } = options;

  const pipeline = [
    { $match: baseMatch },
    {
      $addFields: {
        activeVariants: {
          $filter: {
            input: { $ifNull: ["$variants", []] },
            as: "v",
            cond: { $ne: ["$$v.isActive", false] },
          },
        },
      },
    },
    {
      $addFields: {
        availableStock: {
          $cond: [
            { $eq: ["$productType", "variable"] },
            {
              $sum: {
                $map: {
                  input: "$activeVariants",
                  as: "v",
                  in: {
                    $cond: [
                      { $gt: [{ $ifNull: ["$$v.stockQty", 0] }, 0] },
                      "$$v.stockQty",
                      0,
                    ],
                  },
                },
              },
            },
            {
              $cond: [{ $gt: [{ $ifNull: ["$stockQty", 0] }, 0] }, "$stockQty", 0],
            },
          ],
        },
        variantFinalPrices: {
          $map: {
            input: "$activeVariants",
            as: "v",
            in: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$$v.salePrice", null] },
                    { $gte: ["$$v.salePrice", 0] },
                  ],
                },
                "$$v.salePrice",
                "$$v.price",
              ],
            },
          },
        },
        hasVariantSale: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: "$activeVariants",
                  as: "v",
                  cond: {
                    $and: [
                      { $ne: ["$$v.salePrice", null] },
                      { $gte: ["$$v.salePrice", 0] },
                      { $lt: ["$$v.salePrice", "$$v.price"] },
                    ],
                  },
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        minVariantFinalPrice: {
          $cond: [
            { $gt: [{ $size: "$variantFinalPrices" }, 0] },
            { $min: "$variantFinalPrices" },
            null,
          ],
        },
        maxVariantFinalPrice: {
          $cond: [
            { $gt: [{ $size: "$variantFinalPrices" }, 0] },
            { $max: "$variantFinalPrices" },
            null,
          ],
        },
      },
    },
    {
      $addFields: {
        effectivePrice: {
          $cond: [
            { $eq: ["$productType", "variable"] },
            { $ifNull: ["$minVariantFinalPrice", 0] },
            {
              $cond: [
                {
                  $and: [
                    { $ne: ["$salePrice", null] },
                    { $gte: ["$salePrice", 0] },
                    { $lt: ["$salePrice", "$price"] },
                  ],
                },
                "$salePrice",
                "$price",
              ],
            },
          ],
        },
        hasAnySale: {
          $cond: [
            { $eq: ["$productType", "variable"] },
            "$hasVariantSale",
            {
              $and: [
                { $ne: ["$salePrice", null] },
                { $gte: ["$salePrice", 0] },
                { $lt: ["$salePrice", "$price"] },
              ],
            },
          ],
        },
      },
    },
  ];

  const computedMatch = {};

  if (computedFilters.stockStatus === "in_stock") {
    computedMatch.availableStock = { $gt: 0 };
  } else if (computedFilters.stockStatus === "out_of_stock") {
    computedMatch.availableStock = 0;
  }

  if (computedFilters.hasSale !== null) {
    computedMatch.hasAnySale = computedFilters.hasSale;
  }

  if (computedFilters.minPrice !== null || computedFilters.maxPrice !== null) {
    computedMatch.effectivePrice = {};
    if (computedFilters.minPrice !== null) computedMatch.effectivePrice.$gte = computedFilters.minPrice;
    if (computedFilters.maxPrice !== null) computedMatch.effectivePrice.$lte = computedFilters.maxPrice;
  }

  if (Object.keys(computedMatch).length) {
    pipeline.push({ $match: computedMatch });
  }

  if (cursorFilter) {
    pipeline.push({ $match: cursorFilter });
  }

  const sortField = sortBy === "price" ? "effectivePrice" : sortBy;
  pipeline.push({ $sort: { [sortField]: direction, _id: direction } });

  pipeline.push(
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
        pipeline: [{ $project: { name: 1, slug: 1, subcategories: 1 } }],
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand",
        pipeline: [{ $project: { name: 1, slug: 1, image: 1, categoryIds: 1 } }],
      },
    },
    {
      $addFields: {
        category: { $arrayElemAt: ["$category", 0] },
        brand: { $arrayElemAt: ["$brand", 0] },
      },
    }
  );

  const project = {
    title: 1,
    slug: 1,
    category: 1,
    subcategory: 1,
    brand: 1,
    barcode: 1,
    price: 1,
    salePrice: 1,
    stockQty: 1,
    productType: 1,
    primaryImage: 1,
    tags: 1,
    isNew: 1,
    isTrending: 1,
    createdAt: 1,
    updatedAt: 1,

    availableStock: 1,
    effectivePrice: 1,
    hasAnySale: 1,
    minVariantFinalPrice: 1,
    maxVariantFinalPrice: 1,

    variantSummary: {
      totalVariants: { $size: { $ifNull: ["$variants", []] } },
      activeVariants: { $size: "$activeVariants" },
      availableStock: "$availableStock",
      attributeKeys: {
        $sortArray: {
          input: {
            $reduce: {
              input: "$activeVariants",
              initialValue: [],
              in: {
                $setUnion: [
                  "$$value",
                  {
                    $map: {
                      input: { $objectToArray: { $ifNull: ["$$this.attributes", {}] } },
                      as: "attr",
                      in: "$$attr.k",
                    },
                  },
                ],
              },
            },
          },
          sortBy: 1,
        },
      },
      minVariantFinalPrice: "$minVariantFinalPrice",
      maxVariantFinalPrice: "$maxVariantFinalPrice",
    },
  };

  if (includeGallery) project.galleryImages = 1;
  if (includeVariants) project.variants = 1;
  if (includeDescription) project.description = 1;
  if (includeSpecifications) project.specifications = 1;
  if (includeHighlights) project.highlights = 1;

  pipeline.push({ $project: project });
  pipeline.push({ $limit: limit + 1 });

  return pipeline;
}

// ---------- CREATE (multipart/form-data) ----------
export async function POST(req) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    await connectDB();

    const form = await req.formData();

    const title = normalizeString(form.get("title"));
    const slug = normalizeString(form.get("slug")).toLowerCase();
    const category = normalizeString(form.get("category"));
    const brand = normalizeString(form.get("brand"));

    const subcategoryRaw = normalizeString(form.get("subcategory"));
    const subcategory = subcategoryRaw ? subcategoryRaw : null;

    const barcode = normalizeString(form.get("barcode"), "").slice(0, LIMITS.barcodeMax);
    const price = toNumber(form.get("price"), null);
    const salePrice = form.get("salePrice") === null ? null : toNumber(form.get("salePrice"), null);
    const stockQty = toNumber(form.get("stockQty"), 0);

    const productType = normalizeString(form.get("productType"), "simple") || "simple";
    if (!ALLOWED_PRODUCT_TYPE.has(productType)) {
      return badRequest("Invalid productType. Use: simple | variable");
    }

    const titleErr = validateTextLength(title, LIMITS.titleMax, "title");
    if (titleErr) return badRequest(titleErr);

    const slugErr = validateTextLength(slug, LIMITS.slugMax, "slug");
    if (slugErr) return badRequest(slugErr);

    const tags = normalizeTags(safeJsonParse(form.get("tags"), []));
    const highlights = normalizeHighlights(safeJsonParse(form.get("highlights"), []));
    const specifications = normalizeSpecifications(safeJsonParse(form.get("specifications"), []));
    const description = normalizeDescriptionBlocks(safeJsonParse(form.get("description"), []));
    let variants = normalizeVariants(safeJsonParse(form.get("variants"), []));

    const isNew = toBool(form.get("isNew"), false);
    const isTrending = toBool(form.get("isTrending"), false);

    if (!title || !slug || !category || !brand) {
      return badRequest("title, slug, category, brand are required");
    }

    if (!isValidObjectId(category)) return badRequest("Invalid category");
    if (!isValidObjectId(brand)) return badRequest("Invalid brand");
    if (subcategory && !isValidObjectId(subcategory)) return badRequest("Invalid subcategory");

    if (productType === "simple") {
      if (price === null) return badRequest("price is required for simple products");
      if (price < 0) return badRequest("Invalid price");
      if (salePrice !== null && salePrice > price) return badRequest("Sale price cannot exceed price");
      if (typeof stockQty !== "number" || stockQty < 0) return badRequest("Invalid stockQty");
    }

    if (productType === "variable") {
      const check = validateVariableVariants(variants);
      if (!check.ok) return badRequest(check.message);
    }

    const brandCheck = await validateBrandBelongsToCategory(brand, category);
    if (!brandCheck.ok) return badRequest(brandCheck.message);

    if (subcategory) {
      const subObj = await resolveEmbeddedSubcategory(category, subcategory);
      if (!subObj) return badRequest("Subcategory does not belong to selected category");
    }

    const primaryFile = form.get("primaryImage");
    if (!primaryFile || typeof primaryFile === "string") {
      return badRequest("primaryImage file is required");
    }

    const primaryFileError = validateUploadedFile(primaryFile, "primaryImage");
    if (primaryFileError) return badRequest(primaryFileError);

    const galleryFiles = (form.getAll("galleryImages") || []).filter((f) => f && typeof f !== "string");
    if (galleryFiles.length > LIMITS.galleryImagesMax) {
      return badRequest(`Too many galleryImages. Max ${LIMITS.galleryImagesMax}.`);
    }

    for (let i = 0; i < galleryFiles.length; i += 1) {
      const err = validateUploadedFile(galleryFiles[i], `galleryImage #${i + 1}`);
      if (err) return badRequest(err);
    }

    if (productType === "variable") {
      for (let i = 0; i < variants.length; i += 1) {
        const files = collectVariantImageFiles(form, i);

        if (files.length > LIMITS.variantImagesMax) {
          return badRequest(`Variant #${i + 1} exceeds max variant images (${LIMITS.variantImagesMax}).`);
        }

        for (let j = 0; j < files.length; j += 1) {
          const err = validateUploadedFile(files[j], `variantImage #${i + 1}.${j + 1}`);
          if (err) return badRequest(err);
        }
      }
    }

    const primaryBuffer = await fileToBuffer(primaryFile);
    const primaryUpload = await uploadBufferToCloudinary(primaryBuffer, { folder: "products/primary" });

    if (!primaryUpload?.success) {
      return badRequest("Primary image upload failed", 500);
    }

    const galleryImages = [];
    for (const gf of galleryFiles) {
      const buf = await fileToBuffer(gf);
      const up = await uploadBufferToCloudinary(buf, { folder: "products/gallery" });
      if (up?.success) {
        galleryImages.push({
          url: up.url,
          publicId: up.publicId || "",
          alt: "",
          order: galleryImages.length,
        });
      }
    }

    if (productType === "variable") {
      variants = await uploadVariantImagesFromForm(form, variants);
    }

    const imageError = validateImageCollections({
      primaryImage: { url: primaryUpload.url, publicId: primaryUpload.publicId || "", alt: "", order: 0 },
      galleryImages,
      variants,
    });
    if (imageError) return badRequest(imageError);

    const payload = {
      title,
      slug,
      category,
      subcategory,
      brand,
      productType,
      isNew,
      isTrending,
      primaryImage: { url: primaryUpload.url, publicId: primaryUpload.publicId || "", alt: "", order: 0 },
      galleryImages,
      tags,
      description,
      specifications,
      highlights,
    };

    if (productType === "simple") {
      payload.barcode = barcode;
      payload.price = price;
      if (salePrice !== null) payload.salePrice = salePrice;
      payload.stockQty = stockQty;
    } else {
      payload.variants = variants;
      payload.price = 0;
      payload.salePrice = null;
      payload.stockQty = 0;
      payload.barcode = "";
    }

    const created = new Product(payload);
    await created.save();

    const responseProduct = await Product.findById(created._id)
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image categoryIds" })
      .lean({ virtuals: true });

    return NextResponse.json(
      {
        success: true,
        product: makeSingleProduct(responseProduct, {
          includeVariants: true,
          includeGallery: true,
          includeDescription: true,
          includeSpecifications: true,
          includeHighlights: true,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/products error:", error);

    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return badRequest("Slug already exists. Please use a unique slug.", 409);
    }

    if (error?.code === 11000 && (error?.keyPattern?.barcode || error?.keyPattern?.["variants.barcode"])) {
      return badRequest("Barcode already exists. Please use a unique barcode.", 409);
    }

    return badRequest(error?.message || "Failed to create product", 500);
  }
}

// ---------- READ (LIST) ----------
export async function GET(req) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    await connectDB();

    const url = new URL(req.url);

    const { sortBy, sortOrder, direction } = getSortConfig(url);
    const options = getListOptions(url);

    const pageSizeRaw = Number(url.searchParams.get("limit"));
    const limit =
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
        ? Math.min(pageSizeRaw, LIMITS.maxPageSize)
        : LIMITS.defaultPageSize;

    const { query: baseMatch, error: matchError } = buildBaseMatch(url);
    if (matchError) return badRequest(matchError);

    const computedFilters = getRequestedComputedFilters(url);
    if (computedFilters.error) return badRequest(computedFilters.error);

    const cursor = normalizeString(url.searchParams.get("cursor"));
    const cursorFilter = buildCursorFilter({ cursor, sortBy, direction });

    const pipeline = buildAggregationPipeline({
      baseMatch,
      computedFilters,
      cursorFilter,
      sortBy,
      direction,
      limit,
      options,
    });

    const docs = await Product.aggregate(pipeline);

    const hasNextPage = docs.length > limit;
    const items = hasNextPage ? docs.slice(0, limit) : docs;

    const products = items.map((p) =>
      makeSingleProduct(p, {
        includeVariants: options.includeVariants,
        includeGallery: options.includeGallery,
        includeDescription: options.includeDescription,
        includeSpecifications: options.includeSpecifications,
        includeHighlights: options.includeHighlights,
      })
    );

    let nextCursor = null;
    if (hasNextPage && items.length) {
      const last = items[items.length - 1];
      let lastValue = sortBy === "price" ? last?.effectivePrice : last?.[sortBy];
      if (lastValue instanceof Date) lastValue = lastValue.toISOString();

      nextCursor = encodeCursor({
        sortBy,
        sortOrder,
        lastValue,
        lastId: String(last._id),
      });
    }

    let total;
    if (options.includeCount) {
      const countPipeline = buildAggregationPipeline({
        baseMatch,
        computedFilters,
        cursorFilter: null,
        sortBy,
        direction,
        limit: LIMITS.maxPageSize,
        options: {
          includeVariants: false,
          includeGallery: false,
          includeDescription: false,
          includeSpecifications: false,
          includeHighlights: false,
        },
      });

      const trimIndex = countPipeline.findIndex((stage) => stage.$limit);
      const countStages = trimIndex >= 0 ? countPipeline.slice(0, trimIndex) : countPipeline;

      countStages.push({ $count: "total" });

      const countResult = await Product.aggregate(countStages);
      total = countResult[0]?.total || 0;
    }

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        limit,
        hasNextPage,
        nextCursor,
        sortBy,
        sortOrder,
        total,
      },
      filters: {
        search: sanitizeSearchTerm(url.searchParams.get("search")),
        category: normalizeString(url.searchParams.get("category")),
        brand: normalizeString(url.searchParams.get("brand")),
        subcategory: normalizeString(url.searchParams.get("subcategory")),
        productType: normalizeString(url.searchParams.get("productType")),
        isNew: url.searchParams.get("isNew"),
        isTrending: url.searchParams.get("isTrending"),
        hasSale: url.searchParams.get("hasSale"),
        stockStatus: normalizeString(url.searchParams.get("stockStatus")),
        tag: normalizeString(url.searchParams.get("tag")),
        minPrice: url.searchParams.get("minPrice"),
        maxPrice: url.searchParams.get("maxPrice"),
        createdFrom: url.searchParams.get("createdFrom"),
        createdTo: url.searchParams.get("createdTo"),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return badRequest(error?.message || "Failed to fetch admin products", 500);
  }
}