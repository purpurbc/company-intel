create extension if not exists pgcrypto;

create table if not exists sales_offer (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  target text,
  saved_segment_id uuid references saved_segment(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_account (
  id uuid primary key default gen_random_uuid(),
  org_nr text not null references company(org_nr) on delete cascade,
  connection_text text,
  fit_score integer not null default 0 check (fit_score >= 0 and fit_score <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_nr)
);

create table if not exists sales_offer_customer (
  offer_id uuid not null references sales_offer(id) on delete cascade,
  customer_id uuid not null references customer_account(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (offer_id, customer_id)
);

create index if not exists idx_sales_offer_updated
  on sales_offer (updated_at desc);

create index if not exists idx_sales_offer_segment
  on sales_offer (saved_segment_id);

create index if not exists idx_customer_account_updated
  on customer_account (updated_at desc);

create index if not exists idx_sales_offer_customer_customer
  on sales_offer_customer (customer_id);
