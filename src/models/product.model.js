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

/**
 * Product specifications
 * Dynamic structured facts for filtering / comparison / display
 * Example:
 * - material = Cotton
 * - battery = 5000mAh
 * - display_size = 6.7 inch
 */
const ProductSpecificationSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },

    valueType: {
      type: String,
      enum: ["text", "number", "boolean", "list"],
      default: "text",
      index: true,
    },

    unit: { type: String, trim: true, default: "" },

    isFilterable: { type: Boolean, default: false, index: true },
    isComparable: { type: Boolean, default: true, index: true },
    isHighlighted: { type: Boolean, default: false, index: true },

    order: { type: Number, default: 0, index: true },
  },
  { _id: false }
);

// description blocks: each block has a title + details
const ProductDescriptionBlockSchema = new Schema(
  {
    title: { type: String, trim: true, default: "" },
    details: { type: String, default: "" },
    order: { type: Number, default: 0, index: true },
  },
  { _id: false }
);

/**
 * Variant schema
 * Single identifier = barcode
 * Dynamic attributes
 * Example:
 * { color: "Black", storage: "256GB" }
 */
const ProductVariantSchema = new Schema(
  {
    barcode: { type: String, trim: true, index: true, default: "" },

    attributes: { type: Map, of: String, default: {} },

    price: { type: Number, min: 0, default: null },
    salePrice: { type: Number, min: 0, default: null },

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

    // Product-level barcode for simple products
    barcode: { type: String, trim: true, index: true, default: "" },

    // Base price
    // For simple product -> actual price
    // For variable product -> optional fallback / listing fallback
    price: { type: Number, min: 0, default: 0, index: true },

    salePrice: { type: Number, min: 0, default: null, index: true },

    // Used only when productType === "simple"
    stockQty: { type: Number, min: 0, default: 0, index: true },

    productType: {
      type: String,
      enum: ["simple", "variable"],
      default: "simple",
      index: true,
    },

    // Dynamic variants
    variants: { type: [ProductVariantSchema], default: [] },

    isNew: { type: Boolean, default: false, index: true },
    isTrending: { type: Boolean, default: false, index: true },

    primaryImage: { type: ProductImageSchema, required: true },
    galleryImages: { type: [ProductImageSchema], default: [] },

    tags: { type: [String], default: [], index: true },

    // Dynamic structured specs
    specifications: { type: [ProductSpecificationSchema], default: [] },

    // Marketing bullets
    highlights: { type: [String], default: [] },

    // Rich content blocks
    description: { type: [ProductDescriptionBlockSchema], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* ------------------------------ virtuals ------------------------------ */

// simple => stockQty
// variable => sum(active variant stock)
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
  if (this.productType === "variable") {
    const vars = Array.isArray(this.variants) ? this.variants : [];
    const active = vars.filter((v) => v?.isActive !== false);
    if (active.length === 0) return this.price;

    const finals = active
      .map((v) => {
        const base =
          typeof v.price === "number"
            ? v.price
            : typeof this.price === "number"
              ? this.price
              : 0;

        const sale = typeof v.salePrice === "number" ? v.salePrice : null;
        return typeof sale === "number" && sale >= 0 ? sale : base;
      })
      .filter((n) => typeof n === "number" && n >= 0);

    if (finals.length === 0) return this.price;
    return Math.min(...finals);
  }

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

function normalizeHighlights(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((v) => String(v || "").trim()).filter(Boolean))];
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
      return [...new Set(value.map((v) => String(v || "").trim()).filter(Boolean))];
    }
    if (value === null || value === undefined) return [];
    return [...new Set(String(value).split(",").map((v) => v.trim()).filter(Boolean))];
  }

  return String(value ?? "").trim();
}

function normalizeSpecifications(list) {
  if (!Array.isArray(list)) return [];

  const cleaned = list
    .filter((s) => s && String(s.key || "").trim() && String(s.label || "").trim())
    .map((s, idx) => {
      const valueType = ["text", "number", "boolean", "list"].includes(String(s.valueType || "text"))
        ? String(s.valueType || "text")
        : "text";

      const key = String(s.key).trim().toLowerCase();
      const label = String(s.label).trim();
      const value = normalizeSpecificationValue(s.value, valueType);

      return {
        ...s,
        key,
        label,
        value,
        valueType,
        unit: String(s.unit || "").trim(),
        isFilterable: Boolean(s.isFilterable),
        isComparable: s.isComparable !== false,
        isHighlighted: Boolean(s.isHighlighted),
        order: Number.isFinite(s.order) ? s.order : idx,
      };
    })
    .filter((s) => {
      if (s.valueType === "list") return Array.isArray(s.value) && s.value.length > 0;
      if (s.valueType === "number" || s.valueType === "boolean") return s.value !== null;
      return String(s.value || "").trim() !== "";
    });

  const seen = new Set();
  const uniq = [];

  for (const s of cleaned) {
    const valueKey = Array.isArray(s.value) ? s.value.join("|").toLowerCase() : String(s.value).toLowerCase();
    const k = `${s.key}||${valueKey}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(s);
  }

  return uniq.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();

  this.barcode = normalizeBarcode(this.barcode);

  this.tags = Array.isArray(this.tags)
    ? [...new Set(this.tags.map((t) => String(t).trim()).filter(Boolean))]
    : [];

  this.galleryImages = normalizeImages(this.galleryImages);

  if (this.primaryImage) {
    const [pimg] = normalizeImages([this.primaryImage]);
    this.primaryImage = pimg || this.primaryImage;
  }

  this.description = normalizeDescriptionBlocks(this.description);
  this.highlights = normalizeHighlights(this.highlights);
  this.specifications = normalizeSpecifications(this.specifications);

  // brand belongs to category
  if (this.brand && this.category) {
    const brand = await Brand.findById(this.brand).select("categoryIds isActive").lean();
    if (!brand) throw new Error("Invalid brand: brand not found.");
    if (brand.isActive === false) throw new Error("Invalid brand: brand is inactive.");

    const catIdStr = String(this.category);
    const brandCats = Array.isArray(brand.categoryIds) ? brand.categoryIds.map(String) : [];
    if (!brandCats.includes(catIdStr)) {
      throw new Error("Brand does not belong to the selected category.");
    }
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

  this.price = clampNonNegativeNumber(this.price, 0);

  if (this.salePrice !== null && this.salePrice !== undefined) {
    const sp = Number(this.salePrice);
    if (!Number.isFinite(sp) || sp < 0) this.salePrice = null;
    else this.salePrice = Math.min(sp, this.price);
  }

  this.stockQty = clampNonNegativeNumber(this.stockQty, 0);

  if (this.productType === "variable") {
    if (!Array.isArray(this.variants) || this.variants.length === 0) {
      throw new Error("Variable product must have at least one variant.");
    }

    // variable product does not use product-level barcode
    this.barcode = "";

    this.variants = this.variants.map((v) => {
      const nv = { ...(v?.toObject?.() ?? v ?? {}) };

      nv.barcode = normalizeBarcode(nv.barcode);
      nv.isActive = nv.isActive !== false;
      nv.images = normalizeImages(nv.images);

      if (nv.attributes && typeof nv.attributes === "object") {
        const entries =
          nv.attributes instanceof Map
            ? Array.from(nv.attributes.entries())
            : Object.entries(nv.attributes);

        const out = nv.attributes instanceof Map ? new Map() : {};

        for (const [k, val] of entries) {
          const key = String(k).trim().toLowerCase();
          if (!key) continue;

          const value = val === null || val === undefined ? "" : String(val).trim();
          if (!value) continue;

          if (nv.attributes instanceof Map) out.set(key, value);
          else out[key] = value;
        }

        nv.attributes = out;
      }

      if (nv.price !== null && nv.price !== undefined) {
        const vp = Number(nv.price);
        nv.price = Number.isFinite(vp) && vp >= 0 ? vp : null;
      }

      if (nv.isActive && typeof nv.price !== "number") {
        throw new Error("Each active variant requires a valid price.");
      }

      if (nv.salePrice !== null && nv.salePrice !== undefined) {
        const vsp = Number(nv.salePrice);
        if (!Number.isFinite(vsp) || vsp < 0) nv.salePrice = null;
        else if (typeof nv.price === "number") nv.salePrice = Math.min(vsp, nv.price);
        else nv.salePrice = vsp;
      }

      if (nv.isActive && !nv.barcode) {
        throw new Error("Each active variant requires a barcode.");
      }

      nv.stockQty = clampNonNegativeNumber(nv.stockQty, 0);

      nv.images = Array.isArray(nv.images)
        ? nv.images.map((img, i) => ({
            ...img,
            order: typeof img.order === "number" ? img.order : i,
          }))
        : [];

      return nv;
    });

    const anyActive = this.variants.some((v) => v?.isActive !== false);
    if (!anyActive) {
      throw new Error("Variable product must have at least one active variant.");
    }

    this.stockQty = 0;
    this.salePrice = null;
  } else {
    this.variants = [];
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

// Useful for filtering / searching specs
ProductSchema.index({ "specifications.key": 1, "specifications.value": 1 });
ProductSchema.index({ "specifications.isFilterable": 1, "specifications.key": 1 });

ProductSchema.index(
  { barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $type: "string", $ne: "" } } }
);

ProductSchema.index(
  { "variants.barcode": 1 },
  { unique: true, partialFilterExpression: { "variants.barcode": { $type: "string", $ne: "" } } }
);

/* ------------------------------ export ------------------------------ */

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;