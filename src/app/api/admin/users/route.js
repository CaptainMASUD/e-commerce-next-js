import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  await connectDB();
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });

  return NextResponse.json({ users }, { status: 200 });
}

export async function POST(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    const { name, email, password, role, status } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    await connectDB();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name?.trim() || "",
      email: normalizedEmail,
      passwordHash,
      role: role === "admin" ? "admin" : "customer",
      status: status === "inactive" ? "inactive" : "active",
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
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Create failed.", details: err?.message }, { status: 500 });
  }
}
