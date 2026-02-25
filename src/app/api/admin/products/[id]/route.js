// app/api/admin/products/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "@/utils/cloudinary";
import { requireAuth, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ✅ ensure Buffer/Cloudinary works (not Edge)

const ALLOWED_STATUS = new Set(["draft", "active", "archived"]);
const ALLOWED_VISIBILITY = new Set(["public", "hidden"]);

function toNumber(v, fallback = undefined) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function safeJsonParse(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function toBool(v, fallback = undefined) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "boolean") return v;

  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return fallback;
}

function normalizeString(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

// ✅ helper: resolve embedded subcategory from Category.subcategories[]
async function resolveEmbeddedSubcategory(categoryId, subcategoryId) {
  if (!categoryId || !subcategoryId) return null;

  const cat = await Category.findById(categoryId).select("subcategories").lean();
  if (!cat?.subcategories?.length) return null;

  const sid = String(subcategoryId);
  return cat.subcategories.find((s) => String(s?._id) === sid) || null;
}

// ✅ Next.js 15 fix: params can be a Promise
async function getIdFromContext(ctx) {
  const { params } = ctx || {};
  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const id = resolvedParams?.id ? String(resolvedParams.id) : "";
  return id;
}

export async function GET(req, ctx) {
  // ✅ Auth: must be admin
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    const id = await getIdFromContext(ctx);
    if (!id) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findOne({ _id: id, isDeleted: false })
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image categoryIds" })
      .lean();

    if (!product) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    let subcategoryObj = null;
    if (product.subcategory && product.category?.subcategories?.length) {
      const subId = String(product.subcategory);
      subcategoryObj =
        product.category.subcategories.find((s) => String(s?._id) === subId) || null;
    }

    return NextResponse.json({
      success: true,
      product: { ...product, subcategoryObj },
    });
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, ctx) {
  // ✅ Auth: must be admin
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    const id = await getIdFromContext(ctx);
    if (!id) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";

    // ---------------------------
    // JSON updates (no images)
    // ---------------------------
    if (contentType.includes("application/json")) {
      const body = await req.json();

      if (body.title !== undefined) product.title = normalizeString(body.title);
      if (body.slug !== undefined) product.slug = normalizeString(body.slug).toLowerCase();

      if (body.category !== undefined) product.category = normalizeString(body.category);
      if (body.brand !== undefined) product.brand = normalizeString(body.brand);

      if (body.subcategory !== undefined) {
        const subVal = normalizeString(body.subcategory);
        product.subcategory = subVal ? subVal : null;
      }

      if (body.price !== undefined) product.price = toNumber(body.price, product.price);
      if (body.salePrice !== undefined) product.salePrice = toNumber(body.salePrice, null);

      if (body.shortDescription !== undefined)
        product.shortDescription = String(body.shortDescription || "");
      if (body.description !== undefined) product.description = String(body.description || "");

      if (body.tags !== undefined) product.tags = Array.isArray(body.tags) ? body.tags : product.tags;
      if (body.features !== undefined)
        product.features = Array.isArray(body.features) ? body.features : product.features;

      if (body.status !== undefined) {
        const st = normalizeString(body.status);
        if (!ALLOWED_STATUS.has(st)) {
          return NextResponse.json(
            { success: false, message: "Invalid status. Use: draft | active | archived" },
            { status: 400 }
          );
        }
        product.status = st;
      }

      if (body.visibility !== undefined) {
        const vis = normalizeString(body.visibility);
        if (!ALLOWED_VISIBILITY.has(vis)) {
          return NextResponse.json(
            { success: false, message: "Invalid visibility. Use: public | hidden" },
            { status: 400 }
          );
        }
        product.visibility = vis;
      }

      if (body.isFeatured !== undefined) {
        const b = toBool(body.isFeatured, product.isFeatured);
        if (b !== undefined) product.isFeatured = b;
      }

      // ✅ early friendly validation
      if (!product.category || !product.brand) {
        return NextResponse.json(
          { success: false, message: "category and brand are required" },
          { status: 400 }
        );
      }

      // ✅ ensure subcategory belongs to category (embedded)
      if (product.subcategory) {
        const subObj = await resolveEmbeddedSubcategory(product.category, product.subcategory);
        if (!subObj) {
          return NextResponse.json(
            { success: false, message: "Subcategory does not belong to selected category" },
            { status: 400 }
          );
        }
      }

      await product.save();

      const saved = await Product.findById(product._id)
        .populate({ path: "category", select: "name slug subcategories" })
        .populate({ path: "brand", select: "name slug image categoryIds" })
        .lean();

      let subcategoryObj = null;
      if (saved?.subcategory && saved?.category?.subcategories?.length) {
        const subId = String(saved.subcategory);
        subcategoryObj =
          saved.category.subcategories.find((s) => String(s?._id) === subId) || null;
      }

      return NextResponse.json({ success: true, product: { ...saved, subcategoryObj } });
    }

    // ---------------------------
    // multipart/form-data (images + fields)
    // ---------------------------
    const form = await req.formData();

    if (form.get("title") != null) product.title = normalizeString(form.get("title"));
    if (form.get("slug") != null) product.slug = normalizeString(form.get("slug")).toLowerCase();

    if (form.get("category") != null) product.category = normalizeString(form.get("category"));
    if (form.get("brand") != null) product.brand = normalizeString(form.get("brand"));

    if (form.get("subcategory") != null) {
      const subVal = normalizeString(form.get("subcategory"));
      product.subcategory = subVal ? subVal : null;
    }

    if (form.get("price") != null) product.price = toNumber(form.get("price"), product.price);
    if (form.get("salePrice") != null) product.salePrice = toNumber(form.get("salePrice"), null);

    if (form.get("shortDescription") != null)
      product.shortDescription = String(form.get("shortDescription") || "");
    if (form.get("description") != null) product.description = String(form.get("description") || "");

    if (form.get("tags") != null) {
      const parsed = safeJsonParse(form.get("tags"), product.tags);
      product.tags = Array.isArray(parsed) ? parsed : product.tags;
    }
    if (form.get("features") != null) {
      const parsed = safeJsonParse(form.get("features"), product.features);
      product.features = Array.isArray(parsed) ? parsed : product.features;
    }

    if (form.get("status") != null) {
      const st = normalizeString(form.get("status"));
      if (!ALLOWED_STATUS.has(st)) {
        return NextResponse.json(
          { success: false, message: "Invalid status. Use: draft | active | archived" },
          { status: 400 }
        );
      }
      product.status = st;
    }

    if (form.get("visibility") != null) {
      const vis = normalizeString(form.get("visibility"));
      if (!ALLOWED_VISIBILITY.has(vis)) {
        return NextResponse.json(
          { success: false, message: "Invalid visibility. Use: public | hidden" },
          { status: 400 }
        );
      }
      product.visibility = vis;
    }

    if (form.get("isFeatured") != null) {
      const b = toBool(form.get("isFeatured"), product.isFeatured);
      if (b !== undefined) product.isFeatured = b;
    }

    if (!product.category || !product.brand) {
      return NextResponse.json(
        { success: false, message: "category and brand are required" },
        { status: 400 }
      );
    }

    if (product.subcategory) {
      const subObj = await resolveEmbeddedSubcategory(product.category, product.subcategory);
      if (!subObj) {
        return NextResponse.json(
          { success: false, message: "Subcategory does not belong to selected category" },
          { status: 400 }
        );
      }
    }

    // primary image replace
    const newPrimary = form.get("primaryImage");
    if (newPrimary && typeof newPrimary !== "string") {
      const oldPublicId = product.primaryImage?.publicId;

      const buf = await fileToBuffer(newPrimary);
      const up = await uploadBufferToCloudinary(buf, { folder: "products/primary" });
      if (!up?.success) {
        return NextResponse.json({ success: false, message: "Primary upload failed" }, { status: 500 });
      }

      product.primaryImage = { url: up.url, publicId: up.publicId, alt: "", order: 0 };

      if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    }

    // gallery replace (if provided)
    const galleryFiles = form.getAll("galleryImages") || [];
    if (galleryFiles.length) {
      const oldPublicIds = (product.galleryImages || []).map((i) => i.publicId).filter(Boolean);
      for (const pid of oldPublicIds) await deleteFromCloudinary(pid);

      const galleryImages = [];
      for (const gf of galleryFiles) {
        if (!gf || typeof gf === "string") continue;
        const buf = await fileToBuffer(gf);
        const up = await uploadBufferToCloudinary(buf, { folder: "products/gallery" });
        if (up?.success) {
          galleryImages.push({
            url: up.url,
            publicId: up.publicId,
            alt: "",
            order: galleryImages.length,
          });
        }
      }
      product.galleryImages = galleryImages;
    }

    await product.save();

    const saved = await Product.findById(product._id)
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image categoryIds" })
      .lean();

    let subcategoryObj = null;
    if (saved?.subcategory && saved?.category?.subcategories?.length) {
      const subId = String(saved.subcategory);
      subcategoryObj = saved.category.subcategories.find((s) => String(s?._id) === subId) || null;
    }

    return NextResponse.json({ success: true, product: { ...saved, subcategoryObj } });
  } catch (error) {
    console.error("PATCH /api/admin/products/[id] error:", error);

    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return NextResponse.json(
        { success: false, message: "Slug already exists. Please use a unique slug." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, ctx) {
  // ✅ Auth: must be admin
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    const id = await getIdFromContext(ctx);
    if (!id) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    // delete images from cloudinary
    const ids = [
      product.primaryImage?.publicId,
      ...(product.galleryImages || []).map((i) => i.publicId),
    ].filter(Boolean);

    for (const pid of ids) {
      await deleteFromCloudinary(pid);
    }

    // soft delete
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.status = "archived";
    await product.save();

    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}