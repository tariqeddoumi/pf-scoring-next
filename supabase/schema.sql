-- Minimal schema (à exécuter dans le SQL Editor Supabase)

create table if not exists public.clients (
  client_code text primary key,
  label text not null,
  customer_type text,
  market_size text,
  created_at timestamp with time zone default now()
);

create table if not exists public.projects (
  project_id text primary key,
  project_name text not null,
  sector text,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.clients enable row level security;
alter table public.projects enable row level security;

create policy "clients readable" on public.clients for select using (true);
create policy "clients write by authenticated" on public.clients for insert with check (auth.role() = 'authenticated');

create policy "projects readable" on public.projects for select using (true);
create policy "projects write by authenticated" on public.projects for insert with check (auth.role() = 'authenticated');
