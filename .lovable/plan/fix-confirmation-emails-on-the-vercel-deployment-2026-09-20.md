# Fix confirmation emails on the Vercel deployment

## What you check in Supabase (5 minutes, works on your phone)

1. Open **supabase.com → your Handwerk project → Authentication → URL Configuration**
2. **Site URL** must be your live Vercel address, e.g. `https://foundation-e0xp.vercel.app`
3. **Redirect URLs** must include:
   - `https://foundation-e0xp.vercel.app/auth/callback`
   - `https://foundation-e0xp.vercel.app/**` (wildcard, covers everything)
4. While there, also open **Authentication → Emails** and confirm "Confirm signup" email is enabled.

## What I do once you tell me what you see

- **If a URL was missing/wrong** → you fix it in that dashboard (I can't edit it from here), then request a new confirmation email and test. No code change needed.
- **If the URLs are all correct** → the cause is the missing `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel (the code only reads that name; you only have `VITE_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` there). I then:
  1. Update `src/integrations/supabase/client.ts` and `project-credentials.ts` to fall back to `VITE_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when `VITE_SUPABASE_PUBLISHABLE_KEY` is absent.
  2. Push the change to Karolisas930/Foundation → Vercel redeploys automatically.
  3. You re-test sign-up → confirmation email → landing on the dashboard.

## Notes

- The red "Failed to sync environment variables" error in your screenshot is expected: Supabase won't overwrite variables that already exist in Vercel. It is not itself the bug — the stale/missing key names are.
- No database data is touched at any point.
