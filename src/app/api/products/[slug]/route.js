// src/app/api/products/[slug]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";

export const dynamic = "force-dynamic";

function toSafeImage(image) {
  if (!image || typeof image !== "object") return null;

  return {
    url: image.url || "",
    publicId: image.publicId || "",
    alt: image.alt || "",
    order: typeof image.order === "number" ? image.order : 0,
  };
}

function toSafeImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => toSafeImage(img))
    .filter((img) => img && String(img.url || "").trim());
}

function toNumberOr(defaultValue, value) {
  return typeof value === "number" && !Number.isNaN(value) ? value : defaultValue;
}

function getVariantFinalPrice(variant) {
  if (!variant) return 0;

  const price = toNumberOr(0, variant.price);
  const salePrice =
    typeof variant.salePrice === "number" && !Number.isNaN(variant.salePrice)
      ? variant.salePrice
      : null;

  return salePrice !== null ? salePrice : price;
}

function getProductFinalPrice(product) {
  if (!product) return 0;

  if (product.productType === "variable") {
    const activeVariants = Array.isArray(product.variants)
      ? product.variants.filter((v) => v?.isActive !== false)
      : [];

    if (!activeVariants.length) {
      return toNumberOr(0, product.price);
    }

    const finals = activeVariants
      .map((v) => getVariantFinalPrice(v))
      .filter((n) => typeof n === "number" && !Number.isNaN(n) && n >= 0);

    if (!finals.length) return toNumberOr(0, product.price);
    return Math.min(...finals);
  }

  const price = toNumberOr(0, product.price);
  const salePrice =
    typeof product.salePrice === "number" && !Number.isNaN(product.salePrice)
      ? product.salePrice
      : null;

  return salePrice !== null ? salePrice : price;
}

function getProductDiscountAmount(product, finalPrice) {
  if (!product) return 0;

  if (product.productType === "variable") {
    return 0;
  }

  const price = toNumberOr(0, product.price);
  return Math.max(price - finalPrice, 0);
}

function getProductDiscountPercent(product, discountAmount) {
  if (!product) return 0;

  if (product.productType === "variable") {
    return 0;
  }

  const price = toNumberOr(0, product.price);
  if (price <= 0) return 0;

  return Math.round((discountAmount / price) * 100);
}

export async function GET(_req, context) {
  try {
    await connectDB();

    const resolvedParams =
      typeof context?.params?.then === "function"
        ? await context.params
        : context?.params;

    const slug = String(resolvedParams?.slug || "")
      .trim()
      .toLowerCase();

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Product slug is required" },
        { status: 400 }
      );
    }

    const product = await Product.findOne({ slug })
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug" })
      .lean({ virtuals: true });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    let subcategoryObj = null;

    if (product.subcategory && Array.isArray(product.category?.subcategories)) {
      const subId = String(product.subcategory);
      subcategoryObj =
        product.category.subcategories.find((s) => String(s?._id) === subId) || null;
    }

    const finalPrice = getProductFinalPrice(product);
    const discountAmount = getProductDiscountAmount(product, finalPrice);
    const discountPercent = getProductDiscountPercent(product, discountAmount);

    const responseProduct = {
      _id: product._id,
      title: product.title || "",
      slug: product.slug || "",

      brand: product.brand
        ? {
            _id: product.brand._id,
            name: product.brand.name || "",
            slug: product.brand.slug || "",
          }
        : null,

      category: product.category
        ? {
            _id: product.category._id,
            name: product.category.name || "",
            slug: product.category.slug || "",
          }
        : null,

      subcategory: subcategoryObj
        ? {
            _id: subcategoryObj._id,
            name: subcategoryObj.name || "",
            slug: subcategoryObj.slug || "",
          }
        : null,

      productType: product.productType || "simple",

      barcode: product.barcode || "",

      price: toNumberOr(0, product.price),
      salePrice:
        typeof product.salePrice === "number" && !Number.isNaN(product.salePrice)
          ? product.salePrice
          : null,

      finalPrice,
      discountAmount,
      discountPercent,

      stockQty: toNumberOr(0, product.stockQty),
      availableStock: toNumberOr(0, product.availableStock),
      inStockNow: toNumberOr(0, product.availableStock) > 0,

      isNew: !!product.isNew,
      isTrending: !!product.isTrending,

      primaryImage: toSafeImage(product.primaryImage),
      galleryImages: toSafeImages(product.galleryImages),

      tags: Array.isArray(product.tags) ? product.tags : [],

      features: Array.isArray(product.features)
        ? product.features.map((f, index) => ({
            label: f?.label || "",
            value: f?.value || "",
            isKey: !!f?.isKey,
            order: typeof f?.order === "number" ? f.order : index,
            group: f?.group || "",
          }))
        : [],

      description: Array.isArray(product.description)
        ? product.description.map((d, index) => ({
            title: d?.title || "",
            details: d?.details || "",
            order: typeof d?.order === "number" ? d.order : index,
          }))
        : [],

      variants: Array.isArray(product.variants)
        ? product.variants
            .filter((v) => v?.isActive !== false)
            .map((v) => {
              const variantPrice = toNumberOr(0, v.price);
              const variantSalePrice =
                typeof v.salePrice === "number" && !Number.isNaN(v.salePrice)
                  ? v.salePrice
                  : null;
              const variantFinalPrice = getVariantFinalPrice(v);
              const variantDiscountAmount = Math.max(variantPrice - variantFinalPrice, 0);
              const variantDiscountPercent =
                variantPrice > 0
                  ? Math.round((variantDiscountAmount / variantPrice) * 100)
                  : 0;

              return {
                barcode: v.barcode || "",
                attributes:
                  v?.attributes instanceof Map
                    ? Object.fromEntries(v.attributes.entries())
                    : v?.attributes && typeof v.attributes === "object"
                    ? v.attributes
                    : {},

                price: variantPrice,
                salePrice: variantSalePrice,
                finalPrice: variantFinalPrice,
                discountAmount: variantDiscountAmount,
                discountPercent: variantDiscountPercent,

                stockQty: toNumberOr(0, v.stockQty),
                inStockNow: toNumberOr(0, v.stockQty) > 0,

                images: toSafeImages(v.images),
                isActive: !!v.isActive,
              };
            })
        : [],
    };

    return NextResponse.json({
      success: true,
      product: responseProduct,
    });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}