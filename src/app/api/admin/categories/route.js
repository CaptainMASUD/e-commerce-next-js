// app/api/admin/categories/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Category from "@/models/category.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

function jsonError(message, status = 400, details) {
  const payload = { error: message };
  if (details) payload.details = details;
  return NextResponse.json(payload, { status });
}

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
  if (!cursorObj) return {};
  const { sortOrder, name, id } = cursorObj || {};
  if (sortOrder == null || !name || !id) return {};

  return {
    $or: [
      { sortOrder: { $gt: sortOrder } },
      { sortOrder: sortOrder, name: { $gt: name } },
      { sortOrder: sortOrder, name: name, _id: { $gt: id } },
    ],
  };
}

export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // "active" | "inactive" | null
    const limit = Math.min(Math.max(toInt(url.searchParams.get("limit"), 20), 1), 100);
    const cursor = decodeCursor(url.searchParams.get("cursor"));

    await connectDB();

    const baseFilter = {};
    if (status === "active") baseFilter.isActive = true;
    if (status === "inactive") baseFilter.isActive = false;

    const cursorFilter = buildCursorFilter(cursor);

    const filter =
      cursor && Object.keys(cursorFilter).length
        ? { $and: [baseFilter, cursorFilter] }
        : baseFilter;

    const rows = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1, _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor = null;
    if (hasMore && items.length) {
      const last = items[items.length - 1];
      nextCursor = encodeCursor({
        sortOrder: last.sortOrder ?? 0,
        name: last.name ?? "",
        id: String(last._id),
      });
    }

    return NextResponse.json({ items, nextCursor }, { status: 200 });
  } catch (err) {
    return jsonError("Failed to fetch categories (admin)", 500, err?.message || String(err));
  }
}

export async function POST(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json().catch(() => ({}));
    const { name, slug, sortOrder = 0, isActive = true, subcategories = [] } = body || {};

    if (!name?.trim()) return jsonError("Category name is required", 400);

    await connectDB();

    // Create via mongoose -> your schema pre('validate') will auto-generate slug if missing
    const doc = await Category.create({
      name: name.trim(),
      slug: slug?.trim() || undefined,
      sortOrder: Number(sortOrder) || 0,
      isActive: Boolean(isActive),
      subcategories: Array.isArray(subcategories) ? subcategories : [],
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    });

    return NextResponse.json({ item: doc.toJSON() }, { status: 201 });
  } catch (err) {
    const isDup =
      err?.code === 11000 ||
      String(err?.message || "").toLowerCase().includes("duplicate key");

    return jsonError("Failed to create category", isDup ? 409 : 500, err?.message || String(err));
  }
}