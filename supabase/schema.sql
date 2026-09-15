-- ===========================================================================
-- EGE Football — player_accounts
--
-- One row per player email, recording whether that account has a password
-- yet. The portal reads it before showing a form: no row (or false) means
-- "first password, ask for it twice", true means "sign in".
--
-- Run this once in the Supabase SQL editor.
-- ===========================================================================

create table if not exists public.player_accounts (
  email        text primary key,
  password_set boolean     not null default false,
  updated_at   timestamptz not null default now()
);

alter table public.player_accounts enable row level security;

-- Anyone may read it. The only thing it reveals is whether one of six
-- already-public addresses has a password, which the portal needs before
-- anybody has signed in.
drop policy if exists "player_accounts are readable" on public.player_accounts;
create policy "player_accounts are readable"
  on public.player_accounts
  for select
  using (true);

-- A signed-in player may only ever claim their own row.
drop policy if exists "players insert their own row" on public.player_accounts;
create policy "players insert their own row"
  on public.player_accounts
  for insert
  to authenticated
  with check (email = auth.jwt() ->> 'email');

drop policy if exists "players update their own row" on public.player_accounts;
create policy "players update their own row"
  on public.player_accounts
  for update
  to authenticated
  using (email = auth.jwt() ->> 'email')
  with check (email = auth.jwt() ->> 'email');

-- No delete policy: rows are never removed from the browser.

-- ---------------------------------------------------------------------------
-- Admin notes
--
-- Changing a player's password is deliberately not possible from the site.
-- Do it in the dashboard under Authentication -> Users, where a user can be
-- edited and given a new password, or from a trusted server with the
-- service_role key and auth.admin.updateUserById(). Never put that key in
-- this repo.
--
-- If you clear a player's password and want the site to offer the first-time
-- form again, flip their row back:
--
--   update public.player_accounts set password_set = false
--   where email = 'someone@example.com';
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- Credits and inventory
--
-- One credit balance per player, and one row per thing they have bought.
-- A player sees and changes only their own; an admin sees and changes
-- everyone's.
-- ===========================================================================

create table if not exists public.admins (
  email text primary key
);

insert into public.admins (email) values ('stogzfam@gmail.com')
  on conflict (email) do nothing;

alter table public.admins enable row level security;

drop policy if exists "admins are readable" on public.admins;
create policy "admins are readable" on public.admins for select using (true);
-- No write policy at all: the admin list is changed here in SQL, never from
-- the browser.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = auth.jwt() ->> 'email'
  );
$$;

-- --- credits ---------------------------------------------------------------

create table if not exists public.player_credits (
  email      text primary key,
  credits    integer     not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.player_credits enable row level security;

drop policy if exists "credits readable by owner or admin" on public.player_credits;
create policy "credits readable by owner or admin"
  on public.player_credits for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "credits inserted by owner or admin" on public.player_credits;
create policy "credits inserted by owner or admin"
  on public.player_credits for insert to authenticated
  with check (email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "credits updated by owner or admin" on public.player_credits;
create policy "credits updated by owner or admin"
  on public.player_credits for update to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin())
  with check (email = auth.jwt() ->> 'email' or public.is_admin());

-- --- inventory -------------------------------------------------------------

create table if not exists public.player_inventory (
  id           uuid primary key default gen_random_uuid(),
  email        text        not null,
  item_key     text        not null,
  item_name    text        not null,
  target       text,                      -- which attribute a stat booster raises
  credits      integer     not null default 0,
  consumable   boolean     not null default false,
  active       boolean     not null default true,
  purchased_at timestamptz not null default now()
);

create index if not exists player_inventory_email_idx
  on public.player_inventory (email, purchased_at desc);

alter table public.player_inventory enable row level security;

drop policy if exists "inventory readable by owner or admin" on public.player_inventory;
create policy "inventory readable by owner or admin"
  on public.player_inventory for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "inventory inserted by owner or admin" on public.player_inventory;
create policy "inventory inserted by owner or admin"
  on public.player_inventory for insert to authenticated
  with check (email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "inventory updated by owner or admin" on public.player_inventory;
create policy "inventory updated by owner or admin"
  on public.player_inventory for update to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin())
  with check (email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "inventory deleted by owner or admin" on public.player_inventory;
create policy "inventory deleted by owner or admin"
  on public.player_inventory for delete to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

-- A used performance booster is deleted rather than kept: the inventory is
-- what a player still has, not a receipt book.

-- A season-bound item — Intel — records the season it was bought for, so it
-- can lapse when that season ends.
alter table public.player_inventory
  add column if not exists season integer;

-- What a purchase did to the player's ratings, as { attribute: delta }. A
-- training row keeps the roll it made, so it is never re-rolled.
alter table public.player_inventory
  add column if not exists effects jsonb not null default '{}'::jsonb;

-- Purchases are public, because a boosted overall has to show on a player's
-- card for everyone. Intel is the exception: only its owner and an admin see
-- which games scouts will be at.
-- Drop both names: the old one this replaces, and its own, so re-running the
-- file never fails on a policy that is already there. A failure here rolls the
-- whole script back in the Supabase editor, which is how a new column can go
-- missing after what looked like a successful run.
drop policy if exists "inventory readable by owner or admin" on public.player_inventory;
drop policy if exists "inventory readable to all but intel" on public.player_inventory;
create policy "inventory readable to all but intel"
  on public.player_inventory for select
  using (
    item_key <> 'intel'
    or email = auth.jwt() ->> 'email'
    or public.is_admin()
  );

-- Repeat purchases of the same thing are one row with a quantity, not a row
-- each: a player buying eighty rating points should leave a handful of rows,
-- not eighty. Training stays one row per purchase, because each carries its
-- own roll.
alter table public.player_inventory
  add column if not exists quantity integer not null default 1;

-- Anything bought before this existed is one row per purchase. Fold those
-- together first, or the unique index below will refuse to build.
--
-- The keeper is chosen once, in `ranked`, and both the update and the delete
-- read that same choice. Picking it twice by two different rules would write
-- the totals onto one row and keep the other.
with ranked as (
  select
    id, email, item_key, target,
    coalesce(target, '') as target_key,
    quantity, credits,
    row_number() over (
      partition by email, item_key, coalesce(target, '')
      order by purchased_at, id
    ) as seq
  from public.player_inventory
  where item_key = 'upgrade' or consumable
),
totals as (
  select email, item_key, target_key,
         sum(quantity) as total_quantity,
         sum(credits)  as total_credits
  from ranked
  group by email, item_key, target_key
),
keepers as (
  select ranked.id, totals.total_quantity, totals.total_credits
  from ranked
  join totals
    on totals.email = ranked.email
   and totals.item_key = ranked.item_key
   and totals.target_key = ranked.target_key
  where ranked.seq = 1
)
update public.player_inventory inv
set quantity = keepers.total_quantity,
    credits  = keepers.total_credits,
    effects  = case
                 when inv.item_key = 'upgrade' and inv.target is not null
                 then jsonb_build_object(inv.target, keepers.total_quantity)
                 else inv.effects
               end
from keepers
where inv.id = keepers.id;

delete from public.player_inventory inv
using (
  select id, row_number() over (
    partition by email, item_key, coalesce(target, '')
    order by purchased_at, id
  ) as seq
  from public.player_inventory
  where item_key = 'upgrade' or consumable
) dupes
where inv.id = dupes.id and dupes.seq > 1;

create unique index if not exists player_inventory_stacked_idx
  on public.player_inventory (email, item_key, coalesce(target, ''))
  where item_key = 'upgrade' or consumable;

-- PostgREST keeps its own picture of the schema, and a new column is invisible
-- to the API until that is refreshed. Supabase usually does it on its own; this
-- makes sure. Without it the site reports that it "could not find the 'quantity'
-- column of 'player_inventory' in the schema cache".
notify pgrst, 'reload schema';
