// src/app/api/admin/categories/subcategories/[subId]/route.js
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

function badId(id) {
  return !id || !mongoose.Types.ObjectId.isValid(id);
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

/**
 * ✅ Next.js may provide `params` as a Promise in Route Handlers.
 * So we safely unwrap it before accessing `subId`.
 */
async function getSubId(req, paramsLike) {
  const params = await Promise.resolve(paramsLike);

  const fromParams =
    params && typeof params === "object" && "subId" in params ? params.subId : undefined;

  if (fromParams) return String(fromParams);

  try {
    const pathname = new URL(req.url).pathname || "";
    const parts = pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

async function findParentCategoryBySubId(subId) {
  const cat = await Category.findOne({
    "subcategories._id": new mongoose.Types.ObjectId(subId),
  });
  return cat || null;
}

function ensureImageShape(sub) {
  if (!sub.image) sub.image = { url: "", publicId: "", alt: "" };
  if (!("url" in sub.image)) sub.image.url = "";
  if (!("publicId" in sub.image)) sub.image.publicId = "";
  if (!("alt" in sub.image)) sub.image.alt = "";
}

function hasDuplicateSlug(categoryDoc, targetSlug, excludeSubId) {
  const slug = String(targetSlug || "").toLowerCase();
  if (!slug) return false;
  return (categoryDoc.subcategories || []).some(
    (s) => String(s._id) !== String(excludeSubId) && String(s.slug || "").toLowerCase() === slug
  );
}

function normalizeCategoryId(val) {
  if (val === undefined || val === null) return "";
  const s = String(val).trim();
  return s;
}

function parseBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return Boolean(v);
  if (typeof v === "string") return v.toLowerCase() === "true";
  return false;
}

/**
 * GET /api/admin/categories/subcategories/:subId
 * Returns subcategory + parent category info
 */
export async function GET(req, context) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  const subId = await getSubId(req, context?.params);
  if (badId(subId)) return jsonError("Invalid subId", 400);

  try {
    await connectDB();

    const cat = await Category.findOne({ "subcategories._id": subId }).lean();
    if (!cat) return jsonError("Subcategory not found", 404);

    const sub = (cat.subcategories || []).find((s) => String(s._id) === String(subId));
    if (!sub) return jsonError("Subcategory not found", 404);

    return NextResponse.json(
      {
        item: {
          ...sub,
          id: String(sub._id),
          category: { id: String(cat._id), name: cat.name, slug: cat.slug },
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return jsonError("Failed to fetch subcategory", 500, err?.message || String(err));
  }
}

/**
 * PUT /api/admin/categories/subcategories/:subId
 *
 * ✅ Supports changing parent category via `categoryId` (multipart or JSON):
 * - If categoryId differs from current parent, subcategory is moved to that category.
 * - Duplicate slug is checked within the target category.
 */
export async function PUT(req, context) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  const subId = await getSubId(req, context?.params);
  if (badId(subId)) return jsonError("Invalid subId", 400);

  try {
    await connectDB();

    const currentCat = await findParentCategoryBySubId(subId);
    if (!currentCat) return jsonError("Subcategory not found", 404);

    const currentSub = currentCat.subcategories.id(subId);
    if (!currentSub) return jsonError("Subcategory not found", 404);

    ensureImageShape(currentSub);

    // We'll gather updates into this object (applied either in-place or during move)
    const updates = {
      categoryId: "", // optional
      name: undefined,
      slug: undefined,
      sortOrder: undefined,
      isActive: undefined,
      image: {
        url: undefined,
        publicId: undefined,
        alt: undefined,
      },
      didUpload: false,
    };

    // ------------------ Parse body (multipart vs JSON) ------------------
    if (isMultipart(req)) {
      const form = await req.formData();

      if (form.has("categoryId")) updates.categoryId = normalizeCategoryId(form.get("categoryId"));
      if (form.has("name")) updates.name = (form.get("name") || "").toString().trim();
      if (form.has("slug")) updates.slug = (form.get("slug") || "").toString().trim().toLowerCase();
      if (form.has("sortOrder")) updates.sortOrder = Number(form.get("sortOrder") || 0) || 0;
      if (form.has("isActive")) updates.isActive = String(form.get("isActive")) === "true";
      if (form.has("alt")) updates.image.alt = (form.get("alt") || "").toString().trim();

      const file = form.get("image");
      if (file && typeof file.arrayBuffer === "function") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const up = await uploadBufferToCloudinary(buffer, {
          folder: "subcategories",
          resource_type: "image",
        });
        if (!up.success) return jsonError("Image upload failed", 500);

        updates.image.url = up.url;
        updates.image.publicId = up.publicId;
        updates.didUpload = true;
      }
    } else {
      const body = await req.json().catch(() => ({}));

      if ("categoryId" in body) updates.categoryId = normalizeCategoryId(body.categoryId);
      if ("name" in body) updates.name = String(body.name || "").trim();
      if ("slug" in body) updates.slug = String(body.slug || "").trim().toLowerCase();
      if ("sortOrder" in body) updates.sortOrder = Number(body.sortOrder) || 0;
      if ("isActive" in body) updates.isActive = Boolean(body.isActive);

      if ("image" in body) {
        const img = body.image || {};
        if ("url" in img) updates.image.url = String(img.url || "").trim();
        if ("publicId" in img) updates.image.publicId = String(img.publicId || "").trim();
        if ("alt" in img) updates.image.alt = String(img.alt || "").trim();
      }
    }

    // Auto slug if name exists and slug missing
    const incomingName = updates.name !== undefined ? updates.name : currentSub.name;
    const incomingSlugRaw = updates.slug !== undefined ? updates.slug : currentSub.slug;
    const computedSlug = incomingName && !incomingSlugRaw ? slugify(incomingName) : incomingSlugRaw;

    // ------------------ Decide if moving categories ------------------
    const requestedCategoryId = updates.categoryId;
    const moving =
      requestedCategoryId &&
      mongoose.Types.ObjectId.isValid(requestedCategoryId) &&
      String(currentCat._id) !== String(requestedCategoryId);

    // If categoryId provided but invalid
    if (requestedCategoryId && !mongoose.Types.ObjectId.isValid(requestedCategoryId)) {
      return jsonError("Invalid categoryId", 400);
    }

    // ------------------ If moving: move subcategory to new category ------------------
    if (moving) {
      const targetCat = await Category.findById(requestedCategoryId);
      if (!targetCat) return jsonError("Target category not found", 404);

      // Build the moved subcategory object based on current + updates
      const subObj = currentSub.toObject();
      // Keep same _id so the subId remains stable
      subObj._id = new mongoose.Types.ObjectId(subId);

      if (updates.name !== undefined) subObj.name = updates.name;
      subObj.slug = computedSlug || subObj.slug || "";
      if (updates.sortOrder !== undefined) subObj.sortOrder = updates.sortOrder;
      if (updates.isActive !== undefined) subObj.isActive = parseBool(updates.isActive);

      subObj.image = subObj.image || { url: "", publicId: "", alt: "" };
      if (updates.image.alt !== undefined) subObj.image.alt = updates.image.alt;
      if (updates.image.url !== undefined) subObj.image.url = updates.image.url;
      if (updates.image.publicId !== undefined) subObj.image.publicId = updates.image.publicId;

      // Duplicate slug check in TARGET category
      const targetSlug = String(subObj.slug || "").toLowerCase();
      if (targetSlug && hasDuplicateSlug(targetCat, targetSlug, subId)) {
        return jsonError(`Duplicate subcategory slug "${targetSlug}" in this category`, 409);
      }

      // Remove from current category and push into target category
      currentSub.deleteOne();
      currentCat.updatedBy = auth.user.id;

      targetCat.subcategories.push(subObj);
      targetCat.updatedBy = auth.user.id;

      // Save both
      await currentCat.save();
      await targetCat.save();

      // Return the moved subcategory (fresh from target category)
      const saved = targetCat.subcategories.id(subId);
      return NextResponse.json(
        {
          item: {
            ...saved.toObject(),
            id: String(saved._id),
            category: { id: String(targetCat._id), name: targetCat.name, slug: targetCat.slug },
          },
        },
        { status: 200 }
      );
    }

    // ------------------ Not moving: update in place on current category ------------------
    if (updates.name !== undefined) currentSub.name = updates.name;
    currentSub.slug = computedSlug || currentSub.slug || "";
    if (updates.sortOrder !== undefined) currentSub.sortOrder = updates.sortOrder;
    if (updates.isActive !== undefined) currentSub.isActive = parseBool(updates.isActive);

    ensureImageShape(currentSub);
    if (updates.image.alt !== undefined) currentSub.image.alt = updates.image.alt;
    if (updates.image.url !== undefined) currentSub.image.url = updates.image.url;
    if (updates.image.publicId !== undefined) currentSub.image.publicId = updates.image.publicId;

    // Duplicate slug check in CURRENT category (excluding itself)
    const targetSlug = String(currentSub.slug || "").toLowerCase();
    if (targetSlug && hasDuplicateSlug(currentCat, targetSlug, subId)) {
      return jsonError(`Duplicate subcategory slug "${targetSlug}" in this category`, 409);
    }

    currentCat.updatedBy = auth.user.id;
    await currentCat.save();

    const saved = currentCat.subcategories.id(subId);
    return NextResponse.json(
      {
        item: {
          ...saved.toObject(),
          id: String(saved._id),
          category: { id: String(currentCat._id), name: currentCat.name, slug: currentCat.slug },
        },
      },
      { status: 200 }
    );
  } catch (err) {
    const msg = err?.message || String(err);
    const isDup = err?.code === 11000 || msg.toLowerCase().includes("duplicate key");
    return jsonError("Failed to update subcategory", isDup ? 409 : 500, msg);
  }
}

/**
 * DELETE /api/admin/categories/subcategories/:subId
 */
export async function DELETE(req, context) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  const subId = await getSubId(req, context?.params);
  if (badId(subId)) return jsonError("Invalid subId", 400);

  try {
    await connectDB();

    const cat = await findParentCategoryBySubId(subId);
    if (!cat) return jsonError("Subcategory not found", 404);

    const sub = cat.subcategories.id(subId);
    if (!sub) return jsonError("Subcategory not found", 404);

    sub.deleteOne();
    cat.updatedBy = auth.user.id;
    await cat.save();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return jsonError("Failed to delete subcategory", 500, err?.message || String(err));
  }
}