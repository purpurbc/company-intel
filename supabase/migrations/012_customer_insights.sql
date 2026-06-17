alter table customer_account
  add column if not exists customer_labels jsonb not null default '[]'::jsonb,
  add column if not exists why_fit text,
  add column if not exists pain_points text,
  add column if not exists buying_trigger text,
  add column if not exists outcome text,
  add column if not exists tags jsonb not null default '[]'::jsonb;

create index if not exists idx_customer_account_labels
  on customer_account using gin (customer_labels);

create index if not exists idx_customer_account_tags
  on customer_account using gin (tags);
