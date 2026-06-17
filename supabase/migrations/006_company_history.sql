-- Company history and signal layer.
-- The company table remains the current-state table; these tables store only
-- detected changes and derived business events.

create table if not exists ingestion_run (
  id bigserial primary key,
  source text not null default 'scb_je',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_seen int not null default 0,
  records_new int not null default 0,
  records_changed int not null default 0,
  status text not null default 'running',
  error text
);

create table if not exists company_change (
  id bigserial primary key,
  org_nr text not null references company(org_nr) on delete cascade,
  field_name text not null,
  old_value text,
  new_value text,
  old_label text,
  new_label text,
  detected_at timestamptz not null default now(),
  ingestion_run_id bigint references ingestion_run(id),
  importance int not null default 1
);

create table if not exists business_event (
  id bigserial primary key,
  org_nr text not null references company(org_nr) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  detected_at timestamptz not null default now(),
  ingestion_run_id bigint references ingestion_run(id),
  company_change_ids bigint[],
  importance int not null default 1
);

create index if not exists idx_ingestion_run_started
  on ingestion_run(started_at desc);

create index if not exists idx_company_change_org_nr_detected
  on company_change(org_nr, detected_at desc);

create index if not exists idx_company_change_field_detected
  on company_change(field_name, detected_at desc);

create index if not exists idx_company_change_run
  on company_change(ingestion_run_id);

create index if not exists idx_business_event_org_nr_detected
  on business_event(org_nr, detected_at desc);

create index if not exists idx_business_event_type_detected
  on business_event(event_type, detected_at desc);

create index if not exists idx_business_event_run
  on business_event(ingestion_run_id);
