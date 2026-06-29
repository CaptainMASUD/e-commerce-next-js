import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/dbConfig.js";
import User from "@/models/user.model";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json().catch(() => null);
    const email = body?.email?.trim()?.toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    // Security: do not reveal if email exists or not
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If this email exists, password reset instructions have been created.",
        },
        { status: 200 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 1000 * 60 * 15);

    await user.save();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";

    const resetLink = appUrl
      ? `${appUrl}/reset-password/${rawToken}`
      : `/reset-password/${rawToken}`;

    console.log("PASSWORD_RESET_LINK:", resetLink);

    return NextResponse.json(
      {
        message:
          "If this email exists, password reset instructions have been created.",
        resetLink:
          process.env.NODE_ENV === "development" ? resetLink : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);

    return NextResponse.json(
      { message: "Something went wrong while creating reset request." },
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