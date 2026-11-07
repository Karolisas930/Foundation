/**
 * Admin user directory — only callers with the `admin` role (user_roles table)
 * can list every account with its profile details.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminUserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  companyName: string | null;
  accountType: string | null;
  phone: string | null;
  city: string | null;
  postalCode: string | null;
  trades: string[];
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) return { allowed: false as const, users: [] as AdminUserRow[] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (authErr) throw new Error(authErr.message);

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, company_name, account_type, phone, city, postal_code, trades");
    if (pErr) throw new Error(pErr.message);
    type P = {
      id: string; full_name: string | null; company_name: string | null; account_type: string | null;
      phone: string | null; city: string | null; postal_code: string | null; trades: string[] | null;
    };
    const byId = new Map<string, P>(((profiles ?? []) as P[]).map((p) => [p.id, p]));

    const users: AdminUserRow[] = authData.users.map((u) => {
      const p = byId.get(u.id);
      const m = (u.user_metadata ?? {}) as Record<string, unknown>;
      const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
      return {
        id: u.id,
        email: u.email ?? null,
        fullName: p?.full_name ?? s(m.full_name),
        companyName: p?.company_name ?? s(m.business_name) ?? s(m.company_name),
        accountType: p?.account_type ?? s(m.account_type),
        phone: p?.phone ?? s(m.phone),
        city: p?.city ?? s(m.city),
        postalCode: p?.postal_code ?? s(m.postal_code),
        trades: p?.trades ?? [],
        createdAt: u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
        emailConfirmed: Boolean(u.email_confirmed_at),
      };
    });
    users.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return { allowed: true as const, users };
  });
