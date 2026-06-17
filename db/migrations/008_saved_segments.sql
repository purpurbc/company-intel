create extension if not exists pgcrypto;

create table if not exists saved_segment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  filters jsonb not null default '{}'::jsonb,
  sort jsonb not null default '{}'::jsonb,
  visibility text not null default 'private',
  intent text,
  notes text,
  match_profile_id uuid,
  source text not null default 'manual',
  result_count integer,
  last_result_count_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_saved_segment_user_updated
  on saved_segment (user_id, updated_at desc);

create index if not exists idx_saved_segment_user_name
  on saved_segment (user_id, lower(name));
