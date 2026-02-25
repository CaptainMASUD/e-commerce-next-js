// app/api/categories/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Category from "@/models/category.model";

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(String(cursor), "base64").toString("utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Cursor pagination condition for ascending sort:
 * sortOrder ASC, name ASC, _id ASC
 */
function buildCursorFilter(cursorObj) {
  if (!cursorObj) return null;
  const { sortOrder, name, id } = cursorObj || {};
  if (sortOrder == null || !name || !id) return null;

  return {
    $or: [
      { sortOrder: { $gt: sortOrder } },
      { sortOrder: sortOrder, name: { $gt: name } },
      { sortOrder: sortOrder, name: name, _id: { $gt: id } },
    ],
  };
}

export async function GET(req) {
  try {
    const url = new URL(req.url);

    // default true, can disable with ?includeSub=false
    const includeSub = url.searchParams.get("includeSub") !== "false";

    // pagination: ?limit=20&cursor=base64(...)
    const limit = Math.min(Math.max(toInt(url.searchParams.get("limit"), 50), 1), 100);
    const cursorObj = decodeCursor(url.searchParams.get("cursor"));
    const cursorFilter = buildCursorFilter(cursorObj);

    await connectDB();

    const baseFilter = { isActive: true };

    const filter =
      cursorFilter && cursorObj
        ? { $and: [baseFilter, cursorFilter] }
        : baseFilter;

    const selectFields = includeSub
      ? "name slug sortOrder subcategories isActive"
      : "name slug sortOrder isActive";

    const rows = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1, _id: 1 })
      .select(selectFields)
      .limit(limit + 1)
      .lean();

    const hasNextPage = rows.length > limit;
    const itemsRaw = hasNextPage ? rows.slice(0, limit) : rows;

    // clean subcategories (active only + sorted)
    const items = includeSub
      ? itemsRaw.map((c) => {
          const subs = Array.isArray(c.subcategories) ? c.subcategories : [];
          // filter active then sort by sortOrder
          const cleanedSubs = subs
            .filter((s) => s && s.isActive)
            .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));

          return { ...c, subcategories: cleanedSubs };
        })
      : itemsRaw;

    let nextCursor = null;
    if (hasNextPage && itemsRaw.length) {
      const last = itemsRaw[itemsRaw.length - 1];
      nextCursor = encodeCursor({
        sortOrder: last.sortOrder ?? 0,
        name: last.name ?? "",
        id: String(last._id),
      });
    }

    // ---- Caching headers (huge performance gain) ----
    // Adjust numbers based on how often categories change:
    // s-maxage caches at CDN/edge when available
    // stale-while-revalidate keeps it fast while refreshing in background
    const res = NextResponse.json(
      { items, pageInfo: { limit, hasNextPage, nextCursor } },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");

    // Optional: ETag so clients can get 304 (no body) if unchanged
    const etagBase = JSON.stringify({
      includeSub,
      limit,
      cursor: url.searchParams.get("cursor") || null,
      n: items.length,
      lastId: itemsRaw.at(-1)?._id || null,
    });
    const etag = `W/"${Buffer.from(etagBase).toString("base64")}"`;
    res.headers.set("ETag", etag);

    const inm = req.headers.get("if-none-match");
    if (inm && inm === etag) {
      return new NextResponse(null, { status: 304, headers: res.headers });
    }

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch categories", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}