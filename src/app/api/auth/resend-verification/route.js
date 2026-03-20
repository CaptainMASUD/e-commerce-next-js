import { NextResponse } from "next/server";
import User from "@/models/user.model";
import connectDB from "@/lib/dbConfig";
import { generateVerificationToken } from "@/lib/generateVerificationToken";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Email is already verified." },
        { status: 200 }
      );
    }

    const verifyToken = generateVerificationToken();
    const verifyTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.verifyToken = verifyToken;
    user.verifyTokenExpiry = verifyTokenExpiry;
    await user.save();

    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verifyToken,
    });

    return NextResponse.json(
      { message: "Verification email resent successfully." },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to resend verification email.", details: err?.message },
      { status: 500 }
    );
  }
}