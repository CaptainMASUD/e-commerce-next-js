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

function parseBoolean(value, fallback = undefined) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value) === "true";
}

function parseNullableDate(value, fallback = undefined) {
  if (value === undefined) return fallback;
  const v = String(value ?? "").trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "INVALID_DATE" : d;
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

export async function GET(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid banner id" }, { status: 400 });
    }

    await connectDB();

    const item = await Banner.findById(id).lean();
    if (!item) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch banner", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid banner id" }, { status: 400 });
    }

    await connectDB();

    const existing = await Banner.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // multipart
    if (isMultipart(req)) {
      const form = await req.formData();

      const nextOwnerType = form.has("ownerType")
        ? (form.get("ownerType") || "").toString().trim()
        : existing.ownerType;

      const nextOwnerId = form.has("ownerId")
        ? (form.get("ownerId") || "").toString().trim()
        : String(existing.ownerId);

      const nextSubcategoryId = form.has("subcategoryId")
        ? (form.get("subcategoryId") || "").toString().trim()
        : existing.subcategoryId
        ? String(existing.subcategoryId)
        : null;

      const ownership = await validateBannerOwnership({
        ownerType: nextOwnerType,
        ownerId: nextOwnerId,
        subcategoryId: nextSubcategoryId,
      });

      if (!ownership.ok) {
        return NextResponse.json({ error: ownership.error }, { status: 400 });
      }

      if (form.has("title")) existing.title = (form.get("title") || "").toString().trim();
      if (form.has("subtitle")) existing.subtitle = (form.get("subtitle") || "").toString().trim();
      if (form.has("buttonText")) existing.buttonText = (form.get("buttonText") || "").toString().trim();
      if (form.has("buttonLink")) existing.buttonLink = (form.get("buttonLink") || "").toString().trim();
      if (form.has("ownerType")) existing.ownerType = nextOwnerType;
      if (form.has("ownerId")) existing.ownerId = nextOwnerId;
      if (form.has("subcategoryId") || nextOwnerType !== "Subcategory") {
        existing.subcategoryId = nextOwnerType === "Subcategory" ? nextSubcategoryId : null;
      }
      if (form.has("sortOrder")) existing.sortOrder = Number(form.get("sortOrder") || 0) || 0;

      const parsedIsActive = parseBoolean(form.get("isActive"), undefined);
      if (parsedIsActive !== undefined) existing.isActive = parsedIsActive;

      const parsedStartsAt = parseNullableDate(form.has("startsAt") ? form.get("startsAt") : undefined, undefined);
      const parsedEndsAt = parseNullableDate(form.has("endsAt") ? form.get("endsAt") : undefined, undefined);

      if (parsedStartsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
      }
      if (parsedEndsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
      }

      if (parsedStartsAt !== undefined) existing.startsAt = parsedStartsAt;
      if (parsedEndsAt !== undefined) existing.endsAt = parsedEndsAt;

      if (form.has("alt")) {
        existing.image = {
          ...existing.image,
          alt: (form.get("alt") || "").toString().trim(),
        };
      }

      const file = form.get("image");
      if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const up = await uploadBufferToCloudinary(buffer, {
          folder: "banners",
          resource_type: "image",
        });

        if (!up?.success) {
          return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
        }

        existing.image = {
          url: up.url,
          publicId: up.publicId,
          alt: existing.image?.alt || "",
        };
      }

      existing.updatedBy = auth.user.id;
      await existing.save();

      return NextResponse.json({ item: existing.toJSON() }, { status: 200 });
    }

    // JSON
    const body = await req.json();
    const patch = body || {};

    const nextOwnerType = patch.ownerType ?? existing.ownerType;
    const nextOwnerId = patch.ownerId ?? String(existing.ownerId);
    const nextSubcategoryId =
      patch.subcategoryId !== undefined
        ? patch.subcategoryId
        : existing.subcategoryId
        ? String(existing.subcategoryId)
        : null;

    const ownership = await validateBannerOwnership({
      ownerType: nextOwnerType,
      ownerId: nextOwnerId,
      subcategoryId: nextSubcategoryId,
    });

    if (!ownership.ok) {
      return NextResponse.json({ error: ownership.error }, { status: 400 });
    }

    if ("title" in patch) existing.title = String(patch.title || "").trim();
    if ("subtitle" in patch) existing.subtitle = String(patch.subtitle || "").trim();
    if ("buttonText" in patch) existing.buttonText = String(patch.buttonText || "").trim();
    if ("buttonLink" in patch) existing.buttonLink = String(patch.buttonLink || "").trim();
    if ("ownerType" in patch) existing.ownerType = nextOwnerType;
    if ("ownerId" in patch) existing.ownerId = nextOwnerId;
    if ("subcategoryId" in patch || nextOwnerType !== "Subcategory") {
      existing.subcategoryId = nextOwnerType === "Subcategory" ? nextSubcategoryId : null;
    }
    if ("sortOrder" in patch) existing.sortOrder = Number(patch.sortOrder) || 0;
    if ("isActive" in patch) existing.isActive = Boolean(patch.isActive);

    const parsedStartsAt = parseNullableDate(patch.startsAt, undefined);
    const parsedEndsAt = parseNullableDate(patch.endsAt, undefined);

    if (parsedStartsAt === "INVALID_DATE") {
      return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
    }
    if (parsedEndsAt === "INVALID_DATE") {
      return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
    }

    if (parsedStartsAt !== undefined) existing.startsAt = parsedStartsAt;
    if (parsedEndsAt !== undefined) existing.endsAt = parsedEndsAt;

    if (patch.image?.url) {
      existing.image = {
        url: patch.image.url,
        publicId: patch.image.publicId || "",
        alt: patch.image.alt || "",
      };
    } else if (patch.image?.alt !== undefined) {
      existing.image = {
        ...existing.image,
        alt: String(patch.image.alt || "").trim(),
      };
    }

    existing.updatedBy = auth.user.id;
    await existing.save();

    return NextResponse.json({ item: existing.toJSON() }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update banner", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid banner id" }, { status: 400 });
    }

    await connectDB();

    const doc = await Banner.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    await Banner.deleteOne({ _id: doc._id });

    return NextResponse.json({ success: true, message: "Banner deleted successfully" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete banner", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}