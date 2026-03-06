// app/api/admin/products/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";
import { uploadBufferToCloudinary } from "@/utils/cloudinary";
import { requireAuth, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_PRODUCT_TYPE = new Set(["simple", "variable"]);

// ---------- helpers ----------
function toNumber(v, fallback = null) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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

function safeJsonParse(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function resolveEmbeddedSubcategory(categoryId, subcategoryId) {
  if (!categoryId || !subcategoryId) return null;
  const cat = await Category.findById(categoryId).select("subcategories isActive").lean();
  if (!cat) return null;
  if (cat.isActive === false) return null;
  if (!cat?.subcategories?.length) return null;

  const sid = String(subcategoryId);
  return cat.subcategories.find((s) => String(s?._id) === sid) || null;
}

// Enforce "Brand belongs to Category"
async function validateBrandBelongsToCategory(brandId, categoryId) {
  if (!brandId || !categoryId) return { ok: false, message: "brand and category are required." };

  const brand = await Brand.findById(brandId).select("categoryIds isActive").lean();
  if (!brand) return { ok: false, message: "Invalid brand: brand not found." };
  if (brand.isActive === false) return { ok: false, message: "Invalid brand: brand is inactive." };

  const catIdStr = String(categoryId);
  const brandCats = Array.isArray(brand.categoryIds) ? brand.categoryIds.map(String) : [];
  if (!brandCats.includes(catIdStr)) return { ok: false, message: "Brand does not belong to the selected category." };

  return { ok: true };
}

function normalizeImages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((img) => img && typeof img === "object" && img.url)
    .map((img, idx) => ({
      url: String(img.url).trim(),
      publicId: img.publicId ? String(img.publicId).trim() : "",
      alt: img.alt ? String(img.alt).trim() : "",
      order: typeof img.order === "number" ? img.order : idx,
    }));
}

function normalizeDescriptionBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b) => b && typeof b === "object")
    .map((b, idx) => ({
      title: normalizeString(b.title, ""),
      details: typeof b.details === "string" ? b.details : String(b.details ?? ""),
      order: Number.isFinite(Number(b.order)) ? Number(b.order) : idx,
    }))
    .filter((b) => b.title || (b.details && String(b.details).trim()))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeFeatures(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f) => f && typeof f === "object")
    .map((f, idx) => ({
      label: normalizeString(f.label),
      value: normalizeString(f.value),
      isKey: toBool(f.isKey, false),
      order: Number.isFinite(Number(f.order)) ? Number(f.order) : idx,
      group: normalizeString(f.group, ""),
    }))
    .filter((f) => f.label && f.value);
}

/**
 * ✅ Variants: barcode is the ONLY identifier
 * - Removed: sku, variantId
 */
function normalizeVariants(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      const attrs =
        v.attributes && typeof v.attributes === "object" && !Array.isArray(v.attributes) ? v.attributes : {};
      const attributes = {};
      for (const [k, val] of Object.entries(attrs)) {
        const kk = String(k || "").trim();
        const vv = String(val ?? "").trim();
        if (!kk) continue;
        attributes[kk] = vv;
      }

      const barcode = normalizeString(v.barcode, "");

      return {
        barcode,
        attributes,
        price: toNumber(v.price, null),
        salePrice: toNumber(v.salePrice, null),
        stockQty: Math.max(0, toNumber(v.stockQty, 0) ?? 0),
        images: normalizeImages(v.images),
        isActive: toBool(v.isActive, true),
      };
    });
}

function normalizeTags(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((t) => String(t).trim()).filter(Boolean))];
}

// ---------- CREATE (multipart/form-data) ----------
export async function POST(req) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    await connectDB();

    const form = await req.formData();

    const title = normalizeString(form.get("title"));
    const slug = normalizeString(form.get("slug")).toLowerCase();
    const category = normalizeString(form.get("category"));
    const brand = normalizeString(form.get("brand"));

    const subcategoryRaw = normalizeString(form.get("subcategory"));
    const subcategory = subcategoryRaw ? subcategoryRaw : null;

    // product barcode (used only for SIMPLE; model clears it for VARIABLE)
    const barcode = normalizeString(form.get("barcode"), "");

    // product price required ONLY for SIMPLE
    const price = toNumber(form.get("price"), null);
    const salePrice = form.get("salePrice") === null ? null : toNumber(form.get("salePrice"), null);

    const stockQty = toNumber(form.get("stockQty"), 0);

    const productType = normalizeString(form.get("productType"), "simple") || "simple";
    if (!ALLOWED_PRODUCT_TYPE.has(productType)) {
      return NextResponse.json(
        { success: false, message: "Invalid productType. Use: simple | variable" },
        { status: 400 }
      );
    }

    const tags = normalizeTags(safeJsonParse(form.get("tags"), []));
    const features = normalizeFeatures(safeJsonParse(form.get("features"), []));
    const description = normalizeDescriptionBlocks(safeJsonParse(form.get("description"), []));

    const variants = normalizeVariants(safeJsonParse(form.get("variants"), []));

    const isNew = toBool(form.get("isNew"), false);
    const isTrending = toBool(form.get("isTrending"), false);

    // base required fields
    if (!title || !slug || !category || !brand) {
      return NextResponse.json(
        { success: false, message: "title, slug, category, brand are required" },
        { status: 400 }
      );
    }

    // SIMPLE validation
    if (productType === "simple") {
      if (price === null) {
        return NextResponse.json({ success: false, message: "price is required for simple products" }, { status: 400 });
      }
      if (price < 0) {
        return NextResponse.json({ success: false, message: "Invalid price" }, { status: 400 });
      }
      if (salePrice !== null && salePrice > price) {
        return NextResponse.json({ success: false, message: "Sale price cannot exceed price" }, { status: 400 });
      }
      if (typeof stockQty !== "number" || stockQty < 0) {
        return NextResponse.json({ success: false, message: "Invalid stockQty" }, { status: 400 });
      }
    }

    // VARIABLE validation (variants are source of truth)
    if (productType === "variable") {
      if (!variants.length) {
        return NextResponse.json(
          { success: false, message: "productType=variable requires variants (JSON in 'variants')." },
          { status: 400 }
        );
      }

      const active = variants.filter((v) => v?.isActive !== false);
      if (!active.length) {
        return NextResponse.json(
          { success: false, message: "At least one active variant is required" },
          { status: 400 }
        );
      }

      const missingBarcode = active.some((v) => !String(v?.barcode || "").trim());
      if (missingBarcode) {
        return NextResponse.json(
          { success: false, message: "Each active variant requires a barcode (single identifier)" },
          { status: 400 }
        );
      }

      const missingPrice = active.some((v) => typeof v?.price !== "number" || v.price < 0);
      if (missingPrice) {
        return NextResponse.json(
          { success: false, message: "Each active variant requires a valid price" },
          { status: 400 }
        );
      }

      const badSale = active.some(
        (v) => typeof v?.salePrice === "number" && v.salePrice !== null && v.salePrice > v.price
      );
      if (badSale) {
        return NextResponse.json(
          { success: false, message: "Variant salePrice cannot exceed variant price" },
          { status: 400 }
        );
      }
    }

    // brand belongs to category
    const brandCheck = await validateBrandBelongsToCategory(brand, category);
    if (!brandCheck.ok) {
      return NextResponse.json({ success: false, message: brandCheck.message }, { status: 400 });
    }

    // subcategory belongs to category
    if (subcategory) {
      const subObj = await resolveEmbeddedSubcategory(category, subcategory);
      if (!subObj) {
        return NextResponse.json(
          { success: false, message: "Subcategory does not belong to selected category" },
          { status: 400 }
        );
      }
    }

    const primaryFile = form.get("primaryImage");
    if (!primaryFile || typeof primaryFile === "string") {
      return NextResponse.json({ success: false, message: "primaryImage file is required" }, { status: 400 });
    }

    const primaryBuffer = await fileToBuffer(primaryFile);
    const primaryUpload = await uploadBufferToCloudinary(primaryBuffer, { folder: "products/primary" });

    if (!primaryUpload?.success) {
      return NextResponse.json({ success: false, message: "Primary image upload failed" }, { status: 500 });
    }

    const galleryFiles = form.getAll("galleryImages") || [];
    const galleryImages = [];

    for (const gf of galleryFiles) {
      if (!gf || typeof gf === "string") continue;
      const buf = await fileToBuffer(gf);
      const up = await uploadBufferToCloudinary(buf, { folder: "products/gallery" });
      if (up?.success) {
        galleryImages.push({
          url: up.url,
          publicId: up.publicId || "",
          alt: "",
          order: galleryImages.length,
        });
      }
    }

    // payload
    const payload = {
      title,
      slug,
      category,
      subcategory,
      brand,

      productType,

      isNew,
      isTrending,

      primaryImage: { url: primaryUpload.url, publicId: primaryUpload.publicId || "", alt: "", order: 0 },
      galleryImages,

      tags,
      description,
      features,
    };

    if (productType === "simple") {
      payload.barcode = barcode;
      payload.price = price;
      if (salePrice !== null) payload.salePrice = salePrice;
      payload.stockQty = stockQty;
    } else {
      // variable: variants are source of truth
      payload.variants = variants;

      // safe defaults (model will enforce salePrice=null, stockQty=0, barcode="")
      payload.price = 0;
      payload.salePrice = null;
      payload.stockQty = 0;
      payload.barcode = "";
    }

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

    if (error?.code === 11000 && (error?.keyPattern?.barcode || error?.keyPattern?.["variants.barcode"])) {
      return NextResponse.json(
        { success: false, message: "Barcode already exists. Please use a unique barcode." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

// ---------- READ (LIST) ----------
export async function GET(req) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    await connectDB();

    const items = await Product.find({})
      .select({
        title: 1,
        slug: 1,
        category: 1,
        subcategory: 1,
        brand: 1,
        barcode: 1,
        price: 1,
        salePrice: 1,
        stockQty: 1,
        productType: 1,
        variants: 1,
        primaryImage: 1,
        galleryImages: 1,
        tags: 1,
        isNew: 1,
        isTrending: 1,
        createdAt: 1,
      })
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image categoryIds" })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean({ virtuals: true });

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
    return NextResponse.json({ success: false, message: "Failed to fetch admin products" }, { status: 500 });
  }
}