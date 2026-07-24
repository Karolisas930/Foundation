# Database Audit & Migration Plan

_Generated 2026-07-22. Authoritative reference for building the schema from scratch._

---

## 1. Tables referenced by the codebase

Grepped from `.from("<table>")` across `src/`.

| Table                    | Used by (examples)                                                                                                                    | Notes                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `profiles`               | `useUser`, `HandymanProfilePage`, `PayoutModal`, `finalizeRegistration`, `job-feed.functions`, `network-chat.functions`, `dev-seeder` | Extends `auth.users(id)`. Mirror of user fields + matching prefs + bank details.    |
| `user_roles`             | `dev-seeder`, `network-chat.functions`                                                                                                | Separate table (never on profiles). Enum `app_role`. `has_role()` security-definer. |
| `categories`             | — (spec only)                                                                                                                         | Not yet referenced. Included per product spec (trade taxonomy).                     |
| `contractors`            | — (spec only)                                                                                                                         | Not yet referenced. 1:1 with profiles for contractor-specific fields.               |
| `homeowners`             | — (spec only)                                                                                                                         | Not yet referenced. 1:1 with profiles for homeowner-specific fields.                |
| `services`               | `dev-seeder`                                                                                                                          | Provider-owned service catalog rows.                                                |
| `team_members`           | `team-store`, `useTeamPermissions`, `useStaffHoursData`                                                                               | Owner-scoped roster + permission flags + `hourly_rate`.                             |
| `jobs`                   | `HomeownerForm`, `job-feed.functions`, `match.functions`, `matches.functions`, `dev-seeder`                                           | Homeowner-posted job. Owner = `auth.users(id)`.                                     |
| `matches`                | `match.functions`, `matches.functions`, `MatchUnlockInbox`, `PendingMatchesStrip`, `dev-seeder`                                       | (job_id, contractor_id) unique. Contact reveal via `match_unlocked`.                |
| `match_invoices`         | `match-invoices.functions`                                                                                                            | Platform-fee ledger row.                                                            |
| `bookings`               | `matches.functions`, `dev-seeder`                                                                                                     | Confirmed job assignment.                                                           |
| `messages`               | `dev-seeder`                                                                                                                          | Per-booking chat.                                                                   |
| `reviews`                | `dev-seeder`                                                                                                                          | Post-booking rating.                                                                |
| `quotes`                 | — (spec only)                                                                                                                         | Not yet referenced. Contractor-sent quote on a job.                                 |
| `invoices`               | `useVoiceInvoice`, `InvoiceHistoryList`, `FinancialToolsPage`, `DownloadsReportsPage`                                                 | Owner-scoped issued invoices.                                                       |
| `payments`               | — (spec only)                                                                                                                         | Not yet referenced. Off-platform + future gateway records.                          |
| `clients`                | `VoiceToInvoiceConnected`                                                                                                             | Contractor's own address book.                                                      |
| `receipts`               | `ReceiptsPanel`, `FinancialToolsPage`, `DownloadsReportsPage`                                                                         | Storage-linked expense receipts.                                                    |
| `trips`                  | `TripsPanel`, `FinancialToolsPage`, `DownloadsReportsPage`                                                                            | Km log for tax deduction.                                                           |
| `finanz_settings`        | `FinancialToolsPage`, `DownloadsReportsPage`, `useTaxData`                                                                            | Per-user reserve % + km rate.                                                       |
| `staff_hours`            | `TeamManagement`, `useStaffHoursData`, `staff-activity`, `DownloadsReportsPage`                                                       | Owner-scoped time entries.                                                          |
| `staff_document_logs`    | `SecureDocumentUpload`, `TradeComplianceChecklist`                                                                                    | Storage-linked staff photo/PDF audit log.                                           |
| `notifications`          | `staff-activity`, `NotificationsList`, `useUnreadNotifications`, `match.functions`                                                    | Per-recipient feed.                                                                 |
| `profile_reports`        | `profile-reports.functions`, `lead-gate.functions`                                                                                    | Abuse reports on a profile.                                                         |
| `network_threads`        | `network-chat.functions`                                                                                                              | Contractor↔contractor 1:1 or group threads.                                         |
| `network_thread_members` | `network-chat.functions`                                                                                                              | Join table (thread × user).                                                         |
| `network_messages`       | `network-chat.functions`                                                                                                              | Messages in a network thread.                                                       |
| `calendar_events`        | `matches.functions`                                                                                                                   | Owner-scoped scheduled entries.                                                     |
| `verifications`          | `verification-ocr.functions`, `finanz-ocr.functions`                                                                                  | Uploaded credential doc + OCR JSON.                                                 |
| `portfolios`             | — (spec only)                                                                                                                         | Not yet referenced. Contractor showcase items.                                      |

**Total: 26 tables** (20 referenced in code + 6 spec-only that you asked for).

---

## 2. Relationship / dependency graph

```text
auth.users (Supabase-managed)
  ├── profiles (id PK = auth.users.id)                  [FOUNDATION]
  │     ├── contractors (user_id FK → profiles)         [FOUNDATION]
  │     ├── homeowners  (user_id FK → profiles)         [FOUNDATION]
  │     ├── user_roles  (user_id FK → auth.users)       [FOUNDATION]
  │     ├── team_members (owner_id, member_user_id)     [FOUNDATION]
  │     ├── verifications (user_id)
  │     ├── profile_reports (reporter_id, reported_id)
  │     ├── notifications (recipient_id, sender_id)
  │     ├── network_threads (created_by)
  │     │     └── network_thread_members (thread_id, user_id)
  │     │           └── network_messages (thread_id, sender_id)
  │     ├── clients (owner_id)                          — contractor address book
  │     │     └── invoices (client_id)
  │     ├── invoices (owner_id, client_id?)
  │     ├── receipts (owner_id)
  │     ├── trips (owner_id)
  │     ├── finanz_settings (user_id PK)
  │     ├── staff_hours (owner_id, member_id → team_members)
  │     ├── staff_document_logs (owner_id, member_id)
  │     ├── calendar_events (owner_id)
  │     └── portfolios (owner_id)                       — contractor showcase
  │
  ├── categories (parent_id? → categories)              [FOUNDATION]
  │
  ├── services (provider_id → auth.users, category_id? → categories)  [FOUNDATION]
  │
  └── jobs (owner_id → auth.users)
        ├── quotes (job_id, contractor_id)
        ├── matches (job_id, client_id, contractor_id) UNIQUE (job_id, contractor_id)
        │     ├── match_invoices (match_id, contractor_id)
        │     └── bookings (match_id, job_id, service_id?, client_id, provider_id)
        │           ├── messages (booking_id, sender_id, recipient_id)
        │           ├── payments (booking_id, payer_id, payee_id)
        │           └── reviews (booking_id, job_id, client_id, provider_id)
```

Creation order is a topological sort of this graph: nothing references a table
that hasn't been created above it.

---

## 3. Existing migrations (as of this audit)

| #   | File                             | Status                                                 | Verdict                                                                                                                                     |
| --- | -------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `20260720100704_e40010fe-…​.sql` | Not applied to DB                                      | **KEEP** — original profiles + `handle_new_user` trigger. Foundation ordering already correct.                                              |
| 2   | `20260720100725_860968d1-…​.sql` | Not applied                                            | **KEEP** — revokes on trigger functions.                                                                                                    |
| 3   | `20260721125746_1f1135af-…​.sql` | Not applied                                            | **OBSOLETE (duplicate)** — verbatim re-apply of #1. Delete after DB is built.                                                               |
| 4   | `20260721205851_39ce3cb8-…​.sql` | Not applied                                            | **OBSOLETE (duplicate)** — combined re-apply of #1+#2. Delete.                                                                              |
| 5   | `20260722083313_71e412e3-…​.sql` | Not applied (no-op — `team_members` doesn't exist yet) | **OBSOLETE** — superseded by the new `foundation_actors` migration which creates `team_members` with `hourly_rate` already present. Delete. |
| 6   | `20260722085943_7edd25b4-…​.sql` | Not applied (no-op — `team_members` doesn't exist yet) | **OBSOLETE** — RLS policies for `team_members` are now in `foundation_actors`. Delete.                                                      |

**Files 3–6 are marked OBSOLETE but not deleted per instruction.** Once the
new migrations run cleanly against a fresh DB, remove them from
`supabase/migrations/`.

---

## 4. New migrations (this audit)

All new files are **idempotent** (`CREATE … IF NOT EXISTS`, `ADD COLUMN IF NOT
EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS … / CREATE POLICY …`).
They're safe to re-run against a partially populated DB, and safe to run
after the legacy duplicate profile migrations have already created the
minimal `profiles` table.

### Recommended apply order

| #   | File                                           | Creates                                                                                                                                                                                           |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `20260722100000_foundation_profiles_roles.sql` | ext (`pgcrypto`), enums (`app_role`), `set_updated_at()`, `profiles` (all columns), `handle_new_user()` trigger, `user_roles`, `has_role()`, `is_verified_contractor()`, `categories`, `services` |
| 2   | `20260722100100_foundation_actors.sql`         | `contractors`, `homeowners`, `team_members` (with all permission cols + `hourly_rate`)                                                                                                            |
| 3   | `20260722100200_jobs_matches.sql`              | `jobs`, `matches` (+ triggers), `match_invoices`, `calendar_events`, `match_job_to_worker()`, `get_match_contact()`, `get_match_bank_details()`                                                   |
| 4   | `20260722100300_bookings_reviews_messages.sql` | `quotes`, `bookings`, `messages`, `reviews`                                                                                                                                                       |
| 5   | `20260722100400_finance.sql`                   | `clients`, `invoices`, `receipts`, `trips`, `finanz_settings`, `payments`                                                                                                                         |
| 6   | `20260722100500_staff_docs.sql`                | `staff_hours`, `staff_document_logs`                                                                                                                                                              |
| 7   | `20260722100600_notifications_reports.sql`     | `notifications`, `profile_reports`                                                                                                                                                                |
| 8   | `20260722100700_network_chat.sql`              | `network_threads`, `network_thread_members`, `network_messages`                                                                                                                                   |
| 9   | `20260722100800_verifications_portfolios.sql`  | `verifications`, `portfolios`, private storage buckets `verifications`, `receipts`, `staff-documents`                                                                                             |

Every table has:

- `owner_id` / equivalent scoped FK to `auth.users(id)` with `ON DELETE CASCADE`.
- `created_at timestamptz DEFAULT now()` and — where mutable — `updated_at`
  driven by the `set_updated_at()` trigger.
- `GRANT` statements before `ENABLE ROW LEVEL SECURITY` (per Supabase rule).
- RLS policies scoped to `auth.uid()` (never role checks against the same
  table — routed through `has_role()` where needed).
- `service_role` retains full access for edge functions and admin flows.

---

## 5. Post-apply verification

Run after all 9 new migrations succeed:

```sql
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;
```

Expected 26 rows:

```
bookings, calendar_events, categories, clients, contractors, finanz_settings,
homeowners, invoices, jobs, match_invoices, matches, messages, network_messages,
network_thread_members, network_threads, notifications, payments, portfolios,
profile_reports, profiles, quotes, receipts, reviews, services, staff_document_logs,
staff_hours, team_members, trips, user_roles, verifications
```

Then re-run the audit block in `PRODUCT_BLUEPRINT.md §0a` to update the
"applied migrations" tracker.

---

## 6. Missing / gap summary

| Category            | Item                                                                                                                                            | Action                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Existing tables     | —                                                                                                                                               | Zero (`public` schema is empty — see PRODUCT_BLUEPRINT §0a)    |
| Missing tables      | All 26 above                                                                                                                                    | Created by the 9 new migrations                                |
| Existing migrations | 6 files (2 keep + 4 obsolete)                                                                                                                   | See §3                                                         |
| Missing migrations  | Everything after `profiles`                                                                                                                     | Delivered as 9 files (§4)                                      |
| Storage buckets     | `verifications`, `receipts`, `staff-documents`                                                                                                  | Created in migration #9 with owner-scoped policies             |
| RPC functions       | `has_role`, `is_verified_contractor`, `match_job_to_worker`, `get_match_contact`, `get_match_bank_details`, `handle_new_user`, `set_updated_at` | Created inline in the migrations that own the underlying table |
