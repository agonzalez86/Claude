import { Storage } from "@google-cloud/storage";

let storage: Storage | null = null;

export function getStorageClient(): Storage {
  if (!storage) {
    const credentials = process.env.GCS_CREDENTIALS
      ? JSON.parse(process.env.GCS_CREDENTIALS)
      : undefined;

    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials,
    });
  }
  return storage;
}

export function getBucketName(): string {
  return process.env.GCS_BUCKET_NAME || "latambox-container-pdfs";
}
