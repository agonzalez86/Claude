import { getStorageClient, getBucketName } from "./gcs-client";
import { v4 as uuid } from "crypto";

type PdfCategory = "facturas" | "pedimentos" | "sales-invoices" | "photos";

export async function uploadPdf(
  fileBuffer: Buffer,
  originalName: string,
  category: PdfCategory
): Promise<string> {
  // In development without GCS, store as data URL placeholder
  if (!process.env.GCS_PROJECT_ID || process.env.NODE_ENV === "development") {
    // Store locally in /tmp for development
    const fs = await import("fs");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads", category);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${originalName}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);

    return `/uploads/${category}/${fileName}`;
  }

  const storage = getStorageClient();
  const bucket = storage.bucket(getBucketName());
  const fileName = `${category}/${Date.now()}-${originalName}`;
  const file = bucket.file(fileName);

  await file.save(fileBuffer, {
    metadata: {
      contentType: "application/pdf",
    },
  });

  return `gs://${getBucketName()}/${fileName}`;
}

export async function uploadPhoto(
  fileBuffer: Buffer,
  originalName: string
): Promise<string> {
  return uploadPdf(fileBuffer, originalName, "photos");
}
