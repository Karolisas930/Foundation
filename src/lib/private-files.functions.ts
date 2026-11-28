import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = /^(image\/[a-z0-9.+-]+|application\/pdf)$/;
const Bucket = z.enum(["receipts", "verifications", "staff-documents"]);

export const uploadPrivateFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Error("Expected form data");
    const file = d.get("file");
    if (!(file instanceof File)) throw new Error("File missing");
    return { file, ...z.object({ bucket: Bucket, path: z.string() }).parse({ bucket: d.get("bucket"), path: d.get("path") }) };
  })
  .handler(async ({ data, context }) => {
    const { getR2 } = await import("./r2.server");
    const { isOwnPath, r2Key } = await import("./private-files.server");
    if (!isOwnPath(data.path, context.userId)) throw new Error("Not allowed");
    const type = data.file.type.split(";")[0] || "application/octet-stream";
    if (!ALLOWED.test(type)) throw new Error("Only images or PDF documents are allowed");
    if (data.file.size > MAX_BYTES) throw new Error("File larger than 15 MB");
    await getR2().put(r2Key(data.bucket, data.path), await data.file.arrayBuffer(), type);
    return { path: data.path };
  });

const Ref = z.object({ bucket: Bucket, path: z.string() });

export const getPrivateFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Ref.parse(d))
  .handler(async ({ data, context }) => {
    const { getR2 } = await import("./r2.server");
    const { isOwnPath, r2Key } = await import("./private-files.server");
    if (!isOwnPath(data.path, context.userId)) throw new Error("Not allowed");
    return { url: await getR2().signedUrl(r2Key(data.bucket, data.path)) };
  });

export const deletePrivateFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Ref.parse(d))
  .handler(async ({ data, context }) => {
    const { getR2 } = await import("./r2.server");
    const { isOwnPath, r2Key } = await import("./private-files.server");
    if (!isOwnPath(data.path, context.userId)) throw new Error("Not allowed");
    await getR2().remove(r2Key(data.bucket, data.path));
    return { ok: true };
  });
