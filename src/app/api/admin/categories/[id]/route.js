// app/api/admin/categories/[id]/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Category from "@/models/category.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

function jsonError(message, status = 400, details) {
  const payload = { error: message };
  if (details) payload.details = details;
  return NextResponse.json(payload, { status });
}

function badId(id) {
  return !id || !mongoose.Types.ObjectId.isValid(id);
}

async function getParams(ctx) {
  // Next.js may provide params as Promise
  if (!ctx) return {};
  const p = ctx.params;
  return p && typeof p.then === "function" ? await p : (p || {});
}

export async function GET(req, ctx) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  const { id } = await getParams(ctx);
  if (badId(id)) return jsonError("Invalid id", 400);

  try {
    await connectDB();
    const item = await Category.findById(id).lean();
    if (!item) return jsonError("Not found", 404);
    return NextResponse.json({ item }, { status: 200 });
  } catch (err) {
    return jsonError("Failed to fetch category", 500, err?.message || String(err));
  }
}

export async function PUT(req, ctx) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  const { id } = await getParams(ctx);
  if (badId(id)) return jsonError("Invalid id", 400);

  try {
    const body = await req.json().catch(() => ({}));
    await connectDB();

    const doc = await Category.findById(id);
    if (!doc) return jsonError("Not found", 404);

    const allowed = ["name", "slug", "sortOrder", "isActive", "subcategories"];
    for (const k of allowed) {
      if (k in body) doc.set(k, body[k]);
    }

    doc.updatedBy = auth.user.id;
    await doc.save();

    return NextResponse.json({ item: doc.toJSON() }, { status: 200 });
  } catch (err) {
    const msg = err?.message || String(err);
    const isDup = err?.code === 11000 || msg.toLowerCase().includes("duplicate key");
    return jsonError("Failed to update category", isDup ? 409 : 500, msg);
  }
}

export async function DELETE(req, ctx) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  const { id } = await getParams(ctx);
  if (badId(id)) return jsonError("Invalid id", 400);

  try {
    await connectDB();
    const doc = await Category.findByIdAndDelete(id);
    if (!doc) return jsonError("Not found", 404);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return jsonError("Failed to delete category", 500, err?.message || String(err));
  }
}