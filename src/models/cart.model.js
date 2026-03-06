import mongoose, { Schema } from "mongoose";

const CartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },

    // only for variable products
    variantBarcode: { type: String, trim: true, default: "", index: true },

    qty: { type: Number, min: 1, default: 1 },

    // optional snapshots for faster cart UI
    title: { type: String, default: "" },
    image: { type: String, default: "" },
    unitPrice: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const CartSchema = new Schema(
  {
    // logged-in
    user: { type: Schema.Types.ObjectId, ref: "User", unique: true, sparse: true, index: true },

    // optional guest cart
    guestId: { type: String, trim: true, default: "", index: true },

    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

CartSchema.index({ user: 1 });
CartSchema.index({ guestId: 1 });

export default mongoose.models.Cart || mongoose.model("Cart", CartSchema);