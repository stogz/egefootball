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
## Week Three
{one embed per player with a game that week}
```

An embed reads top to bottom as:

| | |
| --- | --- |
| **Author** | the school, with its mark. Not a link — there is nothing on the site to send anybody to for a school |
| **Headline** | ``W `28-3` vs. Millbrook``, and the one link in the embed: the player's own page. The score is in backticks, so it sits in a box |
| **Block** | the whole stat line as a three-line grid, four numbers to a line, columns aligned |
| **Fields** | three summaries, the number above its heading |
| **Thumbnail** | the player's headshot. The post is about him, not his school |
| **Footer** | EGE Football Simulation |
| **Timestamp** | when the game actually kicked off |
| **Spine** | green for a win, clay for a loss, gold for a game not yet played |

The headline and the block are the embed's *description* rather than its
title, because a title renders as flat text — the score would lose its box and
a code block could not go under it at all.

The block carries the **typed** stats — the ones in `stats/{year}.js`. The
averages, the totals and the passer rating are left out, because they follow
from the numbers beside them rather than standing alongside them.

The three summaries are the headline numbers for that position, most of what
he does first:

| | | | |
| --- | --- | --- | --- |
| **QB** | Touchdowns/INT | Passing | Rushing |
| **RB** | Touchdowns | Rushing | Receiving |
| **TE**, **WR** | Touchdowns | Receiving | Rushing |

Passing and receiving read as what he did with what he was given — `9/18, 118`
and `5/9, 52` are the same shape. Carrying has no attempts to fall short of,
so it says how many rather than how many of how many: `19 CAR, 159`. Nothing
to report collapses to a nought rather than spelling out zeroes.

The number is the field's name and the heading is its value, because Discord
draws a name above its value and the number is what should be read first.

A game that has not been played keeps the same shape: the kickoff, home or
away, and whether it is a conference game fill the three block lines, and the
three summaries show dashes.

### Every embed is the same height

A week of posts should read as a column, not a staircase, so the layout is
fixed rather than following the numbers:

- **The block is always three lines.** Four numbers to a line does it: a
  quarterback's twelve fill three rows exactly, and everybody else's eleven
  leave one gap on the last row. Wrapping by character width — the obvious
  way — gave two lines for one player and three for the next.
- **There are always exactly three fields.** A fourth wraps onto a second row
  and makes that embed taller than the one above it, which is why credits
  earned are no longer among them.
- **Nothing in a field is wide enough to wrap.** A field column is about 95
  pixels on a phone. `Touchdowns/Interceptions` measures 150, so the heading
  is `Touchdowns/INT`; `12/18, 187YDS` measures 95 exactly and
  `24 CAR, 287YDS` measures 110, so the yards go without a `YDS` suffix that
  the heading underneath was saying for them anyway. The widest either gets
  now is 81.

Checked by rendering all 47 games of the season, plus a fixture, at desktop
and phone width: every one comes out the same height.

### The kickoff timestamp

A Discord timestamp is an instant, and it renders in whoever is reading's own
time zone. A 7:00pm kickoff is not an instant until you know where it was, and
a Carlsbad game and a Wake Forest game both listed at 7:00pm are three hours
apart — so every school carries a `zone` in `data/players.js`.

Working out the instant is two steps: read the naive time as if it were UTC,
ask what that instant looks like on the school's clock, and take the gap back
off. Daylight saving comes out right because the zone answers for the day in
question rather than for today. A game with no kickoff time, or a player with
no school yet, simply goes without a timestamp.

A player on a bye, one with no game that week, and one with no schedule at
all are left out of the post rather than shown empty.

**It reads the site's own data.** `bot/site-data.js` runs `data/players.js`,
`data/ratings.js` and `stats/{year}.js` in a sandbox, so the bot and the
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

The bot is a **backstop, and entirely optional**. Publishing from the admin
page posts the week there and then; these runs catch anything that did not go
out — Discord was down, the click half-landed. Each run asks Supabase which
weeks are published but unposted, sends them oldest first, and marks them, so
nothing is posted twice and nothing is written back to this repository.

With a webhook in `js/discord-config.js` there is not much left for it to do.
Set it up if you want the safety net; skip it and publishing still posts.

**Setup:** three repository secrets under Settings → Secrets and variables →
Actions:

| Secret | What it is |
| --- | --- |
| `DISCORD_WEBHOOK_URL` | the channel webhook (Server Settings → Integrations → Webhooks) |
| `SUPABASE_URL` | your project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API. Server-side only — it never goes near the browser |

Until those exist the workflow runs and fails loudly rather than posting
anywhere.

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
in `stats/{year}.js` all along as `scouts: true`; Intel buys the right to see
it, and only on your own page.

Each stat booster names the attribute in `data/ratings.js` it applies to, so
buying one has somewhere to land once spending is built. Block Power is the
one exception: the ratings carry run block power and pass block power
separately, and which one it raises is still open.

### Rating points

Buying several at once is **every point priced where it lands, added up** —
not the first one's price times four. A point at 64 costs 1 and a point at 65
costs 2, so a +4 from 64 is 1 + 2 + 2 + 2 = 7, not 4. Pricing the run off the
first point would sell the three dearer ones at the cheap rate, which is a
discount for buying at exactly the wrong moment.

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

Hovering a sticker you can still move fades it back, rules slanted lines
across it and draws a cross over it, all in the same ink as its edge — it
stays exactly where it is and exactly the size it is. Click to take it off and
put it back in the drawer.

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

They sit bigger than their row and hang over the edge of it, top and bottom,
centred on the same point the empty slots use so the column stays a column.
Angle and vertical nudge both come from a hash of the sticker's own row id, so
every sticker lands differently and keeps that placement through every redraw
— scattered, but never jittering. Nothing in the slot is in the row's flow, so
a row carrying a sticker measures exactly the same as one without: 51px either
way.

The three designs scale off a single `--sticker-size`, so the same sunburst
renders at 62px on a schedule row and 76px in the drawer without a second copy
of the CSS.

### Training

Training rolls **one twelve-sided die** when you buy it. On a 1, 2 or 3 the
downside lands, all of it; on 4 and up, none of it — a quarter of the time,
not most of it. Rolling each risk separately is what made three coin flips add
up to a debuff nearly every time (87.5%, as it turned out).

| Item | Effect | Risk |
| --- | --- | --- |
| Overall Offseason Training | Speed, acceleration, strength, agility, jumping, stamina +1 | none |
| Offseason Cardio Training | Speed, acceleration, agility, stamina +2 | strength −2 |
| Offseason Strength Training | Strength +4 | agility, stamina, speed −2 each |

Risks are rolled once, when the item is bought, and the result is stored on
the row. Reloading the page never re-rolls it.

### Everything carries over

Unused performance boosters and unspent credits carry into the next season —
nobody loses what they paid for. Rating points and offseason training do not
carry as *rows*, because at the end of a season they are folded into
`data/ratings.js` and become the player's actual numbers. Intel lapses at the
end of the season it was bought for.

A performance booster is **used on the player page**, by putting it on a game
from your own schedule. There is no Use button in the shop: spending one there
never said which game it was for.

A quarterback's **QB Connection** reads **Back Field Connection** — he is
learning his backs and receivers, not himself.

**Sam is the admin**, and his tools are on their own page — see
[The Admin Portal](#the-admin-portal). Nothing admin sits on the shop page:
the shop is what a player buys with, and that is all it is. Admins are rows in
the `admins` table, so the list is changed in SQL rather than from the
browser.

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

### Credits earn themselves

Nobody hands credits out by hand for a good game. A touchdown is worth credits
the moment the week is published:

| Position | A touchdown is worth |
| --- | --- |
| RB | 10 |
| TE | 10 |
| WR | 10 |
| QB | 5 |

A quarterback throws for more of them than a back runs for, so his are worth
less each and the season comes out somewhere similar either way. Every
touchdown counts at the player's own rate, however it was scored — a
quarterback who runs one in is paid 5, not 10.

On top of that, every season after the first pays the flat **60** offseason
allowance on the way into it. The first season pays nothing: everybody starts
on zero and earns the first 60 by getting through a season.

**How it stays right.** What a player is owed is worked out from the schedule
every time they open the site, and each award carries a key for what earned it
— `td-w4`, `offseason-2019`. Those keys are unique per player per season in
`credit_awards`, and `pay_credit_awards()` inserts the new ones and moves the
balance **in one transaction**, so paying on every page load is both safe and
the whole point. Post a result with two touchdowns in it and the back who
scored them is twenty credits better off the next time he looks. Reload all
day and he is still twenty credits better off.

A player with no sign-in yet still scores: the admin page shows what they are
owed as *waiting*, and it lands in full the first time they log in.

> The credits come from the browser, because what a touchdown is worth is
> worked out from `stats/{year}.js` and Postgres has no copy of it. A player
> could already set their own balance directly — buying things needs that — so
> this is not a new hole, but the easy half of it is closed: for anyone who is
> not an admin, an award has to look like one of the two kinds the site issues
> and cannot be worth more than either honestly could be.

---

## Seasons, and putting a week out

### One file per season

```
stats/
  2018.js
  2019.js
  2020.js
```

Each holds the whole season — who each of them plays, when, and what they did
in it. There is no separate schedule file: a game and what happened in it are
the same thing, so they live on the same line.

```js
{ week:  2, date: '2018-08-25', kickoff: '7:00pm',
  opponent: 'Del Norte', home: true, conference: false, scouts: true,
  result: { teamScore: 28, opponentScore: 14 },
  booster: 'boost-2-5',
  stats: { carries: 18, rushingYards: 132, rushingTd: 2, ... } },
```

`result` and `stats` are null until a game has been played. Nothing generates
them — the numbers come from wherever you generate them and are typed in, by
hand or through the season editor. `booster` is the performance booster that
was riding on the game, and once a week is out that is where it lives for
good, so the row behind it can be cleared out of Supabase.

A new season is a new file and one more `<script>` tag in `index.html`. The
bot finds them on its own.

### Nothing is out until you say so

A season file can hold every result of the year and the site will still show
none of them. A week becomes real when you publish it, which is a row in
Supabase rather than anything in the repository. So the numbers can sit in git
for as long as it takes, and a booster somebody used after the file was
written can still be put right first.

`EGE.isFinal` is what everything reads, and it answers no until the week is
published — which keeps the schedule, the record, the game log, the touchdown
credits and the Discord bot from ever getting ahead of you. The season editor
reads `EGE.hasResult` instead, because it has to show you what has not gone
out yet.

### Publishing

**Weeks**, on the admin page, is a row per week: how many games it holds, how
many have numbers in the file, whether Discord has had it, and a button.

**Publish** does all of it on the one click:

- the scores and stat lines appear on the player pages
- the records move
- everybody is paid their touchdown credits, and the credits show on the
  schedule row that earned them
- the week goes to Discord, with a link back to the site

**Pull back** takes a week off the site again, one click, no confirmation,
as often as you like — testing this means publishing and unpublishing the
same week over and over. Credits already paid stay paid: an award is a ledger
entry, not a view of the schedule, so publishing again pays nothing twice.

**Post again** re-sends the Discord message without changing anything.

### How the Discord post gets sent

Two ways, and publishing uses whichever is available.

**The webhook in `js/discord-config.js`.** Paste the channel webhook URL in
and the browser posts straight to it. That is the whole setup — nothing to
deploy, and the message lands on the click.

```js
EGE.discordConfig = {
  webhookUrl: 'https://discord.com/api/webhooks/...'
};
```

Anything committed is public, so anyone who views source can read that URL and
anyone with it can post to that channel as the bot. It grants nothing else —
not the server, not the members, not anything said in it — and a bad message
can be deleted. For a channel a few friends read, that is a fair trade for not
running anything. Rotate it by deleting the webhook in Discord and making a
new one.

**The edge function**, if you would rather not publish it. Leave the config
blank and the browser hands `supabase/functions/post-week` a payload instead;
the URL stays a Supabase secret, and the function checks the caller is an
admin against the same `admins` table the rest of the site trusts.

```
supabase secrets set DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'
supabase functions deploy post-week
```

Either way the week is published before the post is attempted, so a message
that does not land is a message missing from a channel, not a week missing
from the site. **Post again** retries just the message.

A failed direct post never falls back to the function: a request that reached
Discord but whose reply the browser could not read looks exactly like one that
never arrived, and trying the other route would post the week twice.

### The season editor

**Season File**, under the week list, is every game in a week as the file has
it: the score, the booster, and every number that position's line is typed
from. The averages, the totals and the passer rating are not there — they
follow from the rest and are worked out when the file is written, so a line
can never disagree with itself.

Edit as many weeks as you like; they are all held until you download. **Pull
in the stickers players applied** takes whatever is on that week in Supabase
and writes it into the file, so it can be committed and the rows behind it
cleared.

Downloading writes `stats/{year}.js` back out — the same fixtures, your
changes on top, every other week exactly as it was read. Commit it and the
numbers are live, for the weeks you have published.

### The stat lines

Defined once in `data/statline.js` and read by the player page, the season
editor and the Discord post, so there is never a version of a quarterback's
line that disagrees with another version of it.

**Quarterback** — C/ATT, PYDS, PAVG *(PYDS/C)*, PYAC, PTD, INT, RTG, CAR,
RUYDS, RUAVG, RUTD, LNG, SACK, FL

**Running back** — YDS, TD, CAR, RUYDS, RUAVG, RUTD, LNG, REC, REYDS, REAVG,
YAC, RETD, LNG, TGT, FL

**Wide receiver and tight end** — YDS, TD, REC, REYDS, REAVG, YAC, RETD, LNG,
TGT, CAR, RUYDS, RUAVG, RUTD, LNG, FL

A season totals up the way each column is meant to: summed down the column, a
long is the longest, and a passer rating is worked out again from the season's
numbers. Averaging a column of averages is how a stat page ends up lying.

### On the player page

A **season switcher** in the schedule head, once there is more than one season
to switch between. Every past season keeps its schedule, its stat lines, its
record and the boosters that were on its games.

Every published week **opens** to show that game's line under the columns the
position is read in. The week number is the handle.

A **credits marker** on the row says what the game paid — visible to the
player and to an admin, nobody else, the same rule the boosters follow.

---

## The Admin Portal

`#admin`, a tab that only appears for an admin, and a page that refuses anyone
else. It holds everything Sam used to do from the shop page, plus the two
things that end a season.

**Accounts** — every balance and everything each player owns. Set a balance,
hand an item over without charging for it, remove anything, or pay an award off
the earnings table. An award goes through the same ledger the touchdowns do, so
the season log has a line for it rather than a balance that moved for no
recorded reason.

**Credits Earned** — what the season has paid out so far, by player: touchdowns
scored, what they were worth, the allowance, anything paid by hand.

**End of Season** — four steps, in this order, because the order is the only
thing keeping anybody's season safe:

1. **Lock the ratings.** Downloads a `data/ratings.js` with every rating point
   and every offseason workout bought that season folded into the base
   numbers. Only the numbers change: every comment, weight and helper in the
   file survives, because the file is read and its ratings block spliced
   rather than rebuilt. A player nobody spent anything on comes out byte for
   byte as they went in, so the diff is only the players who actually moved.
   Commit it, and the improvements are part of the site rather than part of a
   database.
2. **Log the season.** Downloads `data/logs/season-{year}.js`: every game with
   the stats posted in it and the booster that was riding on it, every credit
   earned, and everything bought. A record, not a source — nothing on the site
   reads it. It is there so a season cleared out of Supabase is still on the
   record afterwards.
3. **Clear the shop rows.** Wipes everybody's rating points and offseason
   workouts, which the ratings file now carries instead. Unused performance
   boosters stay, and Intel lapses on its own. Two locks on this one: the
   ratings file has to have been downloaded in the same sitting, and the word
   CLEAR has to be typed. Everything it deletes is recoverable only from that
   file.
4. **Roll the season over.** Downloads a `data/season.js` pointing at the next
   season, with the one just finished added to `lockedSeasons` so it can never
   be locked twice. Commit it and everybody is paid their allowance on their
   next visit.

Building a file and clearing the rows it replaces are deliberately separate
actions, in that order, with the commit in between. The portal will not let
step 3 run before step 1, and says so rather than doing it.

Steps 1, 2 and 4 read `data/ratings.js` and `data/season.js` back over HTTP, so
they need the site served rather than opened off a disk. Both refuse with a
message rather than handing over half a file.

---

## The overall, and where it came from

The numbers in `data/ratings.js` are where a season started. What a player has
bought since shows beside his overall on his own page as an arrow — **▲ +3** —
with the number he started at in the tooltip.

At the end of a season the admin locks the ratings: everything bought is
folded into the base numbers, the file is committed, and the rows behind it
are cleared. Credits and unused performance boosters carry over; rating points
and Intel do not, because they have become the ratings themselves.

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

- `bot/` — the Discord scores bot (see below).
- `supabase/schema.sql` — every table and policy: accounts, credits,
  inventory, admins, the stickers stuck on games, the credit awards a season
  pays out, and which weeks are published.
- `js/discord-config.js` — the channel webhook URL, if you are happy for it to
  be public. Blank by default.
- `supabase/functions/post-week/` — the other way: an edge function that holds
  the webhook URL, so the browser never has to. Run it in the Supabase SQL editor; it is safe to run
  again, and it must be re-run after pulling a change that adds a table.
- `js/supabase-config.js` — your Supabase URL and anon key. Blank by default.
- `data/shop.js` — the shop catalogue: credit earnings and everything on sale.
- `data/economy.js` — every number about credits in one place: what a rating
  point costs, how much overall a point is worth, what a touchdown pays, and
  the tuning behind all of it. Nothing else in the site invents a price.
- `data/season.js` — which season is live, and which seasons have had their
  ratings locked. Small on purpose: the admin portal rewrites this whole file
  when a season is rolled over.
- `stats/{year}.js` — one per season: every fixture, and the score, stat line
  and booster for each once it has been played. Nothing else holds a schedule.
- `data/games.js` — how everything else gets at those games, and the one place
  that decides what "played" means.
- `data/statline.js` — what a stat line is: the columns each position is read
  in, and how a season of them adds up.
- `js/discord-post.js` — one week as a Discord message. Loaded by the browser
  so the publish button can build it, and by the bot so a scheduled run builds
  exactly the same thing.
- `js/exports.js` — builds the files a season leaves behind:
  a published week, the locked ratings, the season log, and the season
  pointer. Reads Supabase, writes nothing.
- `data/logs/` — a season log per season, written by the admin portal. Empty
  until a season has been played out.
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
   `stats/{year}.js`, the player page renders them, and the Discord bot
   posts them. Results fill the table's last column as games are played.
6. **Stat lines** — a full game log per position. ✅ The columns are in
   `data/statline.js`, the player page renders them with season totals, and
   the bot posts the same line. Weeks are rolled and published from the admin
   page — see [Playing a Week](#playing-a-week).
7. **Login + portal** — Supabase auth, accounts, attributes, overalls.
   *Login is in: allowlisted emails, a password set once, and the signed-in
   player's headshot in the nav. The portal behind it — attributes and
   overalls — is not.*
8. **Offseason workouts** — the boost mechanic. ✅ The shop, rating points,
   training, boosters and the sticker layer are all in.
9. **Season automation** — credits that earn themselves as results are posted,
   and a season that can be ended, locked into the repository and rolled over
   from the admin portal. ✅ `js/exports.js`, `data/season.js`, `#admin`.
10. **Playing the season** — a hardcoded file per season, published a week at
    a time from the admin page, with the Discord post on the same click. ✅
    `stats/{year}.js`, `data/games.js`, `js/discord-post.js`.
11. **Extra interactive layer** — scope defined once the above is working.

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
