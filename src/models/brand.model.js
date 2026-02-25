// src/models/brand.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

function slugify(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true, maxlength: 120 },
  },
  { _id: false }
);

const BrandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },

    // keep required, but auto-generated if missing
    slug: { type: String, required: true, trim: true, lowercase: true },

    // required brand logo
    image: { type: ImageSchema, required: true },

    // ✅ best practice: brand belongs to multiple categories
    // NOTE: "ref" here is for populate usage
    categoryIds: {
      type: [Schema.Types.ObjectId],
      ref: "Category",
      required: true,
      index: true,
      default: [],
    },

    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", index: true, default: null },
  },
  { timestamps: true, minimize: true, versionKey: false }
);

/** Indexes */
BrandSchema.index({ slug: 1 }, { unique: true });
BrandSchema.index({ isActive: 1, sortOrder: 1, name: 1 });
BrandSchema.index({ categoryIds: 1, isActive: 1 });

/**
 * ✅ Promise-based pre-validate (NO next())
 * - auto slug
 * - image required
 * - categoryIds required + valid + dedupe
 */
BrandSchema.pre("validate", function () {
  // name required (mongoose handles, but keep slug synced)
  if ((this.isModified("name") && !this.isModified("slug")) || (!this.slug && this.name)) {
    this.slug = slugify(this.name);
  }

  if (!this.image?.url) {
    throw new Error(`Brand image is required for "${this.name || "Brand"}".`);
  }

  if (!Array.isArray(this.categoryIds) || this.categoryIds.length === 0) {
    throw new Error(`At least 1 category is required for brand "${this.name || "Brand"}".`);
  }

  // Validate + dedupe categoryIds safely
  const seen = new Set();
  const cleaned = [];

  for (const raw of this.categoryIds) {
    const idStr = String(raw || "").trim();
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      throw new Error(`Invalid categoryId: ${idStr}`);
    }
    if (!seen.has(idStr)) {
      seen.add(idStr);
      cleaned.push(new mongoose.Types.ObjectId(idStr));
    }
  }

  this.categoryIds = cleaned;
});

BrandSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Brand || mongoose.model("Brand", BrandSchema);