# Database setup status

## Applied to this project's Lovable Cloud database

- `drizzle/migrations/0017_initialize_profiles.sql`
- `drizzle/migrations/0018_real_data_base_tables.sql`
- `drizzle/migrations/0019_real_data_quotes_scheduling_documents.sql`
- `drizzle/migrations/0020_real_data_read_paths_and_alerts.sql`
- `drizzle/migrations/0021_real_data_matching_read_function.sql`
- `drizzle/migrations/0022_profile_pin_persistence.sql`

Generated database types were refreshed by the migration tool. No page designs or demo features were changed.

The database now contains 41 application tables. Verified all have row-level security, policies, and service-role grants. Verified the signup profile trigger exists, pending-project claiming requires confirmed email and locks pending rows with `FOR UPDATE SKIP LOCKED`, anonymous claiming is forbidden, and authenticated claiming is permitted.

Created private `verifications` and `receipts` storage buckets with 10 MB per-file limits; owner-scoped access policies are included in migration 0019.

Public homepage and sign-in screens opened without browser page errors. Public landing stats read back zero jobs and zero pros. There are currently zero auth users: authenticated registration, bid operations and private uploads have NOT been verified end-to-end. The latest harness build result was successful; no manual production build or typecheck was run.

## Remaining configuration and limits

- Job photos and voice recordings currently use Cloudflare R2, not the two new private buckets. The existing upload code needs `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`. Their presence in hosted configuration was not verified.
- This setup changed only the database connected to this Lovable project. It does not apply migrations to an external Vercel deployment's database or verify that deployment's environment/auth settings.
- Imported migration-history entries 0000–0016 did not establish a verified baseline for the current database. They were not replayed blindly; one includes a destructive public-schema reset. Do not run the entire imported migration set against another live database without reconciling it first.
- Later migration steps must still replace browser-only/demo data with actual queries. Schema setup alone does not complete that work.

## Repeatable database checks

Run `db/checks/real-data-setup.sql` through the database read-query tool. It raises an SQL error when a checked invariant fails. These checks do not substitute for deployed user-flow testing.