// app/api/new-arival/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/product.model";
import connectDB from "@/lib/dbConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ----------------------------- small utils ---------------------------- */

function clampInt(value, { min = 1, max = 100, fallback = 10 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

function isValidObjectId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

async function makeWeakETagFromJSON(obj) {
  const json = JSON.stringify(obj);
  const { createHash } = await import("crypto");
  const hash = createHash("sha1").update(json).digest("hex");
  return `W/"${hash}"`;
}

/* -------------------------------- GET -------------------------------- */
/**
 * GET /api/new-arival
 *
 * Query params:
 * - limit (default 12, max 60)
 * - page  (default 1)
 * - category=<ObjectId> (optional)
 * - brand=<ObjectId>    (optional)
 *
 * Returns only products with isNew=true, newest first.
 * ✅ Optimized: lean + projection (NO galleryImages) + ETag + CDN cache headers
 */
export async function GET(req) {
  const start = Date.now();

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const limit = clampInt(searchParams.get("limit"), { min: 1, max: 60, fallback: 12 });
    const page = clampInt(searchParams.get("page"), { min: 1, max: 100000, fallback: 1 });

    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    const filter = { isNew: true };

    if (category) {
      if (!isValidObjectId(category)) {
        return NextResponse.json({ success: false, message: "Invalid category id" }, { status: 400 });
      }
      filter.category = category;
    }

    if (brand) {
      if (!isValidObjectId(brand)) {
        return NextResponse.json({ success: false, message: "Invalid brand id" }, { status: 400 });
      }
      filter.brand = brand;
    }

    const skip = (page - 1) * limit;

    // ✅ Projection (NO galleryImages)
    // Remove "variants" too if you don’t need it for listing.
    const projection = [
      "title",
      "slug",
      "brand",
      "category",
      "subcategory",
      "productType",
      "price",
      "salePrice",
      "primaryImage",
      "tags",
      "isNew",
      "isTrending",
      "createdAt",
      "updatedAt",
      "variants",
    ].join(" ");

    // ✅ Guard against slow/hanging queries
    const queryOpts = { maxTimeMS: 8000 };

    const [items, total] = await Promise.all([
      Product.find(filter, projection, queryOpts)
        .sort({ createdAt: -1 }) // uses your index: { isNew:1, createdAt:-1 }
        .skip(skip)
        .limit(limit)
        .populate({ path: "brand", select: "name slug", options: queryOpts })
        .populate({ path: "category", select: "name slug", options: queryOpts })
        .lean(),
      Product.countDocuments(filter, queryOpts),
    ]);

    const payload = {
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      meta: {
        tookMs: Date.now() - start,
      },
    };

    // ✅ ETag to reduce bandwidth
    const etag = await makeWeakETagFromJSON(payload);
    const ifNoneMatch = req.headers.get("if-none-match");

    const headers = {
      ETag: etag,
      // ✅ Edge/CDN cache (tune as you need)
      // If you need realtime updates, reduce s-maxage or remove it.
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
    };

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    return NextResponse.json(payload, { status: 200, headers });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to load new arrival products" },
      { status: 500 }
    );
  }
}