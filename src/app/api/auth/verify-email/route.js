import { NextResponse } from "next/server";
import User from "@/models/user.model";
import connectDB from "@/lib/dbConfig";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.verifyToken = null;
    user.verifyTokenExpiry = null;

    await user.save();

    return NextResponse.json(
      { message: "Email verified successfully." },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Email verification failed.", details: err?.message },
      { status: 500 }
    );
  }
}