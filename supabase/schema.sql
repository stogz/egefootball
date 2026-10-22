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
-- 2026-10-22). Pasted into the admin page and kept here rather than in the
-- site's files, because the repository is public and anybody holding a
-- webhook URL can post to its channel as the bot. Only an admin can read or
-- change one. The scheduled bot reads them with the service role key, which
-- passes RLS.
-- ---------------------------------------------------------------------------

create table if not exists public.discord_webhooks (
  league     text        primary key check (league in ('college', 'nfl', 'trades')),
  url        text        not null
             check (url ~ '^https://((canary|ptb)\.)?discord(app)?\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+$'),
  updated_at timestamptz not null default now()
);

-- A table made before the trades bot took the two leagues only.
alter table public.discord_webhooks drop constraint if exists discord_webhooks_league_check;
alter table public.discord_webhooks add constraint discord_webhooks_league_check
  check (league in ('college', 'nfl', 'trades'));

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

-- What a card id looks like. Anything else is refused at the door.
create or replace function public.is_card_id(p_id text)
returns boolean
language sql
immutable
as $$
  select p_id ~ '^(p:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}|h:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}:[0-9]{1,2})$';
$$;

-- A Gold Rush card (the Gold Rush, at the end of this file): a card's id
-- with ':gr' on the end, one of the two card-art cards ('a:...:gr'), or the
-- GOLD RUSH card the event pays ('r:gold-rush:gr'). Only the Gold Rush Pack
-- and the event's reward give these out; every standard way in keeps to
-- is_card_id.
create or replace function public.is_event_card_id(p_id text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_id ~ '^(p:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}|h:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}:[0-9]{1,2}|a:[0-9]{4}:[a-z]+(-[a-z]+)*:[0-9]{1,2}|r:gold-rush):gr$', false);
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

-- Anything a collection can hold: a card, a Gold Rush card, or a holo of
-- either. What trades, showcases, quick sales and the market take.
create or replace function public.is_any_card_id(p_id text)
returns boolean
language sql
immutable
as $$
  select public.is_card_id(p_id) or public.is_event_card_id(p_id) or public.is_holo_id(p_id);
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
      if not public.is_event_card_id(v_card) or v_card like 'r:%' then
        raise exception 'Not a Gold Rush card: %', v_card;
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

-- Showcases: up to six cards a player puts on their own player page. Set
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
-- that player is left.
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
                                  or (t.c like 'pc:%' and split_part(pc.card_id, ':', 3) = substr(t.c, 4))))
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
      raise exception 'The GOLD RUSH card stays with whoever earned it.';
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
  -- A Gold Rush card traded in the last 48 hours cannot go again yet.
  if not public.cards_free(v_email, p_give) then
    raise exception 'A Gold Rush card can be traded once every 48 hours, and one of yours was traded too recently.';
  end if;
  if not public.cards_free(p_to, v_take) then
    raise exception 'A Gold Rush card can be traded once every 48 hours, and one of theirs was traded too recently.';
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

  -- A Gold Rush card that changes hands cools down for 48 hours with its
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
-- Up to six cards a player picks to show on their own player page. Public,
-- like the page: anybody can see them, signed in or not. Only cards the
-- player owns can go up, and a card traded away comes down on its own.
-- A slot can hold a Player Card instead, as 'pc:{slug}', for any player
-- they hold a card of.
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
  if coalesce(array_length(v_cards, 1), 0) > 6 then
    raise exception 'A showcase holds six cards.';
  end if;
  foreach v_card in array v_cards loop
    if v_card ~ '^pc:[a-z]+(-[a-z]+)*$' then
      if not exists (select 1 from public.player_cards
                      where email = v_email and quantity > 0
                        and split_part(card_id, ':', 3) = substr(v_card, 4)) then
        raise exception 'You need a card of that player to show his Player Card.';
      end if;
    elsif not public.is_any_card_id(v_card) then
      raise exception 'Not a card: %', v_card;
    end if;
  end loop;
  if (select count(distinct c) from unnest(v_cards) c) <> coalesce(array_length(v_cards, 1), 0) then
    raise exception 'Each card goes up once.';
  end if;
  if not public.owns_cards(v_email, array(select c from unnest(v_cards) c where c not like 'pc:%')) then
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
-- Uncommon 1, Rare and Epic 2, Legendary 3, Mystic 30, and a holo three
-- times its card. An Iconic cannot be sold at all, holo or not. The same
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
  -- A holo sells for the three cards it was made from.
  if public.is_holo_id(p_card) then
    v_price := v_price * 3;
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
-- shape the page issues and a game's bonus to 400 -- the 120 a game's
-- credits are held to, at the Iconic 3x, and a little over.
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
      or r.diamonds < 0 or r.diamonds > 400;

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
    raise exception 'The GOLD RUSH card stays with whoever earned it.';
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
  -- A sale is a trade: a Gold Rush card traded in the last 48 hours waits.
  if public.card_copies_free(v_email, p_card) < 1 then
    raise exception 'A Gold Rush card can be traded once every 48 hours, and that one was traded too recently.';
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
begin
  if v_email is null then
    raise exception 'sign in first';
  end if;
  if p_slug is null or p_slug !~ '^[a-z]+(-[a-z]+)*$' then
    raise exception 'Not a player: %', p_slug;
  end if;
  if not exists (select 1 from public.player_cards
                  where email = v_email and quantity > 0 and split_part(card_id, ':', 3) = p_slug) then
    raise exception 'You need a card of that player to put a photo on his Player Card.';
  end if;
  if p_photo is null or p_photo !~ '^data:image/(webp|jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$' then
    raise exception 'That is not a picture the page can show.';
  end if;
  -- About 100 KB of picture; the page sends a third of that.
  if length(p_photo) > 140000 then
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

-- { "players": [slug, ...], "cards": { card_id: quantity },
--   "earned": { slug: diamonds }, "photos": { slug: data url } } for the
-- players this account has put up, and nothing else of its collection or
-- its awards. "earned" is what each of those Player Cards has paid it,
-- every season, which the card prints; "photos" the custom pictures on
-- them (card_photos, further down).
create or replace function public.showcased_player_cards(p_email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'players', to_jsonb(s.player_cards),
    'cards', coalesce((
      select jsonb_object_agg(pc.card_id, pc.quantity)
        from public.player_cards pc
       where pc.email = s.email and pc.quantity > 0
         and split_part(pc.card_id, ':', 3) = any(s.player_cards)), '{}'::jsonb),
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
       where ph.email = s.email and ph.slug = any(s.player_cards)), '{}'::jsonb))
    from (select p_email as email,
                 coalesce((select array(select substr(c, 4) from unnest(cs.cards) with ordinality as t(c, n)
                                         where c like 'pc:%' order by n)
                             from public.card_showcases cs where cs.email = p_email), '{}') as player_cards) s;
$$;

grant execute on function public.showcased_player_cards(text) to anon, authenticated;

-- What each of an account's Player Cards has paid it, every season:
-- { slug: diamonds }, for the Players page when it shows somebody else's
-- Player Cards. diamond_awards itself stays readable by its owner alone;
-- this hands over the Player Card totals and nothing else.
create or replace function public.player_card_earnings(p_email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(e.slug, e.total), '{}'::jsonb)
    from (select regexp_replace(da.award_key, '^pc-(.+)-w[0-9]+$', '\1') as slug,
                 sum(da.diamonds) as total
            from public.diamond_awards da
           where da.email = p_email and da.award_key ~ '^pc-.+-w[0-9]+$'
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
-- ===========================================================================

create table if not exists public.card_merges (
  id        uuid primary key default gen_random_uuid(),
  email     text        not null,
  card_id   text        not null,          -- the card merged; the holo is card_id || ':holo'
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

-- Merges three copies of p_card into its holo and pays p_diamonds for it.
-- Returns { left: copies of the card left, diamonds: what it paid,
-- balance: the diamonds after }.
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
  if v_bonus > 60 then
    raise exception 'That is more than a holo pays.';
  end if;
  if p_card is null or not public.is_any_card_id(p_card) or public.is_holo_id(p_card) then
    raise exception 'Only a card can be merged into a holo: %', p_card;
  end if;
  v_holo := p_card || ':holo';
  -- The GOLD RUSH card has no holo.
  if not public.is_holo_id(v_holo) then
    raise exception 'That card has no holo.';
  end if;

  -- Under lock, so the same three copies cannot be merged twice from two
  -- tabs, or sold or traded away while they are being merged.
  select quantity into v_have
    from public.player_cards
   where email = v_email and card_id = p_card
     for update;

  if coalesce(v_have, 0) < 3 then
    raise exception 'It takes three copies of a card to make its holo. You have %.', coalesce(v_have, 0);
  end if;

  update public.player_cards set quantity = quantity - 3
   where email = v_email and card_id = p_card;
  delete from public.player_cards
   where email = v_email and card_id = p_card and quantity <= 0;
  perform public.give_card(v_email, v_holo);

  -- Gold Rush copies still cooling down from a trade that went into it
  -- take their cooldown into the holo, so merging cannot skip one.
  if p_card like '%:gr' then
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

  return jsonb_build_object('left', v_have - 3, 'diamonds', v_bonus, 'balance', v_balance);
end;
$$;

revoke all on function public.merge_holo_card(text, integer) from public, anon;
grant execute on function public.merge_holo_card(text, integer) to authenticated;

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
--   { "uncommon": id, "rare": id, "legendary": id,
--     "base": [three ids], "pro": [five ids] }
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
  if not coalesce(public.is_card_id(p_offer ->> 'uncommon'), false)
     or not coalesce(public.is_card_id(p_offer ->> 'rare'), false)
     or not coalesce(public.is_card_id(p_offer ->> 'legendary'), false) then
    raise exception 'The wheel could not be filled. Reload the page and spin again.';
  end if;
  if coalesce(jsonb_typeof(p_offer -> 'base'), '') <> 'array'
     or coalesce(jsonb_typeof(p_offer -> 'pro'), '') <> 'array' then
    raise exception 'The wheel could not be filled. Reload the page and spin again.';
  end if;
  if jsonb_array_length(p_offer -> 'base') <> 3 or jsonb_array_length(p_offer -> 'pro') <> 5
     or exists (select 1 from jsonb_array_elements(p_offer -> 'base') c
                 where jsonb_typeof(c) <> 'string' or not public.is_card_id(c #>> '{}'))
     or exists (select 1 from jsonb_array_elements(p_offer -> 'pro') c
                 where jsonb_typeof(c) <> 'string' or not public.is_card_id(c #>> '{}')) then
    raise exception 'The wheel could not be filled. Reload the page and spin again.';
  end if;

  if exists (select 1 from public.card_spins where email = v_email and day = v_day) then
    raise exception 'You have had today''s spin. The wheel turns over at 7:00 AM Central.';
  end if;

  v_roll := random() * 100;
  v_prize := case
               when v_roll < 35 then 'uncommon'
               when v_roll < 60 then 'diamonds'
               when v_roll < 80 then 'rare'
               when v_roll < 95 then 'base'
               when v_roll < 98 then 'pro'
               else 'legendary'
             end;

  if v_prize in ('uncommon', 'rare', 'legendary') then
    v_cards := array[p_offer ->> v_prize];
  elsif v_prize in ('base', 'pro') then
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

  if v_prize in ('base', 'pro') then
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

-- One row per Gold Rush copy that changed hands, until it can go again.
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
-- less the Gold Rush copies still cooling down.
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
-- it is a Gold Rush card. Old cooldowns are cleared out on the way.
create or replace function public.lock_traded_card(p_email text, p_card text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.card_trade_locks where locked_until < now() - interval '1 day';
  insert into public.card_trade_locks (email, card_id, locked_until)
  select lower(p_email), p_card, now() + interval '48 hours'
   where p_card ~ ':gr(:holo)?$';
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

-- Locks in one of an event's sets: the page says which Gold Rush cards it
-- was made with, and they all have to be in the collection. Only while the
-- event is on, and once. Pays the set's reward: the card the page rolled
-- (a Gold Rush card, as a Library set's is any card -- the same trust),
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
    if v_card !~ ':gr(:holo)?$' or v_card like 'r:%' or not public.is_any_card_id(v_card) then
      raise exception 'Only % cards count for its sets: %', e.name, v_card;
    end if;
  end loop;
  if p_reward_card is not null
     and (not public.is_event_card_id(p_reward_card) or p_reward_card like 'r:%') then
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

-- Every set locked in before the event ends: the event's reward card,
-- once, with what card_events.rewards holds under the event's own key.
-- Returns the card's id.
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
       where email = v_email and event_key = p_event and set_key = any(e.sets)) < cardinality(e.sets) then
    raise exception 'Lock in every % set first.', e.name;
  end if;

  v_pay := coalesce(e.rewards -> p_event, '{}'::jsonb);
  v_diamonds := greatest(coalesce((v_pay ->> 'diamonds')::integer, 0), 0);
  v_booster := v_pay ->> 'booster';
  if v_booster is not null and v_booster not in ('boost-1-5', 'boost-2-0', 'boost-2-5') then
    v_booster := null;
  end if;

  insert into public.card_event_claims (email, event_key, set_key, reward)
  values (v_email, p_event, p_event,
          jsonb_build_object('card', e.reward, 'diamonds', v_diamonds, 'booster', v_booster))
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
    perform public.give_booster(v_email, v_booster);
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

notify pgrst, 'reload schema';
