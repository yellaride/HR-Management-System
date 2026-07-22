import { v2 as cloudinary } from "cloudinary";

type CloudinaryApiError = {
  message?: string;
  http_code?: number;
};

export function getCloudinaryErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as CloudinaryApiError).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return "Cloudinary upload failed";
}

export function ensureCloudinaryConfigured(): void {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();

  if (cloudinaryUrl) {
    cloudinary.config(true);
    cloudinary.config({ secure: true });
    const configured = cloudinary.config();
    if (!configured.cloud_name || !configured.api_key || !configured.api_secret) {
      throw new Error("Invalid CLOUDINARY_URL — copy the full URL from Cloudinary dashboard.");
    }
    return;
  }

  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
}

export function getEmployeePhotoFolder(): string {
  return process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "hr-system/employees";
}

export async function uploadEmployeePhoto(buffer: Buffer): Promise<string> {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: getEmployeePhotoFolder(),
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url) {
          reject(new Error("Cloudinary upload succeeded but no secure_url was returned"));
          return;
        }
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

export { cloudinary };
