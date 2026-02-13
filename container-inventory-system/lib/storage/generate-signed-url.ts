import { getStorageClient, getBucketName } from "./gcs-client";

export async function generateSignedUrl(gcsPath: string): Promise<string> {
  // For local dev uploads, return path directly
  if (gcsPath.startsWith("/uploads/")) {
    return gcsPath;
  }

  if (!gcsPath.startsWith("gs://")) {
    return gcsPath;
  }

  const storage = getStorageClient();
  const bucketName = getBucketName();
  const fileName = gcsPath.replace(`gs://${bucketName}/`, "");
  const file = storage.bucket(bucketName).file(fileName);

  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
}
