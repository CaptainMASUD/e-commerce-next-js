export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Banner from "@/models/banner.model";
import Category from "@/models/category.model";
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

function parseNullableDate(value) {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "INVALID_DATE" : d;
}

function parseBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value) === "true";
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || "").trim());
}

async function validateBannerOwnership({ ownerType, ownerId, subcategoryId }) {
  if (!["Category", "Subcategory", "Brand"].includes(ownerType)) {
    return { ok: false, error: "ownerType must be Category, Subcategory, or Brand" };
  }

  if (!isValidObjectId(ownerId)) {
    return { ok: false, error: "Invalid ownerId" };
  }

  if (ownerType === "Category") {
    const exists = await Category.exists({ _id: ownerId });
    if (!exists) return { ok: false, error: "Category not found" };
    return { ok: true };
  }

  if (ownerType === "Brand") {
    const exists = await Brand.exists({ _id: ownerId });
    if (!exists) return { ok: false, error: "Brand not found" };
    return { ok: true };
  }

  // Subcategory
  if (!isValidObjectId(subcategoryId)) {
    return { ok: false, error: "Invalid subcategoryId" };
  }

  const category = await Category.findById(ownerId).select("subcategories._id").lean();
  if (!category) return { ok: false, error: "Category not found for subcategory banner" };

  const found = Array.isArray(category.subcategories)
    ? category.subcategories.some((s) => String(s._id) === String(subcategoryId))
    : false;

  if (!found) {
    return { ok: false, error: "Subcategory not found under the given category" };
  }

  return { ok: true };
}

// Example:
// ?fields=title,image,ownerType,ownerId,subcategoryId,isActive,sortOrder
function parseFieldsParam(url) {
  const raw = (url.searchParams.get("fields") || "").trim();
  if (!raw) return null;

  const allowed = new Set([
    "title",
    "subtitle",
    "image",
    "buttonText",
    "buttonLink",
    "ownerType",
    "ownerId",
    "subcategoryId",
    "sortOrder",
    "isActive",
    "startsAt",
    "endsAt",
    "createdAt",
    "updatedAt",
  ]);

  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const safe = parts.filter((f) => allowed.has(f));
  if (safe.length === 0) return null;

  if (!safe.includes("_id")) safe.push("_id");
  return safe.join(" ");
}

export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const url = new URL(req.url);

    const ownerType = (url.searchParams.get("ownerType") || "").trim();
    const ownerId = (url.searchParams.get("ownerId") || "").trim();
    const subcategoryId = (url.searchParams.get("subcategoryId") || "").trim();
    const status = (url.searchParams.get("status") || "all").trim(); // active / inactive / all

    const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
    const afterId = (url.searchParams.get("afterId") || "").trim();
    const afterSortOrderRaw = url.searchParams.get("afterSortOrder");

    const selectFields = parseFieldsParam(url);

    await connectDB();

    const filter = {};

    if (ownerType) {
      if (!["Category", "Subcategory", "Brand"].includes(ownerType)) {
        return NextResponse.json({ error: "Invalid ownerType" }, { status: 400 });
      }
      filter.ownerType = ownerType;
    }

    if (ownerId) {
      if (!isValidObjectId(ownerId)) {
        return NextResponse.json({ error: "Invalid ownerId" }, { status: 400 });
      }
      filter.ownerId = new mongoose.Types.ObjectId(ownerId);
    }

    if (subcategoryId) {
      if (!isValidObjectId(subcategoryId)) {
        return NextResponse.json({ error: "Invalid subcategoryId" }, { status: 400 });
      }
      filter.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
    }

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

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

    let q = Banner.find(filter);

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
      { error: "Failed to fetch banners (admin)", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    // multipart
    if (isMultipart(req)) {
      const form = await req.formData();

      const title = (form.get("title") || "").toString().trim();
      const subtitle = (form.get("subtitle") || "").toString().trim();
      const buttonText = (form.get("buttonText") || "").toString().trim();
      const buttonLink = (form.get("buttonLink") || "").toString().trim();

      const ownerType = (form.get("ownerType") || "").toString().trim();
      const ownerId = (form.get("ownerId") || "").toString().trim();
      const subcategoryId = (form.get("subcategoryId") || "").toString().trim();

      const sortOrder = Number(form.get("sortOrder") || 0) || 0;
      const isActive = parseBoolean(form.get("isActive"), true);
      const alt = (form.get("alt") || "").toString().trim();

      const startsAt = parseNullableDate(form.get("startsAt"));
      const endsAt = parseNullableDate(form.get("endsAt"));

      const file = form.get("image");

      if (!ownerType) {
        return NextResponse.json({ error: "ownerType is required" }, { status: 400 });
      }
      if (!ownerId) {
        return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
      }
      if (!file || typeof file.arrayBuffer !== "function") {
        return NextResponse.json({ error: "image file is required" }, { status: 400 });
      }
      if (startsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
      }
      if (endsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
      }

      const ownership = await validateBannerOwnership({ ownerType, ownerId, subcategoryId });
      if (!ownership.ok) {
        return NextResponse.json({ error: ownership.error }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const up = await uploadBufferToCloudinary(buffer, {
        folder: "banners",
        resource_type: "image",
      });

      if (!up?.success) {
        return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
      }

      const doc = await Banner.create({
        title,
        subtitle,
        image: { url: up.url, publicId: up.publicId, alt },
        buttonText,
        buttonLink,
        ownerType,
        ownerId,
        subcategoryId: ownerType === "Subcategory" ? subcategoryId : null,
        sortOrder,
        isActive,
        startsAt,
        endsAt,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      });

      return NextResponse.json({ item: doc.toJSON() }, { status: 201 });
    }

    // JSON fallback
    const body = await req.json();

    const {
      title = "",
      subtitle = "",
      image,
      buttonText = "",
      buttonLink = "",
      ownerType,
      ownerId,
      subcategoryId = null,
      sortOrder = 0,
      isActive = true,
      startsAt = null,
      endsAt = null,
    } = body || {};

    if (!ownerType) {
      return NextResponse.json({ error: "ownerType is required" }, { status: 400 });
    }
    if (!ownerId) {
      return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
    }
    if (!image?.url) {
      return NextResponse.json({ error: "Banner image.url is required" }, { status: 400 });
    }

    const parsedStartsAt = parseNullableDate(startsAt);
    const parsedEndsAt = parseNullableDate(endsAt);

    if (parsedStartsAt === "INVALID_DATE") {
      return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
    }
    if (parsedEndsAt === "INVALID_DATE") {
      return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
    }

    const ownership = await validateBannerOwnership({ ownerType, ownerId, subcategoryId });
    if (!ownership.ok) {
      return NextResponse.json({ error: ownership.error }, { status: 400 });
    }

    const doc = await Banner.create({
      title: String(title || "").trim(),
      subtitle: String(subtitle || "").trim(),
      image,
      buttonText: String(buttonText || "").trim(),
      buttonLink: String(buttonLink || "").trim(),
      ownerType,
      ownerId,
      subcategoryId: ownerType === "Subcategory" ? subcategoryId : null,
      sortOrder: Number(sortOrder) || 0,
      isActive: Boolean(isActive),
      startsAt: parsedStartsAt,
      endsAt: parsedEndsAt,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    });

    return NextResponse.json({ item: doc.toJSON() }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create banner", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}