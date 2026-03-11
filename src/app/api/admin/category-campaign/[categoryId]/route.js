// src/app/api/admin/category-campaign/[categoryId]/route.js
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

function isMultipart(req) {
  const ct = req.headers.get("content-type") || "";
  return ct.includes("multipart/form-data");
}

function normalizeString(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function toObjId(v) {
  const raw = String(v ?? "").trim();
  return mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null;
}

function normalizeBanner(banner) {
  if (!banner || typeof banner !== "object") return null;

  const url = normalizeString(banner.url);
  if (!url) return null;

  return {
    url,
    publicId: normalizeString(banner.publicId),
    alt: normalizeString(banner.alt),
  };
}

async function resolveCategory(categoryIdOrSlug) {
  const raw = normalizeString(categoryIdOrSlug);
  if (!raw) return null;

  const objectId = toObjId(raw);

  if (objectId) {
    const byId = await Category.findById(objectId);
    if (byId) return byId;
  }

  const bySlug = await Category.findOne({ slug: raw.toLowerCase() });
  return bySlug || null;
}

async function getCategoryParam(params) {
  const resolvedParams = await params;
  return resolvedParams?.categoryId;
}

/**
 * GET /api/admin/category-campaign/[categoryId]
 * categoryId can be actual ObjectId or category slug
 */
export async function GET(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const categoryParam = await getCategoryParam(params);
    const category = await resolveCategory(categoryParam);

    if (!category) {
      return jsonError("Category not found", 404);
    }

    return NextResponse.json(
      {
        item: {
          _id: category._id,
          id: String(category._id),
          name: category.name || "",
          slug: category.slug || "",
          isActive: !!category.isActive,
          banner: category.banner || null,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return jsonError("Failed to fetch category campaign", 500, err?.message || String(err));
  }
}

/**
 * POST /api/admin/category-campaign/[categoryId]
 *
 * Supports:
 * 1) multipart/form-data
 *    - banner (required File)
 *    - alt (optional)
 *
 * 2) JSON fallback
 *    {
 *      banner: {
 *        url,
 *        publicId?,
 *        alt?
 *      }
 *    }
 */
export async function POST(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const categoryParam = await getCategoryParam(params);
    const category = await resolveCategory(categoryParam);

    if (!category) {
      return jsonError("Category not found", 404);
    }

    // multipart upload flow
    if (isMultipart(req)) {
      const form = await req.formData();
      const alt = normalizeString(form.get("alt"));
      const file = form.get("banner");

      if (!file || typeof file.arrayBuffer !== "function") {
        return jsonError("banner file is required", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const up = await uploadBufferToCloudinary(buffer, {
        folder: "category-campaigns",
        resource_type: "image",
      });

      if (!up?.success) {
        return jsonError("Banner upload failed", 500);
      }

      category.banner = {
        url: up.url,
        publicId: up.publicId || "",
        alt,
      };

      category.updatedBy = auth.user.id;
      await category.save();

      return NextResponse.json(
        {
          item: {
            _id: category._id,
            id: String(category._id),
            name: category.name || "",
            slug: category.slug || "",
            isActive: !!category.isActive,
            banner: category.banner || null,
          },
          message: "Category campaign banner created successfully",
        },
        { status: 201 }
      );
    }

    // JSON fallback
    const body = await req.json().catch(() => ({}));
    const banner = normalizeBanner(body?.banner);

    if (!banner?.url) {
      return jsonError("Banner image is required", 400);
    }

    category.banner = banner;
    category.updatedBy = auth.user.id;
    await category.save();

    return NextResponse.json(
      {
        item: {
          _id: category._id,
          id: String(category._id),
          name: category.name || "",
          slug: category.slug || "",
          isActive: !!category.isActive,
          banner: category.banner || null,
        },
        message: "Category campaign banner created successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    return jsonError("Failed to create category campaign", 500, err?.message || String(err));
  }
}

/**
 * PATCH /api/admin/category-campaign/[categoryId]
 *
 * Supports:
 * 1) multipart/form-data
 *    - banner (required File)
 *    - alt (optional)
 *
 * 2) JSON fallback
 *    {
 *      banner: {
 *        url,
 *        publicId?,
 *        alt?
 *      }
 *    }
 */
export async function PATCH(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const categoryParam = await getCategoryParam(params);
    const category = await resolveCategory(categoryParam);

    if (!category) {
      return jsonError("Category not found", 404);
    }

    // multipart upload flow
    if (isMultipart(req)) {
      const form = await req.formData();
      const alt = normalizeString(form.get("alt"));
      const file = form.get("banner");

      if (!file || typeof file.arrayBuffer !== "function") {
        return jsonError("banner file is required", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const up = await uploadBufferToCloudinary(buffer, {
        folder: "category-campaigns",
        resource_type: "image",
      });

      if (!up?.success) {
        return jsonError("Banner upload failed", 500);
      }

      category.banner = {
        url: up.url,
        publicId: up.publicId || "",
        alt,
      };

      category.updatedBy = auth.user.id;
      await category.save();

      return NextResponse.json(
        {
          item: {
            _id: category._id,
            id: String(category._id),
            name: category.name || "",
            slug: category.slug || "",
            isActive: !!category.isActive,
            banner: category.banner || null,
          },
          message: "Category campaign banner updated successfully",
        },
        { status: 200 }
      );
    }

    // JSON fallback
    const body = await req.json().catch(() => ({}));
    const banner = normalizeBanner(body?.banner);

    if (!banner?.url) {
      return jsonError("Valid banner image is required", 400);
    }

    category.banner = banner;
    category.updatedBy = auth.user.id;
    await category.save();

    return NextResponse.json(
      {
        item: {
          _id: category._id,
          id: String(category._id),
          name: category.name || "",
          slug: category.slug || "",
          isActive: !!category.isActive,
          banner: category.banner || null,
        },
        message: "Category campaign banner updated successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    return jsonError("Failed to update category campaign", 500, err?.message || String(err));
  }
}

/**
 * DELETE /api/admin/category-campaign/[categoryId]
 * Removes banner from category document
 */
export async function DELETE(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const categoryParam = await getCategoryParam(params);
    const category = await resolveCategory(categoryParam);

    if (!category) {
      return jsonError("Category not found", 404);
    }

    category.banner = undefined;
    category.updatedBy = auth.user.id;
    await category.save();

    return NextResponse.json(
      {
        item: {
          _id: category._id,
          id: String(category._id),
          name: category.name || "",
          slug: category.slug || "",
          isActive: !!category.isActive,
          banner: category.banner || null,
        },
        message: "Category campaign banner deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    return jsonError("Failed to delete category campaign", 500, err?.message || String(err));
  }
}