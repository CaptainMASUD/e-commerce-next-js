// src/lib/dbConfig.js
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
      "MONGODB_URL is missing. Set it in .env.local (example: mongodb://127.0.0.1:27017)"
    );
  }

  // ✅ You said: ONLY localhost, NO SRV
  if (base.startsWith("mongodb+srv://")) {
    throw new Error(
      `❌ SRV URI detected but this project is configured for localhost only.\nReceived: "${base}"\nFix .env.local to: mongodb://127.0.0.1:27017`
    );
  }

  if (!base.startsWith("mongodb://")) {
    throw new Error(
      `Invalid MONGODB_URL scheme. It must start with "mongodb://". Received: "${base}"`
    );
  }

  // If the base already contains a path ("/something"), we will not append DB_NAME
  const hasPath = base.replace(/^mongodb:\/\//, "").includes("/");

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

      // ✅ DEBUG: shows what THIS request is using
      console.log("✅ Mongo URI being used:", uri);

      cached.promise = mongoose
        .connect(uri, {
          autoIndex: true,
          serverSelectionTimeoutMS: 10000,
        })
        .then((mongooseInstance) => mongooseInstance);
    }

    cached.conn = await cached.promise;

    console.log(`MongoDB connected ✅ Host: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (error) {
    console.error("MongoDB connection failed! ❌", error);
    throw error;
  }
};

export default connectDB;