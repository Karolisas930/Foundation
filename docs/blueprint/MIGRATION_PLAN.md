# Migration Plan — Current → Target Blueprint

Ordered **least-conflict first**. Each phase is safe to complete and commit
independently. Import paths must be updated after every move
(`rg -l "old/path"` then search-replace).

---

## SQL migration tracker — `supabase/migrations/` vs live DB

Verification method: `supabase_migrations.schema_migrations` on the connected
Lovable Cloud project. Re-run after every apply and update the Applied column.

Status legend: ✅ applied · ❌ not applied · ❔ unable to verify (no DB access this session)

| #   | File                             | Purpose                                                                                                                                                           | Applied?                                                                                 |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | `20260720100704_e40010fe-…​.sql` | Create `public.profiles` + grants + RLS (`profiles_select_own`, `profiles_manage_own`) + `set_updated_at()` trigger + `handle_new_user()` trigger on `auth.users` | ❌ not applied — `public.profiles` does not exist on the connected DB (audit 2026-07-22) |
| 2   | `20260720100725_860968d1-…​.sql` | `REVOKE EXECUTE` on `handle_new_user()` / `set_updated_at()` from PUBLIC/anon/authenticated                                                                       | ❌ not applied — functions don't exist yet (depends on #1)                               |
| 3   | `20260721125746_1f1135af-…​.sql` | Re-apply of #1 (idempotent `IF NOT EXISTS` / `OR REPLACE`)                                                                                                        | ❌ not applied                                                                           |
| 4   | `20260721205851_39ce3cb8-…​.sql` | Re-apply of #1 + #2 combined (idempotent)                                                                                                                         | ❌ not applied                                                                           |
| 5   | `20260722083313_71e412e3-…​.sql` | `ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS hourly_rate numeric` (guarded by `to_regclass`)                                                         | ❌ not applied — no-op regardless because `public.team_members` does not exist           |
| 6   | `20260722085943_7edd25b4-…​.sql` | Enable RLS on `team_members` + 4 owner/self policies (guarded by `to_regclass`)                                                                                   | ❌ not applied — no-op regardless because `public.team_members` does not exist           |

**Repo vs DB summary:** The DB is **behind the repo**. The `public` schema is
empty on the connected project (only `auth`, `storage`, `extensions`, `vault`,
`supabase_migrations` populated — see PRODUCT_BLUEPRINT.md §0a). None of the
six migration files in `supabase/migrations/` have been executed. Files 5 and
6 are additionally shaped as no-ops until `public.team_members` exists (they
guard on `to_regclass`), so they'll silently do nothing unless the base
tables — which are **not in this repo's migrations at all** (profiles is the
only public table any migration creates) — are provisioned separately.

**Next step to reconcile:** apply the migrations in filename order via the
Lovable Cloud migration tool, then re-run the audit queries in PRODUCT_BLUEPRINT.md §0a.

---

Legend: 🟢 pure move (no import chain risk) · 🟡 move + update imports ·
🔴 structural change (routes / layouts) — do last.

---

## Phase 1 — 🟢 Create new empty folders (no risk)

- [ ] `src/i18n/locales/`
- [ ] `src/regions/`
- [ ] `src/features/contractor/tools/{components,hooks}/`
- [ ] `src/features/contractor/profile/trades/`
- [ ] `src/features/homeowner/{dashboard,jobs,messages,payments,profile}/components/`
- [ ] `src/features/shared/notifications/components/`

## Phase 2 — 🟢 i18n split (self-contained)

Current: `src/lib/i18n.ts` (single file, inline dictionaries).

- [ ] Extract EN strings → `src/i18n/locales/en.json`
- [ ] Extract DE strings → `src/i18n/locales/de.json`
- [ ] Move config → `src/i18n/config.ts` (imports the two JSON files)
- [ ] Update import: `@/lib/i18n` → `@/i18n/config` (single call site is `src/start.ts` / root route)
- [ ] Delete `src/lib/i18n.ts`

## Phase 3 — 🟡 Regions (rename + relocate)

Current DE data lives in `src/lib/{country-data,postcode-de,streets-de,trade-categories,openplz}.ts`.

- [ ] Create `src/regions/germany.ts` — re-exports the DE helpers
- [ ] Create `src/regions/config.ts` — active-region selector
- [ ] Create `src/regions/index.ts` — `export * from "./config"`
- [ ] Migrate imports from `@/lib/country-data` etc. → `@/regions`
- [ ] Delete the moved files under `src/lib/` once no references remain

## Phase 4 — 🟡 Homeowner feature slice (new area, low collision)

Homeowner code is mostly under `src/features/homeowner/` today but flat.

- [ ] Group existing homeowner components into
      `dashboard/`, `jobs/`, `messages/`, `payments/`, `profile/` sub-slices
- [ ] Rename entry components to match blueprint
      (`HomeownerDashboard.tsx`, `PostJobWizard.tsx`, `MyProjectsList.tsx`,
      `ViewBids.tsx`, `ChatView.tsx`, `PaymentHistory.tsx`,
      `HomeownerProfilePage.tsx`)
- [ ] Add `hooks/useMyProjects.ts` (extract from existing hook if present)

## Phase 5 — 🟡 Contractor "tools" toolbelt

Currently scattered under `src/components/shared/`.

- [ ] Move `KmTrackerQuickModal.tsx` → `src/features/contractor/tools/components/KmTrackerSheet.tsx`
- [ ] Move receipt UI (from `contractor/jobs/AddReceiptDialog.tsx` or equivalent) → `src/features/contractor/tools/components/SmartReceiptsSheet.tsx`
- [ ] Extract OCR logic from `src/lib/finanz-ocr.functions.ts` client wrapper → `src/features/contractor/tools/hooks/useOcr.ts`
- [ ] Update all imports

## Phase 6 — 🟡 Contractor sub-slice cleanup

- [ ] Consolidate `src/features/contractor/onboarding/components/**` into a single `OnboardingWizard.tsx` entry (keep existing step files as internals)
- [ ] Move architect/security trade panels from `src/lib/sector-panels.tsx` → `src/features/contractor/profile/trades/{ArchitectTools,SiteSecurityTools}.tsx`
- [ ] Create `src/features/contractor/profile/components/DynamicProfileSection.tsx` (replaces `src/core/DynamicSectorRenderer.tsx` at feature level; keep `src/core/` internals for now)
- [ ] Rename `.../profile/ProfileOverview.tsx` entry → `ContractorProfilePage.tsx`
- [ ] Add `src/features/contractor/team/hooks/useTeamMembers.ts`
- [ ] Add `src/features/contractor/timesheets/{components,hooks}/` with `LogHoursPage.tsx`, `LocationInput.tsx`, `useLocation.ts`

## Phase 7 — 🟡 Global shared components trim

- [ ] Move `src/components/shared/PageHeader.tsx` → keep (already correct)
- [ ] Move `src/components/shared/UserAvatar.tsx` → keep
- [ ] Push feature-specific "shared" files down into their owning feature
      (e.g. `BusinessSettingsModals.tsx` → `features/contractor/settings/`,
      `TestingSwitchboard.tsx` → `features/shared/dev-tools/`)
- [ ] Everything left in `src/components/shared/` should be truly
      presentation-only and role-agnostic

## Phase 8 — 🔴 Route layout rename (highest risk — do last)

The current auth gate is `src/routes/_authenticated/`. Blueprint expects
`_dashboard/` for authed routes and `_auth/` for login/signup.

- [ ] Create `src/routes/_auth/route.tsx` (renders `<AuthLayout><Outlet/></AuthLayout>`)
- [ ] Move `src/routes/auth.login.tsx` → `src/routes/_auth/login.tsx`
- [ ] Move `src/routes/auth.tsx` (signup panel) → `src/routes/_auth/signup.tsx`
- [ ] Rename folder `src/routes/_authenticated/` → `src/routes/_dashboard/`
- [ ] Update every `createFileRoute("/_authenticated/…")` string to `/_dashboard/…`
- [ ] Split authed leaves by role: - `_dashboard/contractor/{index,jobs,profile,team,timesheets}.tsx` - `_dashboard/homeowner/{index,jobs,profile}.tsx`
- [ ] Merge `src/routes/dashboard/{index,client}.tsx` into the new
      `_dashboard/contractor/index.tsx` and `_dashboard/homeowner/index.tsx`
- [ ] Add `src/routes/onboarding/profile.tsx` (folder route);
      migrate `src/routes/onboarding.$sector.tsx` + `onboarding.index.tsx`
- [ ] Regenerate `src/routeTree.gen.ts` (auto via dev server) and fix any
      TypeScript errors from `<Link to="…">` params

## Phase 9 — 🟢 Verification

- [ ] `bun run build` passes
- [ ] Preview loads `/`, `/_auth/login`, `/_dashboard/contractor`, `/_dashboard/homeowner`
- [ ] `rg "_authenticated"` returns zero hits in `src/`
- [ ] `rg "@/lib/(country-data|postcode-de|streets-de|i18n)"` returns zero hits

---

## Files that stay put (already correct)

- `src/api/**`
- `src/components/ui/**`
- `src/components/layouts/{AuthLayout,DashboardLayout}.tsx`
- `src/hooks/useUser.ts`
- `src/lib/{permissions,supabase,types,utils}.ts`
- `src/routes/__root.tsx`, `src/routes/index.tsx`
- `src/integrations/supabase/**` (auto-generated — never edit)
- `src/routeTree.gen.ts` (auto-generated)
