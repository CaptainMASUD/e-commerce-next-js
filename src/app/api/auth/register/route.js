import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/user.model";
import connectDB from "@/lib/dbConfig";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name?.trim() || "",
      email: normalizedEmail,
      passwordHash,
      role: "customer",
      status: "active",
    });

    return NextResponse.json(
      {
        message: "Registered successfully.",
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
    return NextResponse.json({ error: "Registration failed.", details: err?.message }, { status: 500 });
  }
}
