import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";

const JWT_SECRET = process.env.JWT_SECRET;

function jsonError(message, status = 400, details) {
  const payload = { error: message };
  if (details) payload.details = details;
  return NextResponse.json(payload, { status });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email?.toLowerCase?.().trim?.();
    const password = body?.password;

    if (!email || !password) {
      return jsonError("Email and password are required.", 400);
    }

    if (!JWT_SECRET) {
      return jsonError("Server misconfigured: JWT_SECRET is missing.", 500);
    }

    await connectDB();

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return jsonError("Invalid credentials.", 401);
    }

    if (user.status !== "active") {
      return jsonError("User is inactive.", 403);
    }

    if (!user.passwordHash) {
      return jsonError("Password not set for this account.", 400);
    }

    if (!user.isVerified) {
      return jsonError("Please verify your email before logging in.", 403);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      return jsonError("Invalid credentials.", 401);
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        message: "Login successful.",
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return jsonError("Login failed.", 500, err?.message);
  }
}