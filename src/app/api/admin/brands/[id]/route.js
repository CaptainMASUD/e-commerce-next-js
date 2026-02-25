// app/api/admin/brands/[id]/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Brand from "@/models/brand.model";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "@/utils/cloudinary";

function isMultipart(req) {
  const ct = req.headers.get("content-type") || "";
  return ct.includes("multipart/form-data");
}

function badId(id) {
  return !id || !mongoose.Types.ObjectId.isValid(id);
}

// Next.js 15+ params can be a Promise
async function getIdFromParams(params) {
  const awaited = await Promise.resolve(params);
  return awaited?.id;
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
  if (!Array.isArray(arr)) return { ok: true, ids: [] };

  const seen = new Set();
  const ids = [];

  for (const x of arr) {
    const id = String(x || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { ok: false, error: `Invalid categoryId: ${id}` };
    }
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return { ok: true, ids };
}

export async function GET(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  const id = await getIdFromParams(params);
  if (badId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await connectDB();
    const item = await Brand.findById(id).lean();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ item }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch brand", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  const id = await getIdFromParams(params);
  if (badId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await connectDB();

    const existing = await Brand.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ✅ multipart (recommended): supports image replace
    if (isMultipart(req)) {
      const form = await req.formData();
      const update = {};

      // name
      if (form.has("name")) {
        const name = String(form.get("name") || "").trim();
        if (!name) return NextResponse.json({ error: "Brand name cannot be empty" }, { status: 400 });
        update.name = name;
      }

      // slug
      if (form.has("slug")) {
        const slug = String(form.get("slug") || "").trim();
        update.slug = slug || undefined; // let model generate if undefined
      }

      // sortOrder
      if (form.has("sortOrder")) {
        update.sortOrder = Number(form.get("sortOrder") || 0) || 0;
      }

      // isActive
      if (form.has("isActive")) {
        update.isActive = String(form.get("isActive")) === "true";
      }

      // categoryIds: JSON string array
      if (form.has("categoryIds")) {
        const raw = String(form.get("categoryIds") || "[]");
        const arr = parseJsonArray(raw, null);

        if (!arr) {
          return NextResponse.json({ error: "categoryIds must be a valid JSON array" }, { status: 400 });
        }

        const norm = normalizeIds(arr);
        if (!norm.ok) return NextResponse.json({ error: norm.error }, { status: 400 });
        if (norm.ids.length === 0) {
          return NextResponse.json(
            { error: "categoryIds[] must have at least 1 category" },
            { status: 400 }
          );
        }

        update.categoryIds = norm.ids;
      }

      // image replace optional
      const file = form.get("image");
      const alt = String(form.get("alt") || "").trim();

      let newUpload = null;

      // If new image provided: upload first
      if (file && typeof file.arrayBuffer === "function") {
        const buffer = Buffer.from(await file.arrayBuffer());
        newUpload = await uploadBufferToCloudinary(buffer, {
          folder: "brands",
          resource_type: "image",
        });

        if (!newUpload?.success) {
          return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
        }

        update.image = {
          url: newUpload.url,
          publicId: newUpload.publicId,
          alt, // if alt empty it's okay
        };
      } else if (form.has("alt")) {
        // alt-only update (don't overwrite url/publicId)
        update.image = {
          ...(existing.image || {}),
          alt,
        };
      }

      update.updatedBy = auth.user.id;

      // ✅ update DB (validators + pre-validate slug etc.)
      const doc = await Brand.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });

      // ✅ delete old image AFTER successful DB update (safer)
      if (newUpload?.success) {
        const oldPublicId = existing?.image?.publicId;
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId).catch(() => {});
        }
      }

      return NextResponse.json({ item: doc.toJSON() }, { status: 200 });
    }

    // ✅ JSON fallback
    const body = await req.json();
    const allowed = ["name", "slug", "image", "categoryIds", "sortOrder", "isActive"];

    const update = {};
    for (const k of allowed) {
      if (k in (body || {})) update[k] = body[k];
    }

    // name cannot be empty if provided
    if ("name" in update) {
      const name = String(update.name || "").trim();
      if (!name) return NextResponse.json({ error: "Brand name cannot be empty" }, { status: 400 });
      update.name = name;
    }

    // slug normalize
    if ("slug" in update) {
      const slug = String(update.slug || "").trim();
      update.slug = slug || undefined;
    }

    // categoryIds validate + dedupe if provided
    if ("categoryIds" in update) {
      const norm = normalizeIds(update.categoryIds);
      if (!norm.ok) return NextResponse.json({ error: norm.error }, { status: 400 });
      if (norm.ids.length === 0) {
        return NextResponse.json(
          { error: "categoryIds[] must have at least 1 category" },
          { status: 400 }
        );
      }
      update.categoryIds = norm.ids;
    }

    update.updatedBy = auth.user.id;

    // ✅ if image publicId changed, delete old AFTER successful update
    const oldPublicId = existing?.image?.publicId;
    const incomingPublicId = update?.image?.publicId;

    const doc = await Brand.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (incomingPublicId && oldPublicId && incomingPublicId !== oldPublicId) {
      await deleteFromCloudinary(oldPublicId).catch(() => {});
    }

    return NextResponse.json({ item: doc.toJSON() }, { status: 200 });
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate value", details: "Brand slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update brand", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  const id = await getIdFromParams(params);
  if (badId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await connectDB();

    const doc = await Brand.findById(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const publicId = doc?.image?.publicId;

    await Brand.findByIdAndDelete(id);

    // delete cloudinary after DB delete (best practice)
    if (publicId) await deleteFromCloudinary(publicId).catch(() => {});

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete brand", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}