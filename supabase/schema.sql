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

-- A QB Connection is switched on and off by an admin only. When the quarterback
-- is traded or retires the connection is over, and that is not for the player
-- to decide -- or to turn back on afterwards. The update policy above lets an
-- owner change their own rows, so this is what stops them changing this one
-- column on this one item. Everything else about their rows stays theirs.
create or replace function public.guard_qb_connection_switch()
returns trigger
language plpgsql
as $$
begin
  if new.item_key = 'qb-connection'
     and new.active is distinct from old.active
     and not public.is_admin() then
    raise exception 'Only an admin can turn a QB Connection on or off.';
  end if;
  return new;
end;
$$;

drop trigger if exists player_inventory_qb_connection_switch on public.player_inventory;
create trigger player_inventory_qb_connection_switch
  before update on public.player_inventory
  for each row execute function public.guard_qb_connection_switch();

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

-- A wager's line, from the side it took: -3.5 means that side had to win by
-- 4 or more, 3.5 that it could lose by 3. Kept with the row so the wager is
-- settled at the line it was taken at, whatever the line does after.
-- Null on a booster.
alter table public.game_boosters add column if not exists line numeric;

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
-- (boosterSeasonLimit and each booster's seasonLimit in data/shop.js), and
-- two wagers (wagerSeasonLimit), which share a game's one slot with the
-- boosters but not their count. The page checks before it sticks one on,
-- and counts what is already written into the season file too; this is the
-- backstop for the rows still in here, so a direct insert with the anon key
-- cannot go past it either. Nor can one go on a week already out, where the
-- result is known -- an admin aside, putting a week right.
create or replace function public.enforce_booster_limits()
returns trigger
language plpgsql
as $$
declare
  kind_limit integer;
  same_kind  integer;
  every_kind integer;
begin
  if not public.is_admin() and exists (
    select 1 from public.published_weeks
     where season = new.season and week = new.week
  ) then
    raise exception 'That week is already out.';
  end if;

  if new.item_key in ('wager-for', 'wager-against') then
    -- A line ends in a half, so a wager is won or lost, never pushed.
    if new.line is null or abs(new.line) > 60 or mod(abs(new.line) * 2, 2) <> 1 then
      raise exception 'A wager needs a line that ends in a half.';
    end if;
    select count(*) into same_kind
      from public.game_boosters
     where lower(email) = lower(new.email) and season = new.season
       and item_key in ('wager-for', 'wager-against');
    if same_kind >= 2 then
      raise exception 'Season limit: two wagers a season.';
    end if;
    return new;
  end if;

  kind_limit := case new.item_key
    when 'boost-2-5' then 2
    when 'boost-2-0' then 3
    when 'boost-1-5' then 4
    else null
  end;

  select count(*) into every_kind
    from public.game_boosters
   where lower(email) = lower(new.email) and season = new.season
     and item_key not in ('wager-for', 'wager-against');

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

-- Which leagues' Discord posts a week has had. From 2023 the six are split
-- between the NFL and college, so a week can be two messages to two
-- channels, and one can land while the other does not. posted_at is set
-- once every league with a game that week has had its post; until then this
-- is what lets Post again, and the bot, send only the one still missing.
alter table public.published_weeks
  add column if not exists posted_leagues text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- The Discord bots' webhooks
--
-- One per league: the colleges' channel and the NFL's. And 'trades', the
-- trades bot's channel, where every trade made in the NFL sim goes (Sam,
-- 2026-10-22), and 'live', where a game played live posts its big plays
-- (Live Mode, 2026-11-03; the NFL's channel when there is none). Pasted into the admin page and kept here rather than in the
-- site's files, because the repository is public and anybody holding a
-- webhook URL can post to its channel as the bot. Only an admin can read or
-- change one. The scheduled bot reads them with the service role key, which
-- passes RLS.
-- ---------------------------------------------------------------------------

create table if not exists public.discord_webhooks (
  league     text        primary key check (league in ('college', 'nfl', 'trades', 'live')),
  url        text        not null
             check (url ~ '^https://((canary|ptb)\.)?discord(app)?\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+$'),
  updated_at timestamptz not null default now()
);

-- A table made before the trades bot took the two leagues only, and one
-- made before Live Mode had no live bot.
alter table public.discord_webhooks drop constraint if exists discord_webhooks_league_check;
alter table public.discord_webhooks add constraint discord_webhooks_league_check
  check (league in ('college', 'nfl', 'trades', 'live'));

alter table public.discord_webhooks enable row level security;

drop policy if exists "discord webhooks read by an admin" on public.discord_webhooks;
create policy "discord webhooks read by an admin"
  on public.discord_webhooks for select to authenticated
  using (public.is_admin());

drop policy if exists "discord webhooks added by an admin" on public.discord_webhooks;
create policy "discord webhooks added by an admin"
  on public.discord_webhooks for insert to authenticated
  with check (public.is_admin());

drop policy if exists "discord webhooks changed by an admin" on public.discord_webhooks;
create policy "discord webhooks changed by an admin"
  on public.discord_webhooks for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "discord webhooks removed by an admin" on public.discord_webhooks;
create policy "discord webhooks removed by an admin"
  on public.discord_webhooks for delete to authenticated
  using (public.is_admin());

revoke all on public.discord_webhooks from anon;

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
-- Diamonds
--
-- The card game's own money, kept apart from credits so that a pack is never
-- bought with something that could have gone on a player. Packs cost
-- diamonds and library sets pay them; nothing in the simulation takes or
-- gives them.
--
-- A game pays diamonds the way it pays credits -- the same fantasy points
-- times the same position share, rounded up -- and then the booster riding
-- on it multiplies them: 1.5x, 2.0x or 2.5x (data/economy.js). Credits can
-- be swapped for diamonds, two for every credit, and there is no way back.
--
-- Unlike credits, a player cannot write their own balance. It only moves
-- through the functions below -- the games paying out, buying diamonds,
-- opening a pack, claiming a set -- and by an admin's hand.
-- ===========================================================================

create table if not exists public.player_diamonds (
  email      text primary key,
  diamonds   integer     not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.player_diamonds enable row level security;

drop policy if exists "diamonds readable by owner or admin" on public.player_diamonds;
create policy "diamonds readable by owner or admin"
  on public.player_diamonds for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

-- An admin sets anybody's balance from the admin page. Nobody else writes
-- one straight: their diamonds move through the functions below.
drop policy if exists "diamonds inserted by an admin" on public.player_diamonds;
create policy "diamonds inserted by an admin"
  on public.player_diamonds for insert to authenticated
  with check (public.is_admin());

drop policy if exists "diamonds updated by an admin" on public.player_diamonds;
create policy "diamonds updated by an admin"
  on public.player_diamonds for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- The ledger of every game's diamonds, the same shape and the same rules as
-- credit_awards: one row per game per player per season, so paying on every
-- page load is safe and a corrected stat line pays the difference.
create table if not exists public.diamond_awards (
  id         uuid primary key default gen_random_uuid(),
  email      text        not null,
  season     integer     not null,
  award_key  text        not null,
  diamonds   integer     not null,
  note       text,
  awarded_at timestamptz not null default now(),
  unique (email, season, award_key)
);

create index if not exists diamond_awards_email_idx
  on public.diamond_awards (email, season);

alter table public.diamond_awards enable row level security;

drop policy if exists "diamond awards readable by owner or admin" on public.diamond_awards;
create policy "diamond awards readable by owner or admin"
  on public.diamond_awards for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

-- No insert, update or delete policy: awards are only written through
-- pay_diamond_awards() below.

-- ---------------------------------------------------------------------------
-- Paying a game's diamonds
--
-- pay_credit_awards() over again, for the other ledger and the other
-- balance. The same trust: what a game is worth comes from the browser,
-- because the season files are not in Postgres, and for anybody who is not
-- an admin an award has to look like one the site issues (game-w{week}) and
-- be no bigger than one could honestly be -- 300, the 120 a game's credits
-- are held to times the 2.5x booster.
--
-- Returns what it actually paid.
-- ---------------------------------------------------------------------------

create or replace function public.pay_diamond_awards(
  p_email  text,
  p_season integer,
  p_awards jsonb            -- [{ "key": "game-w4", "diamonds": 23, "note": "..." }, ...]
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

  -- One at a time and under lock, for the same reason as the credits: the
  -- admin publishing a week and the player opening the site in the same
  -- second must not both pay the same difference.
  for r in
    select
      a ->> 'key'                              as award_key,
      coalesce((a ->> 'diamonds')::integer, 0) as diamonds,
      a ->> 'note'                             as note
    from jsonb_array_elements(p_awards) as a
  loop
    continue when r.award_key is null or r.diamonds <= 0;
    continue when not (
      v_admin
      or (r.award_key ~ '^game-w[0-9]{1,2}$' and r.diamonds <= 300)
    );

    select diamonds into v_have
      from public.diamond_awards
     where email = p_email and season = p_season and award_key = r.award_key
     for update;

    if v_have is null then
      insert into public.diamond_awards (email, season, award_key, diamonds, note)
      values (p_email, p_season, r.award_key, r.diamonds, r.note)
      on conflict (email, season, award_key) do nothing;
      if found then
        v_paid := v_paid + r.diamonds;
      end if;

    elsif r.diamonds > v_have then
      update public.diamond_awards
         set diamonds = r.diamonds, note = r.note, awarded_at = now()
       where email = p_email and season = p_season and award_key = r.award_key;
      v_paid := v_paid + (r.diamonds - v_have);
    end if;

    v_have := null;
  end loop;

  if v_paid > 0 then
    insert into public.player_diamonds as pd (email, diamonds, updated_at)
    values (p_email, v_paid, now())
    on conflict (email) do update
      set diamonds = pd.diamonds + v_paid,
          updated_at = now();
  end if;

  return v_paid;
end;
$$;

revoke all on function public.pay_diamond_awards(text, integer, jsonb) from public, anon;
grant execute on function public.pay_diamond_awards(text, integer, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Buying diamonds with credits
--
-- Two diamonds for every credit -- DIAMONDS_PER_CREDIT in data/economy.js,
-- and the two are changed together. At that rate a pack costs in credits
-- exactly what it did before diamonds existed. One way only: nothing turns
-- diamonds back into credits.
--
-- Both balances are taken under lock and moved in the one transaction, so a
-- swap is never half done. Returns both balances after.
-- ---------------------------------------------------------------------------

create or replace function public.buy_diamonds(p_credits integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text := auth.jwt() ->> 'email';
  v_rate     constant integer := 2;
  v_have     integer;
  v_diamonds integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_credits is null or p_credits < 1 then
    raise exception 'Spend at least one credit.';
  end if;

  select credits into v_have
    from public.player_credits
   where email = v_email
     for update;

  if coalesce(v_have, 0) < p_credits then
    raise exception 'Not enough credits: that costs %, you have %.', p_credits, coalesce(v_have, 0);
  end if;

  update public.player_credits
     set credits = credits - p_credits, updated_at = now()
   where email = v_email;

  insert into public.player_diamonds as pd (email, diamonds, updated_at)
  values (v_email, p_credits * v_rate, now())
  on conflict (email) do update
    set diamonds = pd.diamonds + p_credits * v_rate,
        updated_at = now()
  returning diamonds into v_diamonds;

  return jsonb_build_object('credits', v_have - p_credits, 'diamonds', v_diamonds);
end;
$$;

revoke all on function public.buy_diamonds(integer) from public, anon;
grant execute on function public.buy_diamonds(integer) to authenticated;

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

-- Packs are bought with diamonds now. `credits` is what a pack opened before
-- that cost, and 0 since; `diamonds` is what it cost after.
alter table public.card_packs add column if not exists diamonds integer not null default 0;

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

-- An NFL teammate's card (Sam, 2026-11-06; data/nfl-cards.js): a game,
-- 'n:2025:dj-moore:5', or a touchdown in it, 'nt:2025:dj-moore:5:0'. Only
-- the NFL Pack and the NFL sets give these out.
create or replace function public.is_nfl_card_id(p_id text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_id ~ '^n:20[0-9]{2}:[a-z0-9]+(-[a-z0-9]+)*:[0-9]{1,2}$'
                  or p_id ~ '^nt:20[0-9]{2}:[a-z0-9]+(-[a-z0-9]+)*:[0-9]{1,2}:[0-9]{1,2}$', false);
$$;

-- What a card id looks like: one of the six's, or an NFL teammate's.
-- Anything else is refused at the door.
create or replace function public.is_card_id(p_id text)
returns boolean
language sql
immutable
as $$
  select p_id ~ '^(p:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}|h:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}:[0-9]{1,2})$'
         or public.is_nfl_card_id(p_id);
$$;

-- A limited-time event's card (the events, at the end of this file): a
-- card's id with the event's tag on the end -- ':gr' for the Gold Rush,
-- ':hw' for Halloween, ':hc' for a Halloween costume card, ':ar' for the
-- Air Raid -- one of Sam's card-art cards ('a:...:gr', 'a:...:hw',
-- 'a:...:ar'; a play's has its place in the game too), or an event's own
-- Iconic card ('r:gold-rush:gr', 'r:halloween:hw', 'r:air-raid:ar'). Only an event's pack and its rewards give these out;
-- every standard way in keeps to is_card_id.
create or replace function public.is_event_card_id(p_id text)
returns boolean
language sql
immutable
as $$
  select coalesce(
    p_id ~ '^(p:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}|h:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}:[0-9]{1,2}):(gr|hw|hc|ar)$'
    or p_id ~ '^a:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}(:[0-9]{1,2})?:(gr|hw|ar)$'
    or p_id in ('r:gold-rush:gr', 'r:halloween:hw', 'r:air-raid:ar'), false);
$$;

-- A holographic card: a card's id with ':holo' on the end. Only ever made
-- by merging three copies (merge_holo_card, further down), never pulled, so
-- the pack, the shop and the set rewards keep to is_card_id; trades,
-- showcases, quick sales and the market take either. A Gold Rush card has
-- a holo too ('...:gr:holo'), and so does a card-art card since the page
-- draws them (Sam, 2026-10-20), but the GOLD RUSH card does not.
create or replace function public.is_holo_id(p_id text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_id like '%:holo'
                  and (public.is_card_id(left(p_id, -5))
                       or (public.is_event_card_id(left(p_id, -5)) and left(p_id, 2) in ('p:', 'h:', 'a:'))),
                  false);
$$;

-- A Holo II: a holo's id with a 2 on the end ('...:holo2'). Three holos of
-- one card merge into one (Sam, 2026-10-31), through merge_holo_card like
-- a holo, and it goes no further.
create or replace function public.is_holo2_id(p_id text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_id like '%:holo2' and public.is_holo_id(left(p_id, -1)), false);
$$;

-- Anything a collection can hold: a card, a Gold Rush card, or a holo or
-- a Holo II of either. What trades, showcases, quick sales and the market
-- take.
create or replace function public.is_any_card_id(p_id text)
returns boolean
language sql
immutable
as $$
  select public.is_card_id(p_id) or public.is_event_card_id(p_id) or public.is_holo_id(p_id)
         or public.is_holo2_id(p_id);
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
-- Paid in diamonds, never credits. The diamond balance is taken under lock,
-- so two packs opened at once from two tabs cannot both spend the same
-- diamonds.
--
-- Nothing is charged until the pack is torn open on the page: closing a
-- pack before tearing it never reaches here.
--
-- Returns the diamonds left.
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

  v_price := case p_pack when 'base' then 10 when 'season' then 12 when 'pro' then 20 end;
  v_size  := case p_pack when 'base' then 3 when 'season' then 3 when 'pro' then 5 end;

  -- The NFL Pack (Sam, 2026-11-06): 22 diamonds, four cards of the six's
  -- NFL teammates and nothing else. No other pack holds one.
  if p_pack = 'nfl' then
    v_price := 22;
    v_size := 4;
    foreach v_card in array coalesce(p_cards, '{}') loop
      if not public.is_nfl_card_id(v_card) then
        raise exception 'Not an NFL card: %', v_card;
      end if;
    end loop;
  elsif exists (select 1 from unnest(coalesce(p_cards, '{}')) as c where public.is_nfl_card_id(c)) then
    raise exception 'NFL cards only come in the NFL Pack.';
  end if;

  -- The Gold Rush Pack: 15 diamonds, four Gold Rush cards, and only while
  -- the Gold Rush is on. Never the GOLD RUSH card, which only finishing the
  -- event pays.
  if p_pack = 'gold-rush' then
    if not public.card_event_live('gold-rush') then
      raise exception 'The Gold Rush is not on, so its packs are not for sale.';
    end if;
    v_price := 15;
    v_size := 4;
  end if;

  -- The Halloween Pack: 18 diamonds, four Halloween cards (costume cards
  -- among them now and then), and only while Halloween is on. Never the
  -- HALLOWEEN card.
  if p_pack = 'halloween' then
    if not public.card_event_live('halloween') then
      raise exception 'Halloween is not on, so its packs are not for sale.';
    end if;
    v_price := 18;
    v_size := 4;
  end if;

  -- The Air Raid Pack (Sam, 2026-11-06): 18 diamonds, four Air Raid cards
  -- of Andrew and Paxon, and only while the Air Raid is on. Never the AIR
  -- RAID card.
  if p_pack = 'air-raid' then
    if not public.card_event_live('air-raid') then
      raise exception 'The Air Raid is not on, so its packs are not for sale.';
    end if;
    v_price := 18;
    v_size := 4;
  end if;

  -- A past season's pack, year-{season}: 14 diamonds, three cards, every
  -- one of them from that season.
  if p_pack ~ '^year-[0-9]{4}$' then
    v_price := 14;
    v_size := 3;
    foreach v_card in array coalesce(p_cards, '{}') loop
      if split_part(v_card, ':', 2) <> substr(p_pack, 6) then
        raise exception 'A % holds cards from that season only.', p_pack;
      end if;
    end loop;
  end if;

  if v_price is null then
    raise exception 'There is no % pack.', p_pack;
  end if;

  if coalesce(array_length(p_cards, 1), 0) <> v_size then
    raise exception 'That pack holds % cards.', v_size;
  end if;
  foreach v_card in array p_cards loop
    if p_pack = 'gold-rush' then
      if not public.is_event_card_id(v_card) or v_card like 'r:%' or v_card !~ ':gr$' then
        raise exception 'Not a Gold Rush card: %', v_card;
      end if;
    elsif p_pack = 'halloween' then
      if not public.is_event_card_id(v_card) or v_card like 'r:%' or v_card !~ ':(hw|hc)$' then
        raise exception 'Not a Halloween card: %', v_card;
      end if;
    elsif p_pack = 'air-raid' then
      if not public.is_event_card_id(v_card) or v_card like 'r:%' or v_card !~ ':ar$'
         or split_part(v_card, ':', 3) not in ('andrew-parr', 'paxon-hatch') then
        raise exception 'Not an Air Raid card: %', v_card;
      end if;
    elsif not public.is_card_id(v_card) then
      raise exception 'Not a card: %', v_card;
    end if;
  end loop;

  select diamonds into v_have
    from public.player_diamonds
   where email = v_email
     for update;

  if coalesce(v_have, 0) < v_price then
    raise exception 'Not enough diamonds: that pack costs %, you have %.', v_price, coalesce(v_have, 0);
  end if;

  -- 20 Air Raid Packs a day (Sam, 2026-11-06; perDay on the pack in
  -- data/cards.js, change both), the day turning over at 7:00 AM Central
  -- with the Daily Spin's (Sam, 2026-11-07; it was any 24 hours). Counted
  -- under the balance's lock, so two tabs cannot both open the 20th.
  if p_pack = 'air-raid' and (
    select count(*) from public.card_packs
     where email = v_email and pack_key = 'air-raid'
       and opened_at >= public.card_spin_ends(public.card_spin_day() - 1)) >= 20 then
    raise exception 'That is 20 Air Raid Packs today. More open at 7:00 AM Central.';
  end if;

  update public.player_diamonds
     set diamonds = diamonds - v_price, updated_at = now()
   where email = v_email;

  foreach v_card in array p_cards loop
    perform public.give_card(v_email, v_card);
  end loop;

  insert into public.card_packs (email, pack_key, credits, diamonds, cards)
  values (v_email, p_pack, 0, v_price, p_cards);

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
-- theirs. The reward is one more card, a few diamonds and, on the harder
-- sets, a 1.5x booster -- held here to 40 diamonds and to the 1.5x for
-- anybody but an admin, so the most a forged claim can do is pay out a
-- small, real reward once.
--
-- Diamonds, not credits: packs are bought with diamonds, and a set paying
-- credits would be a way of turning diamonds back into credits, which
-- nothing is allowed to be.
--
-- The booster lands on the same stacked inventory row a bought one does, and
-- goes on games under the same five-a-season trigger, so a full library
-- never means more boosters on a season than anybody else can have.
--
-- Returns the diamond balance after.
-- ---------------------------------------------------------------------------

-- The fourth argument was p_credits. Postgres will not rename an argument in
-- place, so the old one goes first; re-running this drops and recreates it.
drop function if exists public.claim_card_set(text, text[], text, integer, text);

create or replace function public.claim_card_set(
  p_set         text,
  p_cards       text[],
  p_reward_card text,
  p_diamonds    integer,
  p_booster     text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text := auth.jwt() ->> 'email';
  v_admin    boolean := public.is_admin();
  v_diamonds integer := greatest(coalesce(p_diamonds, 0), 0);
  v_balance  integer;
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
  if not v_admin and (v_diamonds > 40 or (p_booster is not null and p_booster <> 'boost-1-5')) then
    raise exception 'That is more than a set pays.';
  end if;

  -- Every card it was made with has to be in the collection.
  if not public.owns_cards(v_email, p_cards) then
    raise exception 'Some of those cards are not in your collection.';
  end if;

  insert into public.card_set_claims (email, set_key, reward)
  values (v_email, p_set, jsonb_build_object(
    'card', p_reward_card, 'diamonds', v_diamonds, 'booster', p_booster, 'cards', to_jsonb(p_cards)))
  on conflict (email, set_key) do nothing;
  if not found then
    raise exception 'That set has already been claimed.';
  end if;

  if p_reward_card is not null then
    perform public.give_card(v_email, p_reward_card);
  end if;

  insert into public.player_diamonds as pd (email, diamonds, updated_at)
  values (v_email, v_diamonds, now())
  on conflict (email) do update
    set diamonds = pd.diamonds + v_diamonds, updated_at = now()
  returning diamonds into v_balance;

  if p_booster is not null then
    perform public.give_booster(v_email, p_booster);
  end if;

  return v_balance;
end;
$$;

revoke all on function public.claim_card_set(text, text[], text, integer, text) from public, anon;
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

-- Showcases: up to twelve cards a player puts on their own player page. Set
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

-- A card that has left a collection leaves its owner's showcase too, and a
-- Player Card ('pc:{slug}', which shares the six slots) once no card of
-- that player is left, an NFL Player Card ('npc:{slug}') once no NFL card
-- of that teammate is.
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
                           where pc.email = s.email and pc.quantity > 0
                             and (pc.card_id = t.c
                                  or (t.c like 'pc:%' and split_part(pc.card_id, ':', 3) = substr(t.c, 4))
                                  or (t.c like 'npc:%' and public.is_nfl_card_id(regexp_replace(pc.card_id, ':holo2?$', ''))
                                      and split_part(pc.card_id, ':', 3) = substr(t.c, 5))))
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
    if not public.is_any_card_id(v_card) then
      raise exception 'Not a card: %', v_card;
    end if;
    if v_card like 'r:%' then
      raise exception 'An event''s Iconic card stays with whoever earned it.';
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
  -- An event's card traded in the last 48 hours cannot go again yet.
  if not public.cards_free(v_email, p_give) then
    raise exception 'An event card can be traded once every 48 hours, and one of yours was traded too recently.';
  end if;
  if not public.cards_free(p_to, v_take) then
    raise exception 'An event card can be traded once every 48 hours, and one of theirs was traded too recently.';
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

  if not public.owns_cards(t.from_email, t.give) or not public.owns_cards(t.to_email, t.take)
     or not public.cards_free(t.from_email, t.give) or not public.cards_free(t.to_email, t.take) then
    update public.card_trades set status = 'expired', resolved_at = now() where id = t.id;
    return 'expired';
  end if;

  -- An event's card that changes hands cools down for 48 hours with its
  -- new owner (lock_traded_card does nothing to any other card).
  foreach v_card in array t.give loop
    perform public.take_card(t.from_email, v_card);
    perform public.give_card(t.to_email, v_card);
    perform public.lock_traded_card(t.to_email, v_card);
  end loop;
  foreach v_card in array t.take loop
    perform public.take_card(t.to_email, v_card);
    perform public.give_card(t.from_email, v_card);
    perform public.lock_traded_card(t.from_email, v_card);
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
-- Up to twelve cards, two rows of six (Sam, 2026-11-06), a player picks to
-- show on their own player page. Public, like the page: anybody can see
-- them, signed in or not. Only cards the
-- player owns can go up, and a card traded away comes down on its own.
-- A slot can hold a Player Card instead, as 'pc:{slug}', for any player
-- they hold a card of, or an NFL Player Card, as 'npc:{slug}', for any NFL
-- teammate they hold an NFL card of (Sam, 2026-11-06).
-- ---------------------------------------------------------------------------

-- The table itself is created with the trades, which prune it.

-- Whether an account holds an NFL card (or a holo of one) of the NFL
-- teammate named `p_slug`: what an NFL Player Card in a showcase or a
-- photo on one needs.
create or replace function public.holds_nfl_player(p_email text, p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.player_cards
                  where email = p_email and quantity > 0
                    and public.is_nfl_card_id(regexp_replace(card_id, ':holo2?$', ''))
                    and split_part(card_id, ':', 3) = p_slug);
$$;

revoke all on function public.holds_nfl_player(text, text) from public, anon, authenticated;

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
  if coalesce(array_length(v_cards, 1), 0) > 12 then
    raise exception 'A showcase holds twelve cards.';
  end if;
  foreach v_card in array v_cards loop
    if v_card ~ '^pc:[a-z]+(-[a-z]+)*$' then
      if not exists (select 1 from public.player_cards
                      where email = v_email and quantity > 0
                        and split_part(card_id, ':', 3) = substr(v_card, 4)) then
        raise exception 'You need a card of that player to show his Player Card.';
      end if;
    elsif v_card ~ '^npc:[a-z0-9]+(-[a-z0-9]+)*$' then
      if not public.holds_nfl_player(v_email, substr(v_card, 5)) then
        raise exception 'You need an NFL card of that player to show his NFL Player Card.';
      end if;
    elsif not public.is_any_card_id(v_card) then
      raise exception 'Not a card: %', v_card;
    end if;
  end loop;
  if (select count(distinct c) from unnest(v_cards) c) <> coalesce(array_length(v_cards, 1), 0) then
    raise exception 'Each card goes up once.';
  end if;
  if not public.owns_cards(v_email, array(select c from unnest(v_cards) c
                                           where c not like 'pc:%' and c not like 'npc:%')) then
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
-- Library over from nothing. Diamonds stay spent and rewards stay paid.
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

  -- Cards up on the market are part of the collection being cleared: the
  -- listings come down and nothing goes back.
  if to_regclass('public.card_listings') is not null then
    update public.card_listings set status = 'cancelled', resolved_at = now()
     where status = 'open' and (p_email is null or lower(email) = lower(p_email));
  end if;

  -- And the photos on their Player Cards, which have no cards behind them now.
  if to_regclass('public.card_photos') is not null then
    delete from public.card_photos where p_email is null or lower(email) = lower(p_email);
  end if;

  -- And the Gold Rush sets they locked in and the cooldowns on their cards.
  if to_regclass('public.card_event_claims') is not null then
    delete from public.card_event_claims where p_email is null or lower(email) = lower(p_email);
  end if;
  if to_regclass('public.card_trade_locks') is not null then
    delete from public.card_trade_locks where p_email is null or lower(email) = lower(p_email);
  end if;

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

  -- The Gold Rush's sets too: locked in again from the cards still held.
  if to_regclass('public.card_event_claims') is not null then
    delete from public.card_event_claims where p_email is null or lower(email) = lower(p_email);
  end if;
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

-- ---------------------------------------------------------------------------
-- Quick selling a card
--
-- One copy of a card back for a few diamonds, by its rarity: Common and
-- Uncommon 1, Rare and Epic 2, Legendary 3, Mystic 30, a holo three times
-- its card and a Holo II nine. An Iconic cannot be sold at all, holo or
-- not. The same
-- numbers as QUICK_SELL in data/cards.js; change both together.
--
-- The rarity comes from the page, which grades a card from the season files
-- the same way it decides what is in a pack -- the same trust, with the
-- prices kept here, so a sale can never pay more than a Mystic does.
-- Diamonds only: nothing here, or anywhere, pays credits for a card.
--
-- The copy is taken under lock, so the same last copy cannot be sold twice
-- from two tabs. If it was the last one it comes off the showcase, and an
-- open trade it was in can no longer go through (accepting it marks it
-- expired, the same as a card traded away). Every sale is kept in
-- card_sales.
--
-- Returns the diamond balance after.
-- ---------------------------------------------------------------------------

create table if not exists public.card_sales (
  id       uuid primary key default gen_random_uuid(),
  email    text        not null,
  card_id  text        not null,
  rarity   text        not null,
  diamonds integer     not null,
  sold_at  timestamptz not null default now()
);

create index if not exists card_sales_email_idx
  on public.card_sales (email, sold_at desc);

alter table public.card_sales enable row level security;

drop policy if exists "card sales readable by owner or admin" on public.card_sales;
create policy "card sales readable by owner or admin"
  on public.card_sales for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

create or replace function public.quick_sell_card(p_card text, p_rarity text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := auth.jwt() ->> 'email';
  v_price   integer;
  v_have    integer;
  v_balance integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_card is null or not public.is_any_card_id(p_card) then
    raise exception 'Not a card: %', p_card;
  end if;
  if p_rarity = 'iconic' or p_card like 'r:%' then
    raise exception 'An Iconic card cannot be quick sold.';
  end if;

  v_price := case p_rarity
               when 'common'    then 1
               when 'uncommon'  then 1
               when 'rare'      then 2
               when 'epic'      then 2
               when 'legendary' then 3
               when 'mystic'    then 30
             end;
  if v_price is null then
    raise exception 'Not a rarity: %', p_rarity;
  end if;
  -- A holo sells for the three cards it was made from, a Holo II for the
  -- nine.
  if public.is_holo_id(p_card) then
    v_price := v_price * 3;
  elsif public.is_holo2_id(p_card) then
    v_price := v_price * 9;
  end if;

  select quantity into v_have
    from public.player_cards
   where email = v_email and card_id = p_card
     for update;

  if coalesce(v_have, 0) < 1 then
    raise exception 'That card is not in your collection.';
  end if;

  perform public.take_card(v_email, p_card);
  perform public.trim_card_locks(v_email, p_card);
  perform public.prune_showcase(v_email);

  insert into public.player_diamonds as pd (email, diamonds, updated_at)
  values (v_email, v_price, now())
  on conflict (email) do update
    set diamonds = pd.diamonds + v_price, updated_at = now()
  returning diamonds into v_balance;

  insert into public.card_sales (email, card_id, rarity, diamonds)
  values (v_email, p_card, p_rarity, v_price);

  return v_balance;
end;
$$;

revoke all on function public.quick_sell_card(text, text) from public, anon;
grant execute on function public.quick_sell_card(text, text) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- Player Cards
--
-- A Player Card is how much of one of the six an account has collected:
-- the fantasy points on every copy of his cards it holds, graded Common to
-- Iconic (PLAYER_RANKS in data/cards.js). Nothing about it is stored -- the
-- page reads it off the collection -- except what it has paid.
--
-- Every game a player plays pays each account a bonus by its rank on his
-- card: the game's diamonds before any booster, times the rank's bonus. It
-- goes in diamond_awards under pc-{slug}-w{week}, beside the account's own
-- games, and unlike those it is paid once and never topped up: the game is
-- settled at the rank held when it was first paid, so a climb later in the
-- season does not back-pay the weeks before it. A game at Common goes in at
-- nothing for the same reason.
--
-- The first time an account is paid at all, every game already out goes in
-- at nothing too (and a pc-start row marks that it has happened), so Player
-- Cards pay from the next game on rather than handing out the season so
-- far at whatever rank a big collection already has.
--
-- The same trust as a game's own diamonds: the page works out what is owed
-- from the season files and the collection, and this holds a key to the
-- shape the page issues and a game's bonus to 200 -- the 120 a game's
-- credits are held to, at the Iconic 1.5x, and a little over. Every rank's
-- bonus was halved on 2026-11-06 (Sam), and these holds with it.
--
-- Returns what it actually paid.
-- ===========================================================================

create or replace function public.pay_player_card_bonuses(p_season integer, p_awards jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_first boolean;
  v_paid  integer := 0;
  v_pay   integer;
  r       record;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_awards is null or jsonb_typeof(p_awards) <> 'array' then
    return 0;
  end if;

  -- Under lock on the balance row, so two tabs paying at once cannot both
  -- decide this is the first time.
  insert into public.player_diamonds (email, diamonds, updated_at)
  values (v_email, 0, now())
  on conflict (email) do nothing;
  perform 1 from public.player_diamonds where email = v_email for update;

  v_first := not exists (
    select 1 from public.diamond_awards where email = v_email and award_key = 'pc-start');
  if v_first then
    insert into public.diamond_awards (email, season, award_key, diamonds, note)
    values (v_email, p_season, 'pc-start', 0, 'Player Cards start paying from here')
    on conflict (email, season, award_key) do nothing;
  end if;

  for r in
    select
      a ->> 'key'                              as award_key,
      coalesce((a ->> 'diamonds')::integer, 0) as diamonds,
      a ->> 'note'                             as note
    from jsonb_array_elements(p_awards) as a
  loop
    continue when r.award_key is null
      or r.award_key !~ '^pc-[a-z]+(-[a-z]+)*-w[0-9]{1,2}$'
      or r.diamonds < 0 or r.diamonds > 200;

    v_pay := case when v_first then 0 else r.diamonds end;

    insert into public.diamond_awards (email, season, award_key, diamonds, note)
    values (v_email, p_season, r.award_key, v_pay,
            case when v_first then 'Out before your Player Cards: ' || coalesce(r.note, '') else r.note end)
    on conflict (email, season, award_key) do nothing;
    if found then
      v_paid := v_paid + v_pay;
    end if;
  end loop;

  if v_paid > 0 then
    update public.player_diamonds
       set diamonds = diamonds + v_paid, updated_at = now()
     where email = v_email;
  end if;

  return v_paid;
end;
$$;

revoke all on function public.pay_player_card_bonuses(integer, jsonb) from public, anon;
grant execute on function public.pay_player_card_bonuses(integer, jsonb) to authenticated;

-- ===========================================================================
-- The Shop's daily cards
--
-- Six cards a day, the same six for everybody, and each can be bought once:
-- a card bought is SOLD for everybody else until the shelf turns over at
-- midnight Eastern. The page rolls the shelf (rollShop in data/cards.js,
-- seeded by the date, so everybody proposes the same six) and the first
-- proposal of the day is kept -- the same trust a pack's contents run on,
-- with the shape held here: six real-looking cards, one Legendary at most
-- and nothing above it.
--
-- Prices by rarity, the same numbers as SHOP_PRICES in data/cards.js:
-- Common 10, Uncommon 12, Rare 15, Epic 20, Legendary 25 diamonds. Change
-- both together.
-- ===========================================================================

create table if not exists public.card_shop_days (
  day        date primary key,
  cards      jsonb       not null,       -- [{ "card": "p:2022:...", "rarity": "epic" }, ...]
  created_at timestamptz not null default now()
);

alter table public.card_shop_days enable row level security;

drop policy if exists "card shop days readable by players" on public.card_shop_days;
create policy "card shop days readable by players"
  on public.card_shop_days for select to authenticated
  using (true);

create table if not exists public.card_shop_buys (
  day      date        not null,
  slot     integer     not null,
  email    text        not null,
  card_id  text        not null,
  rarity   text        not null,
  diamonds integer     not null,
  bought_at timestamptz not null default now(),
  primary key (day, slot)
);

alter table public.card_shop_buys enable row level security;

-- Everybody sees what is gone, which is the whole of SOLD.
drop policy if exists "card shop buys readable by players" on public.card_shop_buys;
create policy "card shop buys readable by players"
  on public.card_shop_buys for select to authenticated
  using (true);

-- The shop's day: midnight to midnight, Eastern.
create or replace function public.card_shop_day()
returns date
language sql
stable
as $$
  select (now() at time zone 'America/New_York')::date;
$$;

-- Today's shelf, with what has sold. Keeps the proposal when there is no
-- shelf yet today; otherwise ignores it.
create or replace function public.card_shop_today(p_cards jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day   date := public.card_shop_day();
  v_cards jsonb;
  v_ok    boolean;
begin
  if auth.jwt() ->> 'email' is null then
    raise exception 'sign in first';
  end if;

  select cards into v_cards from public.card_shop_days where day = v_day;

  if v_cards is null and p_cards is not null and jsonb_typeof(p_cards) = 'array' then
    select jsonb_array_length(p_cards) between 1 and 6
       and bool_and(public.is_card_id(c ->> 'card')
                    and c ->> 'rarity' in ('common', 'uncommon', 'rare', 'epic', 'legendary'))
       and count(*) filter (where c ->> 'rarity' = 'legendary') <= 1
       and count(distinct c ->> 'card') = count(*)
      into v_ok
      from jsonb_array_elements(p_cards) as c;

    if coalesce(v_ok, false) then
      insert into public.card_shop_days (day, cards)
      values (v_day, p_cards)
      on conflict (day) do nothing;
      select cards into v_cards from public.card_shop_days where day = v_day;
    end if;
  end if;

  return jsonb_build_object(
    'day', v_day,
    'resets_at', ((v_day + 1)::timestamp at time zone 'America/New_York'),
    'cards', coalesce(v_cards, '[]'::jsonb),
    'sold', coalesce((select jsonb_agg(slot order by slot)
                        from public.card_shop_buys where day = v_day), '[]'::jsonb));
end;
$$;

-- Buys slot p_slot (counted from 0) off today's shelf. Returns the diamonds
-- left.
create or replace function public.buy_shop_card(p_slot integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email  text := auth.jwt() ->> 'email';
  v_day    date := public.card_shop_day();
  v_cards  jsonb;
  v_card   text;
  v_rarity text;
  v_price  integer;
  v_have   integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;

  select cards into v_cards from public.card_shop_days where day = v_day for update;
  if v_cards is null or p_slot is null or p_slot < 0 or p_slot >= jsonb_array_length(v_cards) then
    raise exception 'That card is not in the shop today.';
  end if;

  v_card := v_cards -> p_slot ->> 'card';
  v_rarity := v_cards -> p_slot ->> 'rarity';
  v_price := case v_rarity
               when 'common'    then 10
               when 'uncommon'  then 12
               when 'rare'      then 15
               when 'epic'      then 20
               when 'legendary' then 25
             end;
  if v_price is null then
    raise exception 'That card is not for sale.';
  end if;

  if exists (select 1 from public.card_shop_buys where day = v_day and slot = p_slot) then
    raise exception 'Sold. Somebody got there first.';
  end if;

  select diamonds into v_have from public.player_diamonds where email = v_email for update;
  if coalesce(v_have, 0) < v_price then
    raise exception 'Not enough diamonds: that card costs %, you have %.', v_price, coalesce(v_have, 0);
  end if;

  insert into public.card_shop_buys (day, slot, email, card_id, rarity, diamonds)
  values (v_day, p_slot, v_email, v_card, v_rarity, v_price);

  update public.player_diamonds
     set diamonds = diamonds - v_price, updated_at = now()
   where email = v_email;

  perform public.give_card(v_email, v_card);
  return v_have - v_price;
end;
$$;

revoke all on function public.card_shop_day() from public, anon;
revoke all on function public.card_shop_today(jsonb) from public, anon;
revoke all on function public.buy_shop_card(integer) from public, anon;
grant execute on function public.card_shop_day() to authenticated;
grant execute on function public.card_shop_today(jsonb) to authenticated;
grant execute on function public.buy_shop_card(integer) to authenticated;

-- ===========================================================================
-- The market
--
-- Players sell cards to each other for diamonds, at a price they pick. A
-- card put up comes out of the collection straight away -- so it cannot be
-- traded, quick sold or put up twice while it waits -- and goes to the
-- buyer when it sells, or back to its owner when they take it down or it
-- has been up 24 hours. Three listings a day each (counted over the last
-- 24 hours, whatever became of them). The same numbers as MARKET in
-- data/cards.js.
--
-- The buyer's diamonds go to the seller: diamonds only, never credits.
--
-- A listing that has run out is put back the next time anybody reads the
-- market, lists, buys or takes one down (expire_card_listings).
-- ===========================================================================

create table if not exists public.card_listings (
  id          uuid primary key default gen_random_uuid(),
  email       text        not null,
  card_id     text        not null,
  rarity      text        not null,
  price       integer     not null check (price between 1 and 999),
  status      text        not null default 'open'
              check (status in ('open', 'sold', 'cancelled', 'expired')),
  buyer_email text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '24 hours',
  resolved_at timestamptz
);

create index if not exists card_listings_open_idx on public.card_listings (status, expires_at);
create index if not exists card_listings_email_idx on public.card_listings (email, created_at desc);

alter table public.card_listings enable row level security;

drop policy if exists "card listings readable by players" on public.card_listings;
create policy "card listings readable by players"
  on public.card_listings for select to authenticated
  using (true);

-- Everything past its 24 hours goes back to its owner. Returns how many.
create or replace function public.expire_card_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  l       public.card_listings;
  v_count integer := 0;
begin
  for l in
    select * from public.card_listings
     where status = 'open' and expires_at <= now()
     for update skip locked
  loop
    perform public.give_card(l.email, l.card_id);
    update public.card_listings set status = 'expired', resolved_at = now() where id = l.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.list_card_for_sale(p_card text, p_rarity text, p_price integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_have  integer;
  v_id    uuid;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_card is null or not public.is_any_card_id(p_card) then
    raise exception 'Not a card: %', p_card;
  end if;
  if p_card like 'r:%' then
    raise exception 'An event''s Iconic card stays with whoever earned it.';
  end if;
  if p_rarity is null or p_rarity not in ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mystic', 'iconic') then
    raise exception 'Not a rarity: %', p_rarity;
  end if;
  if p_price is null or p_price < 1 or p_price > 999 then
    raise exception 'Pick a price from 1 to 999 diamonds.';
  end if;

  perform public.expire_card_listings();

  -- Under the balance row's lock, so two tabs cannot both list a third.
  insert into public.player_diamonds (email, diamonds, updated_at)
  values (v_email, 0, now())
  on conflict (email) do nothing;
  perform 1 from public.player_diamonds where email = v_email for update;

  if (select count(*) from public.card_listings
       where lower(email) = lower(v_email) and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'That is three listings in a day already. Try again tomorrow.';
  end if;

  select quantity into v_have
    from public.player_cards
   where email = v_email and card_id = p_card
     for update;
  if coalesce(v_have, 0) < 1 then
    raise exception 'That card is not in your collection.';
  end if;
  -- A sale is a trade: an event's card traded in the last 48 hours waits.
  if public.card_copies_free(v_email, p_card) < 1 then
    raise exception 'An event card can be traded once every 48 hours, and that one was traded too recently.';
  end if;

  perform public.take_card(v_email, p_card);
  perform public.prune_showcase(v_email);

  insert into public.card_listings (email, card_id, rarity, price)
  values (v_email, p_card, p_rarity, p_price)
  returning id into v_id;
  return v_id;
end;
$$;

-- Taken down by its owner (or an admin): the card goes back.
create or replace function public.cancel_card_listing(p_listing uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  l       public.card_listings;
begin
  select * into l from public.card_listings where id = p_listing for update;
  if l.id is null then
    raise exception 'There is no such listing.';
  end if;
  if lower(l.email) <> lower(coalesce(v_email, '')) and not public.is_admin() then
    raise exception 'Only the player who listed it can take it down.';
  end if;
  if l.status <> 'open' then
    raise exception 'That listing has already been %.', l.status;
  end if;

  perform public.give_card(l.email, l.card_id);
  update public.card_listings set status = 'cancelled', resolved_at = now() where id = l.id;
  return 'cancelled';
end;
$$;

-- Bought: the buyer's diamonds to the seller, the card to the buyer.
-- Returns the buyer's diamonds left.
create or replace function public.buy_card_listing(p_listing uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  l       public.card_listings;
  v_have  integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;

  perform public.expire_card_listings();

  select * into l from public.card_listings where id = p_listing for update;
  if l.id is null then
    raise exception 'There is no such listing.';
  end if;
  if l.status <> 'open' then
    raise exception 'That card is no longer for sale.';
  end if;
  if lower(l.email) = lower(v_email) then
    raise exception 'That is your own listing.';
  end if;

  select diamonds into v_have from public.player_diamonds where email = v_email for update;
  if coalesce(v_have, 0) < l.price then
    raise exception 'Not enough diamonds: that card costs %, you have %.', l.price, coalesce(v_have, 0);
  end if;

  update public.player_diamonds
     set diamonds = diamonds - l.price, updated_at = now()
   where email = v_email;

  insert into public.player_diamonds as pd (email, diamonds, updated_at)
  values (l.email, l.price, now())
  on conflict (email) do update
    set diamonds = pd.diamonds + l.price, updated_at = now();

  perform public.give_card(v_email, l.card_id);
  perform public.lock_traded_card(v_email, l.card_id);
  update public.card_listings
     set status = 'sold', buyer_email = v_email, resolved_at = now()
   where id = l.id;

  return v_have - l.price;
end;
$$;

revoke all on function public.expire_card_listings() from public, anon;
revoke all on function public.list_card_for_sale(text, text, integer) from public, anon;
revoke all on function public.cancel_card_listing(uuid) from public, anon;
revoke all on function public.buy_card_listing(uuid) from public, anon;
grant execute on function public.expire_card_listings() to authenticated;
grant execute on function public.list_card_for_sale(text, text, integer) to authenticated;
grant execute on function public.cancel_card_listing(uuid) to authenticated;
grant execute on function public.buy_card_listing(uuid) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- Player Cards on the showcase
--
-- A player's Player Cards can go on their own page too, in the same five
-- showcase slots as their cards ('pc:{slug}' in card_showcases.cards; see
-- set_card_showcase). A Player Card is worked out from the collection, and
-- a collection is only readable signed in, so showcased_player_cards hands
-- anybody -- signed out too -- just the cards of the players put up, which
-- is what the owner chose to show.
--
-- Player Cards used to sit in a row of their own (card_showcases.
-- player_cards, set by set_player_card_showcase). Any still there move into
-- the slots, first, as many as fit in six; the column stays, empty.
-- ===========================================================================

alter table public.card_showcases add column if not exists player_cards text[] not null default '{}';

update public.card_showcases
   set cards = (array(select 'pc:' || p from unnest(player_cards) with ordinality as t(p, n)
                       where not ('pc:' || p = any(cards)) order by n) || cards)[1:6],
       player_cards = '{}',
       updated_at = now()
 where cardinality(player_cards) > 0;

drop function if exists public.set_player_card_showcase(text[]);

-- ===========================================================================
-- Custom photos on Player Cards. A player can put a picture of their own on
-- any Player Card they hold a card of, in place of the headshot, on their
-- own copy only. One per account per player, so six accounts and six
-- players make 36 at the very most. The page crops it square and shrinks it
-- to a small WebP (about 30-60 KB) before it comes here, and it is kept as
-- a data URL in the row itself: 36 of them are a few megabytes, and that
-- needs no storage bucket. Anybody can see them, signed out too, like the
-- cards on a player's page; they are only written through set_card_photo
-- and clear_card_photo.
--
-- An NFL Player Card can take one too (Sam, 2026-11-06), slug 'n:{slug}'.
-- There are hundreds of NFL teammates, so to keep the table small an
-- account has at most six of those up, each under about 60 KB: a dozen
-- accounts at their most is a few megabytes more.
-- ===========================================================================

create table if not exists public.card_photos (
  email      text        not null,
  slug       text        not null,
  photo      text        not null,
  updated_at timestamptz not null default now(),
  primary key (email, slug)
);

alter table public.card_photos enable row level security;

drop policy if exists "card photos readable by anybody" on public.card_photos;
create policy "card photos readable by anybody"
  on public.card_photos for select to anon, authenticated
  using (true);

create or replace function public.set_card_photo(p_slug text, p_photo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_nfl   boolean := p_slug ~ '^n:[a-z0-9]+(-[a-z0-9]+)*$';
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_slug is null or (p_slug !~ '^[a-z]+(-[a-z]+)*$' and not v_nfl) then
    raise exception 'Not a player: %', p_slug;
  end if;
  if v_nfl then
    if not public.holds_nfl_player(v_email, substr(p_slug, 3)) then
      raise exception 'You need an NFL card of that player to put a photo on his NFL Player Card.';
    end if;
    -- Six up, counting only teammates still held, whose cards show them.
    if (select count(*) from public.card_photos
         where email = v_email and slug like 'n:%' and slug <> p_slug
           and public.holds_nfl_player(v_email, substr(slug, 3))) >= 6 then
      raise exception 'You can have six NFL Player Card photos up. Take one down first.';
    end if;
  elsif not exists (select 1 from public.player_cards
                     where email = v_email and quantity > 0 and split_part(card_id, ':', 3) = p_slug) then
    raise exception 'You need a card of that player to put a photo on his Player Card.';
  end if;
  if p_photo is null or p_photo !~ '^data:image/(webp|jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$' then
    raise exception 'That is not a picture the page can show.';
  end if;
  -- About 100 KB of picture; the page sends a third of that. An NFL
  -- Player Card's about 60 KB.
  if length(p_photo) > (case when v_nfl then 80000 else 140000 end) then
    raise exception 'That picture is too big. Try a smaller one.';
  end if;

  insert into public.card_photos (email, slug, photo, updated_at)
  values (v_email, p_slug, p_photo, now())
  on conflict (email, slug) do update set photo = excluded.photo, updated_at = now();
end;
$$;

-- Takes a photo down: your own, or anybody's for an admin (p_email). With
-- p_slug null an admin takes down every photo that account has up.
create or replace function public.clear_card_photo(p_slug text, p_email text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_count integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_email is not null and lower(p_email) <> lower(v_email) then
    if not public.is_admin() then
      raise exception 'Only an admin can take down somebody else''s photo.';
    end if;
    v_email := p_email;
  elsif p_slug is null then
    raise exception 'Which Player Card?';
  end if;

  delete from public.card_photos
   where lower(email) = lower(v_email) and (p_slug is null or slug = p_slug);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.set_card_photo(text, text) from public, anon;
revoke all on function public.clear_card_photo(text, text) from public, anon;
grant execute on function public.set_card_photo(text, text) to authenticated;
grant execute on function public.clear_card_photo(text, text) to authenticated;

-- { "players": [slug, ...], "nfl": [slug, ...], "cards": { card_id: quantity },
--   "earned": { slug: diamonds }, "photos": { slug: data url } } for the
-- players this account has put up, and nothing else of its collection or
-- its awards. "nfl" are the NFL Player Cards up ('npc:{slug}'), whose
-- NFL cards are among "cards" and whose photos are under 'n:{slug}'.
-- "earned" is what each of the six's Player Cards has paid it, every
-- season, which the card prints; "photos" the custom pictures on them
-- (card_photos, further down).
create or replace function public.showcased_player_cards(p_email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'players', to_jsonb(s.player_cards),
    'nfl', to_jsonb(s.nfl_cards),
    'cards', coalesce((
      select jsonb_object_agg(pc.card_id, pc.quantity)
        from public.player_cards pc
       where pc.email = s.email and pc.quantity > 0
         and (split_part(pc.card_id, ':', 3) = any(s.player_cards)
              or (split_part(pc.card_id, ':', 3) = any(s.nfl_cards)
                  and public.is_nfl_card_id(regexp_replace(pc.card_id, ':holo2?$', ''))))), '{}'::jsonb),
    'earned', coalesce((
      select jsonb_object_agg(e.slug, e.total)
        from (select regexp_replace(da.award_key, '^pc-(.+)-w[0-9]+$', '\1') as slug,
                     sum(da.diamonds) as total
                from public.diamond_awards da
               where da.email = s.email and da.award_key ~ '^pc-.+-w[0-9]+$'
               group by 1) e
       where e.slug = any(s.player_cards)), '{}'::jsonb),
    'photos', coalesce((
      select jsonb_object_agg(ph.slug, ph.photo)
        from public.card_photos ph
       where ph.email = s.email
         and (ph.slug = any(s.player_cards) or ph.slug = any(array(select 'n:' || x from unnest(s.nfl_cards) x)))),
      '{}'::jsonb))
    from (select p_email as email,
                 coalesce((select array(select substr(c, 4) from unnest(cs.cards) with ordinality as t(c, n)
                                         where c like 'pc:%' order by n)
                             from public.card_showcases cs where cs.email = p_email), '{}') as player_cards,
                 coalesce((select array(select substr(c, 5) from unnest(cs.cards) with ordinality as t(c, n)
                                         where c like 'npc:%' order by n)
                             from public.card_showcases cs where cs.email = p_email), '{}') as nfl_cards) s;
$$;

grant execute on function public.showcased_player_cards(text) to anon, authenticated;

-- What each of an account's Player Cards has paid it, every season:
-- { slug: diamonds }, for the Players page when it shows somebody else's
-- Player Cards, and each Team Card's as 'tc:PIT' (data/team-cards.js).
-- diamond_awards itself stays readable by its owner alone; this hands over
-- the Player Card and Team Card totals and nothing else.
create or replace function public.player_card_earnings(p_email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(e.slug, e.total), '{}'::jsonb)
    from (select case when da.award_key ~ '^tc-'
                      then 'tc:' || upper(regexp_replace(da.award_key, '^tc-([a-z]+)-w[0-9]+$', '\1'))
                      else regexp_replace(da.award_key, '^pc-(.+)-w[0-9]+$', '\1') end as slug,
                 sum(da.diamonds) as total
            from public.diamond_awards da
           where da.email = p_email
             and (da.award_key ~ '^pc-.+-w[0-9]+$' or da.award_key ~ '^tc-[a-z]{2,3}-w[0-9]{1,2}$')
           group by 1) e;
$$;

revoke all on function public.player_card_earnings(text) from public, anon;
grant execute on function public.player_card_earnings(text) to authenticated;

-- ===========================================================================
-- Recent opens: the last packs anybody opened, for the Shop's Recent Pulls.
-- card_packs itself stays readable by its owner and an admin only; this
-- hands any signed-in player who opened what, and when, and nothing of what
-- it cost. At most 16 (four a page, three clicks back).
-- ===========================================================================

create or replace function public.recent_card_opens(p_limit integer default 16)
returns table (email text, pack_key text, cards text[], opened_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select cp.email, cp.pack_key, cp.cards, cp.opened_at
    from public.card_packs cp
   order by cp.opened_at desc
   limit least(greatest(coalesce(p_limit, 16), 1), 16);
$$;

revoke all on function public.recent_card_opens(integer) from public, anon;
grant execute on function public.recent_card_opens(integer) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- New trades: the red count on Cards in the nav. An offer is new to the
-- player it is made to until they have had the Trades page open with it on
-- screen; the page then marks it seen here. Seen on one device, it is seen
-- on all of them. Offers already open when this first runs count as new.
-- ===========================================================================

alter table public.card_trades add column if not exists seen_at timestamptz;

create or replace function public.mark_trades_seen(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_count integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  update public.card_trades
     set seen_at = now()
   where id = any(coalesce(p_ids, '{}'))
     and lower(to_email) = lower(v_email)
     and seen_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_trades_seen(uuid[]) from public, anon;
grant execute on function public.mark_trades_seen(uuid[]) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- Holographic cards (Sam, 2026-10-15). Three copies of one card merge into
-- one holo of it: the three come out of the collection and one
-- '{card}:holo' goes in, carrying all three cards' fantasy points (the page
-- prints three times the card's), so a Player Card loses nothing by it. It
-- cannot be undone: nothing here or anywhere turns a holo back into cards.
--
-- A holo is owned, traded, shown, quick sold (for three times its card)
-- and put on the market like any other card; is_holo_id says what one looks
-- like. Every merge is kept in card_merges.
--
-- Making one pays diamonds (Sam, 2026-10-20): a tenth of the holo's fantasy
-- score (three times the card's), rounded up, at least 1, so a 170-point
-- holo pays 17 (holoBonus in data/cards.js). The score is in the season
-- files, not in Postgres, so the page says what it comes to -- the same
-- trust as a game's diamonds. There is no cap; this only turns down more
-- than 60, which would take a 200-point card, against a page that has been
-- tampered with. The biggest card there is pays 20. HOLO_BONUS_MAX in
-- data/cards.js is the same 60, and the two are changed together.
-- card_merges.diamonds keeps what each merge paid, which the diamonds page
-- lists; a merge from before this pays nothing after it.
--
-- Holo II (Sam, 2026-10-31): three holos of one card merge the same way,
-- into its Holo II ('{card}:holo2', is_holo2_id), carrying all nine cards'
-- points. It pays a tenth of the Holo II's score the same way, turning
-- down more than 180 (three times 60, the same margin). card_merges keeps
-- the holo's id as the card merged. A Holo II merges no further.
--
-- Holo all (merge_holo_cards, after it): every merge the page asks for in
-- one go, each one exactly as merge_holo_card makes it.
-- ===========================================================================

create table if not exists public.card_merges (
  id        uuid primary key default gen_random_uuid(),
  email     text        not null,
  card_id   text        not null,          -- the card merged; the holo is card_id || ':holo', a holo's Holo II '...:holo2'
  merged_at timestamptz not null default now()
);

create index if not exists card_merges_email_idx
  on public.card_merges (email, merged_at desc);

alter table public.card_merges add column if not exists diamonds integer not null default 0;

alter table public.card_merges enable row level security;

drop policy if exists "card merges readable by owner or admin" on public.card_merges;
create policy "card merges readable by owner or admin"
  on public.card_merges for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

-- Merges three copies of p_card into its holo (or three holos into their
-- Holo II) and pays p_diamonds for it. Returns { left: copies of the card
-- left, diamonds: what it paid, balance: the diamonds after, holo: what it
-- made }.
--
-- It took the card alone and returned the copies left. Postgres will not
-- change a function's arguments or what it returns in place, so the old
-- one goes first; re-running this drops and recreates it.
drop function if exists public.merge_holo_card(text);

create or replace function public.merge_holo_card(p_card text, p_diamonds integer default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := auth.jwt() ->> 'email';
  v_holo    text;
  v_have    integer;
  v_locked  integer;
  v_until   timestamptz;
  v_bonus   integer := greatest(coalesce(p_diamonds, 1), 1);
  v_balance integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_card is null or not public.is_any_card_id(p_card) or public.is_holo2_id(p_card) then
    raise exception 'Only a card or a holo can be merged: %', p_card;
  end if;
  if v_bonus > (case when public.is_holo_id(p_card) then 180 else 60 end) then
    raise exception 'That is more than a holo pays.';
  end if;
  -- A card makes its holo, a holo its Holo II.
  v_holo := p_card || case when public.is_holo_id(p_card) then '2' else ':holo' end;
  -- An event's Iconic card has no holo.
  if not (public.is_holo_id(v_holo) or public.is_holo2_id(v_holo)) then
    raise exception 'That card has no holo.';
  end if;

  -- Under lock, so the same three copies cannot be merged twice from two
  -- tabs, or sold or traded away while they are being merged.
  select quantity into v_have
    from public.player_cards
   where email = v_email and card_id = p_card
     for update;

  if coalesce(v_have, 0) < 3 then
    raise exception 'It takes three copies of a card to merge it. You have %.', coalesce(v_have, 0);
  end if;

  update public.player_cards set quantity = quantity - 3
   where email = v_email and card_id = p_card;
  delete from public.player_cards
   where email = v_email and card_id = p_card and quantity <= 0;
  perform public.give_card(v_email, v_holo);

  -- Event copies still cooling down from a trade that went into it take
  -- their cooldown into the holo, so merging cannot skip one.
  if p_card ~ ':(gr|hw|hc|ar)(:holo)?$' then
    select count(*), max(locked_until) into v_locked, v_until
      from public.card_trade_locks
     where lower(email) = lower(v_email) and card_id = p_card and locked_until > now();
    if v_locked > v_have - 3 then
      insert into public.card_trade_locks (email, card_id, locked_until)
      values (lower(v_email), v_holo, v_until);
      perform public.trim_card_locks(v_email, p_card);
    end if;
  end if;

  -- The last copies merged: if the card was up on the showcase, its holo
  -- goes up in its place.
  if v_have = 3 then
    update public.card_showcases
       set cards = array_replace(cards, p_card, v_holo), updated_at = now()
     where email = v_email and p_card = any(cards) and not (v_holo = any(cards));
  end if;
  perform public.prune_showcase(v_email);

  insert into public.card_merges (email, card_id, diamonds) values (v_email, p_card, v_bonus);

  insert into public.player_diamonds as pd (email, diamonds, updated_at)
  values (v_email, v_bonus, now())
  on conflict (email) do update
    set diamonds = pd.diamonds + v_bonus, updated_at = now()
  returning diamonds into v_balance;

  return jsonb_build_object('left', v_have - 3, 'diamonds', v_bonus, 'balance', v_balance, 'holo', v_holo);
end;
$$;

revoke all on function public.merge_holo_card(text, integer) from public, anon;
grant execute on function public.merge_holo_card(text, integer) to authenticated;

-- Holo all (Sam, 2026-10-31): p_cards[i] merged once for each time it is
-- named, paying p_diamonds[i], in the order given, each one through
-- merge_holo_card. One that cannot go (a copy traded away in another tab)
-- is left out and the rest still go; the first reason one did not is
-- `problem`. Returns { made: [what each merge made], diamonds: all it
-- paid, balance: the diamonds after, problem }.
create or replace function public.merge_holo_cards(p_cards text[], p_diamonds integer[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := auth.jwt() ->> 'email';
  v_n       integer := coalesce(array_length(p_cards, 1), 0);
  v_made    text[] := '{}';
  v_paid    integer := 0;
  v_res     jsonb;
  v_problem text;
  v_balance integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if v_n = 0 then
    raise exception 'There is nothing to merge.';
  end if;
  if v_n > 300 then
    raise exception 'That is more than can be merged at once.';
  end if;
  if coalesce(array_length(p_diamonds, 1), 0) <> v_n then
    raise exception 'Each merge needs what it pays.';
  end if;

  for i in 1 .. v_n loop
    begin
      v_res := public.merge_holo_card(p_cards[i], p_diamonds[i]);
      v_made := v_made || (v_res ->> 'holo');
      v_paid := v_paid + coalesce((v_res ->> 'diamonds')::integer, 0);
    exception when others then
      v_problem := coalesce(v_problem, sqlerrm);
    end;
  end loop;

  select diamonds into v_balance from public.player_diamonds where email = v_email;
  return jsonb_build_object('made', to_jsonb(v_made), 'diamonds', v_paid,
                            'balance', v_balance, 'problem', v_problem);
end;
$$;

revoke all on function public.merge_holo_cards(text[], integer[]) from public, anon;
grant execute on function public.merge_holo_cards(text[], integer[]) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- The daily spin (Sam, 2026-10-15). One free spin a day for every account,
-- on the Shop page. The day turns over at 7:00 AM Central -- America/
-- Chicago, so it follows daylight saving -- and an account's one spin a day
-- is the primary key of card_spins, so a second spin, from another tab or
-- straight at the database, is refused.
--
-- The prize is rolled here, so nobody picks their own, on the same odds as
-- SPIN in data/cards.js (change both together):
--
--   Uncommon card 35%, 5 diamonds 25%, Rare card 20%, Base Pack 15%,
--   Pro Pack 3%, Legendary card 2%.
--
-- Which card or cards a prize is the page proposes, because the season
-- files that say what a card is are not in Postgres -- the same trust a
-- pack runs on. It proposes every prize before the roll, and they all have
-- to look right before anything is rolled, so leaving the small prizes out
-- cannot buy another try at the big ones. A pack won goes in card_packs as
-- 'spin-base' or 'spin-pro', costing nothing, so it shows in Recent Pulls.
-- ===========================================================================

create table if not exists public.card_spins (
  email    text        not null,
  day      date        not null,
  prize    text        not null,
  cards    text[]      not null default '{}',
  diamonds integer     not null default 0,
  spun_at  timestamptz not null default now(),
  primary key (email, day)
);

alter table public.card_spins enable row level security;

drop policy if exists "card spins readable by owner or admin" on public.card_spins;
create policy "card spins readable by owner or admin"
  on public.card_spins for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

-- The wheel's day: from 7:00 AM Central to 7:00 AM Central the next morning,
-- named for the day it starts.
create or replace function public.card_spin_day()
returns date
language sql
stable
as $$
  select ((now() at time zone 'America/Chicago') - interval '7 hours')::date;
$$;

-- When a wheel's day ends: 7:00 AM Central the morning after it.
create or replace function public.card_spin_ends(p_day date)
returns timestamptz
language sql
stable
as $$
  select ((p_day + 1)::timestamp + interval '7 hours') at time zone 'America/Chicago';
$$;

-- Where this account stands today: { day, next_at, spin } where spin is
-- today's { prize, cards, diamonds, spun_at }, or null before it spins.
create or replace function public.card_spin_today()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_day   date := public.card_spin_day();
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  return jsonb_build_object(
    'day', v_day,
    'next_at', public.card_spin_ends(v_day),
    'spin', (select jsonb_build_object('prize', s.prize, 'cards', to_jsonb(s.cards),
                                       'diamonds', s.diamonds, 'spun_at', s.spun_at)
               from public.card_spins s
              where s.email = v_email and s.day = v_day));
end;
$$;

-- Spins. p_offer is every prize the page proposes:
--   { "uncommon": id, "rare": id, "legendary": id, "nfl-rare": NFL id,
--     "base": [three ids], "pro": [five ids], "nfl": [four NFL ids] }
-- The odds are SPIN's in data/cards.js (Sam, 2026-11-07: the NFL Rare card
-- with the everyday prizes, the NFL Pack with the jackpots); change both.
-- Returns { day, next_at, prize, cards, won, diamonds }: `won` the diamonds
-- the spin paid, `diamonds` the balance after.
create or replace function public.spin_card_wheel(p_offer jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := auth.jwt() ->> 'email';
  v_day     date := public.card_spin_day();
  v_roll    double precision;
  v_prize   text;
  v_cards   text[] := '{}';
  v_won     integer := 0;
  v_balance integer;
  v_card    text;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;

  -- Every prize, checked one step at a time so nothing is asked of a part
  -- that is not there.
  if p_offer is null or jsonb_typeof(p_offer) <> 'object' then
    raise exception 'The wheel could not be filled. Reload the page and spin again.';
  end if;
  -- The six's prizes are the six's cards and the NFL ones NFL cards.
  if not coalesce(public.is_card_id(p_offer ->> 'uncommon') and not public.is_nfl_card_id(p_offer ->> 'uncommon'), false)
     or not coalesce(public.is_card_id(p_offer ->> 'rare') and not public.is_nfl_card_id(p_offer ->> 'rare'), false)
     or not coalesce(public.is_card_id(p_offer ->> 'legendary') and not public.is_nfl_card_id(p_offer ->> 'legendary'), false)
     or not coalesce(public.is_nfl_card_id(p_offer ->> 'nfl-rare'), false) then
    raise exception 'The wheel could not be filled. Reload the page and spin again.';
  end if;
  if coalesce(jsonb_typeof(p_offer -> 'base'), '') <> 'array'
     or coalesce(jsonb_typeof(p_offer -> 'pro'), '') <> 'array'
     or coalesce(jsonb_typeof(p_offer -> 'nfl'), '') <> 'array' then
    raise exception 'The wheel could not be filled. Reload the page and spin again.';
  end if;
  if jsonb_array_length(p_offer -> 'base') <> 3 or jsonb_array_length(p_offer -> 'pro') <> 5
     or jsonb_array_length(p_offer -> 'nfl') <> 4
     or exists (select 1 from jsonb_array_elements(p_offer -> 'base') c
                 where jsonb_typeof(c) <> 'string' or not public.is_card_id(c #>> '{}')
                    or public.is_nfl_card_id(c #>> '{}'))
     or exists (select 1 from jsonb_array_elements(p_offer -> 'pro') c
                 where jsonb_typeof(c) <> 'string' or not public.is_card_id(c #>> '{}')
                    or public.is_nfl_card_id(c #>> '{}'))
     or exists (select 1 from jsonb_array_elements(p_offer -> 'nfl') c
                 where jsonb_typeof(c) <> 'string' or not public.is_nfl_card_id(c #>> '{}')) then
    raise exception 'The wheel could not be filled. Reload the page and spin again.';
  end if;

  if exists (select 1 from public.card_spins where email = v_email and day = v_day) then
    raise exception 'You have had today''s spin. The wheel turns over at 7:00 AM Central.';
  end if;

  -- Uncommon 28, 5 diamonds 20, Rare 17, NFL Rare 15, Base Pack 12, NFL
  -- Pack 3, Pro Pack 3, Legendary 2.
  v_roll := random() * 100;
  v_prize := case
               when v_roll < 28 then 'uncommon'
               when v_roll < 48 then 'diamonds'
               when v_roll < 65 then 'rare'
               when v_roll < 80 then 'nfl-rare'
               when v_roll < 92 then 'base'
               when v_roll < 95 then 'nfl'
               when v_roll < 98 then 'pro'
               else 'legendary'
             end;

  if v_prize in ('uncommon', 'rare', 'legendary', 'nfl-rare') then
    v_cards := array[p_offer ->> v_prize];
  elsif v_prize in ('base', 'pro', 'nfl') then
    v_cards := array(select c from jsonb_array_elements_text(p_offer -> v_prize) with ordinality as t(c, n)
                      order by n);
  else
    v_won := 5;
  end if;

  -- The row is the one spin a day: two at once, and the second stops here.
  insert into public.card_spins (email, day, prize, cards, diamonds)
  values (v_email, v_day, v_prize, v_cards, v_won)
  on conflict (email, day) do nothing;
  if not found then
    raise exception 'You have had today''s spin. The wheel turns over at 7:00 AM Central.';
  end if;

  foreach v_card in array v_cards loop
    perform public.give_card(v_email, v_card);
  end loop;

  if v_prize in ('base', 'pro', 'nfl') then
    insert into public.card_packs (email, pack_key, credits, diamonds, cards)
    values (v_email, 'spin-' || v_prize, 0, 0, v_cards);
  end if;

  insert into public.player_diamonds as pd (email, diamonds, updated_at)
  values (v_email, v_won, now())
  on conflict (email) do update
    set diamonds = pd.diamonds + v_won, updated_at = now()
  returning diamonds into v_balance;

  return jsonb_build_object(
    'day', v_day,
    'next_at', public.card_spin_ends(v_day),
    'prize', v_prize,
    'cards', to_jsonb(v_cards),
    'won', v_won,
    'diamonds', v_balance);
end;
$$;

revoke all on function public.card_spin_day() from public, anon;
revoke all on function public.card_spin_ends(date) from public, anon;
revoke all on function public.card_spin_today() from public, anon;
revoke all on function public.spin_card_wheel(jsonb) from public, anon;
grant execute on function public.card_spin_day() to authenticated;
grant execute on function public.card_spin_ends(date) to authenticated;
grant execute on function public.card_spin_today() to authenticated;
grant execute on function public.spin_card_wheel(jsonb) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- The Gold Rush (Sam, 2026-10-16): a limited-time event, seven days from
-- when an admin starts it on the admin page.
--
-- While it is on the shop sells a Gold Rush Pack (open_card_pack, 15
-- diamonds for four cards) of Sam's and Cooper's cards and every rushing
-- touchdown, each one a Gold Rush card: the card's id with ':gr' on the
-- end, a card of its own that never stacks with the standard copies. The
-- pack can also hold one of Sam's two card-art cards ('a:...:gr').
--
-- The event has six sets (data/cards.js, eventSets), filled only with Gold
-- Rush cards. Each is locked in once, with every card it was made with in
-- the collection (claim_event_set), and pays a reward like a Library set: a
-- Gold Rush card, diamonds and a booster, more for the harder sets. All six
-- locked in before the event ends pays the Iconic GOLD RUSH card
-- ('r:gold-rush:gr', claim_event_reward), which no pack holds and which
-- cannot be traded, listed or sold, with diamonds and a 2.5x booster.
--
-- Gold Rush cards trade, but a copy that changes hands -- a trade or a
-- market sale -- cannot be traded or listed again for 48 hours
-- (card_trade_locks), so one set of cards cannot be passed round to finish
-- everybody's sets. The cooldown is per copy: the others of that card a
-- player already had trade as before.
--
-- Halloween (Sam, 2026-10-26) runs the same way on the same tables: its
-- pack is 18 diamonds for four Halloween cards (':hw'), a Legendary or
-- better among them now and then in costume (':hc', a card of its own),
-- and its sets pay like the Gold Rush's. Its Iconic HALLOWEEN card
-- ('r:halloween:hw') needs all eight of its sets (card_events.needs) and
-- comes with two 2.5x Boosters ("boosters": 2 in its rewards), and
-- its Card Art set only takes card art the player pulled from a Halloween
-- Pack themselves (card_events.pulled, checked against card_packs).
--
-- The Air Raid (Sam, 2026-11-06) is the third: 18 diamonds for four Air
-- Raid cards (':ar') of Andrew and Paxon, two card-art cards among them at
-- the base rate, and twelve very hard sets, all of which its Iconic AIR
-- RAID card ('r:air-raid:ar') needs, paid with 150 diamonds and three 2.5x
-- Boosters.
-- ===========================================================================

create table if not exists public.card_events (
  key        text primary key,
  name       text        not null,
  days       integer     not null,
  sets       text[]      not null,
  reward     text        not null,
  starts_at  timestamptz,
  ends_at    timestamptz,
  updated_at timestamptz not null default now()
);

-- What locking in each set pays besides its card, keyed by set, and under
-- the event's own key what the reward card comes with:
-- { "marathon": { "diamonds": 15, "booster": "boost-1-5" }, ... }.
alter table public.card_events add column if not exists rewards jsonb not null default '{}'::jsonb;

-- The tags on the end of the event's card ids ({gr}; {hw,hc}), the sets its
-- reward card needs (null: every set), and the sets whose cards must have
-- come out of the player's own packs of the event (the pack has the
-- event's key).
alter table public.card_events add column if not exists tags text[] not null default '{gr}';
alter table public.card_events add column if not exists needs text[];
alter table public.card_events add column if not exists pulled text[] not null default '{}';

alter table public.card_events enable row level security;

drop policy if exists "card events are readable" on public.card_events;
create policy "card events are readable"
  on public.card_events for select to anon, authenticated
  using (true);

-- The Gold Rush itself: its sets (the same keys as eventSets in
-- data/cards.js), its reward, and what each set pays (EVENT_REWARDS and
-- GOLD_RUSH.bonus there; change them together). Re-running this leaves when
-- it runs alone.
insert into public.card_events (key, name, days, sets, reward, rewards)
values ('gold-rush', 'Gold Rush', 7,
        array['cooper-clark', 'sam-stogsdill', 'marathon', 'red-zone-rushes', 'triple', 'card-art'],
        'r:gold-rush:gr',
        '{"card-art":        {"diamonds":  8},
          "sam-stogsdill":   {"diamonds": 10, "booster": "boost-1-5"},
          "triple":          {"diamonds": 12, "booster": "boost-1-5"},
          "marathon":        {"diamonds": 15, "booster": "boost-1-5"},
          "red-zone-rushes": {"diamonds": 20, "booster": "boost-2-0"},
          "cooper-clark":    {"diamonds": 25, "booster": "boost-2-0"},
          "gold-rush":       {"diamonds": 40, "booster": "boost-2-5"}}'::jsonb)
on conflict (key) do update
  set name = excluded.name, days = excluded.days, sets = excluded.sets, reward = excluded.reward,
      rewards = excluded.rewards;

-- Halloween: its eight sets (eventSets in data/cards.js), all of which the
-- HALLOWEEN card needs, and what each pays (HALLOWEEN.rewards and
-- HALLOWEEN.bonus there; change them together).
insert into public.card_events (key, name, days, sets, reward, rewards, tags, needs, pulled)
values ('halloween', 'Halloween', 7,
        array['graveyard', 'card-art', 'trick-or-treat', 'ufo', 'holoween', 'october',
              'witching-hour', 'monster-mash'],
        'r:halloween:hw',
        '{"card-art":       {"diamonds": 10},
          "witching-hour":  {"diamonds": 12, "booster": "boost-1-5"},
          "monster-mash":   {"diamonds": 15, "booster": "boost-1-5"},
          "october":        {"diamonds": 20, "booster": "boost-1-5"},
          "graveyard":      {"diamonds": 20, "booster": "boost-2-0"},
          "ufo":            {"diamonds": 25, "booster": "boost-2-0"},
          "holoween":       {"diamonds": 30, "booster": "boost-2-0"},
          "trick-or-treat": {"diamonds": 40, "booster": "boost-2-5"},
          "halloween":      {"diamonds": 100, "booster": "boost-2-5", "boosters": 2}}'::jsonb,
        array['hw', 'hc'],
        array['graveyard', 'card-art', 'trick-or-treat', 'ufo', 'holoween', 'october',
              'witching-hour', 'monster-mash'],
        array['card-art'])
on conflict (key) do update
  set name = excluded.name, days = excluded.days, sets = excluded.sets, reward = excluded.reward,
      rewards = excluded.rewards, tags = excluded.tags, needs = excluded.needs, pulled = excluded.pulled;

-- The Air Raid: its twelve sets (eventSets in data/cards.js), every one of
-- which the AIR RAID card needs, and what each pays (AIR_RAID.rewards and
-- AIR_RAID.bonus there; change them together). None of its sets wants a
-- card the player pulled themselves.
insert into public.card_events (key, name, days, sets, reward, rewards, tags, needs, pulled)
values ('air-raid', 'Air Raid', 7,
        array['card-art', 'paxon-hatch', 'andrew-parr', 'bombs-away', 'stratosphere', 'cloud-nine',
              'silver-lining', 'jet-stream', 'air-strike', 'final-approach', 'altitude', 'contrails'],
        'r:air-raid:ar',
        '{"paxon-hatch":    {"diamonds": 15, "booster": "boost-1-5"},
          "stratosphere":   {"diamonds": 20, "booster": "boost-1-5"},
          "bombs-away":     {"diamonds": 20, "booster": "boost-1-5"},
          "cloud-nine":     {"diamonds": 20, "booster": "boost-1-5"},
          "air-strike":     {"diamonds": 25, "booster": "boost-2-0"},
          "andrew-parr":    {"diamonds": 25, "booster": "boost-2-0"},
          "jet-stream":     {"diamonds": 30, "booster": "boost-2-0"},
          "silver-lining":  {"diamonds": 30, "booster": "boost-2-0"},
          "final-approach": {"diamonds": 35, "booster": "boost-2-0"},
          "altitude":       {"diamonds": 35, "booster": "boost-2-0"},
          "contrails":      {"diamonds": 40, "booster": "boost-2-5"},
          "card-art":       {"diamonds": 50, "booster": "boost-2-5"},
          "air-raid":       {"diamonds": 150, "booster": "boost-2-5", "boosters": 3}}'::jsonb,
        array['ar'],
        array['card-art', 'paxon-hatch', 'andrew-parr', 'bombs-away', 'stratosphere', 'cloud-nine',
              'silver-lining', 'jet-stream', 'air-strike', 'final-approach', 'altitude', 'contrails'],
        array[]::text[])
on conflict (key) do update
  set name = excluded.name, days = excluded.days, sets = excluded.sets, reward = excluded.reward,
      rewards = excluded.rewards, tags = excluded.tags, needs = excluded.needs, pulled = excluded.pulled;

-- Whether an event is on right now.
create or replace function public.card_event_live(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select starts_at is not null and now() >= starts_at and now() < ends_at
                     from public.card_events where key = p_key), false);
$$;

grant execute on function public.card_event_live(text) to anon, authenticated;

-- The sets each player has locked in, and the reward (set_key = the
-- event's own key) once it is claimed.
create table if not exists public.card_event_claims (
  email      text        not null,
  event_key  text        not null,
  set_key    text        not null,
  cards      text[]      not null default '{}',
  claimed_at timestamptz not null default now(),
  primary key (email, event_key, set_key)
);

-- What it paid: { card, diamonds, booster }.
alter table public.card_event_claims add column if not exists reward jsonb;

alter table public.card_event_claims enable row level security;

drop policy if exists "card event claims readable by owner or admin" on public.card_event_claims;
create policy "card event claims readable by owner or admin"
  on public.card_event_claims for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

-- One row per event copy that changed hands, until it can go again.
-- Readable by any signed-in player, since the trade builder shows which of
-- the other player's cards are cooling down.
create table if not exists public.card_trade_locks (
  id           bigint generated always as identity primary key,
  email        text        not null,
  card_id      text        not null,
  locked_until timestamptz not null,
  created_at   timestamptz not null default now()
);

create index if not exists card_trade_locks_card_idx
  on public.card_trade_locks (email, card_id, locked_until);

alter table public.card_trade_locks enable row level security;

drop policy if exists "card trade locks readable by players" on public.card_trade_locks;
create policy "card trade locks readable by players"
  on public.card_trade_locks for select to authenticated
  using (true);

-- How many copies of a card a collection can trade right now: all it has,
-- less the event copies still cooling down.
create or replace function public.card_copies_free(p_email text, p_card text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(0,
    coalesce((select quantity from public.player_cards where email = p_email and card_id = p_card), 0)
    - (select count(*)::integer from public.card_trade_locks
        where lower(email) = lower(p_email) and card_id = p_card and locked_until > now()));
$$;

-- Whether every card in the list can be traded now (each is in a trade once).
create or replace function public.cards_free(p_email text, p_cards text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from unnest(coalesce(p_cards, '{}')) as c
                      where public.card_copies_free(p_email, c) < 1);
$$;

-- A copy that has just changed hands: 48 hours before it can go again, if
-- it is an event's card. Old cooldowns are cleared out on the way.
create or replace function public.lock_traded_card(p_email text, p_card text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.card_trade_locks where locked_until < now() - interval '1 day';
  insert into public.card_trade_locks (email, card_id, locked_until)
  select lower(p_email), p_card, now() + interval '48 hours'
   where p_card ~ ':(gr|hw|hc|ar)(:holo2?)?$';
$$;

-- No more cooldowns on a card than copies of it left (a sale, a merge):
-- the ones that run out soonest go first.
create or replace function public.trim_card_locks(p_email text, p_card text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.card_trade_locks
   where id in (
     select id from public.card_trade_locks
      where lower(email) = lower(p_email) and card_id = p_card and locked_until > now()
      order by locked_until asc
      limit greatest(0,
        (select count(*)::integer from public.card_trade_locks
          where lower(email) = lower(p_email) and card_id = p_card and locked_until > now())
        - coalesce((select quantity from public.player_cards where email = p_email and card_id = p_card), 0)));
$$;

revoke all on function public.card_copies_free(text, text) from public, anon;
revoke all on function public.cards_free(text, text[]) from public, anon;
revoke all on function public.lock_traded_card(text, text) from public, anon, authenticated;
revoke all on function public.trim_card_locks(text, text) from public, anon, authenticated;
grant execute on function public.card_copies_free(text, text) to authenticated;
grant execute on function public.cards_free(text, text[]) to authenticated;

-- An admin starts an event: it runs its days from now. Refused while it is
-- already on. Returns the row.
create or replace function public.start_card_event(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.card_events;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can do that.';
  end if;
  if public.card_event_live(p_key) then
    raise exception 'That event is already on.';
  end if;
  update public.card_events
     set starts_at = now(), ends_at = now() + make_interval(days => days), updated_at = now()
   where key = p_key
  returning * into e;
  if e.key is null then
    raise exception 'There is no such event.';
  end if;
  return to_jsonb(e);
end;
$$;

-- An admin ends an event early, now.
create or replace function public.end_card_event(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.card_events;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can do that.';
  end if;
  if not public.card_event_live(p_key) then
    raise exception 'That event is not on.';
  end if;
  update public.card_events set ends_at = now(), updated_at = now()
   where key = p_key
  returning * into e;
  return to_jsonb(e);
end;
$$;

-- Locks in one of an event's sets: the page says which of the event's cards
-- it was made with, and they all have to be in the collection -- and for a
-- set in card_events.pulled, to have come out of a pack of the event's
-- this player opened. Only while the event is on, and once. Pays the
-- set's reward: the card the page rolled (one of the event's cards, as a
-- Library set's is any card -- the same trust),
-- and the diamonds and booster card_events.rewards holds for the set,
-- whatever the page says. Returns { claimed: how many of the event's sets
-- this player has locked in, diamonds: the balance after }.
--
-- It used to take three arguments and return the count; Postgres will not
-- change either in place, so the old one goes first.
drop function if exists public.claim_event_set(text, text, text[]);

create or replace function public.claim_event_set(
  p_event       text,
  p_set         text,
  p_cards       text[],
  p_reward_card text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text := auth.jwt() ->> 'email';
  e          public.card_events;
  v_card     text;
  v_pay      jsonb;
  v_diamonds integer;
  v_booster  text;
  v_balance  integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  select * into e from public.card_events where key = p_event;
  if e.key is null then
    raise exception 'There is no such event.';
  end if;
  if not public.card_event_live(p_event) then
    raise exception 'The % is not on.', e.name;
  end if;
  if p_set is null or not (p_set = any(e.sets)) then
    raise exception 'Not a % set: %', e.name, p_set;
  end if;
  if coalesce(array_length(p_cards, 1), 0) = 0 then
    raise exception 'A set is made of cards.';
  end if;
  foreach v_card in array p_cards loop
    if v_card like 'r:%' or not public.is_any_card_id(v_card)
       or not (substring(v_card from ':([a-z]+)(:holo2?)?$') = any(e.tags)) then
      raise exception 'Only % cards count for its sets: %', e.name, v_card;
    end if;
    if p_set = any(e.pulled) and not exists (
         select 1 from public.card_packs
          where email = v_email and pack_key = e.key
            and regexp_replace(v_card, ':holo2?$', '') = any(cards)) then
      raise exception 'That set takes a card you pulled from a % Pack yourself.', e.name;
    end if;
  end loop;
  if p_reward_card is not null
     and (not public.is_event_card_id(p_reward_card) or p_reward_card like 'r:%'
          or not (substring(p_reward_card from ':([a-z]+)$') = any(e.tags))) then
    raise exception 'Not a % card: %', e.name, p_reward_card;
  end if;
  if not public.owns_cards(v_email, p_cards) then
    raise exception 'Some of those cards are not in your collection.';
  end if;

  v_pay := coalesce(e.rewards -> p_set, '{}'::jsonb);
  v_diamonds := greatest(coalesce((v_pay ->> 'diamonds')::integer, 0), 0);
  v_booster := v_pay ->> 'booster';
  if v_booster is not null and v_booster not in ('boost-1-5', 'boost-2-0', 'boost-2-5') then
    v_booster := null;
  end if;

  insert into public.card_event_claims (email, event_key, set_key, cards, reward)
  values (v_email, p_event, p_set, p_cards,
          jsonb_build_object('card', p_reward_card, 'diamonds', v_diamonds, 'booster', v_booster))
  on conflict (email, event_key, set_key) do nothing;
  if not found then
    raise exception 'That set is already locked in.';
  end if;

  if p_reward_card is not null then
    perform public.give_card(v_email, p_reward_card);
  end if;

  insert into public.player_diamonds as pd (email, diamonds, updated_at)
  values (v_email, v_diamonds, now())
  on conflict (email) do update
    set diamonds = pd.diamonds + v_diamonds, updated_at = now()
  returning diamonds into v_balance;

  if v_booster is not null then
    perform public.give_booster(v_email, v_booster);
  end if;

  return jsonb_build_object(
    'claimed', (select count(*) from public.card_event_claims
                 where email = v_email and event_key = p_event and set_key = any(e.sets)),
    'diamonds', v_balance);
end;
$$;

-- Every set it needs (card_events.needs, else every set) locked in before
-- the event ends: the event's reward card, once, with what
-- card_events.rewards holds under the event's own key. Returns the card's
-- id.
create or replace function public.claim_event_reward(p_event text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text := auth.jwt() ->> 'email';
  e          public.card_events;
  v_pay      jsonb;
  v_diamonds integer;
  v_booster  text;
  v_boosters integer;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  select * into e from public.card_events where key = p_event;
  if e.key is null then
    raise exception 'There is no such event.';
  end if;
  if not public.card_event_live(p_event) then
    raise exception 'The % is over.', e.name;
  end if;
  if (select count(*) from public.card_event_claims
       where email = v_email and event_key = p_event and set_key = any(coalesce(e.needs, e.sets)))
     < cardinality(coalesce(e.needs, e.sets)) then
    raise exception 'Lock in every % set first.', e.name;
  end if;

  v_pay := coalesce(e.rewards -> p_event, '{}'::jsonb);
  v_diamonds := greatest(coalesce((v_pay ->> 'diamonds')::integer, 0), 0);
  v_booster := v_pay ->> 'booster';
  if v_booster is not null and v_booster not in ('boost-1-5', 'boost-2-0', 'boost-2-5') then
    v_booster := null;
  end if;
  -- How many of it: "boosters" (two with the HALLOWEEN card, three with
  -- the AIR RAID card), one if unset.
  v_boosters := least(greatest(coalesce((v_pay ->> 'boosters')::integer, 1), 1), 5);

  insert into public.card_event_claims (email, event_key, set_key, reward)
  values (v_email, p_event, p_event,
          jsonb_build_object('card', e.reward, 'diamonds', v_diamonds, 'booster', v_booster,
                             'boosters', case when v_booster is null then 0 else v_boosters end))
  on conflict (email, event_key, set_key) do nothing;
  if not found then
    raise exception 'You already have the % card.', e.name;
  end if;

  perform public.give_card(v_email, e.reward);
  insert into public.player_diamonds as pd (email, diamonds, updated_at)
  values (v_email, v_diamonds, now())
  on conflict (email) do update
    set diamonds = pd.diamonds + v_diamonds, updated_at = now();
  if v_booster is not null then
    for i in 1 .. v_boosters loop
      perform public.give_booster(v_email, v_booster);
    end loop;
  end if;
  return e.reward;
end;
$$;

revoke all on function public.start_card_event(text) from public, anon;
revoke all on function public.end_card_event(text) from public, anon;
revoke all on function public.claim_event_set(text, text, text[], text) from public, anon;
revoke all on function public.claim_event_reward(text) from public, anon;
grant execute on function public.start_card_event(text) to authenticated;
grant execute on function public.end_card_event(text) to authenticated;
grant execute on function public.claim_event_set(text, text, text[], text) to authenticated;
grant execute on function public.claim_event_reward(text) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- The NFL sim
--
-- The admin page's NFL Sim tab plays the whole league in the browser
-- (js/nfl-sim.js) and keeps the world here, one row per file, the same
-- files the command line keeps in its world folder: league.json (every
-- player, team and pick), games-{year}.json, stats-{year}.json and
-- trades.json, each gzipped. Team ratings and everything else the sim
-- knows about a team are in here, so only an admin can read or write it.
--
-- What the Teams pages show is nfl_sim_rosters: every team's players with
-- nothing private in them (no team ratings, no potential), one row per
-- season, written by the NFL Sim tab and readable by everybody.
-- ===========================================================================

create table if not exists public.nfl_sim_files (
  name       text        primary key check (name ~ '^[a-z0-9-]+\.json$'),
  body       text        not null,
  updated_at timestamptz not null default now()
);

alter table public.nfl_sim_files enable row level security;

drop policy if exists "nfl sim files read by an admin" on public.nfl_sim_files;
create policy "nfl sim files read by an admin"
  on public.nfl_sim_files for select to authenticated
  using (public.is_admin());

drop policy if exists "nfl sim files added by an admin" on public.nfl_sim_files;
create policy "nfl sim files added by an admin"
  on public.nfl_sim_files for insert to authenticated
  with check (public.is_admin());

drop policy if exists "nfl sim files changed by an admin" on public.nfl_sim_files;
create policy "nfl sim files changed by an admin"
  on public.nfl_sim_files for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "nfl sim files removed by an admin" on public.nfl_sim_files;
create policy "nfl sim files removed by an admin"
  on public.nfl_sim_files for delete to authenticated
  using (public.is_admin());

revoke all on public.nfl_sim_files from anon;

create table if not exists public.nfl_sim_rosters (
  season   integer     primary key check (season between 2023 and 2100),
  rosters  jsonb       not null,
  saved_at timestamptz not null default now()
);

alter table public.nfl_sim_rosters enable row level security;

drop policy if exists "nfl rosters read by everybody" on public.nfl_sim_rosters;
create policy "nfl rosters read by everybody"
  on public.nfl_sim_rosters for select to anon, authenticated
  using (true);

drop policy if exists "nfl rosters added by an admin" on public.nfl_sim_rosters;
create policy "nfl rosters added by an admin"
  on public.nfl_sim_rosters for insert to authenticated
  with check (public.is_admin());

drop policy if exists "nfl rosters changed by an admin" on public.nfl_sim_rosters;
create policy "nfl rosters changed by an admin"
  on public.nfl_sim_rosters for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "nfl rosters removed by an admin" on public.nfl_sim_rosters;
create policy "nfl rosters removed by an admin"
  on public.nfl_sim_rosters for delete to authenticated
  using (public.is_admin());

revoke insert, update, delete on public.nfl_sim_rosters from anon;
grant select on public.nfl_sim_rosters to anon, authenticated;
grant select, insert, update, delete on public.nfl_sim_rosters to authenticated;
grant select, insert, update, delete on public.nfl_sim_files to authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- The weeks the NFL sim has played
--
-- The NFL Sim tab stores every week it plays here, so a week can be played,
-- published and the next one played with nothing committed in between. The
-- site lays these over stats/{year}.js and data/nfl-results.js when it
-- loads (js/stored-weeks.js), and Download the season files on the tab
-- writes them into those files whenever wanted. Two rows a week:
--
--   results   the six's results, stat lines, big plays and injuries
--             (`games`, by slug) and every NFL score that week (`scores`).
--             Nobody but an admin reads it until the week is published.
--   fixtures  the six's playoff games that week, which no season file has
--             until the sim has played the round. Readable once the week
--             before it is out, so the game is on the schedule, and can take
--             a wager, ahead of its own week.
-- ---------------------------------------------------------------------------

create table if not exists public.sim_weeks (
  season   integer     not null check (season between 2018 and 2100),
  week     integer     not null check (week between 0 and 40),
  part     text        not null check (part in ('results', 'fixtures')),
  games    jsonb       not null default '{}'::jsonb,
  scores   jsonb       not null default '[]'::jsonb,
  saved_at timestamptz not null default now(),
  primary key (season, week, part)
);

alter table public.sim_weeks enable row level security;

drop policy if exists "sim weeks read once they are out" on public.sim_weeks;
create policy "sim weeks read once they are out"
  on public.sim_weeks for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.published_weeks p
       where p.season = sim_weeks.season
         and p.week = case when sim_weeks.part = 'fixtures' then sim_weeks.week - 1 else sim_weeks.week end
    )
  );

drop policy if exists "sim weeks added by an admin" on public.sim_weeks;
create policy "sim weeks added by an admin"
  on public.sim_weeks for insert to authenticated
  with check (public.is_admin());

drop policy if exists "sim weeks changed by an admin" on public.sim_weeks;
create policy "sim weeks changed by an admin"
  on public.sim_weeks for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sim weeks removed by an admin" on public.sim_weeks;
create policy "sim weeks removed by an admin"
  on public.sim_weeks for delete to authenticated
  using (public.is_admin());

revoke insert, update, delete on public.sim_weeks from anon;
grant select on public.sim_weeks to anon, authenticated;
grant select, insert, update, delete on public.sim_weeks to authenticated;

-- ---------------------------------------------------------------------------
-- The six's trades in the NFL sim
--
-- One of the six traded on the NFL Sim tab plays for his new team from the
-- week the league plays next (Sam, 2026-10-23). One row a trade: from
-- `week` of `season` his games are `to_team`'s (`games`, the rows his
-- season file has for them, each team by its key in EGE.teams), and every
-- game before it stays as he played it. The tab keeps these in line with
-- the league after every step, so a week undone takes a trade back with
-- it, and the site lays them over stats/{year}.js (js/stored-weeks.js)
-- until Download the season files writes them in. Everybody reads them: a
-- trade is out the moment it is made.
-- ---------------------------------------------------------------------------

create table if not exists public.sim_trades (
  season    integer     not null check (season between 2018 and 2100),
  slug      text        not null,
  week      integer     not null check (week between 0 and 40),
  from_team text,
  to_team   text        not null,
  games     jsonb       not null default '[]'::jsonb,
  saved_at  timestamptz not null default now(),
  primary key (season, slug, week)
);

alter table public.sim_trades enable row level security;

drop policy if exists "sim trades read by everybody" on public.sim_trades;
create policy "sim trades read by everybody"
  on public.sim_trades for select to anon, authenticated
  using (true);

drop policy if exists "sim trades added by an admin" on public.sim_trades;
create policy "sim trades added by an admin"
  on public.sim_trades for insert to authenticated
  with check (public.is_admin());

drop policy if exists "sim trades changed by an admin" on public.sim_trades;
create policy "sim trades changed by an admin"
  on public.sim_trades for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sim trades removed by an admin" on public.sim_trades;
create policy "sim trades removed by an admin"
  on public.sim_trades for delete to authenticated
  using (public.is_admin());

revoke insert, update, delete on public.sim_trades from anon;
grant select on public.sim_trades to anon, authenticated;
grant select, insert, update, delete on public.sim_trades to authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Every NFL game's box score, for the League page
--
-- One row a week the NFL sim played (Sam, 2026-10-30): every game's score,
-- both teams' numbers, every player's line, the scoring plays and who got
-- hurt (nfl-sim/lib/site.js boxRows). Nothing private: a player is his
-- name, position, team and ESPN id, never the sim's own id or ratings.
-- The NFL Sim tab keeps these in line with the world after every step,
-- `digest` telling it which weeks changed without reading them back.
-- Nobody but an admin reads a week until it is published, so a score, a
-- line or an injury is never out before its week is.
-- ---------------------------------------------------------------------------

create table if not exists public.sim_box_scores (
  season   integer     not null check (season between 2023 and 2100),
  week     integer     not null check (week between 1 and 40),
  games    jsonb       not null default '[]'::jsonb,
  digest   text        not null default '',
  saved_at timestamptz not null default now(),
  primary key (season, week)
);

alter table public.sim_box_scores enable row level security;

drop policy if exists "sim box scores read once they are out" on public.sim_box_scores;
create policy "sim box scores read once they are out"
  on public.sim_box_scores for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.published_weeks p
       where p.season = sim_box_scores.season and p.week = sim_box_scores.week
    )
  );

drop policy if exists "sim box scores added by an admin" on public.sim_box_scores;
create policy "sim box scores added by an admin"
  on public.sim_box_scores for insert to authenticated
  with check (public.is_admin());

drop policy if exists "sim box scores changed by an admin" on public.sim_box_scores;
create policy "sim box scores changed by an admin"
  on public.sim_box_scores for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sim box scores removed by an admin" on public.sim_box_scores;
create policy "sim box scores removed by an admin"
  on public.sim_box_scores for delete to authenticated
  using (public.is_admin());

revoke insert, update, delete on public.sim_box_scores from anon;
grant select on public.sim_box_scores to anon, authenticated;
grant select, insert, update, delete on public.sim_box_scores to authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Live Mode
--
-- A game the NFL sim has played, put on live a snap at a time (Sam,
-- 2026-11-03): PLAY LIVE on the NFL Sim tab puts it up waiting for its
-- kickoff, and the bot says so at once; an admin kicks it off from the
-- game's own page (Sam, 2026-11-04). From `starts_at` every entry comes up
-- at its own `ms` (Sam, 2026-11-09; nfl-sim/lib/live.js): five seconds of
-- waiting before each snap but a punt, an entry of its own with nothing in
-- it about the snap; then the snap, its call first ("Jaykeb Stewart pass")
-- and what came of it `reveal_ms` (5 seconds) later, for 7 seconds (a
-- punt's for 12); halftime for two minutes. Everything runs off
-- this database's clock, so every viewer is on the same snap whenever they
-- look and however often they reload. An admin can pause it, end it at
-- once, restart it from the kickoff or cancel it (live_control).
--
--   live_games  who plays, when it starts (null until it kicks off), how
--               many snaps and how long it runs, whether it is paused, and
--               the bets on offer before kickoff. Anybody reads it; there
--               is nothing in it that gives the game away.
--   live_feeds  every snap, written when the game goes live (nfl-sim/lib/
--               live.js), with the halftime bets and what every bet comes
--               to (nfl-sim/lib/live-bets.js). Nobody reads it directly:
--               live_feed() hands out the snaps whose time has come, and
--               the one being played only as its call until it is
--               revealed, and the halftime bets once it is halftime, so the
--               end of the game is never in a browser before it happens.
--   live_posts  what the Discord bot says and when: the game and the link,
--               the kickoff, every score, punt and turnover, halftime and
--               the final, each `at_ms` from kickoff. live_deliver() sends
--               each when it is due, on a pg_cron clock that runs only
--               while there is something to send, through pg_net to the
--               'live' webhook (or the NFL one). Without pg_cron or pg_net
--               here the NFL Sim tab sends them while it is open
--               (live_claim).
--   live_bets   diamonds on the game (Sam, 2026-11-04): the spread, a
--               touchdown scorer and three players' over/unders before
--               kickoff; a scorer for the rest of the game and the spread
--               again at halftime. At least 10 diamonds a bet, one bet a
--               market, each paying its price times the stake back once
--               the final whistle has gone (live_settle). Placed only
--               through live_bet_place, which takes the diamonds and the
--               price from the menu, never from the page. A market the
--               menu marks a push gives the stake back, and so does
--               taking the game off before it is over, by any road
--               (live_refund).
--
-- A game put on locks the boosters and wagers of the six playing in it
-- (Sam, 2026-11-09; live_games.emails): none goes on that week's game and
-- none comes off while the game is on, or once it is over, until it is
-- taken off -- cancelled, or the week played again or undone. An admin
-- aside (game_boosters_live_lock).
-- ---------------------------------------------------------------------------

do $$
begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'Live Mode: pg_net is not available here (%); the NFL Sim tab sends the live posts instead.', sqlerrm;
end $$;

do $$
begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'Live Mode: pg_cron is not available here (%); the NFL Sim tab sends the live posts instead.', sqlerrm;
end $$;

create table if not exists public.live_games (
  id         text        primary key check (id ~ '^[a-z0-9-]{3,60}$'),
  season     integer     not null check (season between 2023 and 2100),
  week       integer     not null check (week between 1 and 40),
  home       text        not null,
  away       text        not null,
  title      text        not null default '',
  starts_at  timestamptz,
  slot_ms    integer     not null default 20000 check (slot_ms between 2000 and 120000),
  reveal_ms  integer     not null default 4000 check (reveal_ms between 0 and 60000),
  plays      integer     not null check (plays between 1 and 2000),
  length_ms  bigint,
  paused_at  timestamptz,
  bets       jsonb,
  reached_ms bigint,
  created_at timestamptz not null default now()
);

alter table public.live_games add column if not exists length_ms bigint;
alter table public.live_games add column if not exists paused_at timestamptz;
-- Null until an admin kicks it off (2026-11-04).
alter table public.live_games alter column starts_at drop not null;
-- The bets on offer before kickoff, and how far into the game it has ever
-- been before a restart: a halftime bet is not taken on a second half
-- anybody has seen.
alter table public.live_games add column if not exists bets jsonb;
alter table public.live_games add column if not exists reached_ms bigint;
-- The six on either team (their slugs), for the game's Game Packs (Sam,
-- 2026-11-06; at the end of this file): a game with none of them in it has
-- no cards to make one of. Null for a game put on before it was kept.
alter table public.live_games add column if not exists six text[];
-- And the addresses they sign in with, lowercased, for the lock on their
-- boosters and wagers that week (Sam, 2026-11-09; at the end of this part).
alter table public.live_games add column if not exists emails text[];

create table if not exists public.live_feeds (
  game_id   text  primary key references public.live_games (id) on delete cascade,
  entries   jsonb not null check (jsonb_typeof(entries) = 'array'),
  half_bets jsonb,
  results   jsonb
);

alter table public.live_feeds add column if not exists half_bets jsonb;
alter table public.live_feeds add column if not exists results jsonb;

create table if not exists public.live_posts (
  id      bigint      generated always as identity primary key,
  game_id text        not null references public.live_games (id) on delete cascade,
  seq     integer     not null,
  due_at  timestamptz,
  at_ms   bigint,
  payload jsonb       not null,
  sent_at timestamptz,
  unique (game_id, seq)
);

-- A post waits for the kickoff with no time of its own; `at_ms` is when it
-- goes, from kickoff (less than nothing for the game's announcement).
alter table public.live_posts alter column due_at drop not null;
alter table public.live_posts add column if not exists at_ms bigint;

create index if not exists live_posts_waiting on public.live_posts (due_at) where sent_at is null;

create table if not exists public.live_bets (
  id         bigint      generated always as identity primary key,
  game_id    text        not null references public.live_games (id) on delete cascade,
  email      text        not null,
  market     text        not null check (market ~ '^[a-z0-9]{1,12}$'),
  pick       text        not null check (pick ~ '^[a-z0-9]{1,12}$'),
  stake      integer     not null check (stake between 10 and 1000000),
  x          numeric(5,2) not null check (x >= 1 and x <= 20),
  placed_at  timestamptz not null default now(),
  settled_at timestamptz,
  payout     integer,
  unique (game_id, email, market)
);

create index if not exists live_bets_open on public.live_bets (game_id) where settled_at is null;

alter table public.live_games enable row level security;
alter table public.live_feeds enable row level security;
alter table public.live_posts enable row level security;
alter table public.live_bets enable row level security;

drop policy if exists "live games read by everybody" on public.live_games;
create policy "live games read by everybody"
  on public.live_games for select to anon, authenticated
  using (true);

drop policy if exists "live games changed by an admin" on public.live_games;
create policy "live games changed by an admin"
  on public.live_games for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "live feeds kept by an admin" on public.live_feeds;
create policy "live feeds kept by an admin"
  on public.live_feeds for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "live posts kept by an admin" on public.live_posts;
create policy "live posts kept by an admin"
  on public.live_posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Each player sees their own bets, an admin everybody's. Nobody writes one
-- straight: live_bet_place takes them, live_settle pays them.
drop policy if exists "live bets read by their owner or an admin" on public.live_bets;
create policy "live bets read by their owner or an admin"
  on public.live_bets for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

revoke all on public.live_feeds from anon;
revoke all on public.live_posts from anon;
revoke all on public.live_bets from anon;
revoke insert, update, delete on public.live_games from anon;
revoke insert, update, delete on public.live_bets from authenticated;
grant select on public.live_games to anon, authenticated;
grant select, insert, update, delete on public.live_games, public.live_feeds, public.live_posts to authenticated;
grant select on public.live_bets to authenticated;

-- What a viewer may see of a game, as of now: the snaps from `p_from` up to
-- the one being played, that one only as its call (and the face of whoever
-- it names) until it is revealed.
-- `now` is this database's clock in milliseconds, and `clock` the game's
-- (milliseconds from kickoff, standing still while it is paused; null while
-- it `waiting`s for an admin to kick it off), so the page can set its own by
-- them; `next` is when the next snap comes up, once this one is out; `at` is
-- the snap being played (-1 before kickoff); `state` is where the ball is as
-- far as anybody may know; `half` the halftime bets, from halftime on, with
-- when they close and whether they are open. Null for no such game.
create or replace function public.live_feed(p_id text, p_from integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  g        public.live_games%rowtype;
  v_all    jsonb;
  v_ms     bigint;
  v_len    bigint;
  v_at     integer := -1;
  v_cur    jsonb;
  v_cur_ms bigint;
  v_next   bigint;
  v_shown  boolean := false;
  v_state  jsonb;
  v_list   jsonb := '[]'::jsonb;
  v_hb     jsonb;
  v_half   jsonb;
begin
  select * into g from public.live_games where id = p_id;
  if not found then return null; end if;
  select entries, half_bets into v_all, v_hb from public.live_feeds where game_id = p_id;
  /* Paused, the game's clock stands where it stopped. */
  v_ms := floor(extract(epoch from (coalesce(g.paused_at, now()) - g.starts_at)) * 1000)::bigint;
  v_len := coalesce(g.length_ms, g.plays::bigint * g.slot_ms);
  if v_ms >= 0 and v_all is not null then
    select coalesce(max(e.n) - 1, 0)::integer into v_at
      from jsonb_array_elements(v_all) with ordinality as e (value, n)
     where coalesce((e.value ->> 'ms')::bigint, (e.n - 1) * g.slot_ms) <= v_ms;
    v_cur := v_all -> v_at;
    v_cur_ms := coalesce((v_cur ->> 'ms')::bigint, v_at::bigint * g.slot_ms);
    v_shown := not (v_cur ? 'call')
               or v_ms - v_cur_ms >= g.reveal_ms
               or v_ms >= v_len;
    /* When the next snap comes up, once this one is out (and so whether
       the ball changed hands is no secret). */
    if v_shown and v_at < g.plays - 1 then
      v_next := coalesce((v_all -> (v_at + 1) ->> 'ms')::bigint, (v_at + 1)::bigint * g.slot_ms);
    end if;
    v_state := case when v_shown then v_cur -> 'post' else v_cur -> 'pre' end;
    select coalesce(jsonb_agg(e.value order by e.n), '[]'::jsonb) into v_list
      from jsonb_array_elements(v_all) with ordinality as e (value, n)
     where e.n - 1 >= greatest(p_from, 0) and e.n - 1 < v_at;
    if greatest(p_from, 0) <= v_at then
      v_list := v_list || jsonb_build_array(case when v_shown then v_cur
        else jsonb_strip_nulls(jsonb_build_object('call', v_cur -> 'call', 'pre', v_cur -> 'pre', 'hidden', true,
               'ms', v_cur_ms, 'w', v_cur -> 'w', 'p', case when v_cur ? 'w' and v_cur -> 'p' ? (v_cur ->> 'w')
                 then jsonb_build_object(v_cur ->> 'w', v_cur -> 'p' -> (v_cur ->> 'w')) end)) end);
    end if;
    if v_hb is not null and v_ms >= (v_hb ->> 'opens')::bigint then
      v_half := jsonb_build_object('markets', v_hb -> 'markets', 'closes', (v_hb ->> 'closes')::bigint,
        'open', v_ms < (v_hb ->> 'closes')::bigint and coalesce(g.reached_ms, 0) < (v_hb ->> 'closes')::bigint);
    end if;
  end if;
  return jsonb_build_object(
    'now', floor(extract(epoch from now()) * 1000)::bigint,
    'starts', floor(extract(epoch from g.starts_at) * 1000)::bigint,
    'clock', v_ms, 'paused', g.paused_at is not null, 'waiting', g.starts_at is null,
    'slot', g.slot_ms, 'reveal', g.reveal_ms, 'plays', g.plays,
    'at', v_at, 'from', greatest(p_from, 0), 'shown', v_shown, 'next', v_next,
    'state', v_state, 'entries', v_list, 'half', v_half);
end;
$$;

revoke all on function public.live_feed(text, integer) from public;
grant execute on function public.live_feed(text, integer) to anon, authenticated;

-- A post's embeds stamped with the time it really goes, which nobody knows
-- until the game kicks off.
create or replace function public.live_stamp(p_payload jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select case when jsonb_typeof(p_payload -> 'embeds') = 'array' then
    jsonb_set(p_payload, '{embeds}', (
      select coalesce(jsonb_agg(case when x.e ? 'timestamp'
               then jsonb_set(x.e, '{timestamp}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))
               else x.e end order by x.n), '[]'::jsonb)
        from jsonb_array_elements(p_payload -> 'embeds') with ordinality as x (e, n)))
  else p_payload end
$$;

-- Pays every bet on a game once its final whistle has gone: the price
-- times the stake for a winner, less 10% of the winnings, the stake back for a push, nothing
-- otherwise. Once each, however many viewers ask; anybody may, since it
-- pays only what the game already says. Whoever won the most of them gets
-- the game's Game Pack (award_game_packs, at the end of this file). The
-- game is held while it settles, and a second ask meanwhile leaves it to
-- the first, so the bets are settled and the packs handed out once.
-- Returns how many it settled.
create or replace function public.live_settle(p_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  g     public.live_games%rowtype;
  v_all jsonb;
  v_res jsonb;
  v_ms  bigint;
  v_end bigint;
  b     record;
  v_pay integer;
  v_n   integer := 0;
begin
  select * into g from public.live_games where id = p_id for update skip locked;
  if not found or g.starts_at is null or g.paused_at is not null then return 0; end if;
  select entries, results into v_all, v_res from public.live_feeds where game_id = p_id;
  if v_res is null then return 0; end if;
  v_ms := floor(extract(epoch from (now() - g.starts_at)) * 1000)::bigint;
  v_end := coalesce((v_all -> -1 ->> 'ms')::bigint, (g.plays - 1)::bigint * g.slot_ms);
  if v_ms < v_end then return 0; end if;
  for b in
    select * from public.live_bets where game_id = p_id and settled_at is null for update skip locked
  loop
    -- A winner keeps 90% of what it won over the stake (Sam's 10% tax,
    -- 2026-11-06; pays() in js/live.js does the same sum).
    v_pay := case
      when coalesce(v_res -> 'push', '[]'::jsonb) ? b.market then b.stake
      when coalesce(v_res -> b.market, '[]'::jsonb) ? b.pick
        then b.stake + round((round(b.stake * b.x) - b.stake) * 0.9)::integer
      else 0 end;
    update public.live_bets set settled_at = now(), payout = v_pay where id = b.id;
    if v_pay > 0 then
      insert into public.player_diamonds as pd (email, diamonds, updated_at)
      values (b.email, v_pay, now())
      on conflict (email) do update set diamonds = pd.diamonds + v_pay, updated_at = now();
    end if;
    v_n := v_n + 1;
  end loop;
  if v_n > 0 then
    perform public.award_game_packs(p_id);
  end if;
  return v_n;
end;
$$;

revoke all on function public.live_settle(text) from public;
grant execute on function public.live_settle(text) to anon, authenticated;

-- Every game whose final whistle has gone with bets still on it, settled.
create or replace function public.live_settle_due()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r   record;
  v_n integer := 0;
begin
  for r in select distinct b.game_id from public.live_bets b where b.settled_at is null loop
    v_n := v_n + public.live_settle(r.game_id);
  end loop;
  return v_n;
end;
$$;

revoke all on function public.live_settle_due() from public, anon, authenticated;

-- A bet: `p_stake` diamonds on `p_pick` in `p_market`, at the price the
-- game's menu has for it. Before kickoff only the menu in live_games.bets
-- is open; at halftime only the halftime one, until the second half kicks
-- off. Returns { diamonds: what is left, bet }.
create or replace function public.live_bet_place(p_game text, p_market text, p_pick text, p_stake integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email  text := auth.jwt() ->> 'email';
  g        public.live_games%rowtype;
  v_hb     jsonb;
  v_ms     bigint;
  v_market jsonb;
  v_x      numeric;
  v_min    integer;
  v_left   integer;
  v_bet    public.live_bets%rowtype;
begin
  if v_email is null then raise exception 'Sign in first.'; end if;
  select * into g from public.live_games where id = p_game for share;
  if not found then raise exception 'That game is not on.'; end if;
  v_min := coalesce((g.bets ->> 'min')::integer, 10);
  if p_stake is null or p_stake < v_min then raise exception 'Bet at least % diamonds.', v_min; end if;
  if p_stake > 1000000 then raise exception 'That is too many diamonds for one bet.'; end if;
  if g.starts_at is null then
    select m into v_market from jsonb_array_elements(coalesce(g.bets -> 'markets', '[]'::jsonb)) as m
     where m ->> 'id' = p_market;
  else
    select half_bets into v_hb from public.live_feeds where game_id = p_game;
    v_ms := floor(extract(epoch from (coalesce(g.paused_at, now()) - g.starts_at)) * 1000)::bigint;
    if v_hb is not null and v_ms >= (v_hb ->> 'opens')::bigint and v_ms < (v_hb ->> 'closes')::bigint
       and coalesce(g.reached_ms, 0) < (v_hb ->> 'closes')::bigint then
      select m into v_market from jsonb_array_elements(coalesce(v_hb -> 'markets', '[]'::jsonb)) as m
       where m ->> 'id' = p_market;
    end if;
  end if;
  if v_market is null then raise exception 'Betting on that is closed.'; end if;
  select (p ->> 'x')::numeric into v_x from jsonb_array_elements(coalesce(v_market -> 'picks', '[]'::jsonb)) as p
   where p ->> 'id' = p_pick;
  if v_x is null then raise exception 'That is not one of the picks.'; end if;
  if exists (select 1 from public.live_bets where game_id = p_game and email = v_email and market = p_market) then
    raise exception 'You already have a bet on that.';
  end if;
  update public.player_diamonds set diamonds = diamonds - p_stake, updated_at = now()
   where email = v_email and diamonds >= p_stake
  returning diamonds into v_left;
  if v_left is null then raise exception 'Not enough diamonds.'; end if;
  insert into public.live_bets (game_id, email, market, pick, stake, x)
  values (p_game, v_email, p_market, p_pick, p_stake, v_x)
  returning * into v_bet;
  return jsonb_build_object('diamonds', v_left, 'bet', to_jsonb(v_bet));
end;
$$;

revoke all on function public.live_bet_place(text, text, text, integer) from public, anon;
grant execute on function public.live_bet_place(text, text, text, integer) to authenticated;

-- A game taken off before its bets are settled, by whatever road (Cancel,
-- PLAY LIVE again, the week played again or undone), gives every stake
-- still on it back.
create or replace function public.live_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_diamonds as pd (email, diamonds, updated_at)
  select b.email, sum(b.stake)::integer, now()
    from public.live_bets b
   where b.game_id = old.id and b.settled_at is null
   group by b.email
  on conflict (email) do update set diamonds = pd.diamonds + excluded.diamonds, updated_at = now();
  return old;
end;
$$;

drop trigger if exists live_games_refund on public.live_games;
create trigger live_games_refund
  before delete on public.live_games
  for each row execute function public.live_refund();

-- Sends the next live post that is due, one a run, so they land in order,
-- settles the bets on any game that is over, and stops its own clock once
-- nothing is left to send. Run by pg_cron.
create or replace function public.live_deliver()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url  text;
  r      record;
  v_sent integer := 0;
begin
  select url into v_url from public.discord_webhooks where league = 'live';
  if v_url is null then select url into v_url from public.discord_webhooks where league = 'nfl'; end if;
  for r in
    update public.live_posts p set sent_at = now()
     where p.id in (select q.id from public.live_posts q
                     where q.sent_at is null and q.due_at <= now()
                       and not exists (select 1 from public.live_games g
                                        where g.id = q.game_id and g.paused_at is not null)
                     order by q.due_at, q.seq
                     limit 1
                     for update skip locked)
    returning p.payload
  loop
    if v_url is not null then
      execute 'select net.http_post(url := $1, body := $2, headers := $3)'
        using v_url, public.live_stamp(r.payload), '{"Content-Type": "application/json"}'::jsonb;
    end if;
    v_sent := v_sent + 1;
  end loop;
  perform public.live_settle_due();
  /* A game waiting for its kickoff has nothing to send yet: the kickoff
     starts the clock again. */
  if not exists (select 1 from public.live_posts where sent_at is null and due_at is not null) then
    begin
      execute 'select cron.unschedule($1)' using 'ege-live-posts';
    exception when others then null;
    end;
  end if;
  return v_sent;
end;
$$;

revoke all on function public.live_deliver() from public, anon, authenticated;

-- PLAY LIVE: the game, its snaps, its posts and its bets, all at once,
-- replacing any earlier go at the same game. It waits for an admin to kick
-- it off (live_control 'kickoff'), all but the game's announcement with it:
-- each post's `at` is milliseconds from kickoff, and the announcement's is
-- before it, so it goes at once. `p_bets` is { bets, half, results }
-- (nfl-sim/lib/live-bets.js). Starts the clock that sends the posts, where
-- there is one. Returns { cron }: whether that clock is running.
drop function if exists public.live_start(jsonb, jsonb, jsonb, integer);

create or replace function public.live_start(p_game jsonb, p_entries jsonb, p_posts jsonb, p_bets jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   text := p_game ->> 'id';
  v_cron boolean := false;
begin
  if not public.is_admin() then raise exception 'Only an admin can put a game on live.'; end if;
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) = 0 then
    raise exception 'A live game needs its snaps.';
  end if;
  delete from public.live_games where id = v_id;
  insert into public.live_games (id, season, week, home, away, title, starts_at, slot_ms, reveal_ms, plays, length_ms, bets, six, emails)
  values (v_id, (p_game ->> 'season')::integer, (p_game ->> 'week')::integer, p_game ->> 'home', p_game ->> 'away',
          coalesce(p_game ->> 'title', ''), null, coalesce((p_game ->> 'slot_ms')::integer, 20000),
          coalesce((p_game ->> 'reveal_ms')::integer, 4000), jsonb_array_length(p_entries),
          (p_game ->> 'length_ms')::bigint, p_bets -> 'bets',
          case when jsonb_typeof(p_game -> 'six') = 'array'
               then array(select jsonb_array_elements_text(p_game -> 'six')) end,
          case when jsonb_typeof(p_game -> 'emails') = 'array'
               then array(select lower(x) from jsonb_array_elements_text(p_game -> 'emails') as x) end);
  insert into public.live_feeds (game_id, entries, half_bets, results)
  values (v_id, p_entries, p_bets -> 'half', p_bets -> 'results');
  insert into public.live_posts (game_id, seq, at_ms, due_at, payload)
  select v_id, (x.n - 1)::integer, round(coalesce((x.post ->> 'at')::numeric, 0))::bigint,
         case when coalesce((x.post ->> 'at')::numeric, 0) < 0 then now() end,
         x.post -> 'payload'
    from jsonb_array_elements(coalesce(p_posts, '[]'::jsonb)) with ordinality as x (post, n);
  begin
    execute 'select cron.schedule($1, $2, $3)' using 'ege-live-posts', '5 seconds', 'select public.live_deliver()';
    v_cron := true;
  exception when others then
    v_cron := false;
  end;
  return jsonb_build_object('cron', v_cron);
end;
$$;

revoke all on function public.live_start(jsonb, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.live_start(jsonb, jsonb, jsonb, jsonb) to authenticated;

-- The NFL Sim tab's way of sending the posts when there is no pg_cron (or
-- its clock has fallen 30 seconds behind): the next one that is due,
-- marked sent as it is handed over, so it goes once.
create or replace function public.live_claim()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_cron    boolean := false;
begin
  if not public.is_admin() then raise exception 'Only an admin can send live posts.'; end if;
  begin
    execute 'select exists (select 1 from cron.job where jobname = $1)' into v_cron using 'ege-live-posts';
  exception when others then
    v_cron := false;
  end;
  update public.live_posts p set sent_at = now()
   where p.id = (select q.id from public.live_posts q
                  where q.sent_at is null
                    and q.due_at <= now() - case when v_cron then interval '30 seconds' else interval '0 seconds' end
                    and not exists (select 1 from public.live_games g
                                     where g.id = q.game_id and g.paused_at is not null)
                  order by q.due_at, q.seq
                  limit 1
                  for update skip locked)
  returning p.payload into v_payload;
  perform public.live_settle_due();
  return case when v_payload is null then null else public.live_stamp(v_payload) end;
end;
$$;

revoke all on function public.live_claim() from public, anon;
grant execute on function public.live_claim() to authenticated;

-- Takes a game off: its snaps and every post not sent yet go with it.
create or replace function public.live_stop(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Only an admin can take a game off.'; end if;
  delete from public.live_games where id = p_id;
end;
$$;

revoke all on function public.live_stop(text) from public, anon;
grant execute on function public.live_stop(text) to authenticated;

-- An admin's hand on a live game, in case something goes wrong (Sam,
-- 2026-11-03):
--   kickoff  a game put on is waiting for this (Sam, 2026-11-04): it kicks
--            off `p_delay` seconds from now, its bets close, and its posts
--            go each in its turn;
--   pause    the clock stops for everybody, and so do the posts;
--   resume   it goes on from where it stopped, the posts with it;
--   end      straight to the final whistle: nothing still waiting is
--            posted but a post at the final whistle (a game put on before
--            the bot stopped sending one, 2026-11-09), and the bets are
--            settled;
--   restart  back to the kickoff, `p_delay` seconds from now, and every
--            post goes again in its turn;
--   cancel   taken off altogether (live_stop), to be put on again later,
--            every bet still on it given back.
-- Returns the game's row, or null once it is cancelled.
create or replace function public.live_control(p_id text, p_action text, p_delay integer default 0)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  g      public.live_games%rowtype;
  v_now  timestamptz := now();
  v_len  bigint;
  v_ms   bigint;
  v_new  timestamptz;
  v_last integer;
begin
  if not public.is_admin() then raise exception 'Only an admin can run a live game.'; end if;
  select * into g from public.live_games where id = p_id for update;
  if not found then raise exception 'That game is not live.'; end if;
  v_len := coalesce(g.length_ms, g.plays::bigint * g.slot_ms);
  v_ms := floor(extract(epoch from (coalesce(g.paused_at, v_now) - g.starts_at)) * 1000)::bigint;
  if p_action = 'kickoff' or (p_action = 'restart' and g.starts_at is null) then
    if g.starts_at is null then
      v_new := v_now + make_interval(secs => greatest(0, least(coalesce(p_delay, 0), 86400)));
      update public.live_posts
         set due_at = greatest(v_now, v_new + make_interval(secs => coalesce(at_ms, 0) / 1000.0))
       where game_id = p_id and sent_at is null;
      update public.live_games set starts_at = v_new, paused_at = null where id = p_id;
    end if;
  elsif p_action = 'pause' then
    if g.paused_at is null and v_ms < v_len then
      update public.live_games set paused_at = v_now where id = p_id;
    end if;
  elsif p_action = 'resume' then
    if g.paused_at is not null then
      update public.live_games set starts_at = starts_at + (v_now - g.paused_at), paused_at = null where id = p_id;
      update public.live_posts set due_at = due_at + (v_now - g.paused_at) where game_id = p_id;
    end if;
  elsif p_action = 'end' then
    /* The posts move with the kickoff, so each stays where it falls in the
       game (for a restart); all but one at the final whistle are let go. */
    v_new := v_now - make_interval(secs => v_len / 1000.0);
    select max(p.seq) into v_last from public.live_posts p
     where p.game_id = p_id
       and p.at_ms >= coalesce((select (f.entries -> -1 ->> 'ms')::bigint from public.live_feeds f where f.game_id = p_id), v_len);
    update public.live_posts
       set due_at = case when at_ms is not null then v_new + make_interval(secs => at_ms / 1000.0)
                         else due_at + (v_new - g.starts_at) end
     where game_id = p_id;
    update public.live_posts set sent_at = v_now
     where game_id = p_id and sent_at is null and seq is distinct from v_last;
    update public.live_posts set due_at = least(due_at, v_now) where game_id = p_id and sent_at is null;
    update public.live_games set starts_at = v_new, paused_at = null, reached_ms = v_len where id = p_id;
    perform public.live_settle(p_id);
  elsif p_action = 'restart' then
    v_new := v_now + make_interval(secs => greatest(0, least(coalesce(p_delay, 0), 86400)));
    update public.live_posts
       set due_at = case when at_ms is not null then greatest(v_now, v_new + make_interval(secs => at_ms / 1000.0))
                         else greatest(v_now, due_at + (v_new - g.starts_at)) end,
           sent_at = null
     where game_id = p_id;
    update public.live_games set starts_at = v_new, paused_at = null,
           reached_ms = greatest(coalesce(reached_ms, 0), coalesce(v_ms, 0)) where id = p_id;
  elsif p_action = 'cancel' then
    delete from public.live_games where id = p_id;
    return null;
  else
    raise exception 'Not a live game action: %', p_action;
  end if;
  /* The clock that sends the posts, again, if any are waiting. */
  if exists (select 1 from public.live_posts where game_id = p_id and sent_at is null and due_at is not null) then
    begin
      execute 'select cron.schedule($1, $2, $3)' using 'ege-live-posts', '5 seconds', 'select public.live_deliver()';
    exception when others then null;
    end;
  end if;
  select * into g from public.live_games where id = p_id;
  return to_jsonb(g) - 'bets';
end;
$$;

revoke all on function public.live_control(text, text, integer) from public, anon;
grant execute on function public.live_control(text, text, integer) to authenticated;

-- Whether the game `p_email`'s player has that week is on live, or has
-- been and is not taken off yet (Sam, 2026-11-09).
create or replace function public.live_locked(p_email text, p_season integer, p_week integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.live_games g
                  where g.season = p_season and g.week = p_week and lower(p_email) = any (g.emails));
$$;

revoke all on function public.live_locked(text, integer, integer) from public, anon;
grant execute on function public.live_locked(text, integer, integer) to authenticated;

-- No booster or wager goes on such a game and none comes off it: the
-- result is out there, or on its way. Taking the game off (Cancel, PLAY
-- LIVE again, the week played again or undone) opens it again. An admin
-- may still put a week right, and so may this database's own hand (the
-- SQL editor, with nobody signed in).
create or replace function public.game_boosters_live_lock()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  r public.game_boosters%rowtype;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if coalesce(auth.jwt() ->> 'email', '') <> '' and not public.is_admin()
     and public.live_locked(r.email, r.season, r.week) then
    raise exception 'That game is live.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists game_boosters_live_lock on public.game_boosters;
create trigger game_boosters_live_lock
  before insert or delete on public.game_boosters
  for each row execute function public.game_boosters_live_lock();

notify pgrst, 'reload schema';

-- ===========================================================================
-- NFL cards
--
-- The six's NFL teammates in the card game (Sam, 2026-11-06): their games
-- and their touchdowns from 2024 on, out of the NFL Pack (open_card_pack,
-- above) and the NFL sets (claim_card_set takes them like any set). What a
-- card is comes from the NFL sim's box scores, which sim_box_scores keeps
-- a row a week; the page builds the cards from them (data/nfl-cards.js).
-- ===========================================================================

-- The box scores the cards are made from: for each week asked, its games
-- with one of the named teams in them -- the teams the six were on that
-- week, which the page knows and Postgres does not -- each with its score,
-- its scoring plays and those teams' lines, the six's own left out. Weeks
-- from 2024 on and published only, whoever asks, admins too. A week of a
-- whole league's box scores is about 65KB; this is about a tenth of it.
--
-- p_weeks: [{ "s": 2024, "w": 3, "t": ["CHI", "NYG"] }, ...]
create or replace function public.nfl_card_lines(p_weeks jsonb)
returns table (season integer, week integer, games jsonb)
language sql
stable
set search_path = public
as $$
  select b.season, b.week,
         coalesce((
           select jsonb_agg(
                    jsonb_strip_nulls(jsonb_build_object(
                      'home', x.g -> 'home', 'away', x.g -> 'away', 'score', x.g -> 'score',
                      'round', x.g -> 'round', 'ot', x.g -> 'ot', 'neutral', x.g -> 'neutral'))
                    || jsonb_build_object(
                         'scoring', coalesce(x.g -> 'scoring', '[]'::jsonb),
                         'box', coalesce((
                           select jsonb_agg(l.v - array['fgm', 'fga', 'xpm', 'xpa', 'punts', 'puntYards'])
                             from jsonb_array_elements(coalesce(x.g -> 'box', '[]'::jsonb)) as l(v)
                            where not (l.v ? 'ege')
                              and (w.e -> 't') ? (l.v ->> 'team')), '[]'::jsonb))
                    order by x.n)
             from jsonb_array_elements(b.games) with ordinality as x(g, n)
            where (w.e -> 't') ? (x.g ->> 'home') or (w.e -> 't') ? (x.g ->> 'away')
         ), '[]'::jsonb)
    from jsonb_array_elements(case when jsonb_typeof(p_weeks) = 'array' then p_weeks else '[]'::jsonb end) as w(e)
    join public.sim_box_scores b
      on b.season = (w.e ->> 's')::integer and b.week = (w.e ->> 'w')::integer
   where b.season >= 2024
     and jsonb_typeof(w.e -> 't') = 'array'
     and exists (select 1 from public.published_weeks p where p.season = b.season and p.week = b.week);
$$;

revoke all on function public.nfl_card_lines(jsonb) from public;
grant execute on function public.nfl_card_lines(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- NFL Player Cards
--
-- A teammate an account has collected enough of has a Player Card (NFL_RANKS
-- in data/nfl-cards.js), and it pays much less than one of the six's (Sam,
-- 2026-11-06): a fifth of his game's fantasy points times his position's
-- share, times the rank's bonus. Every NFL Player Card's games in a week are
-- paid together, as one award, npc-w{week}, held here to 30 (halved with
-- every bonus, Sam, 2026-11-06). The same rules
-- as pay_player_card_bonuses otherwise: each week is paid once, at the ranks
-- held when it is first paid, a week of nothing goes in at nothing, and the
-- first time an account is paid at all every week already out goes in at
-- nothing (an npc-start row marks it), so they pay from the next week on.
--
-- Returns what it actually paid.
-- ---------------------------------------------------------------------------

create or replace function public.pay_nfl_card_bonuses(p_season integer, p_awards jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_first boolean;
  v_paid  integer := 0;
  v_pay   integer;
  r       record;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_awards is null or jsonb_typeof(p_awards) <> 'array' then
    return 0;
  end if;

  insert into public.player_diamonds (email, diamonds, updated_at)
  values (v_email, 0, now())
  on conflict (email) do nothing;
  perform 1 from public.player_diamonds where email = v_email for update;

  v_first := not exists (
    select 1 from public.diamond_awards where email = v_email and award_key = 'npc-start');
  if v_first then
    insert into public.diamond_awards (email, season, award_key, diamonds, note)
    values (v_email, p_season, 'npc-start', 0, 'NFL Player Cards start paying from here')
    on conflict (email, season, award_key) do nothing;
  end if;

  for r in
    select
      a ->> 'key'                              as award_key,
      coalesce((a ->> 'diamonds')::integer, 0) as diamonds,
      a ->> 'note'                             as note
    from jsonb_array_elements(p_awards) as a
  loop
    continue when r.award_key is null
      or r.award_key !~ '^npc-w[0-9]{1,2}$'
      or r.diamonds < 0 or r.diamonds > 30;

    v_pay := case when v_first then 0 else r.diamonds end;

    insert into public.diamond_awards (email, season, award_key, diamonds, note)
    values (v_email, p_season, r.award_key, v_pay,
            case when v_first then 'Out before your NFL Player Cards: ' || coalesce(r.note, '') else r.note end)
    on conflict (email, season, award_key) do nothing;
    if found then
      v_paid := v_paid + v_pay;
    end if;
  end loop;

  if v_paid > 0 then
    update public.player_diamonds
       set diamonds = diamonds + v_paid, updated_at = now()
     where email = v_email;
  end if;

  return v_paid;
end;
$$;

revoke all on function public.pay_nfl_card_bonuses(integer, jsonb) from public, anon;
grant execute on function public.pay_nfl_card_bonuses(integer, jsonb) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- Game Packs
--
-- Whoever wins the most bets on a live game gets a Game Pack of it (Sam,
-- 2026-11-06): five of that game's cards, claimed in the Shop once its week
-- is published (data/game-packs.js). Every account tied for the most gets
-- one, and a game with none of the six in it (live_games.six empty) pays
-- none, having no cards to put in one. live_settle hands them out as it
-- pays the bets, once a go at the game: a game put on again by PLAY LIVE is
-- a new go (`game_at`, its live_games.created_at), and its winners get a
-- pack of their own; a game restarted after its bets were paid pays none
-- again.
--
-- The page rolls the cards, as for every pack, and open_game_pack takes
-- them: five card ids, every one of the game's season and week, the six's
-- only of the six in the game. Free, and once.
-- ===========================================================================

create table if not exists public.game_packs (
  id        bigint      generated always as identity primary key,
  email     text        not null,
  game_id   text        not null,
  game_at   timestamptz not null,
  season    integer     not null,
  week      integer     not null,
  home      text        not null,
  away      text        not null,
  six       text[],
  wins      integer     not null,
  earned_at timestamptz not null default now(),
  opened_at timestamptz,
  cards     text[],
  unique (email, game_id, game_at)
);

create index if not exists game_packs_waiting on public.game_packs (email) where opened_at is null;

alter table public.game_packs enable row level security;

drop policy if exists "game packs read by their owner or an admin" on public.game_packs;
create policy "game packs read by their owner or an admin"
  on public.game_packs for select to authenticated
  using (email = auth.jwt() ->> 'email' or public.is_admin());

revoke all on public.game_packs from anon;
revoke insert, update, delete on public.game_packs from authenticated;
grant select on public.game_packs to authenticated;

-- The game's winners, each a Game Pack: whoever has the most winning bets
-- on it (a payout over the stake), once every bet on it is settled.
-- Returns how many packs it handed out.
create or replace function public.award_game_packs(p_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  g   public.live_games%rowtype;
  v_n integer := 0;
begin
  select * into g from public.live_games where id = p_id;
  if not found then return 0; end if;
  if g.six is not null and coalesce(array_length(g.six, 1), 0) = 0 then return 0; end if;
  if exists (select 1 from public.live_bets where game_id = p_id and settled_at is null) then return 0; end if;
  with won as (
    select b.email, count(*)::integer as n
      from public.live_bets b
     where b.game_id = p_id and b.payout > b.stake
     group by b.email
  )
  insert into public.game_packs (email, game_id, game_at, season, week, home, away, six, wins)
  select w.email, g.id, g.created_at, g.season, g.week, g.home, g.away, g.six, w.n
    from won w
   where w.n = (select max(n) from won)
  on conflict (email, game_id, game_at) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.award_game_packs(text) from public, anon, authenticated;

-- Opening one: the five cards the page rolled into the collection, the pack
-- marked open with them, and the opening in card_packs (pack_key
-- 'game:{game id}', nothing paid) for the Shop's Recent Pulls. Returns how
-- many Game Packs the account still has to open.
create or replace function public.open_game_pack(p_pack bigint, p_cards text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  gp      public.game_packs%rowtype;
  v_card  text;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  select * into gp from public.game_packs where id = p_pack and email = v_email for update;
  if not found then
    raise exception 'That Game Pack is not yours.';
  end if;
  if gp.opened_at is not null then
    raise exception 'That Game Pack is open already.';
  end if;
  if not exists (select 1 from public.published_weeks p where p.season = gp.season and p.week = gp.week) then
    raise exception 'That Game Pack opens once week % is out.', gp.week;
  end if;
  -- Five cards (SIZE in data/game-packs.js; change both together).
  if coalesce(array_length(p_cards, 1), 0) <> 5 then
    raise exception 'A Game Pack holds 5 cards.';
  end if;
  foreach v_card in array p_cards loop
    if not public.is_card_id(v_card)
       or split_part(v_card, ':', 2) <> gp.season::text
       or split_part(v_card, ':', 4) <> gp.week::text
       or (v_card ~ '^[ph]:' and gp.six is not null and not (split_part(v_card, ':', 3) = any(gp.six))) then
      raise exception 'Not a card from that game: %', v_card;
    end if;
  end loop;

  foreach v_card in array p_cards loop
    perform public.give_card(v_email, v_card);
  end loop;
  update public.game_packs set opened_at = now(), cards = p_cards where id = gp.id;
  insert into public.card_packs (email, pack_key, credits, diamonds, cards)
  values (v_email, 'game:' || gp.game_id, 0, 0, p_cards);

  return (select count(*)::integer from public.game_packs where email = v_email and opened_at is null);
end;
$$;

revoke all on function public.open_game_pack(bigint, text[]) from public, anon;
grant execute on function public.open_game_pack(bigint, text[]) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- The Want List
--
-- What each player is looking for in trades (Sam, 2026-11-06): NFL teams
-- and players, on the Trades page (data/card-wants.js). The
-- page shows who has a card on your list and which of your cards are on
-- theirs. One row an account, readable by every signed-in player, and set
-- only through set_card_wants.
--
-- A want is one of
--   team:{key}       every NFL teammate card of a team, by its key in
--                    EGE.teams ('detroit', 'newYorkJets'); not the six's own
--   player:{slug}    every card of one of the six or an NFL teammate
-- and either can carry a rarity floor ('player:dj-moore@epic').
-- ===========================================================================

create table if not exists public.card_wants (
  email      text primary key,
  wants      text[]      not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.card_wants enable row level security;

drop policy if exists "card wants readable by players" on public.card_wants;
create policy "card wants readable by players"
  on public.card_wants for select to authenticated
  using (true);

create or replace function public.is_card_want(p_want text)
returns boolean
language sql
immutable
as $$
  select coalesce(
    p_want ~ '^(team:[A-Za-z]+|player:[a-z0-9]+(-[a-z0-9]+)*)(@(uncommon|rare|epic|legendary|mystic|iconic))?$',
    false);
$$;

-- The whole list at once, in the order the page keeps it: thirty at most,
-- each one once.
create or replace function public.set_card_wants(p_wants text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_wants text[] := coalesce(p_wants, '{}');
  v_want  text;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if coalesce(array_length(v_wants, 1), 0) > 30 then
    raise exception 'A Want List holds thirty.';
  end if;
  foreach v_want in array v_wants loop
    if not public.is_card_want(v_want) then
      raise exception 'Not something to want: %', v_want;
    end if;
  end loop;
  if (select count(distinct w) from unnest(v_wants) w) <> coalesce(array_length(v_wants, 1), 0) then
    raise exception 'Each one goes on the list once.';
  end if;

  insert into public.card_wants (email, wants, updated_at)
  values (v_email, v_wants, now())
  on conflict (email) do update set wants = excluded.wants, updated_at = now();
end;
$$;

-- Who else has what a list could be after, as one answer however many
-- cards it is ({ email: { card id: copies } }), so Supabase's 1000-row cap
-- never cuts it short. The page sends the season and player of every card
-- a team or a player on the list could be ('2025:dj-moore', which every
-- card id carries second and third); Postgres cannot tell a card's team or rarity from its id, so this hands back a
-- little more than matches and the page keeps only what does. Everybody's
-- collection is readable by every signed-in player already.
drop function if exists public.card_want_holders(text[], text[]);

create or replace function public.card_want_holders(p_keys text[])
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_out   jsonb;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if coalesce(array_length(p_keys, 1), 0) > 5000 then
    raise exception 'That is more than a Want List can ask for.';
  end if;

  select coalesce(jsonb_object_agg(s.email, s.cards), '{}'::jsonb)
    into v_out
    from (select lower(pc.email) as email, jsonb_object_agg(pc.card_id, pc.quantity) as cards
            from public.player_cards pc
           where pc.quantity > 0
             and lower(pc.email) <> v_email
             and split_part(pc.card_id, ':', 2) || ':' || split_part(pc.card_id, ':', 3)
                 = any(coalesce(p_keys, '{}'))
           group by lower(pc.email)) s;
  return v_out;
end;
$$;

revoke all on function public.set_card_wants(text[]) from public, anon;
revoke all on function public.card_want_holders(text[]) from public, anon;
grant execute on function public.set_card_wants(text[]) to authenticated;
grant execute on function public.card_want_holders(text[]) to authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Team Cards
--
-- Every NFL card an account holds of one team, together (Sam, 2026-11-06;
-- data/team-cards.js). Once a Team Card is Uncommon it pays diamonds for
-- each of the team's wins, more the bigger the win. The page says what rank
-- each of the account's Team Cards is; the wins are read here, out of the
-- sim's box scores of the season's published weeks, so only a game the
-- team won is ever paid, and what it pays is worked out here too:
--
--   per win x (least(margin, 25) + 5) / 15, rounded, never under 1
--
-- -- the rank's per-win diamonds on a 10-point win, twice them on a win by
-- 25 or more -- and twice that again in the playoffs (week 19 on), like
-- every playoff game's diamonds. Per win: Uncommon 2, Rare 5, Epic 10,
-- Legendary 15, Mystic 20, Iconic 30, GOAT 40 (RANKS and winPay in
-- data/team-cards.js; change both together).
--
-- One award a win, tc-{team}-w{week} (tc-pit-w5), paid once, at the rank
-- held when it is first paid: a win while the card pays nothing goes in at
-- nothing, and the first time an account is paid at all every win already
-- out goes in at nothing (a tc-start row), so climbing later never
-- back-pays a win.
--
-- p_teams: [{ "team": "PIT", "rank": "epic" }, { "team": "SEA", "rank": null }]
-- Returns what it actually paid.
-- ---------------------------------------------------------------------------

create or replace function public.pay_team_card_wins(p_season integer, p_teams jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_first boolean;
  v_paid  integer := 0;
  v_pay   integer;
  r       record;
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_teams is null or jsonb_typeof(p_teams) <> 'array' then
    return 0;
  end if;
  if jsonb_array_length(p_teams) > 32 then
    return 0;
  end if;

  insert into public.player_diamonds (email, diamonds, updated_at)
  values (v_email, 0, now())
  on conflict (email) do nothing;
  perform 1 from public.player_diamonds where email = v_email for update;

  v_first := not exists (
    select 1 from public.diamond_awards where email = v_email and award_key = 'tc-start');
  if v_first then
    insert into public.diamond_awards (email, season, award_key, diamonds, note)
    values (v_email, p_season, 'tc-start', 0, 'Team Cards start paying from here')
    on conflict (email, season, award_key) do nothing;
  end if;

  for r in
    with claims as (
      select distinct on (upper(c ->> 'team'))
             upper(c ->> 'team') as team,
             case c ->> 'rank'
               when 'uncommon' then 2 when 'rare' then 5 when 'epic' then 10
               when 'legendary' then 15 when 'mystic' then 20 when 'iconic' then 30
               when 'goat' then 40 else 0 end as per_win,
             case c ->> 'rank'
               when 'uncommon' then 'Uncommon' when 'rare' then 'Rare' when 'epic' then 'Epic'
               when 'legendary' then 'Legendary' when 'mystic' then 'Mystic' when 'iconic' then 'Iconic'
               when 'goat' then 'GOAT' else 'Unranked' end as rank_name
        from jsonb_array_elements(p_teams) as c
       where jsonb_typeof(c) = 'object'
         and upper(c ->> 'team') ~ '^[A-Z]{2,3}$'
    ),
    games as (
      select b.week, g ->> 'home' as home, g ->> 'away' as away,
             (g -> 'score' ->> 0)::integer as home_score, (g -> 'score' ->> 1)::integer as away_score
        from public.sim_box_scores b
        cross join lateral jsonb_array_elements(b.games) as g
       where b.season = p_season
         and jsonb_typeof(b.games) = 'array'
         and exists (select 1 from public.published_weeks p where p.season = b.season and p.week = b.week)
         and jsonb_typeof(g -> 'score') = 'array'
    ),
    sides as (
      select c.team, c.per_win, c.rank_name, x.week,
             case when x.home = c.team then x.home_score else x.away_score end as us,
             case when x.home = c.team then x.away_score else x.home_score end as them,
             case when x.home = c.team then x.away else x.home end as opp
        from claims c
        join games x on x.home = c.team or x.away = c.team
    )
    select s.*, s.us - s.them as margin, 'tc-' || lower(s.team) || '-w' || s.week as award_key
      from sides s
     where s.us > s.them
     order by s.week, s.team
  loop
    v_pay := case
      when v_first or r.per_win = 0 then 0
      else greatest(1, round(r.per_win * (least(r.margin, 25) + 5)
                             * (case when r.week >= 19 then 2 else 1 end) / 15.0)::integer)
    end;

    insert into public.diamond_awards (email, season, award_key, diamonds, note)
    values (v_email, p_season, r.award_key, v_pay,
            case when v_first then 'Out before your Team Cards: ' else '' end ||
            r.rank_name || ' ' || r.team || ' Team Card, week ' || r.week || ': won ' ||
            r.us || '-' || r.them || ' v ' || r.opp ||
            case when r.week >= 19 then ' at the playoff 2x' else '' end)
    on conflict (email, season, award_key) do nothing;
    if found then
      v_paid := v_paid + v_pay;
    end if;
  end loop;

  if v_paid > 0 then
    update public.player_diamonds
       set diamonds = diamonds + v_paid, updated_at = now()
     where email = v_email;
  end if;

  return v_paid;
end;
$$;

revoke all on function public.pay_team_card_wins(integer, jsonb) from public, anon;
grant execute on function public.pay_team_card_wins(integer, jsonb) to authenticated;

notify pgrst, 'reload schema';

-- ===========================================================================
-- Media: the tweet generator (Sam, 2026-11-10)
--
-- The Media page (#media, js/media.js) draws a tweet as a picture and posts
-- it to the trades bot's Discord channel.
--
--   media_accounts  the accounts a player tweets as: a name, a handle and a
--                   picture. Their own account is their name, a handle
--                   made from it and their headshot until they change it,
--                   which makes its row (`own`); it is the only one of
--                   theirs the page gives the blue check. Any other they
--                   make is unverified: only an admin can tick `verified`.
--                   A player reads and changes their own rows and nobody
--                   else's; twelve besides their own at most. The admins'
--                   presets (NFL, ESPN, NBC Sports) are in data/media.js,
--                   not here.
--   media bucket    Storage, public: each tweet's picture, under the
--                   poster's user id. A webhook can only show a picture
--                   Discord can fetch, so it has to be somewhere public.
--   media_posts     every tweet posted, for an admin to look back on.
--   post_tweet()    posts one of those pictures to the trades bot's webhook
--                   through pg_net, so a player never holds the webhook.
--                   One every 15 seconds a player. Without pg_net here
--                   only an admin's browser can post (js/wallet.js
--                   postMediaToDiscord).
-- ===========================================================================

create table if not exists public.media_accounts (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null default (auth.jwt() ->> 'email'),
  own        boolean     not null default false,
  name       text        not null check (char_length(name) between 1 and 50),
  handle     text        not null check (handle ~ '^[A-Za-z0-9_]{1,15}$'),
  photo      text        check (photo is null or (char_length(photo) <= 80000
                                and photo ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$')),
  verified   boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists media_accounts_own on public.media_accounts (lower(email)) where own;
create index if not exists media_accounts_email on public.media_accounts (lower(email));

alter table public.media_accounts enable row level security;

drop policy if exists "media accounts read by their owner" on public.media_accounts;
create policy "media accounts read by their owner"
  on public.media_accounts for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "media accounts made by their owner" on public.media_accounts;
create policy "media accounts made by their owner"
  on public.media_accounts for insert to authenticated
  with check (lower(email) = lower(auth.jwt() ->> 'email')
              and (not verified or public.is_admin()));

drop policy if exists "media accounts changed by their owner" on public.media_accounts;
create policy "media accounts changed by their owner"
  on public.media_accounts for update to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email')
              and (not verified or public.is_admin()));

drop policy if exists "media accounts deleted by their owner" on public.media_accounts;
create policy "media accounts deleted by their owner"
  on public.media_accounts for delete to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

revoke all on public.media_accounts from anon;
grant select, insert, update, delete on public.media_accounts to authenticated;

-- Twelve besides their own.
create or replace function public.media_accounts_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not new.own and (select count(*) from public.media_accounts
                       where lower(email) = lower(new.email) and not own) >= 12 then
    raise exception 'You can have 12 accounts besides your own. Delete one first.';
  end if;
  return new;
end;
$$;

drop trigger if exists media_accounts_cap on public.media_accounts;
create trigger media_accounts_cap
  before insert on public.media_accounts
  for each row execute function public.media_accounts_cap();

create table if not exists public.media_posts (
  id        bigint      generated always as identity primary key,
  email     text        not null,
  name      text        not null,
  handle    text        not null,
  body      text,
  image     text        not null,
  posted_at timestamptz not null default now()
);

create index if not exists media_posts_email on public.media_posts (lower(email), posted_at desc);

alter table public.media_posts enable row level security;

drop policy if exists "media posts read by an admin" on public.media_posts;
create policy "media posts read by an admin"
  on public.media_posts for select to authenticated
  using (public.is_admin());

revoke all on public.media_posts from anon;
grant select on public.media_posts to authenticated;

-- The pictures. Public, so Discord can fetch them; a player can only put
-- one in their own folder (their user id), and nobody can change or take
-- one down from the site.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('media', 'media', true, 5242880, array['image/png'])
  on conflict (id) do update
    set public = true,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
exception when others then
  raise notice 'Media: the media bucket could not be made here (%). Make a public bucket called media under Storage.', sqlerrm;
end $$;

do $$
begin
  drop policy if exists "media pictures put up by their poster" on storage.objects;
  create policy "media pictures put up by their poster"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
exception when others then
  raise notice 'Media: the media bucket''s upload policy could not be made here (%).', sqlerrm;
end $$;

-- Posts a tweet's picture (already in the media bucket, in the caller's
-- folder) to the trades bot's channel. The name, handle and text are kept
-- in media_posts; Discord gets the picture alone, in an embed in X's blue.
create or replace function public.post_tweet(p_image text, p_name text, p_handle text, p_text text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_uid   text := auth.uid()::text;
  v_url   text;
  v_id    bigint;
begin
  if v_email is null or v_uid is null then
    raise exception 'Sign in first.';
  end if;
  if p_image is null
     or p_image !~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/media/'
                    || v_uid || '/[A-Za-z0-9_-]+\.png$') then
    raise exception 'That is not a tweet this page made.';
  end if;
  if exists (select 1 from public.media_posts
              where lower(email) = lower(v_email)
                and posted_at > now() - interval '15 seconds') then
    raise exception 'Give it a few seconds before tweeting again.';
  end if;

  select url into v_url from public.discord_webhooks where league = 'trades';
  if v_url is null then
    raise exception 'The trades bot has no webhook yet.';
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise exception 'pg_net is not on in this database, so only an admin can post.';
  end if;

  insert into public.media_posts (email, name, handle, body, image)
  values (v_email, left(coalesce(nullif(trim(p_name), ''), '?'), 50),
          left(coalesce(nullif(trim(p_handle), ''), '?'), 15), left(p_text, 280), p_image)
  returning id into v_id;

  execute 'select net.http_post(url := $1, body := $2, headers := $3)'
    using v_url,
          jsonb_build_object('embeds', jsonb_build_array(jsonb_build_object(
            'color', 1940464,   -- #1d9bf0
            'image', jsonb_build_object('url', p_image)))),
          '{"Content-Type": "application/json"}'::jsonb;
  return v_id;
end;
$$;

revoke all on function public.post_tweet(text, text, text, text) from public, anon;
grant execute on function public.post_tweet(text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
