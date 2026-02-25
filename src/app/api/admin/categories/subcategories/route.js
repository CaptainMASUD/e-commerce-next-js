// app/api/admin/categories/subcategories/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Category from "@/models/category.model";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { uploadBufferToCloudinary } from "@/utils/cloudinary";

function jsonError(message, status = 400, details) {
  const payload = { error: message };
  if (details) payload.details = details;
  return NextResponse.json(payload, { status });
}

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isMultipart(req) {
  const ct = req.headers.get("content-type") || "";
  return ct.includes("multipart/form-data");
}

function slugify(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
 * Cursor sort (ASC):
 *  sub.sortOrder, sub.name, category._id, sub._id
 */
function buildCursorMatch(cursorObj) {
  if (!cursorObj) return null;
  const { sortOrder, name, categoryId, subId } = cursorObj || {};
  if (sortOrder == null || !name || !categoryId || !subId) return null;
  if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subId)) return null;

  const cId = new mongoose.Types.ObjectId(categoryId);
  const sId = new mongoose.Types.ObjectId(subId);

  return {
    $or: [
      { "sub.sortOrder": { $gt: sortOrder } },
      { "sub.sortOrder": sortOrder, "sub.name": { $gt: name } },
      { "sub.sortOrder": sortOrder, "sub.name": name, "catId": { $gt: cId } },
      { "sub.sortOrder": sortOrder, "sub.name": name, "catId": cId, "sub._id": { $gt: sId } },
    ],
  };
}

/**
 * GET /api/admin/categories/subcategories
 * Query:
 *  - status=active|inactive|all
 *  - categoryId=<ObjectId> (optional)
 *  - limit=1..200 (default 50)
 *  - cursor=base64(JSON {sortOrder,name,categoryId,subId})
 */
export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "all";
    const categoryId = (url.searchParams.get("categoryId") || "").trim();

    const limit = Math.min(Math.max(toInt(url.searchParams.get("limit"), 50), 1), 200);
    const cursor = decodeCursor(url.searchParams.get("cursor"));

    await connectDB();

    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      return jsonError("Invalid categoryId", 400);
    }

    const pipeline = [];

    // Optional: filter by categoryId first (faster)
    if (categoryId) {
      pipeline.push({ $match: { _id: new mongoose.Types.ObjectId(categoryId) } });
    }

    pipeline.push(
      {
        $project: {
          catId: "$_id",
          catName: "$name",
          catSlug: "$slug",
          sub: "$subcategories",
        },
      },
      { $unwind: "$sub" }
    );

    if (status === "active") pipeline.push({ $match: { "sub.isActive": true } });
    if (status === "inactive") pipeline.push({ $match: { "sub.isActive": false } });

    const cursorMatch = buildCursorMatch(cursor);
    if (cursorMatch) pipeline.push({ $match: cursorMatch });

    pipeline.push(
      { $sort: { "sub.sortOrder": 1, "sub.name": 1, catId: 1, "sub._id": 1 } },
      { $limit: limit + 1 },
      {
        $project: {
          _id: 0,
          catId: 1,
          catName: 1,
          catSlug: 1,
          sub: 1,
        },
      }
    );

    const rows = await Category.aggregate(pipeline);

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    const items = slice.map((r) => ({
      ...r.sub,
      id: String(r.sub._id),
      category: {
        id: String(r.catId),
        name: r.catName,
        slug: r.catSlug,
      },
    }));

    let nextCursor = null;
    if (hasMore && items.length) {
      const lastRow = slice[slice.length - 1];
      nextCursor = encodeCursor({
        sortOrder: lastRow.sub?.sortOrder ?? 0,
        name: lastRow.sub?.name ?? "",
        categoryId: String(lastRow.catId),
        subId: String(lastRow.sub?._id),
      });
    }

    return NextResponse.json({ items, nextCursor }, { status: 200 });
  } catch (err) {
    return jsonError("Failed to fetch subcategories (admin)", 500, err?.message || String(err));
  }
}

/**
 * POST /api/admin/categories/subcategories
 * ✅ Requires categoryId (parent category)
 *
 * Supports:
 *  1) multipart/form-data (recommended)
 *     fields:
 *       - categoryId (required)
 *       - name (required)
 *       - slug (optional)
 *       - sortOrder (optional)
 *       - isActive (optional "true"/"false")
 *       - alt (optional)
 *       - image (required File)
 *
 *  2) JSON fallback:
 *     {
 *       categoryId (required),
 *       name (required),
 *       slug?,
 *       image:{url,publicId?,alt?} (required),
 *       sortOrder?,
 *       isActive?
 *     }
 */
export async function POST(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    // ✅ multipart flow (like brands)
    if (isMultipart(req)) {
      const form = await req.formData();

      const categoryId = (form.get("categoryId") || "").toString().trim();
      const name = (form.get("name") || "").toString().trim();
      const slugRaw = (form.get("slug") || "").toString().trim();
      const sortOrder = Number(form.get("sortOrder") || 0) || 0;
      const isActive = String(form.get("isActive") ?? "true") === "true";
      const alt = (form.get("alt") || "").toString().trim();
      const file = form.get("image"); // File

      if (!categoryId) return jsonError("categoryId is required", 400);
      if (!mongoose.Types.ObjectId.isValid(categoryId)) return jsonError("Invalid categoryId", 400);
      if (!name) return jsonError("Subcategory name is required", 400);
      if (!file || typeof file.arrayBuffer !== "function") return jsonError("image file is required", 400);

      const cat = await Category.findById(categoryId);
      if (!cat) return jsonError("Category not found", 404);

      const computedSlug = (slugRaw || slugify(name)).toLowerCase();

      // Prevent duplicate slug within the same category
      const exists = (cat.subcategories || []).some((s) => String(s.slug || "").toLowerCase() === computedSlug);
      if (exists) return jsonError(`Duplicate subcategory slug "${computedSlug}" in this category`, 409);

      const buffer = Buffer.from(await file.arrayBuffer());
      const up = await uploadBufferToCloudinary(buffer, {
        folder: "subcategories",
        resource_type: "image",
      });
      if (!up.success) return jsonError("Image upload failed", 500);

      cat.subcategories.push({
        name,
        slug: computedSlug,
        image: { url: up.url, publicId: up.publicId, alt },
        sortOrder,
        isActive,
      });

      cat.updatedBy = auth.user.id;
      await cat.save();

      const added = cat.subcategories[cat.subcategories.length - 1];
      return NextResponse.json(
        {
          item: {
            ...added.toObject(),
            id: String(added._id),
            category: { id: String(cat._id), name: cat.name, slug: cat.slug },
          },
        },
        { status: 201 }
      );
    }

    // ✅ JSON fallback
    const body = await req.json().catch(() => ({}));
    const { categoryId, name, slug, image, sortOrder = 0, isActive = true } = body || {};

    if (!categoryId) return jsonError("categoryId is required", 400);
    if (!mongoose.Types.ObjectId.isValid(categoryId)) return jsonError("Invalid categoryId", 400);
    if (!name?.trim()) return jsonError("Subcategory name is required", 400);
    if (!image?.url?.trim()) return jsonError("Subcategory image.url is required", 400);

    const cat = await Category.findById(categoryId);
    if (!cat) return jsonError("Category not found", 404);

    const computedSlug = (slug?.trim() || slugify(name)).toLowerCase();

    const exists = (cat.subcategories || []).some((s) => String(s.slug || "").toLowerCase() === computedSlug);
    if (exists) return jsonError(`Duplicate subcategory slug "${computedSlug}" in this category`, 409);

    cat.subcategories.push({
      name: name.trim(),
      slug: computedSlug,
      image: {
        url: image.url.trim(),
        publicId: image.publicId?.trim() || "",
        alt: image.alt?.trim() || "",
      },
      sortOrder: Number(sortOrder) || 0,
      isActive: Boolean(isActive),
    });

    cat.updatedBy = auth.user.id;
    await cat.save();

    const added = cat.subcategories[cat.subcategories.length - 1];
    return NextResponse.json(
      {
        item: {
          ...added.toObject(),
          id: String(added._id),
          category: { id: String(cat._id), name: cat.name, slug: cat.slug },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return jsonError("Failed to create subcategory", 500, err?.message || String(err));
  }
}