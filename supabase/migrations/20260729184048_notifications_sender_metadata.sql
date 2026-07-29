-- Adds the columns quote_sent / message_sent notification inserts already
-- rely on (sender_id, match_id, message, metadata), which were missing from
-- every prior notifications migration. Also relaxes `title` (not used by
-- those inserts) and fixes the insert policy so a sender can create a
-- notification for someone else - the previous policy only allowed a user
-- to insert a notification for themselves, which silently blocked both
-- quote_sent and message_sent under RLS.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS match_id uuid,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

ALTER TABLE public.notifications
  ALTER COLUMN title DROP NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_match_idx
  ON public.notifications(match_id);

DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Some earlier migrations created a single combined "manage own" policy
-- instead of separate select/insert/update/delete policies. Replace it too,
-- if present, so the fix applies regardless of which migration path a given
-- environment took.
DROP POLICY IF EXISTS notifications_manage_own ON public.notifications;
CREATE POLICY notifications_manage_own ON public.notifications
  FOR ALL TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id OR auth.uid() = sender_id);
