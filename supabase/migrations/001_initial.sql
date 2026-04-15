-- ============================================================
-- Seat Mapping App — Initial Schema
-- Run this in your Supabase project → SQL Editor
-- ============================================================

-- Enable realtime for both tables (needed for live subscriptions)
-- (Supabase enables this per-table via the Replication settings,
--  but we also add it here for convenience)

-- ── seats ────────────────────────────────────────────────────
create table if not exists public.seats (
  id          text primary key,
  label       text        not null,
  row_num     integer     not null default 0,
  col_num     integer     not null default 0,
  status      text        not null default 'available'
                check (status in ('available','selected','pending','approved')),
  campaign_id text,
  booking_id  text,
  group_id    text        not null,
  group_name  text        not null,
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists seats_updated_at on public.seats;
create trigger seats_updated_at
  before update on public.seats
  for each row execute procedure public.set_updated_at();

-- ── bookings ─────────────────────────────────────────────────
create table if not exists public.bookings (
  id           text primary key,
  seat_id      text        not null references public.seats(id) on delete cascade,
  seat_label   text        not null,
  campaign_id  text        not null,
  campaign_name text       not null,
  user_id      text        not null,
  username     text        not null,
  status       text        not null default 'pending'
                 check (status in ('pending','approved','rejected')),
  start_date   text        not null,
  end_date     text        not null,
  timestamp    bigint      not null,
  created_at   timestamptz not null default now()
);

-- ── Row-Level Security (RLS) ─────────────────────────────────
-- Using anon key with open policies for the demo.
-- For production: restrict based on auth.uid().

alter table public.seats    enable row level security;
alter table public.bookings enable row level security;

-- Allow all operations for anonymous users (demo/test env)
create policy "allow_all_seats"    on public.seats    for all using (true) with check (true);
create policy "allow_all_bookings" on public.bookings for all using (true) with check (true);

-- ── Realtime Publication ──────────────────────────────────────
-- Add both tables to the default realtime publication so
-- supabase-js postgres_changes subscriptions work.
alter publication supabase_realtime add table public.seats;
alter publication supabase_realtime add table public.bookings;
