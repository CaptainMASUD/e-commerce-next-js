// app/api/admin/customer/cart/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Cart from "@/models/cart.model";
import User from "@/models/user.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const admin = requireAdmin(auth);
  if (!admin.ok) return admin.res;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const type = (searchParams.get("type") || "all").trim(); // user|guest|all
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));
  const skip = Math.max(0, Number(searchParams.get("skip") || 0));

  const filter = {};

  if (type === "user") filter.user = { $ne: null };
  if (type === "guest") filter.guestId = { $ne: "" };

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const guestMatch = { guestId: new RegExp(safe, "i") };

    const users = await User.find({
      $or: [
        { email: new RegExp(safe, "i") },
        { name: new RegExp(safe, "i") },
      ],
    })
      .select("_id")
      .lean();

    const userIds = users.map((u) => u._id);

    filter.$or = [{ user: { $in: userIds } }, guestMatch];
  }

  const carts = await Cart.find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user", "name email role status")
    .populate("items.product")
    .lean();

  const total = await Cart.countDocuments(filter);

  return NextResponse.json({ total, skip, limit, carts });
}