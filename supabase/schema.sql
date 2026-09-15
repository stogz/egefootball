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

-- ===========================================================================
-- Boosters stuck on games
--
-- One row per sticker on a game. Applying one takes it off the inventory
-- stack; peeling it off puts it back. Once the game has been played the
-- sticker stays where it is.
-- ===========================================================================

create table if not exists public.game_boosters (
  id         uuid primary key default gen_random_uuid(),
  email      text        not null,
  season     integer     not null,
  week       integer     not null,
  item_key   text        not null,
  item_name  text        not null,
  applied_at timestamptz not null default now(),
  unique (email, season, week)          -- one sticker per game
);

create index if not exists game_boosters_email_idx
  on public.game_boosters (email, season, week);

alter table public.game_boosters enable row level security;

-- A sticker is private. Only the player who stuck it on and an admin can see
-- what is riding on which game — nobody gets to scout the opposition's
-- boosters. Hiding it in the interface alone would mean nothing, since the
-- anon key can query this table directly.
drop policy if exists "game boosters are readable" on public.game_boosters;
drop policy if exists "game boosters readable by owner or admin" on public.game_boosters;
create policy "game boosters readable by owner or admin"
  on public.game_boosters for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "game boosters placed by owner or admin" on public.game_boosters;
create policy "game boosters placed by owner or admin"
  on public.game_boosters for insert to authenticated
  with check (email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "game boosters removed by owner or admin" on public.game_boosters;
create policy "game boosters removed by owner or admin"
  on public.game_boosters for delete to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

notify pgrst, 'reload schema';

-- ===========================================================================
-- Credit awards
--
-- The ledger of every credit handed out rather than spent: the flat offseason
-- allowance, touchdowns as they are posted, and anything an admin adds by
-- hand off the earnings table.
--
-- `award_key` is what earned it, and it is unique per player per season, so
-- paying an award twice is impossible however many times the browser asks.
-- That is what lets any page top a balance up on load without keeping track
-- of whether it already has.
-- ===========================================================================

create table if not exists public.credit_awards (
  id         uuid primary key default gen_random_uuid(),
  email      text        not null,
  season     integer     not null,
  award_key  text        not null,
  credits    integer     not null,
  note       text,
  awarded_at timestamptz not null default now(),
  unique (email, season, award_key)
);

create index if not exists credit_awards_email_idx
  on public.credit_awards (email, season);

alter table public.credit_awards enable row level security;

-- Readable by the player it belongs to and by an admin. What a player has
-- earned is their own business; the season log an admin exports needs all of
-- it.
drop policy if exists "awards readable by owner or admin" on public.credit_awards;
create policy "awards readable by owner or admin"
  on public.credit_awards for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

-- No insert, update or delete policy: awards are only ever written through
-- pay_credit_awards() below, which is the only thing that can also move the
-- balance in the same breath.

-- ---------------------------------------------------------------------------
-- Paying them
--
-- Inserting the award and adding the credits have to happen together or not
-- at all: crediting first and dying would pay twice on the next load, and
-- inserting first and dying would never pay at all. One function, one
-- transaction, and the unique index decides what is new.
--
-- What it returns is what it actually paid, which is 0 on every call after
-- the first for the same awards.
--
-- On trust: the credits come from the browser, because what a touchdown is
-- worth is worked out from the schedule in data/schedule.js, and Postgres has
-- no copy of it. A player could already set their own balance directly — the
-- update policy on player_credits allows it, because buying things needs it —
-- so this is not a new hole. It is still worth closing the easy half of it:
-- for anyone who is not an admin, an award has to look like one of the two
-- kinds the site issues, and cannot be worth more than the biggest either
-- kind could honestly be. An admin's awards are whatever they type, which is
-- the point of them.
-- ---------------------------------------------------------------------------

create or replace function public.pay_credit_awards(
  p_email  text,
  p_season integer,
  p_awards jsonb            -- [{ "key": "...", "credits": 10, "note": "..." }, ...]
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller text := auth.jwt() ->> 'email';
  v_admin  boolean := public.is_admin();
  v_paid   integer := 0;
begin
  if v_caller is null then
    raise exception 'sign in first';
  end if;
  if lower(v_caller) <> lower(p_email) and not v_admin then
    raise exception 'that is not your account';
  end if;
  if p_awards is null or jsonb_typeof(p_awards) <> 'array' then
    return 0;
  end if;

  with incoming as (
    select
      a ->> 'key'                             as award_key,
      coalesce((a ->> 'credits')::integer, 0) as credits,
      a ->> 'note'                            as note
    from jsonb_array_elements(p_awards) as a
  ),
  allowed as (
    select * from incoming
    where credits > 0
      and award_key is not null
      and (
        v_admin
        or (award_key ~ '^offseason-[0-9]{4}$' and credits <= 60)
        or (award_key ~ '^td-w[0-9]{1,2}$'     and credits <= 60)
      )
  ),
  inserted as (
    insert into public.credit_awards (email, season, award_key, credits, note)
    select p_email, p_season, award_key, credits, note from allowed
    on conflict (email, season, award_key) do nothing
    returning credits
  )
  select coalesce(sum(credits), 0) into v_paid from inserted;

  if v_paid > 0 then
    insert into public.player_credits as pc (email, credits, updated_at)
    values (p_email, v_paid, now())
    on conflict (email) do update
      set credits = pc.credits + v_paid,
          updated_at = now();
  end if;

  return v_paid;
end;
$$;

revoke all on function public.pay_credit_awards(text, integer, jsonb) from public;
grant execute on function public.pay_credit_awards(text, integer, jsonb) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- Published weeks
--
-- A season file can hold every result of the year and the site will still
-- show none of them. A week becomes real when a row lands here.
--
-- This is deliberately not in the repository. The numbers are, but whether
-- they are out is a switch the admin throws from the admin page, so a week
-- can be held back while a booster somebody used after the file was written
-- is put right — and so a week can be pulled back again while testing.
-- ===========================================================================

create table if not exists public.published_weeks (
  season       integer     not null,
  week         integer     not null,
  published_at timestamptz not null default now(),
  posted_at    timestamptz,               -- when Discord got it, if it has
  primary key (season, week)
);

alter table public.published_weeks enable row level security;

-- Everyone reads it, signed in or not: it is what decides whether a visitor
-- sees a score at all, and the site is public.
drop policy if exists "published weeks are readable" on public.published_weeks;
create policy "published weeks are readable"
  on public.published_weeks for select
  using (true);

drop policy if exists "published weeks written by an admin" on public.published_weeks;
create policy "published weeks written by an admin"
  on public.published_weeks for insert to authenticated
  with check (public.is_admin());

drop policy if exists "published weeks updated by an admin" on public.published_weeks;
create policy "published weeks updated by an admin"
  on public.published_weeks for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Pulling a week back is an admin's, and is meant to be easy: testing this
-- means publishing and unpublishing the same week over and over.
drop policy if exists "published weeks removed by an admin" on public.published_weeks;
create policy "published weeks removed by an admin"
  on public.published_weeks for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Boosters, and why game_boosters stays small
--
-- A sticker a player puts on a game still lands in game_boosters, because
-- that is a live thing a player does to a fixture that has not been played.
-- Once the week is published the admin writes the booster into stats/{year}.js
-- and that is where it lives for good — so the row can go, and the table
-- never carries more than the weeks still to come. The admin page clears them
-- a season at a time.
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
