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
      'MONGODB_URL is missing. Set it in .env.local (examples: mongodb://127.0.0.1:27017 OR mongodb+srv://USER:PASS@CLUSTER.mongodb.net)'
    );
  }

  // ✅ Allow both schemes
  const isMongo = base.startsWith("mongodb://");
  const isSrv = base.startsWith("mongodb+srv://");

  if (!isMongo && !isSrv) {
    throw new Error(
      `Invalid MONGODB_URL scheme. It must start with "mongodb://" or "mongodb+srv://". Received: "${base}"`
    );
  }

  // Split query string safely
  const [beforeQuery, query] = base.split("?");
  const scheme = isSrv ? "mongodb+srv://" : "mongodb://";
  const rest = beforeQuery.slice(scheme.length);

  // If URI already has a db path ("/something"), do NOT append DB_NAME
  // Example: mongodb+srv://x:y@cluster/mydb  -> has db path
  const parts = rest.split("/");
  const hasDbPath = parts.length > 1 && parts[1] && parts[1].trim().length > 0;

  if (hasDbPath) {
    return `${beforeQuery}${query ? `?${query}` : ""}`;
  }

  // Append DB_NAME, preserve query if present
  const noTrailingSlash = beforeQuery.replace(/\/$/, "");
  const finalUri = `${noTrailingSlash}/${DB_NAME}${query ? `?${query}` : ""}`;

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