// app/api/admin/users/[id]/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_ROLES = ["super_admin", "admin", "customer"];
const USER_STATUSES = ["active", "inactive"];

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isSuperAdmin(actor) {
  return actor?.role === "super_admin";
}

function isAdmin(actor) {
  return actor?.role === "admin";
}

function canAssignRole(actor, role) {
  if (!USER_ROLES.includes(role)) return false;

  if (isSuperAdmin(actor)) return true;
  if (isAdmin(actor)) return role !== "super_admin";

  return false;
}

function canManageTarget(actor, targetUser) {
  if (!actor || !targetUser) return false;

  if (isSuperAdmin(actor)) return true;

  if (isAdmin(actor)) {
    return targetUser.role !== "super_admin";
  }

  return false;
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

    const user = await User.findById(userId)
      .select("-passwordHash -verifyToken -verifyTokenExpiry")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!canManageTarget(auth.user, user)) {
      return NextResponse.json(
        { error: "You are not allowed to view this user." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
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

    await connectDB();

    const targetUser = await User.findById(userId).lean();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!canManageTarget(auth.user, targetUser)) {
      return NextResponse.json(
        { error: "You are not allowed to update this user." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role, status, isVerified } = body ?? {};

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
      if (!USER_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }

      if (!canAssignRole(auth.user, role)) {
        return NextResponse.json(
          { error: "You are not allowed to assign this role." },
          { status: 403 }
        );
      }

      updates.role = role;
    }

    if (typeof status !== "undefined") {
      if (!USER_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }

      updates.status = status;
    }

    if (typeof isVerified !== "undefined") {
      updates.isVerified = Boolean(isVerified);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const currentAdminId =
      auth?.user?.id?.toString?.() || auth?.user?._id?.toString?.();

    if (currentAdminId && currentAdminId === userId) {
      if (auth.user.role === "admin" && updates.role && updates.role !== "admin") {
        return NextResponse.json(
          { error: "You cannot remove your own admin role." },
          { status: 403 }
        );
      }

      if (auth.user.role === "super_admin" && updates.role && updates.role !== "super_admin") {
        return NextResponse.json(
          { error: "You cannot remove your own super admin role." },
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
      select: "-passwordHash -verifyToken -verifyTokenExpiry",
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
          isVerified: updated.isVerified,
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

    const currentAdminId =
      auth?.user?.id?.toString?.() || auth?.user?._id?.toString?.();

    if (currentAdminId && currentAdminId === userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 403 }
      );
    }

    await connectDB();

    const targetUser = await User.findById(userId).lean();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!canManageTarget(auth.user, targetUser)) {
      return NextResponse.json(
        { error: "You are not allowed to delete this user." },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "User deleted." }, { status: 200 });
  } catch (err) {
    console.error("Admin user DELETE error:", err);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}