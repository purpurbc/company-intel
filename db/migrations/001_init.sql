-- Extensions (optional but useful)
create extension if not exists pg_trgm;

-- 1) Company table (maps closely to CompanyJE)
create table if not exists company (
  org_nr text primary key,
  pe_org_nr text not null,

  company_name text not null,

  co_address text,
  post_address text,
  post_nr text,
  post_ort text,

  seat_municipality_code text,
  seat_municipality text,
  seat_county_code text,
  seat_county text,
  aregion_code text,
  aregion text,

  num_workplaces int,

  size_class_code text,
  size_class text,

  company_status_code text,
  company_status text,

  skv_registered_code text,
  skv_registered text,

  legal_form_code text,
  legal_form text,

  reklam_code text,
  reklam text,
  utskick_code text,
  utskick text,

  start_date date,
  end_date date,
  registration_date date,

  bransch_1_code text,
  bransch_1p_code text,
  bransch_1 text,
  avdelning_1_code text,
  avdelning_1 text,

  export_import_mark text,

  turnover_year int,
  turnover_size_code text,
  turnover_size text,
  turnover_fin_size_code text,
  turnover_fin_size text,

  owner_category_code text,
  owner_category text,

  phone text,
  email text,

  private_public_code text,
  private_public text,

  employer_status_code text,
  employer_status text,
  vat_status_code text,
  vat_status text,
  f_tax_status_code text,
  f_tax_status text,

  company_state_code text,
  company_state text,

  num_firms int,
  firma text,

  sector_code text,
  sector text,

  sme_size_code text,
  sme_size text,

  female_share text,
  male_share text,

  owner_country_code text,
  owner_country text,
  owner_name text,

  foreign_ownership_code text,
  foreign_ownership text,

  -- metadata
  source_payload jsonb,
  scb_updated_at timestamptz,
  ingested_at timestamptz not null default now()
);

-- indexes for search + filtering
create index if not exists idx_company_name_trgm on company using gin (company_name gin_trgm_ops);
create index if not exists idx_company_postort on company (post_ort);
create index if not exists idx_company_county on company (seat_county);
create index if not exists idx_company_municipality on company (seat_municipality);
create index if not exists idx_company_sni on company (bransch_1_code);
create index if not exists idx_company_status on company (company_status_code);
create index if not exists idx_company_turnover on company (turnover_size_code);
create index if not exists idx_company_employees on company (size_class_code);

-- 2) Workplace table (for later; you can seed it later)
create table if not exists workplace (
  cfar_nr text primary key,
  org_nr text not null references company(org_nr) on delete cascade,

  name text,

  co_address text,
  post_address text,
  post_nr text,
  post_ort text,

  visit_address text,
  visit_post_ort text,

  municipality_code text,
  municipality text,
  county_code text,
  county text,

  bransch_1_code text,
  bransch_1p_code text,
  bransch_1 text,
  avdelning_1_code text,
  avdelning_1 text,

  phone text,
  email text,

  source_payload jsonb,
  scb_updated_at timestamptz,
  ingested_at timestamptz not null default now()
);

create index if not exists idx_workplace_orgnr on workplace (org_nr);
create index if not exists idx_workplace_municipality on workplace (municipality);
create index if not exists idx_workplace_county on workplace (county);

-- 3) Enrichment tables (next pipeline steps)
create table if not exists website_resolution (
  org_nr text primary key references company(org_nr) on delete cascade,
  domain text,
  confidence numeric,
  evidence jsonb,
  status text not null default 'empty', -- empty|queued|running|done|failed
  error text,
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists psi_audit (
  org_nr text primary key references company(org_nr) on delete cascade,
  domain text,
  metrics jsonb,
  screenshot_url text,
  status text not null default 'empty',
  error text,
  audited_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists ai_insight (
  org_nr text primary key references company(org_nr) on delete cascade,
  input_hash text,
  output jsonb,
  status text not null default 'empty',
  error text,
  created_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 4) Job log (queue trace)
create table if not exists job_log (
  job_id text primary key,
  job_type text not null, -- website_resolve|psi_audit|ai_analyze|scb_seed
  org_nr text,
  status text not null default 'queued',
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists idx_job_log_orgnr on job_log (org_nr);
create index if not exists idx_job_log_type on job_log (job_type);