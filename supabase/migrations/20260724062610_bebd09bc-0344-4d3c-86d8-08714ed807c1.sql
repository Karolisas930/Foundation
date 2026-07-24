CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_public_read ON public.categories;
CREATE POLICY categories_public_read ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  trade text,
  base_price_cents integer,
  currency text NOT NULL DEFAULT 'EUR',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS services_provider_idx ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS services_trade_idx ON public.services(trade);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS services_public_read ON public.services;
CREATE POLICY services_public_read ON public.services FOR SELECT TO anon, authenticated USING (active = true OR auth.uid() = provider_id);
DROP POLICY IF EXISTS services_manage_own ON public.services;
CREATE POLICY services_manage_own ON public.services FOR ALL TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.contractors (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  license_number text,
  insurance_provider text,
  insurance_policy_number text,
  insurance_valid_until date,
  years_experience integer,
  team_size integer,
  rating_avg numeric(3,2),
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contractors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.contractors TO authenticated;
GRANT ALL ON public.contractors TO service_role;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contractors_public_read ON public.contractors;
CREATE POLICY contractors_public_read ON public.contractors FOR SELECT TO anon, authenticated USING (verified = true OR auth.uid() = user_id);
DROP POLICY IF EXISTS contractors_manage_own ON public.contractors;
CREATE POLICY contractors_manage_own ON public.contractors FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS contractors_set_updated_at ON public.contractors;
CREATE TRIGGER contractors_set_updated_at BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.homeowners (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_type text,
  preferred_contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homeowners TO authenticated;
GRANT ALL ON public.homeowners TO service_role;
ALTER TABLE public.homeowners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS homeowners_manage_own ON public.homeowners;
CREATE POLICY homeowners_manage_own ON public.homeowners FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS homeowners_set_updated_at ON public.homeowners;
CREATE TRIGGER homeowners_set_updated_at BEFORE UPDATE ON public.homeowners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  phone text,
  team_role text NOT NULL DEFAULT 'staff',
  extended_role text,
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  hourly_rate numeric,
  can_see_invoices boolean NOT NULL DEFAULT false,
  can_see_bank_details boolean NOT NULL DEFAULT false,
  can_see_financials boolean NOT NULL DEFAULT false,
  can_log_time boolean NOT NULL DEFAULT true,
  can_upload_receipts boolean NOT NULL DEFAULT true,
  can_upload_photos boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, email)
);
CREATE INDEX IF NOT EXISTS team_members_owner_idx ON public.team_members(owner_id);
CREATE INDEX IF NOT EXISTS team_members_member_idx ON public.team_members(member_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_members_select_owner_or_self ON public.team_members;
CREATE POLICY team_members_select_owner_or_self ON public.team_members FOR SELECT TO authenticated USING (auth.uid() = owner_id OR auth.uid() = member_user_id);
DROP POLICY IF EXISTS team_members_insert_owner_only ON public.team_members;
CREATE POLICY team_members_insert_owner_only ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS team_members_update_owner_only ON public.team_members;
CREATE POLICY team_members_update_owner_only ON public.team_members FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS team_members_delete_owner_only ON public.team_members;
CREATE POLICY team_members_delete_owner_only ON public.team_members FOR DELETE TO authenticated USING (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS team_members_set_updated_at ON public.team_members;
CREATE TRIGGER team_members_set_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_verified_contractor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.account_type IS NOT NULL AND p.account_type <> 'homeowner')
$$;
REVOKE EXECUTE ON FUNCTION public.is_verified_contractor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_verified_contractor(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  trade text,
  estimated_budget integer,
  location_zip text,
  city text,
  language text DEFAULT 'de',
  urgency text DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_owner_idx ON public.jobs(owner_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs(status);
CREATE INDEX IF NOT EXISTS jobs_trade_idx ON public.jobs(trade);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jobs_select_open_or_owner ON public.jobs;
CREATE POLICY jobs_select_open_or_owner ON public.jobs FOR SELECT TO authenticated USING (status='open' OR auth.uid()=owner_id);
DROP POLICY IF EXISTS jobs_insert_own ON public.jobs;
CREATE POLICY jobs_insert_own ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid()=owner_id);
DROP POLICY IF EXISTS jobs_update_own ON public.jobs;
CREATE POLICY jobs_update_own ON public.jobs FOR UPDATE TO authenticated USING (auth.uid()=owner_id) WITH CHECK (auth.uid()=owner_id);
DROP POLICY IF EXISTS jobs_delete_own ON public.jobs;
CREATE POLICY jobs_delete_own ON public.jobs FOR DELETE TO authenticated USING (auth.uid()=owner_id);
DROP TRIGGER IF EXISTS jobs_set_updated_at ON public.jobs;
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  match_unlocked boolean NOT NULL DEFAULT false,
  accepted_at timestamptz,
  unlocked_at timestamptz,
  client_accepted_at timestamptz,
  contractor_accepted_at timestamptz,
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
DROP POLICY IF EXISTS matches_select_participants ON public.matches;
CREATE POLICY matches_select_participants ON public.matches FOR SELECT TO authenticated USING (auth.uid()=client_id OR auth.uid()=contractor_id);
DROP POLICY IF EXISTS matches_insert_contractor ON public.matches;
CREATE POLICY matches_insert_contractor ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid()=contractor_id);
DROP POLICY IF EXISTS matches_update_participants ON public.matches;
CREATE POLICY matches_update_participants ON public.matches FOR UPDATE TO authenticated USING (auth.uid()=client_id OR auth.uid()=contractor_id) WITH CHECK (auth.uid()=client_id OR auth.uid()=contractor_id);
DROP POLICY IF EXISTS matches_delete_participants ON public.matches;
CREATE POLICY matches_delete_participants ON public.matches FOR DELETE TO authenticated USING (auth.uid()=client_id OR auth.uid()=contractor_id);
DROP TRIGGER IF EXISTS matches_set_updated_at ON public.matches;
CREATE TRIGGER matches_set_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  agreed_price_cents integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_job_idx ON public.bookings(job_id);
CREATE INDEX IF NOT EXISTS bookings_match_idx ON public.bookings(match_id);
CREATE INDEX IF NOT EXISTS bookings_client_idx ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS bookings_provider_idx ON public.bookings(provider_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bookings_select_participants ON public.bookings;
CREATE POLICY bookings_select_participants ON public.bookings FOR SELECT TO authenticated USING (auth.uid()=client_id OR auth.uid()=provider_id);
DROP POLICY IF EXISTS bookings_insert_participants ON public.bookings;
CREATE POLICY bookings_insert_participants ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid()=client_id OR auth.uid()=provider_id);
DROP POLICY IF EXISTS bookings_update_participants ON public.bookings;
CREATE POLICY bookings_update_participants ON public.bookings FOR UPDATE TO authenticated USING (auth.uid()=client_id OR auth.uid()=provider_id) WITH CHECK (auth.uid()=client_id OR auth.uid()=provider_id);
DROP POLICY IF EXISTS bookings_delete_participants ON public.bookings;
CREATE POLICY bookings_delete_participants ON public.bookings FOR DELETE TO authenticated USING (auth.uid()=client_id OR auth.uid()=provider_id);
DROP TRIGGER IF EXISTS bookings_set_updated_at ON public.bookings;
CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_booking_idx ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages(recipient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
CREATE POLICY messages_select_participants ON public.messages FOR SELECT TO authenticated USING (auth.uid()=sender_id OR auth.uid()=recipient_id);
DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
CREATE POLICY messages_insert_sender ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid()=sender_id);
DROP POLICY IF EXISTS messages_update_participants ON public.messages;
CREATE POLICY messages_update_participants ON public.messages FOR UPDATE TO authenticated USING (auth.uid()=sender_id OR auth.uid()=recipient_id) WITH CHECK (auth.uid()=sender_id OR auth.uid()=recipient_id);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_provider_idx ON public.reviews(provider_id);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
CREATE POLICY reviews_public_read ON public.reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid()=client_id);

CREATE TABLE IF NOT EXISTS public.network_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_threads TO authenticated;
GRANT ALL ON public.network_threads TO service_role;
ALTER TABLE public.network_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.network_thread_members (
  thread_id uuid NOT NULL REFERENCES public.network_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_network_thread_members_user ON public.network_thread_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_thread_members TO authenticated;
GRANT ALL ON public.network_thread_members TO service_role;
ALTER TABLE public.network_thread_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_network_thread_member(_thread_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.network_thread_members WHERE thread_id = _thread_id AND user_id = _user_id)
$$;
REVOKE EXECUTE ON FUNCTION public.is_network_thread_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_network_thread_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "network_threads_select_members" ON public.network_threads;
CREATE POLICY "network_threads_select_members" ON public.network_threads FOR SELECT TO authenticated USING (public.is_network_thread_member(id, auth.uid()));
DROP POLICY IF EXISTS "network_threads_insert_own" ON public.network_threads;
CREATE POLICY "network_threads_insert_own" ON public.network_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND public.is_verified_contractor(auth.uid()));

DROP POLICY IF EXISTS "network_thread_members_select_own" ON public.network_thread_members;
CREATE POLICY "network_thread_members_select_own" ON public.network_thread_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_network_thread_member(thread_id, auth.uid()));
DROP POLICY IF EXISTS "network_thread_members_insert_by_creator" ON public.network_thread_members;
CREATE POLICY "network_thread_members_insert_by_creator" ON public.network_thread_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.network_threads t WHERE t.id = thread_id AND t.created_by = auth.uid()));
DROP POLICY IF EXISTS "network_thread_members_delete_self" ON public.network_thread_members;
CREATE POLICY "network_thread_members_delete_self" ON public.network_thread_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.network_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.network_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  channel_type text NOT NULL DEFAULT 'network',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_network_messages_thread ON public.network_messages(thread_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_messages TO authenticated;
GRANT ALL ON public.network_messages TO service_role;
ALTER TABLE public.network_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "network_messages_select_members" ON public.network_messages;
CREATE POLICY "network_messages_select_members" ON public.network_messages FOR SELECT TO authenticated USING (public.is_network_thread_member(thread_id, auth.uid()));
DROP POLICY IF EXISTS "network_messages_insert_members" ON public.network_messages;
CREATE POLICY "network_messages_insert_members" ON public.network_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_network_thread_member(thread_id, auth.uid()));
DROP POLICY IF EXISTS "network_messages_update_members" ON public.network_messages;
CREATE POLICY "network_messages_update_members" ON public.network_messages FOR UPDATE TO authenticated USING (public.is_network_thread_member(thread_id, auth.uid())) WITH CHECK (public.is_network_thread_member(thread_id, auth.uid()));