export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Banner from "@/models/banner.model";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { uploadBufferToCloudinary } from "@/utils/cloudinary";

function isMultipart(req) {
  const ct = req.headers.get("content-type") || "";
  return ct.includes("multipart/form-data");
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

function normalizeOptionalString(value) {
  if (value === undefined || value === null) return undefined;
  const v = String(value).trim();
  return v ? v : undefined;
}

// Example:
// ?fields=title,image,isActive,sortOrder,startsAt,endsAt
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

function serializeBanner(doc) {
  if (!doc) return null;
  return {
    ...doc,
    id: String(doc._id),
  };
}

export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const url = new URL(req.url);

    const status = (url.searchParams.get("status") || "all").trim();
    const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
    const afterId = (url.searchParams.get("afterId") || "").trim();
    const afterSortOrderRaw = url.searchParams.get("afterSortOrder");

    const selectFields = parseFieldsParam(url);

    await connectDB();

    const filter = {
      ownerType: "NewArrival",
    };

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
        items: pageItems.map(serializeBanner),
        pageInfo: { limit, hasNextPage, nextCursor },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to fetch new arrival banners",
        details: err?.message || String(err),
      },
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

      const title = normalizeOptionalString(form.get("title"));
      const subtitle = normalizeOptionalString(form.get("subtitle"));
      const buttonText = normalizeOptionalString(form.get("buttonText"));
      const buttonLink = normalizeOptionalString(form.get("buttonLink"));
      const sortOrder = Number(form.get("sortOrder") || 0) || 0;
      const isActive = parseBoolean(form.get("isActive"), true);
      const alt = (form.get("alt") || "").toString().trim();

      const startsAt = parseNullableDate(form.get("startsAt"));
      const endsAt = parseNullableDate(form.get("endsAt"));

      const file = form.get("image");

      if (!file || typeof file.arrayBuffer !== "function") {
        return NextResponse.json({ error: "image file is required" }, { status: 400 });
      }

      if (startsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
      }

      if (endsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const up = await uploadBufferToCloudinary(buffer, {
        folder: "banners/new-arrivals",
        resource_type: "image",
      });

      if (!up?.success) {
        return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
      }

      const payload = {
        image: { url: up.url, publicId: up.publicId, alt },
        ownerType: "NewArrival",
        ownerId: null,
        subcategoryId: null,
        sortOrder,
        isActive,
        startsAt,
        endsAt,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      };

      if (title !== undefined) payload.title = title;
      if (subtitle !== undefined) payload.subtitle = subtitle;
      if (buttonText !== undefined) payload.buttonText = buttonText;
      if (buttonLink !== undefined) payload.buttonLink = buttonLink;

      const doc = await Banner.create(payload);

      return NextResponse.json({ item: doc.toJSON() }, { status: 201 });
    }

    // JSON fallback
    const body = await req.json();

    const { image, sortOrder = 0, isActive = true, startsAt = null, endsAt = null } = body || {};

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

    const payload = {
      image: {
        url: String(image.url || "").trim(),
        publicId: String(image.publicId || "").trim(),
        alt: String(image.alt || "").trim(),
      },
      ownerType: "NewArrival",
      ownerId: null,
      subcategoryId: null,
      sortOrder: Number(sortOrder) || 0,
      isActive: Boolean(isActive),
      startsAt: parsedStartsAt,
      endsAt: parsedEndsAt,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    };

    const title = normalizeOptionalString(body?.title);
    const subtitle = normalizeOptionalString(body?.subtitle);
    const buttonText = normalizeOptionalString(body?.buttonText);
    const buttonLink = normalizeOptionalString(body?.buttonLink);

    if (title !== undefined) payload.title = title;
    if (subtitle !== undefined) payload.subtitle = subtitle;
    if (buttonText !== undefined) payload.buttonText = buttonText;
    if (buttonLink !== undefined) payload.buttonLink = buttonLink;

    const doc = await Banner.create(payload);

    return NextResponse.json({ item: doc.toJSON() }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to create new arrival banner",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}