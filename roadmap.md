# Roadmap — Supabase migration finishing work

- [x] 1. Active Jobs page, job cards, detail sheet → `src/lib/active-jobs.functions.ts`
- [x] 2. Contractor Quotes + lead picker → real job feed instead of demo ledger
- [x] 3. Homeowner Edit project, Chat with bidder, bid list → real server functions
- [x] 4. Properties screens (list/detail) on `src/lib/properties.functions.ts` — route `/homeowner/properties` + "My Properties" menu entry
- [x] 5. Type check + browser smoke test of /, /login, /homeowner, /homeowner/properties
- [x] 6. Database base setup — applied additive migrations 0017–0022; verified 41 application tables with RLS and access policies. Imported history was not blindly replayed.
- [x] 7. Contractor Quotes screen: save quotes to the database instead of browser-only (quote form + lead picker tied to a project)
- [x] 8. Guard decline/accept of bids (no double-award, no broken half-state)
- [x] 9. Clear completion date when a job is moved back from completed
- [x] 10. Quote details and bid guards — implemented in applied migrations 0019–0020, including serialized award/decline/cancel operations.
- [x] 11. Verified tables, grants, policies, signup trigger, confirmed-email claiming and private receipts/verification buckets; public homepage/sign-in smoke checks passed. Deployed registration is NOT tested.
- [ ] 12. Job photo/voice uploads require existing Cloudflare R2 credentials; configured secret values are not available in this sandbox.
- [ ] 13. Authenticated homeowner/contractor registration testing requires an account; the current database has zero auth users. External Vercel database/configuration is not accessible here.
