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
  if (!raw) return "name slug image sortOrder _id"; // default minimal + _id

  const allowed = new Set(["name", "slug", "image", "sortOrder", "categoryIds", "_id"]);
  const parts = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const safe = parts.filter((f) => allowed.has(f));
  if (safe.length === 0) return "name slug image sortOrder _id";

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

    // ✅ Build filter with $and so search + cursor never conflict
    const and = [{ isActive: true }];

    // category filter
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 });
      }
      and.push({ categoryIds: new mongoose.Types.ObjectId(categoryId) });
    }

    // search (lightweight & safe)
    if (qRaw) {
      const q = escapeRegex(qRaw).slice(0, 50); // cap to avoid heavy regex scans
      and.push({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { slug: { $regex: q, $options: "i" } },
        ],
      });
    }

    // cursor-based pagination for stable ordering
    const hasCursor =
      afterSortOrderRaw !== null &&
      afterId &&
      mongoose.Types.ObjectId.isValid(afterId);

    if (hasCursor) {
      const afterSortOrder = Number(afterSortOrderRaw) || 0;
      const afterObjId = new mongoose.Types.ObjectId(afterId);

      and.push({
        $or: [
          { sortOrder: { $gt: afterSortOrder } },
          { sortOrder: afterSortOrder, _id: { $gt: afterObjId } },
        ],
      });
    }

    const filter = and.length > 1 ? { $and: and } : and[0];

    const docs = await Brand.find(filter)
      .select(selectFields)
      .sort({ sortOrder: 1, _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasNextPage = docs.length > limit;
    const pageItems = hasNextPage ? docs.slice(0, limit) : docs;

    const nextCursor = hasNextPage
      ? {
          afterSortOrder: pageItems[pageItems.length - 1].sortOrder ?? 0,
          afterId: String(pageItems[pageItems.length - 1]._id),
        }
      : null;

    const res = NextResponse.json(
      { items: pageItems, pageInfo: { limit, hasNextPage, nextCursor } },
      { status: 200 }
    );

    // ✅ Consistent caching strategy (match categories-ish, but shorter)
    // If brands rarely change, increase s-maxage.
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch brands", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}