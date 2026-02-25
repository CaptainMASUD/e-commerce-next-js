import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  await connectDB();
  const user = await User.findById(params.id).select("-passwordHash");
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  return NextResponse.json({ user }, { status: 200 });
}

export async function PATCH(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const { name, email, password, role, status } = await req.json();

    const updates = {};

    if (typeof name === "string") updates.name = name.trim();

    if (typeof email === "string" && email.trim()) {
      updates.email = email.toLowerCase().trim();
    }

    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(password, 12);
    }

    if (role) updates.role = role === "admin" ? "admin" : "customer";
    if (status) updates.status = status === "inactive" ? "inactive" : "active";

    await connectDB();

    // If changing email, ensure uniqueness
    if (updates.email) {
      const exists = await User.findOne({ email: updates.email, _id: { $ne: params.id } }).lean();
      if (exists) return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const updated = await User.findByIdAndUpdate(params.id, updates, {
      new: true,
      runValidators: true,
      select: "-passwordHash",
    });

    if (!updated) return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json({ message: "User updated.", user: updated }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Update failed.", details: err?.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  await connectDB();
  const deleted = await User.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ error: "User not found." }, { status: 404 });

  return NextResponse.json({ message: "User deleted." }, { status: 200 });
}
