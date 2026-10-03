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
-- Does this account have a password?
--
-- player_accounts is a note about auth.users, and a note can be wrong. A
-- password set before this table existed, or a row whose write was lost on the
-- way, leaves the portal offering the first-password form to somebody who has
-- had a password for months -- every time they open it.
--
-- auth.users is the only thing that actually knows, and it is not readable
-- from a browser and should not be. So this function reads it instead and
-- answers the one question the portal asks. One boolean out, nothing else.
--
-- It does tell an anonymous caller whether an address has a password here. The
-- anon key already gives that away: signUp on an address that exists comes
-- back with an empty identities array, which is exactly how js/auth.js spots
-- the same thing today. This adds no reach -- it only costs nothing to ask,
-- where signUp would leave a half-made account behind.
-- ---------------------------------------------------------------------------

create or replace function public.account_has_password(p_email text)
returns boolean
language sql
stable
security definer
-- Pinned, because a SECURITY DEFINER function that resolves names through the
-- caller's search_path can be pointed at anything. auth.users below is
-- schema-qualified for the same reason.
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from auth.users u
     where lower(u.email) = lower(trim(p_email))
       and u.encrypted_password is not null
       and u.encrypted_password <> ''
  );
$$;

revoke all on function public.account_has_password(text) from public;
grant execute on function public.account_has_password(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin notes
--
-- Changing a player's password is deliberately not possible from the site.
-- Do it in the dashboard under Authentication -> Users, where a user can be
-- edited and given a new password, or from a trusted server with the
-- service_role key and auth.admin.updateUserById(). Never put that key in
-- this repo.
--
-- To put a player back on the first-time form, delete their user under
-- Authentication -> Users. The portal reads auth.users, so that is all it
-- takes -- and clear the stale note at the same time, since it is what the
-- portal falls back to:
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

-- What a purchase did to somebody's ratings is public, because a bought
-- overall is a permanent part of a player and has to read the same to a
-- passer-by as it does to the person who paid for it. Nothing else about the
-- purchase is.
--
-- The line between the two is the effects column, which is exactly the set of
-- rows the site reads for everyone: rating points and training carry the
-- attributes they moved, and every other thing in the shop carries {}. So a
-- booster sitting in the drawer, a QB connection, a chamber and Intel are all
-- the owner's and an admin's, and the rule needs no list of item keys to keep
-- up to date -- anything added to the shop later is private unless it changes
-- a rating.
--
-- This replaces "all but intel", which named the one private thing instead of
-- the public one and so left unused boosters readable to anyone with the anon
-- key. Nothing on the site drew them, but the rows went over the wire.
--
-- Drop every name this has had, so re-running the file never fails on a policy
-- that is already there. A failure here rolls the whole script back in the
-- Supabase editor, which is how a new column can go missing after what looked
-- like a successful run.
drop policy if exists "inventory readable by owner or admin" on public.player_inventory;
drop policy if exists "inventory readable to all but intel" on public.player_inventory;
drop policy if exists "inventory rating changes are public" on public.player_inventory;
create policy "inventory rating changes are public"
  on public.player_inventory for select
  using (
    effects <> '{}'::jsonb
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

-- A season takes five boosters at most: two 2.5x, three 2.0x and four 1.5x
-- (boosterSeasonLimit and each booster's seasonLimit in data/shop.js). The
-- page checks before it sticks one on, and counts the boosters already
-- written into the season file too; this is the backstop for the rows still
-- in here, so a direct insert with the anon key cannot go past it either.
create or replace function public.enforce_booster_limits()
returns trigger
language plpgsql
as $$
declare
  kind_limit integer;
  same_kind  integer;
  every_kind integer;
begin
  kind_limit := case new.item_key
    when 'boost-2-5' then 2
    when 'boost-2-0' then 3
    when 'boost-1-5' then 4
    else null
  end;

  select count(*) into every_kind
    from public.game_boosters
   where lower(email) = lower(new.email) and season = new.season;

  select count(*) into same_kind
    from public.game_boosters
   where lower(email) = lower(new.email) and season = new.season
     and item_key = new.item_key;

  if every_kind >= 5 then
    raise exception 'Season limit: five boosters a season.';
  end if;
  if kind_limit is not null and same_kind >= kind_limit then
    raise exception 'Season limit: % of those a season.', kind_limit;
  end if;
  return new;
end;
$$;

drop trigger if exists game_boosters_season_limits on public.game_boosters;
create trigger game_boosters_season_limits
  before insert on public.game_boosters
  for each row execute function public.enforce_booster_limits();

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
-- transaction, and the ledger row -- taken under lock -- decides what is
-- still owed.
--
-- What it returns is what it actually paid, which is 0 on every call after
-- the first for the same awards -- unless what the award is worth has gone up
-- since, and then it pays the difference and nothing more. That is what makes
-- a corrected stat line land: publish a week with two touchdowns in it, notice
-- a third and write it in, and the next call pays the ten credits that were
-- missed rather than deciding week three has already been dealt with. It never
-- takes credits back when a number goes down; a player may have spent them
-- already, and an admin can adjust a balance by hand.
--
-- On trust: the credits come from the browser, because what a touchdown is
-- worth is worked out from the season file in stats/{year}.js, and Postgres
-- has no copy of it. A player could already set their own balance directly — the
-- update policy on player_credits allows it, because buying things needs it —
-- so this is not a new hole. It is still worth closing the easy half of it:
-- for anyone who is not an admin, an award has to look like one of the two
-- kinds the site issues, and cannot be worth more than the biggest either
-- kind could honestly be. An admin's awards are whatever they type, which is
-- the point of them.
--
-- The touchdown ceiling is 120 rather than 60. Sixty is six touchdowns at a
-- back's rate, and a back on a side that puts up 49 can beat that in a night
-- -- at which point the award was silently dropped and the best game of his
-- season paid nothing. 120 still bounds it at eleven or twelve, which is more
-- than any scoreboard on this site has room for.
--
-- From 2019 the same td-w{week} key carries a game's fantasy-point credits
-- (see data/economy.js). 120 still bounds them: it would take about 160
-- fantasy points in one game from a tight end, and more from anyone else.
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
  v_have   integer;
  r        record;
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

  -- One award at a time, so an award already on the ledger can be taken under
  -- lock before it is compared. Doing it in one statement would let two
  -- callers -- the admin publishing a week and the player opening the site in
  -- the same second -- both read the same old number and both pay the
  -- difference. There are never more than a season's worth of these.
  for r in
    select
      a ->> 'key'                             as award_key,
      coalesce((a ->> 'credits')::integer, 0) as credits,
      a ->> 'note'                            as note
    from jsonb_array_elements(p_awards) as a
  loop
    continue when r.award_key is null or r.credits <= 0;
    continue when not (
      v_admin
      or (r.award_key ~ '^offseason-[0-9]{4}$' and r.credits <= 60)
      or (r.award_key ~ '^td-w[0-9]{1,2}$'     and r.credits <= 120)
    );

    -- for update: if the row is there, nobody else may decide about it until
    -- this transaction is done. Under read committed a blocked lock re-reads
    -- the row it was waiting on, so the loser of a race sees the winner's
    -- number and pays nothing.
    select credits into v_have
      from public.credit_awards
     where email = p_email and season = p_season and award_key = r.award_key
     for update;

    if v_have is null then
      -- Never paid. on conflict do nothing rather than a plain insert,
      -- because a caller that inserted this key between the select above and
      -- here is holding the unique index, and this one must not pay for it.
      insert into public.credit_awards (email, season, award_key, credits, note)
      values (p_email, p_season, r.award_key, r.credits, r.note)
      on conflict (email, season, award_key) do nothing;
      if found then
        v_paid := v_paid + r.credits;
      end if;

    elsif r.credits > v_have then
      -- Worth more than it was: pay the difference, not the whole thing.
      update public.credit_awards
         set credits = r.credits, note = r.note, awarded_at = now()
       where email = p_email and season = p_season and award_key = r.award_key;
      v_paid := v_paid + (r.credits - v_have);
    end if;

    v_have := null;
  end loop;

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

-- ===========================================================================
-- Cards
--
-- The card game on the Cards tab (data/cards.js). It sits beside the
-- simulation rather than in it: nothing here touches a rating, a stat line or
-- a result, and a player who never opens a pack loses nothing by it.
--
-- A card is an id that names a game or one of its big plays --
-- 'p:2021:sam-stogsdill:5', 'h:2021:sam-stogsdill:5:0' -- and everything
-- printed on it is read from the season file, so all this stores is who owns
-- which ids and how many of each.
--
-- No insert, update or delete policy on any of the card tables. Cards only
-- ever move through the functions below -- opening a pack, claiming a set,
-- a trade, the admin's resets -- each one transaction, so a pack is never
-- paid for without arriving and a trade never half happens.
-- ===========================================================================

create table if not exists public.player_cards (
  email           text        not null,
  card_id         text        not null,
  quantity        integer     not null default 1,
  first_pulled_at timestamptz not null default now(),
  primary key (email, card_id)
);

alter table public.player_cards enable row level security;

-- Any signed-in player can see anybody's collection: a trade means picking
-- what you want out of somebody else's. Nobody signed out can.
drop policy if exists "cards readable by owner or admin" on public.player_cards;
drop policy if exists "cards readable by players" on public.player_cards;
create policy "cards readable by players"
  on public.player_cards for select to authenticated
  using (true);

-- Every pack opened, with what was in it. The rip on the page is drawn from
-- what comes back, and the admin can see what the shop has taken.
create table if not exists public.card_packs (
  id        uuid primary key default gen_random_uuid(),
  email     text        not null,
  pack_key  text        not null,
  credits   integer     not null,
  cards     text[]      not null,
  opened_at timestamptz not null default now()
);

create index if not exists card_packs_email_idx
  on public.card_packs (email, opened_at desc);

alter table public.card_packs enable row level security;

drop policy if exists "card packs readable by owner or admin" on public.card_packs;
create policy "card packs readable by owner or admin"
  on public.card_packs for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

-- A library set can be claimed once per player, ever.
create table if not exists public.card_set_claims (
  email      text        not null,
  set_key    text        not null,
  reward     jsonb       not null default '{}'::jsonb,
  claimed_at timestamptz not null default now(),
  primary key (email, set_key)
);

alter table public.card_set_claims enable row level security;

drop policy if exists "card set claims readable by owner or admin" on public.card_set_claims;
create policy "card set claims readable by owner or admin"
  on public.card_set_claims for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

-- What a card id looks like. Anything else is refused at the door.
create or replace function public.is_card_id(p_id text)
returns boolean
language sql
immutable
as $$
  select p_id ~ '^(p:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}|h:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}:[0-9]{1,2})$';
$$;

-- ---------------------------------------------------------------------------
-- Helpers the functions below share. Not callable from the browser: they do
-- no checking of their own, and every caller has done it already.
-- ---------------------------------------------------------------------------

-- One booster into somebody's inventory, on the stacked row a bought one
-- lands on.
create or replace function public.give_booster(p_email text, p_booster text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.player_inventory as inv
    (email, item_key, item_name, target, quantity, credits, effects, consumable, season, active)
  values
    (p_email, p_booster,
     case p_booster when 'boost-2-5' then '2.5x Booster'
                    when 'boost-2-0' then '2.0x Booster'
                    else '1.5x Booster' end,
     null, 1, 0, '{}'::jsonb, true, null, false)
  on conflict (email, item_key, coalesce(target, ''))
    where item_key = 'upgrade' or consumable
  do update set quantity = inv.quantity + 1;
$$;

-- One copy of a card into a collection.
create or replace function public.give_card(p_email text, p_card text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.player_cards as pc (email, card_id)
  values (p_email, p_card)
  on conflict (email, card_id) do update set quantity = pc.quantity + 1;
$$;

-- One copy of a card out of a collection; the row goes with the last one.
create or replace function public.take_card(p_email text, p_card text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.player_cards set quantity = quantity - 1
   where email = p_email and card_id = p_card;
  delete from public.player_cards
   where email = p_email and card_id = p_card and quantity <= 0;
$$;

-- Does this collection hold at least one of every card in the list?
create or replace function public.owns_cards(p_email text, p_cards text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) from public.player_cards
           where email = p_email and card_id = any(p_cards) and quantity > 0)
       = (select count(distinct c) from unnest(p_cards) as c);
$$;

-- Supabase grants every new function to the browser's roles by default, so
-- these are taken back explicitly.
revoke all on function public.give_booster(text, text) from public, anon, authenticated;
revoke all on function public.give_card(text, text) from public, anon, authenticated;
revoke all on function public.take_card(text, text) from public, anon, authenticated;
revoke all on function public.owns_cards(text, text[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Opening a pack
--
-- The price and the size are decided here, not by the page: the same numbers
-- as PACKS in data/cards.js, and the two are changed together. Which cards
-- are in it the page rolls, because the season files that say what a card is
-- are not in Postgres -- the same trust the credit awards run on, and with
-- the same easy half closed: a pack holds exactly its size of real-looking
-- ids, and costs what it costs.
--
-- The balance is taken under lock, so two packs opened at once from two tabs
-- cannot both spend the same credits.
--
-- Returns the balance left.
-- ---------------------------------------------------------------------------

create or replace function public.open_card_pack(p_pack text, p_cards text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_price integer;
  v_size  integer;
  v_have  integer;
  v_card  text;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;

  v_price := case p_pack when 'base' then 5 when 'season' then 6 when 'pro' then 15 end;
  v_size  := case p_pack when 'base' then 3 when 'season' then 3 when 'pro' then 5 end;
  if v_price is null then
    raise exception 'There is no % pack.', p_pack;
  end if;

  if coalesce(array_length(p_cards, 1), 0) <> v_size then
    raise exception 'That pack holds % cards.', v_size;
  end if;
  foreach v_card in array p_cards loop
    if not public.is_card_id(v_card) then
      raise exception 'Not a card: %', v_card;
    end if;
  end loop;

  select credits into v_have
    from public.player_credits
   where email = v_email
     for update;

  if coalesce(v_have, 0) < v_price then
    raise exception 'Not enough credits: that pack costs %, you have %.', v_price, coalesce(v_have, 0);
  end if;

  update public.player_credits
     set credits = credits - v_price, updated_at = now()
   where email = v_email;

  foreach v_card in array p_cards loop
    perform public.give_card(v_email, v_card);
  end loop;

  -- A Pro Pack has a 1.5x booster in it as well, on the same stacked row a
  -- bought one lands on.
  if p_pack = 'pro' then
    perform public.give_booster(v_email, 'boost-1-5');
  end if;

  insert into public.card_packs (email, pack_key, credits, cards)
  values (v_email, p_pack, v_price, p_cards);

  return v_have - v_price;
end;
$$;

revoke all on function public.open_card_pack(text, text[]) from public;
grant execute on function public.open_card_pack(text, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Claiming a library set
--
-- Which cards make a set is in data/cards.js, so the page says which of the
-- player's cards it was completed with, and this checks they are all really
-- theirs. The reward is one more card, a few credits and, on the harder
-- sets, a 1.5x booster -- held here to 20 credits and to the 1.5x for
-- anybody but an admin, so the most a forged claim can do is pay out a
-- small, real reward once.
--
-- The booster lands on the same stacked inventory row a bought one does, and
-- goes on games under the same five-a-season trigger, so a full library
-- never means more boosters on a season than anybody else can have.
--
-- Returns the balance after.
-- ---------------------------------------------------------------------------

create or replace function public.claim_card_set(
  p_set         text,
  p_cards       text[],
  p_reward_card text,
  p_credits     integer,
  p_booster     text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := auth.jwt() ->> 'email';
  v_admin   boolean := public.is_admin();
  v_credits integer := greatest(coalesce(p_credits, 0), 0);
  v_balance integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_set is null or p_set !~ '^[a-z0-9-]{1,60}$' then
    raise exception 'Not a set: %', p_set;
  end if;
  if coalesce(array_length(p_cards, 1), 0) = 0 then
    raise exception 'A set is made of cards.';
  end if;
  if p_reward_card is not null and not public.is_card_id(p_reward_card) then
    raise exception 'Not a card: %', p_reward_card;
  end if;
  if p_booster is not null and p_booster not in ('boost-1-5', 'boost-2-0', 'boost-2-5') then
    raise exception 'Not a booster: %', p_booster;
  end if;
  if not v_admin and (v_credits > 20 or (p_booster is not null and p_booster <> 'boost-1-5')) then
    raise exception 'That is more than a set pays.';
  end if;

  -- Every card it was made with has to be in the collection.
  if not public.owns_cards(v_email, p_cards) then
    raise exception 'Some of those cards are not in your collection.';
  end if;

  insert into public.card_set_claims (email, set_key, reward)
  values (v_email, p_set, jsonb_build_object(
    'card', p_reward_card, 'credits', v_credits, 'booster', p_booster, 'cards', to_jsonb(p_cards)))
  on conflict (email, set_key) do nothing;
  if not found then
    raise exception 'That set has already been claimed.';
  end if;

  if p_reward_card is not null then
    perform public.give_card(v_email, p_reward_card);
  end if;

  insert into public.player_credits as cr (email, credits, updated_at)
  values (v_email, v_credits, now())
  on conflict (email) do update
    set credits = cr.credits + v_credits, updated_at = now()
  returning credits into v_balance;

  if p_booster is not null then
    perform public.give_booster(v_email, p_booster);
  end if;

  return v_balance;
end;
$$;

revoke all on function public.claim_card_set(text, text[], text, integer, text) from public;
grant execute on function public.claim_card_set(text, text[], text, integer, text) to authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Trades
--
-- One player offers some of their cards for some of another's. The other
-- accepts or declines; the one who offered can take it back while it is
-- open. Nothing moves until it is accepted, and then both sides move in one
-- transaction, after checking that both players still have what they put
-- up -- a card can be in two offers at once, and only the first accepted
-- gets it. An offer that can no longer go through is marked expired rather
-- than half done.
--
-- `give` is what the offering player hands over, `take` what they get back.
-- A trade with nothing to take is a gift.
-- ---------------------------------------------------------------------------

create table if not exists public.card_trades (
  id          uuid primary key default gen_random_uuid(),
  from_email  text        not null,
  to_email    text        not null,
  give        text[]      not null,
  take        text[]      not null default '{}',
  status      text        not null default 'open'
              check (status in ('open', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists card_trades_from_idx on public.card_trades (from_email, status);
create index if not exists card_trades_to_idx on public.card_trades (to_email, status);

alter table public.card_trades enable row level security;

-- The two players in it, and an admin.
drop policy if exists "card trades readable by either side or admin" on public.card_trades;
create policy "card trades readable by either side or admin"
  on public.card_trades for select to authenticated
  using (lower(from_email) = lower(auth.jwt() ->> 'email')
         or lower(to_email) = lower(auth.jwt() ->> 'email')
         or public.is_admin());

-- Showcases: up to five cards a player puts on their own player page. Set
-- below, pruned here.
create table if not exists public.card_showcases (
  email      text primary key,
  cards      text[]      not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.card_showcases enable row level security;

drop policy if exists "card showcases are public" on public.card_showcases;
create policy "card showcases are public"
  on public.card_showcases for select
  using (true);

-- A card that has left a collection leaves its owner's showcase too.
create or replace function public.prune_showcase(p_email text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.card_showcases s
     set cards = coalesce(array(
           select c from unnest(s.cards) with ordinality as t(c, n)
            where exists (select 1 from public.player_cards pc
                           where pc.email = s.email and pc.card_id = t.c and pc.quantity > 0)
            order by t.n), '{}'),
         updated_at = now()
   where s.email = p_email;
$$;

create or replace function public.propose_card_trade(p_to text, p_give text[], p_take text[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_take  text[] := coalesce(p_take, '{}');
  v_card  text;
  v_id    uuid;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_to is null or lower(p_to) = lower(v_email) then
    raise exception 'Pick somebody else to trade with.';
  end if;
  if coalesce(array_length(p_give, 1), 0) not between 1 and 6 then
    raise exception 'Offer between one and six of your cards.';
  end if;
  if coalesce(array_length(v_take, 1), 0) > 6 then
    raise exception 'Ask for six cards at most.';
  end if;
  foreach v_card in array p_give || v_take loop
    if not public.is_card_id(v_card) then
      raise exception 'Not a card: %', v_card;
    end if;
  end loop;
  if (select count(distinct c) from unnest(p_give) c) <> array_length(p_give, 1)
     or (select count(distinct c) from unnest(v_take) c) <> coalesce(array_length(v_take, 1), 0) then
    raise exception 'Each card goes in once.';
  end if;
  if not public.owns_cards(v_email, p_give) then
    raise exception 'You do not have all of those cards.';
  end if;
  if not public.owns_cards(p_to, v_take) then
    raise exception 'They do not have all of those cards.';
  end if;
  if (select count(*) from public.card_trades
       where lower(from_email) = lower(v_email) and status = 'open') >= 10 then
    raise exception 'You have ten offers out already. Wait for an answer or take one back.';
  end if;

  insert into public.card_trades (from_email, to_email, give, take)
  values (v_email, p_to, p_give, v_take)
  returning id into v_id;
  return v_id;
end;
$$;

-- Returns what became of it: accepted, declined or expired.
create or replace function public.respond_card_trade(p_trade uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  t       public.card_trades;
  v_card  text;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;

  select * into t from public.card_trades where id = p_trade for update;
  if t.id is null then
    raise exception 'There is no such trade.';
  end if;
  if lower(t.to_email) <> lower(v_email) then
    raise exception 'That offer is not yours to answer.';
  end if;
  if t.status <> 'open' then
    raise exception 'That offer has already been %.', t.status;
  end if;

  if not p_accept then
    update public.card_trades set status = 'declined', resolved_at = now() where id = t.id;
    return 'declined';
  end if;

  -- Both collections, under lock, before anything is checked.
  perform 1 from public.player_cards
    where email in (t.from_email, t.to_email) and card_id = any(t.give || t.take)
    for update;

  if not public.owns_cards(t.from_email, t.give) or not public.owns_cards(t.to_email, t.take) then
    update public.card_trades set status = 'expired', resolved_at = now() where id = t.id;
    return 'expired';
  end if;

  foreach v_card in array t.give loop
    perform public.take_card(t.from_email, v_card);
    perform public.give_card(t.to_email, v_card);
  end loop;
  foreach v_card in array t.take loop
    perform public.take_card(t.to_email, v_card);
    perform public.give_card(t.from_email, v_card);
  end loop;

  perform public.prune_showcase(t.from_email);
  perform public.prune_showcase(t.to_email);

  update public.card_trades set status = 'accepted', resolved_at = now() where id = t.id;
  return 'accepted';
end;
$$;

create or replace function public.cancel_card_trade(p_trade uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  t       public.card_trades;
begin
  select * into t from public.card_trades where id = p_trade for update;
  if t.id is null then
    raise exception 'There is no such trade.';
  end if;
  if lower(t.from_email) <> lower(coalesce(v_email, '')) and not public.is_admin() then
    raise exception 'Only the player who offered it can take it back.';
  end if;
  if t.status <> 'open' then
    raise exception 'That offer has already been %.', t.status;
  end if;
  update public.card_trades set status = 'cancelled', resolved_at = now() where id = t.id;
  return 'cancelled';
end;
$$;

-- ---------------------------------------------------------------------------
-- Showcases
--
-- Up to five cards a player picks to show on their own player page. Public,
-- like the page: anybody can see them, signed in or not. Only cards the
-- player owns can go up, and a card traded away comes down on its own.
-- ---------------------------------------------------------------------------

-- The table itself is created with the trades, which prune it.

create or replace function public.set_card_showcase(p_cards text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_cards text[] := coalesce(p_cards, '{}');
  v_card  text;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if coalesce(array_length(v_cards, 1), 0) > 5 then
    raise exception 'A showcase holds five cards.';
  end if;
  foreach v_card in array v_cards loop
    if not public.is_card_id(v_card) then
      raise exception 'Not a card: %', v_card;
    end if;
  end loop;
  if (select count(distinct c) from unnest(v_cards) c) <> coalesce(array_length(v_cards, 1), 0) then
    raise exception 'Each card goes up once.';
  end if;
  if not public.owns_cards(v_email, v_cards) then
    raise exception 'You can only show cards you have.';
  end if;

  insert into public.card_showcases (email, cards, updated_at)
  values (v_email, v_cards, now())
  on conflict (email) do update set cards = excluded.cards, updated_at = now();
end;
$$;

-- prune_showcase is internal, like the helpers.
revoke all on function public.prune_showcase(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The admin's two resets, one player or everybody (p_email null).
--
-- Clear library: every card out of the collection, the showcase emptied,
-- open trades cancelled and the goals reset, so the player starts the
-- Library over from nothing. Credits stay spent and rewards stay paid.
--
-- Reset goals: every library set can be claimed again. Cards are kept, and
-- the rewards already paid stay paid.
--
-- Each returns how many rows it took away.
-- ---------------------------------------------------------------------------

create or replace function public.admin_clear_card_library(p_email text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can do that.';
  end if;

  delete from public.player_cards where p_email is null or lower(email) = lower(p_email);
  get diagnostics v_count = row_count;

  delete from public.card_showcases where p_email is null or lower(email) = lower(p_email);

  delete from public.card_set_claims where p_email is null or lower(email) = lower(p_email);

  update public.card_trades set status = 'cancelled', resolved_at = now()
   where status = 'open'
     and (p_email is null or lower(from_email) = lower(p_email) or lower(to_email) = lower(p_email));

  return v_count;
end;
$$;

create or replace function public.admin_reset_card_goals(p_email text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can do that.';
  end if;

  delete from public.card_set_claims where p_email is null or lower(email) = lower(p_email);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.propose_card_trade(text, text[], text[]) from public, anon;
revoke all on function public.respond_card_trade(uuid, boolean) from public, anon;
revoke all on function public.cancel_card_trade(uuid) from public, anon;
revoke all on function public.set_card_showcase(text[]) from public, anon;
revoke all on function public.admin_clear_card_library(text) from public, anon;
revoke all on function public.admin_reset_card_goals(text) from public, anon;
grant execute on function public.propose_card_trade(text, text[], text[]) to authenticated;
grant execute on function public.respond_card_trade(uuid, boolean) to authenticated;
grant execute on function public.cancel_card_trade(uuid) to authenticated;
grant execute on function public.set_card_showcase(text[]) to authenticated;
grant execute on function public.admin_clear_card_library(text) to authenticated;
grant execute on function public.admin_reset_card_goals(text) to authenticated;

notify pgrst, 'reload schema';
