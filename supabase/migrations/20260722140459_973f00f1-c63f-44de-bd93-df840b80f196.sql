
-- 1. Profiles table (minimal, matches columns used by network-chat.functions.ts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text,
  display_name text,
  full_name text,
  city text,
  avatar_url text,
  trades text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. is_verified_contractor helper (mirrors useUser.ts contractor logic)
CREATE OR REPLACE FUNCTION public.is_verified_contractor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND account_type IS NOT NULL
      AND account_type <> 'homeowner'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_verified_contractor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_verified_contractor(uuid) TO authenticated;

-- 3. network_threads
CREATE TABLE IF NOT EXISTS public.network_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_threads TO authenticated;
GRANT ALL ON public.network_threads TO service_role;

ALTER TABLE public.network_threads ENABLE ROW LEVEL SECURITY;

-- 4. network_thread_members
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

-- Helper: is caller a member of a thread (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_network_thread_member(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.network_thread_members
    WHERE thread_id = _thread_id AND user_id = _user_id
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_network_thread_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_network_thread_member(uuid, uuid) TO authenticated;

-- Policies: network_threads
CREATE POLICY "network_threads_select_members" ON public.network_threads
  FOR SELECT TO authenticated
  USING (public.is_network_thread_member(id, auth.uid()));

CREATE POLICY "network_threads_insert_own" ON public.network_threads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_verified_contractor(auth.uid()));

-- Policies: network_thread_members
CREATE POLICY "network_thread_members_select_own" ON public.network_thread_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_network_thread_member(thread_id, auth.uid()));

CREATE POLICY "network_thread_members_insert_by_creator" ON public.network_thread_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.network_threads t
      WHERE t.id = thread_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "network_thread_members_delete_self" ON public.network_thread_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 5. network_messages
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

CREATE POLICY "network_messages_select_members" ON public.network_messages
  FOR SELECT TO authenticated
  USING (public.is_network_thread_member(thread_id, auth.uid()));

CREATE POLICY "network_messages_insert_members" ON public.network_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_network_thread_member(thread_id, auth.uid())
  );

-- Recipients may mark messages as read; senders may edit their own message body.
CREATE POLICY "network_messages_update_members" ON public.network_messages
  FOR UPDATE TO authenticated
  USING (public.is_network_thread_member(thread_id, auth.uid()))
  WITH CHECK (public.is_network_thread_member(thread_id, auth.uid()));
