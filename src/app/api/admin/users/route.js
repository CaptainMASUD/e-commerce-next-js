// app/api/admin/users/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const limitRaw = Number(searchParams.get("limit"));
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);

    const cursor = searchParams.get("cursor");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const query = {};

    if (role && ["admin", "customer"].includes(role)) {
      query.role = role;
    }

    if (status && ["active", "inactive"].includes(status)) {
      query.status = status;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (cursor) {
      const parsed = parseCursor(cursor);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid cursor." }, { status: 400 });
      }

      query.$or = [
        ...(query.$or ? [{ $and: query.$or }] : []),
      ];

      const paginationCondition = {
        $or: [
          { createdAt: { $lt: parsed.createdAt } },
          {
            createdAt: parsed.createdAt,
            _id: { $lt: new mongoose.Types.ObjectId(parsed.id) },
          },
        ],
      };

      if (Object.keys(query).length > 0) {
        const { $or, ...rest } = query;

        if ($or && !rest.createdAt && !rest._id) {
          Object.assign(query, {
            $and: [
              { $or },
              paginationCondition,
              rest,
            ].filter((v) => Object.keys(v).length > 0),
          });
          delete query.$or;
          Object.keys(rest).forEach((key) => delete query[key]);
        } else {
          Object.assign(query, {
            $and: [paginationCondition, rest].filter((v) => Object.keys(v).length > 0),
          });
          Object.keys(rest).forEach((key) => delete query[key]);
        }
      } else {
        Object.assign(query, paginationCondition);
      }
    }

    const users = await User.find(query)
      .select("-passwordHash")
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

    const safeName =
      typeof name === "string" ? name.trim().slice(0, 80) : "";

    const safeRole = role === "admin" ? "admin" : "customer";
    const safeStatus = status === "inactive" ? "inactive" : "active";

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