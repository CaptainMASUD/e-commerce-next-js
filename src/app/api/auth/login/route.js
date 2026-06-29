import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/dbConfig.js";
import User from "@/models/user.model";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET or ACCESS_TOKEN_SECRET is missing.");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json().catch(() => null);

    const email = body?.email?.trim()?.toLowerCase();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { message: "Your account is inactive. Please contact support." },
        { status: 403 }
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = createToken(user);

    return NextResponse.json(
      {
        message: "Login successful.",
        token,
        user: user.toJSON(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { message: "Something went wrong while logging in." },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
