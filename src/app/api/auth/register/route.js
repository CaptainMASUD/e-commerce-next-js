import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/user.model";
import connectDB from "@/lib/dbConfig";
import { generateVerificationToken } from "@/lib/generateVerificationToken";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = generateVerificationToken();
    const verifyTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const user = await User.create({
      name: name?.trim() || "",
      email: normalizedEmail,
      passwordHash,
      role: "customer",
      status: "active",
      isVerified: false,
      verifyToken,
      verifyTokenExpiry,
    });

    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: verifyToken,
      });
    } catch (mailError) {
      // optional rollback if email fails
      await User.findByIdAndDelete(user._id);

      return NextResponse.json(
        {
          error: "Registration failed because verification email could not be sent.",
          details: mailError?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Registered successfully. Please check your email to verify your account.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Registration failed.", details: err?.message },
      { status: 500 }
    );
  }
}