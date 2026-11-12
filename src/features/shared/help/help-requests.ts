/**
 * Help Requests — local store for tradesperson collaboration posts.
 *
 * A "help request" is a tradesperson-posted job aimed at other self-employed
 * trades: backup on a job, partner needed, equipment sharing, etc. Persisted
 * in the shared `help_requests` table so every signed-in pro sees them.
 */

export type HelpRequestKind = "backup" | "partner" | "equipment" | "other";

export interface HelpRequest {
  id: string;
  title: string;
  kind: HelpRequestKind;
  trade: string;
  city: string;
  startDate?: string;
  durationDays?: number;
  description: string;
  contactName: string;
  contactPhone?: string;
  createdAt: string;
}

const EVENT = "hw:help_requests_update";

export const HELP_REQUEST_EVENT = EVENT;

/* In-memory cache filled from the shared `help_requests` table. */
let cache: HelpRequest[] = [];
let loading = false;

type Row = {
  id: string;
  title: string;
  kind: HelpRequestKind;
  trade: string | null;
  city: string | null;
  start_date: string | null;
  duration_days: number | null;
  description: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
};

function fromRow(r: Row): HelpRequest {
  return {
    id: r.id,
    title: r.title,
    kind: r.kind,
    trade: r.trade ?? "",
    city: r.city ?? "",
    startDate: r.start_date ?? undefined,
    durationDays: r.duration_days ?? undefined,
    description: r.description ?? "",
    contactName: r.contact_name ?? "",
    contactPhone: r.contact_phone ?? undefined,
    createdAt: r.created_at,
  };
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

async function db() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase as unknown as { from: (t: string) => any; auth: typeof supabase.auth }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Reload the shared board from the database (silently skipped without one). */
export async function refreshHelpRequests(): Promise<void> {
  if (typeof window === "undefined" || loading) return;
  loading = true;
  try {
    const client = await db();
    const { data, error } = await client
      .from("help_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && Array.isArray(data)) {
      cache = (data as Row[]).map(fromRow);
      emit();
    }
  } catch {
    /* no database in this environment */
  } finally {
    loading = false;
  }
}

export function listHelpRequests(): HelpRequest[] {
  return cache;
}

export async function addHelpRequest(
  input: Omit<HelpRequest, "id" | "createdAt">,
): Promise<HelpRequest> {
  const client = await db();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Please sign in to post a help request.");
  const { data, error } = await client
    .from("help_requests")
    .insert({
      owner_id: auth.user.id,
      title: input.title,
      kind: input.kind,
      trade: input.trade,
      city: input.city,
      start_date: input.startDate || null,
      duration_days: input.durationDays ?? null,
      description: input.description,
      contact_name: input.contactName,
      contact_phone: input.contactPhone || null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not save the request.");
  const next = fromRow(data as Row);
  cache = [next, ...cache.filter((r) => r.id !== next.id)];
  emit();
  return next;
}

export function subscribeHelpRequests(cb: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  void refreshHelpRequests();
  return () => window.removeEventListener(EVENT, handler);
}

export const HELP_REQUEST_KINDS: { value: HelpRequestKind; label: string }[] = [
  { value: "backup", label: "Backup for a job" },
  { value: "partner", label: "Partner needed" },
  { value: "equipment", label: "Equipment sharing" },
  { value: "other", label: "Other" },
];
