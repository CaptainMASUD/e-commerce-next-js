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
  featuresMax: 200,
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
  const raw = String(key || "").trim();
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
    .map(([k, v]) => [String(k).trim(), String(v).trim()])
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

function normalizeFeatures(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();

  return raw
    .slice(0, LIMITS.featuresMax)
    .filter((f) => f && typeof f === "object")
    .map((f, idx) => ({
      label: normalizeString(f.label).slice(0, 120),
      value: normalizeString(f.value).slice(0, 500),
      isKey: toBool(f.isKey, false),
      order: Number.isFinite(Number(f.order)) ? Number(f.order) : idx,
      group: normalizeString(f.group, "").slice(0, 80),
    }))
    .filter((f) => {
      if (!f.label || !f.value) return false;
      const key = `${f.group}||${f.label.toLowerCase()}||${f.value.toLowerCase()}||${f.isKey ? 1 : 0}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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

function validateEnums(productType) {
  if (productType && !ALLOWED_PRODUCT_TYPE.has(productType)) {
    return "Invalid productType. Use: simple | variable";
  }
  return null;
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

function buildCursorFilter({ cursor, sortBy, direction }) {
  if (!cursor) return null;

  const decoded = decodeCursor(cursor);
  if (!decoded || !decoded.lastId) return null;
  if (!isValidObjectId(decoded.lastId)) return null;

  if (!Object.prototype.hasOwnProperty.call(decoded, "lastValue")) return null;

  const lastId = new mongoose.Types.ObjectId(String(decoded.lastId));
  const lastValue = decoded.lastValue;

  if (sortBy === "createdAt" || sortBy === "updatedAt") {
    const dateValue = new Date(lastValue);
    if (Number.isNaN(dateValue.getTime())) return null;

    return direction === -1
      ? {
          $or: [
            { [sortBy]: { $lt: dateValue } },
            { [sortBy]: dateValue, _id: { $lt: lastId } },
          ],
        }
      : {
          $or: [
            { [sortBy]: { $gt: dateValue } },
            { [sortBy]: dateValue, _id: { $gt: lastId } },
          ],
        };
  }

  if (sortBy === "title") {
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

  if (sortBy === "price") {
    const numValue = Number(lastValue);
    if (!Number.isFinite(numValue)) return null;

    return direction === -1
      ? {
          $or: [
            { price: { $lt: numValue } },
            { price: numValue, _id: { $lt: lastId } },
          ],
        }
      : {
          $or: [
            { price: { $gt: numValue } },
            { price: numValue, _id: { $gt: lastId } },
          ],
        };
  }

  return null;
}

function sanitizeSearchTerm(value) {
  return normalizeString(value, "").slice(0, LIMITS.searchMax);
}

function buildListQuery(url) {
  const q = {};
  const search = sanitizeSearchTerm(url.searchParams.get("search"));

  const category = normalizeString(url.searchParams.get("category"));
  if (category) {
    if (!isValidObjectId(category)) return { error: "Invalid category filter" };
    q.category = category;
  }

  const brand = normalizeString(url.searchParams.get("brand"));
  if (brand) {
    if (!isValidObjectId(brand)) return { error: "Invalid brand filter" };
    q.brand = brand;
  }

  const subcategory = normalizeString(url.searchParams.get("subcategory"));
  if (subcategory) {
    if (!isValidObjectId(subcategory)) return { error: "Invalid subcategory filter" };
    q.subcategory = subcategory;
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

  const hasSaleParam = url.searchParams.get("hasSale");
  if (hasSaleParam !== null) {
    const hasSale = toBool(hasSaleParam, false);
    q.salePrice = hasSale ? { $ne: null } : null;
  }

  const stockStatus = normalizeString(url.searchParams.get("stockStatus")).toLowerCase();
  if (stockStatus) {
    if (!["in_stock", "out_of_stock"].includes(stockStatus)) {
      return { error: "Invalid stockStatus filter. Use: in_stock | out_of_stock" };
    }

    if (stockStatus === "out_of_stock") {
      q.$or = [
        { productType: "simple", stockQty: 0 },
        {
          productType: "variable",
          $or: [
            { variants: { $size: 0 } },
            { variants: { $not: { $elemMatch: { isActive: true, stockQty: { $gt: 0 } } } } },
          ],
        },
      ];
    } else {
      q.$or = [
        { productType: "simple", stockQty: { $gt: 0 } },
        { productType: "variable", variants: { $elemMatch: { isActive: true, stockQty: { $gt: 0 } } } },
      ];
    }
  }

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

  const minPriceRaw = url.searchParams.get("minPrice");
  const maxPriceRaw = url.searchParams.get("maxPrice");
  if (minPriceRaw !== null || maxPriceRaw !== null) {
    q.price = {};
    if (minPriceRaw !== null) {
      const minPrice = Number(minPriceRaw);
      if (!Number.isFinite(minPrice) || minPrice < 0) return { error: "Invalid minPrice" };
      q.price.$gte = minPrice;
    }
    if (maxPriceRaw !== null) {
      const maxPrice = Number(maxPriceRaw);
      if (!Number.isFinite(maxPrice) || maxPrice < 0) return { error: "Invalid maxPrice" };
      q.price.$lte = maxPrice;
    }
    if (
      Object.prototype.hasOwnProperty.call(q.price, "$gte") &&
      Object.prototype.hasOwnProperty.call(q.price, "$lte") &&
      q.price.$gte > q.price.$lte
    ) {
      return { error: "minPrice cannot be greater than maxPrice" };
    }
  }

  const tag = normalizeString(url.searchParams.get("tag"));
  if (tag) {
    q.tags = tag;
  }

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    q.$and = q.$and || [];
    q.$and.push({
      $or: [
        { title: rx },
        { slug: rx },
        { barcode: rx },
        { tags: rx },
        { "variants.barcode": rx },
      ],
    });
  }

  return { query: q, search };
}

function makeListSelect({ includeVariants, includeGallery, includeDescription, includeFeatures }) {
  const select = {
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
  };

  if (includeGallery) select.galleryImages = 1;
  if (includeVariants) select.variants = 1;
  if (includeDescription) select.description = 1;
  if (includeFeatures) select.features = 1;

  return select;
}

function summarizeVariantInfo(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const active = variants.filter((v) => v?.isActive !== false);
  const availableStock = active.reduce((sum, v) => sum + (typeof v?.stockQty === "number" ? Math.max(v.stockQty, 0) : 0), 0);

  const prices = active
    .map((v) => {
      const base = typeof v?.price === "number" ? v.price : null;
      const sale = typeof v?.salePrice === "number" ? v.salePrice : null;
      return sale !== null ? sale : base;
    })
    .filter((n) => typeof n === "number" && n >= 0);

  const attributeKeys = new Set();
  for (const variant of active) {
    const attrs = normalizeAttributes(getVariantAttrsObject(variant));
    Object.keys(attrs).forEach((k) => attributeKeys.add(k));
  }

  return {
    totalVariants: variants.length,
    activeVariants: active.length,
    availableStock,
    attributeKeys: [...attributeKeys].sort((a, b) => a.localeCompare(b)),
    minVariantFinalPrice: prices.length ? Math.min(...prices) : null,
    maxVariantFinalPrice: prices.length ? Math.max(...prices) : null,
  };
}

function makeListProduct(product, options = {}) {
  const {
    includeVariants = false,
    includeGallery = false,
    includeDescription = false,
    includeFeatures = false,
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
    features: includeFeatures && Array.isArray(product?.features) ? product.features : [],
  };

  if (product?.productType === "variable") {
    base.variantSummary = summarizeVariantInfo(product);
  } else {
    base.variantSummary = {
      totalVariants: 0,
      activeVariants: 0,
      availableStock: typeof product?.stockQty === "number" ? Math.max(product.stockQty, 0) : 0,
      attributeKeys: [],
      minVariantFinalPrice: null,
      maxVariantFinalPrice: null,
    };
  }

  if (includeVariants) {
    base.variants = Array.isArray(product?.variants) ? product.variants : [];
  } else {
    delete base.variants;
  }

  return base;
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
    const features = normalizeFeatures(safeJsonParse(form.get("features"), []));
    const description = normalizeDescriptionBlocks(safeJsonParse(form.get("description"), []));
    const variants = normalizeVariants(safeJsonParse(form.get("variants"), []));

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
      features,
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
        product: makeListProduct(responseProduct, {
          includeVariants: true,
          includeGallery: true,
          includeDescription: true,
          includeFeatures: true,
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

    const pageSizeRaw = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(pageSizeRaw, LIMITS.maxPageSize)
      : LIMITS.defaultPageSize;

    const includeVariants = toBool(url.searchParams.get("includeVariants"), false);
    const includeGallery = toBool(url.searchParams.get("includeGallery"), false);
    const includeDescription = toBool(url.searchParams.get("includeDescription"), false);
    const includeFeatures = toBool(url.searchParams.get("includeFeatures"), false);
    const includeCount = toBool(url.searchParams.get("includeCount"), false);

    const { query, error } = buildListQuery(url);
    if (error) return badRequest(error);

    const cursor = normalizeString(url.searchParams.get("cursor"));
    const cursorFilter = buildCursorFilter({ cursor, sortBy, direction });

    const finalQuery = cursorFilter ? { $and: [query, cursorFilter] } : query;

    const select = makeListSelect({
      includeVariants,
      includeGallery,
      includeDescription,
      includeFeatures,
    });

    const sort = { [sortBy]: direction, _id: direction };

    const docs = await Product.find(finalQuery)
      .select(select)
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image categoryIds" })
      .sort(sort)
      .limit(limit + 1)
      .lean({ virtuals: true });

    const hasNextPage = docs.length > limit;
    const items = hasNextPage ? docs.slice(0, limit) : docs;

    const products = items.map((p) =>
      makeListProduct(p, {
        includeVariants,
        includeGallery,
        includeDescription,
        includeFeatures,
      })
    );

    let nextCursor = null;
    if (hasNextPage && items.length) {
      const last = items[items.length - 1];
      let lastValue = last?.[sortBy];

      if (lastValue instanceof Date) lastValue = lastValue.toISOString();

      nextCursor = encodeCursor({
        sortBy,
        sortOrder,
        lastValue,
        lastId: String(last._id),
      });
    }

    let total = undefined;
    if (includeCount) {
      total = await Product.countDocuments(query);
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