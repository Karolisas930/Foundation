-- Owner-scoped access for private storage buckets.
-- Files are stored under "<auth.uid()>/..." so the first folder is the owner.
-- Buckets: receipts, verifications, staff-documents (create them as PRIVATE first).

DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['receipts','verifications','staff-documents'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_owner_select');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_owner_insert');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_owner_update');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_owner_delete');

    EXECUTE format($p$CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)$p$, b || '_owner_select', b);
    EXECUTE format($p$CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)$p$, b || '_owner_insert', b);
    EXECUTE format($p$CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)$p$, b || '_owner_update', b, b);
    EXECUTE format($p$CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)$p$, b || '_owner_delete', b);
  END LOOP;
END $$;
