
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'certificate',
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  merge_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS certificate_templates_owner_idx ON public.certificate_templates(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS certificate_templates_select_own ON public.certificate_templates;
CREATE POLICY certificate_templates_select_own ON public.certificate_templates FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS certificate_templates_insert_own ON public.certificate_templates;
CREATE POLICY certificate_templates_insert_own ON public.certificate_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS certificate_templates_update_own ON public.certificate_templates;
CREATE POLICY certificate_templates_update_own ON public.certificate_templates FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS certificate_templates_delete_own ON public.certificate_templates;
CREATE POLICY certificate_templates_delete_own ON public.certificate_templates FOR DELETE TO authenticated USING (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS certificate_templates_set_updated_at ON public.certificate_templates;
CREATE TRIGGER certificate_templates_set_updated_at BEFORE UPDATE ON public.certificate_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.certificate_issuances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  recipient_name text NOT NULL,
  recipient_email text,
  recipient_address text,
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  merged_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  rendered_path text,
  rendered_mime text,
  sent_via text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS certificate_issuances_owner_issued_idx ON public.certificate_issuances(owner_id, issued_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_issuances TO authenticated;
GRANT ALL ON public.certificate_issuances TO service_role;
ALTER TABLE public.certificate_issuances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS certificate_issuances_select_own ON public.certificate_issuances;
CREATE POLICY certificate_issuances_select_own ON public.certificate_issuances FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS certificate_issuances_insert_own ON public.certificate_issuances;
CREATE POLICY certificate_issuances_insert_own ON public.certificate_issuances FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS certificate_issuances_delete_own ON public.certificate_issuances;
CREATE POLICY certificate_issuances_delete_own ON public.certificate_issuances FOR DELETE TO authenticated USING (auth.uid() = owner_id);
