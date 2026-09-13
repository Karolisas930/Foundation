-- =============================================================================
-- Phase 1 (Product Blueprint) — Core Tables and RLS Policies
--
-- Creates missing core tables and applies owner-scoped RLS policies for:
--   bookings, jobs, matches, messages, network_messages,
--   network_thread_members, network_threads, notifications, reviews,
--   services, user_roles.
--
-- This script assumes `set_updated_at()` function and `app_role` enum
-- are already defined (e.g., in `01_missing_tables_and_rls.sql` or
-- earlier migrations).
-- =============================================================================

-- Ensure app_role enum exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'contractor');
    END IF;
END$$;

-- ---------- services ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trade text,
  base_price_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS services_provider_idx ON public.services(provider_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS services_select_own ON public.services;
CREATE POLICY services_select_own ON public.services
  FOR SELECT TO authenticated USING (auth.uid() = provider_id);
DROP POLICY IF EXISTS services_insert_own ON public.services;
CREATE POLICY services_insert_own ON public.services
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
DROP POLICY IF EXISTS services_update_own ON public.services;
CREATE POLICY services_update_own ON public.services
  FOR UPDATE TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
DROP POLICY IF EXISTS services_delete_own ON public.services;
CREATE POLICY services_delete_own ON public.services
  FOR DELETE TO authenticated USING (auth.uid() = provider_id);
DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- jobs -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  trade text,
  estimated_budget integer,
  location_zip text,
  city text,
  language text,
  urgency text,
  status text NOT NULL DEFAULT 'open', -- open | assigned | completed | cancelled
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_owner_idx ON public.jobs(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jobs_select_own_or_public ON public.jobs;
CREATE POLICY jobs_select_own_or_public ON public.jobs
  FOR SELECT TO authenticated USING (
    auth.uid() = owner_id OR status = 'open' -- Allow contractors to see open jobs
  );
DROP POLICY IF EXISTS jobs_insert_own ON public.jobs;
CREATE POLICY jobs_insert_own ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS jobs_update_own ON public.jobs;
CREATE POLICY jobs_update_own ON public.jobs
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS jobs_delete_own ON public.jobs;
CREATE POLICY jobs_delete_own ON public.jobs
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS jobs_set_updated_at ON public.jobs;
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- matches ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | rejected | cancelled
  match_unlocked boolean NOT NULL DEFAULT FALSE,
  accepted_at timestamptz,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, contractor_id)
);
CREATE INDEX IF NOT EXISTS matches_job_idx ON public.matches(job_id);
CREATE INDEX IF NOT EXISTS matches_client_idx ON public.matches(client_id);
CREATE INDEX IF NOT EXISTS matches_contractor_idx ON public.matches(contractor_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS matches_access_by_participant ON public.matches;
CREATE POLICY matches_access_by_participant ON public.matches
  FOR ALL TO authenticated USING (auth.uid() = client_id OR auth.uid() = contractor_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = contractor_id);
DROP TRIGGER IF EXISTS matches_set_updated_at ON public.matches;
CREATE TRIGGER matches_set_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- bookings ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending | confirmed | completed | cancelled
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  agreed_price_cents integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_client_idx ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS bookings_provider_idx ON public.bookings(provider_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bookings_access_by_participant ON public.bookings;
CREATE POLICY bookings_access_by_participant ON public.bookings
  FOR ALL TO authenticated USING (auth.uid() = client_id OR auth.uid() = provider_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = provider_id);
DROP TRIGGER IF EXISTS bookings_set_updated_at ON public.bookings;
CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- messages ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_booking_idx ON public.messages(booking_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_access_by_participant ON public.messages;
CREATE POLICY messages_access_by_participant ON public.messages
  FOR ALL TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- ---------- reviews ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_booking_idx ON public.reviews(booking_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_access_by_participant ON public.reviews;
CREATE POLICY reviews_access_by_participant ON public.reviews
  FOR ALL TO authenticated USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- ---------- notifications ----------------------------------------------------
-- Assuming notifications table already exists from migration 20260723145205.
-- If not, it should be created here. For now, just add RLS.
-- Example schema if it needs to be created:
-- CREATE TABLE IF NOT EXISTS public.notifications (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
--   type text NOT NULL,
--   message text NOT NULL,
--   read_at timestamptz,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );
-- CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON public.notifications(recipient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS notifications_insert_own_or_admin ON public.notifications;
CREATE POLICY notifications_insert_own_or_admin ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = recipient_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = recipient_id);

-- ---------- network_threads --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.network_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS network_threads_created_by_idx ON public.network_threads(created_by);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_threads TO authenticated;
GRANT ALL ON public.network_threads TO service_role;
ALTER TABLE public.network_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS network_threads_access_by_member ON public.network_threads;
CREATE POLICY network_threads_access_by_member ON public.network_threads
  FOR ALL TO authenticated USING (
    auth.uid() = created_by OR auth.uid() IN (SELECT user_id FROM public.network_thread_members WHERE thread_id = id)
  )
  WITH CHECK (
    auth.uid() = created_by OR auth.uid() IN (SELECT user_id FROM public.network_thread_members WHERE thread_id = id)
  );
DROP TRIGGER IF EXISTS network_threads_set_updated_at ON public.network_threads;
CREATE TRIGGER network_threads_set_updated_at BEFORE UPDATE ON public.network_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- network_thread_members -------------------------------------------
CREATE TABLE IF NOT EXISTS public.network_thread_members (
  thread_id uuid NOT NULL REFERENCES public.network_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);
CREATE INDEX IF NOT EXISTS network_thread_members_user_idx ON public.network_thread_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_thread_members TO authenticated;
GRANT ALL ON public.network_thread_members TO service_role;
ALTER TABLE public.network_thread_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS network_thread_members_access_by_member ON public.network_thread_members;
CREATE POLICY network_thread_members_access_by_member ON public.network_thread_members
  FOR ALL TO authenticated USING (
    auth.uid() = user_id OR auth.uid() IN (SELECT created_by FROM public.network_threads WHERE id = thread_id)
  )
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() IN (SELECT created_by FROM public.network_threads WHERE id = thread_id)
  );

-- ---------- network_messages -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.network_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.network_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS network_messages_thread_idx ON public.network_messages(thread_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_messages TO authenticated;
GRANT ALL ON public.network_messages TO service_role;
ALTER TABLE public.network_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS network_messages_access_by_member ON public.network_messages;
CREATE POLICY network_messages_access_by_member ON public.network_messages
  FOR ALL TO authenticated USING (
    auth.uid() = sender_id OR auth.uid() IN (SELECT user_id FROM public.network_thread_members WHERE thread_id = network_messages.thread_id)
  );

-- ---------- user_roles -------------------------------------------------------
-- Assuming app_role enum is already created.
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_roles_insert_admin_only ON public.user_roles;
CREATE POLICY user_roles_insert_admin_only ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS user_roles_update_admin_only ON public.user_roles;
CREATE POLICY user_roles_update_admin_only ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS user_roles_delete_admin_only ON public.user_roles;
CREATE POLICY user_roles_delete_admin_only ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));