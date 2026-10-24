-- =============================================================================
-- Obstacles table for the Boston Route Planner.
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--
-- Mirrors the shared `Obstacle` type in src/types/index.ts:
--   id, lat, lng, type, description, photoUrl?, createdAt, expiresAt
-- The DB uses snake_case columns; the client maps them to camelCase.
-- =============================================================================

-- Obstacle categories. Keep in sync with ObstacleType in src/types/index.ts.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'obstacle_type') then
    create type obstacle_type as enum (
      'blocked_lane',
      'construction',
      'broken_ramp',
      'surface_damage',
      'other'
    );
  end if;
end$$;

create table if not exists public.obstacles (
  id          uuid primary key default gen_random_uuid(),
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  type        obstacle_type not null,
  description text not null default '',
  photo_url   text,
  created_at  timestamptz not null default now(),
  -- Reports default to expiring 7 days after creation.
  expires_at  timestamptz not null default (now() + interval '7 days')
);

-- Speed up the common "obstacles in these map bounds, not expired" query.
create index if not exists obstacles_bounds_idx on public.obstacles (lat, lng);
create index if not exists obstacles_expires_at_idx on public.obstacles (expires_at);

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- Hackathon-friendly policy: anyone (anon key) may read active obstacles and
-- submit a report. Tighten before any real deployment (e.g. require auth to
-- insert, add rate limiting, moderation, soft-delete).
-- -----------------------------------------------------------------------------
alter table public.obstacles enable row level security;

drop policy if exists "Public can read active obstacles" on public.obstacles;
create policy "Public can read active obstacles"
  on public.obstacles
  for select
  using (expires_at > now());

drop policy if exists "Public can report obstacles" on public.obstacles;
create policy "Public can report obstacles"
  on public.obstacles
  for insert
  with check (true);
