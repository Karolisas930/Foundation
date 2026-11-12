-- Persist contractor invoices, site diary entries and verification documents.
CREATE TABLE IF NOT EXISTS public.contractor_invoices (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contractor_invoices TO authenticated;
GRANT ALL ON public.contractor_invoices TO service_role;
ALTER TABLE public.contractor_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own invoices" ON public.contractor_invoices;
CREATE POLICY "own invoices" ON public.contractor_invoices FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.site_diary_entries (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  media_key text,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_diary_entries TO authenticated;
GRANT ALL ON public.site_diary_entries TO service_role;
ALTER TABLE public.site_diary_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own diary" ON public.site_diary_entries;
CREATE POLICY "own diary" ON public.site_diary_entries FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('meisterbrief','handwerksrolle','other')),
  file_name text NOT NULL,
  mime text NOT NULL,
  size integer NOT NULL,
  media_key text NOT NULL,
  issuer text,
  issued_on date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_documents TO authenticated;
GRANT ALL ON public.verification_documents TO service_role;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own docs read" ON public.verification_documents;
CREATE POLICY "own docs read" ON public.verification_documents FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "own docs insert" ON public.verification_documents;
CREATE POLICY "own docs insert" ON public.verification_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND status = 'pending');
DROP POLICY IF EXISTS "own docs delete" ON public.verification_documents;
CREATE POLICY "own docs delete" ON public.verification_documents FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "admin review" ON public.verification_documents;
CREATE POLICY "admin review" ON public.verification_documents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
