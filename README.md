# EGE Football — Career Simulation

A football career simulation that follows six players across six seasons — 2018
junior year of high school through their college careers to the 2023 NFL Draft.
The site is part record book (schedules, results, box scores) and part game (each
player logs in to their own portal and spends offseason workouts to raise their
overalls).

Status: **in progress.** The homepage player select is built; schedules, stats,
and the portal are not. This README is the source of truth for what gets built
and in what order.

---

## The Six Players

| Player | School | League | Position |
| --- | --- | --- | --- |
| Andrew Parr | Wake Forest High School | Northern 4A | TE |
| Cooper Clark | Carlsbad High School | Avocado League | RB |
| Paxon Hatch | Bloomington High School | Big Twelve | TE |
| Isaac Vitel | TBD | TBD | QB |
| Sam Stogsdill | Normal Community High School | Big Twelve | RB |
| Jaykeb Stewart | Naples High School | 6A District 12 | QB |

Everything marked TBD is genuinely unknown right now and should stay TBD in code
and data until it is confirmed — no placeholder guesses that later read as facts.

Headshots live in `headshot/`, keyed by last name: `parr.png`, `clark.png`,
`hatch.png`, `vitel.png`, `stogsdill.png`, `stewart.png`. School marks live in
`icon/`, keyed by school: `carlsbad.png`, `bloomington.png`, `normal.png`,
`naples.png`, `wake.png`. A team without a mark renders its school line
without it.

---

## Timeline

Six seasons, one per simulated year. This ladder is official — schedule and stat
data is authored per season below.

| Season | Level | Class |
| --- | --- | --- |
| 2018 | High school varsity | Junior year |
| 2019 | High school varsity | Senior year |
| 2020 | College football | Freshman year |
| 2021 | College football | Sophomore year |
| 2022 | College football | Junior year |
| 2023 | College football | Senior year *(optional)* |

The simulation opens on the **2018 junior-year high school season** — that is
what gets built first. High school graduation is spring 2020, after the 2019
senior season.

**NFL Draft.** All six are drafted in the **2023 NFL Draft**, held the spring
after the 2022 junior college season. Three seasons removed from a spring 2020
high school graduation makes them draft-eligible, so declaring after junior year
is the canonical path. The optional 2023 senior college season is the branch a
player takes instead of declaring; it pushes that player to the 2024 draft.

---

## Site Structure

### Homepage — player select

- The landing page is a six-way player picker: one card per player with their
  headshot, name, school, and position (or TBD).
- Selecting a card routes to that player's page.

### Player page — `/#{name}`

Routed by player name, e.g. `#andrew-parr`, `#paxon-hatch`. Each player page
holds:

- **Header** — headshot, name, school, position, class year, current overall.
- **Season selector** — switches between the seasons on the ladder above. The
  2018 junior-year high school season is the default and the only one with data
  at first; later seasons appear as they are authored.
- **Schedule** — every scheduled game in the selected season: week, date,
  kickoff, opponent with home/away and a mark for conference games, and the
  result once it has been played. A silhouette marks a game scouts will attend,
  for a player holding Intel for that season.
- **Record** — running wins and losses for the selected season.
- **Game log** — per-game stats for that player, with the stat lines driven by
  their position (see below).
- **Season totals** — the game log aggregated for the selected season, plus
  career totals across every season played.

### Position-driven stat lines

A player's position decides which stat columns their game log shows. Stat sets
to define per position group:

- **QB** — completions/attempts, passing yards, passing TD, INT, rushing
  yards/TD.
- **RB** — carries, rushing yards, rushing TD, receptions, receiving yards.
- **WR / TE** — targets, receptions, receiving yards, receiving TD (Paxon Hatch
  is TE, so this is the first one needed).
- **OL** — snaps, pancakes, sacks allowed.
- **DL / LB** — tackles, TFL, sacks, forced fumbles.
- **DB** — tackles, pass deflections, INT, INT return yards.
- **K / P** — FG made/attempted, longest, punts, punt average.

Only the TE set is required for the first build. The rest get filled in as
positions are confirmed.

---

## Ratings

Every player carries the same 32 attributes, in four groups: General,
Passing, Receiving, Ball Carrier. Tight ends carry a fifth, Blocking, since
they are the only position here whose overall should turn on it — the group
is simply absent for everyone else, and their pages don't show it. A group
scores as the plain average of the attributes inside it.

Receiving counts heavily for a running back — these are backs who catch, not
just carry — so for Cooper and Sam a receiving point is worth nearly as much
as a carrying one and about as much again as a general one.

**A player's page shows only the groups their position is judged on**, under
the names that position uses: a quarterback gets General, Passing and
Carrying; a back gets General, Receiving and Carrying; a tight end gets
General, Catching, Blocking and Carrying. The groups left off the page still
count toward the overall — they just aren't worth a column. `EGE.positionGroups`
decides what is shown, separately from `EGE.positionWeights`, which decides
what counts.

**The overall is those group scores weighted by position.** A quarterback's
overall leans on passing, a back's on ball carrying — but nothing is ever
worth zero, so a quarterback who can carry the ball still rates above one who
can't, just not by much. Weights live in `EGE.positionWeights` and are
normalised when the overall is worked out, so a group can be nudged without
rebalancing the others. A group left out of a position's weights is left out
of that position's overall entirely, which is how blocking counts for a tight
end and for nobody else. Only QB, RB, WR and TE are weighted, since those are
the positions these groups describe; anything else falls back to `DEFAULT`,
which counts every group fairly evenly.

The same attributes score very differently by position, which is the point:

| Isaac Vitel's ratings, scored as | Overall |
| --- | --- |
| QB | 48 |
| RB | 37 |
| WR | 32 |
| TBD | 40 |

Anything bought in the shop lands on top of these: `EGE.valuesFor` adds the
boosts to the base numbers before any group or overall is worked out, so a
purchase moves the rating the moment it is made.

**The values in the file are placeholders.** They put every player near 50
overall, in this order:

| Player | Position | Overall |
| --- | --- | --- |
| Jaykeb Stewart | QB | 55 |
| Cooper Clark | RB | 52 |
| Andrew Parr | TE | 51 |
| Sam Stogsdill | RB | 49 |
| Isaac Vitel | QB | 48 |
| Paxon Hatch | TE | 46 |

The two backs sit a point lower than the rest of the table was written for,
because receiving now counts for a back and neither of them catches well yet.
The order is unchanged, and points bought into receiving are what closes it.

Replace them with real numbers as they are decided; nothing else has to
change.

---

## Discord scores bot

`bot/post-week.js` posts one week of the regular season to a Discord webhook,
four times a day, walking the season out slowly:

```
## Week 3
{one embed per player who actually played}
```

Each embed carries the player as its author — name, headshot, and a link to
their page on the site — their school's mark as the thumbnail, and the school
and league in the footer. What sits between depends on whether the game has
been played:

- **A fixture** shows the matchup, the kickoff, home or away, and whether it
  is a conference game. Gold spine.
- **A final** shows the result and score in the title, the player's stat line
  in fields, and the record through that week in the footer. Green for a win,
  clay for a loss.

Nothing has been played yet, so every embed is currently a fixture. A game
gains a `result` and `stats` in `data/schedule.js` and the same post starts
reporting it.

When our own schools meet — Bloomington at Normal Community in week 3 — the
opponent's mark rides in the footer icon, which is as close to both crests as
one embed allows. Other opponents have no mark in the repo, so the footer
simply goes without.

A player on a bye, one with no game that week, and one with no schedule at
all are left out of the post rather than shown empty.

**It reads the site's own data.** `bot/site-data.js` runs `data/players.js`,
`data/ratings.js` and `data/schedule.js` in a sandbox, so the bot and the
website are never two copies of the roster — change a school or a score in
`data/` and both follow.

### Running it

```
node bot/post-week.js --dry-run            # build the next post, print it
node bot/post-week.js --week 4 --dry-run   # build one specific week
node bot/post-week.js --force              # post now, ignoring the clock
```

`DISCORD_WEBHOOK_URL` is required to actually post; `SITE_URL` defaults to
the Vercel domain and decides where the images and player links point.

### The schedule it posts on

`.github/workflows/discord-scores.yml` runs it four times a day at **07:00,
12:00, 16:00 and 20:00 America/Chicago**. GitHub's cron is UTC and ignores
daylight saving, so the workflow fires at the UTC equivalents of both CST and
CDT, and the script checks the real Chicago hour and exits quietly on the
runs belonging to the other offset. The posting times hold all year without
being edited twice a season.

Progress lives in `bot/state.json`, which the workflow commits after each
post, so a run that fails posts the same week again next time rather than
skipping it. Weeks where nobody played are stepped over.

**Setup:** add a channel webhook URL as the repository secret
`DISCORD_WEBHOOK_URL` (Server Settings → Integrations → Webhooks in Discord,
then Settings → Secrets and variables → Actions on GitHub). Until that exists
the workflow will run and fail loudly rather than post anywhere.

---

## The Shop

A tab next to Players, at `#shop`, **visible only to a signed-in player**.
Signed out, the tab isn't there and the page says to sign in. Signed in, the
nav carries the player's credit balance beside their headshot. Everyone starts
on 0 and earns from there. The catalogue lives in `data/shop.js`.

**Credits** are 60 every offseason, whatever a player is paid, plus what the
season earns by contract size and honours. That table sits at the bottom of
the page as a collapsible panel rather than taking up the top of it. Anything
unspent carries into the next offseason.

**Your Inventory** heads the page: what this player owns, what is in effect,
and the balance. Anything bought repeatedly is one row with a quantity rather
than a row per purchase — points read as *Catching +5*, boosters as *1.5x
Booster ×3* — in the inventory, in the admin panel, and in the database. Using
a booster takes one off the pile; the row goes when the last one does.
Training is the exception and stays one row per purchase, since each carries
its own roll. Buying deducts credits and drops the item in. A performance
booster is held unused until it is used, and using it deletes it — the
inventory is what a player still has, not a receipt book. Everything else
carries an in-effect switch that can be turned off and on. A stat booster
records which attribute it was bought for.

On sale:

- **Performance boosters** — 2.5x (40), 2.0x (25), 1.5x (15). Regular season
  only, one use per purchase. They are stickers: holographic, gold and silver
  sunbursts you stick on a game.
- **Rating points** — bought straight into an attribute, priced by how close
  that attribute already is to 99. Cheap early, dear late.
- **Offseason training** — strength (20) or cardio (25), each with a downside
  rolled when you buy it, or overall (20) for a smaller gain with nothing to
  lose. A flat price for a fixed set of points: poor value early, very good
  value once single points have got expensive.
- **QB Connection** (20), **Hyperbaric Chamber** (35, then 45, then 60, then
  15 more each time), **Intel** (15).

**Some things can't be bought yet.** An item can name the levels it belongs
to, and the shop greys it out everywhere else with the reason on the card —
the chamber is NFL only, and nobody has played an NFL season, so it reads
*Unavailable*. The check runs in the buy call too, since a disabled button is
only a suggestion.

**Intel lasts one season.** A purchase records the season it was made in.
While it is live, silhouettes appear beside the scouted games on that player's
own schedule — hover one and it says SCOUTS IN ATTENDANCE — and the legend
counts them. Once the season turns over the row reads *Expired*, the
silhouettes go, and it can't be switched back on. Which games scouts attend is
in `data/schedule.js` all along as `scouts: true`; Intel buys the right to see
it, and only on your own page.

Each stat booster names the attribute in `data/ratings.js` it applies to, so
buying one has somewhere to land once spending is built. Block Power is the
one exception: the ratings carry run block power and pass block power
separately, and which one it raises is still open.

### Rating points

The shop's main business. A player buys points straight into the attributes
their position is judged on, and **a point costs more the closer that
attribute is to 99**:

```
cost = 36 / (99 - rating + 1)
```

| Rating | 50 | 60 | 70 | 80 | 85 | 90 | 95 | 97 | 98 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Next point | 1 | 1 | 2 | 2 | 3 | 4 | 8 | 12 | 18 |

**The general attributes are not for sale.** Speed, strength, stamina,
awareness and the rest move only through offseason training, which is what
keeps training worth a slot in the shop. A quarterback is left with passing
and carrying to buy into; a tight end with catching, blocking and carrying.

A credit or two while a player is young and unformed, twenty-odd once they
are nearly maxed. That is what slows development down by the time they reach
the NFL, without ever capping it.

Points on the same attribute stack onto one row, so eighty points across a
career leave a handful of rows rather than eighty.

The table shows every attribute the position uses, what it is at, how many
points of it are worth one overall, and what the next one costs — **ordered
by what a credit actually buys**, so the top of the table is the right answer
and nobody has to work out the weighting themselves.

Three buttons per row buy **+1, +2 or +4** at one, two and four times the
price of the next single point. Buying in fours is a small discount at the
steep end of the curve, where four separate points would each cost more than
the last; it is there to save clicking.

**Tuning.** `UPGRADE_BASE` in `data/economy.js` is set so an offseason moves a
player about four overall. A 90-credit offseason, 20 of it on Overall
Training and the rest taken from the top of the table:

| Player | Position | Gain |
| --- | --- | --- |
| Andrew Parr | TE | +3 |
| Cooper Clark | RB | +3 |
| Paxon Hatch | TE | +4 |
| Isaac Vitel | QB | +6 |
| Sam Stogsdill | RB | +4 |
| Jaykeb Stewart | QB | +4 |
| | | **+4.00 average** |

Skipping training and putting all 90 into points comes out at +4.67, so the
two ways of spending an offseason are worth roughly the same. Season after
season it flattens on its own, which is the point.

### Booster stickers

A booster is not used from a list — it is **stuck on a game**. Signed in and
looking at your own schedule, every unplayed game grows a dashed **+** in the
Booster column. Clicking it slides a drawer up from the bottom of the screen
holding the stickers you own, each with a count. Click one and it goes on that
game and comes out of your inventory.

Hovering a sticker you can still move lifts it and draws a red cross over it;
click to take it off and put it back in the drawer. The cross lives inside the
sticker, so it carries the same tilt and scale rather than chasing them.

**Once the game has been played the sticker is stuck for good**: no cross, and
no + on a game that already has a result.

**Stickers are private.** Only the player who stuck one on — and Sam, as
admin — can see what is riding on which game. That is in the policy on
`game_boosters`, not just the interface, because the anon key can query the
table directly.

Each sticker is two die-cut layers, a backing in the same ink as the printed
number with the foil face inset inside it, both clipped to the same sunburst.
A plain border would be cut away by the clip-path, which is what made the
first pass look chewed at the edges; each face also paints a solid ground
under its moving gradients so nothing can flash through bare.

They sit bigger than their row and hang over the edge of it, top and bottom.
Angle and vertical nudge both come from a hash of the sticker's own row id, so
every sticker lands differently and keeps that placement through every redraw
— scattered, but never jittering. Nothing in the slot is in the row's flow, so
a row carrying a sticker measures exactly the same as one without: 51px either
way.

The three designs scale off a single `--sticker-size`, so the same sunburst
renders at 62px on a schedule row and 76px in the drawer without a second copy
of the CSS.

### Training

| Item | Effect | Risk |
| --- | --- | --- |
| Overall Offseason Training | Speed, acceleration, strength, agility, jumping, stamina +1 | none |
| Offseason Cardio Training | Speed, acceleration, agility, stamina +2 | strength −2 |
| Offseason Strength Training | Strength +4 | agility, stamina, speed −2 each |

Risks are rolled once, when the item is bought, and the result is stored on
the row. Reloading the page never re-rolls it.

### Everything carries over

Training, stat boosters and unused performance boosters all stay season to
season. Intel is the only thing that lapses, at the end of the season it was
bought for.

A quarterback's **QB Connection** reads **Back Field Connection** — he is
learning his backs and receivers, not himself.

**Sam is the admin.** He sees every account's balance and everything each one
owns, can set any balance, grant any item without charging for it, and remove
anything. Admins are rows in the `admins` table, so the list is changed in SQL
rather than from the browser.

Balances and inventories live in Supabase — `player_credits` and
`player_inventory` in `supabase/schema.sql` — and the policies there do the
real enforcing: a player writes only their own rows, an admin writes
everyone's. The browser code is the shape of the UI, not the security
boundary.

Purchases are **readable by everyone**, because a boosted overall has to show
on a player's card wherever it appears. Intel is the exception, in the policy
as well as the interface: only its owner and an admin can read an Intel row,
so nobody else can work out which games scouts will be at.

> Buying reads the balance, checks it and writes it back in sequence rather
> than in one locked transaction. With six players and one shop the worst case
> is a double spend from two tabs at once, which the admin can put right.

---

## Player Portal (login)

Each of the six gets an account and a private portal.

- **Login** — one account per player; a player only edits their own profile.
  Built on Supabase auth against a hardcoded list of six emails — nobody
  outside that list can hold an account. Sam Stogsdill's email is in; the
  other five are TBD.
- **One password, set once** — a player picks themselves out of the list. If
  their account has no password yet the portal asks for one twice; if it has
  one, the portal just asks them to sign in. Which form appears is looked up,
  not chosen by the player.
- **No password changes from the site, and no email at all** — no confirmation
  mail, no reset mail, nothing that costs anything to send. A player who
  forgets goes to an admin.
- **Admin password changes** — done in the Supabase dashboard under
  **Authentication → Users**, where any user can be given a new password. To
  put a player back on the first-time form afterwards, set their row in
  `player_accounts` back to `password_set = false`.
- **Show password** — every password field has an eye toggle, so what's being
  typed can be checked before it's submitted.
- **Overalls** — a rating per attribute (speed, strength, catching, route
  running, awareness, etc. — final attribute list TBD) plus a single overall.
- **Offseason workouts** — the progression mechanic. Between seasons a player
  spends workouts as boosts to raise specific attributes. Workouts are a limited
  resource, so choices have a cost.
- **Interactive layer** — beyond workouts, the portal is meant to be something a
  player actually plays with between games. Scope TBD; workouts come first.
- **Credits and inventory** — 60 an offseason plus what a season earns, spent
  in the shop, with what was bought kept per account. Every player starts on 0.

The read-only side of the site (schedules, records, stats) stays public — no
login needed to browse.

---

## Files

Built so far:

- `index.html` — the homepage: player select, plus a placeholder player view.
- `js/app.js` — renders the six cards and routes `#{slug}` to a player view.
- `data/players.js` — the six players and the season ladder. Source of truth.
- `js/auth.js` — Supabase auth: sign in, the one-time password, session state.
- `js/wallet.js` — credits and inventory: balances, buying, using, and the
  admin's reach across every account.
- `data/ratings.js` — the attribute list, the per-position weights, every
  player's ratings, and the maths that turns them into an overall.
- `data/schedule.js` — the regular season: every player's fixtures, and
  results and stat lines once games are played.
- `bot/` — the Discord scores bot (see below).
- `supabase/schema.sql` — every table and policy: accounts, credits,
  inventory, admins, and the stickers stuck on games. Run it in the Supabase
  SQL editor; it is safe to run again.
- `js/supabase-config.js` — your Supabase URL and anon key. Blank by default.
- `data/shop.js` — the shop catalogue: credit earnings and everything on sale.
- `data/economy.js` — every number about credits in one place: what a rating
  point costs, how much overall a point is worth, and the tuning behind both.
  Nothing else in the site invents a price.
- `site.css` — the theme (palette overriding the kit's tokens) plus the page
  components the kit doesn't cover (player card, roster grid, shop, login).

No build step and no bundler: open `index.html` in a browser, or serve the
folder with anything static. Data files are plain `<script>` globals rather than
ES modules so the site also works straight off the filesystem. The only external
dependency is supabase-js, loaded from a CDN.

### Connecting Supabase

1. In your Supabase project, open **Settings → API** and copy the **Project
   URL** and the **anon / publishable** key.
2. Paste both into `js/supabase-config.js`. The anon key is meant for browser
   code and is safe to commit. The **service_role** key is not — it bypasses
   every security rule and must never appear in this repo.
3. Run `supabase/schema.sql` in the Supabase SQL editor. It creates
   `player_accounts` (whether an account has a password yet), `player_credits`,
   `player_inventory` and `admins`, with the policies that keep each player to
   their own rows and let an admin reach every row. Without it the portal still
   signs people in — it just can't tell which form a player needs, and the shop
   has nothing to read or write.

Until those two values are filled in, the site runs normally and the portal
reports that login isn't configured yet.

**Worth knowing:** setting the first password doesn't prove who is setting it,
so whoever gets to an unclaimed account first claims it. With six known players
that's usually fine, and once a password is set nothing on the site can change
it — but it does mean each player should claim their own account before the
site is shared around.

### Kit and assets

Already in the repo and used as-is — `style.css` and `organic-styles.css` are
not modified; page-specific styles go in `site.css`:

- `style.css` — GRIDIRON DB UI kit: tokens, layout, panels, nav, buttons, tags,
  inputs, tabs, filter chips, data tables, pagination, stat tiles, meters,
  alerts, hero, photo placeholder, scoreboard, modal, utilities.
- `organic-styles.css` — the Organic design-system stylesheet `style.css` builds
  on.
- `headshot/` — the six player headshots.

Conventions the kit expects: state is a class (`.is-active`, `.is-selected`,
`.is-sorted`, `.is-on`), and every border is square — the reset forces
`border-radius: 0` globally, with the football brand mark as the only round
shape.

Theme hooks, overridden in your own `:root`:

```css
:root {
  --fb-accent: #e0a117;   /* CTA / highlight */
  --fb-grass: #3d472b;    /* field ground */
  --fb-shadow: 6px;       /* hard offset shadow depth */
  --fb-ink: #20261a;      /* borders + dark panels */
}
```

---

## Build Order

One thing at a time, in this order:

1. **This README** — the spec. ✅
2. **Player data file** — the six players, schools, positions (TBD where
   unknown), headshot paths. One source of truth everything else reads. ✅
   `data/players.js`
3. **Homepage** — six-card player select, wired to the data file. ✅
   `index.html`
4. **Player page shell** — `#{name}` routing, header, empty schedule/record/game
   log sections. *Routing and the header are in; the schedule, record, and game
   log sections are not.*
5. **Schedule data + display** — 2018 junior-year high school schedules per
   school, rendered with results and running record. Later seasons follow the
   same shape once 2018 is working. ✅ The fixtures are in
   `data/schedule.js`, the player page renders them, and the Discord bot
   posts them. Results fill the table's last column as games are played.
6. **Stat lines** — TE game log for Paxon Hatch first, other position sets as
   positions are confirmed. *The shape is in place — a game carries a `stats`
   object once played, and the bot renders it per position — but no game has
   been played yet.*
7. **Login + portal** — Supabase auth, accounts, attributes, overalls.
   *Login is in: allowlisted emails, a password set once, and the signed-in
   player's headshot in the nav. The portal behind it — attributes and
   overalls — is not.*
8. **Offseason workouts** — the boost mechanic.
9. **Extra interactive layer** — scope defined once the above is working.

---

## Open Questions

- Does any of the six play the optional 2023 senior college season instead of
  declaring for the 2023 draft?
- College programs for all six — the ladder needs them from the 2020 season on.
- A school for Vitel — with no school he has no schedule, so the bot never
  posts him.
- Results and stat lines, once games are played. The fixtures are real; every
  game is still waiting on a `result`.
- Real rating numbers, in place of the generated placeholders.
- Sign-in emails for Parr, Vitel, and Stewart.
- Whether the 60 an offseason is the earnings table's "Regular" row or sits on
  top of it. The shop currently treats them as the same 60.
- Which attribute Block Power raises: run block power, pass block power, or
  both.
- Whether workout and overall changes persist per browser (`localStorage`) or in
  Supabase. Read-only season data stays in the `data/*.js` files either way.
