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

| Player | High school (2018–19) | League | College (2020–) | Conference | Position | Plays like |
| --- | --- | --- | --- | --- | --- | --- |
| Andrew Parr | Wake Forest High School | Northern 4A | Alabama | SEC | TE | a complete tight end |
| Cooper Clark | Carlsbad High School | Avocado League | USC | Pac-12 | RB | a receiving back |
| Paxon Hatch | Bloomington High School | Big Twelve | North Dakota State | Missouri Valley | WR (TE through 2019) | a full-time receiver |
| Isaac Vitel | Bloomington High School | Big Twelve | Illinois | Big Ten | QB | a deep thrower |
| Sam Stogsdill | Normal Community High School | Big Twelve | Ohio State | Big Ten | RB | a power back |
| Jaykeb Stewart | Naples High School | 6A District 12 | Ohio State | Big Ten | QB | a pocket passer |

**Isaac and Paxon were high school teammates**, which the data has to respect:
they played the same fixtures, carried the same scorelines, and every ball
Paxon caught was one Isaac threw. His completions, attempts, yards and
touchdowns each start at Paxon's and go up from there. In college they split
up, and **Sam and Jaykeb become teammates** at Ohio State instead — the same
rule holds for them from 2020.

A player's school is `team` (the high school) and `college` in
`data/players.js`, both keys into `EGE.teams`; `EGE.teamFor(player, season)`
picks one by the season's tier on the ladder, so a 2019 page still says Wake
Forest High School after Andrew has gone to Alabama.

Everything marked TBD is genuinely unknown right now and should stay TBD in code
and data until it is confirmed — no placeholder guesses that later read as facts.

Headshots live in `headshot/`, keyed by last name: `parr.png`, `clark.png`,
`hatch.png`, `vitel.png`, `stogsdill.png`, `stewart.png`. Replacing one under the
same name? Change `EGE.headshotVersion` in `data/players.js` as well: Discord
keeps its own copy of any image a post links to and goes by the address, so
the Discord posts only pick up a new picture once that version (on the end of
the address) changes. School marks live in
`icon/`, keyed by school: `carlsbad.png`, `bloomington.png`, `normal.png`,
`naples.png`, `wake.png`. The colleges use the marks already cut for their
offer stickers in `icon/offers/`. A team without a mark renders its school line
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

**Redshirts.** The ladder's class is what a season is for a player who never
redshirts. **Isaac redshirted his freshman year** (`redshirt: 2020` in
`data/players.js`): 2020 used no eligibility, so it reads simply *Redshirt*,
and from then on he is the year of eligibility he is in, a year behind
everybody else — *Freshman Year* in 2021, *Sophomore Year* in 2022.
`EGE.classFor` works it out, and his Teams card says *RS* in 2020 and *FR*
in 2021.

So **a class is only ever named on a player's own page** — the strip across
his header and his season switcher, both his own. Everywhere else a season
is a year and a level, *2020 · College Football*: the home page, the Teams
pages, the admin page.

---

## Site Structure

### Homepage — player select

- The landing page is a six-way player picker: one card per player with their
  headshot, name, school, and position (or TBD).
- Selecting a card routes to that player's page.

### Loading screen

From the first paint until the published weeks and the purchases have come
back from Supabase, the whole site is blurred and
`icon/football_loader_preview.gif` spins in the middle. Signing in raises it
again while that player's wallet loads. If the script never gets far enough
to take it down, the stylesheet does after eight seconds.

### Player page — `/#{name}`

Routed by player name, e.g. `#andrew-parr`, `#paxon-hatch`. Each player page
holds:

- **Header** — headshot with height and weight joined to the foot of it, then
  school and name. On a college season the school is a link — an arrow after
  it, the name underlined when pointed at — to that school's team page,
  opened on the same season. Where the team stands in its conference is on
  the team page, not here. Under the name is the recruiting line: 247-style stars out
  of five and his rank at his position in his state and nationally
  (**★★★★☆ #1 RB in Illinois · #5 nationally**), from `EGE.recruiting` in `data/offers.js` — on the high school seasons only; a college season has no recruiting line. Under that, three facts: **Position**, **Record**
  (the team's wins and losses over the season on show, 0-0 until the first
  result is out, followed by the current run — **6-1 · W4 Streak**, green for
  wins and red for losses — until the team's season is over) and **Jersey**.
  A college season puts a fourth between Record and Jersey, in the room the
  recruiting line leaves: **Conference**, where the team stands in its
  division as of the published weeks — **3RD in SEC West** — and TBD until
  the team has played a conference game. It moves week by week: the six's
  own games come from the season file, and everybody else's from
  `data/conferences.js` (see *Conference standings* below).
  A season is over once it is behind the live one, or once the team has
  played the last postseason game in its file — beaten in a playoff, won its
  bracket or played its bowl (a college team that loses its conference title
  game still has a bowl to come) — or, for a school that missed the
  playoffs, once their first week is out. The season, his class (see
  *Redshirts*) and the level are across the
  orange strip at the top of the panel. The overall is not up
  here: it lives with the ratings it is worked out from, at the foot of the
  page. The top right holds the college offers, as stickers — again on the
  high school seasons only. Once he has signed, the corner is empty.
  The marks on them are cut down to 160 pixels on their long side, which is
  more than twice the size they are drawn at, so a page of them loads fast.
- **Injury report** — a red band across the foot of the header panel, only
  while the week being played (the first week of the live season not yet
  published) is one the season file marks him `injured: true` for: OUT, what
  with (`injury`), how healthy he is as a bar (`health`, 0–100 — green from
  75, gold from 40, red under that) and the next week he is not marked, as
  *Expected back week 8*. Before that week nobody knows, and once it is
  published the band goes with it unless the next week is marked too. It is
  `EGE.injuryFor` in `data/games.js`, and the season editor has the three
  fields on every game.
- **Season strip** — the ten numbers the season is remembered by, across the
  foot of the header panel: ten across on a wide screen, five and five on
  anything narrower.
- **Season switcher** — above the header, beside the All Players button and
  outlined the same way, once more than one season is logged: a drop-down of every season with a file in `stats/`, up to the live
  one (and, for an admin, any season after it whose file is already in,
  labelled *Preview*, so a new season can be looked over before it is rolled
  over to), with ‹ and › either side to step through them. It switches the header,
  season strip, schedule, game log and bracket to that season. Opening a
  different player goes back to the live season. An older season shows no
  scouts and takes no boosters. On a phone the whole bar is one row: All
  Players becomes a round ← button, and the picker shows just the year.
- **Schedule** — every scheduled game in the selected season: week, date,
  opponent with home/away, the opponent's logo (college seasons only,
  straight off ESPN's image server by the school's ESPN id in
  `data/logos.js` -- nothing is saved into the site) and a mark for
  conference games, the **ODEF** grade, and the result once it has been
  played. No kickoff
  time: the file still carries it for the Discord post, but the page does
  not show it. The Credits and Booster columns are only drawn on your own
  schedule, or on anyone's for an admin. A silhouette marks a game scouts will attend,
  for a player holding Intel for that season. Postseason games are marked with
  two asterisks, a named one — SEC Championship, Rose Bowl — CFP
  Semifinal, FCS Quarterfinal — carries its `name` on a line under the
  opponent, and a school in a bracket gets a **Games | Tournament** switch
  beside the fold-away arrow.

  **The postseason only shows as far as the next game.** The regular season is
  all there from the first week, but no playoff game appears until every week
  before it on that player's schedule is published — so nothing says a team
  made the playoffs until its regular season is out, and each published
  playoff week adds the next matchup and nothing after it. Past the
  postseason's first week nothing shows until that week is out either, so a
  bowl is not on a schedule before the conference title games that decide
  who goes where. A bye counts as
  done once its week is out. The Tournament switch arrives with the first
  game of the draw on the schedule, since a bracket with the school in it
  would say the same thing early — for a high school that is its first
  playoff row, and for a college team waiting on the College Football
  Playoff it is the semifinal, which only appears once its conference title
  game is published (`EGE.bracketInSight`). Everything counted under the table
  (the games, the Intel scouts) counts only the rows on it. This is the page,
  not a lock: the season file still holds the whole postseason, the way it
  holds every result before its week is published. The admin page still
  lists every week, since that is where they get published from. It is
  `EGE.scheduleFor` in `data/games.js`.

  **ODEF** grades the defense across the way, A to F, for what this player
  does: a back is graded on the run defense he runs into, a quarterback,
  receiver or tight end on the pass defense. A stingy run defense is an A
  for Cooper or Sam, and a sieve an F — a report card's colours, so the A is
  the hard one to play. The numbers are each school's real rushing and
  passing yards allowed a game that season, ranked among every school at its
  level (FBS against FBS, FCS against FCS), and a grade is a fifth of that
  list. The tooltip says the number, the yards a play and the rank. A school
  that barely played that season — UConn sat 2020 out, and the FCS played
  its 2020 in the spring, which ESPN does not carry — is graded on the season
  before, and says so. A season with no numbers yet borrows the latest ones,
  so a new season's schedule is graded the day its file goes in. High
  schools have no grade and no column. `EGE.defenseGrade` in
  `data/games.js`, from `data/defenses.js`.
- **Game log** — per-game stats for that player, with the stat lines driven by
  their position (see below), and a totals row for the season, on the
  panel's own cream under a hard rule.
- **Ratings** — three tiers, top to bottom:
  - **The overall**, on a dark band across the panel: the word in orange, the
    number in white, and a green stock ticker after them — an arrow and the
    number of points the overall has climbed since the live season began.
  - **His three best attributes**, stood like a podium without the podium:
    the best in the middle and biggest, the second on the left a size down,
    the third on the right a size down again. They are ranked among the
    attributes his position is judged on (the ones in `EGE.positionWeights`),
    so a running back's Break Sack — a quarterback's number, worth nothing to
    his overall — never makes it. A tie goes to whichever counts for more
    toward his overall, then to whichever comes first on the page.
  - **Every attribute in its group**, as before. Each group score and each
    attribute that moved carries a smaller ticker, and the season's gain is
    drawn in orange on the end of each bar.

The schedule, the game log and the ratings each fold away behind an arrow in
their heading.

The season shown is the live one. There is one season on the ladder so far, so
there is nothing to switch between; `shownSeason()` in `js/app.js` is the one
place that decides, and a way back to an older year is a change to it and
nothing else.

### Teams — `#teams`

A tab beside Players, public like the player pages, and laid out like
them. **College only** — the high schools are on the player pages.

**The index, `#teams`**, is a stack of cards, one school to a row: its mark
on the left, on the school's own colour (`ground` in `EGE.teams` — Alabama
crimson with the A in white, USC cardinal (#9D2235), NDSU green, Illinois orange,
Ohio State white; the team page's header uses the same), then its record and place in its division, the faces of the
six who play there, and *View team →*. On a wide screen those run across
the row — the name and record on the left, each of the six as a face with
his name beside it in a column of its own, so they line up from card to
card, and *View team →* on the right edge; narrower, they stack under the
name and the faces go without the names. Above them is a season switcher
across the full width of the page, as on a team's page — every college
season, with ‹ and ›, starting on the live one.

**A team's page, `#teams/{school}`** — `#teams/ohio-state` — has what a
player page has above it: *← All Teams* and the season switcher, a
drop-down of every college season that school had one of the six, with ‹
and › either side. **The season is shared** between the index and every
team's page: pick 2021 on either and it is 2021 on both, until it is
changed again (a school that had none of the six that season opens on the
latest season it did). An admin also sees a season whose file is in but which has not
been rolled over to yet, marked *Preview*, so 2021 can be looked over now.
Under the bar:

- **The header** — the mark, the name, the record and streak, the place in
  its division, and the six on it, through to their pages.
- **Roster** — every quarterback, back, receiver and tight end on the
  real roster that season, a room each, **best overall first**, so a room
  reads as a depth chart and the six land wherever their overall puts them.
  The rooms run two across (one on a phone), so every name fits on one
  line. Every player is a card — a big headshot (ESPN's,
  or initials where ESPN has none), name, number, **class** (FR, SO, JR,
  SR, or GR for a fifth year), height and weight, and an **overall** in the
  same box the six's is drawn in. One of the six is picked out in orange and
  goes through to his page. No season stats are shown; they are in the
  overall. **An 80 or better is a diamond**: the overall box is a
  princess-cut blue diamond — a steel-blue frame, a band of triangular
  facets running in from the corners, a pale square table in the middle
  with the number on it in deep navy — drawn as an SVG, with a band of
  light sweeping across it and a sparkle in the corner (still, for anybody
  who asks for less motion). It is the same on the Teams page and the six's
  roster cards, so it means the same thing everywhere. Four show and the rest fold away behind *N more*, but never past
  one of the six. From `data/rosters.js`,
  which `tools/build-rosters.js` writes; `EGE.rosterFor` in `data/games.js`
  puts the six in. A season with no roster yet borrows the latest one.

  **Nobody shares a number.** The six keep theirs. A real player wearing a
  number already taken — one of the six's, or a better teammate's — gets
  the nearest number his position wears that nobody on the team has (a
  tight end the 80s first, a back the 20s to 40s, a quarterback or
  receiver the teens): Andrew is Alabama's 87, so Miller Forristall is
  their 85. Every real player's own number is kept before anybody is
  moved, so moving one never moves another. ESPN only keeps a player's
  latest number and headshot, so for a player who later transferred out
  (`left: true`) they are his next school's; a teammate who stayed keeps a
  shared number before him — Bryce Young is Alabama's 9, and Jahleel
  Billingsley, whose 9 is from Texas, moves. The number ESPN has is on the
  tooltip.

  **The overalls.** Nobody publishes a rating for every college player, so
  one is worked out for each, on the six's scale but **topping out at 84**
  — a Heisman season — with most players between 50 and 75:

  ```
  overall = 50 + 34 × (0.25 × talent + 0.10 × experience + 0.75 × production)
  ```

  kept within 40–84. *Production* carries most of it: his season —
  scrimmage yards plus 20 a touchdown — against a Heisman-calibre one at
  his position (5,000 for a quarterback, 2,000 a back, 1,800 a receiver,
  1,000 a tight end), no more than all of it, or four fifths of the season
  before when that was better, since a quiet year does not make anybody
  worse (and the FCS's spring 2020 is not on ESPN). *Talent* is how highly
  he was recruited — the 247Sports Composite rating out of school, 80 and
  under counting nothing and 100 everything, nothing for a walk-on. It is
  only an ingredient; no recruiting number is shown. *Experience* is his
  year of college. The weights add up to more than one, so a Heisman season
  reaches 84 whether or not he was a five-star, and nobody gets near it on
  recruiting alone. An FCS school's score counts 85%. A walk-on freshman is
  a 50, a five-star freshman who has not played about 58, a good starter
  about 70; DeVonta Smith's 2020 and Bryce Young's 2021 are 84s, C.J.
  Stroud's 2021 an 82. The constants are at the top of
  `tools/build-rosters.js`.
- **Conference Standings** — the whole conference as one table: the dark
  row of headings once at the top and every school under it, the school's
  own division first, a rule where the next division starts, and the
  division in a short **Div** column (*East*, or just *E* on a phone). The
  **#** is the division place, the conference record (**Conf**), the overall
  record (**Ovr**, every game — see below), the conference streak (**Strk**,
  *W3* in green or *L1* in red), conference points for and against and the
  differential, and **Chg**, how many places a school has moved since the
  week before the latest one published — a green ▲ up or a red ▼ down.
  Every heading sorts, the way the game log's do: biggest first, then
  smallest, then back to the standings (the place and the school's name go
  1 and A first). Sorted, the divisions mix; the # stays each school's
  division place. A line under it says which week the table runs through,
  so a published week visibly moves it — the overall record moves every
  week, including weeks with no conference games in them. The school's own
  row is picked out in orange and nothing else is marked. On a phone the
  points and differential drop out and a long school name is cut short; the
  rest scrolls sideways. `EGE.conferenceTables` in `data/games.js` works out
  the movement by drawing the table as it stood a week earlier, and
  `EGE.overallRecord` the overall record.
- **Schedule** — the team's games as anybody can see them, with results as
  they are published and the postseason as far as the next game, the same
  rule a player's schedule follows. No credits, boosters or ODEF grades:
  those belong to a player.

The quarterback rooms are also where a QB Connection is picked from (see
the shop).

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

Every player has a shape as well as a number. The shapes are made by moving
points **within** the weighting rather than adding them, so reshaping somebody
never changes their overall: Isaac's deep ball came out of his short accuracy,
Sam's trucking came out of his spin and juke, and Cooper's hands came out of
his power running. Each one was checked before it was written — all three
overalls are exactly where they were.

Every player carries the same 32 attributes, in four groups: General,
Passing, Receiving, Ball Carrier. Tight ends carry a fifth, Blocking, since
they are the only position here whose overall should turn on it — the group
is simply absent for everyone else, and their pages don't show it. A group
scores as the plain average of the attributes inside it; that is the number
beside each group on a player's page.

**A player's page shows only the groups their position is judged on**, under
the names that position uses: a quarterback gets General, Passing and
Carrying; a back gets General, Receiving and Carrying; a tight end gets
General, Catching, Blocking and Carrying. `EGE.positionGroups` decides what
is shown, separately from `EGE.positionWeights`, which decides what counts.

**The overall works the way Madden's does.** It is not an average of
everything on the page — under that, the only way to a 99 was a 99 in every
attribute, throw power included for a tight end. Instead each position names
its key attributes and how much each one matters (`EGE.positionWeights`, per
attribute), and nothing else counts at all. Those are averaged by weight,
and the average is stretched away from 50:

```
overall = 50 + 1.4 × (key-attribute average − 50), kept within 1-99
```

So a player whose key attributes are all in the 80s and 90s is a 99 — the
Madden 99 tight end this was checked against (99 catching and awareness,
high 80s speed and routes, blocking in the 60s, a 33 throw power) comes out
at exactly 99. A tight end's key attributes are his hands, routes, awareness
and athleticism, with blocking behind them; a quarterback's are his arm,
accuracy and awareness; a back's are his speed, vision and ball carrying,
with his hands counting for something since these are backs who catch.
The stretch lives in `EGE.overallScale`. Only QB, RB, WR and TE are
weighted; anything else falls back to `DEFAULT`, a little of everything.

The same attributes score very differently by position, which is the point:

| Isaac Vitel's ratings, scored as | Overall |
| --- | --- |
| QB | 59 |
| RB | 25 |
| WR | 17 |
| TBD | 31 |

Anything bought in the shop lands on top of these: `EGE.valuesFor` adds the
boosts to the base numbers before any group or overall is worked out, so a
purchase moves the rating the moment it is made.

**Moving to the Madden-style overall changed nobody's overall.** Scored the
new way, the ratings locked at the end of the 2018 season would have put
both quarterbacks at 74 and everyone else a few points up, so every
attribute a player has was scaled down by the same proportion — about 16%
for Isaac, 14% for Jaykeb, 3-7% for the rest — until each landed exactly
where they were:

| Player | Position | Overall |
| --- | --- | --- |
| Jaykeb Stewart | QB | 61 |
| Isaac Vitel | QB | 59 |
| Cooper Clark | RB | 56 |
| Andrew Parr | TE | 55 |
| Sam Stogsdill | RB | 54 |
| Paxon Hatch | TE | 51 |

Scaling rather than subtracting keeps each player's shape: strengths are
still strengths, and nothing that was low has been pushed to the floor.

---

## Discord scores bot

`bot/post-week.js` posts one week of the regular season to a Discord webhook,
four times a day, walking the season out slowly:

```
## Week Three
{one embed per player with a game that week}
```

The postseason counts from one again:

```
## Playoffs Week One
{one embed per player playing that week}
```

A college season heads it `## Postseason Week One`, since its weeks are
conference title games and bowls as much as playoff rounds, and each embed
names its game beside the opponent: `W 36-34 vs. Florida · SEC Championship`.

Which weeks those are is read off the games — `EGE.playoffWeeks` in
`data/games.js` is every week with a `playoff: true` game in it, and a week's
place in that list is its round. Nothing has to be told where the regular
season ends, and a season whose playoffs open at week 12 or week 15 names
itself correctly.

A player on a bye is left out, the same as a player with no game that week:
there is nothing to post about somebody who is not playing.

An embed reads top to bottom as:

| | |
| --- | --- |
| **Author** | the school, with its mark. Not a link — there is nothing on the site to send anybody to for a school |
| **Headline** | ``W `28-3` vs. Millbrook``, and the one link in the embed: the player's own page. The score is in backticks, so it sits in a box |
| **Block** | the whole stat line as a four-line grid, three numbers to a line, columns aligned |
| **Big plays** | a second block, only when the game has any: one `- ` line per play, typed in on the admin page |
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

Passing and receiving read as what he did with what he was given —
`9/18, 118YDS` and `5/9, 52YDS` are the same shape. Carrying has no attempts
to fall short of, so it says how many rather than how many of how many:
`19 CAR, 159YDS`. Nothing to report collapses to a nought rather than spelling
out zeroes. Every summary is set in a code span, so it sits in the same dark
box as the score.

The big plays are the game's `bigPlays` list from `stats/{year}.js`, typed in
one to a line in the season editor. They are word-wrapped to the block's
width with a hanging indent, so a long play stays readable as one play. At
most five go out, each cut at 100 characters, because Discord refuses a
message with more than 6000 characters of embed text in it.

The number is the field's name and the heading is its value, because Discord
draws a name above its value and the number is what should be read first.

A game that has not been played keeps the same shape: the kickoff, home or
away, and whether it is a conference game fill the three block lines, and the
three summaries show dashes.

A game the player missed hurt is marked in `stats/{year}.js` with
`injured: true` and what it was in `injury` — `injury: 'Bruised Shoulder'`.
Its embed keeps the headline (the matchup, or the score once it is played),
the spacer and the footer, and in place of the stat line and the three
summaries carries one line in red:

```ansi
[2;31mDNP Injured: Bruised Shoulder[0m
```

Discord only colours text in an `ansi` code block, and the colour is an
escape sequence (ESC, then `[2;31m` for red and `[0m` to stop), which is why
it looks like stray brackets anywhere else. On the site an injured game has
no stat line, so it counts toward the team's record but adds nothing to his
season totals or his credits.

### Every embed is the same height

A week of posts should read as a column, not a staircase, so the layout is
fixed rather than following the numbers:

- **The block is always four lines.** Three numbers to a line does it: a
  quarterback's twelve fill four rows exactly, and everybody else's eleven
  leave one gap on the last row. It used to be four numbers to a line, which
  fit on a wide screen, but the headshot takes a column out of the embed and
  a narrow window left the block about 33 characters — a busy game went past
  that, Discord wrapped the last cell of each row onto a line of its own, and
  the grid turned into a jumble. No line is ever wider than 30 characters now:
  two spaces between columns, one if that would be too wide, and none between
  a number and its label as a last resort.
- **There are always exactly three fields.** A fourth wraps onto a second row
  and makes that embed taller than the one above it, which is why credits
  earned are no longer among them.
- **Headings stay short.** A field column is about 95 pixels on a phone.
  `Touchdowns/Interceptions` measures 150, so the heading is
  `Touchdowns/INT`. The yardage keeps its `YDS` so there is no guessing which
  number is which; the very widest summaries (`24 CAR, 287YDS`) can still
  wrap in a field column on a narrow phone.

A game with big plays is taller than one without, by however many lines the
plays take — that is the point of them.

### And the same width

Discord sizes an embed to its widest content, so a quiet game came out
narrower than a busy one and the right-hand edge moved from post to post. Two
things hold it still:

- **Block lines are not padded any more.** They used to be padded out to 39
  characters, which was one more thing that could wrap on a narrow screen.
  The spacer image below already holds the width on its own.
- **A transparent spacer image, `icon/spacer.png`.** Discord scales an embed
  image down to the embed's maximum width, so one deliberately wider than any
  embed pins it to that maximum. It is 1600×2 and entirely transparent, 92
  bytes, and under a pixel tall once scaled.

There is no invisible *character* that does this job. A zero-width space is
zero wide by definition, and a braille blank — the usual suggestion — is a
character in a proportional font, so a run of them is only ever approximately
as wide as the next run. An image is measured.

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

Items with a picture name it as `icon`. The originals are in `icon/shop` at
1254px; the site loads 256px copies from `icon/shop/small`, about 115KB for
all six instead of 1.8MB.

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
inventory is what a player still has, not a receipt book. Workouts and rating
points are in the ratings for good once bought and have no switch; Intel and the
other non-workout items can still be turned off and on. A stat booster records
which attribute it was bought for.

On sale:

- **Performance boosters** — 2.5x (40), 2.0x (25), 1.5x (15). Regular season
  only, one use per purchase, and **five a season at most: two 2.5x, three
  2.0x and four 1.5x**. They are stickers: holographic, gold and silver
  sunbursts you stick on a game.
- **Rating points** — bought straight into an attribute, priced by how close
  that attribute already is to 99. Cheap early, dear late. A row of **sort
  buttons** sits above the table: best value (the default — overall gained per
  credit), most OVR impact, cheapest, most expensive, highest rating, lowest
  rating, group, and A–Z. A maxed attribute has no next point, so it sinks to
  the bottom of the price sorts.
- **Offseason training** — strength (8) or cardio (8), each with a downside
  rolled when you buy it, or overall (12) for a smaller gain spread wider with
  nothing to lose. Cheap to start and **twice the price every time you buy
  it**, so an offseason spent on one workout runs out of credits long before
  it runs out of attributes. See below.
- **QB Connection** (20, college and later) — **with a named quarterback**:
  the card has a drop-down of his team's quarterback room that season
  (`EGE.quarterbacksFor` — the real roster plus any of the six, never
  himself), and Buy waits until one is picked. The row is called *QB
  Connection — C.J. Stroud*, with the name in `target`, and the buy call
  refuses a name that is not in the room. A quarterback's O-Line Connection
  has nobody to pick. An admin granting one picks the quarterback too.
  In **Your Inventory** the connection shows the quarterback's headshot
  (`EGE.quarterbackPhoto` — one of the six's own, or ESPN's for a roster
  quarterback) and his name beside the icon. **Only an admin can turn it on or
  off** — when the quarterback is traded or retires, the admin switches it off
  on the admin page and it greys out with an *Off* flag on the player's page.
  The player gets no switch for it, `EGE.wallet.setActive` refuses, and a
  trigger in `supabase/schema.sql` (`guard_qb_connection_switch`) refuses the
  same change straight to the database — **re-run `supabase/schema.sql`** to
  install it.
  **Hyperbaric Chamber** (35, then 45, then 60, then
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
cost = 100 / (99 - rating + 1)
```

| Rating | 50 | 60 | 70 | 80 | 85 | 90 | 95 | 97 | 98 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Next point | 2 | 3 | 4 | 5 | 7 | 10 | 20 | 34 | 50 |

**The general attributes are not for sale.** Speed, strength, stamina,
awareness and the rest move only through offseason training, which is what
keeps training worth a slot in the shop. A quarterback is left with passing
and carrying to buy into; a tight end with catching, blocking and carrying.

Two or three credits while a player is young and unformed, fifty once they
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
player about four overall. It was 36 until the overall moved to key
attributes; a point in one of those is now worth about twice as much
overall, so it went to 100 to keep the same pace. A 90-credit offseason, 20
of it on Overall Training and the rest taken from the top of the table:

| Player | Position | Gain |
| --- | --- | --- |
| Andrew Parr | TE | +4 |
| Cooper Clark | RB | +3 |
| Paxon Hatch | TE | +4 |
| Isaac Vitel | QB | +4 |
| Sam Stogsdill | RB | +4 |
| Jaykeb Stewart | QB | +4 |
| | | **+3.83 average** |

Skipping training and putting all 90 into points comes out at +4.33, so the
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

**Five a season.** No more than five stickers go on one season's games, and
no more than two 2.5x, three 2.0x and four 1.5x of them
(`boosterSeasonLimit` and each booster's `seasonLimit` in `data/shop.js`).
What counts is what is on the season's games — still in Supabase, or
written into the season file once the week was out. The drawer says how
many of the five are on games and how many of each kind are left, and greys
out a kind the season is full of; peeling one off an unplayed game frees its
place. `applyBooster` reloads the stickers and checks before it sticks one
on, and a trigger on `game_boosters` in `supabase/schema.sql` refuses the
row as well, for anything that skips the page. Buying is not capped: an
unused booster carries over.

**Nothing goes on a playoff game.** A booster is what you spend a limited
drawer on across a regular season you can see all of; the postseason is not
planned, it is whatever the bracket hands you. A game with `playoff: true`
grows no +, the drawer never opens on it, and `applyBooster` in `js/wallet.js`
refuses the week even if it is called directly.

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

| Item | Effect | Risk | From |
| --- | --- | --- | --- |
| Strength Training | Strength +4, and toughness, injury and jumping +2 each | agility, stamina, speed −2 each | 8 |
| Cardio Training | Speed, acceleration, agility, stamina +2 | strength −2 | 16 |
| Overall Training | Speed, acceleration, strength, agility, jumping, stamina +1 | none | 20 |

Risks are rolled once, when the item is bought, and the result is stored on
the row. Reloading the page never re-rolls it.

**The price doubles every time.** A workout carries `creditsStack: 2` in
`data/shop.js`, and `EGE.priceFor(item, owned)` multiplies its base price by
that for each one already on the books — strength runs 8, 16, 32, 64, 128.
A 60-credit offseason buys three of them — 8 + 16 + 32 = 56 — and the fourth
is 64 on its own. That is the point: the cheap first block makes training
worth doing, and the doubling makes spending a whole offseason on one
attribute a choice rather than the obvious move.

The two that specialise both carry a risk. Overall Training spreads the
same idea across six attributes, has nothing to lose, and costs the most
for it.

**Prices follow what a workout does to the overall.** Since the overall
moved to key attributes, speed, acceleration and agility count for a lot
more and strength, toughness and injury for less. Cardio went from 8 to 16
and Overall Training from 12 to 20, which keeps what a credit buys in
overall about where it was: on average across the six players, one Cardio
block is worth about 0.45 overall (0.22 before) and one Overall Training
block about 0.29 (0.17 before). Strength Training stays at 8. It is worth
less overall than it was (about 0.12), but what it buys in toughness and
injury matters outside the number.

`owned` is counted from the inventory rows, so the reset is the one that
already exists: **Clear the shop rows** at the end of a season deletes every
`train-%` row once the workouts have been folded into `data/ratings.js`, and
the next offseason starts at the bottom of the ladder again.

The price is worked out in `js/wallet.js` from what the server holds rather
than from what the page says, the same as every other price here — the page
is showing it, not deciding it.

### Everything carries over

Unused performance boosters and unspent credits carry into the next season —
nobody loses what they paid for. Rating points and offseason training do not
carry as *rows*, because at the end of a season they are folded into
`data/ratings.js` and become the player's actual numbers. Intel lapses at the
end of the season it was bought for.

A performance booster is **used on the player page**, by putting it on a game
from your own schedule. There is no Use button in the shop: spending one there
never said which game it was for.

A quarterback's **QB Connection** reads **O-Line Connection** — he spends the
offseason with his offensive line, and better chemistry means a lower chance of
being sacked. Either way it cannot be bought until college.

**What a player owns** sits on one line under *Applied to your ratings*: the
boosters as their stickers, then everything else as its icon from `icon/shop`,
each with how many are held boxed on its corner (`3X`). A workout bought more
than once is one icon with its count. Intel is its own switch — tap it to turn
it on or off, and it greys out with an OFF tag while off.

**Offseason training** sits in the Rating Points panel, under the points table,
rather than in a panel of its own.

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

Nobody hands credits out by hand for a good game. Every game pays for its
**fantasy points** the moment the week is published, so a big night without a
touchdown still pays. The scoring is standard half PPR:

| | |
| --- | --- |
| Passing | 1 per 25 yards, 4 per touchdown, −2 per interception |
| Rushing | 1 per 10 yards, 6 per touchdown |
| Receiving | 1 per 10 yards, 6 per touchdown, 0.5 per catch |
| Fumble lost | −2 |

Each position keeps a share of its points, because they do not score alike —
a strong tight end game is about 22 points, a strong back or quarterback game
about 31:

| Position | Credits per fantasy point | A breakout game pays |
| --- | --- | --- |
| QB | 0.55 | 15 |
| RB | 0.50 | 15 |
| TE, WR | 0.75 | 15 |

The shares are worked out from the 2018 season's 72 stat lines, not picked.
They make a breakout game (the average of each position's 75th and 90th
percentile) pay the same 15 credits for every position. One scale over all
three then makes a whole season pay what touchdowns used to (757 credits
across the six against 745), so no shop price needed to change. Re-scored this
way, 2018 would have paid 90–173 a player instead of 70–165, and no game would
have paid nothing.

Credits are **always rounded up** — there is no half a credit — and a game
played never pays less than 1.

**2018 stays on touchdowns.** It was paid as it went, 10 a touchdown for a
back or tight end and 5 for a quarterback, and the ledger tops up any award
that has grown, so re-scoring it would pay every player a second time for a
season already settled. Fantasy scoring starts with 2019
(`EGE.economy.FANTASY_FROM`). The award key is still `td-w{week}` for both
systems, because that is the key the database already accepts from a
player's own browser, so the change needed nothing in Supabase.

On top of that, every season after the first pays the flat **60** offseason
allowance on the way into it. The first season pays nothing: everybody starts
on zero and earns the first 60 by getting through a season.

**How it stays right.** What a player is owed is worked out from the schedule
every time they open the site, and each award carries a key for what earned it
— `td-w4`, `offseason-2019`. Those keys are unique per player per season in
`credit_awards`, and `pay_credit_awards()` inserts the new ones and moves the
balance **in one transaction**, so paying on every page load is both safe and
the whole point. Post a result and the player is that game's credits better
off the next time he looks. Reload all day and he is still only that much
better off.

A player with no sign-in yet still scores: the admin page shows what they are
owed as *waiting*, and it lands in full the first time they log in.

**Correcting a week.** Change a stat line in `stats/{year}.js`, commit, and
the credits follow: an award already on the ledger that is now worth more pays
the difference and nothing more, so the same week can be settled as often as
you like. It reaches a player the next time they open the site, and **Pay
credits** on the admin page pushes it to everyone at once without republishing
anything — which is what that button is for once every week is already out.

The one thing it will not do is take credits back. An award that is now worth
*less* than what was paid stays paid, because the player may well have spent
it; lowering a published number means adjusting that balance by hand on the
admin page. Weeks that have not been published yet have nothing on the ledger,
so changing those is free.

> The credits come from the browser, because what a touchdown is worth is
> worked out from `stats/{year}.js` and Postgres has no copy of it. A player
> could already set their own balance directly — buying things needs that — so
> this is not a new hole, but the easy half of it is closed: for anyone who is
> not an admin, an award has to look like one of the two kinds the site issues
> and cannot be worth more than either honestly could be.

---

## Cards

A tab of its own, at `#cards`, beside the shop and **visible only to a
signed-in player**. It is a collectible card game that sits next to the
simulation rather than in it: nothing on it changes a rating, a stat line, a
result or what a game pays. A player who never opens a pack is not behind
anybody at anything. The offseason has the shop; this is something to do
while the weeks are going out.

The catalogue, the grading, the packs and the library are in
`data/cards.js`; the Supabase side is `js/cards.js`; the tab is
`js/cards-view.js`.

### Where the cards come from

The season files. Every game with a stat line is a **performance card**, and
every line in its `bigPlays` is a **play card**, so publishing a week puts that
week's cards into the packs and nothing is drawn up by hand. A week that is
not published is in no pack. A game a player was hurt for, or one where his
line is nothing but zeros (Isaac's redshirt year), makes no card.

A card's id names the game it is, and that is all the database stores:

```
p:2021:sam-stogsdill:5        Sam's week 5 game in 2021
h:2021:sam-stogsdill:5:0      the first of that game's big plays
```

Correct a stat line and the card corrects with it. Reordering a game's
`bigPlays` swaps its play cards round, so add new ones at the end.

### Grading

The number in a card's top right is its **fantasy score**, the same half-PPR
scoring a game is paid on. A play is scored as the one play: a 44 yard
receiving touchdown is 4.4 + 6 + 0.5 = 10.9.

The **rarity** comes from that score, graded against the position:

- A performance is graded on its fantasy points times the position's credit
  share (the number that makes a breakout game pay 15 credits whatever the
  position), so a tight end's big night is as rare as a quarterback's.
- A play is graded as though every play were carried or caught (yards / 10,
  +6 a touchdown, +0.5 a catch), so a 60 yard touchdown pass grades with a 60
  yard touchdown catch. Go-ahead and game-tying plays grade 1.5 higher,
  game-winning 3.

The thresholds were set from the 2018–2021 files so the catalogue is a
pyramid, and each rarity has its own pull odds:

| Rarity | Colour | Chance per card | Game from | Play from | In the files |
| --- | --- | --- | --- | --- | --- |
| Common | gray | 46.35% | — | — | 250 |
| Uncommon | green | 26% | 6.5 | 7.1 | 128 |
| Rare | orange | 14% | 11 | 8.6 | 102 |
| Epic | red | 8% | 16 | 9.6 | 58 |
| Legendary | purple | 4% | 20 | 11.1 | 37 |
| Mystic | gold | 1.6% | 24 | 12.1 | 29 |
| Iconic | pink | 0.05% | picked | picked | 3 |

**Iconic is picked by hand, not graded.** Grading stops at Mystic, and only
the moments in `ICONIC` at the top of `data/cards.js` are Iconic: Sam's five
touchdowns against Centennial (2019), Paxon's two touchdowns in the FCS
Championship (2020) and Cooper's 80 yard touchdown against Helix (2019). Add
an id there to make another. With three of them at 0.05% a card, about one
Base Pack in 670 has an Iconic in it.

From Rare up the frame catches the light: a still sheen on Rare, a moving one
on Epic and Legendary, gold foil on Mystic and holographic on Iconic, the
same foils as the booster stickers.

Across the bottom of the picture, a play card prints its yardage big (*44
YD TD*) and a performance card its yards and touchdowns (*312 YDS 5 TD*).

### Packs

| Pack | Credits | Cards | |
| --- | --- | --- | --- |
| Base | 5 | 3 | any season |
| Season | 6 | 3 | the live season only, the last card Uncommon or better |
| Pro | 10 | 5 | any season, the last card Rare or better |

Each card rolls its rarity on the odds first, then is drawn from every
published card of that rarity the pack can hold. A rarity with nothing out
yet falls to the nearest one below it. The Season Pack is the one that grows
a week at a time.

**Buy & Rip** rolls the cards, pays for them and opens the pack in one go:
the sealed pack comes up, a tap tears it open, the cards are dealt face down,
and each one turns over on a tap with a flash of its colour from Rare up.
Cards a player has never had before say *New*. Nothing from the pack shows
in the collection, the library or the counts until it is put away with
**Done**, so nothing behind it gives the pack away; a set's reward card works
the same way.

The price and size are charged by `open_card_pack()` in
`supabase/schema.sql`, not by the page. **Change both together.** Which cards
are in a pack the page decides, because the season files are not in
Postgres. That is the same trust the credit awards run on, with the easy half
closed the same way: a pack has to hold exactly its size of real-looking ids,
and it costs what it costs.

### The collection

Every card owned, rarest first by default, with how many of each (`×2`).
Filter by rarity, by kind and by player; sort by rarity, score, newest pull
or game. Three rows of cards show at a time and the rest scroll inside the
panel, so the page below is never far away. Tap a card to hold it up close
with the game it came from; the **→** button beside its stat line opens that
player's page on the card's season and picks the game out in the game log.
Duplicates are kept, and are what trades are made of.

### The library

Sets to put together, each claimed once. A set is a list of slots, each
wanting one card. No card fills two slots of the same set, but a card counts
toward every set it fits, and claiming uses nothing up.

| Set | Needs | Reward |
| --- | --- | --- |
| The EGE | a card of each of the six | Rare+ card · 3 credits |
| Bloomington Connection | 4 Isaac + 4 Paxon, 2018–19 | Rare+ card · 3 credits |
| Buckeye Backfield | 4 Sam + 4 Jaykeb, 2020 on | Rare+ card · 3 credits |
| Highlight Reel | 15 different play cards | Epic+ play card · 5 credits |
| Collector | one of every rarity | Legendary+ card · 10 credits · 1.5x Booster |
| Hall of Fame | 3 Legendary-or-better | Mystic+ card · 10 credits · 1.5x Booster |
| *Player* (×6) | 8 different cards of him | Rare+ card of him · 3 credits |
| *Year* Season (each season) | a performance card of everyone who played | Epic+ card from that year · 5 credits · 1.5x Booster |

**The rewards are kept small on purpose.** Measured by simulation with Base
Packs, a player gets back roughly 30–50% of what they spend on packs
(counting a booster at its 15-credit shop price), and the early sets come
first. Cards are a place to spend credits for fun, never a way to make them.
Rough cost of each set in Base Packs: The EGE about 25 credits, a
player or Highlight Reel 50–115, Hall of Fame about 75, a past season about
200, Collector about 2,400 (it needs one of the three Iconics, so it is
mostly finished by trading for one). The live
season's set is about 65 through
Season Packs.

**A reward booster is an ordinary booster.** It lands on the same stacked
inventory row a bought one does, and goes on games under the same
five-a-season trigger, so a full library never means more stickers on a
season than anybody else can have.

`claim_card_set()` in `supabase/schema.sql` pays the reward. It checks that
every card the set was completed with is really in the collection, that the
set has not been claimed before, and, for anybody but an admin, holds the
reward to 20 credits and the 1.5x.

### Trades

The Trades panel on the Cards tab. **Propose a trade** opens a builder: pick
who with, tap up to six of your cards to give and up to six of theirs you
want, and send it. Asking for nothing makes it a gift. Every signed-in player
can see every collection, so you can look through somebody's cards to choose
from them; signed out, nobody can.

Nothing moves until the other player accepts. Then both sides move in one
transaction, after a check that both of you still have what was put up. A
card can be in several offers at once, and only the first one accepted gets
it; the rest come back **Expired** when they are answered. The player who
offered can take an open offer back, and the other can decline it.

Offers waiting on a player show as a count on the Cards link in the nav, so
one does not sit unanswered because nobody opened the tab. Sets are still
claimed once per player, so cards passed around can help more than one
player finish a set.

`propose_card_trade()`, `respond_card_trade()` and `cancel_card_trade()` in
`supabase/schema.sql` do the work, and check that the cards are really
there, that only the player an offer is to can answer it, and that nobody
has more than ten offers out at once.

### The showcase

Up to five cards a player picks to show off, on their own player page under
the header. Anybody can see it, signed in or not. On your own page,
**Edit** turns each slot into Replace and Remove, and an empty slot into
**+ Add a card**, which opens your collection to pick from; **Save** puts it
up. Only cards you own can go up, and a card traded away comes down on its
own. A player with nothing up has no Showcase panel for anybody else.

### Admin controls

The Cards panel on the admin page shows every player's cards, different
cards, sets claimed, open trades and showcase, with two resets for one
player or for everybody:

- **Clear library** takes every card out of the collection, empties the
  showcase, cancels open trades and resets the goals, so the player starts
  the Library over from nothing. Credits stay spent.
- **Reset goals** only lets every Library set be claimed again. Cards are
  kept.

Rewards already paid stay paid either way.

Neither runs until RESET is typed, and neither can be undone. Both are
database functions that refuse anybody who is not in `admins`.

### In the database

`player_cards` (who owns which ids and how many, readable by any signed-in
player), `card_packs` (every pack opened and what was in it),
`card_set_claims`, `card_trades` (readable by the two players in it) and
`card_showcases` (public). None has an insert, update or delete policy:
cards only move through `open_card_pack()`, `claim_card_set()`, the trade
functions and the admin's two resets, each one transaction, so a pack is
never paid for without arriving, a trade never half happens and a reward is
never paid twice. The small helpers those share (`give_card`, `take_card`,
`give_booster`, `owns_cards`, `prune_showcase`) are taken back from the
browser's roles, since they do no checking of their own. **Re-run `supabase/schema.sql` after pulling this change**,
or the tab says it cannot load the cards.

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
good, so the row behind it can be cleared out of Supabase. `bigPlays` is an
optional list of strings, one per big play, shown under the stat line in the
Discord post.

`injured: true` marks a game the player sits out hurt, `injury` says what
with — 'Bruised Shoulder' — and `health` how healthy he is that week, 0 to
100. The Discord post shows DNP Injured in place of his stat line, and while
that week is the one being played his page carries the injury report.

`overtime: true` marks a game that went to overtime. The score stays the
final score; the flag adds `/OT` to the result on the site (`W 31–30/OT`) and
` (OT)` after the opponent in the Discord headline. It is a checkbox beside
the score in the season editor, and only written into the file when it is on.

Two more flags mark the postseason:

```js
{ week: 14, date: '2018-10-27', kickoff: '1:00pm',
  opponent: 'St. Charles North', home: true, conference: false, playoff: true,
  result: null, booster: null, stats: null },

{ week: 14, date: '2018-11-16', kickoff: null,
  opponent: null, home: false, conference: false, playoff: true, bye: true,
  result: null, booster: null, stats: null },
```

`playoff: true` is listed with two asterisks and takes no booster. `bye: true`
is a round drawn into the schedule that is not played at all — no opponent, no
kickoff, no stat line, and nothing for the editor to ask for.

The postseason is one week whatever the calendar says. Five schools in four
states play their first round across three different Saturdays, and a week is
the bucket the admin publishes, not a row on a calendar — so every playoff
game is week 14, and the schedule draws a dotted rule above the first of
them.

### The rest of the draw

A thirty-two-team bracket is thirty-one games. The ones a player's own school
plays are up in `games`; every other one lives in a `playoffs` block in the
same file:

```js
playoffs: {
  normal: [
    /* first round */
    { week: 14, results: [
      /* the left half, top to bottom */
      ['Rockford East', 24, 7],                   /* Simeon */
      ...
      /* then the right half */
      ...
      null,          /* Normal Community v St. Charles North — his own */
    ] },
    /* second round */
    { week: 15, results: [] },
    ...
  ],
  ...
}
```

One entry per bracket, keyed the way that season's draws are keyed in
`data/brackets.js`. Each is a list of rounds, as many as the draw has plus
the final; each round is the week it is played in and one result per
matchup, in the order the bracket draws them — the whole left half top to
bottom, then the whole right half. A result is `[winner, winner's score,
loser's score]`, and the winner is named rather than pointed at so a line can
be read and changed without counting boxes.

`null` means the site works it out. Two cases: a bye, which advances on its
own, and the one matchup his own school is in — that is a game in the same
file with a stat line on it, and a bracket that could disagree with the
schedule about whether he won is worse than no bracket. Change that game's
score and the draw changes with it.

A team that went through without a game is `[winner, null, null]` — North
Carolina's Garner in 2019, drawn against a 3 seed the bracket never filled
and printed as TBA. It advances like any winner and is drawn with no score.

**A round is drawn once its week is published.** Nothing in the bracket is
settled before then, the same rule the schedule, the record and the credits
already follow — so the draw can never be ahead of what the admin has put out.
Publishing week 14 fills the first round in *and* stands the second round up
with the teams that won it, because round two's matchups are round one's
winners. Fill a later round in and publish its week, and it moves on again.

To change who goes through, edit one line. To change how his own school did,
edit his game up in `games`.

The draws themselves — the seeds and the first-round matchups — are in
`data/brackets.js` under their season, `EGE.brackets[2019]` beside
`EGE.brackets[2018]`, so a new year's brackets go in next to the old ones and
the season switcher still shows 2018's draw when you look back at 2018. A
school with no entry for a season (Bloomington in 2019, Carlsbad in 2018) has
no Tournament switch that season.

A new season is a new file and one more year in the `SEASONS` list at the top
of `js/site-data.js`. The bot finds them on its own. A season's file can go in
before the season is live: the site shows seasons up to `EGE.currentSeason`
and no further, so a file for next year waits, editable from the admin page,
until the season is rolled over.

**2020** is the first college season, laid out from each school's real 2020
schedule as it was announced before COVID-19 rewrote it — the non-conference
games included, and USC and Alabama opening against each other in Arlington.
Kickoff times had mostly not been set by then, so they are null (a dash on the
page) until they are filled in. A game at a neutral site carries
`neutral: true` and reads as vs.

**2021** is set up and waiting: `stats/2021.js` holds every regular-season
game each school really played in 2021, with dates and kickoffs where it is
played, and no results yet — Isaac's opens in **week 0**, Illinois and
Nebraska on August 28, the Saturday before Labor Day weekend. It was written
by `node tools/build-season.js 2021`, which reads the schedules from ESPN
and saves through the same code as the season editor; it refuses to write
over a file that is already there. Conference title games, bowls and
playoffs are not in it — those go in once the regular season is played — and
no game is marked for scouts yet. The year is in `SEASONS` in
`js/site-data.js`, so the admin can edit and publish it now; it shows to
everybody once **Roll the season over** points `data/season.js` at it.
Rosters (`data/rosters.js`), defense grades (`data/defenses.js`) and the
conference races (`data/conferences.js`) all have 2021 in already.

### Conference standings

The Conference line on a college season's header is the team's place in its
division — **2ND in Big Ten East** — as of the weeks published so far, so it
moves the way the record does. Only the six's schools are in the season
files, so the rest of each conference is in `data/conferences.js`: a whole
conference schedule for everybody else, built around the fixtures already in
`stats/2020.js` and following each league's real shape (every division
rival; the Big Ten's three crossovers with Indiana-Purdue locked; the SEC's
permanent and rotating crossovers; four of six across the Pac-12 with the
California schools always meeting; eight of ten in the Valley), with the
rivalry games on their usual weekends.

Those games are played out from the strength each school actually showed in
2020 — points scored and allowed a game in the real final standings — with
seeded dice, and of the first four thousand seeds the one kept for each
conference is the one whose final table comes closest to how those schools
really finished. A game in there counts once its week is published. The six's
own conference games are read from the season file as they are published, so
a result corrected in the editor moves the standings with it.

A division is ordered by conference winning percentage, then wins, then
losses, then head to head among the schools still level, then conference
point differential. The line reads TBD until the team has played a
conference game.

A real season (2021) also lists every school's games outside its league in
`nonConference`, as they really finished, which is what the standings'
overall record counts alongside the conference games. A game against one of
the six's schools is left out of that list — Oregon's at Ohio State is in
the season file, played out — and read from the season file instead. 2020's
races are drawn, with no outside games to count, so its standings have no
Ovr column.

`node tools/build-conferences.js {year}` writes one season's block of the
file and leaves every other season's exactly as it was. Run it again only
if a fixture changes. 2020 is *drawn*: the real 2020 was cut short, so a
schedule is made up in each league's shape, as above. 2021 is *real*: the
season was played in full, so its conference schedules are read from ESPN
as they were played, and only the scores are played out, from each school's
real 2021 points for and against, with the seed judged against its real
2021 conference record. A new season goes in `SEASONS` at the top of the
script, usually as another real one.

### The file is the season

Nothing is logged anywhere else. There is no stats table in Supabase — the
tables there are accounts, admins, balances, inventory, stickers, the credit
ledger and which weeks are out, and not one of them holds a number from a
game. Change a touchdown in `stats/{year}.js` and the schedule, the record,
the game log, the season totals, the ratings the shop is priced against, the
Discord post and the credits that touchdown is worth all move with it, because
every one of them reads that file and only that file.

Which only holds if the browser reads the file rather than its own copy of it.
A static host serves everything with a cache lifetime — GitHub Pages sends
`max-age=600` — and for those ten minutes a browser that has been here before
answers from its own cache without asking. A committed correction is simply
not there yet, and pinned to a home screen it can hold on longer than that.

That was a real problem rather than a slow one, because the admin page pays
touchdown credits out of whatever *that* browser thinks the file says. Paying
a published week from a stale copy writes the old number into the ledger, and
the ledger never pays a number back down.

So the three files the admin page regenerates go through `js/site-data.js`
instead of `<script>` tags:

```
data/season.js      which season is live, and which are locked
data/ratings.js     the ratings a locked season baked in
stats/{year}.js     the season itself
```

It writes them out as `<script>` tags with a cache-busting query, which is a
different URL every load and therefore always a fetch.

Everything else — `index.html`, `js/app.js`, the stylesheets, `data/offers.js`
and the rest — is kept current by `sw.js`, a small service worker. It makes the
browser check every one of the site's own files with the server before using
its copy. An unchanged file costs a quick 304, and a changed one arrives new
the first time. It keeps no copies of its own, so it cannot go stale itself,
and it leaves other sites' files (Supabase, the fonts) alone. The header of
`sw.js` says how to take it out if that is ever wanted: deleting the file is
not enough.

A page that is already open is a different problem: a phone does not reload a
tab it put away, or the home-screen app when it is opened again. So coming
back to the page after 30 seconds or more asks Supabase for the published
weeks and the ratings again, and redraws in place, keeping your scroll
position, if anything changed.

**Why `document.write`, of all things.** Because these have to be in place
*before* `js/app.js` runs, exactly as they always were. `document.write` from
a parser-blocking script inserts them into the parse stream at that point, so
they execute in order and `js/app.js` still finds a fully loaded season the
moment it starts.

Fetching them instead and starting the app afterwards was the obvious move,
and it was wrong: **a deploy is not atomic in a browser.** `index.html` is
cached too, so for a while after a push a returning visitor runs one file old
and one new. An `app.js` that waits on a loader the cached `index.html` never
mentions dies on the spot, and so does a cached `app.js` that expects the
season to already be there. Keeping the contract synchronous is what makes
both halves of a half-applied deploy work — which is worth more than the
304s the fetch would have won.

The cost is that those three are re-downloaded rather than revalidated: about
45KB a load today. Opened from a `file://` path the query is left off, because
there is no cache to get past and a query on a file URL is a path that does
not exist.

Everything else — the code, the kit, the players, the shop — is still tagged
in `index.html` the ordinary way. Those only change when a deploy does.

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

Under the numbers is a **Big plays** box: type one play per line
(`44 yard receiving touchdown bomb`) and they are written into the game as
`bigPlays` and go out under the stat line in the Discord post. Blank lines
are dropped. Big plays are only saved on a game with a score in it.

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

The game log **sorts** on any of its columns: click a heading and the table
reorders on that stat, biggest first, because the question a stat table gets
asked is who had the best day. Click it again for smallest first, and a third
time to put the season back in the order it was played in. An arrow in the
heading says which way it is running, and the sorted column is shaded the
whole way down so the eye can follow it.

The season totals row is the season, so it stays the same line however the
games above it are ordered.

A **credits marker** on the row says what the game paid — visible to the
player and to an admin, nobody else, the same rule the boosters follow.

---

## The Admin Portal

`#admin`, a tab that only appears for an admin, and a page that refuses anyone
else. It holds everything Sam used to do from the shop page, plus the two
things that end a season.

**Accounts** — every balance and everything each player owns. Set a balance,
hand an item over without charging for it, remove anything, or pay an award off
the earnings table — a salary or an honour, which all stack. An award is added
straight onto the balance and not logged anywhere; the offseason 60 is not in
the list, because it pays itself.

**Cards** — who has how many cards, sets claimed, open trades and showcase,
and the two resets, **Clear library** and **Reset goals**, for one player or
everybody. See *Cards → Admin controls*.

**Credits Earned** — what the season has paid out so far, by player: the
touchdowns or fantasy points scored, what the games paid, and the allowance.
Awards handed out by hand are not counted.

**End of Season** — four steps, in this order, because the order is the only
thing keeping anybody's season safe:

1. **Lock the ratings.** Downloads a `data/ratings.js` with every rating point
   and every offseason workout bought that season folded into the base
   numbers. Only the numbers change: every comment, weight and helper in the
   file survives, because the file is read and its ratings block spliced
   rather than rebuilt. A player nobody spent anything on comes out byte for
   byte as they went in, so the diff is only the players who actually moved.
   Commit it, and the improvements are part of the site rather than part of a
   database. It can be downloaded again as often as needed, before or after
   the lock is committed and before or after the rows are cleared: while a
   locked season's rows are still there, `EGE.valuesFor` counts them from
   where the season started rather than on top of the locked numbers, so a
   second download is the same file — plus anything bought since — and the
   site never shows a purchase twice in the meantime.
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
bought since shows beside his overall on his own page as a ticker — **▲ +3** —
with the number he started at in the tooltip.

Once the season is locked those purchases are part of the base numbers, so the
lock also writes `EGE.ratingsSeasonStart` inside the markers: the attributes
that moved, at the values they started the season on. While that season is
still the live one the ticker measures from there; once the season rolls over
it is ignored, and the new season's ticker starts from the locked numbers.

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
  player actually plays with between games. The Cards tab is that: packs,
  a collection and a library of sets, built from the season files (see
  *Cards*).
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

- `tools/` — scripts run by hand, never by the site:
  `build-season.js {year}` writes a new season's fixtures into
  `stats/{year}.js` (week numbers from `calendar.js`, shared with the
  conference races), `build-conferences.js {year}` writes that season into
  `data/conferences.js`, `build-logos.js`
  writes `data/logos.js`, `build-defenses.js` writes `data/defenses.js` and
  `build-rosters.js` writes `data/rosters.js`. `node tools/<name>.js` from
  the repository root. The last two read a few thousand ESPN (and, for the
  rosters, 247Sports) pages through `tools/espn.js`, which fetches them in
  parallel with curl and caches them in the system temp folder, so a second
  run takes seconds.
- `bot/` — the Discord scores bot (see below).
- `supabase/schema.sql` — every table and policy: accounts, credits,
  inventory, admins, the stickers stuck on games (and the trigger holding
  them to five a season), the credit awards a season pays out, which
  weeks are published, and the card collection. **Re-run it after pulling
  this change** so the card tables and functions are in the database.
- `js/discord-config.js` — the channel webhook URL, if you are happy for it to
  be public. Blank by default.
- `supabase/functions/post-week/` — the other way: an edge function that holds
  the webhook URL, so the browser never has to. Run it in the Supabase SQL editor; it is safe to run
  again, and it must be re-run after pulling a change that adds a table.
- `js/supabase-config.js` — your Supabase URL and anon key. Blank by default.
- `data/shop.js` — the shop catalogue: credit earnings and everything on sale.
- `data/cards.js` — the card game: what a card is, how it is graded, the
  rarities and their odds, the packs, and the library's sets. See *Cards*.
- `js/cards.js` — the card collection in Supabase: owned cards, set claims,
  opening a pack and claiming a set.
- `js/cards-view.js` — the Cards tab: packs, the rip, the collection, trades
  and the library.
- `js/showcase.js` — the showcase on a player page, and editing your own.
- `js/cards-admin.js` — the Cards panel on the admin page and its two resets.
- `data/economy.js` — every number about credits in one place: what a rating
  point costs, how much overall a point is worth, what a touchdown pays, and
  the tuning behind all of it. Nothing else in the site invents a price.
- `data/season.js` — which season is live, and which seasons have had their
  ratings locked. Small on purpose: the admin portal rewrites this whole file
  when a season is rolled over.
- `stats/{year}.js` — one per season: every fixture, and the score, stat line
  and booster for each once it has been played. Nothing else holds a schedule,
  and nothing else holds a stat.
- `js/site-data.js` — the list of seasons, and the tags it writes for the
  three files the admin regenerates, cache-busted so a committed correction is
  on the site rather than ten minutes behind it.
- `sw.js` — a service worker that makes the browser check every one of the
  site's own files with the server on each load, so a push is on the site the
  next time it is opened rather than ten minutes later.
- `data/games.js` — how everything else gets at those games, and the one place
  that decides what "played" means.
- `data/offers.js` — who has offered whom, each school's sticker colour
  and mark, and each player's recruiting stars, 247 rating and state rank. Adding a key to a player's list puts the sticker on his header.
- `data/brackets.js` — the playoff bracket each school is in, a season at a
  time, as the field was drawn: every first-round matchup and seed, and
  nothing else. No results — those live in `stats/{year}.js` like any other
  game. It also holds `EGE.bracketState`, which is how far the draw has got
  given what has been published, sized off the draw itself so a four-team
  section final works the same way as a thirty-two-team state bracket. The
  draws are keyed by season, `EGE.brackets[year]`; a season with nothing
  written in has no brackets, and a school with no entry for a season has no
  Tournament switch that season.
- `data/conferences.js` — every conference game of a college season that
  none of the six is in, played out, keyed by season and conference, with
  each conference's divisions. Written by `tools/build-conferences.js`
  rather than by hand. See *Conference standings*.
- `data/logos.js` — every college team ESPN carries (about 770, every
  division) against the id ESPN files its logo under, keyed by the name the
  season files use, and `EGE.logoFor(name)`, which turns one into an image
  address on ESPN's server. Written by `tools/build-logos.js`.
- `data/defenses.js` — every FBS and FCS school's rushing and passing yards
  allowed a game, by season, and where each ranks at its level. Written by
  `tools/build-defenses.js` from ESPN's box scores; add the new year to its
  `SEASONS` and run it again when a season starts. The schedule's ODEF
  grade is read from it.
- `data/rosters.js` — the quarterbacks, backs, receivers and tight ends on
  each of the six's colleges, by season, each with his class, overall, ESPN
  id and whether ESPN has his headshot. Written by `tools/build-rosters.js`
  from ESPN's rosters, game logs and season leaders, and the 247Sports
  Composite (through `tools/recruiting.js`); add the year to its `SEASONS`
  and run it again for a new season. Hand edits are fine — a walk-on nobody
  wants in the QB Connection list can be deleted — until the next run.
  Real players who do not go to these schools in this simulation are in
  `NOT_HERE` at the top of the tool and are left off every roster: C.J.
  Stroud, TreVeyon Henderson and Keaontay Ingram, whose timelines changed.
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
ES modules so the site also works straight off the filesystem — including the
three that `js/site-data.js` writes out, which drop their cache-busting query
when there is no cache to get past. The only external dependency is supabase-js,
loaded from a CDN.

The live site is on Vercel, which deploys `main` on every push and builds a
preview for every pull request. If a merge does not show up on the site within
a minute or so, Vercel did not hear about the push: redeploy the latest `main`
from the project's Deployments page, or push to `main` again.

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

### On a phone

Most of it is read on an iPhone, so the layout answers to one. The width was
already fine; what was not:

- **Safari was zooming the whole page out.** A `<select>` is as wide as its
  longest option, and at a tappable font size a name that long
  is wider than the screen — the page came to 435 points on a 390 point phone,
  and Safari's answer to that is to shrink everything to fit. That is most of
  what "it looks tiny on my phone" turns out to be.
- **Safari was zooming *in* on every form field.** iOS zooms when you focus a
  control whose text is under 16px and does not zoom back out. Every control
  here was 13 or 14.
- **The tables hid the point.** The schedule scrolled the *result* off the
  right; the shop scrolled the *buy buttons* off. Under 620px each row becomes
  a block instead — same markup, same cells, only the layout changes — so what
  you came to see is under your thumb.
- **Tap targets.** Apple asks for 44 points square. The buy buttons were 33
  tall, the admin's publish buttons 30, and the arrow that folds a panel away
  is held to 44 square.
- **Nothing hover-only.** A finger cannot hover, so the cross that means "tap
  to peel this booster off" never appeared at all and an applied sticker
  looked stuck.
- **The notch.** `viewport-fit=cover` with `env(safe-area-inset-*)`, and
  `100dvh` rather than `100vh`, which on iOS is the window with the toolbars
  hidden.
- **The type was laptop-sized.** Every size on the site is set in `rem`, and
  the root size is one fluid value: `clamp(13px, 1.15vw + 8.87px, 16px)`. At
  620 points and up it is 16 and nothing has changed; below that it eases down
  to 13 on the narrowest phone. No breakpoint fires and nothing is
  repositioned — the words simply stop taking room the layout needed.

  Two floors stop it going too far: `--fb-label` holds a small-caps label at
  11px and `--fb-small` holds small print at 11.5, both with `max()`, which is
  a no-op at the full root size. The one absolute pixel size left is the 16px
  on form controls, which is Safari's zoom threshold rather than a size the
  design gets to choose.

  The kit's own type is in pixels and `style.css` is not edited, so the sizes
  this site uses are restated in `rem` at the top of `site.css` — each one the
  kit's own number over 16.

The roster turns sideways too — six portrait cards was six screens of
scrolling before anybody had picked anyone, and it is two now. The player
header rearranges: the picture and the name share the top line, and the four
facts about the season drop under both and run the full width rather than
being squeezed into what the name left of a 390 point screen.

Everything else is behind `max-width: 620px` or `hover: none`, so the desktop
layout is untouched; that is checked as well as the phone one.

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
11. **Extra interactive layer** — the Cards tab: packs, a collection and a
    library of sets, built from the season files. ✅ See *Cards*.

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
- Which attribute Block Power raises: run block power, pass block power, or
  both.
- Whether workout and overall changes persist per browser (`localStorage`) or in
  Supabase. Read-only season data stays in the `data/*.js` files either way.
