// src/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function assertCloudinaryEnv() {
  const ok =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;
  if (!ok) throw new Error("Cloudinary env missing (CLOUDINARY_*)");
}

/**
 * Upload a Buffer (best for Next.js route handlers via req.formData()).
 * @param {Buffer} buffer
 * @param {object} opts
 * @param {string} opts.folder
 * @param {string} opts.public_id (optional)
 * @param {string} opts.resource_type ("auto" default)
 */
export const uploadBufferToCloudinary = async (
  buffer,
  { folder = "ecommerce_uploads", public_id, resource_type = "auto" } = {}
) => {
  assertCloudinaryEnv();

  return new Promise((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id, resource_type },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary Upload Error:", error);
          resolve({ success: false, error });
          return;
        }
        resolve({
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
          type: result.resource_type,
        });
      }
    );

    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return { success: true, result: "no_publicId" };
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return { success: true, result };
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return { success: false, error };
  }
};

export default cloudinary;
