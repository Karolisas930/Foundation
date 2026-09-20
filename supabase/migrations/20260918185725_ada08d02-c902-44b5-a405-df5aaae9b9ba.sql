CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  lead_id text,
  score integer,
  read boolean NOT NULL DEFAULT false,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipient_id, type, lead_id)
);
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx ON public.notifications(recipient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
CREATE POLICY notifications_insert_own ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = recipient_id);
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = recipient_id);
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  vat_id text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text DEFAULT 'DE',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clients_owner_idx ON public.clients(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clients_select_own ON public.clients;
CREATE POLICY clients_select_own ON public.clients FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS clients_insert_own ON public.clients;
CREATE POLICY clients_insert_own ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS clients_update_own ON public.clients;
CREATE POLICY clients_update_own ON public.clients FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS clients_delete_own ON public.clients;
CREATE POLICY clients_delete_own ON public.clients FOR DELETE TO authenticated USING (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS clients_set_updated_at ON public.clients;
CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  number text,
  status text NOT NULL DEFAULT 'draft',
  mode text,
  client_name text,
  client_email text,
  client_address text,
  client_vat_id text,
  summary text,
  fixed_amount numeric(14,2) DEFAULT 0,
  hourly_rate numeric(14,2) DEFAULT 0,
  hours numeric(10,2) DEFAULT 0,
  surcharge_night_pct numeric(6,2) DEFAULT 0,
  surcharge_weekend_pct numeric(6,2) DEFAULT 0,
  surcharge_holiday_pct numeric(6,2) DEFAULT 0,
  vat_rate numeric(6,2) DEFAULT 19,
  subtotal numeric(14,2) DEFAULT 0,
  surcharge_total numeric(14,2) DEFAULT 0,
  net_total numeric(14,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) DEFAULT 0,
  gross_total numeric(14,2) NOT NULL DEFAULT 0,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  parent_invoice_number text,
  issued_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_owner_created_idx ON public.invoices(owner_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_select_own ON public.invoices;
CREATE POLICY invoices_select_own ON public.invoices FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS invoices_insert_own ON public.invoices;
CREATE POLICY invoices_insert_own ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS invoices_update_own ON public.invoices;
CREATE POLICY invoices_update_own ON public.invoices FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS invoices_delete_own ON public.invoices;
CREATE POLICY invoices_delete_own ON public.invoices FOR DELETE TO authenticated USING (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS invoices_set_updated_at ON public.invoices;
CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_date date NOT NULL,
  vendor text,
  amount_cents integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'material',
  file_path text,
  file_mime text,
  ocr_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS receipts_owner_date_idx ON public.receipts(owner_id, receipt_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS receipts_select_own ON public.receipts;
CREATE POLICY receipts_select_own ON public.receipts FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS receipts_insert_own ON public.receipts;
CREATE POLICY receipts_insert_own ON public.receipts FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS receipts_update_own ON public.receipts;
CREATE POLICY receipts_update_own ON public.receipts FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS receipts_delete_own ON public.receipts;
CREATE POLICY receipts_delete_own ON public.receipts FOR DELETE TO authenticated USING (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS receipts_set_updated_at ON public.receipts;
CREATE TRIGGER receipts_set_updated_at BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid,
  trip_date date NOT NULL,
  from_location text,
  to_location text,
  km numeric(10,2) NOT NULL DEFAULT 0,
  purpose text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trips_owner_date_idx ON public.trips(owner_id, trip_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trips_select_own ON public.trips;
CREATE POLICY trips_select_own ON public.trips FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS trips_insert_own ON public.trips;
CREATE POLICY trips_insert_own ON public.trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS trips_update_own ON public.trips;
CREATE POLICY trips_update_own ON public.trips FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS trips_delete_own ON public.trips;
CREATE POLICY trips_delete_own ON public.trips FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.finanz_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reserve_percent numeric(6,2) NOT NULL DEFAULT 30.0,
  km_rate_cents integer NOT NULL DEFAULT 30,
  connected_email text,
  connected_email_provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finanz_settings TO authenticated;
GRANT ALL ON public.finanz_settings TO service_role;
ALTER TABLE public.finanz_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finanz_settings_select_own ON public.finanz_settings;
CREATE POLICY finanz_settings_select_own ON public.finanz_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS finanz_settings_insert_own ON public.finanz_settings;
CREATE POLICY finanz_settings_insert_own ON public.finanz_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS finanz_settings_update_own ON public.finanz_settings;
CREATE POLICY finanz_settings_update_own ON public.finanz_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS finanz_settings_set_updated_at ON public.finanz_settings;
CREATE TRIGGER finanz_settings_set_updated_at BEFORE UPDATE ON public.finanz_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.staff_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid,
  member_name text,
  work_date date NOT NULL,
  hours numeric(6,2) NOT NULL DEFAULT 0,
  notes text,
  status text DEFAULT 'pending',
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  location_accuracy_m numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_hours_owner_date_idx ON public.staff_hours(owner_id, work_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_hours TO authenticated;
GRANT ALL ON public.staff_hours TO service_role;
ALTER TABLE public.staff_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS staff_hours_select_own ON public.staff_hours;
CREATE POLICY staff_hours_select_own ON public.staff_hours FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS staff_hours_insert_own ON public.staff_hours;
CREATE POLICY staff_hours_insert_own ON public.staff_hours FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS staff_hours_update_own ON public.staff_hours;
CREATE POLICY staff_hours_update_own ON public.staff_hours FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS staff_hours_delete_own ON public.staff_hours;
CREATE POLICY staff_hours_delete_own ON public.staff_hours FOR DELETE TO authenticated USING (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS staff_hours_set_updated_at ON public.staff_hours;
CREATE TRIGGER staff_hours_set_updated_at BEFORE UPDATE ON public.staff_hours FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.staff_document_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  kind text NOT NULL DEFAULT 'photo',
  captured_via text NOT NULL DEFAULT 'upload',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_doc_logs_owner_member_idx ON public.staff_document_logs(owner_id, member_id, uploaded_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_document_logs TO authenticated;
GRANT ALL ON public.staff_document_logs TO service_role;
ALTER TABLE public.staff_document_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS staff_doc_logs_select_own ON public.staff_document_logs;
CREATE POLICY staff_doc_logs_select_own ON public.staff_document_logs FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS staff_doc_logs_insert_own ON public.staff_document_logs;
CREATE POLICY staff_doc_logs_insert_own ON public.staff_document_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS staff_doc_logs_delete_own ON public.staff_document_logs;
CREATE POLICY staff_doc_logs_delete_own ON public.staff_document_logs FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'pending_review',
  file_path text,
  file_name text,
  mime_type text,
  ocr_json jsonb,
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verifications_user_kind_idx ON public.verifications(user_id, kind, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS verifications_select_own ON public.verifications;
CREATE POLICY verifications_select_own ON public.verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS verifications_insert_own ON public.verifications;
CREATE POLICY verifications_insert_own ON public.verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS verifications_update_own ON public.verifications;
CREATE POLICY verifications_update_own ON public.verifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS verifications_delete_own ON public.verifications;
CREATE POLICY verifications_delete_own ON public.verifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS verifications_set_updated_at ON public.verifications;
CREATE TRIGGER verifications_set_updated_at BEFORE UPDATE ON public.verifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  event_type text NOT NULL DEFAULT 'job',
  linked_job_id uuid,
  linked_match_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS calendar_events_owner_start_idx ON public.calendar_events(owner_id, starts_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calendar_events_select_own ON public.calendar_events;
CREATE POLICY calendar_events_select_own ON public.calendar_events FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS calendar_events_insert_own ON public.calendar_events;
CREATE POLICY calendar_events_insert_own ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS calendar_events_update_own ON public.calendar_events;
CREATE POLICY calendar_events_update_own ON public.calendar_events FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS calendar_events_delete_own ON public.calendar_events;
CREATE POLICY calendar_events_delete_own ON public.calendar_events FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.match_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  contractor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  net_amount_cents integer NOT NULL DEFAULT 0,
  platform_fee_bps integer NOT NULL DEFAULT 500,
  promotional_discount_cents integer NOT NULL DEFAULT 0,
  final_due_cents integer NOT NULL DEFAULT 0,
  promo_code text,
  status text NOT NULL DEFAULT 'open',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, contractor_id)
);
CREATE INDEX IF NOT EXISTS match_invoices_contractor_idx ON public.match_invoices(contractor_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_invoices TO authenticated;
GRANT ALL ON public.match_invoices TO service_role;
ALTER TABLE public.match_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS match_invoices_select_own ON public.match_invoices;
CREATE POLICY match_invoices_select_own ON public.match_invoices FOR SELECT TO authenticated USING (auth.uid() = contractor_id);
DROP POLICY IF EXISTS match_invoices_insert_own ON public.match_invoices;
CREATE POLICY match_invoices_insert_own ON public.match_invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = contractor_id);
DROP POLICY IF EXISTS match_invoices_update_own ON public.match_invoices;
CREATE POLICY match_invoices_update_own ON public.match_invoices FOR UPDATE TO authenticated USING (auth.uid() = contractor_id) WITH CHECK (auth.uid() = contractor_id);

CREATE TABLE IF NOT EXISTS public.profile_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_reports_reported_idx ON public.profile_reports(reported_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_reports TO authenticated;
GRANT ALL ON public.profile_reports TO service_role;
ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profile_reports_select_own_or_admin ON public.profile_reports;
CREATE POLICY profile_reports_select_own_or_admin ON public.profile_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS profile_reports_insert_own ON public.profile_reports;
CREATE POLICY profile_reports_insert_own ON public.profile_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id AND reporter_id <> reported_id);
DROP POLICY IF EXISTS profile_reports_update_admin ON public.profile_reports;
CREATE POLICY profile_reports_update_admin ON public.profile_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

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