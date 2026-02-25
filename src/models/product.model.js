// src/models/product.model.js
// Highly optimized Mongoose Product model for Next.js (App Router)
// - Safe hot-reload handling
// - Strong indexing for search/filtering
// - Primary + gallery images
// - Dynamic features with "isKey" for top highlights
// - Variants support (optional)
// - ✅ Enforces Brand ↔ Category relationship at save time
// - ✅ Enforces Subcategory belongs to selected Category (embedded subcategories)

import mongoose, { Schema } from "mongoose";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";

/** ---------- Sub Schemas (no _id for performance) ---------- **/

const ProductImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true }, // Cloudinary optional
    alt: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0, index: true },
  },
  { _id: false }
);

const ProductFeatureSchema = new Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g. "Material"
    value: { type: String, required: true, trim: true }, // e.g. "100% Cotton"
    isKey: { type: Boolean, default: false, index: true }, // show on top
    order: { type: Number, default: 0, index: true }, // admin sort
    group: { type: String, trim: true, default: "" }, // optional grouping
  },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    sku: { type: String, trim: true },
    attributes: {
      // e.g. { color: "Black", size: "M" }
      type: Map,
      of: String,
      default: {},
    },
    price: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0 },
    stock: { type: Number, min: 0, default: 0 },
    images: { type: [ProductImageSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { _id: false }
);

/** ---------- Main Schema ---------- **/

const ProductSchema = new Schema(
  {
    // Core
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },

    // Descriptions
    shortDescription: { type: String, trim: true, maxlength: 400, default: "" },
    description: { type: String, default: "" }, // rich text / HTML allowed

    // Media
    primaryImage: { type: ProductImageSchema, required: true },
    galleryImages: { type: [ProductImageSchema], default: [] }, // sub images
    videoUrl: { type: String, trim: true, default: "" },

    // Taxonomy
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },

    /**
     * ✅ IMPORTANT:
     * Your Category has embedded subcategories (Category.subcategories[]).
     * So there is NO "Subcategory" collection to populate.
     * We store subcategory as the embedded subdocument _id.
     */
    subcategory: { type: Schema.Types.ObjectId, default: null, index: true },

    /**
     * ✅ You said product creation should "take both category and brand",
     * so make brand REQUIRED.
     */
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },

    tags: { type: [String], default: [], index: true },

    // Pricing
    price: { type: Number, required: true, min: 0, index: true },
    salePrice: { type: Number, min: 0, default: null, index: true },
    discountType: { type: String, enum: ["none", "percent", "fixed"], default: "none" },
    discountValue: { type: Number, min: 0, default: 0 },
    discountStart: { type: Date, default: null, index: true },
    discountEnd: { type: Date, default: null, index: true },

    // Inventory
    sku: { type: String, trim: true, index: true },
    barcode: { type: String, trim: true, index: true },
    trackInventory: { type: Boolean, default: true },
    stock: { type: Number, min: 0, default: 0, index: true }, // used for simple products
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    stockStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock", "backorder"],
      default: "in_stock",
      index: true,
    },
    minOrderQty: { type: Number, min: 1, default: 1 },
    maxOrderQty: { type: Number, min: 1, default: 999 },

    // Product type
    productType: { type: String, enum: ["simple", "variable"], default: "simple", index: true },
    variants: { type: [ProductVariantSchema], default: [] },

    // Shipping
    weight: { type: Number, min: 0, default: 0 },
    dimensions: {
      length: { type: Number, min: 0, default: 0 },
      width: { type: Number, min: 0, default: 0 },
      height: { type: Number, min: 0, default: 0 },
    },
    shippingClass: { type: String, trim: true, default: "" },

    // Features (dynamic)
    features: { type: [ProductFeatureSchema], default: [] },

    // SEO
    seoTitle: { type: String, trim: true, maxlength: 70, default: "" },
    seoDescription: { type: String, trim: true, maxlength: 160, default: "" },

    // Merchandising / visibility
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
    visibility: { type: String, enum: ["public", "hidden"], default: "public", index: true },
    isFeatured: { type: Boolean, default: false, index: true },

    // Soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },

    // Ratings (optional but common)
    ratingAvg: { type: Number, min: 0, max: 5, default: 0, index: true },
    ratingCount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

/** ---------- Optimized Virtuals / Computed ---------- **/

ProductSchema.virtual("finalPrice").get(function () {
  // Prefer salePrice if valid
  if (typeof this.salePrice === "number" && this.salePrice >= 0) return this.salePrice;

  // Otherwise compute based on discount schedule/type
  const now = new Date();
  const hasSchedule =
    (!this.discountStart || now >= this.discountStart) &&
    (!this.discountEnd || now <= this.discountEnd);

  if (!hasSchedule || !this.discountType || this.discountType === "none" || !this.discountValue) {
    return this.price;
  }

  if (this.discountType === "percent") {
    const pct = Math.min(Math.max(this.discountValue, 0), 100);
    return Math.max(this.price - (this.price * pct) / 100, 0);
  }

  if (this.discountType === "fixed") {
    return Math.max(this.price - this.discountValue, 0);
  }

  return this.price;
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

/** ---------- Indexes (very important for speed) ---------- **/

// Unique slug (avoid collisions)
ProductSchema.index({ slug: 1 }, { unique: true });

// Fast filtering (common store queries)
ProductSchema.index({ status: 1, visibility: 1, isDeleted: 1, createdAt: -1 });
ProductSchema.index({ category: 1, status: 1, isDeleted: 1, createdAt: -1 });
ProductSchema.index({ brand: 1, status: 1, isDeleted: 1, createdAt: -1 });

// Price range queries
ProductSchema.index({ price: 1, salePrice: 1 });

// Text search (simple but effective)
// NOTE: MongoDB allows only one text index per collection.
ProductSchema.index({
  title: "text",
  shortDescription: "text",
  tags: "text",
});

/** ---------- Middleware: keep data consistent + enforce relations ---------- **/

// ✅ FIXED: async middleware should NOT use next()
// Throw errors instead.
ProductSchema.pre("save", async function () {
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();

  // sanitize features: remove empty label/value
  if (Array.isArray(this.features)) {
    this.features = this.features
      .filter((f) => f && String(f.label || "").trim() && String(f.value || "").trim())
      .map((f) => ({
        ...f,
        label: String(f.label).trim(),
        value: String(f.value).trim(),
        group: String(f.group || "").trim(),
      }));
  }

  // inventory consistency (simple products)
  if (this.productType === "simple" && this.trackInventory) {
    if (this.stock <= 0) this.stockStatus = "out_of_stock";
    else if (this.stockStatus === "out_of_stock") this.stockStatus = "in_stock";
  }

  // ensure images ordering
  if (Array.isArray(this.galleryImages)) {
    this.galleryImages = this.galleryImages.map((img, idx) => ({
      ...img,
      order: typeof img.order === "number" ? img.order : idx,
    }));
  }

  /**
   * ✅ ENFORCE: Brand must belong to Category
   * Brand.categoryIds MUST include Product.category
   */
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

  /**
   * ✅ ENFORCE: Subcategory must exist under selected Category (embedded subcategories)
   */
  if (this.subcategory) {
    if (!this.category) throw new Error("Category is required when subcategory is provided.");

    const category = await Category.findById(this.category).select("subcategories isActive").lean();
    if (!category) throw new Error("Invalid category: category not found.");
    if (category.isActive === false) throw new Error("Invalid category: category is inactive.");

    const subIdStr = String(this.subcategory);
    const subs = Array.isArray(category.subcategories) ? category.subcategories : [];
    const found = subs.some((s) => String(s?._id) === subIdStr);

    if (!found) throw new Error("Subcategory does not belong to the selected category.");
  }
});

/** ---------- Helpers (optional) ---------- **/

ProductSchema.methods.getKeyFeatures = function (limit = 6) {
  const list = Array.isArray(this.features) ? this.features : [];
  const key = list
    .filter((f) => f?.isKey)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return key.slice(0, Math.max(0, limit));
};

ProductSchema.methods.getSpecFeatures = function () {
  const list = Array.isArray(this.features) ? this.features : [];
  return list
    .filter((f) => !f?.isKey)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/** ---------- Model Export (hot-reload safe) ---------- **/

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;