// app/api/admin/products/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";
import { uploadBufferToCloudinary } from "@/utils/cloudinary";
import { requireAuth, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ✅ ensure Buffer/Cloudinary works (not Edge)

const ALLOWED_STATUS = new Set(["draft", "active", "archived"]);
const ALLOWED_VISIBILITY = new Set(["public", "hidden"]);

function toNumber(v, fallback = null) {
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

function toBool(v, fallback = false) {
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

function mongooseValidationMessage(err) {
  // ✅ best-effort friendlier message
  if (!err) return null;
  if (err.name === "ValidationError") {
    const firstKey = Object.keys(err.errors || {})[0];
    const msg = firstKey ? err.errors[firstKey]?.message : null;
    return msg || "Validation failed.";
  }
  return null;
}

export async function POST(req) {
  // ✅ Auth: must be admin
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    await connectDB();

    const form = await req.formData();

    // Required fields
    const title = normalizeString(form.get("title"));
    const slug = normalizeString(form.get("slug")).toLowerCase();
    const category = normalizeString(form.get("category"));
    const brand = normalizeString(form.get("brand"));

    const price = toNumber(form.get("price"), null);
    const salePrice = toNumber(form.get("salePrice"), null);

    // Optional
    const shortDescription = normalizeString(form.get("shortDescription"));
    const description = String(form.get("description") || "");
    const subcategoryRaw = normalizeString(form.get("subcategory"));
    const subcategory = subcategoryRaw ? subcategoryRaw : null;

    const status = normalizeString(form.get("status"), "draft") || "draft";
    const visibility = normalizeString(form.get("visibility"), "public") || "public";
    const isFeatured = toBool(form.get("isFeatured"), false);

    // Validate required
    if (!title || !slug || !category || !brand || price === null) {
      return NextResponse.json(
        { success: false, message: "title, slug, category, brand, price are required" },
        { status: 400 }
      );
    }

    // ✅ Validate enums early (friendly)
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Use: draft | active | archived" },
        { status: 400 }
      );
    }
    if (!ALLOWED_VISIBILITY.has(visibility)) {
      return NextResponse.json(
        { success: false, message: "Invalid visibility. Use: public | hidden" },
        { status: 400 }
      );
    }

    // Primary image required
    const primaryFile = form.get("primaryImage");
    if (!primaryFile || typeof primaryFile === "string") {
      return NextResponse.json(
        { success: false, message: "primaryImage file is required" },
        { status: 400 }
      );
    }

    // Upload primary image
    const primaryBuffer = await fileToBuffer(primaryFile);
    const primaryUpload = await uploadBufferToCloudinary(primaryBuffer, {
      folder: "products/primary",
    });

    if (!primaryUpload?.success) {
      return NextResponse.json(
        { success: false, message: "Primary image upload failed" },
        { status: 500 }
      );
    }

    // Upload gallery images (if any)
    const galleryFiles = form.getAll("galleryImages") || [];
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

    // Parse optional JSON fields safely
    const tags = safeJsonParse(form.get("tags"), []);
    const features = safeJsonParse(form.get("features"), []);

    const payload = {
      title,
      slug,
      category,
      brand,
      price,

      ...(salePrice !== null ? { salePrice } : {}),

      shortDescription,
      description,

      subcategory: subcategory || null,

      tags: Array.isArray(tags) ? tags : [],
      features: Array.isArray(features) ? features : [],

      primaryImage: { url: primaryUpload.url, publicId: primaryUpload.publicId, alt: "", order: 0 },
      galleryImages,

      status,
      visibility,
      isFeatured,
    };

    // ✅ Use doc.save() so pre("save") runs
    const created = new Product(payload);
    await created.save();

    return NextResponse.json({ success: true, product: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);

    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return NextResponse.json(
        { success: false, message: "Slug already exists. Please use a unique slug." },
        { status: 409 }
      );
    }

    const nice = mongooseValidationMessage(error);
    if (nice) {
      return NextResponse.json({ success: false, message: nice }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  // ✅ Auth: must be admin
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    await connectDB();

    const items = await Product.find({ isDeleted: false })
      .select({
        title: 1,
        slug: 1,
        category: 1,
        subcategory: 1,
        brand: 1,
        price: 1,
        salePrice: 1,
        primaryImage: 1,
        status: 1,
        visibility: 1,
        isFeatured: 1,
        createdAt: 1,
      })
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image categoryIds" })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const products = items.map((p) => {
      let subcategoryObj = null;

      if (p?.subcategory && p?.category?.subcategories?.length) {
        const subId = String(p.subcategory);
        subcategoryObj = p.category.subcategories.find((s) => String(s?._id) === subId) || null;
      }

      return { ...p, subcategoryObj };
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch admin products" },
      { status: 500 }
    );
  }
}