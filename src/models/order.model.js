import mongoose, { Schema } from "mongoose";

const AddressSchema = new Schema(
  {
    fullName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true },

    country: { type: String, trim: true, required: true, default: "BD" },
    city: { type: String, trim: true, required: true },
    area: { type: String, trim: true, required: true },
    addressLine1: { type: String, trim: true, required: true },
    addressLine2: { type: String, trim: true, required: true },
    postalCode: { type: String, trim: true, required: true },

    notes: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },

    productBarcode: { type: String, trim: true, default: "" },
    variantBarcode: { type: String, trim: true, default: "" },

    title: { type: String, required: true },
    image: { type: String, default: "" },
    attributes: { type: Map, of: String, default: {} },

    qty: { type: Number, min: 1, required: true },
    unitPrice: { type: Number, min: 0, required: true },
    lineTotal: { type: Number, min: 0, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNo: { type: String, unique: true, index: true },

    customer: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customerEmail: { type: String, trim: true, lowercase: true, default: "", index: true },

    items: { type: [OrderItemSchema], required: true },

    shippingAddress: { type: AddressSchema, required: true },

    subtotal: { type: Number, min: 0, required: true },
    shippingFee: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, required: true },

    paymentMethod: { type: String, enum: ["cod"], default: "cod", index: true },
    paymentStatus: { type: String, enum: ["unpaid"], default: "unpaid", index: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
      index: true,
    },

    noteFromCustomer: { type: String, trim: true, default: "" },
    adminNote: { type: String, trim: true, default: "" },
  },
  { timestamps: true, versionKey: false }
);

OrderSchema.pre("save", function () {
  if (!this.orderNo) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.orderNo = `ORD-${y}${m}${day}-${rand}`;
  }
});

OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);