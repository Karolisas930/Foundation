# Phase SQL — apply after connecting Supabase

These files are pure SQL and are **not** in `supabase/migrations/` yet, so
they will not run until you connect Lovable Cloud / your own Supabase and
opt in.

## How to apply

Two options once you have connected Supabase:

1. **Convert to migrations** — copy each file into
   `supabase/migrations/<timestamp>_<name>.sql` (any monotonically
   increasing timestamp works). The Supabase CLI will then run them in
   order like the rest.
2. **Or paste into the SQL editor** in the Supabase dashboard, in the
   order below.

## Order

| File                            | Phase   | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01_missing_tables_and_rls.sql` | Phase 1 | Creates the 11 tables the frontend queries but which the current schema is missing (`clients`, `invoices`, `receipts`, `trips`, `finanz_settings`, `staff_hours`, `staff_document_logs`, `verifications`, `calendar_events`, `match_invoices`, `profile_reports`). Each is created with explicit `GRANT`s + owner-scoped RLS policies keyed on `auth.uid()`. `notifications` is intentionally not recreated — it already exists in migration `20260723145205`. |
| `07_certificate_templates.sql`  | Phase 7 | Adds `certificate_templates` + `certificate_issuances` tables so a contractor can upload a template once and re-issue per client with auto-filled fields (see `template-merge.ts`). Owner-scoped RLS.                                                                                                                                                                                                                                                          |

## Phases that need code changes rather than SQL

The following phases either require no schema change or the schema already
exists — see `docs/blueprint/PRODUCT_BLUEPRINT.md` for status:

- **Phase 2** — already resolved in code: `searchContractors` reads
  `profiles.account_type` (see `src/lib/network-chat.functions.ts` line
  114 comment: "One query, no user_roles roundtrip"). No SQL needed.
- **Phase 3** — needs an `INSERT INTO notifications` in the matching
  engine when a priority lead is dispatched. Table already exists.
- **Phase 5** — the `location_lat/lng/accuracy_m` columns are included in
  `staff_hours` here (Phase 1 SQL) so the `useLocation` hook can persist
  a captured fix.
- **Phase 6 / 8 / 9 / 10 / 11** — code-only (dynamic route,
  outbound-email wiring, OCR categorization, verifications-backed gate,
  PDF/XLSX exporters).
