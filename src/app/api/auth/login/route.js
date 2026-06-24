import mongoose from "mongoose";

const { Schema } = mongoose;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USER_STATUSES = ["active", "inactive"];

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
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

    status: {
      type: String,
      enum: USER_STATUSES,
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
    minimize: true,
    versionKey: false,
  }
);

UserSchema.index({ createdAt: -1, _id: -1 });
UserSchema.index({ status: 1, createdAt: -1, _id: -1 });

UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString?.() || ret._id;

    delete ret._id;
    delete ret.passwordHash;

    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);