# Refactor Checklist — Agent-Actionable

> Rules for the agent working this file:
>
> 1. Pick the **first unchecked box**, complete it, then flip `[ ]` → `[x]`.
> 2. Do not skip ahead — order encodes conflict risk (low → high).
> 3. After each phase, run `bun run build` and confirm the preview loads.
> 4. If a step is blocked, add a `> ⚠ blocked: <reason>` line under it and move to the next independent phase.
> 5. Blueprint source of truth: `docs/blueprint/target-structure.blueprint.json`.
> 6. Detailed rationale for each move: `docs/blueprint/MIGRATION_PLAN.md`.

---

## Phase 1 — Create empty scaffolding folders (🟢 zero risk) ✅

- [x] `mkdir -p src/i18n/locales`
- [x] `mkdir -p src/regions`
- [x] `mkdir -p src/features/contractor/tools/components src/features/contractor/tools/hooks`
- [x] `mkdir -p src/features/contractor/profile/trades`
- [x] `mkdir -p src/features/contractor/timesheets/components src/features/contractor/timesheets/hooks`
- [x] `mkdir -p src/features/homeowner/dashboard/components`
- [x] `mkdir -p src/features/homeowner/jobs/components src/features/homeowner/jobs/hooks`
- [x] `mkdir -p src/features/homeowner/messages/components`
- [x] `mkdir -p src/features/homeowner/payments/components`
- [x] `mkdir -p src/features/homeowner/profile/components`
- [x] `mkdir -p src/features/shared/notifications/components`

## Phase 2 — i18n extraction (🟢 self-contained) ✅

- [x] Create `src/i18n/locales/en.json` from EN strings in `src/lib/i18n.ts`
- [x] Create `src/i18n/locales/de.json` from DE strings in `src/lib/i18n.ts`
- [x] Create `src/i18n/config.ts` that imports both JSONs and initialises i18next
- [x] `rg -l "@/lib/i18n"` and update every import to `@/i18n/config`
- [x] Delete `src/lib/i18n.ts`
- [x] `bun run build` passes

## Phase 3 — Regions module (🟡 imports) ✅

- [x] Create `src/regions/germany.ts` re-exporting DE data from existing `src/lib/*-de.ts` + `country-data.ts` + `trade-categories.ts` + `openplz.ts`
- [x] Create `src/regions/config.ts` (active-region selector, defaults to `de`)
- [x] Create `src/regions/index.ts` (barrel: `export * from "./config"; export * from "./germany"`)
- [x] Update imports of moved DE helpers to `@/regions` (15 files)
- [x] Delete the migrated files from `src/lib/` — done via `mv` into `src/regions/`
- [x] Typecheck passes (`bunx tsgo --noEmit` clean)

> Note: openplz's `PostcodeHit` type is re-exported as `OpenPlzPostcodeHit`
> to avoid a name clash with the local `postcode-de` `PostcodeHit`.

## Phase 4 — Homeowner feature slice (🟡) ✅

- [x] Reorganise `src/features/homeowner/**` into `dashboard/`, `jobs/`, `messages/`, `payments/`, `profile/` sub-slices
- [x] Rename entries: `HomeownerPortal.tsx` → `HomeownerDashboard.tsx`; `HomeownerWizard.tsx` → `PostJobWizard.tsx`; `ChatDialog.tsx` → `messages/components/ChatView.tsx`; profile files → `profile/components/`
- [x] `MyProjectsList.tsx` + `hooks/useMyProjects.ts` already in place
- [x] Imports updated; typecheck clean (`bunx tsgo --noEmit`)
- [ ] Deferred (no source yet): `ViewBids.tsx` (currently `ProposalsPanel.tsx`), `PaymentHistory.tsx` (payments slice empty), unified `HomeownerProfilePage.tsx`

## Phase 5 — Contractor toolbelt (🟡) ✅

- [x] Move `src/components/shared/KmTrackerQuickModal.tsx` → `src/features/contractor/tools/components/KmTrackerSheet.tsx`
- [x] Move receipts dialog → `src/features/contractor/tools/components/SmartReceiptsSheet.tsx`
- [x] Extract OCR client hook → `src/features/contractor/tools/hooks/useOcr.ts`
- [x] Update imports; typecheck passes (`bunx tsgo --noEmit` clean)

> Notes:
>
> - `KmTrackerSheet.tsx` already existed in the target location (same
>   `open/onOpenChange` API); the two remaining call sites (`AppSideMenu`,
>   `TripsPanel`) were rewired to it and the legacy shared file deleted.
> - `SmartReceiptsSheet.tsx` was already in place as the toolbelt entry.
>   `features/contractor/jobs/components/AddReceiptDialog.tsx` is a
>   per-job diary attachment with a different API (`jobId/job/onClose`)
>   and stays in the jobs slice — it is not the same surface.
> - `useOcr` wraps `ocrReceipt` (`useServerFn` + base64 encoding + busy
>   state). `ReceiptsPanel` migrated; other consumers can adopt as they
>   are touched.

## Phase 6 — Contractor sub-slice cleanup (🟡) ✅

- [x] Consolidate onboarding into `features/contractor/onboarding/components/OnboardingWizard.tsx` — canonical entry now re-exports the multi-step `HandymanOnboarding` orchestrator (Identity → Trades → ServiceArea → Contact → Profile), which delegates rendering to `./handyman/steps/*`. The legacy two-step split (`QuickStartForm` + `CompleteProfileForm`) was orphaned duplicate logic and has been removed. `HandymanForm.tsx` and `OnboardingPage` now route through `OnboardingWizard`.
- [ ] Move sector/trade panels from `src/lib/sector-panels.tsx` → `features/contractor/profile/trades/` — ⚠ blocked: `src/core/sector-config.ts` is a PROTECTED CORE FILE (header explicitly forbids non-additive edits; changing the 8 dynamic-import paths to a new module location is a rename, not an additive fix). `ArchitectTools`/`SiteSecurityTools` wrappers already live under `trades/`; the physical `sector-panels.tsx` relocation stays deferred until the core registry gate is lifted by the user.
- [x] Create `features/contractor/profile/components/DynamicProfileSection.tsx` (wraps protected `Chameleon` renderer)
- [x] Rename profile entry → `ContractorProfilePage.tsx` — exposed as barrel alias `ContractorProfilePage` (kept `HandymanProfilePage` for the ~10 in-tree call sites; can drop after Phase 7)
- [x] Add `features/contractor/team/hooks/useTeamMembers.ts`
- [x] Create `features/contractor/timesheets/` (`LogHoursPage.tsx` re-exports StaffHoursPage, `LocationInput.tsx`, `useLocation.ts`)
- [x] Typecheck passes (`bunx tsgo --noEmit` clean)

## Phase 7 — Trim `components/shared/` (🟡) ✅

- [x] Keep only truly role-agnostic files (`PageHeader`, `UserAvatar`, theme + language toggles, side-menu chrome, form/pin/upload primitives, etc.) — business-settings + dev switchboard moved out
- [x] Move business-settings modals → `features/contractor/settings/{components/BusinessSettingsModals.tsx,business-settings/*}`
- [x] Move dev switchboard → `features/shared/dev-tools/components/TestingSwitchboard.tsx` (was orphaned; no callers to rewire)
- [x] Update imports (`AppSideMenu`, `side-menu/useMenuSections`); typecheck passes (`bunx tsgo --noEmit` clean)

## Phase 8 — Route layout rename (🔴 highest risk — do LAST)

- [x] Create `src/routes/_auth/route.tsx` rendering the dark `_auth` chrome + `<Outlet />`
- [x] Move `src/routes/auth.login.tsx` → `src/routes/_auth/login.tsx` (update `createFileRoute("/_auth/login")`) + delete old file
- [x] Move `src/routes/auth.tsx` signup → `src/routes/_auth/signup.tsx`; body extracted to `features/auth/route/AuthPageBody.tsx`; 8 call sites rewired to `/login` or `/signup`
- [x] `git mv src/routes/_authenticated src/routes/_dashboard`
- [x] Update every `createFileRoute("/_authenticated/…")` string to `/_dashboard/…` (`rg -l "_authenticated"`)
- [x] Reorganise leaves into `_dashboard/contractor/{...}` and `_dashboard/homeowner/{...}` — contractor-only leaves (jobs.active, jobs.quotes, team, team.locations, staff-hours, calendar, daily-log, performance, reports, network\*, profile) moved under `_dashboard/contractor/`; homeowner index under `_dashboard/homeowner/`; shared leaves (messages, notifications, security, settings, dev) stay at the `_dashboard/` top level. All ~30 nav call sites (BottomBar, AppSideMenu, HeaderActions, TopBar, side-menu sections, TestingSwitchboard, ContractorDashboard, QuotesPage, network Link/navigate, auth actions, onboarding forms, SuccessScreen, PostJobWizard, reset-password, SiteFooter) rewired.
- [x] Merge `src/routes/dashboard/{index,client}.tsx` into `_dashboard/contractor/index.tsx` (keeps `dispatchLeadsForCurrentUser`) and `_dashboard/homeowner/index.tsx` (drops the contractor dispatch); `src/routes/dashboard/` + `src/routes/dashboard.tsx` deleted.
- [x] Create `src/routes/onboarding/profile.tsx` migrating `onboarding.$sector.tsx` (sector now a search param); `onboarding.index.tsx` links to `/onboarding/profile?sector=…`; old `onboarding.$sector.tsx` deleted.
- [x] Vite regenerated `src/routeTree.gen.ts` (includes `_auth`, `_auth/login`, `_auth/signup`, `onboarding/profile`)
- [x] `bunx tsgo --noEmit` clean

## Phase 9 — Final verification (🟢)

- [x] `rg "_authenticated" src/` → zero hits (confirmed)
- [x] `rg "@/lib/(country-data|postcode-de|streets-de|i18n|sector-panels)" src/` → 8 expected hits, all inside `src/core/sector-config.ts` as dynamic imports of `sector-panels.tsx`. Known exception documented in the Phase 6 progress log: `sector-panels.tsx` cannot be relocated because `src/core/sector-config.ts` is a protected core registry. Not a failure.
- [x] `rg "src/pages"` → zero hits (confirmed; framework forbids it)
- [x] `bunx tsgo --noEmit` clean
- [x] `bun run build` passes
- [ ] Manual smoke test: signup → onboarding → dashboard (both roles)
- 2026-07-21 — Phase 5 complete: `KmTrackerQuickModal` deleted, callers rewired to `KmTrackerSheet`; `useOcr` hook extracted and `ReceiptsPanel` migrated; `SmartReceiptsSheet` already at target path. Typecheck clean.

---

## Progress log

_Agent: append one line per completed phase, newest at bottom._

- 2026-07-21 — Phase 1 complete: scaffolding folders created.
- 2026-07-21 — Phase 2 complete: i18n moved to `src/i18n/` (en.json + de.json + config.ts); `src/lib/i18n.ts` removed; only import site (`LanguageSelector`) updated.
- 2026-07-21 — Phase 3 complete: DE data + openplz relocated to `src/regions/`; barrel `@/regions` in place; 15 import sites updated; `PostcodeHit` collision resolved by renaming openplz's to `OpenPlzPostcodeHit`; typecheck clean.
- 2026-07-21 — Phase 4 complete: homeowner entries renamed (HomeownerDashboard, PostJobWizard, ChatView); profile files moved into `profile/components/`; barrel keeps `HomeownerPortal` alias for back-compat; ViewBids/PaymentHistory/unified profile page deferred (no source). Typecheck clean.
- 2026-07-21 — Phase 6 deferred items resolved: `OnboardingWizard.tsx` promoted to the canonical multi-step wizard (delegates to existing `handyman/steps/*`); orphaned `QuickStartForm.tsx` + `CompleteProfileForm.tsx` deleted; `HandymanForm` + `OnboardingPage` rewired through `OnboardingWizard`. `sector-panels.tsx` physical move remains blocked by the protected `src/core/sector-config.ts` registry — note updated on the checklist line. `bunx tsgo --noEmit` and `bun run build` both pass clean.
- 2026-07-21 — Phase 8 partial: mechanical `_authenticated/` → `_dashboard/` folder rename done; every `createFileRoute("/_authenticated/…")` string + residual doc comments updated (`rg "_authenticated" src/` clean, only auto-regenerated `routeTree.gen.ts` still to refresh). No external call sites referenced `/_authenticated` so no `<Link to>` fixes needed. Deferred (require semantic merges + URL surface changes, flagged for follow-up): `_auth/` layout split of `auth.tsx`+`auth.login.tsx` (changes public URL from `/auth?mode=signup` to `/signup`, must rewire 5 `<Link to="/auth">` sites + reset-password/AuthGuard redirects that still target `/auth` with a required `search` param — pre-existing typecheck errors around this were not introduced by the rename); role-split of `_dashboard/*` leaves (current leaves are role-agnostic, splitting requires new gate logic in `_dashboard/route.tsx` reading `useUser().role`); merge of `src/routes/dashboard/{index,client}.tsx` (both currently render `DashboardShell` with different `dispatchLeadsForCurrentUser` behaviours — needs product decision on whether homeowner path retains lead dispatch); `onboarding/profile.tsx` folder promotion (existing `onboarding.$sector.tsx` param route encodes sector in the URL and is linked from onboarding index — collapsing to a single `/onboarding/profile` requires moving sector into search params and updating call sites).
- 2026-07-21 — Phase 8 (account-type + auth split): `profiles.account_type` now stamped on both sides of signup — `finalizeHandymanRegistration` writes `handyman` (existing), and homeowner `SuccessScreen` now upserts `homeowner` after `updateUser`/`signUp`. `src/hooks/useUser.ts` implemented against real Supabase (auth user + profiles row → `{ user, profile, accountType, isContractor, loading }`; `isContractor` = anything non-homeowner). `_dashboard/route.tsx` `beforeLoad` now returns `{ user, accountType }` in route context and redirects unauthenticated users to `/login` (with `redirect` search). Auth split: dark-chrome layout `src/routes/_auth/route.tsx` + leaves `_auth/login.tsx` (accepts `?mode=signup|forgot`, `redirect`, `next`) and `_auth/signup.tsx`; shared body extracted to `features/auth/route/AuthPageBody.tsx`; `auth.tsx` + `auth.login.tsx` deleted; all 8 call sites (`AuthGuard`, `CtaFooterSection`, `Hero`, `SiteFooter`, `p.$profileId`, `onboarding.index`, `reset-password` ×2, `_dashboard/route`) plus `useAuthActions` / `TopBar` / `HeaderActions` / `sitemap` rewired to `/login`|`/signup`. Onboarding profile route promoted: `onboarding/profile.tsx` accepts `?sector=<sector>`; old `onboarding.$sector.tsx` deleted; `onboarding.index.tsx` linked accordingly. Stray `dispatchLeadsForCurrentUser` removed from `dashboard/client.tsx` per instruction 5; full `dashboard/` deletion + `_dashboard/{contractor,homeowner}/*` leaf split deferred (requires updating ~30 nav call sites — separate scoped pass, noted on Phase 8 checklist). `routeTree.gen.ts` regenerated; `bunx tsgo --noEmit` clean.
- 2026-07-22 — Phase 8 finish + first-load stamp: role-split of `_dashboard/` leaves completed — contractor leaves moved under `_dashboard/contractor/`, homeowner index under `_dashboard/homeowner/`; shared (messages, notifications, security, settings, dev) stay top-level. `src/routes/dashboard/{index,client}.tsx` merged into `_dashboard/contractor/index.tsx` (retains `dispatchLeadsForCurrentUser`) and `_dashboard/homeowner/index.tsx` (dispatch dropped); legacy `src/routes/dashboard*` deleted. New shared helper `src/lib/account-type.ts` (`stampAccountTypeIfMissing`) — idempotent, only writes when `profiles.account_type` is null — invoked from the homeowner dashboard's first-mount `useEffect`, covering the three redirecting flows that skip `SuccessScreen`'s eager stamp (magic-link, Google OAuth, Apple OAuth all land on `/homeowner`). ~30 navigation call sites rewired from `/dashboard[?sector=…]`, `/jobs/*`, `/team*`, `/staff-hours`, `/daily-log`, `/performance`, `/reports`, `/network*`, `/profile` to the new nested `/contractor/*` and `/homeowner` URLs. `bunx tsgo --noEmit` and `bun run build` both clean.
- 2026-07-22 — Phase 9 automated checks green: `rg "_authenticated" src/` = 0 hits; `rg "src/pages"` = 0 hits; `rg "@/lib/(country-data|postcode-de|streets-de|i18n|sector-panels)" src/` = 8 hits, all inside `src/core/sector-config.ts` dynamic imports of `sector-panels.tsx` — known, documented exception (protected core registry, see Phase 6 log). Boxes checked accordingly. Manual signup → onboarding → dashboard smoke test across both roles remains the sole outstanding item and requires a human to click through the live app.
- 2026-07-22 — Staff hourly rates moved off localStorage: added nullable `hourly_rate numeric` column to `public.team_members` (migration guarded with `IF EXISTS`, inherits existing owner-scoped RLS — same policies that already back `InviteMemberDialog`'s writes cover the new column). `useStaffHoursData` now loads rates from `team_members.hourly_rate` per owner_id and upserts via `UPDATE` on `setRate`; `hw:staff-rates:${userId}` key removed. `rates`/`setRate` return shape unchanged, so `StaffHoursPage.tsx` and `PayCalculationSection.tsx` need no edits.
