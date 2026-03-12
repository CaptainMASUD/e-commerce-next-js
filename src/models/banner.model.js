import mongoose from "mongoose";

const { Schema } = mongoose;

const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true, maxlength: 150 },
  },
  { _id: false }
);

const BannerSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 120, default: "" },
    subtitle: { type: String, trim: true, maxlength: 250, default: "" },

    image: { type: ImageSchema, required: true },

    buttonText: { type: String, trim: true, maxlength: 40, default: "" },
    buttonLink: { type: String, trim: true, maxlength: 300, default: "" },

    ownerType: {
      type: String,
      required: true,
      enum: ["Category", "Subcategory", "Brand"],
      index: true,
    },

    // Category banner => ownerId = category._id
    // Brand banner => ownerId = brand._id
    // Subcategory banner => ownerId = category._id, subcategoryId = subcategory._id
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
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

    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", index: true, default: null },
  },
  { timestamps: true, minimize: true, versionKey: false }
);

BannerSchema.index({ ownerType: 1, ownerId: 1, isActive: 1, sortOrder: 1 });
BannerSchema.index({ ownerType: 1, ownerId: 1, subcategoryId: 1 });
BannerSchema.index({ startsAt: 1, endsAt: 1 });

BannerSchema.pre("validate", function () {
  if (!this.image?.url) {
    throw new Error("Banner image is required.");
  }

  if (this.ownerType === "Subcategory") {
    if (!this.subcategoryId) {
      throw new Error("subcategoryId is required when ownerType is Subcategory.");
    }
  } else {
    this.subcategoryId = null;
  }

  if (this.startsAt && this.endsAt && this.startsAt > this.endsAt) {
    throw new Error("startsAt cannot be greater than endsAt.");
  }
});

BannerSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

const Banner = mongoose.models.Banner || mongoose.model("Banner", BannerSchema);
export default Banner;