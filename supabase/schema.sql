-- Waypoint Itinerary Planner — Supabase Schema
-- Run in Supabase SQL Editor when using production auth/DB

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  destination text not null,
  destination_country text default '',
  start_date date not null,
  day_count int not null check (day_count between 1 and 14),
  status text not null default 'draft' check (status in ('draft','generating','ready','archived')),
  generation_meta jsonb,
  share_token text unique,
  preferences jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.trip_days (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  day_index int not null,
  date date not null,
  label text not null,
  total_active_minutes int default 0,
  total_travel_minutes int default 0,
  is_overpacked boolean default false,
  unique(trip_id, day_index)
);

create table if not exists public.stops (
  id uuid primary key default uuid_generate_v4(),
  trip_day_id uuid references public.trip_days(id) on delete cascade not null,
  sort_order int not null,
  name text not null,
  category text not null,
  description text,
  duration_minutes int not null,
  travel_from_previous_minutes int default 0,
  suggested_start_time text,
  suggested_end_time text,
  lat double precision,
  lng double precision,
  place_id text,
  opening_hours text,
  ai_metadata jsonb
);

alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.stops enable row level security;
alter table public.profiles enable row level security;

create policy "Users can manage own trips" on public.trips
  for all using (auth.uid() = user_id);

create policy "Users can manage own trip days" on public.trip_days
  for all using (
    trip_id in (select id from public.trips where user_id = auth.uid())
  );

create policy "Users can manage own stops" on public.stops
  for all using (
    trip_day_id in (
      select td.id from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where t.user_id = auth.uid()
    )
  );

create policy "Public read shared trips" on public.trips
  for select using (share_token is not null);

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
