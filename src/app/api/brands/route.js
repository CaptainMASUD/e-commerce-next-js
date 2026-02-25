// app/api/brands/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Brand from "@/models/brand.model";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Example: ?fields=name,slug,image,sortOrder
function parseFieldsParam(url) {
  const raw = (url.searchParams.get("fields") || "").trim();
  if (!raw) return "name slug image sortOrder"; // default minimal

  const allowed = new Set(["name", "slug", "image", "sortOrder", "categoryIds", "_id"]);
  const parts = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const safe = parts.filter((f) => allowed.has(f));
  if (safe.length === 0) return "name slug image sortOrder _id";

  // Always include _id (useful for cursor)
  if (!safe.includes("_id")) safe.push("_id");
  return safe.join(" ");
}

export async function GET(req) {
  try {
    const url = new URL(req.url);

    const categoryId = (url.searchParams.get("categoryId") || "").trim();
    const qRaw = (url.searchParams.get("q") || "").trim();

    // pagination
    const limit = Math.min(Number(url.searchParams.get("limit") || 24), 100);
    const afterId = (url.searchParams.get("afterId") || "").trim();
    const afterSortOrderRaw = url.searchParams.get("afterSortOrder"); // string or null

    const selectFields = parseFieldsParam(url);

    await connectDB();

    const filter = { isActive: true };

    // category filter
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 });
      }
      filter.categoryIds = new mongoose.Types.ObjectId(categoryId);
    }

    // search (lightweight & safe)
    if (qRaw) {
      const q = escapeRegex(qRaw).slice(0, 50); // cap to avoid heavy regex scans
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ];
    }

    // cursor-based pagination for stable ordering
    const hasCursor =
      afterSortOrderRaw !== null &&
      afterId &&
      mongoose.Types.ObjectId.isValid(afterId);

    if (hasCursor) {
      const afterSortOrder = Number(afterSortOrderRaw) || 0;
      const afterObjId = new mongoose.Types.ObjectId(afterId);

      filter.$or = filter.$or
        ? [
            {
              $and: [
                { $or: filter.$or },
                {
                  $or: [
                    { sortOrder: { $gt: afterSortOrder } },
                    { sortOrder: afterSortOrder, _id: { $gt: afterObjId } },
                  ],
                },
              ],
            },
          ]
        : [
            { sortOrder: { $gt: afterSortOrder } },
            { sortOrder: afterSortOrder, _id: { $gt: afterObjId } },
          ];

      // If we moved q's $or into $and, remove top-level $or to avoid conflict
      if (qRaw) delete filter.$or;
    }

    const items = await Brand.find(filter)
      .select(selectFields)
      .sort({ sortOrder: 1, _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasNextPage = items.length > limit;
    const pageItems = hasNextPage ? items.slice(0, limit) : items;

    const nextCursor = hasNextPage
      ? {
          afterSortOrder: pageItems[pageItems.length - 1].sortOrder,
          afterId: String(pageItems[pageItems.length - 1]._id),
        }
      : null;

    const res = NextResponse.json(
      { items: pageItems, pageInfo: { limit, hasNextPage, nextCursor } },
      { status: 200 }
    );

    // ✅ FASTEST FRESHNESS: disable caching everywhere (browser/CDN/edge)
    res.headers.set("Cache-Control", "no-store, max-age=0");

    // (Optional but safe) prevent weird proxy caching
    res.headers.set("Pragma", "no-cache");

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch brands", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}