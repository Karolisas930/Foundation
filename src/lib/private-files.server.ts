/** Private user files (receipts, verifications, staff documents) in Cloudflare R2. */
export const PRIVATE_BUCKETS = ["receipts", "verifications", "staff-documents"] as const;
export type PrivateBucket = (typeof PRIVATE_BUCKETS)[number];

const PATH_RE = /^[0-9a-f-]{36}(\/[A-Za-z0-9._-]{1,140}){1,3}$/;

/** A path belongs to a user when its first folder is their id. */
export function isOwnPath(path: string, userId: string) {
  return PATH_RE.test(path) && !path.includes("..") && path.split("/")[0] === userId;
}

export const r2Key = (bucket: PrivateBucket, path: string) => `private/${bucket}/${path}`;
