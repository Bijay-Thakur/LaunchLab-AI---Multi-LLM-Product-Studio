-- LaunchLab AI - Supabase schema
--
-- How to apply:
--   1. Open your Supabase project.
--   2. Open the SQL Editor.
--   3. Paste this entire file and click Run.
--
-- This creates two tables (profiles, launchlab_projects), enables Row Level
-- Security on both, and adds policies so each user can only read/write
-- their own rows. A trigger auto-creates a profile row when a user signs up.

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    email        text,
    full_name    text,
    avatar_url   text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles select own"  on public.profiles;
drop policy if exists "profiles insert own"  on public.profiles;
drop policy if exists "profiles update own"  on public.profiles;

create policy "profiles select own"
    on public.profiles for select
    using (auth.uid() = id);

create policy "profiles insert own"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "profiles update own"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Auto-create a profile row when a user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
        new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- launchlab_projects
-- ----------------------------------------------------------------------------

create table if not exists public.launchlab_projects (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    title           text not null,
    raw_idea        text not null,
    product_name    text,
    mode            text,
    package_json    jsonb not null,
    thumbnail_url   text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists launchlab_projects_user_id_created_at_idx
    on public.launchlab_projects (user_id, created_at desc);

alter table public.launchlab_projects enable row level security;

drop policy if exists "projects select own" on public.launchlab_projects;
drop policy if exists "projects insert own" on public.launchlab_projects;
drop policy if exists "projects update own" on public.launchlab_projects;
drop policy if exists "projects delete own" on public.launchlab_projects;

create policy "projects select own"
    on public.launchlab_projects for select
    using (auth.uid() = user_id);

create policy "projects insert own"
    on public.launchlab_projects for insert
    with check (auth.uid() = user_id);

create policy "projects update own"
    on public.launchlab_projects for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "projects delete own"
    on public.launchlab_projects for delete
    using (auth.uid() = user_id);
