// api/products/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Product from "@/models/product.model";

export const dynamic = "force-dynamic";

const pickListFields = () => ({
  title: 1,
  slug: 1,
  category: 1,
  brand: 1,
  price: 1,
  salePrice: 1,
  primaryImage: 1,
  status: 1,
  visibility: 1,
  isDeleted: 1,
  createdAt: 1,
});

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category"); // categoryId
    const brand = searchParams.get("brand"); // brandId (optional)
    const q = searchParams.get("q"); // optional text search
    const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const filter = {
      status: "active",
      visibility: "public",
      isDeleted: false,
    };

    if (category) filter.category = String(category).trim();
    if (brand) filter.brand = String(brand).trim();

    if (q) {
      // uses text index from model
      filter.$text = { $search: String(q) };
    }

    const query = Product.find(filter)
      .select(pickListFields())
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "brand", select: "name slug" });

    // If doing text search, include score + sort by relevance
    if (q) {
      query.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
    } else {
      query.sort({ createdAt: -1 });
    }

    const items = await query.skip(skip).limit(limit).lean();

    // Shape response for UI
    const products = items.map((p) => ({
      _id: p._id,
      name: p.title,
      slug: p.slug,
      category: p.category,
      brand: p.brand,
      image: p.primaryImage?.url || "",
      normalPrice: p.price,
      discountPrice: typeof p.salePrice === "number" ? p.salePrice : null,
    }));

    return NextResponse.json({ success: true, page, limit, products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}