// app/api/admin/products/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "@/utils/cloudinary";
import { requireAuth, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_PRODUCT_TYPE = new Set(["simple", "variable"]);
const ALLOWED_GALLERY_MODE = new Set(["replace", "append", "keep"]);

// ---------- helpers ----------
function toNumber(v, fallback = undefined) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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

// Enforce "Brand belongs to Category" like your ProductSchema pre("save")
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

async function resolveEmbeddedSubcategory(categoryId, subcategoryId) {
  if (!categoryId || !subcategoryId) return null;
  const cat = await Category.findById(categoryId).select("subcategories isActive").lean();
  if (!cat) return null;
  if (cat.isActive === false) return null;
  if (!cat?.subcategories?.length) return null;

  const sid = String(subcategoryId);
  return cat.subcategories.find((s) => String(s?._id) === sid) || null;
}

async function getIdFromContext(ctx) {
  const { params } = ctx || {};
  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const id = resolvedParams?.id ? String(resolvedParams.id) : "";
  return id;
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

function normalizeDescriptionBlocks(raw, fallback = undefined) {
  if (raw === undefined) return fallback;
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

function normalizeFeatures(raw, fallback = undefined) {
  if (raw === undefined) return fallback;
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
 * ✅ Variants: ONLY barcode identifier
 * - Removed: variantId, sku
 */
function normalizeVariants(raw, fallback = undefined) {
  if (raw === undefined) return fallback;
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
        attributes, // mongoose casts object -> Map
        price: toNumber(v.price, undefined),
        salePrice: toNumber(v.salePrice, undefined),
        stockQty: Math.max(0, toNumber(v.stockQty, 0) ?? 0),
        images: normalizeImages(v.images),
        isActive: toBool(v.isActive, true),
      };
    });
}

function normalizeTags(raw, fallback = undefined) {
  if (raw === undefined) return fallback;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((t) => String(t).trim()).filter(Boolean))];
}

function validateEnums(productType) {
  if (productType && !ALLOWED_PRODUCT_TYPE.has(productType)) {
    return "Invalid productType. Use: simple | variable";
  }
  return null;
}

function pluckPublicIds(product) {
  const ids = [
    product?.primaryImage?.publicId,
    ...(product?.galleryImages || []).map((i) => i?.publicId),
    ...(product?.variants || []).flatMap((v) => (v?.images || []).map((img) => img?.publicId)),
  ].filter(Boolean);
  return [...new Set(ids)];
}

async function reFetch(id) {
  const saved = await Product.findById(id)
    .populate({ path: "category", select: "name slug subcategories" })
    .populate({ path: "brand", select: "name slug image categoryIds" })
    .lean({ virtuals: true });

  let subcategoryObj = null;
  if (saved?.subcategory && saved?.category?.subcategories?.length) {
    const subId = String(saved.subcategory);
    subcategoryObj = saved.category.subcategories.find((s) => String(s?._id) === subId) || null;
  }

  return {
    ...saved,
    subcategoryObj,
    variants: Array.isArray(saved?.variants) ? saved.variants : [],
    features: Array.isArray(saved?.features) ? saved.features : [],
    description: Array.isArray(saved?.description) ? saved.description : [],
    tags: Array.isArray(saved?.tags) ? saved.tags : [],
    galleryImages: Array.isArray(saved?.galleryImages) ? saved.galleryImages : [],
  };
}

// ---------- GET ONE ----------
export async function GET(req, ctx) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    const id = await getIdFromContext(ctx);
    if (!id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });

    await connectDB();

    const product = await Product.findById(id)
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image categoryIds" })
      .lean({ virtuals: true });

    if (!product) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    let subcategoryObj = null;
    if (product.subcategory && product.category?.subcategories?.length) {
      const subId = String(product.subcategory);
      subcategoryObj = product.category.subcategories.find((s) => String(s?._id) === subId) || null;
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        subcategoryObj,
        variants: Array.isArray(product.variants) ? product.variants : [],
        features: Array.isArray(product.features) ? product.features : [],
        description: Array.isArray(product.description) ? product.description : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
        galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages : [],
      },
    });
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// ---------- PATCH (JSON or multipart/form-data) ----------
export async function PATCH(req, ctx) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    const id = await getIdFromContext(ctx);
    if (!id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });

    await connectDB();

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    const contentType = req.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let patch = {};
    let files = { primaryImage: null, galleryImages: [] };
    let galleryMode = "keep"; // keep | replace | append

    if (isJson) {
      const body = await req.json();

      patch.title = body.title;
      patch.slug = body.slug;

      patch.category = body.category;
      patch.subcategory = body.subcategory;
      patch.brand = body.brand;

      patch.barcode = body.barcode;

      patch.price = body.price;
      patch.salePrice = body.salePrice;

      patch.stockQty = body.stockQty;

      patch.productType = body.productType;
      patch.variants = body.variants;

      patch.isNew = body.isNew;
      patch.isTrending = body.isTrending;

      patch.primaryImage = body.primaryImage;
      patch.galleryImages = body.galleryImages;

      patch.tags = body.tags;
      patch.description = body.description;
      patch.features = body.features;

      galleryMode = normalizeString(body.galleryMode, "keep") || "keep";
    } else {
      const form = await req.formData();

      if (form.get("title") != null) patch.title = form.get("title");
      if (form.get("slug") != null) patch.slug = form.get("slug");

      if (form.get("category") != null) patch.category = form.get("category");
      if (form.get("subcategory") != null) patch.subcategory = form.get("subcategory");
      if (form.get("brand") != null) patch.brand = form.get("brand");

      if (form.get("barcode") != null) patch.barcode = form.get("barcode");

      if (form.get("price") != null) patch.price = form.get("price");
      if (form.get("salePrice") != null) patch.salePrice = form.get("salePrice");

      if (form.get("stockQty") != null) patch.stockQty = form.get("stockQty");

      if (form.get("productType") != null) patch.productType = form.get("productType");
      if (form.get("variants") != null) patch.variants = safeJsonParse(form.get("variants"), undefined);

      if (form.get("isNew") != null) patch.isNew = form.get("isNew");
      if (form.get("isTrending") != null) patch.isTrending = form.get("isTrending");

      if (form.get("primaryImageJson") != null)
        patch.primaryImage = safeJsonParse(form.get("primaryImageJson"), undefined);
      if (form.get("galleryImagesJson") != null)
        patch.galleryImages = safeJsonParse(form.get("galleryImagesJson"), undefined);

      if (form.get("tags") != null) patch.tags = safeJsonParse(form.get("tags"), undefined);
      if (form.get("description") != null) patch.description = safeJsonParse(form.get("description"), undefined);
      if (form.get("features") != null) patch.features = safeJsonParse(form.get("features"), undefined);

      // file uploads
      const newPrimary = form.get("primaryImage");
      if (newPrimary && typeof newPrimary !== "string") files.primaryImage = newPrimary;

      const galleryFiles = form.getAll("galleryImages") || [];
      files.galleryImages = galleryFiles.filter((f) => f && typeof f !== "string");

      galleryMode = normalizeString(form.get("galleryMode"), "keep") || "keep";
    }

    if (!ALLOWED_GALLERY_MODE.has(galleryMode)) galleryMode = "keep";

    // -------- apply patch to mongoose doc --------
    if (patch.title !== undefined) product.title = normalizeString(patch.title);
    if (patch.slug !== undefined) product.slug = normalizeString(patch.slug).toLowerCase();

    if (patch.category !== undefined) product.category = normalizeString(patch.category);
    if (patch.brand !== undefined) product.brand = normalizeString(patch.brand);

    if (patch.subcategory !== undefined) {
      const subVal = normalizeString(patch.subcategory);
      product.subcategory = subVal ? subVal : null;
    }

    if (patch.barcode !== undefined) product.barcode = normalizeString(patch.barcode, "");

    // ✅ price is required ONLY for simple products (we still validate number if provided)
    if (patch.price !== undefined) {
      const n = toNumber(patch.price, undefined);
      if (typeof n !== "number" || n < 0) {
        return NextResponse.json({ success: false, message: "Invalid price" }, { status: 400 });
      }
      product.price = n;
    }

    if (patch.salePrice !== undefined) {
      const sp = patch.salePrice === null ? null : toNumber(patch.salePrice, null);
      product.salePrice = typeof sp === "number" && sp >= 0 ? sp : sp === null ? null : null;
    }

    if (patch.stockQty !== undefined) {
      const n = toNumber(patch.stockQty, undefined);
      if (typeof n !== "number" || n < 0) {
        return NextResponse.json({ success: false, message: "Invalid stockQty" }, { status: 400 });
      }
      product.stockQty = n;
    }

    if (patch.productType !== undefined) {
      const pt = normalizeString(patch.productType, product.productType || "simple");
      product.productType = pt;
    }

    if (patch.variants !== undefined) {
      product.variants = normalizeVariants(patch.variants, product.variants) ?? product.variants;
    }

    if (patch.isNew !== undefined) {
      const b = toBool(patch.isNew, product.isNew);
      if (b !== undefined) product.isNew = b;
    }
    if (patch.isTrending !== undefined) {
      const b = toBool(patch.isTrending, product.isTrending);
      if (b !== undefined) product.isTrending = b;
    }

    if (patch.tags !== undefined) product.tags = normalizeTags(patch.tags, product.tags) ?? product.tags;

    if (patch.description !== undefined) {
      product.description = normalizeDescriptionBlocks(patch.description, product.description) ?? product.description;
    }

    if (patch.features !== undefined) {
      product.features = normalizeFeatures(patch.features, product.features) ?? product.features;
    }

    // Allow JSON-based direct set (no file upload) for images if needed
    if (patch.primaryImage !== undefined && patch.primaryImage && typeof patch.primaryImage === "object") {
      const arr = normalizeImages([patch.primaryImage]);
      if (arr[0]?.url) product.primaryImage = arr[0];
    }
    if (patch.galleryImages !== undefined && Array.isArray(patch.galleryImages)) {
      product.galleryImages = normalizeImages(patch.galleryImages);
    }

    // -------- validations (enums + required + relations) --------
    const enumError = validateEnums(product.productType);
    if (enumError) return NextResponse.json({ success: false, message: enumError }, { status: 400 });

    if (!product.category || !product.brand) {
      return NextResponse.json({ success: false, message: "category and brand are required" }, { status: 400 });
    }

    const brandCheck = await validateBrandBelongsToCategory(product.brand, product.category);
    if (!brandCheck.ok) {
      return NextResponse.json({ success: false, message: brandCheck.message }, { status: 400 });
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

    // ✅ productType integrity
    if (product.productType === "variable") {
      if (!Array.isArray(product.variants) || product.variants.length === 0) {
        return NextResponse.json({ success: false, message: "productType=variable requires variants." }, { status: 400 });
      }

      const active = product.variants.filter((v) => v?.isActive !== false);
      if (!active.length) {
        return NextResponse.json(
          { success: false, message: "At least one active variant is required." },
          { status: 400 }
        );
      }

      const missingBarcode = active.some((v) => !String(v?.barcode || "").trim());
      if (missingBarcode) {
        return NextResponse.json(
          { success: false, message: "Each active variant requires a barcode." },
          { status: 400 }
        );
      }

      const missingPrice = active.some((v) => typeof v?.price !== "number" || v.price < 0);
      if (missingPrice) {
        return NextResponse.json(
          { success: false, message: "Each active variant requires a valid price." },
          { status: 400 }
        );
      }

      const badSale = active.some((v) => typeof v?.salePrice === "number" && v.salePrice > v.price);
      if (badSale) {
        return NextResponse.json(
          { success: false, message: "Variant salePrice cannot exceed variant price." },
          { status: 400 }
        );
      }

      // keep product-level fields clean (model will also enforce)
      product.barcode = "";
      product.stockQty = 0;
      product.salePrice = null;
    } else {
      // ✅ SIMPLE validations
      if (typeof product.price !== "number" || product.price < 0) {
        return NextResponse.json({ success: false, message: "price is required for simple products" }, { status: 400 });
      }
      if (typeof product.salePrice === "number" && product.salePrice > product.price) {
        return NextResponse.json({ success: false, message: "Sale price cannot exceed price" }, { status: 400 });
      }
      if (typeof product.stockQty !== "number" || product.stockQty < 0) {
        return NextResponse.json({ success: false, message: "Invalid stockQty" }, { status: 400 });
      }

      // simple: clear variants
      product.variants = [];
    }

    // primaryImage must exist (model requires)
    if (!product.primaryImage?.url) {
      return NextResponse.json({ success: false, message: "primaryImage is required." }, { status: 400 });
    }

    // -------- image updates (multipart only) --------
    // primary image replace: upload new, then delete old publicId
    if (files.primaryImage) {
      const oldPublicId = product.primaryImage?.publicId;

      const buf = await fileToBuffer(files.primaryImage);
      const up = await uploadBufferToCloudinary(buf, { folder: "products/primary" });
      if (!up?.success) return NextResponse.json({ success: false, message: "Primary upload failed" }, { status: 500 });

      product.primaryImage = { url: up.url, publicId: up.publicId || "", alt: "", order: 0 };

      if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    }

    // gallery behavior: keep | replace | append
    if (files.galleryImages.length && galleryMode !== "keep") {
      const uploaded = [];
      for (const gf of files.galleryImages) {
        const buf = await fileToBuffer(gf);
        const up = await uploadBufferToCloudinary(buf, { folder: "products/gallery" });
        if (up?.success) {
          uploaded.push({
            url: up.url,
            publicId: up.publicId || "",
            alt: "",
            order: uploaded.length,
          });
        }
      }

      if (uploaded.length) {
        if (galleryMode === "replace") {
          const oldPublicIds = (product.galleryImages || []).map((i) => i?.publicId).filter(Boolean);
          for (const pid of oldPublicIds) await deleteFromCloudinary(pid);
          product.galleryImages = uploaded;
        } else if (galleryMode === "append") {
          const current = Array.isArray(product.galleryImages) ? product.galleryImages : [];
          const baseOrder = current.length;
          product.galleryImages = [...current, ...uploaded.map((x, i) => ({ ...x, order: baseOrder + i }))];
        }
      }
    }

    // -------- save (runs ProductSchema pre("save")) --------
    await product.save();

    const responseProduct = await reFetch(product._id);
    return NextResponse.json({ success: true, product: responseProduct });
  } catch (error) {
    console.error("PATCH /api/admin/products/[id] error:", error);

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
      { success: false, message: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// ---------- DELETE (HARD DELETE + CLOUDINARY CLEANUP) ----------
export async function DELETE(req, ctx) {
  const authResult = await requireAuth(req);
  const adminResult = requireAdmin(authResult);
  if (!adminResult.ok) return adminResult.res;

  try {
    const id = await getIdFromContext(ctx);
    if (!id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });

    await connectDB();

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    // delete cloudinary assets (primary + gallery + variant images)
    const ids = pluckPublicIds(product);
    for (const pid of ids) await deleteFromCloudinary(pid);

    await Product.deleteOne({ _id: id });

    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}