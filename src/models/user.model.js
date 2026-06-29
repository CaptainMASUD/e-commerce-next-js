import mongoose from "mongoose";

const { Schema } = mongoose;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USER_ROLES = ["super_admin", "admin", "customer"];
const USER_STATUSES = ["active", "inactive"];

const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: (value) => EMAIL_REGEX.test(value),
        message: "Invalid email format.",
      },
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
      index: true,
    },

    status: {
      type: String,
      enum: USER_STATUSES,
      default: "active",
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    verifyToken: {
      type: String,
      default: null,
      index: true,
    },

    verifyTokenExpiry: {
      type: Date,
      default: null,
    },

    resetPasswordToken: {
      type: String,
      default: null,
      index: true,
    },

    resetPasswordExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: true,
    versionKey: false,
  }
);

UserSchema.index({ createdAt: -1, _id: -1 });
UserSchema.index({ role: 1, status: 1, createdAt: -1, _id: -1 });
UserSchema.index({ status: 1, createdAt: -1, _id: -1 });
UserSchema.index({ role: 1, createdAt: -1, _id: -1 });

UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString?.() || ret._id;

    delete ret._id;
    delete ret.passwordHash;
    delete ret.verifyToken;
    delete ret.verifyTokenExpiry;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpiry;

    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);