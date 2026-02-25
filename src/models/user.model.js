import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 80, default: "" },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, 
    },

    passwordHash: { type: String, required: true, select: false }, 

    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, minimize: true, versionKey: false }
);


UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
