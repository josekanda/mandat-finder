-- Migration 0002: fix schema to match app requirements

-- 1. Add missing columns to prospects
alter table prospects
  add column if not exists notes      text,
  add column if not exists source     text,
  add column if not exists type_bien  text;

-- 2. Add agence_id to zones for multi-tenant isolation
alter table zones
  add column if not exists agence_id uuid references agences(id);

-- 3. Enable RLS on zones
alter table zones enable row level security;

drop policy if exists "agence voit ses zones" on zones;
drop policy if exists "agence gere ses zones" on zones;

create policy "agence voit ses zones"
  on zones for select
  to authenticated
  using (agence_id = (select agence_id from users where id = auth.uid()));

create policy "agence gere ses zones"
  on zones for all
  to authenticated
  using (agence_id = (select agence_id from users where id = auth.uid()))
  with check (agence_id = (select agence_id from users where id = auth.uid()));

-- 4. Drop obsolete staging table
drop table if exists prospects_raw;
