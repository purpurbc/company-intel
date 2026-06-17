create extension if not exists pgcrypto;

create table if not exists app_user (
  id uuid primary key default gen_random_uuid(),
  auth_provider text,
  auth_subject text,
  email text,
  display_name text,
  role text not null default 'user',
  company_org_nr text references company(org_nr) on delete set null,
  company_description text,
  ideal_customer_description text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into app_user (id, display_name, role)
values ('00000000-0000-0000-0000-000000000001', 'MVP User', 'user')
on conflict (id) do nothing;

insert into app_user (id, display_name, role)
select distinct user_id, 'Imported user', 'user'
from saved_segment
where user_id is not null
on conflict (id) do nothing;

create unique index if not exists idx_app_user_auth_identity
  on app_user (auth_provider, auth_subject)
  where auth_provider is not null and auth_subject is not null;

create unique index if not exists idx_app_user_email
  on app_user (lower(email))
  where email is not null;

create index if not exists idx_app_user_company
  on app_user (company_org_nr);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'saved_segment_user_id_fkey'
  ) then
    alter table saved_segment
      add constraint saved_segment_user_id_fkey
      foreign key (user_id) references app_user(id) on delete cascade;
  end if;
end $$;

alter table sales_offer
  add column if not exists user_id uuid;

update sales_offer
set user_id = '00000000-0000-0000-0000-000000000001'
where user_id is null;

alter table sales_offer
  alter column user_id set not null,
  alter column user_id set default '00000000-0000-0000-0000-000000000001';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sales_offer_user_id_fkey'
  ) then
    alter table sales_offer
      add constraint sales_offer_user_id_fkey
      foreign key (user_id) references app_user(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_sales_offer_user_updated
  on sales_offer (user_id, updated_at desc);

alter table customer_account
  add column if not exists user_id uuid;

update customer_account
set user_id = '00000000-0000-0000-0000-000000000001'
where user_id is null;

alter table customer_account
  alter column user_id set not null,
  alter column user_id set default '00000000-0000-0000-0000-000000000001';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customer_account_user_id_fkey'
  ) then
    alter table customer_account
      add constraint customer_account_user_id_fkey
      foreign key (user_id) references app_user(id) on delete cascade;
  end if;
end $$;

alter table customer_account
  drop constraint if exists customer_account_org_nr_key;

create unique index if not exists idx_customer_account_user_org
  on customer_account (user_id, org_nr);

create index if not exists idx_customer_account_user_updated
  on customer_account (user_id, updated_at desc);
