import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";

function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
}

// Read token from:
// 1) Authorization: Bearer <token>
// 2) cookie: token=<token>
function getTokenFromRequest(req) {
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

export async function requireAuth(req) {
  try {
    const token = getTokenFromRequest(req);
    const jwtSecret = getJwtSecret();

    if (!token) {
      return {
        ok: false,
        res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    if (!jwtSecret) {
      return {
        ok: false,
        res: NextResponse.json(
          { error: "Server misconfigured: JWT secret missing" },
          { status: 500 }
        ),
      };
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch {
      return {
        ok: false,
        res: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
      };
    }

    const userId = payload?.sub || payload?.id;

    if (!userId) {
      return {
        ok: false,
        res: NextResponse.json({ error: "Invalid token payload" }, { status: 401 }),
      };
    }

    await connectDB();

    const user = await User.findById(userId)
      .select("name email role status")
      .lean();

    if (!user) {
      return {
        ok: false,
        res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    if (user.status !== "active") {
      return {
        ok: false,
        res: NextResponse.json({ error: "User is inactive" }, { status: 403 }),
      };
    }

    return {
      ok: true,
      user: {
        id: String(user._id),
        name: user.name || "",
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  } catch (err) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Auth check failed", details: err?.message || String(err) },
        { status: 500 }
      ),
    };
  }
}

export function requireAdmin(authResult) {
  if (!authResult?.ok) return authResult;

  if (!["super_admin", "admin"].includes(authResult.user?.role)) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Forbidden (admin or super_admin only)" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

export function requireSuperAdmin(authResult) {
  if (!authResult?.ok) return authResult;

  if (authResult.user?.role !== "super_admin") {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Forbidden (super_admin only)" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}
