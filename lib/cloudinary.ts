// Cloudinary SDK (ensure you install `cloudinary` package)
import { v2 as cloudinary, type UploadApiResponse, type UploadApiOptions } from "cloudinary"

/**
 * Cloudinary configuration helper.
 * Requires CLOUDINARY_URL in the environment (cloudinary://api_key:api_secret@cloud_name)
 */
export function getCloudinary() {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL is not configured in the environment")
  }
  // SDK will read CLOUDINARY_URL automatically; we ensure secure delivery
  cloudinary.config({ secure: true })
  return cloudinary
}

export type UploadResult = UploadApiResponse & { thumbnailUrl?: string }

/**
 * Upload a file buffer to Cloudinary using upload_stream.
 */
export async function uploadBuffer(
  buffer: Buffer,
  options: UploadApiOptions & { folder?: string; resource_type?: "image" | "video" | "raw" | "auto" } = {}
): Promise<UploadResult> {
  const cld = getCloudinary()
  const { folder, resource_type = "auto", ...rest } = options || {}

  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      { resource_type, folder, use_filename: true, unique_filename: true, overwrite: false, ...rest },
      (error: any, result: UploadApiResponse | undefined) => {
        if (error || !result) return reject(error || new Error("Cloudinary upload failed"))

        // If it is an image, generate a small thumbnail URL for previews
        let thumbnailUrl: string | undefined
        if (result.resource_type === "image") {
          try {
            thumbnailUrl = cld.url(result.public_id, {
              resource_type: "image",
              type: result.type as any,
              transformation: [{ width: 320, height: 240, crop: "fill", gravity: "auto" }],
              secure: true,
              format: result.format,
            })
          } catch {
            // ignore
          }
        }

        resolve({ ...(result as UploadApiResponse), thumbnailUrl })
      }
    )

    stream.end(buffer)
  })
}

export async function destroyAsset(publicId: string, resourceType: "image" | "video" | "raw" | "auto" = "auto") {
  const cld = getCloudinary()
  return cld.uploader.destroy(publicId, { resource_type: resourceType })
}
