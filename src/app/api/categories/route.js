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

  const sortOrder = Number(cursorObj.sortOrder);
  const name = typeof cursorObj.name === "string" ? cursorObj.name : null;
  const id = cursorObj.id ? String(cursorObj.id) : null;

  // IMPORTANT: name can’t be empty for reliable cursor paging (schema enforces minlength anyway)
  if (!Number.isFinite(sortOrder) || !name || !id) return null;

  return {
    $or: [
      { sortOrder: { $gt: sortOrder } },
      { sortOrder: sortOrder, name: { $gt: name } },
      { sortOrder: sortOrder, name: name, _id: { $gt: id } },
    ],
  };
}

function sortSubsStable(a, b) {
  const ao = Number.isFinite(a?.sortOrder) ? a.sortOrder : 0;
  const bo = Number.isFinite(b?.sortOrder) ? b.sortOrder : 0;
  if (ao !== bo) return ao - bo;

  const an = String(a?.name ?? "");
  const bn = String(b?.name ?? "");
  const byName = an.localeCompare(bn);
  if (byName !== 0) return byName;

  // last tiebreaker for stability
  return String(a?._id ?? "").localeCompare(String(b?._id ?? ""));
}

export async function GET(req) {
  try {
    const url = new URL(req.url);

    /**
     * Query params:
     * - includeSub=true|false (default true)
     * - subView=home  -> returns only subcategories { name, image:{url,alt} } (plus slug if you want)
     * - limit=1..100 (default 50)
     * - cursor=base64(...) for categories pagination
     */
    const includeSub = url.searchParams.get("includeSub") !== "false";
    const subView = (url.searchParams.get("subView") || "").toLowerCase(); // "home" optional

    const limit = Math.min(Math.max(toInt(url.searchParams.get("limit"), 50), 1), 100);
    const cursorObj = decodeCursor(url.searchParams.get("cursor"));
    const cursorFilter = buildCursorFilter(cursorObj);

    await connectDB();

    const baseFilter = { isActive: true };
    const filter = cursorFilter ? { $and: [baseFilter, cursorFilter] } : baseFilter;

    /**
     * We select extra fields (like subcategories.sortOrder/isActive) even for home view
     * so we can clean/sort correctly, then strip them in response.
     */
    const selectFields = includeSub
      ? "name slug sortOrder isActive updatedAt subcategories"
      : "name slug sortOrder isActive updatedAt";

    const query = Category.find(filter)
      // stable sort keys for cursor paging:
      .sort({ sortOrder: 1, name: 1, _id: 1 })
      // If you need case-insensitive sorting for name, uncomment collation:
      // .collation({ locale: "en", strength: 2 })
      .select(selectFields)
      .limit(limit + 1)
      .lean();

    const rows = await query;

    const hasNextPage = rows.length > limit;
    const pageRows = hasNextPage ? rows.slice(0, limit) : rows;

    // Build items with cleaned/sorted subcategories when requested
    const items = includeSub
      ? pageRows.map((c) => {
          const subs = Array.isArray(c.subcategories) ? c.subcategories : [];

          const cleanedSubs = subs
            .filter((s) => s && s.isActive)
            .slice()
            .sort(sortSubsStable);

          if (subView === "home") {
            // ONLY name + picture (and optional slug)
            const homeSubs = cleanedSubs.map((s) => ({
              name: s.name,
              // keep slug if you want to navigate on click:
              slug: s.slug,
              image: {
                url: s.image?.url || "",
                alt: s.image?.alt || s.name || "",
              },
            }));

            return {
              name: c.name,
              slug: c.slug,
              sortOrder: c.sortOrder ?? 0,
              updatedAt: c.updatedAt,
              subcategories: homeSubs,
            };
          }

          // default: return full embedded subcategory docs (as stored), but only active + sorted
          return { ...c, subcategories: cleanedSubs };
        })
      : pageRows;

    // IMPORTANT FIX: cursor must be built from the last item actually returned in this page
    let nextCursor = null;
    if (hasNextPage && pageRows.length) {
      const last = pageRows[pageRows.length - 1];

      // cursor requires reliable values
      if (Number.isFinite(last?.sortOrder) && typeof last?.name === "string" && last.name && last?._id) {
        nextCursor = encodeCursor({
          sortOrder: last.sortOrder,
          name: last.name,
          id: String(last._id),
        });
      }
    }

    // Prepare response body
    const body = {
      items,
      pageInfo: { limit, hasNextPage, nextCursor },
      // optional: helps clients understand response shape
      meta: { includeSub, subView: subView || null },
    };

    // Compute weak ETag
    const first = pageRows[0];
    const last = pageRows[pageRows.length - 1];

    const etagBase = JSON.stringify({
      includeSub,
      subView: subView || null,
      limit,
      cursor: url.searchParams.get("cursor") || null,
      count: pageRows.length,
      firstId: first?._id ? String(first._id) : null,
      lastId: last?._id ? String(last._id) : null,
      firstUpdatedAt: first?.updatedAt ? new Date(first.updatedAt).getTime() : null,
      lastUpdatedAt: last?.updatedAt ? new Date(last.updatedAt).getTime() : null,
    });

    const etag = `W/"${Buffer.from(etagBase, "utf8").toString("base64")}"`;

    // If client matches ETag, return 304 with the same caching headers
    const inm = req.headers.get("if-none-match");
    if (inm && inm === etag) {
      const r304 = new NextResponse(null, { status: 304 });
      r304.headers.set("ETag", etag);
      r304.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
      return r304;
    }

    const res = NextResponse.json(body, { status: 200 });
    res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    res.headers.set("ETag", etag);

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch categories", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}