import { AwsClient } from "aws4fetch";

/** Cloudflare R2 (S3-compatible) helper. Reads env inside each call. */
export function getR2() {
  const accountId = process.env["R2_ACCOUNT_ID"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
  const bucket = process.env["R2_BUCKET_NAME"];
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Cloudflare R2 is not configured (R2_* env vars missing)");
  }
  const client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
  const base = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;
  return {
    async put(key: string, body: ArrayBuffer, contentType: string) {
      const res = await client.fetch(`${base}/${key}`, {
        method: "PUT",
        body,
        headers: { "Content-Type": contentType },
      });
      if (!res.ok) throw new Error(`R2 upload failed [${res.status}]: ${await res.text()}`);
    },
    async get(key: string) {
      return client.fetch(`${base}/${key}`);
    },
  };
}
