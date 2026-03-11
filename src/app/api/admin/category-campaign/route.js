export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Category from "@/models/category.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

function jsonError(message, status = 400, details) {
  const payload = { error: message };
  if (details) payload.details = details;
  return NextResponse.json(payload, { status });
}

function normalizeLimit(v, fallback = 200) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 500);
}

/**
 * GET /api/admin/category-campaign
 * List all categories with banner data
 */
export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = normalizeLimit(searchParams.get("limit"), 200);

    const items = await Category.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id name slug isActive banner")
      .lean();

    return NextResponse.json(
      {
        items: items.map((category) => ({
          _id: category._id,
          id: String(category._id),
          name: category.name || "",
          slug: category.slug || "",
          isActive: !!category.isActive,
          banner: category.banner || null,
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    return jsonError("Failed to fetch category campaigns", 500, err?.message || String(err));
  }
}