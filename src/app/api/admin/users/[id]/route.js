// app/api/admin/users/[id]/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const userId = params?.id;

    if (!isValidObjectId(userId)) {
      return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId).select("-passwordHash").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Admin user GET error:", err);
    return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const userId = params?.id;

    if (!isValidObjectId(userId)) {
      return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    }

    const body = await req.json();
    const { name, email, password, role, status } = body ?? {};

    const updates = {};

    if (typeof name === "string") {
      updates.name = name.trim().slice(0, 80);
    }

    if (typeof email === "string" && email.trim()) {
      const normalizedEmail = normalizeEmail(email);

      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
      }

      updates.email = normalizedEmail;
    }

    if (typeof password !== "undefined") {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters." },
          { status: 400 }
        );
      }

      updates.passwordHash = await bcrypt.hash(password, 12);
    }

    if (typeof role !== "undefined") {
      if (!["admin", "customer"].includes(role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
      updates.role = role;
    }

    if (typeof status !== "undefined") {
      if (!["active", "inactive"].includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const currentAdminId = auth?.user?.id?.toString?.() || auth?.user?._id?.toString?.();

    if (currentAdminId && currentAdminId === userId) {
      if (updates.role && updates.role !== "admin") {
        return NextResponse.json(
          { error: "You cannot remove your own admin role." },
          { status: 403 }
        );
      }

      if (updates.status && updates.status !== "active") {
        return NextResponse.json(
          { error: "You cannot deactivate your own account." },
          { status: 403 }
        );
      }
    }

    await connectDB();

    if (updates.email) {
      const exists = await User.findOne({
        email: updates.email,
        _id: { $ne: userId },
      }).lean();

      if (exists) {
        return NextResponse.json(
          { error: "Email already in use." },
          { status: 409 }
        );
      }
    }

    const updated = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
      select: "-passwordHash",
    }).lean();

    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "User updated.",
        user: {
          id: updated._id.toString(),
          name: updated.name,
          email: updated.email,
          role: updated.role,
          status: updated.status,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Admin user PATCH error:", err);

    if (err?.code === 11000) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const userId = params?.id;

    if (!isValidObjectId(userId)) {
      return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    }

    const currentAdminId = auth?.user?.id?.toString?.() || auth?.user?._id?.toString?.();

    if (currentAdminId && currentAdminId === userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 403 }
      );
    }

    await connectDB();

    const deleted = await User.findByIdAndDelete(userId).lean();

    if (!deleted) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted." }, { status: 200 });
  } catch (err) {
    console.error("Admin user DELETE error:", err);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}