// app/api/admin/brands/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Brand from "@/models/brand.model";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { uploadBufferToCloudinary } from "@/utils/cloudinary";

function isMultipart(req) {
  const ct = req.headers.get("content-type") || "";
  return ct.includes("multipart/form-data");
}

function parseJsonArray(str, fallback = []) {
  try {
    const v = JSON.parse(str);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function normalizeIds(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const id = String(x || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { ok: false, error: `Invalid categoryId: ${id}` };
    }
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return { ok: true, ids: out };
}

// Example: ?fields=name,slug,image,isActive,sortOrder
function parseFieldsParam(url) {
  const raw = (url.searchParams.get("fields") || "").trim();
  if (!raw) return null;

  const allowed = new Set([
    "name",
    "slug",
    "image",
    "categoryIds",
    "sortOrder",
    "isActive",
    "createdAt",
    "updatedAt",
  ]);

  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const safe = parts.filter((f) => allowed.has(f));
  if (safe.length === 0) return null;

  // Always include _id
  if (!safe.includes("_id")) safe.push("_id");

  return safe.join(" ");
}

export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const url = new URL(req.url);

    const status = url.searchParams.get("status"); // active/inactive/all
    const categoryId = (url.searchParams.get("categoryId") || "").trim();

    const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
    const afterId = (url.searchParams.get("afterId") || "").trim();
    const afterSortOrderRaw = url.searchParams.get("afterSortOrder"); // string or null

    const selectFields = parseFieldsParam(url);

    await connectDB();

    const filter = {};
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 });
      }
      filter.categoryIds = new mongoose.Types.ObjectId(categoryId);
    }

    const hasCursor =
      afterSortOrderRaw !== null &&
      afterId &&
      mongoose.Types.ObjectId.isValid(afterId);

    if (hasCursor) {
      const afterSortOrder = Number(afterSortOrderRaw) || 0;
      const afterObjId = new mongoose.Types.ObjectId(afterId);

      filter.$or = [
        { sortOrder: { $gt: afterSortOrder } },
        { sortOrder: afterSortOrder, _id: { $gt: afterObjId } },
      ];
    }

    let q = Brand.find(filter);

    if (selectFields) q = q.select(selectFields);

    q = q.sort({ sortOrder: 1, _id: 1 }).limit(limit + 1).lean();

    const items = await q;
    const hasNextPage = items.length > limit;
    const pageItems = hasNextPage ? items.slice(0, limit) : items;

    const nextCursor = hasNextPage
      ? {
          afterSortOrder: pageItems[pageItems.length - 1].sortOrder,
          afterId: String(pageItems[pageItems.length - 1]._id),
        }
      : null;

    return NextResponse.json(
      {
        items: pageItems,
        pageInfo: { limit, hasNextPage, nextCursor },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch brands (admin)", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    // ✅ multipart (recommended)
    if (isMultipart(req)) {
      const form = await req.formData();

      const name = (form.get("name") || "").toString().trim();
      const slug = (form.get("slug") || "").toString().trim();
      const sortOrder = Number(form.get("sortOrder") || 0) || 0;
      const isActive = String(form.get("isActive") ?? "true") === "true";

      const categoryIdsRaw = (form.get("categoryIds") || "[]").toString();
      const categoryIds = parseJsonArray(categoryIdsRaw, []);
      const alt = (form.get("alt") || "").toString().trim();

      const file = form.get("image"); // File

      if (!name) {
        return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
      }

      const norm = normalizeIds(categoryIds);
      if (!norm.ok) {
        return NextResponse.json({ error: norm.error }, { status: 400 });
      }
      if (norm.ids.length === 0) {
        return NextResponse.json({ error: "categoryIds[] is required" }, { status: 400 });
      }

      if (!file || typeof file.arrayBuffer !== "function") {
        return NextResponse.json({ error: "image file is required" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const up = await uploadBufferToCloudinary(buffer, {
        folder: "brands",
        resource_type: "image",
      });

      if (!up?.success) {
        return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
      }

      const doc = await Brand.create({
        name,
        slug: slug || undefined, // let model auto-generate if missing
        image: { url: up.url, publicId: up.publicId, alt },
        categoryIds: norm.ids, // model will validate+dedupe too
        sortOrder,
        isActive,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      });

      return NextResponse.json({ item: doc.toJSON() }, { status: 201 });
    }

    // ✅ JSON fallback
    const body = await req.json();
    const { name, slug, image, categoryIds, sortOrder = 0, isActive = true } = body || {};

    if (!String(name || "").trim()) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }
    if (!image?.url) {
      return NextResponse.json({ error: "Brand image.url is required" }, { status: 400 });
    }

    const norm = normalizeIds(categoryIds);
    if (!norm.ok) {
      return NextResponse.json({ error: norm.error }, { status: 400 });
    }
    if (norm.ids.length === 0) {
      return NextResponse.json({ error: "categoryIds[] is required" }, { status: 400 });
    }

    const doc = await Brand.create({
      name: String(name).trim(),
      slug: String(slug || "").trim() || undefined,
      image,
      categoryIds: norm.ids,
      sortOrder: Number(sortOrder) || 0,
      isActive: Boolean(isActive),
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    });

    return NextResponse.json({ item: doc.toJSON() }, { status: 201 });
  } catch (err) {
    // ✅ best practice duplicate-key handling
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate value", details: "Brand slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create brand", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}