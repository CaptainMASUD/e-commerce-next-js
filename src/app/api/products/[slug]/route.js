// api/products/[slug]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  try {
    await connectDB();

    const slug = String(params?.slug || "").trim().toLowerCase();
    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Product slug is required" },
        { status: 400 }
      );
    }

    const product = await Product.findOne({
      slug,
      status: "active",
      visibility: "public",
      isDeleted: false,
    })
      .populate({ path: "category", select: "name slug subcategories" })
      .populate({ path: "brand", select: "name slug image" })
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // ✅ subcategory is embedded in Category.subcategories, so resolve it from populated category
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
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}