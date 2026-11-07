alter table public.profiles add column if not exists legal_info jsonb not null default '{}'::jsonb;
