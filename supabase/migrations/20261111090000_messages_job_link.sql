-- Link contractor questions to the job they are about.
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS messages_job_idx ON public.messages(job_id);
