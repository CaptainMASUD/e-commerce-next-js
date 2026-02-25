import mongoose from "mongoose";
import { DB_NAME } from "../utils/constrains.js";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const buildMongoUri = () => {
  const base = process.env.MONGODB_URL;

  if (!base) {
    throw new Error(
      "MONGODB_URL is missing. Set it in your .env.local (example: mongodb://127.0.0.1:27017 or mongodb+srv://... )"
    );
  }

  if (!base.startsWith("mongodb://") && !base.startsWith("mongodb+srv://")) {
    throw new Error(
      `Invalid MONGODB_URL scheme. It must start with "mongodb://" or "mongodb+srv://". Received: "${base}"`
    );
  }

  // If the base already contains a path ("/something"), we will not append DB_NAME
  // Otherwise, we append DB_NAME safely while preserving query string.
  const hasPath =
    base.replace(/^mongodb(\+srv)?:\/\//, "").includes("/");

  if (hasPath) return base;

  // Append DB name, keep query string if any
  const [noQuery, query] = base.split("?");
  const finalUri = `${noQuery.replace(/\/$/, "")}/${DB_NAME}${query ? `?${query}` : ""}`;

  return finalUri;
};

const connectDB = async () => {
  try {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      const uri = buildMongoUri();

      cached.promise = mongoose
        .connect(uri, {
          // good defaults
          autoIndex: true,
        })
        .then((mongooseInstance) => mongooseInstance);
    }

    cached.conn = await cached.promise;

    console.log(`MongoDB connected ✅ Host: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (error) {
    console.error("MongoDB connection failed! ❌", error);
    throw error; // Let Next.js handle it
  }
};

export default connectDB;
