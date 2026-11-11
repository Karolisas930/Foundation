import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { untyped } from "@/lib/untyped-db";

/** Contractor sends a question about a job; it lands in the homeowner's inbox. */
export const sendJobQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ jobId: z.string().uuid(), body: z.string().trim().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const db = untyped(context.supabase);
    const { data: job, error: jobErr } = await db
      .from("jobs")
      .select("owner_id")
      .eq("id", data.jobId)
      .maybeSingle();
    if (jobErr) throw new Error(jobErr.message);
    const ownerId = (job as { owner_id?: string } | null)?.owner_id;
    if (!ownerId) throw new Error("Job not found");
    if (ownerId === context.userId) throw new Error("You can't message your own job");
    const row = { sender_id: context.userId, recipient_id: ownerId, body: data.body };
    let { error } = await db.from("messages").insert({ ...row, job_id: data.jobId });
    if (error && /job_id/i.test(error.message)) ({ error } = await db.from("messages").insert(row));
    if (error) throw new Error(error.message);
    return { ok: true };
  });
