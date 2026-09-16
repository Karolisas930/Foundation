-- The signup trigger (handle_new_user) only ever inserted full_name,
-- display_name, and account_type from auth metadata — phone was left out,
-- even though profiles.phone has existed since an earlier migration. This
-- meant phone captured in the homeowner "secure your account" form never
-- reached the profiles table for brand-new signups, because the client-side
-- upsert that was supposed to backfill it runs before email confirmation
-- (no session yet), so RLS silently blocks it. Fix it at the trigger level
-- instead, since triggers run with elevated privileges and aren't affected
-- by that timing gap.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name, account_type, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'account_type',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
