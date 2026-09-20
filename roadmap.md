# Roadmap — Supabase migration finishing work

- [x] 1. Active Jobs page, job cards, detail sheet → `src/lib/active-jobs.functions.ts`
- [x] 2. Contractor Quotes + lead picker → real job feed instead of demo ledger
- [x] 3. Homeowner Edit project, Chat with bidder, bid list → real server functions
- [x] 4. Properties screens (list/detail) on `src/lib/properties.functions.ts` — route `/homeowner/properties` + "My Properties" menu entry
- [x] 5. Type check + browser smoke test of /, /login, /homeowner, /homeowner/properties
- [x] 6. Backend connected (Lovable Cloud) — all migrations + consolidated script applied; email + Google sign-in enabled
- [x] 7. Contractor Quotes screen: save quotes to the database instead of browser-only (quote form + lead picker tied to a project)
- [x] 8. Guard decline/accept of bids (no double-award, no broken half-state)
- [x] 9. Clear completion date when a job is moved back from completed
- [ ] 10. Apply `db/manual-migrations/20260919150000_LOCAL_quote_details_and_bid_guards.sql` to the local Supabase (needs your database)
