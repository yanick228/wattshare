-- ============================================
-- WattShare — Migration Supabase
-- Répartition de factures d'électricité
-- ============================================

-- 1. Table des profils utilisateurs
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

drop policy if exists "Les utilisateurs peuvent voir leur propre profil" on public.profiles;
create policy "Les utilisateurs peuvent voir leur propre profil"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Les utilisateurs peuvent modifier leur propre profil" on public.profiles;
create policy "Les utilisateurs peuvent modifier leur propre profil"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Les utilisateurs peuvent insérer leur propre profil" on public.profiles;
create policy "Les utilisateurs peuvent insérer leur propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger pour créer automatiquement un profil lors de l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Table des propriétés (maisons)
create table if not exists public.properties (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text,
  meter_id text,
  created_at timestamptz default now() not null
);

alter table public.properties enable row level security;

drop policy if exists "Les propriétaires peuvent voir leurs propriétés" on public.properties;
create policy "Les propriétaires peuvent voir leurs propriétés"
  on public.properties for select
  using (auth.uid() = owner_id);

drop policy if exists "Les propriétaires peuvent créer des propriétés" on public.properties;
create policy "Les propriétaires peuvent créer des propriétés"
  on public.properties for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Les propriétaires peuvent modifier leurs propriétés" on public.properties;
create policy "Les propriétaires peuvent modifier leurs propriétés"
  on public.properties for update
  using (auth.uid() = owner_id);

drop policy if exists "Les propriétaires peuvent supprimer leurs propriétés" on public.properties;
create policy "Les propriétaires peuvent supprimer leurs propriétés"
  on public.properties for delete
  using (auth.uid() = owner_id);

-- 3. Table des locataires
create table if not exists public.tenants (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  full_name text not null,
  email text,
  phone text,
  sub_meter_id text not null,
  move_in_date date not null default current_date,
  move_out_date date,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

alter table public.tenants enable row level security;

drop policy if exists "Accès locataires via propriété" on public.tenants;
create policy "Accès locataires via propriété"
  on public.tenants for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Création locataires via propriété" on public.tenants;
create policy "Création locataires via propriété"
  on public.tenants for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Modification locataires via propriété" on public.tenants;
create policy "Modification locataires via propriété"
  on public.tenants for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Suppression locataires via propriété" on public.tenants;
create policy "Suppression locataires via propriété"
  on public.tenants for delete
  using (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- 4. Table des factures
create table if not exists public.bills (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  total_amount numeric(12, 2) not null,
  total_kwh numeric(12, 2) not null,
  provider text default 'ENEO',
  bill_reference text,
  status text default 'draft' not null check (status in ('draft', 'calculated', 'finalized')),
  created_at timestamptz default now() not null
);

alter table public.bills enable row level security;

drop policy if exists "Accès factures via propriété" on public.bills;
create policy "Accès factures via propriété"
  on public.bills for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = bills.property_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Création factures via propriété" on public.bills;
create policy "Création factures via propriété"
  on public.bills for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = bills.property_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Modification factures via propriété" on public.bills;
create policy "Modification factures via propriété"
  on public.bills for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = bills.property_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Suppression factures via propriété" on public.bills;
create policy "Suppression factures via propriété"
  on public.bills for delete
  using (
    exists (
      select 1 from public.properties
      where properties.id = bills.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- 5. Table des relevés de compteurs
create table if not exists public.meter_readings (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  bill_id uuid references public.bills(id) on delete cascade not null,
  previous_reading numeric(12, 2) not null,
  current_reading numeric(12, 2) not null,
  consumption numeric(12, 2) generated always as (current_reading - previous_reading) stored,
  reading_date timestamptz default now() not null,
  unique (tenant_id, bill_id)
);

alter table public.meter_readings enable row level security;

drop policy if exists "Accès relevés via facture" on public.meter_readings;
create policy "Accès relevés via facture"
  on public.meter_readings for select
  using (
    exists (
      select 1 from public.bills
      join public.properties on properties.id = bills.property_id
      where bills.id = meter_readings.bill_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Création relevés via facture" on public.meter_readings;
create policy "Création relevés via facture"
  on public.meter_readings for insert
  with check (
    exists (
      select 1 from public.bills
      join public.properties on properties.id = bills.property_id
      where bills.id = meter_readings.bill_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Modification relevés via facture" on public.meter_readings;
create policy "Modification relevés via facture"
  on public.meter_readings for update
  using (
    exists (
      select 1 from public.bills
      join public.properties on properties.id = bills.property_id
      where bills.id = meter_readings.bill_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Suppression relevés via facture" on public.meter_readings;
create policy "Suppression relevés via facture"
  on public.meter_readings for delete
  using (
    exists (
      select 1 from public.bills
      join public.properties on properties.id = bills.property_id
      where bills.id = meter_readings.bill_id
      and properties.owner_id = auth.uid()
    )
  );

-- 6. Table des parts de facture (répartition)
create table if not exists public.bill_shares (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references public.bills(id) on delete cascade not null,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  consumption_kwh numeric(12, 2) not null,
  consumption_percent numeric(5, 2) not null,
  amount_due numeric(12, 2) not null,
  payment_status text default 'unpaid' not null check (payment_status in ('unpaid', 'paid', 'partial')),
  paid_at timestamptz,
  unique (bill_id, tenant_id)
);

alter table public.bill_shares enable row level security;

drop policy if exists "Accès parts via facture" on public.bill_shares;
create policy "Accès parts via facture"
  on public.bill_shares for select
  using (
    exists (
      select 1 from public.bills
      join public.properties on properties.id = bills.property_id
      where bills.id = bill_shares.bill_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Création parts via facture" on public.bill_shares;
create policy "Création parts via facture"
  on public.bill_shares for insert
  with check (
    exists (
      select 1 from public.bills
      join public.properties on properties.id = bills.property_id
      where bills.id = bill_shares.bill_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Modification parts via facture" on public.bill_shares;
create policy "Modification parts via facture"
  on public.bill_shares for update
  using (
    exists (
      select 1 from public.bills
      join public.properties on properties.id = bills.property_id
      where bills.id = bill_shares.bill_id
      and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "Suppression parts via facture" on public.bill_shares;
create policy "Suppression parts via facture"
  on public.bill_shares for delete
  using (
    exists (
      select 1 from public.bills
      join public.properties on properties.id = bills.property_id
      where bills.id = bill_shares.bill_id
      and properties.owner_id = auth.uid()
    )
  );

-- Politiques de lecture publique pour les factures partagées aux locataires
drop policy if exists "Lecture publique factures partagées" on public.bills;
create policy "Lecture publique factures partagées"
  on public.bills for select
  to anon
  using (true);

drop policy if exists "Lecture publique parts factures" on public.bill_shares;
create policy "Lecture publique parts factures"
  on public.bill_shares for select
  to anon
  using (true);

drop policy if exists "Lecture publique relevés factures" on public.meter_readings;
create policy "Lecture publique relevés factures"
  on public.meter_readings for select
  to anon
  using (true);

drop policy if exists "Lecture publique locataires factures" on public.tenants;
create policy "Lecture publique locataires factures"
  on public.tenants for select
  to anon
  using (true);

drop policy if exists "Lecture publique propriétés factures" on public.properties;
create policy "Lecture publique propriétés factures"
  on public.properties for select
  to anon
  using (true);

-- Index pour accélérer les requêtes
create index if not exists idx_properties_owner on public.properties(owner_id);
create index if not exists idx_tenants_property on public.tenants(property_id);
create index if not exists idx_bills_property on public.bills(property_id);
create index if not exists idx_meter_readings_bill on public.meter_readings(bill_id);
create index if not exists idx_bill_shares_bill on public.bill_shares(bill_id);

-- Recharger le cache du schéma PostgREST
notify pgrst, 'reload schema';
