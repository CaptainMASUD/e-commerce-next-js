export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConfig";
import Banner from "@/models/banner.model";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "@/utils/cloudinary";

function isMultipart(req) {
  const ct = req.headers.get("content-type") || "";
  return ct.includes("multipart/form-data");
}

function parseNullableDate(value) {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "INVALID_DATE" : d;
}

function parseBoolean(value, fallback = undefined) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value) === "true";
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || "").trim());
}

function normalizeImagePayload(image = {}) {
  return {
    url: String(image?.url || "").trim(),
    publicId: String(image?.publicId || "").trim(),
    alt: String(image?.alt || "").trim(),
  };
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) return undefined;
  const v = String(value).trim();
  return v ? v : undefined;
}

async function getNewArrivalBannerOr404(id) {
  const doc = await Banner.findOne({
    _id: id,
    ownerType: "NewArrival",
  });

  if (!doc) {
    return null;
  }

  return doc;
}

function serializeBanner(doc) {
  if (!doc) return null;
  return {
    ...doc,
    id: String(doc._id),
  };
}

export async function GET(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid banner id" }, { status: 400 });
    }

    const doc = await Banner.findOne({
      _id: id,
      ownerType: "NewArrival",
    }).lean();

    if (!doc) {
      return NextResponse.json({ error: "New arrival banner not found" }, { status: 404 });
    }

    return NextResponse.json({ item: serializeBanner(doc) }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to fetch new arrival banner",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid banner id" }, { status: 400 });
    }

    const doc = await getNewArrivalBannerOr404(id);
    if (!doc) {
      return NextResponse.json({ error: "New arrival banner not found" }, { status: 404 });
    }

    // multipart update
    if (isMultipart(req)) {
      const form = await req.formData();

      const title = form.get("title");
      const subtitle = form.get("subtitle");
      const buttonText = form.get("buttonText");
      const buttonLink = form.get("buttonLink");
      const sortOrder = form.get("sortOrder");
      const isActive = form.get("isActive");
      const alt = form.get("alt");
      const startsAt = form.get("startsAt");
      const endsAt = form.get("endsAt");
      const file = form.get("image");

      if (title !== null) doc.title = normalizeOptionalString(title);
      if (subtitle !== null) doc.subtitle = normalizeOptionalString(subtitle);
      if (buttonText !== null) doc.buttonText = normalizeOptionalString(buttonText);
      if (buttonLink !== null) doc.buttonLink = normalizeOptionalString(buttonLink);
      if (sortOrder !== null) doc.sortOrder = Number(sortOrder) || 0;

      const parsedIsActive = parseBoolean(isActive, undefined);
      if (typeof parsedIsActive === "boolean") doc.isActive = parsedIsActive;

      const parsedStartsAt = parseNullableDate(startsAt);
      const parsedEndsAt = parseNullableDate(endsAt);

      if (parsedStartsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
      }

      if (parsedEndsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
      }

      if (startsAt !== null) doc.startsAt = parsedStartsAt;
      if (endsAt !== null) doc.endsAt = parsedEndsAt;

      if (alt !== null) {
        doc.image = {
          ...doc.image?.toObject?.(),
          alt: String(alt).trim(),
        };
      }

      if (file && typeof file.arrayBuffer === "function") {
        const buffer = Buffer.from(await file.arrayBuffer());

        const up = await uploadBufferToCloudinary(buffer, {
          folder: "banners/new-arrivals",
          resource_type: "image",
        });

        if (!up?.success) {
          return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
        }

        const oldPublicId = String(doc.image?.publicId || "").trim();

        doc.image = {
          url: up.url,
          publicId: up.publicId,
          alt: alt !== null ? String(alt).trim() : String(doc.image?.alt || "").trim(),
        };

        if (oldPublicId) {
          try {
            await deleteFromCloudinary(oldPublicId, "image");
          } catch {}
        }
      }

      doc.ownerType = "NewArrival";
      doc.ownerId = null;
      doc.subcategoryId = null;
      doc.updatedBy = auth.user.id;

      await doc.save();

      return NextResponse.json({ item: doc.toJSON() }, { status: 200 });
    }

    // JSON update
    const body = await req.json();

    if ("title" in body) doc.title = normalizeOptionalString(body.title);
    if ("subtitle" in body) doc.subtitle = normalizeOptionalString(body.subtitle);
    if ("buttonText" in body) doc.buttonText = normalizeOptionalString(body.buttonText);
    if ("buttonLink" in body) doc.buttonLink = normalizeOptionalString(body.buttonLink);
    if ("sortOrder" in body) doc.sortOrder = Number(body.sortOrder) || 0;
    if ("isActive" in body) doc.isActive = Boolean(body.isActive);

    if ("startsAt" in body) {
      const parsedStartsAt = parseNullableDate(body.startsAt);
      if (parsedStartsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
      }
      doc.startsAt = parsedStartsAt;
    }

    if ("endsAt" in body) {
      const parsedEndsAt = parseNullableDate(body.endsAt);
      if (parsedEndsAt === "INVALID_DATE") {
        return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
      }
      doc.endsAt = parsedEndsAt;
    }

    if ("image" in body) {
      const nextImage = normalizeImagePayload(body.image);

      if (!nextImage.url) {
        return NextResponse.json({ error: "Banner image.url is required" }, { status: 400 });
      }

      doc.image = nextImage;
    }

    doc.ownerType = "NewArrival";
    doc.ownerId = null;
    doc.subcategoryId = null;
    doc.updatedBy = auth.user.id;

    await doc.save();

    return NextResponse.json({ item: doc.toJSON() }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to update new arrival banner",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid banner id" }, { status: 400 });
    }

    const doc = await getNewArrivalBannerOr404(id);
    if (!doc) {
      return NextResponse.json({ error: "New arrival banner not found" }, { status: 404 });
    }

    const publicId = String(doc.image?.publicId || "").trim();

    await Banner.deleteOne({ _id: doc._id, ownerType: "NewArrival" });

    if (publicId) {
      try {
        await deleteFromCloudinary(publicId, "image");
      } catch {}
    }

    return NextResponse.json(
      { message: "New arrival banner deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to delete new arrival banner",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}