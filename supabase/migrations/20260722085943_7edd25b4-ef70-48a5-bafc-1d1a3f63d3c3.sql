DO $$
BEGIN
  IF to_regclass('public.team_members') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "team_members_select_owner_or_self" ON public.team_members;
    DROP POLICY IF EXISTS "team_members_insert_owner_only" ON public.team_members;
    DROP POLICY IF EXISTS "team_members_update_owner_only" ON public.team_members;
    DROP POLICY IF EXISTS "team_members_delete_owner_only" ON public.team_members;

    EXECUTE $p$CREATE POLICY "team_members_select_owner_or_self"
      ON public.team_members FOR SELECT
      USING (owner_id = auth.uid() OR member_user_id = auth.uid())$p$;

    EXECUTE $p$CREATE POLICY "team_members_insert_owner_only"
      ON public.team_members FOR INSERT
      WITH CHECK (owner_id = auth.uid())$p$;

    EXECUTE $p$CREATE POLICY "team_members_update_owner_only"
      ON public.team_members FOR UPDATE
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid())$p$;

    EXECUTE $p$CREATE POLICY "team_members_delete_owner_only"
      ON public.team_members FOR DELETE
      USING (owner_id = auth.uid())$p$;
  END IF;
END $$;