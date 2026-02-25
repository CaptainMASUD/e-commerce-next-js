// src/models/category.model.js
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

const SubcategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    image: { type: ImageSchema, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true },

    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // ✅ embedded for fast navbar reads
    subcategories: { type: [SubcategorySchema], default: [] },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", index: true, default: null },
  },
  { timestamps: true, minimize: true, versionKey: false }
);

/** Indexes */
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });
CategorySchema.index({ "subcategories.slug": 1 });

CategorySchema.pre("validate", function () {
  if ((this.isModified("name") && !this.isModified("slug")) || (!this.slug && this.name)) {
    this.slug = slugify(this.name);
  }

  if (!Array.isArray(this.subcategories)) return;

  const seen = new Set();

  for (const s of this.subcategories) {
    if (!s.slug && s.name) s.slug = slugify(s.name);

    if (!s.slug) {
      throw new Error(`Subcategory slug missing under category "${this.name}".`);
    }
    if (!s.image?.url) {
      throw new Error(`Subcategory image is required for "${s.name}".`);
    }
    if (seen.has(s.slug)) {
      throw new Error(`Duplicate subcategory slug "${s.slug}" in category "${this.name}".`);
    }
    seen.add(s.slug);
  }
});

CategorySchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);