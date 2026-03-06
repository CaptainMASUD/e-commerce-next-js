// src/models/product.model.js
import mongoose, { Schema } from "mongoose";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";

/* ----------------------------- sub-schemas ----------------------------- */

const ProductImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: "" },
    alt: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0, index: true },
  },
  { _id: false }
);

const ProductFeatureSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    isKey: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0, index: true },
    group: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// description blocks: each block has a title + details (unlimited length)
const ProductDescriptionBlockSchema = new Schema(
  {
    title: { type: String, trim: true, default: "" },
    details: { type: String, default: "" }, // unlimited
    order: { type: Number, default: 0, index: true },
  },
  { _id: false }
);

/**
 * ✅ Variant schema: single identifier = barcode
 * - Removed: variantId, sku
 */
const ProductVariantSchema = new Schema(
  {
    // ✅ Barcode per variant (the ONLY identifier for variants)
    barcode: { type: String, trim: true, index: true, default: "" },

    attributes: { type: Map, of: String, default: {} }, // e.g. { storage: "256GB", color: "Black" }

    // price required for active variants (enforced in pre-save)
    price: { type: Number, min: 0, default: null },
    salePrice: { type: Number, min: 0, default: null },

    // stock per variant
    stockQty: { type: Number, min: 0, default: 0, index: true },

    images: { type: [ProductImageSchema], default: [] },

    isActive: { type: Boolean, default: true, index: true },
  },
  { _id: false }
);

/* ------------------------------ main schema ----------------------------- */

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },

    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subcategory: { type: Schema.Types.ObjectId, default: null, index: true },

    // ✅ Barcode on product-level (recommended for simple products)
    barcode: { type: String, trim: true, index: true, default: "" },

    // ✅ price not required (variable products price comes from variants)
    price: { type: Number, min: 0, default: 0, index: true },

    salePrice: { type: Number, min: 0, default: null, index: true },

    // ✅ used ONLY when productType === "simple"
    stockQty: { type: Number, min: 0, default: 0, index: true },

    productType: { type: String, enum: ["simple", "variable"], default: "simple", index: true },
    variants: { type: [ProductVariantSchema], default: [] },

    isNew: { type: Boolean, default: false, index: true },
    isTrending: { type: Boolean, default: false, index: true },

    primaryImage: { type: ProductImageSchema, required: true },
    galleryImages: { type: [ProductImageSchema], default: [] },

    tags: { type: [String], default: [], index: true },

    description: { type: [ProductDescriptionBlockSchema], default: [] },
    features: { type: [ProductFeatureSchema], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* ------------------------------ virtuals ------------------------------ */

// - simple  => return product.stockQty
// - variable => return sum(variant.stockQty for active variants)
ProductSchema.virtual("availableStock").get(function () {
  if (this.productType === "variable") {
    const vars = Array.isArray(this.variants) ? this.variants : [];
    return vars.reduce((sum, v) => {
      if (v?.isActive === false) return sum;
      const q = typeof v?.stockQty === "number" ? v.stockQty : 0;
      return sum + Math.max(q, 0);
    }, 0);
  }

  const q = typeof this.stockQty === "number" ? this.stockQty : 0;
  return Math.max(q, 0);
});

// pricing helpers
ProductSchema.virtual("finalPrice").get(function () {
  // variable product: return min final price across active variants (useful for listing)
  if (this.productType === "variable") {
    const vars = Array.isArray(this.variants) ? this.variants : [];
    const active = vars.filter((v) => v?.isActive !== false);
    if (active.length === 0) return this.price;

    const finals = active
      .map((v) => {
        const base = typeof v.price === "number" ? v.price : typeof this.price === "number" ? this.price : 0;
        const sale = typeof v.salePrice === "number" ? v.salePrice : null;
        return typeof sale === "number" && sale >= 0 ? sale : base;
      })
      .filter((n) => typeof n === "number" && n >= 0);

    if (finals.length === 0) return this.price;
    return Math.min(...finals);
  }

  // simple product
  if (typeof this.salePrice === "number" && this.salePrice >= 0) return this.salePrice;
  return this.price;
});

ProductSchema.virtual("discountAmount").get(function () {
  const p = typeof this.price === "number" ? this.price : 0;
  const fp = typeof this.finalPrice === "number" ? this.finalPrice : p;
  return Math.max(p - fp, 0);
});

ProductSchema.virtual("discountPercent").get(function () {
  const p = typeof this.price === "number" ? this.price : 0;
  const d = typeof this.discountAmount === "number" ? this.discountAmount : 0;
  if (p <= 0) return 0;
  return Math.round((d / p) * 100);
});

/* ------------------------------ helpers ------------------------------ */

function normalizeImages(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((img) => img && String(img.url || "").trim())
    .map((img, idx) => ({
      ...img,
      url: String(img.url).trim(),
      publicId: String(img.publicId || "").trim(),
      alt: String(img.alt || "").trim(),
      order: typeof img.order === "number" ? img.order : idx,
    }));
}

function normalizeDescriptionBlocks(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((b) => b && (String(b.title || "").trim() || String(b.details || "").trim()))
    .map((b, idx) => ({
      ...b,
      title: String(b.title || "").trim(),
      details: typeof b.details === "string" ? b.details : String(b.details || ""),
      order: typeof b.order === "number" ? b.order : idx,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function dedupeFeatures(features) {
  if (!Array.isArray(features)) return [];
  const cleaned = features
    .filter((f) => f && String(f.label || "").trim() && String(f.value || "").trim())
    .map((f) => ({
      ...f,
      label: String(f.label).trim(),
      value: String(f.value).trim(),
      group: String(f.group || "").trim(),
      isKey: Boolean(f.isKey),
      order: Number.isFinite(f.order) ? f.order : 0,
    }));

  const seen = new Set();
  const uniq = [];
  for (const f of cleaned) {
    const k = `${f.group || ""}||${f.label.toLowerCase()}||${f.value.toLowerCase()}||${f.isKey ? 1 : 0}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(f);
  }
  return uniq;
}

function clampNonNegativeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function normalizeBarcode(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

/* ------------------------------ pre-save ------------------------------ */

ProductSchema.pre("save", async function () {
  // slug normalize
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();

  // barcode normalize (product-level)
  this.barcode = normalizeBarcode(this.barcode);

  // tags: trim + dedupe
  this.tags = Array.isArray(this.tags)
    ? [...new Set(this.tags.map((t) => String(t).trim()).filter(Boolean))]
    : [];

  // normalize lists
  this.features = dedupeFeatures(this.features);
  this.galleryImages = normalizeImages(this.galleryImages);

  if (this.primaryImage) {
    const [pimg] = normalizeImages([this.primaryImage]);
    this.primaryImage = pimg || this.primaryImage;
  }

  this.description = normalizeDescriptionBlocks(this.description);

  // brand belongs to category
  if (this.brand && this.category) {
    const brand = await Brand.findById(this.brand).select("categoryIds isActive").lean();
    if (!brand) throw new Error("Invalid brand: brand not found.");
    if (brand.isActive === false) throw new Error("Invalid brand: brand is inactive.");

    const catIdStr = String(this.category);
    const brandCats = Array.isArray(brand.categoryIds) ? brand.categoryIds.map(String) : [];
    if (!brandCats.includes(catIdStr)) throw new Error("Brand does not belong to the selected category.");
  }

  // subcategory belongs to category
  if (this.subcategory) {
    const category = await Category.findById(this.category).select("subcategories isActive").lean();
    if (!category) throw new Error("Invalid category: category not found.");
    if (category.isActive === false) throw new Error("Invalid category: category is inactive.");

    const subIdStr = String(this.subcategory);
    const subs = Array.isArray(category.subcategories) ? category.subcategories : [];
    const found = subs.some((s) => String(s?._id) === subIdStr);
    if (!found) throw new Error("Subcategory does not belong to the selected category.");
  }

  // base price clamp (simple uses it; variable can keep as fallback)
  this.price = clampNonNegativeNumber(this.price, 0);

  // product-level salePrice clamp (<= price)
  if (this.salePrice !== null && this.salePrice !== undefined) {
    const sp = Number(this.salePrice);
    if (!Number.isFinite(sp) || sp < 0) this.salePrice = null;
    else this.salePrice = Math.min(sp, this.price);
  }

  // product stock clamp (used for simple only)
  this.stockQty = clampNonNegativeNumber(this.stockQty, 0);

  // product type rules + Barcode rules
  if (this.productType === "variable") {
    if (!Array.isArray(this.variants) || this.variants.length === 0) {
      throw new Error("Variable product must have at least one variant.");
    }

    // ✅ Variable product: product-level barcode should NOT be used
    this.barcode = "";

    this.variants = this.variants.map((v, idx) => {
      const nv = { ...(v?.toObject?.() ?? v ?? {}) };

      nv.barcode = normalizeBarcode(nv.barcode);
      nv.isActive = nv.isActive !== false;

      nv.images = normalizeImages(nv.images);

      // normalize attributes values to strings
      if (nv.attributes && typeof nv.attributes === "object") {
        const entries = nv.attributes instanceof Map ? Array.from(nv.attributes.entries()) : Object.entries(nv.attributes);
        const out = nv.attributes instanceof Map ? new Map() : {};
        for (const [k, val] of entries) {
          const key = String(k).trim();
          if (!key) continue;
          const value = val === null || val === undefined ? "" : String(val).trim();
          if (nv.attributes instanceof Map) out.set(key, value);
          else out[key] = value;
        }
        nv.attributes = out;
      }

      // variant price clamp
      if (nv.price !== null && nv.price !== undefined) {
        const vp = Number(nv.price);
        nv.price = Number.isFinite(vp) && vp >= 0 ? vp : null;
      }

      // ✅ ENFORCE: active variant must have price
      if (nv.isActive && typeof nv.price !== "number") {
        throw new Error("Each active variant requires a valid price.");
      }

      // variant salePrice clamp (<= variant price when variant price exists)
      if (nv.salePrice !== null && nv.salePrice !== undefined) {
        const vsp = Number(nv.salePrice);
        if (!Number.isFinite(vsp) || vsp < 0) nv.salePrice = null;
        else if (typeof nv.price === "number") nv.salePrice = Math.min(vsp, nv.price);
        else nv.salePrice = vsp;
      }

      // ✅ ENFORCE: active variant must have barcode (single identifier)
      if (nv.isActive && !nv.barcode) {
        throw new Error("Each active variant requires a barcode.");
      }

      // variant stock clamp
      nv.stockQty = clampNonNegativeNumber(nv.stockQty, 0);

      // default image order fallback
      nv.images = Array.isArray(nv.images)
        ? nv.images.map((img, i) => ({ ...img, order: typeof img.order === "number" ? img.order : i }))
        : [];

      return nv;
    });

    // ✅ ENFORCE: at least one ACTIVE variant
    const anyActive = this.variants.some((v) => v?.isActive !== false);
    if (!anyActive) throw new Error("Variable product must have at least one active variant.");

    // avoid confusion: product-level stock + salePrice not used for variable
    this.stockQty = 0;
    this.salePrice = null;
  } else {
    // simple product => no variants
    this.variants = [];

    // simple product barcode normalize
    this.barcode = normalizeBarcode(this.barcode);
  }
});

/* ------------------------------- indexes ------------------------------ */

ProductSchema.index({ slug: 1 }, { unique: true });

ProductSchema.index({ price: 1, salePrice: 1 });
ProductSchema.index({ stockQty: 1 });

ProductSchema.index({ "variants.stockQty": 1, "variants.isActive": 1 });
ProductSchema.index({ isNew: 1, createdAt: -1 });
ProductSchema.index({ isTrending: 1, createdAt: -1 });

ProductSchema.index({ title: "text", tags: "text" });

// Unique barcode (only when provided / not empty)
ProductSchema.index(
  { barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $type: "string", $ne: "" } } }
);

// Variant barcode uniqueness across all products (only when provided / not empty)
ProductSchema.index(
  { "variants.barcode": 1 },
  { unique: true, partialFilterExpression: { "variants.barcode": { $type: "string", $ne: "" } } }
);

/* ------------------------------ export ------------------------------ */

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;