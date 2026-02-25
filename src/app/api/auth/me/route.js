import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/user.model";

import connectDB from "@/lib/dbConfig";
import { requireAuth } from "@/lib/auth";

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  return NextResponse.json({ user: auth.user }, { status: 200 });
}

export async function PATCH(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  try {
    const { name, password } = await req.json();

    if (password && (typeof password !== "string" || password.length < 8)) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    await connectDB();

    const updates = {};
    if (typeof name === "string") updates.name = name.trim();
    if (password) updates.passwordHash = await bcrypt.hash(password, 12);

    const updated = await User.findByIdAndUpdate(auth.user._id, updates, {
      new: true,
      runValidators: true,
      select: "-passwordHash",
    });

    return NextResponse.json({ message: "Account updated.", user: updated }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Update failed.", details: err?.message }, { status: 500 });
  }
}
