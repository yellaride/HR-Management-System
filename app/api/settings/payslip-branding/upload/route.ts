import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import {
  ensureCloudinaryConfigured,
  getCloudinaryErrorMessage,
  uploadPayslipBrandingAsset,
} from "@/lib/cloudinary";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    ensureCloudinaryConfigured();

    const formData = await request.formData();
    const file = formData.get("file");
    const assetType = formData.get("type");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    if (assetType !== "signature" && assetType !== "stamp" && assetType !== "logo") {
      return NextResponse.json({ error: "Invalid asset type." }, { status: 400 });
    }

    const maxSize =
      assetType === "logo" ? 3 * 1024 * 1024 : MAX_FILE_SIZE_BYTES;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: assetType === "logo" ? "Logo must be 3 MB or smaller." : "Image must be 2 MB or smaller." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const secureUrl = await uploadPayslipBrandingAsset(buffer);

    return NextResponse.json({ secure_url: secureUrl, type: assetType }, { status: 200 });
  } catch (error) {
    console.error("Payslip branding upload failed:", error);
    return NextResponse.json({ error: getCloudinaryErrorMessage(error) }, { status: 500 });
  }
}
