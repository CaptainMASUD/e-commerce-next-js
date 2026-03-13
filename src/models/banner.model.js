import mongoose from "mongoose";

const { Schema } = mongoose;

/* ----------------------------- sub-schemas ----------------------------- */

const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true, maxlength: 150 },
  },
  { _id: false }
);

/* ------------------------------ main schema ----------------------------- */

const BannerSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 120 },
    subtitle: { type: String, trim: true, maxlength: 250 },

    image: { type: ImageSchema, required: true },

    buttonText: { type: String, trim: true, maxlength: 40 },
    buttonLink: { type: String, trim: true, maxlength: 300 },

    ownerType: {
      type: String,
      required: true,
      enum: ["Category", "Subcategory", "Brand", "NewArrival"],
      index: true,
    },

    /**
     * Owner rules:
     *
     * Category banner:
     *   ownerId = category._id
     *
     * Brand banner:
     *   ownerId = brand._id
     *
     * Subcategory banner:
     *   ownerId = category._id
     *   subcategoryId = subcategory._id
     *
     * NewArrival banner:
     *   ownerId = null
     *   subcategoryId = null
     */
    ownerId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    subcategoryId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
  },
  { timestamps: true, minimize: true, versionKey: false }
);

/* -------------------------------- indexes -------------------------------- */

BannerSchema.index({ ownerType: 1, ownerId: 1, isActive: 1, sortOrder: 1 });
BannerSchema.index({ ownerType: 1, ownerId: 1, subcategoryId: 1 });
BannerSchema.index({ startsAt: 1, endsAt: 1 });

/* ----------------------------- validations ----------------------------- */

BannerSchema.pre("validate", function () {
  if (!this.image?.url) {
    throw new Error("Banner image is required.");
  }

  // NewArrival banner
  if (this.ownerType === "NewArrival") {
    this.ownerId = null;
    this.subcategoryId = null;
  }

  // Subcategory banner
  else if (this.ownerType === "Subcategory") {
    if (!this.ownerId) {
      throw new Error("ownerId (categoryId) is required when ownerType is Subcategory.");
    }

    if (!this.subcategoryId) {
      throw new Error("subcategoryId is required when ownerType is Subcategory.");
    }
  }

  // Category / Brand banner
  else {
    if (!this.ownerId) {
      throw new Error(`ownerId is required when ownerType is ${this.ownerType}.`);
    }

    this.subcategoryId = null;
  }

  if (this.startsAt && this.endsAt && this.startsAt > this.endsAt) {
    throw new Error("startsAt cannot be greater than endsAt.");
  }
});

/* ------------------------------- toJSON ------------------------------- */

BannerSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

/* -------------------------------- export -------------------------------- */

const Banner = mongoose.models.Banner || mongoose.model("Banner", BannerSchema);
export default Banner;