/**
 * The generated Supabase `Database` types are regenerated from the hosted
 * schema and therefore don't know about tables added through the manual
 * migration in `db/manual-migrations/` yet (properties, job_bids,
 * messages.job_id). This helper narrows a typed client down to an untyped
 * query builder for exactly those tables, so we don't have to hand-edit the
 * generated types file.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type UntypedQuery = any;

export function untyped(client: unknown): {
  from: (table: string) => UntypedQuery;
  rpc: (fn: string, args?: Record<string, unknown>) => UntypedQuery;
} {
  return client as any;
}
