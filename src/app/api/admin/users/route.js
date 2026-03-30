import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USER_ROLES = ["super_admin", "admin", "customer"];
const USER_STATUSES = ["active", "inactive"];

function buildCursor(createdAt, id) {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString("base64");
}

function parseCursor(cursor) {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
    if (!decoded?.createdAt || !decoded?.id) return null;
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) return null;

    const createdAt = new Date(decoded.createdAt);
    if (Number.isNaN(createdAt.getTime())) return null;

    return {
      createdAt,
      id: decoded.id,
    };
  } catch {
    return null;
  }
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isSuperAdmin(actor) {
  return actor?.role === "super_admin";
}

function isAdmin(actor) {
  return actor?.role === "admin";
}

function getVisibleUserFilter(actor) {
  if (isSuperAdmin(actor)) return {};
  return { role: { $ne: "super_admin" } };
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

function buildManagedQuery(actor, extra = {}) {
  const visibilityFilter = getVisibleUserFilter(actor);

  if (!Object.keys(extra).length) return visibilityFilter;
  if (!Object.keys(visibilityFilter).length) return extra;

  return {
    $and: [visibilityFilter, extra],
  };
}

export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const actor = auth.user;
    const { searchParams } = new URL(req.url);

    const limitRaw = Number(searchParams.get("limit"));
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);

    const cursor = searchParams.get("cursor");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const filters = [];

    const visibilityFilter = getVisibleUserFilter(actor);
    if (Object.keys(visibilityFilter).length) {
      filters.push(visibilityFilter);
    }

    if (role && USER_ROLES.includes(role) && canAssignRole(actor, role)) {
      filters.push({ role });
    }

    if (status && USER_STATUSES.includes(status)) {
      filters.push({ status });
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      filters.push({
        $or: [
          { name: { $regex: safeSearch, $options: "i" } },
          { email: { $regex: safeSearch, $options: "i" } },
        ],
      });
    }

    if (cursor) {
      const parsed = parseCursor(cursor);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid cursor." }, { status: 400 });
      }

      filters.push({
        $or: [
          { createdAt: { $lt: parsed.createdAt } },
          {
            createdAt: parsed.createdAt,
            _id: { $lt: new mongoose.Types.ObjectId(parsed.id) },
          },
        ],
      });
    }

    const query =
      filters.length === 0
        ? {}
        : filters.length === 1
        ? filters[0]
        : { $and: filters };

    const users = await User.find(query)
      .select("-passwordHash -verifyToken -verifyTokenExpiry")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;

    const nextCursor =
      hasMore && items.length
        ? buildCursor(items[items.length - 1].createdAt, items[items.length - 1]._id.toString())
        : null;

    return NextResponse.json(
      {
        users: items.map((user) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        pagination: {
          limit,
          hasMore,
          nextCursor,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const actor = auth.user;
    const body = await req.json();
    const { name, email, password, role, status } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const safeName = typeof name === "string" ? name.trim().slice(0, 80) : "";
    const safeRole = USER_ROLES.includes(role) ? role : "customer";
    const safeStatus = status === "inactive" ? "inactive" : "active";

    if (!canAssignRole(actor, safeRole)) {
      return NextResponse.json(
        { error: "You are not allowed to create a user with this role." },
        { status: 403 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: safeName,
      email: normalizedEmail,
      passwordHash,
      role: safeRole,
      status: safeStatus,
    });

    return NextResponse.json(
      {
        message: "User created.",
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
      { status: 201 }
    );
  } catch (err) {
    console.error("Admin users POST error:", err);

    if (err?.code === 11000) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "Create failed." }, { status: 500 });
  }
}

export async function PUT(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const actor = auth.user;
    const body = await req.json();
    const { id, name, role, status, isVerified } = body ?? {};

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid user id is required." }, { status: 400 });
    }

    const targetUser = await User.findById(id).select("+passwordHash").lean();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!canManageTarget(actor, targetUser)) {
      return NextResponse.json(
        { error: "You are not allowed to update this user." },
        { status: 403 }
      );
    }

    const updateData = {};

    if (typeof name === "string") {
      updateData.name = name.trim().slice(0, 80);
    }

    if (typeof role !== "undefined") {
      if (!USER_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }

      if (!canAssignRole(actor, role)) {
        return NextResponse.json(
          { error: "You are not allowed to assign this role." },
          { status: 403 }
        );
      }

      updateData.role = role;
    }

    if (typeof status !== "undefined") {
      if (!USER_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updateData.status = status;
    }

    if (typeof isVerified !== "undefined") {
      updateData.isVerified = Boolean(isVerified);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json(
      {
        message: "User updated.",
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          isVerified: updatedUser.isVerified,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Admin users PUT error:", err);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const actor = auth.user;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid user id is required." }, { status: 400 });
    }

    const targetUser = await User.findById(id).lean();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!canManageTarget(actor, targetUser)) {
      return NextResponse.json(
        { error: "You are not allowed to delete this user." },
        { status: 403 }
      );
    }

    if (actor.id === targetUser._id.toString()) {
      return NextResponse.json(
        { error: "You cannot delete your own account from this route." },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "User deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Admin users DELETE error:", err);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}