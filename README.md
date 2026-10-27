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

| Player | High school (2018–19) | League | College (2020–) | Conference | NFL (2023–) | Position | Plays like |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Andrew Parr | Wake Forest High School | Northern 4A | Alabama (2020–22) | SEC | Detroit Lions, NFC North (No. 18) | TE | a complete tight end |
| Cooper Clark | Carlsbad High School | Avocado League | USC | Pac-12 | — | RB | a receiving back |
| Paxon Hatch | Bloomington High School | Big Twelve | North Dakota State (2020–21), North Carolina (2022–) | Missouri Valley, then ACC | — | WR (TE through 2019) | a full-time receiver |
| Isaac Vitel | Bloomington High School | Big Twelve | Illinois (2020–21), Texas (2022–) | Big Ten, then Big 12 | — | QB | a deep thrower |
| Sam Stogsdill | Normal Community High School | Big Twelve | Ohio State (2020–22) | Big Ten | Seattle Seahawks, NFC West (No. 52) | RB | a power back |
| Jaykeb Stewart | Naples High School | 6A District 12 | Ohio State (2020–22) | Big Ten | Houston Texans, AFC South (No. 2) | QB | a pocket passer |

**Isaac and Paxon were high school teammates**, which the data has to respect:
they played the same fixtures, carried the same scorelines, and every ball
Paxon caught was one Isaac threw. His completions, attempts, yards and
touchdowns each start at Paxon's and go up from there. In college they split
up, and **Sam and Jaykeb become teammates** at Ohio State instead — the same
rule holds for them from 2020.

A player's school is `team` (the high school) and `college` in
`data/players.js`, both keys into `EGE.teams`; `EGE.teamFor(player, season)`
picks one by the season's tier on the ladder, so a 2019 page still says Wake
Forest High School after Andrew has gone to Alabama. A transfer is
`transfers`, the school he moved to keyed by the season he got there —
Isaac's `{ 2022: 'texas' }`, Paxon's `{ 2022: 'northCarolina' }` — so his
2021 page still says Illinois or North Dakota State.

**Being drafted is a transfer too**, to an NFL team: Sam's
`{ 2023: 'seattle' }`, Andrew's `{ 2023: 'detroit' }`, Jaykeb's
`{ 2023: 'houston' }`. Those three teams carry `tier: 'nfl'` in
`EGE.teams`, and that is what puts a player in the NFL for a season:
`EGE.tierFor(season, player)` says `'nfl'` for him even though the ladder's
2023 is a college season, because Paxon, Cooper and Isaac are still in
college that year. `EGE.leagueOf(player, season)` turns that into the
league his week goes out with, `'nfl'` or `'college'`, and
`EGE.levelFor(player, season)` into the words on his page, *NFL* or
*College Football*. Sam and Jaykeb are no longer teammates from 2023, and
the shared-fixture rule stops with them. The 2024 draft does the same for
the other three: Cooper's `{ 2024: 'chicago' }`, Paxon's
`{ 2024: 'newYorkGiants' }` and Isaac's `{ 2024: 'tampaBay' }`.

Everything marked TBD is genuinely unknown right now and should stay TBD in code
and data until it is confirmed — no placeholder guesses that later read as facts.

Headshots live in `headshot/`, keyed by last name: `parr.png`, `clark.png`,
`hatch.png`, `vitel.png`, `stogsdill.png`, `stewart.png`. Replacing one under the
same name? Change `EGE.headshotVersion` in `data/players.js` as well: Discord
keeps its own copy of any image a post links to and goes by the address, so
the Discord posts only pick up a new picture once that version (on the end of
the address) changes. School marks live in
`icon/`, keyed by school: `carlsbad.png`, `bloomington.png`, `normal.png`,
`naples.png`, `wake.png`. The colleges use the marks in `icon/offers/`, cut
down to 160 pixels on their long side so a page of them loads fast. A team without a mark renders its school line
without it.

---

## Timeline

Nine seasons, one per simulated year. This ladder is official — schedule and stat
data is authored per season below.

| Season | Level | Class |
| --- | --- | --- |
| 2018 | High school varsity | Junior year |
| 2019 | High school varsity | Senior year |
| 2020 | College football | Freshman year |
| 2021 | College football | Sophomore year |
| 2022 | College football | Junior year |
| 2023 | NFL & college football | Rookie year (NFL), senior year (college) |
| 2024 | NFL | Second year (Sam, Andrew, Jaykeb), rookie year (Paxon, Cooper, Isaac) |
| 2025 | NFL | Third year (Sam, Andrew, Jaykeb), second year (Paxon, Cooper, Isaac) |
| 2026 | NFL | Fourth year (Sam, Andrew, Jaykeb), third year (Paxon, Cooper, Isaac) |

The simulation opens on the **2018 junior-year high school season** — that is
what gets built first. High school graduation is spring 2020, after the 2019
senior season.

**NFL Draft.** The **2023 NFL Draft** is held the spring after the 2022
junior college season. Three seasons removed from a spring 2020 high school
graduation makes them draft-eligible, so declaring after junior year is the
canonical path. **Three declared**: Jaykeb went 2nd to Houston, Andrew 18th
to Detroit and Sam 52nd to Seattle. Paxon, Cooper and Isaac took the 2023
senior college season instead, which pushes them to the 2024 draft.

So **2023 is split**: half the six in the NFL and half in college, in the
same season. Each league keeps its own week numbers (the NFL's 1–18, with a
bye, the colleges' 0–13), its own standings, its own postseason and its own
Discord channel. In the NFL a player's class is how far into his career he
is, *Rookie Year* in 2023 (`EGE.nflYearFor`).

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
  (**★★★★☆ #1 RB in Illinois · #5 nationally**), from `EGE.recruiting` in `data/offers.js` — on the high school seasons only; a college season keeps the line's space empty, so nothing under it moves. Under that, four facts: **Position**, **Record**
  (the team's wins and losses over the season on show, 0-0 until the first
  result is out, followed by the current run — **6-1 · W4 Streak**, green for
  wins and red for losses — until the team's season is over), **Conference**
  and **Jersey**. In high school Conference is just the league's name
  (*Avocado League*); in college it is where the team stands in its
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
  orange strip at the top of the panel. **The overall** is on the right of
  the name and the facts, in its tier's box (see *Overall tiers* below)
  drawn big, and joined under it the way the height and weight hang off the
  picture — the same ink and orange — **This season**: a stock ticker, an
  arrow and the points the overall has climbed since the live season began.
  The pair runs the full height of the header. **The header is the same size in
  every season**, high school or college: the recruiting line's space is kept
  in college, both kinds of season have the four facts, the picture grows to
  meet the words beside it, and on a phone the orange strip holds one line. On a phone they are a band
  across the panel under the picture and the name, the overall on the left
  and the progression on the right. Both wait for
  the shop's boosts to land before they show. The college offers are no
  longer drawn on the header; who offered whom is still recorded in
  `data/offers.js`.
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
  played. An NFL opponent is its **city alone** — *Detroit*, *Kansas City*,
  *Tampa Bay* — with *NY Giants*, *NY Jets*, *LA Rams* and *LA Chargers*
  where a city has two teams (`EGE.nfl.city`, Sam, 2026-10-20), on the
  schedule and in the game log alike, and the mark and city are **a link to
  that team's page** for the season of the game. The link looks the same
  as the plain name until the pointer is on it, when it underlines in
  orange and shows the hand. No kickoff
  time: the file still carries it for the Discord post, but the page does
  not show it. The Credits and Booster columns are only drawn on your own
  schedule, or on anyone's for an admin. A silhouette marks a game scouts will attend,
  for a player holding Intel for that season. Postseason games are marked with
  two asterisks (a game's `name` in the file, SEC Championship or Rose
  Bowl, is not shown on the page), and a school in a bracket gets a **Games | Tournament** switch
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
  for Cooper or Sam, and a sieve an F. The colours are the player's, not
  the defense's (Sam, 2026-10-20): an A is the hard one to play and red, an
  F the soft one and green. In college the numbers are each school's real rushing and
  passing yards allowed a game that season, ranked among every school at its
  level (FBS against FBS, FCS against FCS), and a grade is a fifth of that
  list. The tooltip says the number, the yards a play and the rank. A school
  that barely played that season — UConn sat 2020 out, and the FCS played
  its 2020 in the spring, which ESPN does not carry — is graded on the season
  before, and says so. A season with no numbers yet borrows the latest ones,
  so a new season's schedule is graded the day its file goes in. High
  schools have no grade and no column. `EGE.defenseGrade` in
  `data/games.js`, from `data/defenses.js`.

  **An NFL defense is graded on its players** instead (Sam, 2026-10-20):
  the ratings in the sim's rosters of the defenders this player would see,
  ranked among the 32 for his position, a fifth of the league a letter. A
  back faces the sim's own run-defense sums (the tackles, linebackers and
  edge rushers on run defense, the safeties in the box, inside and out); a
  quarterback the pass rush, the blitzers and everybody in coverage; a
  receiver the corners and the deep safeties with some pass rush; a tight
  end the linebackers and safeties with some pass rush. Starters are the
  best healthy players at each spot, nickel. The tooltip says the rank.
  `EGE.nflRosters.defenseGrade` in `js/nfl-rosters.js`; the column waits
  for the rosters to load and the schedule is drawn again when they do.

  **Under an NFL player's next game** (Sam, 2026-10-20) is a **Scouting
  Report**: a strip in the colour of the team he is about to play, with
  its logo. First a ring filled as far as that defense's rating against
  what he does (Run Defense for a back, Pass Defense for everyone else,
  the same number the ODEF grade ranks, out of 99 like an overall), with
  where it ranks among the 32. Then the three best of the defenders he
  will face, each a small card with his picture, position, archetype and
  overall box that opens the same pop-up as the Teams page. They are
  picked from: a back's two tackles, two edge rushers, two linebackers
  and the box safety; a quarterback's whole nickel defense; a receiver's
  three corners and two safeties; a tight end's two edge rushers, two
  linebackers and two safeties. All are the healthy starters in the sim's
  rosters as they stand (`EGE.nflRosters.facing`). The live season only,
  and the next game, not the next week: a bye puts the report under the
  game after it. A heavy ink rule above the game and another under the
  report box the two in together. A hidden row after the report keeps the
  stripes on the games under it as they were.
- **Game log** — per-game stats for that player, with the stat lines driven by
  their position (see below), and a totals row for the season, on the
  panel's own cream under a hard rule.
- **Ratings** — two tiers, top to bottom (the overall is in the header):
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

- **Trophy case** — under the ratings, on every player page: a cabinet
  running the full width of its panel, drawn entirely in `site.css` with no
  image and in the site's colours, with no frame: the shelves stacked are
  the box (sand side walls, a dark field-green back, a sand shelf floor in
  perspective with an orange front lip). It holds the
  trophies in the optional `trophies` list on the player's entry in
  `data/players.js`, each `{ name, season, image, about, scale }` (`scale`
  stands a bigger honour taller than the rest on the shelf). One with an
  `image` (a picture under `icon/trophies/`)
  is shown as that picture (cut down to 720 pixels wide, so it holds up
  full screen); one without is a gold cup over a brass plate with its name
  and season. Pointing at a
  trophy lifts it to half again its size and shows a tag under it saying
  what it is, from `about` (a `\n` in it starts a second line, so
  Andrew's read *2018 North Carolina Class 4A Regional Champion* over
  *Wake Forest High School*). Clicking it, or tapping it on a phone, opens it
  up close in the card overlay (`EGE.cardsView.openOverlay`): the page
  blurred and darkened behind it, its name and season across the top, the
  × at the top right and the `about` line under it. A click or tap anywhere
  but the trophy itself, the × or Escape puts it away. A shelf
  holds as many as fit across it (eight on a computer, four on a phone) and
  a full shelf gets a new one under it; the shelves
  are dealt out again when the width changes. Andrew Parr has his 2018 and
  2019 North Carolina Class 4A Regional Champion plaques (Wake Forest High
  School), his 2019 Class 4A Regional Tournament MVP plaque and, a third
  again as tall, the 2020 College Football National
  Championship trophy (Alabama). Jaykeb Stewart has the 2019 Florida Class
  6A State Championship trophy (Naples High School), Paxon Hatch the 2020
  and 2021 FCS National Championship trophies (North Dakota State) and the
  2025 NFL Super Bowl trophy (New York Giants), all of them a third again
  as tall. Cooper Clark has the 2019 CIF San Diego Section Open Division
  Championship trophy (Carlsbad High School), a fifth again as tall, and
  his 2024 Offensive Rookie of the Year trophy (Chicago Bears), the
  tallest at nearly half again (Sam, 2026-10-23).
  A player with no trophies has no trophy case at all: the panel
  only shows once there is at least one.

The schedule, the game log, the ratings and the trophy case each fold away
behind an arrow in their heading.

The season shown is the live one. There is one season on the ladder so far, so
there is nothing to switch between; `shownSeason()` in `js/app.js` is the one
place that decides, and a way back to an older year is a change to it and
nothing else.

### Teams — `#teams`

A tab beside Players, public like the player pages, and laid out like
them. **College and the NFL** — the high schools are on the player pages.
In a season that has both (2023 on), **the NFL's teams come first**, then
a dotted line across the page (`.ege-teamgrid__divider`), then the
colleges, with no label on either (Sam took the NFL and NCAA chips off,
2026-10-17). A season with only one league has no line.

**The index, `#teams`**, is a stack of cards, one school to a row: its mark
on the left, on the school's own colour (`ground` in `EGE.teams` — Alabama
crimson with the A in white, USC cardinal (#9D2235), NDSU green, Illinois orange,
Ohio State white, Texas burnt orange with the longhorn in white, North
Carolina navy, the Seahawks navy, the Lions Honolulu blue and the Texans
deep steel blue, each NFL team's mark in its full colours with its white
edge, from `icon/nfl/` (drawn in white they were only silhouettes); the
team page's header uses the same), then its record and place in its division, the faces of the
six who play there, and *View team →*. On a wide screen those run across
the row — the name and record on the left, each of the six as a face with
his name beside it in a column of its own, so they line up from card to
card, and *View team →* on the right edge; narrower, they stack under the
name and the faces go without the names. Above them is a season switcher
across the full width of the page, as on a team's page — every college or
NFL season, with ‹ and ›, starting on the live one.

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
  overall, in the same tiered box as everywhere else (see *Overall tiers*).
  Four show and the rest fold away behind *N more*, but never past
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
  Stroud's 2021 an 82. The one exception is Bryce Young's 2022, set by
  hand to an 86 — the only overall on any roster above 84. The constants
  are at the top of `tools/build-rosters.js`.

  **An NFL team's roster** is the NFL sim's, not `data/rosters.js` (Sam,
  2026-10-19): `data/nfl-rosters.json`, which `node nfl-sim/sim.js export`
  writes, or whatever the admin page's NFL Sim tab last published to
  `nfl_sim_rosters` in Supabase — whichever was saved later for the season
  (`js/nfl-rosters.js`). An **Offense / Defense / Picks** switch at the top
  right of the panel, the same as the schedule's Games / Tournament, picks
  the side: quarterbacks, backs (a fullback with them), receivers, tight
  ends, the offensive line (tackles, guards and centers, its five starters
  showing) and the kickers (punters with them), two rooms a line (Sam,
  2026-10-22); or the defensive line (edge rushers and tackles),
  linebackers, cornerbacks and safeties; or the team's draft picks (below). **An admin also sees the team's offense and defense as two
  overalls**, *OFF* and *DEF* boxes in their tier's colours left of the
  switch (Sam, 2026-10-20): each the starters' overalls weighted by how
  much the spot matters (the quarterback a third of the offense; the
  corners, edge rushers and tackles most of the defense), worked out in the
  browser from the same rosters (`EGE.nflRosters.unitOveralls`). They are
  not the sim's own team ratings, which stay private, and nobody else sees
  them, nor does an admin in client viewer mode. Each box is the headshot and overall as before, and under
  the name **the archetype with his seasons in the league** in the class
  chip (**R** for a rookie), then **height · weight**, with **no number**.
  The six's boxes use their own overall, headshot and size from their
  pages. **Every box opens a pop-up**, in the overlay the cards and
  trophies use, with no title or close button over it (Sam, 2026-10-27): a band in the team's colour with the headshot, the team's
  mark straight on the colour behind him and set off to his right so it
  shows past his shoulder, the name, and his overall box at the right end
  where the mark used to be (Sam, 2026-10-26). The pop-up is 800px wide,
  the band taller, the overall a 112px square and the name bigger than
  they were (Sam, 2026-10-27). Behind them, the team's mark again in two
  tones, the band's colour and a fifth darker (a little lighter on a band
  too dark for darker to show), cut off top and bottom (Sam, 2026-10-21):
  each mark's own colours are split in two where they fall apart most
  (Otsu's method, a sliver such as the Bears' white rim set aside), the
  side covering more of the mark is drawn in the shade and the other left
  clear (`teamWash`, on a canvas), so the Bears' all-dark mark is a bear
  and not a few faint lines (2026-10-27). A wide mark runs off both ends
  of the band; one about as tall as it is wide is never more than two and
  a half times the band's height, so more of it shows. The headshot stands on the band's bottom edge and is sized
  so the top of the head just clears the top of the box, about 5% of the
  picture; every headshot is placed the same way, and shows the picture's
  whole width, shoulders and all (2026-10-27). The name is in the band's
  dead centre, first name over the rest on two lines, with the headshot,
  the mark and the overall smaller and out at the two ends to give it room
  (Sam, 2026-10-27); a name too long for its column is set smaller rather
  than broken inside a word (`fitName`). Under the band come college, draft
  (*2021 · R4 #112*), age, height and weight in a thin strip on the team's second colour
  (the Bears' orange; white for a free agent), the text white or dark to
  suit it, with no line between it and the band; then, on the cream, his
  seasons, his ratings and his contract, with only space between them, no
  titles or rules (Sam, 2026-10-27). His seasons are **a table like the game log**: the dark
  heading row, every heading a button that sorts it (biggest first, then
  turned round, then back to the order played), the sorted column shaded
  down to a **Career** line that adds them up (averages and the passer
  rating worked out again from the totals), with no hard lines round it
  or through it; it scrolls sideways on a phone. A line a season
  from 2025 on (Sam, 2026-10-26: the first season the sim kept everybody's
  numbers), oldest first: the mark of the team he finished it with, the
  season, his age, and his position's numbers (QB G, CMP%, YDS, TD, INT,
  RTG, RUYDS, RUTD; back G, CAR, RUYDS, RUAVG, RUTD, REC, REYDS, RETD;
  receiver and tight end G, TGT, REC, YDS, AVG, TD; defender G, TKL, SACK,
  INT, PD, FF, TD; kicker G, FG, FG%, XP, PTS; punter G, PUNTS, YDS, AVG;
  a lineman only his team and age). The playoffs count in the season. The lines come with the
  rosters (`seasons`, nfl-sim/lib/site.js `seasonLines`) and count only
  weeks out on the site: every week not published yet is taken off from
  the game log's box scores, and the rosters go out again when a week is
  published (the NFL Sim tab's Publish, the Weeks tab's when the sim is
  loaded, or an admin's visit to a team page when `linesThrough` is behind).
  The ratings are the archetype and his skills, best first; the contract
  is *$1.1M a year through 2024*, with any injury under it in red. One of the
  six's has a button through to his page. A click off the box or Escape
  closes it.
  Nothing private is in the rosters: no team ratings, no potential, nothing
  about how long a player will last. Since 2026-10-21 they carry every
  player, the linemen, kickers and punters too (the rooms show them since
  2026-10-22), and the
  salary cap for the season and the three after it (`caps`), for the line
  rating and the payroll below, each team's system (`systems`) and every
  player's fit (`fit`). Rosters published before then have none of it
  until they are published again, which an admin's visit to any NFL team
  page, in client viewer mode too, does once by itself
  (`EGE.nflSimAdmin.republish`).

  **Under the rooms, five ratings for everybody** (Sam, 2026-10-21), drawn
  the way the scouting report draws a defense: a ring filled to the
  rating, the number in it, and where it ranks in the NFL. The Offense side
  has **Offensive Line**, **Passing** and **Rushing**, the Defense side
  **Rush Defense** and **Pass Defense** (the scouting report's own two).
  Each is on the overall scale, worked out in the browser from the
  starters' ratings in the rosters (`EGE.nflRosters.ratings`): the line
  from its five starters' pass and run blocking; passing from the
  quarterback's throwing (45%), his targets (35%) and the pass protection
  (20%); rushing from the backs (45%), the run blocking (40%), the tight
  end's blocking and the quarterback's legs. They are not the sim's own
  team ratings, which stay private.

  **An injured player's box says so** beside his overall (Sam, 2026-10-21):
  a square as tall as the overall box, a dotted red edge, a light red
  wash behind (25%) and red words, **OUT** over the
  weeks he has left (**3 WK**), or **OUT SEASON** when he will not be back
  before the regular season ends (the Super Bowl, in the playoffs); the
  pop-up's Injury line says what it is and for how long. The six's come
  from the site's own injury report (`EGE.injuryFor`, so the week's
  publishing decides); everybody else's from the sim (`out` in the rosters:
  what, games left and the week he went down; a playoff injury carries
  its round's week, 19-22), held back from everybody, an admin too, until
  that week is published (Sam, 2026-10-27, `EGE.nflRosters.isOut`): the
  box, the pop-up's Injury line, and the starters behind a team's rings,
  the ODEF grades and the defenders a player will face.

  **Every NFL team has a page**, `#teams/kansas-city-chiefs`: its
  header (record, streak, place in the division), its roster and its
  payroll. Every NFL team's mark sits on its colour from `data/nfl.js`, the
  way the six's teams' do.

  **An admin edits the roster right there** (Sam, 2026-10-21), on the
  season the NFL sim is playing, once the page has loaded the sim's world
  (`EGE.nflSimAdmin.ready`). Under every room's worst player, a dashed **+** box opens a
  list of the free agents at that position (overall, age, what he asks) and
  **Sign** puts him on the team at his market pay. A pop-up has **Edit**
  for anybody but the six: overall, ceiling, archetype and every skill.
  New skills make the overall they average to unless an overall is given
  too; an overall alone moves every skill with it; an archetype picked by
  hand stays his (`archetypeSet`). The archetype is a name, and his skills
  decide how he plays. Each change saves the world and publishes the
  rosters again (`EGE.nflSimAdmin.change`, `lib/edits.js`). None of it shows
  in client viewer mode.

  **Above the roster, for everybody** (Sam, 2026-10-21): the team's
  **Offense** and **Defense**, each with stars for how well the team has
  built around it, and its **Status** (*Competing*, *Retooling*,
  *Rebuilding*, the sim's mode). **Fit is stars, 0–5 in halves**, in the
  site's orange: after each box's size line (and after the archetype in
  the pop-up), how well he fits the team's scheme on his side of the ball
  (`nfl-sim/lib/fit.js`). Everybody else's come from the published rosters
  (`systems`, and each player's `fit`); an admin's from the sim's world.
  The OFF/DEF overalls by the switch stay an admin's alone. For an admin
  the Offense and Defense are dropdowns, words for anybody else and in
  client viewer mode: a scheme picked is the team's from its next game,
  and it keeps it until its coaches are fired (`setScheme`). The + under a room lists the free
  agents at its positions, best first, each with his stars in the team's
  scheme and his own **Sign**. **Edit** takes his contract too (*$M a
  year*, *Through*: raise it, cut it, extend it) and has **Release**, asked
  twice; for one of the six, Edit is just his archetype and contract.
  **Find trades** looks at every other team for him — its schemes, its
  status and record, whether he would start there — and lists up to six
  that suit him better and can pay what his team asks (a spinner while it
  looks): the team, its status and record, his stars in its scheme, what
  his team gets (each player with his stars in his team's scheme), whom he
  would start over, and the cap after. Some have his team put in more
  with him, a player or pick the other team wants, so a bigger package
  comes out even: *Chargers also get*, each player with his stars in their
  scheme. **Refresh**, beside Find trades, asks for another set, leaving
  out the ones already shown where it can. **Make the
  trade**, **Propose**, or **Open in builder** (the NFL Sim tab's trade
  builder, filled in). The trade deadline holds as everywhere else.

  **Tendencies**, for an admin only and never in client viewer mode (Sam,
  2026-10-21), between the roster and the payroll on the season the sim is
  playing: what the sim reads off the team to call its plays (pass rate,
  play-action, outside runs, the share of designed runs its quarterback
  keeps, screens and short, intermediate and deep throws, how its targets
  split between receivers, tight ends and backs; on defense man, two high,
  blitz and men in the box), each on the league's range with the average
  marked, the team's place and its rank, and who gets the ball: carries and
  targets a game, **Expected** from the lineup now (the team played against
  every other team twice, nobody hurt, the six's connections counted) and
  as the season has gone (`nfl-sim/lib/tendencies.js`). From the sim's
  world, never from the published rosters.

  **Picks**, the switch's third side (Sam, 2026-10-22): every draft the
  sim has picks for, out to 2030 and on (`nfl-sim/lib/picks.js`), a line a
  year and a column a round. A pick the team owns is the mark of the team
  it came from in a white box, an orange edge when it traded for it, with
  its number on a tag once that draft's order is known; one it traded
  away is the mark of the team that has it now, faded in a dashed box.
  Everybody sees them, from the published rosters (`picks`); an admin's
  come from the sim's world and each opens a pop-up (a band in the colour
  of the team it came from, then the draft, round, number and whose it
  was) with **Find trades** and **Refresh**: the teams that would give the
  most for it, the same trades, buttons and builder as a player's. Rosters
  published before 2026-10-22 have no picks until an admin's visit
  publishes them again.

  **The page ends with the payroll**, for everybody (Sam, 2026-10-21):
  payroll, the salary cap and the cap space (in red, how far over), a bar,
  and **Contracts**, every player's with his overall (**OVR**, Sam 2026-10-22; one of the
  six's from his own page) and what he is paid this season and the next
  three (his yearly average while his deal runs), then the total, the cap
  and the space left for each year. Every heading sorts, as a game log's do.
  An admin's comes from the sim's world, with an **Edit** on every
  contract; everybody else's from the published rosters.

  **The NFL's marks are the site's own**, in `icon/nfl/`, from a set Sam
  sent (2026-10-20), not ESPN's: the team pages, the pop-up, the schedules
  and the standings all use them (`EGE.nflLogos` in `data/logos.js`). Each
  is drawn for a dark ground with a white edge of its own. The Jets' is all
  white, so on a schedule's or a table's cream rows they have
  `Jets-green.png` instead (`EGE.nflLogosOnLight`).

  The index ends with **NFL Standings**, a box for each division with
  every team's record, each team a link to its page and the six's teams
  picked out in orange. From the week the sim takes over, the standings use
  the sim's scores (`data/nfl-results.js`) in place of the real ones in
  `data/conferences.js`.
- **No standings** (Sam, 2026-10-21): the header's record and division
  place say where a team stands; the whole league is the NFL Standings at
  the foot of the index. `EGE.conferenceTables` in `data/games.js`, which
  drew the old Conference Standings panel, is still there.
- **No schedule** (Sam, 2026-10-21): the games are on the players' pages.

The quarterback rooms are also where a QB Connection is picked from (see
the shop).

### Search — `#search`

A magnifying glass at the end of the nav links (Sam, 2026-10-26), for
everybody, signed in or not. It opens a page with one box; results come
as it is typed, and the query rides in the address (`#search/{query}`), so
Back from a team or a player's page comes back to the same results.

- **Teams** first: every NFL team (by name, city or abbreviation: `DET`)
  with its record and place in its division, and every school one of the
  six played for. Each is a link to its page.
- **Players**: the cards a team's page draws (`nflLine`), each with his
  team's mark beside his overall, opening the same pop-up. They are the
  NFL sim's, from the rosters the Teams pages open on (the latest live NFL
  season): everybody on a roster, then **free agents** (FA where the team
  mark goes; the pop-up's contract says Free agent), then the **retired**:
  greyed, RETIRED where the overall was, the mark of the team he last
  played for, and in the pop-up *Retired after the {year} season*. The six
  are always in it. Up to 24 players, then *Show more*.
- A name matches when every word typed starts a word of it ("jos all" is
  Josh Allen), ignoring accents, dots and apostrophes ("cj" finds C.J.);
  ties go to rostered players before free agents before the retired, then
  the higher overall.

The free agents and the retired come with the published rosters
(`freeAgents` and `retired` in `nfl-sim/lib/site.js publicRosters`).
Rosters published before 2026-10-26 have neither, so until the live
season's rosters are published again only rostered players turn up; an
admin's first visit to the search or an NFL team's page publishes them
again from the world, as it does for anything else the rosters are missing.
Players who retired before then lost their archetype and size in the world,
so their cards show neither.

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

## Overall tiers

Every overall box on the site — the six's cards on the home page, the team
rosters, and the big one in a player's header — is drawn by `overallBox` in
`js/app.js`, cut from whatever its number has earned:

| Overall | Tier | Looks like |
|---|---|---|
| 0–74 | Basic | the site's dark chip: OVR in orange, the number in cream |
| 75–79 | Bronze | brushed bronze, the number in dark brown |
| 80–84 | Silver | brushed silver, the number in near-black |
| 85–89 | Gold | brushed gold with a soft glow |
| 90–94 | Diamond | a princess-cut blue diamond drawn as an SVG, the number in navy |
| 95–98 | Pink Diamond | the same stone turned pink |
| 99 | Galaxy | deep space with pink and blue nebulae and stars, the number glowing white |

Every tier from bronze up has a band of light sweeping across it every few
seconds; the diamonds and the galaxy also sparkle in the corner, and the
galaxy's glow breathes. All of it stays still for anybody who asks for less
motion. The colours are in `site.css` under *the overall tiers*.

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
overall = 50 + 1.4 × (key-attribute average − 50) − position offset, kept within 1-99
```

So a player whose key attributes are all in the 80s and 90s is a 99 — the
Madden 99 tight end this was checked against (99 catching, high 80s speed
and routes, blocking in the 60s, a 33 throw power) comes out at 99. A tight
end's key attributes are his hands, routes and athleticism, with blocking
behind them; a quarterback's are his arm and accuracy; a back's are his
speed, vision and ball carrying,
with his hands counting for something since these are backs who catch.
The stretch lives in `EGE.overallScale`. Only QB, RB, WR and TE are
weighted; anything else falls back to `DEFAULT`, a little of everything.
There is no awareness: nothing on the site could raise it, so it was taken
out of the attributes and every overall (Sam, 2026-10-26). To keep the
overalls where they were, each position takes off a fixed amount after the
stretch (`EGE.overallOffset`: QB 7.3, RB 2.4, WR 3.5, TE 3.7), what
awareness had cost the six on average.

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

A college season is headed the same way, `## Playoffs Week One` and on,
though its weeks are conference title games and bowls as much as playoff
rounds: each embed names its game beside the opponent,
`W 36-34 vs. Florida · SEC Championship`.

Which weeks those are is read off the games — `EGE.playoffWeeks` in
`data/games.js` is every week with a `playoff: true` game in it, and a week's
place in that list is its round. Nothing has to be told where the regular
season ends, and a season whose playoffs open at week 12 or week 15 names
itself correctly.

A player on a bye is left out, the same as a player with no game that week:
there is nothing to post about somebody who is not playing.

**Two bots from 2023.** With half the six in the NFL and half in college,
each league has its own channel and its own webhook, and a week goes out as
**one message per league**, the NFL's first (`buildWeekPosts` in
`js/discord-post.js`). Each carries only that league's players
(`EGE.leagueOf`) and is headed by that league's own week, so the NFL's
`## Playoffs Week One` is counted from the NFL's own postseason and not the
colleges'. A league with nobody playing that week sends nothing: week 0 is
college only, and weeks 14 to 18 are NFL only. A game not yet played says
*Division* or *Non-division* in the NFL where college says *Conference*.
The high school seasons and 2018–22 belong to the college bot, the one
channel there was before anybody was drafted.

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
node bot/post-week.js --week 4 --league nfl --dry-run   # one league's post
```

The two webhooks are read from Supabase (saved on the admin page, see
*How the Discord post gets sent*), with `DISCORD_WEBHOOK_URL_COLLEGE` and
`DISCORD_WEBHOOK_URL_NFL` as a fallback for a league with none saved there.
A league with neither is skipped and the run exits with an error; the week
stays owed for it. `SITE_URL` defaults to the Vercel domain and decides
where the images and player links point.

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
`published_weeks.posted_leagues` records which of the two leagues' messages
have gone, so a week where the NFL's landed and the college one did not gets
only the college one next time; `posted_at` is set once both are out.

Set it up if you want the safety net; skip it and publishing still posts.

**Setup:** repository secrets under Settings → Secrets and variables →
Actions:

| Secret | What it is |
| --- | --- |
| `SUPABASE_URL` | your project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API. Server-side only — it never goes near the browser |
| `DISCORD_WEBHOOK_URL_COLLEGE` | optional: the college channel's webhook, if it is not saved on the admin page |
| `DISCORD_WEBHOOK_URL_NFL` | optional: the NFL channel's webhook, the same |

Until the first two exist the workflow runs and fails loudly rather than
posting anywhere.

---

## The Shop

A tab next to Players, at `#shop`, **visible only to a signed-in player**.
Signed out, the tab isn't there and the page says to sign in. Signed in, the
nav carries the player's credit balance beside their headshot, with their
diamond balance (see *Cards → Diamonds*) beside it; on a phone the two stack.
Everyone starts on 0 and earns from there. The catalogue lives in `data/shop.js`.

Items with a picture name it as `icon`. The originals are in `icon/shop` at
1254px; the site loads 256px copies from `icon/shop/small`, about 115KB for
all six instead of 1.8MB.

**Credits** are 60 every offseason, whatever a player is paid, plus what the
season earns by contract size and honours (`earnings` in `data/shop.js`).
The page no longer shows that table, nor any words under the Performance
Boosters and Rating Points headings (Sam, 2026-10-20). Anything unspent
carries into the next offseason.

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
  that attribute already is to 99. Cheap early, dear late. A **Sort by** drop-down
  sits above the table: best value (the default — overall gained per credit),
  most OVR impact, cheapest, most expensive, highest rating, lowest rating,
  group, and A–Z. Beside it, **group buttons** (All, Carrying, Passing,
  Blocking, Receiving…) narrow the table to one group — and only the groups
  that player's position is judged on get one, so a running back has no
  Passing. A maxed attribute has no next point, so it sinks to the bottom of
  the price sorts.
- **Offseason training** — strength (8) or cardio (8), each with a downside
  rolled when you buy it, or overall (12) for a smaller gain spread wider with
  nothing to lose. Cheap to start and **twice the price every time you buy
  it**, so an offseason spent on one workout runs out of credits long before
  it runs out of attributes. See below.
- **QB Connection** (20, college and later) — **with a named quarterback**:
  the card has a drop-down of his team's quarterback room that season
  (`EGE.quarterbacksFor` — in the NFL the sim's roster from
  `nfl_sim_rosters`, `EGE.simQuarterbacks`, loaded the first time it is
  asked for; in college the real roster; plus any of the six, never
  himself), and Buy waits until one is picked. The row is called *QB
  Connection — C.J. Stroud*, with the name in `target`, and the buy call
  refuses a name that is not in the room. A quarterback's O-Line Connection
  has nobody to pick. An admin granting one picks the quarterback too, and
  how many levels (a held one goes up that many); **Set level** on a row in
  Accounts sets it to any level (`EGE.wallet.setLevel`).
  **Buying it again with the same quarterback levels it up** — one row per
  quarterback, with the level kept in `quantity`, shown in Roman numerals
  from II (*QB Connection III — C.J. Stroud*). The price follows the level
  (`creditsLadder: [20, 20]`, `creditsStep: 10` — 20, 20, 30, 40, 50…), and a
  different quarterback starts again at the first level. An admin-disabled
  connection cannot be built up. `EGE.priceFor` reads any `creditsLadder`,
  which is also what makes the chamber's 35 / 45 / 60 / 75… real.
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
  15 more each time): Injury +5 each, chambers bought before it did that
  included (`countsBack`, `EGE.rowEffects`); the season lock folds it into
  data/ratings.js and zeroes the rows, which stay to price the next one.
  **Intel** (15).

**Some things can't be bought yet.** An item can name the levels it belongs
to, and the shop greys it out everywhere else with the reason on the card —
the chamber is NFL only and needs an NFL season behind the player, so in
2023 it reads *Not until your first NFL season is behind you* for the
three rookies and *NFL only* for the three still in college. Intel is the
other way round: the college three can buy it, and an NFL player is told
there is *nothing left to scout for in the NFL*. It is the player's own
level that decides (`EGE.itemAvailable(item, season, player)`), not the
season's. The check runs in the buy call too, since a disabled button is
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

**The general attributes are not for sale.** Speed, strength, stamina and
the rest move only through offseason training, which is what
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

**No + on a bye** (Sam, 2026-10-20): there is no game to put anything on.

**Hurt, no boosters.** Once the week a player got hurt in is out, every
booster on a game he is going to miss comes off it and goes back in his
drawer, and those games take no new booster — the drawer says he is out
injured and offers only the wager (Sam, 2026-10-20). Which games he is going
to miss is what the injury report says, from the week he went out to the
week before he is back (`EGE.outInjured` in `data/games.js`), so an injury
further down the file is not given away early. The handing back is
`EGE.wallet.returnInjuredBoosters`, run by the player's own page whenever it
pays what he is owed and by the admin's publishing a week; a booster only
goes back to the drawer from whichever of them actually deleted its row, so
it can never come back twice. Boosters already written into the season file
are left alone.

### Wagers

The drawer has a **Wager** beside the boosters (Sam, 2026-10-20): a pick
against the **point spread** on the game. Every game the six have left gets
a line — *Seattle by 5.5* — and a wager takes one side of it: Seattle −5.5
needs Seattle to win by 6 or more, Pittsburgh +5.5 needs Pittsburgh to win
or lose by 5 or fewer. Every line ends in a half, so there are no pushes,
and the closest a game gets is a half point. Beat the line and the game
pays **double its credits**; miss it and it pays **no credits**. Diamonds
and the Player Card bonuses are paid as if there were no wager. **Two a
season**, playoff games included, never on a game already out, and free: a
wager is a pick, not something bought, so nothing comes out of the
inventory. It takes the game's one sticker slot, so a game carries a booster
or a wager, never both. A game a player is out hurt for still takes a wager
(it pays the 1 credit a missed game pays, so 2 or 0).

**The line** is worked out in the browser by `js/lines.js` from a projected
score for each side (shown in the drawer: *Projected 18–13*), and the score
from what the site has already put out and nothing else:

- every published result of the season before the game — the six's own,
  every conference race in `data/conferences.js`, and the NFL sim's other
  games in `data/nfl-results.js` — as points scored and allowed, with who
  each team played taken into account, and a blowout past four touchdowns
  counting half of the rest;
- where each team stood beforehand, which those results take over from as
  the weeks go by: in the NFL its starters' ratings off the Teams pages'
  rosters (never the sim's own team ratings), in college its defense's yards
  allowed in `data/defenses.js` and whether it is FCS; and last season's
  results where the site has them;
- home field, and nobody at a neutral site;
- one of the six out hurt, once his injury report is up (a quarterback costs
  his team most).

So a line moves as the weeks come out, like a real one. **A wager keeps the
line it was taken at**: the `line` column on its `game_boosters` row, and
`line` beside `booster` in the season file once the week is pulled in. If
the line moves between the drawer opening and the pick, nothing goes on and
the drawer shows the new number.

On the schedule it is a black poker chip with the mark of the team it is on
(and the drawer's blank one says BET). Once the game is out the chip turns
**green** for a win or **red** for a loss, with nothing stamped on it (Sam,
2026-10-20); one that came out level stays black. The
Paid column shows the doubled credits or a red **+0**, and the game log
carries *Bet 2x* or *Bet 0x* beside the opponent. Until then it comes off
the way a booster does.

It is stored like a booster: a `game_boosters` row with `item_key`
`wager-for` (your team) or `wager-against` (the opponent) and its `line`,
written into the season file's `booster` and `line` fields when the week is
pulled in, and the season editor's Booster or wager pick has both (picked
there by hand, it takes the line as it stands). `EGE.wagerOn` in
`data/games.js` reads it and settles it from the score and the line;
`EGE.economy.awardsEarned` and `EGE.creditsFromGame` pay it. The credit
ledger only ever tops an award up, so the stickers are always loaded before
a player's credits are paid (`syncAwards`), or a lost wager would be paid in
full and never taken back. The trigger on `game_boosters` refuses a third
wager in a season, a wager without a half-point line, and any sticker on a
week already out, admins aside.

**No booster on a playoff game.** A booster is what you spend a limited
drawer on across a regular season you can see all of; the postseason is not
planned, it is whatever the bracket hands you. A game with `playoff: true`
still grows a +, for the wager (Sam, 2026-10-20), but the drawer offers no
boosters there, and `applyBooster` in `js/wallet.js` refuses the week even
if it is called directly. A playoff game pays more on its own instead: 1.25
times the credits and twice the diamonds.

**The drawer** sits along the bottom of the screen in one row where there is
room — the game and what the season has left, the boosters, the wager — with
a cross in the corner. A click anywhere off it, or going to another page,
shuts it (Sam, 2026-10-20).

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
| WR | 0.75 | 15 |
| TE | 0.75 (1.00 from 2026, 5 a game at least) | 15 (20 from 2026) |

The shares are worked out from the 2018 season's 72 stat lines, not picked.
They make a breakout game (the average of each position's 75th and 90th
percentile) pay the same 15 credits for every position. One scale over all
three then makes a whole season pay what touchdowns used to (757 credits
across the six against 745), so no shop price needed to change. Re-scored this
way, 2018 would have paid 90–173 a player instead of 70–165, and no game would
have paid nothing.

Credits are **always rounded up** — there is no half a credit — and a game
played never pays less than 1.

**A tight end keeps all of his points from 2026** (Sam, 2026-10-27): 1 credit
a fantasy point instead of 0.75, and never less than **5** for a game he plays
(`EGE.economy.TE_SHARE`, `TE_MIN_CREDITS`). He spreads his credits over more
ratings than anybody, so this smooths his climb. The diamonds come off the
same credits, so a game pays him at least 5 diamonds too (more with a booster,
10 in the playoffs), and his Player Card bonuses grow with them. A game he
sits out hurt pays 1 like anybody's. On 2025's lines Andrew would have made
160 credits instead of 116. It starts with 2026 (`TE_FROM`) because the ledger
would top up every earlier game the next time a week in its season was
published. Card grades are not touched: a tight end still grades on 0.68.

**A playoff game pays 1.25 times the credits** — any game with
`playoff: true`, the conference title games and bowls included. The fantasy
points times the share times 1.25 are rounded up once, so a line worth
exactly 15 credits in the regular season pays 19 in the playoffs. That starts with **2022**
(`EGE.economy.PLAYOFF_FROM`): the seasons before it were paid as they went,
and the ledger would top every one of their playoff games up the next time a
week was published. A playoff game also pays twice the diamonds (see
*Diamonds*).

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
out** on the admin page pushes it to everyone at once without republishing
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

### Diamonds

The card game has its own money. **Packs cost diamonds, never credits**, so a
pack is never bought with something that could have gone on a player — which
is what kept anybody from buying them. Library sets pay diamonds too, and so
does quick selling a card. Nothing in the simulation takes or gives them.

**Every game pays them**, on top of its credits and off the same numbers: the
game's fantasy points times the position's share, rounded up. Then **the
booster on the game multiplies them** — a 1.5x Booster pays 1.5 times the
diamonds, a 2.0x twice, a 2.5x two and a half times, rounded up again. A
15-credit game with a 2.5x Booster on it is 15 credits and 38 diamonds. The
multiplier is the booster's own `multiplier` in `data/shop.js`, and the
booster is read through `EGE.boosterOn`, so a week still in Supabase and a
week already written into the season file pay the same.

**A playoff game pays twice the diamonds** (`PLAYOFF_DIAMONDS` in
`data/economy.js`): the game's plain credits times two, not its playoff
1.25x credits doubled again. No booster can go on a playoff game, so the two
never stack, and that 15-credit line is 19 credits and 30 diamonds in the
playoffs.

Diamonds start with **2022** (`EGE.economy.DIAMONDS_FROM`). The seasons before
it were paid in credits as they went, and four seasons of diamonds at once
would fill every binder on the first day. A full 2022 pays about 145–225
diamonds a player before boosters.

**Credits buy diamonds, two for every credit**, from the Buy Diamonds box under
the packs (`DIAMONDS_PER_CREDIT` in `data/economy.js`, charged by
`buy_diamonds()` in `supabase/schema.sql` — change both together). At that
rate a pack costs in credits exactly what it did before diamonds existed.
**Nothing turns diamonds back into credits** — which is also why the library
pays diamonds rather than credits now.

They are paid the way credits are: `diamond_awards` is a ledger keyed
`game-w{week}`, `pay_diamond_awards()` pays what is new and tops up what has
grown, in one transaction, on every sign-in and every publish. For anybody but
an admin an award has to carry that key and be no more than 300 (the 120 a
game's credits are held to, times 2.5). Each game's diamonds show beside its
credits on the player's own schedule.

Unlike credits, **a player cannot write their own diamond balance**:
`player_diamonds` has an insert and update policy for an admin only, and a
player's diamonds move only through paying a game, buying diamonds, opening a
pack, claiming a set, quick selling a card and making a holo.

**Making a holo pays a tenth of the holo's fantasy score** in diamonds,
rounded up and never less than 1 (Sam, 2026-10-20): the holo's score is three
times the card's, so a 170-point holo pays 17, most pay 2 to 4 and Sam's
65.3-point Iconic (195.9 as a holo) pays 20. There is no cap. The page works it
out (`holoBonus` in `data/cards.js`) and `merge_holo_card()` pays it in the
same transaction as the merge, turns down only more than 60 (a page that has
been tampered with; `HOLO_BONUS_MAX`, change both together) and keeps it in
`card_merges.diamonds`. Holos made before PR #88 paid nothing, and those made
between it and this paid a tenth of the one card's score, capped at 15; none
are back-paid.

**The diamond balance in the nav opens the diamonds page** (`#diamonds`,
`js/diamonds-view.js`). Recent Games is a box a week, newest first, six at a
time with Show more: every game that week that paid the account anything,
one row a game, split into what it paid as their own game (`game-w{week}`)
and what it paid through their Player Card on that player
(`pc-{slug}-w{week}`, with the rank it was paid at), and the week's total.
A row opens that game in the player's game log. The panel's head has the
balance and the live season's split.

Other Earnings, under it, is everything else that paid, newest first, ten
at a time (Sam, 2026-10-20): holos made (`card_merges.diamonds`), Library
and Gold Rush sets completed, the Gold Rush's final reward included (the
diamonds in each `card_set_claims` / `card_event_claims` reward), and cards
sold on the market (each `card_listings` sale's price, with who bought
it). Its head splits them into Holos, Sets and Market, and it only shows
once one of them has paid. Quick sales and the Daily Spin are not on it.

The page reads what is already kept, so it shows what was paid, not a sum
done again, and needed nothing new in the database beyond
`card_merges.diamonds`.

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
| Common | gray | 47.4% | — | — | 335 |
| Uncommon | green | 26% | 6.5 | 7.1 | 215 |
| Rare | orange | 14% | 11 | 8.6 | 143 |
| Epic | red | 8% | 16 | 9.6 | 98 |
| Legendary | purple | 4% | 20.5 | 11.2 | 75 |
| Mystic | gold | 0.5% | 28.5 (24 in college and the NFL) | 13.3 | 10 |
| Iconic | pink | 0.1% | picked | picked | 4 |

Counts are the 2018–2022 files. Mystic was 24 / 12.1 until Sam asked for it
to be closer to 10 cards than 35 (2026-10-13): the 30 that fell out became
Legendary, and Legendary moved up from 20 / 11.1, so its six lowest became
Epic. Then a college or NFL game got a lower Mystic bar than a high school
one, 24 for a performance (`collegePerformance`, Sam, 2026-10-17), which
made three more college performances Mystic: Paxon's 199 yards against
Missouri State (2021) and Andrew's three touchdowns against UL Monroe and
172 yards against Austin Peay (2022). Plays keep the one bar.

A tight end grades on a share of 0.68 rather than the 0.75 his credits pay
on (`GRADE_SHARE` in `data/cards.js`): on 0.75 Andrew had six Mystic
performances to everybody else's three at most (Sam, 2026-10-17). He keeps
two, his 205 yards and three touchdowns in 2019 and his 215 yards at
Tennessee in 2022.

**Iconic is picked by hand, not graded.** Grading stops at Mystic, and only
the moments in `ICONIC` at the top of `data/cards.js` are Iconic: Sam's five
touchdowns against Centennial (2019), Paxon's two touchdowns in the FCS
Championship (2020), Cooper's 80 yard touchdown against Helix (2019) and
Jaykeb's seven touchdowns (2022). Add an id there to make another. At 0.1% a
card, about one Base Pack in 330 has an Iconic in it.

From Rare up the frame catches the light: a still sheen on Rare, a moving one
on Epic and Legendary, gold foil on Mystic and holographic on Iconic, the
same foils as the booster stickers. The moving shine (the sheen, the flowing
gold and holo) only plays in a pack being opened and on a card up close;
everywhere else cards hold still in their frame colours so a full binder does
not lag (Sam, 2026-10-13).

Across the bottom of the picture, a play card prints its yardage big (*44
YD TD*) and a performance card its yards and touchdowns (*312 YDS 5 TD*).
A touchdown its season file calls *game-winning* (or *walk-off*) or
*game-icing*, in a game the team won, says so in the rarity's colour on a
line under *YD TD*, the two lines beside the number (Sam, 2026-10-20). The
words in the file decide, since nothing else there says when in a game a
play came; the NFL sim writes *game-winning* for a fourth-quarter or
overtime touchdown that put its team ahead for good.

**The two card-art cards are drawn by the page** (Sam, 2026-10-20): Sam's
week 18 and Cooper's week 11 in 2019, Mystic, only in the Gold Rush Pack
(`CARD_ART` in `data/cards.js`). Each is the usual card with Sam's photo of
the game in the picture in place of the headshot and no team logo, and the
helmet cut out above the photo stands up out of the picture over the
PERFORMANCE strip and the score, number and all, under the frame and the big
yards and touchdowns. So they have the foils, the tilt and the close-up of
any card, and three of one merge into its holo, whose rainbow covers the
helmet as well as the picture. Only the GOLD
RUSH card is still Sam's picture printed whole, and it has no holo.

Under the picture a college or NFL card names its opponent with the
opponent's mark after it, about a capital letter high (*vs. Ohio State* and
the Block O; Sam, 2026-10-20). A high school has no mark.

### Packs

| Pack | Diamonds | Cards | |
| --- | --- | --- | --- |
| Base | 10 | 3 | any season |
| Season | 12 | 3 | the live season only, the last card Uncommon or better |
| Pro | 20 | 5 | any season, the last card Rare or better, 1.5x odds on Legendary and up |
| Season, a past year | 14 | 3 | that one past season only, the last card Uncommon or better |

Base, Season and Pro are twice what they were in credits, because a credit
buys two diamonds.

Each pack's tile is centred, top to bottom: the pack, its name, what is in
it, and **Buy & Rip**. **The Season Pack has an arrow either side of its
Buy button:** the left one steps it back to 2021, 2020 and so on, each a
`year-{season}` pack at 14 diamonds (`YEAR_PACK_PRICE` in `data/cards.js`),
and the right one steps forward to the live season. A past year is a
darker bronze with white words. A new year joins the arrows when the site
rolls to a new season. The arrows only redraw the Season Pack, and every
pack's shimmer keeps time with the clock (`--phase`), so redrawing the packs
never starts their shimmer over. The Pro Pack glows a little purple.

The packs look like a Panini Prizm pack: a foil pouch whose crimped seals,
top and bottom, are photos of a real pack's (`icon/packs/crimp-*.webp`, Sam,
2026-10-14) washed in the pack's colour, with a dark **EGE Football** bar
across the top, the prizm (a burst of fine rays and a
band of colour that slides across them) behind, the pack's name in tilted
chrome, and a foot band with the count and the year. A season can have a
**cover**: a player cut out on the front, his team's logo large behind him,
and a colourway of its own (`PACK_COVERS` in `data/cards.js`, pictures in
`icon/packs/`, colourways as `.ege-pack--{theme}` in `site.css`). The player's
helmet just touches the bottom of the EGE Football lettering and his legs
run behind the name, which sits a little above the trim. 2022 has Paxon at
North Carolina in the blues of his jersey in the photo (cooler than the
official Carolina blue), the NC behind him and an argyle strip (Sam,
2026-10-14). 2021 has Jaykeb at Ohio State in the scarlet of his jersey,
the block O behind him and the helmet stripe across the foot, and 2020 Andrew
at Alabama in the deep crimson of the script A, a darker A behind him and
Greek laurel leaves across the foot, and Andrew 20% bigger than the others
(a cover's `zoom`); 2019 has Sam at Normal Community, 20% bigger and a touch
lower (a cover's `drop`, so his helmet clears the EGE letters), on
near-black foil with darkened seals and a dimmer prizm, lined in the
Ironmen's orange, the N behind him as only its orange outline,
and a black sword on an orange band across the foot; and 2018 has Cooper
at Carlsbad on purple foil, the Lancers' C behind him as only its outline in
white, and a royal stripe of black, white and purple across the foot (Sam,
2026-10-14). 2023 has Isaac at Texas, 20% bigger and lowered a touch, on
burnt orange foil off his jersey, the longhorn behind him in a dark burnt
orange edged in white with its horns out either side of his shoulders, and
the sleeve's two white stripes across the foot (Sam, 2026-10-17). Every season now has a cover, every player 20% bigger than the
first cut (`zoom: 1.2`; Cooper, in a tall standing pose, 1.44), some lowered a touch (`drop`) so no helmet covers
the EGE Football letters. A cover
follows its season: on the live Season Pack while it is that season, then on
that year's pack behind the arrows. A season with no cover gets the plain
pack, its name in the middle.

Each card rolls its rarity on the odds first, then is drawn from every
published card of that rarity the pack can hold. A rarity with nothing out
yet falls to the nearest one below it. The Season Pack is the one that grows
a week at a time.

**A pack holds at most one card above Legendary** (`PACK_CAP` in
`data/cards.js`): once a Mystic or Iconic is in it, every card after it
rolls Legendary or lower. **A Pro Pack has 1.5x the odds of Legendary and
up** (`boost` on the pack): Legendary 6%, Mystic 0.75%, Iconic 0.15% a card,
with Common at 45.1% making up the difference. **The cards are laid out worst to best, left to
right** (`packOrder`), in the opening and in Recent Pulls, so the best card
is always the last one turned.

**Buy & Rip** brings up the sealed pack. **Nothing is paid until it is
torn:** the tap that tears it is what calls `open_card_pack()`, and closing
the overlay with the pack still sealed costs nothing and adds nothing. The
sealed pack gives nothing away either, with no words under it and no glow of
what is inside. Once torn, the cards are dealt face down and each one turns
over on a tap with a flash of its colour from Rare up. Cards a player has
never had before say *New*.

**Sounds:** the pack makes a ripping sound as it tears, and every card makes
a flip sound as it turns over (a set's reward card and a holo too; a big pull
flips when it turns, after it holds back). Both are Sam's clips in `sound/`,
trimmed at the front so they start on the tap, and both play quietly because
the clips are harsh at full volume: the volumes are `SOUNDS` in
`js/sounds.js` (flip 0.25, rip 0.1; the rip clip is far louder). The big
pulls have sounds of their own (below), a little louder than these. They go
through Web Audio, so an iPhone keeps to those volumes, stays quiet on
silent and plays over the player's own music. If the browser won't play
sound, nothing else changes.

**Quick sell out of the pack:** once every card is turned, tapping a card
picks it (tap again to put it back), and **Quick sell N** sells all the
picked ones at the quick-sell prices before the next pack. Iconic cards
can't be picked.

Nothing from the pack shows in the collection, the library, the recent pulls or the counts until it is
put away with **Done**, so nothing behind it gives the pack away; a set's
reward card works the same way.

**The big pulls have their own openings**, longer the rarer they are. A
Legendary or better holds back before it turns over: it lifts, shakes
and glows in its colour, and turns in a burst of rays, a ring and sparks.

| Rarity | Holds back | Then |
| --- | --- | --- |
| Legendary | 0.9 s | purple rays, a ring and sparks, 1.6 s |
| Mystic | 1.7 s | the overlay washes gold, a flash, more sparks, 2.4 s |
| Iconic | 2.8 s | the other cards dim, the screen goes pink, a flash, two rings, a shower of sparks and **ICONIC** across the top, 3.6 s |

The timings are `BUILDUP` and `SHOW` in `js/cards-view.js`. With reduced
motion turned on in the phone or computer's settings, none of it runs and the
card just turns over.

**They sound bigger too.** While the card holds back, a build rises under it,
a whoosh sweeping up that ends exactly as the card turns. As it turns comes
the reveal: a boom, a punch, a whoosh falling away and a cymbal. **Nothing
musical** -- no notes and no sparkles (Sam's call). Each rarity is longer and
deeper than the one below:

| Rarity | Build | Reveal |
| --- | --- | --- |
| Legendary | 0.9 s | a light boom and cymbal, 1.8 s |
| Mystic | 1.7 s | a bigger boom and a longer cymbal, 2.6 s |
| Iconic | 2.8 s, with a heartbeat that quickens | the deepest boom and the longest cymbal, 4.2 s |

They are `sound/{rarity}-build.mp3` and `sound/{rarity}-reveal.mp3`, all
synthesised for the site. A build is exactly `BUILDUP` long,
so **if a `BUILDUP` changes, the build has to be remade to match**. With
reduced motion there is no build, but the reveal still plays. Closing the pack
fades out whatever is still playing.

The price and size are charged by `open_card_pack()` in
`supabase/schema.sql`, not by the page. **Change both together.** Which cards
are in a pack the page decides, because the season files are not in
Postgres. That is the same trust the credit awards run on, with the easy half
closed the same way: a pack has to hold exactly its size of real-looking ids,
and it costs what it costs. It is paid from the diamond balance, taken under
lock, and `card_packs` records it in `diamonds`; its `credits` column is what
a pack opened before diamonds cost.

### The collection

Every card owned, rarest first by default, with how many of each (`×2`).
Filter by rarity, by kind and by player; sort by rarity, score, newest pull,
**year** (the newest season first, each under its year) or game. Five cards
go across (four, three and two on smaller screens), three rows show at a time
and the rest scroll inside the panel, so the page below is never far away.

**Only the first few rows are drawn.** More are added as the binder is
scrolled toward its end, a few rows at a time, so a big collection is not
hundreds of foil cards for a phone to run at once. Selling a card, ripping a
pack or a refresh keeps the binder where it was scrolled to.

Tap a card to hold it up close with the game it came from; the **→** button
beside its stat line opens that player's page on the card's season and picks
the game out in the game log. Up close the card is as wide as the facts
under it and leans toward the pointer, every rarity the way a holo always
did. The facts leave out what the card already shows: no rarity, no
fantasy points and no count of your own; a Gold Rush card's Event is just
*Gold Rush* (Sam, 2026-10-20). Duplicates are kept, and are what trades
are made of.

**Anybody's collection can be looked through.** The first drop-down switches
from *My collection* to any other player's, with the same filters and sorts.
Their cards up close list everybody who has them, you and them included,
under Who has it. It is the same reading a trade already does: any
signed-in player can see anybody's cards. A card of theirs up close also has **Trade for it**, which goes to the
Trades page with the trade builder open to them and that card already asked
for; you pick what you give and send it as usual. A card on somebody else's
showcase or in their recent pulls has the same button, signed in. If they
no longer have it, the builder says so and asks for nothing.

**Who else has it.** Signed in, any card up close (from the collection, a
pack's recent pulls, a trade, the shop, the market or a showcase) lists who
else holds it, with each account's face, first name and count, biggest pile
first, plus any copies up on the Market. On a card from your own collection
you are left out (your binder has your count); anywhere else it is *Who has
it*, with you as *You* and the player whose collection or showcase it is
counted like anybody else (Sam, 2026-10-20). It reads
`player_cards` for that card id, which any signed-in player can already read
(`ownersOf()` in `js/cards.js`), so it needed no schema change.

### Quick sell

A card of your own up close has **Quick sell**, which sells one copy back for
diamonds. The first tap turns the button red and says the price; the second
sells. With copies left, the overlay stays open and counts down; the last copy
is stamped *Sold*. It comes off the showcase if it was up, and an open trade
it was in can no longer be accepted (it expires, the same as a card traded
away).

| Rarity | Sells for |
| --- | --- |
| Common, Uncommon | 1 diamond |
| Rare, Epic | 2 diamonds |
| Legendary | 3 diamonds |
| Mystic | 30 diamonds |
| Iconic | cannot be sold |

**Quick sell several at once.** A price-tag button beside the bin at the end
of the collection's filters (beside the Sort button on a phone) turns the
binder into a picker: a tap picks a card to sell or puts it back, and a card
held more than once gets − and + for how many copies go. A bar over the page
buttons keeps the count and what it all pays, **Extras** picks every copy
past the first of the cards showing (as filtered), and **Quick sell** sells
them on a second tap, one copy at a time through `quick_sell_card()`, so a
refusal stops there and leaves the rest picked. Iconic cards grey out and
cannot be picked. **Cancel** (or **Done**) leaves it; so does going to
another page or another player's collection. Nothing in the background
redraws the binder while it is on.

The prices are `QUICK_SELL` in `data/cards.js` and are paid by
`quick_sell_card()` in `supabase/schema.sql`. **Change both together.** The
page says what rarity the card is, since the grading is done from the season
files, the same trust a pack's contents run on; the database keeps the
prices, refuses Iconic, takes the copy under lock so it cannot be sold twice,
and writes every sale to `card_sales`. A card only ever sells for diamonds.

### Recent pulls

Under the packs: the last packs **anybody** opened, newest first, each with
who opened it. Four at a time, and **Show more** goes back three times, so
sixteen at most. Tap a card to see it up close; on your own pulls you can
sell it from there, on somebody else's there is **Trade for it**, and a card
of yours that has since been sold or traded away is shown faded. `card_packs` stays readable by its owner and an admin
only, so these come through `recent_card_opens()`, which hands over who,
which pack, the cards and when, never the price.

### The library

Sets to put together, each claimed once. A set is a list of slots, each
wanting one card. No card fills two slots of the same set, but a card counts
toward every set it fits, and claiming uses nothing up.

**Gold Rush cards count toward them too** (Sam, 2026-10-20), each as the card
it is a Gold Rush copy of: a card and its Gold Rush copy are one card here
and never fill two slots, the two card-art cards count as the games they are
art of (at their own Mystic), and the GOLD RUSH card counts as an Iconic. The
Gold Rush's own sets still take Gold Rush cards and nothing else. Halloween
cards count the same way: a Halloween card, its costume card and the plain
card are one card here.

| Set | Needs | Reward |
| --- | --- | --- |
| The EGE | a card of each of the six | Rare+ card · 6 diamonds |
| Bloomington Connection | 4 Isaac + 4 Paxon, 2018–19 | Rare+ card · 6 diamonds |
| Buckeye Backfield | 4 Sam + 4 Jaykeb, 2020 on | Rare+ card · 6 diamonds |
| Highlight Reel | 15 different play cards | Epic+ play card · 10 diamonds |
| Collector | one of every rarity | Legendary+ card · 20 diamonds · 1.5x Booster |
| Hall of Fame | 3 Legendary-or-better | Mystic+ card · 20 diamonds · 1.5x Booster |
| *Player* (×6) | 8 different cards of him | Rare+ card of him · 6 diamonds |
| *Year* Season (each season) | a performance card of everyone who played | Epic+ card from that year · 10 diamonds · 1.5x Booster |

**The rewards are kept small on purpose.** Measured by simulation with Base
Packs, a player gets back roughly 30–50% of what they spend on packs
(counting a booster at its 15-credit shop price, 30 diamonds at the swap
rate), and the early sets come first. Cards are a place to spend diamonds for
fun, never a way to make credits. Rough cost of each set in Base Packs: The
EGE about 50 diamonds, a player or Highlight Reel 100–230, Hall of Fame about
150, a past season about 400, Collector about 4,800 (it needs one of the
Iconics, so it is mostly finished by trading for one). The live season's set
is about 130 through Season Packs. The rewards and the costs both doubled
with the packs, so these are the same proportions as before.

**A reward booster is an ordinary booster.** It lands on the same stacked
inventory row a bought one does, and goes on games under the same
five-a-season trigger, so a full library never means more stickers on a
season than anybody else can have.

`claim_card_set()` in `supabase/schema.sql` pays the reward. It checks that
every card the set was completed with is really in the collection, that the
set has not been claimed before, and, for anybody but an admin, holds the
reward to 40 diamonds and the 1.5x. It was `p_credits` before diamonds, and
Postgres will not rename an argument, so the schema drops the old function
and creates it again.

### Halloween

A limited-time event like the Gold Rush (Sam, 2026-10-26): an admin starts
it from the Cards tab of the admin page and it runs seven days. The
**Halloween Pack** is 4 cards for 18 diamonds, the last one Rare or better,
from October games, the Graveyard and U.F.O. kinds of game below, and two
Mystic card arts (Paxon's 2025 week 16 performance, Isaac's 2022 week 12
79-yard touchdown). A Mystic from the pack is one of the card art 55% of the
time (`artShare`; Sam wanted the art a little likelier than any other
Mystic), about one pack in 24. A Halloween card (`:hw`) wears Sam's pumpkin
on a dark purple gradient sticker with the sunburst's dark edge, no shine
and no shadow, and its back
says *Trick or Treat*. The card art wears no sticker, so nothing covers the
art.

**Costume cards** (`:hc`): a Legendary-or-better pull from a Halloween Pack
has a 10% chance of coming out with the player's costume headshot
(`headshot/halloween/`; Sam picked 10% over 0.5%, which made Trick or Treat
out of reach). A costume card is its own card: it never stacks or merges
with the Halloween copy of the same game. Only Halloween Packs give them.

Only Halloween cards fill the event's sets, and a copy that is traded can't
be traded again for 48 hours. Card Art counts only art you pulled yourself
(checked against `card_packs`, on the page and in `claim_event_set()`).

| Set | Needs | Reward |
| --- | --- | --- |
| Graveyard | Isaac pick-six; game with a fumble; 6+ sacks; 10 or fewer total yards; 3+ interceptions | Legendary+ · 20 diamonds · 2.0x Booster |
| Card Art | a Halloween card art you pulled | Epic+ · 10 diamonds |
| Trick or Treat | a costume card of each of the six | Mystic+ · 40 diamonds · 2.5x Booster |
| U.F.O. | 50+ yd NFL passing or receiving TD; 70+ yd college one; 200+ receiving yard game; 400+ passing yard game | Legendary+ · 25 diamonds · 2.0x Booster |
| Holoween | an Epic-or-better holo of each of the six | Legendary+ · 30 diamonds · 2.0x Booster |
| October | 15 different Epic-or-better cards from October games | Legendary+ · 20 diamonds · 1.5x Booster |
| Witching Hour | a card of each of the six from October 25–31 | Epic+ · 12 diamonds · 1.5x Booster |
| Monster Mash | a Legendary-or-better card of each of the six | Legendary+ · 15 diamonds · 1.5x Booster |
| Halloween | all eight sets | the Iconic HALLOWEEN card · 100 diamonds · two 2.5x Boosters |

Every reward card is a Halloween card. The HALLOWEEN card is Sam's art of
Paxon and Cooper in the 2023 Holiday Bowl (`icon/cards/halloween-iconic.webp`,
week 19, 2023), with no sticker. Its two boosters are `"boosters": 2` in
`card_events.rewards`, which `claim_event_reward()` gives one at a time.

### Trades

The Trades panel on the Cards tab. **Propose a trade** opens a builder: pick
who with, tap up to six of your cards to give and up to six of theirs you
want, and send it. Asking for nothing makes it a gift. Each side has a
**Sort** button over its cards, and under it a search box (any of a player,
school, opponent, play, season or rarity, every word matching) with the
kinds, the player, the season, the rarity (holos last) and the order: rarest
first, highest score, newest pulls, by year or by game. The button counts
what is changed, and the bin puts it all back. Every signed-in player
can see every collection, so you can look through somebody's cards to choose
from them; signed out, nobody can.

Nothing moves until the other player accepts. Then both sides move in one
transaction, after a check that both of you still have what was put up. A
card can be in several offers at once, and only the first one accepted gets
it; the rest come back **Expired** when they are answered. The player who
offered can take an open offer back, and the other can decline it.

**New offers** show as a red circle with the count in white on the Cards link
in the nav (and on the Trades page button), so one does not sit unanswered
because nobody opened the tab. An offer stops counting once its player has
had the Trades page (`#cards/trades`) open with it on screen: the page marks
it seen (`mark_trades_seen()`, which sets `card_trades.seen_at`), so it is
seen on every device, and it keeps a red **New** tag until they leave the
page. Sets are still
claimed once per player, so cards passed around can help more than one
player finish a set.

`propose_card_trade()`, `respond_card_trade()` and `cancel_card_trade()` in
`supabase/schema.sql` do the work, and check that the cards are really
there, that only the player an offer is to can answer it, and that nobody
has more than ten offers out at once.

### The showcase

Up to six cards a player picks to show off, in one row, on their own player page under
the header. Anybody can see it, signed in or not. On your own page,
**Edit** turns each slot into Replace and Remove, and an empty slot into
**+ Add a card**, which opens your collection to pick from; **Save** puts it
up. Only cards you own can go up, and a card traded away comes down on its
own. A player with nothing up has no Showcase panel for anybody else.

Any of the six slots can hold one of your Player Cards instead: the picker
lists your Player Cards first, then your cards, and either goes in the slot
the same way, with the same Replace and Remove. A Player Card is kept as
`pc:{slug}` among the showcase's ids, can go up once you hold a card of that
player, and comes down on its own once you hold none.

**Anything on a showcase opens up close.** A card opens the way it does in
the collection, with who else has it. A Player Card opens as big as a card up
close, with whose it is, its rank and what that pays, the points and cards
behind it, how far it is to the next rank, what it has earned and about what
it pays a game (`zoomPlayer()` in `js/cards-view.js`).

### Admin controls

The Cards panel on the admin page shows every player's cards, different
cards, sets claimed, open trades and showcase.

**Demo a pack** rips a pack right there in the same overlay a real one opens
in, to try the openings out. Nothing is paid and nothing goes into anybody's
collection, the recent pulls or `card_packs`: it never touches Supabase.
**Best card** makes the last card a Legendary, Mystic or Iconic so those
openings can be seen without waiting on the odds, and **Another demo** rips
the same again.

Under it are two resets for one player or for everybody:

- **Clear library** takes every card out of the collection, empties the
  showcase, cancels open trades and resets the goals, so the player starts
  the Library over from nothing. Diamonds stay spent.
- **Reset goals** only lets every Library set be claimed again. Cards are
  kept.

Rewards already paid stay paid either way.

Neither runs until RESET is typed, and neither can be undone. Both are
database functions that refuse anybody who is not in `admins`.

### In the database

`player_diamonds` and `diamond_awards` (see *Diamonds* above, readable by
their owner and an admin), `player_cards` (who owns which ids and how many,
readable by any signed-in player), `card_packs` (every pack opened and what
was in it), `card_sales` (every quick sale, readable by the seller and an
admin),
`card_set_claims`, `card_trades` (readable by the two players in it) and
`card_showcases` (public). None has an insert, update or delete policy:
cards only move through `open_card_pack()`, `claim_card_set()`,
`quick_sell_card()`, the trade functions and the admin's two resets, each one
transaction, so a pack is never paid for without arriving, a trade never half
happens, a card is never sold twice and a reward is never paid twice. The small helpers those share (`give_card`, `take_card`,
`give_booster`, `owns_cards`, `prune_showcase`) are taken back from the
browser's roles, since they do no checking of their own. **Re-run `supabase/schema.sql` after pulling this change**,
or the tab says it cannot load the cards.

---

### The five pages

The tab is five pages, picked from a floating island of five icons near the
bottom of the screen (Sam's glyphs in `icon/cardtabs/`, after the Uiverse
"liquid" radio group): an orange slider glides under the picked icon, and each
icon keeps its page name as a hover title and for screen readers. The page goes into the address as `#cards/players`, `#cards/shop` and
so on, swapped in place so switching reloads nothing. A page not showing is
*parked* rather than hidden (`content-visibility: hidden`, falling back to
hiding it where a browser lacks that): it is not drawn, but it keeps its layout,
so going back to a binder of a couple of hundred cards is instant instead of
laying every card out again. The binder is also left alone when what it would
draw is what it already shows.

While a Cards page is on screen it checks in every twenty seconds, quietly:
where each trade stands (`tradeStates`) and the diamond balance, and on the Shop
page every other check the shelf, the market and the recent pulls. A new
offer, a card sold off the shelf, somebody's pack or a listing of yours sold
shows up without a reload, and only the part that changed is redrawn. Nothing
is redrawn while a pack or card is open, the trade builder or crop tool is up,
the phone's Sort menu is out, a box is being typed in, or within a few seconds
of a tap (`poll()` and `busy()` in `js/cards-view.js`).

- **Cards** — the collection and nothing else. The page itself scrolls it (no
  box inside the page), drawn a few rows at a time, with the filters pinned
  under the nav on a desktop.
- **Players** — the six Player Cards (below).
- **Shop** — the Daily Spin (gone once it is spun, until the next one),
  packs and Buy Diamonds, Today's Cards, the Market and Recent Pulls. The
  odds are not shown on the page.
- **Trades** — offers to you, your offers, recent ones. The page button
  counts the new offers to you, in red, until the page has been opened.
- **Achievements** — the library of sets. The page button counts sets ready
  to claim.

### Player Cards

Every account has a **Player Card for each of the six**, for their whole
career. It is the fantasy points printed on every copy of every one of his
cards the account holds — duplicates count again; a card sold, traded or up
on the market takes its points with it — graded on the card ladder:

| Rank | WR / RB | TE | QB | Bonus a game |
|---|---|---|---|---|
| Common | 1 card | 1 card | 1 card | — |
| Uncommon | 150 | 135 | 113 | +10% |
| Rare | 400 | 360 | 300 | +25% |
| Epic | 800 | 720 | 600 | +50% |
| Legendary | 1400 | 1260 | 1050 | +80% |
| Mystic | 2200 | 1980 | 1650 | +125% |
| Iconic | 7000 | 6300 | 5250 | +300% |
| GOAT | 28000 | 25200 | 21000 | +500% |

**GOAT** is a Player Card's alone: no play or performance card is ever GOAT,
so it is not one of the card rarities, and its rung in `PLAYER_RANKS` carries
its own name and colour. It looks like no other rank: a platinum frame
engraved in a diamond cross-hatch with prism fire and four sparkles, the
player in a platinum spotlight, a black plate
with the name in platinum foil, and a platinum foot with a crown before GOAT.
Up close the sparkles twinkle and a band of prism light sweeps across it.
GOAT takes four times Iconic's points. Iconic took 3500 points until Sam doubled it on
2026-10-20.

A quarterback's average card scores about 9.6, a back's or receiver's 13.4 and
a tight end's 11.9, so their rungs are ×0.75 and ×0.9 of a receiver's
(`RANK_SCALE`). **Every game the player plays pays the account a bonus**: the
game's diamonds before any booster, times the rank's bonus, rounded up. It
goes in `diamond_awards` as `pc-{slug}-w{week}` through
`pay_player_card_bonuses()`, on sign-in, when the admin publishes (their own
account; Postgres pays a Player Card only to whoever is signed in), and on any
open page within a minute of a week going out. Each game is paid once, at the rank
held when it is first paid, and never topped up; games at Common go in at 0.
The first time an account is paid, every game already out goes in at 0 (a
`pc-start` row marks it), so Player Cards pay from the next game on. A playoff
game's bonus is twice it, the same 2x as the game's own diamonds. A game's
bonus is held to 400. The ladder is `PLAYER_RANKS` in `data/cards.js`.

A Player Card follows Sam's sketch, in the binder card's frame in the
rank's colour:

```
[ PLAYER           | 354 FPTS ]
  his picture (team logo in the corner)
  Andrew Parr
  ALABAMA · TE
  EARNED 200 💎 · +10%
  [■■■■■■■             ]
        46 TO RARE
[ ◆ UNCOMMON          CAREER ]
```

**Earned** is every diamond that Player Card has paid you, all seasons (its
`pc-` rows in `diamond_awards`), and beside it the rank's bonus; hovering it
gives about what that is a game. On a player's own page the earned figure
comes from `showcased_player_cards()`, which adds it for the cards put up.
Before any card of his, the card is grey and the bar runs to Uncommon. The
bar is the colour of the rank held. The face is `playerCardFace()` in
`js/cards-view.js`. It is drawn on a binder card (`.ege-tcard`), so a Player
Card is exactly the height and width of a play or performance card and gets
the same effects for its rank: Rare's orange foil, the sheen from Epic up,
Legendary's purple glow, Mystic's moving gold and Iconic's holo. The Players
page lays the six out in three rows of two (one a row once the screen
narrows), each card as wide as one in the binder, with what it means beside
it: his name, FPTS and how many cards (and how many different) make them, a
bar and how many more FPTS reach the next rank (not what it pays: Sam,
2026-10-20, there and up close), what the
card has earned so far with its bonus now and about how much that is a game,
then two icon buttons in the button's ink, Sam's cards and player glyphs from
`icon/cardtabs/`: **See his cards** (the collection filtered to him) and
**Add photo** (*Change photo* once there is one), each saying so on hover.
**The card itself opens up close**, the same close-up as off a showcase.
The page is just the drop-down and the cards: no words above them, no
season's bonus total in the head and no Ranks & Bonuses table under them
(Sam, 2026-10-20; the ladder is above).

**Somebody else's Player Cards.** The drop-down above them, centred, switches
to any other account's six, and while somebody else's are up their picture
pops in beside it. Their cards come from their collection, which anybody
signed in can read; what theirs have earned comes from
`player_card_earnings()`, which hands over the Player Card totals from
`diamond_awards` and nothing else of it. **See his cards** opens their
collection filtered to that player. Photos can only be changed on your own.

**Your own photo on a Player Card.** **Add photo** beside a Player Card picks
a picture from the phone or computer, then opens the crop: the picture in a
frame the shape of the card's photo, dragged to move it and zoomed with the
slider, a pinch or the mouse wheel. **Crop** draws what is in the frame at
480×310 as a WebP of about 10–50 KB and shows the card with it; **Crop
again** goes back to the frame as it was left, and **Use this photo** keeps
it. Redrawing it that way also leaves the
camera's location data behind. It replaces the headshot on your copy of that
Player Card only, on the Players page and on your own page; **×** takes it
down. One photo per account per player, so 36 at most across the site.

They are rows in `card_photos` (`set_card_photo()`, `clear_card_photo()`),
each picture kept as a data URL in the row: 36 small pictures are a few
megabytes, so there is no storage bucket to set up. `set_card_photo()` turns
away anything that is not an image or is over about 100 KB, and anybody
without a card of that player. Anybody can see them, signed out too, the
same as a player's page. On the admin page the card table counts each
account's photos with a **Remove** that takes them all down, and Clear
library takes them down too.

**Player Cards can go in the showcase** on the player's own page, in the
same six slots as cards (see The showcase). Anybody can see them, signed
out too: `showcased_player_cards()` hands over only the cards of the players
put up, which is what their rank is worked out from. Player Cards that were
in the old row of their own (`card_showcases.player_cards`) move into the
slots, first, as many as fit, when the schema is re-run.

The collection's filter row ends in a bin that resets every filter and the
sort, and goes back to your own collection. Holos are picked from the rarity
drop-down, after Iconic.

Only problems show in the banner over the Cards pages and the Shop: an offer
sent or taken back, a sale, a buy or a listing that went through shows in
the page itself, with no green banner to say so. The admin page keeps its
banners, which carry the next step to take.

### Today's Cards and the Market

**Today's Cards**: six cards a day, the same six for everybody — one
Legendary and five rolled on the pack odds up to Epic. Common 10, Uncommon 12,
Rare 15, Epic 20, Legendary 25 diamonds (`SHOP_PRICES`, and
`buy_shop_card()` — change both). A card bought shows **SOLD** for everybody.
The shelf turns over at midnight Eastern: the first visitor of the day
proposes it (rolled from the date) and `card_shop_today()` keeps that one.

**The Market**: a player puts a card up at a price of 1–999 diamonds. It
leaves their collection while listed, goes to the buyer when bought (the
diamonds go to the seller), and comes back when taken down or after 24 hours.
Three listings a day each, counted over the last 24 hours whatever became of
them (`list_card_for_sale()`, `MARKET` in `data/cards.js`). Clear library
takes a player's listings down with nothing returned.

A card can go up two ways: **Sell a card** on the Market, which picks from
the collection, or **Sell** beside Quick sell on any card of yours up close
in the Cards page, which opens a price and **Put it up**. That Sell button
is greyed out once the day's three listings are used.

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

One of the six traded in the NFL sim during a season has the trade in his
season's file, `trades: { 'andrew-parr': [ { week: 9, from: 'detroit', to:
'dallas' } ] }`: from that week his games are the new team's, and every one
before it stays as he played it, for the team he played it for. The NFL Sim
tab stores a trade in Supabase (`sim_trades`) with the new team's games
until **Download the season files** writes it in. His schedule says
*Traded to Dallas* above the first game for the new team, the team pages
of that season list him on both, and a team he joined or left mid-season
shows its own record rather than his.

`result` and `stats` are null until a game has been played. Nothing generates
them — the numbers come from wherever you generate them and are typed in, by
hand or through the season editor. `booster` is the performance booster that
was riding on the game, or the wager (`wager-for` / `wager-against`, with
the `line` it was taken at beside it), and once a week is out that is where
it lives for
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
kickoff, no stat line, and nothing for the editor to ask for. An NFL bye week
in the regular season is the same row, `bye: true` with no `playoff`, on the
Sunday of its week, so the NFL's 18 weeks are all there.

`division: true` marks an NFL division game, the NFL's own asterisk (six of
the seventeen): the schedule stars it the way college stars a conference
game, and the legend says *division game*. An NFL game has
`conference: false`.

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

**2022** is in, played out in full and waiting to be published. The
fixtures are each school's real 2022 regular season — Isaac's at Texas and
Paxon's at North Carolina now — and Alabama and Texas meet in week 2, so
Andrew's and Isaac's files carry the same game from both sides. The results
are the real margins moved by what the six bring to their teams and a
game's worth of luck, and the postseason follows from them: Alabama beats
Georgia for the SEC title, Texas wins the Big 12, USC loses the Pac-12 title
game to Washington and UNC the ACC's to Clemson. The College Football
Playoff is the real four with the seeds moved (`EGE.brackets[2022]`):
Michigan v Ohio State in the Fiesta and Georgia v TCU in the Peach, Ohio
State beats Michigan, Georgia beats TCU 65-7, and Georgia wins the title
42-41 over Ohio State in week 19. Alabama, SEC champion but the first team
out, beats Texas in the Sugar Bowl. Postseason weeks 15, 18 and 19 are
Playoffs Week One, Two and Three. Every stat line was worked out from each
player's season, with each game's share moved by the opponent's 2022
defense and how the game went. The rosters, defense grades and the five
conference races (the Big 12 and the ACC are new, and the Pac-12 and Big 12
have no divisions) are in for 2022 too. Those were built from the
cfbfastR mirrors of ESPN's 2022 data on GitHub, since ESPN and 247Sports
could not be reached when they were written; the tools still read ESPN.
It shows once the season is rolled over and its weeks published, the same
as 2021.

Scouts are at four of each player's 2022 games, the four toughest on his
regular season: the strongest opponents by where they finished 2022 (their
end-of-season Elo in the cfbfastR schedules), with the defense he faces
counted in, run or pass. They are all regular-season games, so Intel shows
all four from week 1 and each one can still take a booster.

Paxon is a receiver and nothing else in 2022, with four carries all season.
Sam runs for over 2,000 yards, Cooper is USC's lead back with about 1,100
rushing and 500 receiving, and Andrew finishes with 17 touchdown catches. No
back, receiver or tight end scores more than three touchdowns in a game:
each one was less likely to land in a game that already had one. The season
has one injury, drawn at random with each player's chance going up as his
injury rating goes down: Jaykeb strains a hamstring against Iowa in week 8
and misses the trip to Penn State, which Ohio State still wins 44–31 with
Sam carrying more of it.

**2023** is in, its regular season played out in full and waiting to be
published, for both leagues. Sam (Seattle), Andrew (Detroit) and Jaykeb
(Houston) play their teams' real 2023 NFL schedules, all eighteen weeks
from nflverse with the bye in its week, and Paxon (North Carolina), Cooper
(USC) and Isaac (Texas) their schools' real 2023 regular seasons, weeks 0
to 13. The results are the real margins moved by what each player brings
to his team and a game's worth of luck, as in 2022, until the NFL sim
takes the NFL over from week 10 (see *NFL Sim* under the admin page): the
Lions finish 10–7 and first in the NFC North, the Seahawks 11–6 and first
in the NFC West, the Texans 8–9 and second in the AFC South, Texas 10–2,
North Carolina 9–3 and USC 8–4. Week 2 is Andrew's Lions against Sam's
Seahawks, 33–32 Detroit, and both files carry it from their own side.
The one injury is Andrew's, a groin strain in week 6 that keeps him out
against Tampa Bay and Baltimore. Jaykeb throws for about 4,000 yards as a rookie, Sam is
Seattle's second back behind Kenneth Walker, and Isaac throws 30
touchdowns. Scouts are only at the college players' games, four each as in
2022; an NFL player has nobody left to scout him.

The 2023 postseason is in weeks 19 to 22, the NFL's playoff weeks. The NFL
sim played the NFL's: Seattle beat Minnesota, New Orleans and Philadelphia
and lose Super Bowl LVIII 23–20 to Kansas City, and Detroit go out to San
Francisco in the wild-card round. The colleges' bowls are in week 19 with
the wild-card round, whatever their real dates (Sam, 2026-10-20), so both
leagues' Discord posts that week are headed Playoffs Week One. None of the
three plays a title game. Texas, Oklahoma and Oklahoma State finish level
at 7–2 in the Big 12; Texas and Oklahoma State never met, nobody beat both
of the others, and Oklahoma State lost to Iowa State, the best placed
school all three played, so Oklahoma (who beat Texas) and Oklahoma State
(who beat Oklahoma) play for the title and Texas is third. North Carolina
finish sixth in the ACC and USC fourth in the Pac-12. With Texas out of
the College Football Playoff, Florida State takes the last place in it,
so Louisville, the ACC's runner-up, goes to the Orange Bowl in its place
and its real Holiday Bowl spot goes to North Carolina, the best ACC team
left after NC State (Pop-Tarts Bowl). The bowls, played out from each
side's points for and against with seeded dice (seed 34), with each
player's line drawn under the same rules as the regular season:

- **Alamo Bowl** (Dec 28), the Big 12's first pick after the New Year's
  Six against the Pac-12's: Texas 33, Arizona 12. Isaac 21 of 35 for 268
  yards and 3 touchdowns.
- **Holiday Bowl** (Dec 27), the ACC against the Pac-12's next pick after
  Arizona: North Carolina 37, USC 32. Paxon 8 catches for 139 yards and a
  touchdown; Cooper 31 carries for 157 yards and 2 touchdowns, and 6
  catches for 77. Both files carry it from their own side, as week 2's
  Lions–Seahawks game does.

**2024** is set up and waiting, with all six in the NFL: Cooper went 7th to
Chicago, Paxon 34th to the Giants and Isaac 39th to Tampa Bay.
`stats/2024.js` holds each of their teams' real 2024 regular season from
nflverse's `games.csv`, weeks 1 to 18 with the bye in its week, the
kickoffs in each team's own time and every result still to come. The Bears'
London game (week 6, Jacksonville) and the Giants' Munich game (week 10,
Carolina) are `neutral`. `EGE.currentSeason` is still 2023, so only an
admin sees 2024 until it is rolled over to, and it has no block in
`data/conferences.js` yet.

**2025** is set up the same way, with the six on the same teams.
`stats/2025.js` holds each team's real 2025 regular season from
nflverse's `games.csv`, weeks 1 to 18 with the bye in its week, the
kickoffs in each team's own time and every result still to come; it
matches the sim's 2025 schedule in `nfl-sim/data/schedules.json` game for
game. None of the six's teams plays abroad in 2025, so nothing is
`neutral`. The Seahawks and the Buccaneers close on the Saturday of week
18, so the sim dates their playoff games from the Sunday after it.

**2026** is set up the same way, every result still to come, with each
of the six on the team he finished 2025 with: Sam on the Steelers and
Andrew on the Panthers after their 2025 trades. `stats/2026.js` holds
each team's real 2026 regular season from `nfl-sim/data/schedules.json`,
written the way the sim writes a traded player's games (`rowsFor` in
`nfl-sim/lib/six-trades.js`), so it matches the sim game for game. The
Steelers' week 7 game with the Saints and the Texans' week 6 game with
the Jaguars are abroad, so they are `neutral`. A move the sim makes
between seasons lands in the file's `trades` from week 1 and swaps in the
new team's games, the same as one made in season.

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

**2023** keeps the real scores for every game the six are not in: the Big
12, the ACC and the Pac-12 (all without divisions now), and the whole NFL.
ESPN could not be reached from the build, so the colleges came from
cfbfastR's copies of the 2023 schedules and the NFL from nflverse's
`games.csv`, not through the tool. The AFC and the NFC are `nfl: true`,
four divisions of four each, `games` the games inside the conference and
`nonConference` those against the other one. An NFL division is ordered
by the whole record, then head to head, the division record, the
conference record and the points differential, the way the league orders
one (`EGE.nflResults` and `nflDivisionTable` in `data/games.js`), so the
header line reads **1ST in NFC North**.

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

And a page left open keeps up by itself: once a minute while it is on screen
it asks the same again, along with the balances in the nav and the count of
new trade offers. A week gone out since pays the signed-in player there and
then (credits, game diamonds and their Player Cards' share) and redraws, so
nobody has to reload after a publish. The redraw waits while somebody is in
the middle of something: the portal or a card open, a sticker picked up or its
drawer out, a box being typed in, or a tap a moment ago. Nothing is asked while
the page is put away. All told an open page asks Supabase for about five small
things a minute, ten on a Cards page and under twenty on the Shop page.

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
- everybody is paid their game credits and diamonds, and both show on the
  schedule row that earned them
- the week goes to Discord, with a link back to the site

**Pull back** takes a week off the site again, one click, no confirmation,
as often as you like — testing this means publishing and unpublishing the
same week over and over. Credits already paid stay paid: an award is a ledger
entry, not a view of the schedule, so publishing again pays nothing twice.

**Post again** re-sends the Discord message without changing anything.

### How the Discord post gets sent

From 2023 there are **two channels**, one per league, each with its own
webhook: the college bot's and the NFL bot's. Publishing a week sends one
message to each league that has anybody playing that week (see *Two bots
from 2023* under the Discord scores bot), and the Weeks row says *Posted*
only once every one has gone; if one landed and the other did not, **Post
again** sends only the missing one.

**The webhooks are saved on the admin page.** Under the week list are two
boxes, *College bot webhook* and *NFL bot webhook*: paste each channel's
URL (Server Settings → Integrations → Webhooks) and press **Save**. They
go in the `discord_webhooks` table in Supabase, which only an admin can
read or write (`is_admin()`, the same check the rest of the site trusts),
so the URLs are never in the site's code where anybody who views source
could post to the channel as the bot. A saved box is never filled back in;
it shows *Saved (…abc123)*, the last six characters, and pasting a new URL
replaces it. To rotate one, delete the webhook in Discord, make a new one
and save that.

The admin's browser reads the saved URL with the admin's own sign-in and
posts straight to it, so the message lands on the click with nothing to
deploy.

**The edge function**, for a league with no webhook saved. The browser
hands `supabase/functions/post-week` the payload and its `league` instead;
the function checks the caller is an admin, reads the saved webhook the
same way, and otherwise uses its own secret for that league:

```
supabase secrets set DISCORD_WEBHOOK_URL_COLLEGE='https://discord.com/api/webhooks/...'
supabase secrets set DISCORD_WEBHOOK_URL_NFL='https://discord.com/api/webhooks/...'
supabase functions deploy post-week
```

The table needs `supabase/schema.sql` run again (it adds
`discord_webhooks` and `published_weeks.posted_leagues`). Until it is,
pressing Save says to run it first, and publishing still posts through the
function.

Either way the week is published before the post is attempted, so a message
that does not land is a message missing from a channel, not a week missing
from the site. **Post again** retries just the message.

A failed direct post never falls back to the function: a request that reached
Discord but whose reply the browser could not read looks exactly like one that
never arrived, and trying the other route would post the week twice.

### The trades bot

A third bot, in a channel of its own, posts nothing but trades (Sam,
2026-10-22): every trade that goes through in the NFL sim — approved from
the queue, made in the builder, or made from a team page's trade finder —
the moment it is saved. A free-agent move is a signing, not a trade, and is
not posted. The message is headed **Trade**, with an embed per team in its
colour and with its mark, saying what it receives: each player as position,
name and overall (one of the six underlined and bold, as in the draft
lists), each pick as its year and round, its number once the draft order is
known, and whose it was when it was not the giving team's own. The footer
says when in the sim it happened (*2024 Week 5*, *2024 trade deadline*,
*2025 offseason*). The marks are the site's own pictures: a webhook can only
use the server's `:CHI:` emoji by their ids. Each embed carries the week
posts' transparent spacer, `icon/spacer.png`, so every one is the full
width whatever is in it.

Its webhook goes in the third box under the week list, *Trades bot
webhook*, kept in `discord_webhooks` as `trades` (run `supabase/schema.sql`
again first: the table took the two leagues only). There is no edge
function or scheduled bot behind it; with no webhook saved, trades simply
are not posted. A post that does not land leaves the trade made and says
so.

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

A **credits marker** on the row says what the game paid, and a blue
**diamonds marker** beside it what it paid in diamonds — more than the credits
when a booster was on the game. Visible to the player and to an admin, nobody
else, the same rule the boosters follow. The column is headed *Paid*.

---

## The Admin Portal

`#admin`, a tab that only appears for an admin, and a page that refuses anyone
else. It holds everything Sam used to do from the shop page, plus the two
things that end a season.

It is split into **tabs** across the top — **Weeks** (the weeks, the Discord
bots folded away under a line, and the season file), **Accounts** (credits
and diamonds earned, and every account), **Cards**, **NFL Sim** and **End of
Season** — one at a time, so nothing needs scrolling past (Sam,
2026-10-19). The tab is in the address (`#admin/sim`), so a reload comes
back to it; plain `#admin` is Weeks.

**NFL Sim** runs the NFL sim (`nfl-sim/`) in the browser. The first time the
tab is opened it loads `js/nfl-sim.js` (the sim and its data, about 1.4 MB,
built by `node nfl-sim/build/bundle.js`) and the world from Supabase
(`nfl_sim_files`, gzipped, admin only — the world holds the team ratings,
which are never shown anywhere). **Start the world** takes the weeks the site
has already put out as played (the six's games from their season file,
everybody else's real scores) and the sim plays every NFL game after them.
Then: play a week or on to the deadline / the end of the regular season, the
playoffs a round at a time or all at once, the offseason and the draft (with
a team and round for any of the six still in college). Every week the sim
plays is **stored** for the site (Supabase `sim_weeks`, laid over the season
files by `js/stored-weeks.js`), so **Publish Week N** under Play puts it out
the way the Weeks tab's Publish does (the credits and diamonds it pays, the
Discord posts) with nothing committed, and the next week can be played
straight after: Play Week 5, Publish Week 5, Play Week 6. **Week stats**,
under Play, is what a week produced, the week just played unless another
is picked (each marked *not out* until it is published): the six's lines
and fantasy points, then a card for every game with its score and its
passing, rushing and receiving leaders, which opens to both teams' plays,
dropbacks, runs, yards, third downs and time of possession, every player
who threw, ran or was thrown to, sacks and picks, the scoring plays and
who got hurt (`nfl-sim/lib/weeks.js`). Games played before 2026-10-21 have
no box score, so theirs open to the scoring and injuries only. A stored week is
the whole week as the sim played it, for each of the six in the NFL: their
results, stat lines, big plays and injuries, every other NFL score for the
standings, and their playoff games as they reach them. Nobody but an admin
can read one until its week is out (a playoff game's fixture once the week
before it is), and a week that is out stays as it went out. Under Play, a week
the sim has played this season (or a playoff round) can be picked and
**Resim** plays it again on new dice, or **Undo** goes back to before it.
Either way every week played after it is undone, and so is anything changed
since (the week's entry says how many changes), a trade of one of the six
too; a week that is out on the
site, or one before it, can't be. Each week's save point is kept in
`nfl_sim_files` as `rewind-{season}-{week}.json`, fetched only when it is
used, and the offseason clears them. Before every step the six's boosters on
their games (`game_boosters`, then the season file once a week is out) and
their QB and O-Line Connections (`player_inventory`) are read for the sim:
a booster makes a good game likelier (a 2.5x locks in a solid to great one),
and a connection counts while that quarterback is playing (see
`nfl-sim/README.md`, section 5). **Upload the {year}
draft** takes the first rounds of the next draft written by hand, pasted or
from a file (the Discord lists, `7. :CHI: Cooper Clark`; numbered lines; a
CSV with Pick, Team and Player; or JSON), checks every pick against the order
and the class (unknown players, a team that does not own the pick,
duplicates, missing picks), shows them, and **Use this draft** keeps them:
those picks go exactly as written, can't be traded while they wait, and the
sim drafts the rest. The 2024 draft goes in the order from the 2024 mock
draft doc in every round, whatever the sim's own 2023 said, and every real
pick trade made before the 2023 kickoff moves its 2024 or 2025 pick
(`nfl-sim/data/draft-orders.json`). Trades wait for
**Approve** or **Reject**, and so does any star (85 or better) who would
leave his team in free agency: he stays put unless Sam approves the move.
Sam's own trades come from a builder: a team on each side, players and
picks added from dropdowns, then **Make the trade** (straight through) or
**Propose** (queued with what both teams think). Every trade that goes
through is posted by the trades bot (see *The trades bot*). The **Player editor** sets
any player's overall and ceiling — on a team, a free agent, or a prospect
in the class the next draft takes — **The six’s archetypes** sets each of
the six's (the website keeps their ratings, the sim keeps this), and
**Rosters by season** shows every
team's roster as each season ended (and this one as it stands), with who
arrived and who left since the season before. **Put it on the
site** downloads `stats/{year}.js` and `data/nfl-results.js` with the
stored weeks written in (and the stickers on weeks that are out), to commit
whenever it suits -- the end of the season, or any time -- and says which
stored weeks the committed files do not have yet. Each file keeps `stored`,
when each week written in was saved: a week stored after that (played again,
or undone) is laid over the file's copy, and a correction made in the file
afterwards stands. After each step the rosters go to `nfl_sim_rosters` for the Teams
pages (a box turns that off). The world can be downloaded, loaded back and
started over. A step that fails saves nothing, and a world saved from
another tab since the page loaded it is refused rather than overwritten.

**Accounts** — every balance and everything each player owns. Set a player's
credits or diamonds (each box has its coin or diamond after it, and Save
writes only the one that was changed, so it never puts back a number a game
has paid into since), hand an item over without charging for it, remove
anything, or pay an award off the earnings table — a salary or an honour,
which all stack. An award is added straight onto the balance and not logged
anywhere; the offseason 60 is not in the list, because it pays itself.

Above the six, **everybody at once**: a number, credits or diamonds, and
**Add** (on top of every balance; a minus number takes it off, never below
nothing) or **Set** (every balance becomes that number, after a confirm,
since nothing keeps the old ones). Every player with a sign-in, one at a time,
read then written; a balance that cannot be read is left alone and named.

**Cards** — who has how many cards, sets claimed, open trades and showcase,
**Demo a pack** to try the pack openings out without paying or keeping
anything, and the two resets, **Clear library** and **Reset goals**, for one
player or everybody. See *Cards → Admin controls*.

**Credits & Diamonds Earned** — what the season has paid out so far, by
player: the touchdowns or fantasy points scored, what the games paid, the
allowance, and the diamonds the games paid. Awards handed out by hand are not
counted.

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
- **Client viewer mode** — an admin's portal has a switch that draws the
  whole site the way a player sees it (Sam, 2026-10-20): no Admin tab, no
  team overalls, nobody else's credits or boosters, no season ahead of the
  live one. It stays on, on that device, until it is switched off
  (`EGE.wallet.viewerMode`; `EGE.wallet.admin()` answers no while it is on
  and `realAdmin()` still knows). It changes only what the page shows: the
  database still treats the account as an admin.
- **Overalls** — a rating per attribute (speed, strength, catching, route
  running, etc. — final attribute list TBD) plus a single overall.
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
- `js/wallet.js` — credits, diamonds and inventory: balances, buying, using,
  paying out a season, swapping credits for diamonds, and the admin's reach
  across every account (one balance or everybody's at once).
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
  them to five a season), the credit awards a season pays out, diamonds and
  their awards, which weeks are published (and which leagues' Discord
  posts have gone), the Discord webhooks (the two leagues' and the trades
  bot's), the card collection, and the NFL sim's world, rosters, stored
  weeks (`sim_weeks`) and the six's trades (`sim_trades`). Run
  it in the Supabase SQL editor; it is safe to run again, and it must be
  re-run after pulling a change that adds a table. **Re-run it after
  pulling this change** so `sim_trades` is there for the six's trades.
- `supabase/functions/post-week/` — an edge function that posts a week to
  the college or NFL channel for an admin, from the saved webhook or its
  own secret, for a league with no webhook saved on the admin page.
- `js/supabase-config.js` — your Supabase URL and anon key. Blank by default.
- `data/shop.js` — the shop catalogue: credit earnings and everything on sale.
- `data/cards.js` — the card game: what a card is, how it is graded, the
  rarities and their odds, the packs, and the library's sets. See *Cards*.
- `js/cards.js` — the card collection in Supabase: owned cards, set claims,
  opening a pack and claiming a set.
- `js/cards-view.js` — the Cards tab: packs, buying diamonds, the rip, the
  collection, trades and the library.
- `js/diamonds-view.js` — the diamonds page (`#diamonds`), opened from the
  diamond balance in the nav: the latest games that paid diamonds, and the
  holos, sets and market sales that did.
- `js/sounds.js` and `sound/` — the pack rip, card flip and big-pull
  sounds, and how loud each one plays.
- `js/showcase.js` — the showcase on a player page, and editing your own.
- `js/cards-admin.js` — the Cards panel on the admin page and its two resets.
- `js/nfl-sim-admin.js` — the admin page's NFL Sim tab, which loads
  `js/nfl-sim.js` (the NFL sim, built by `node nfl-sim/build/bundle.js`;
  never edited by hand).
- `js/nfl-rosters.js` — every NFL team's roster for the Teams pages, from
  `data/nfl-rosters.json` or `nfl_sim_rosters` in Supabase, whichever is
  newer.
- `js/lines.js` — the point spread on every game the six have left, for
  the wagers (see Wagers).
- `data/nfl.js` — the 32 NFL teams: name, division, colour, page address.
- `data/nfl-results.js` — the NFL scores the sim played, written by the NFL
  Sim tab or `node nfl-sim/sim.js site`.
- `js/stored-weeks.js` — the weeks the NFL Sim tab stored in `sim_weeks`,
  laid over the season files and `data/nfl-results.js` whenever the
  published weeks load (and by the Discord bot), so a week can be played and
  published with nothing committed. The six's trades (`sim_trades`) go
  under them the same way.
- `data/economy.js` — every number about credits in one place: what a rating
  point costs, how much overall a point is worth, what a touchdown pays, and
  the tuning behind all of it. Nothing else in the site invents a price. What
  a game pays in diamonds, and what a credit buys of them, are here too.
- `icon/diamond.svg` — the diamond beside a diamond balance, used as a mask
  the way `icon/coin.png` is.
- `data/season.js` — which season is live, and which seasons have had their
  ratings locked. Small on purpose: the admin portal rewrites this whole file
  when a season is rolled over.
- `stats/{year}.js` — one per season: every fixture, and the score, stat line
  and booster for each once it has been played. Nothing else holds a schedule;
  the only other stat lines are the NFL Sim tab's stored weeks, until they are
  written in here (`js/stored-weeks.js`).
- `js/site-data.js` — the list of seasons, and the tags it writes for the
  three files the admin regenerates, cache-busted so a committed correction is
  on the site rather than ten minutes behind it.
- `sw.js` — a service worker that makes the browser check every one of the
  site's own files with the server on each load, so a push is on the site the
  next time it is opened rather than ten minutes later.
- `data/games.js` — how everything else gets at those games, and the one place
  that decides what "played" means.
- `data/offers.js` — who has offered whom, each school's sticker colour
  and mark, and each player's recruiting stars, 247 rating and state rank. The
  offers themselves are kept as a record but are not drawn anywhere.
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
  rather than by hand. See *Conference standings*. From 2023 it holds the
  NFL as well, the AFC and the NFC (`nfl: true`) with their divisions and
  every real 2023 regular-season score, from nflverse.
- `data/logos.js` — every college team ESPN carries (about 770, every
  division) against the id ESPN files its logo under, keyed by the name the
  season files use, and `EGE.logoFor(name)`, which turns one into an image
  address on ESPN's server. Written by `tools/build-logos.js`. The NFL's
  32 are `EGE.nflLogos`, by hand, against their file in `icon/nfl/`
  (`Seahawks`, `Lions`, `Texans`), and `EGE.logoFor` checks them first,
  and `EGE.nflLogosOnLight` before those.
- `data/defenses.js` — every FBS and FCS school's rushing and passing yards
  allowed a game, by season, and where each ranks at its level. Written by
  `tools/build-defenses.js` from ESPN's box scores; add the new year to its
  `SEASONS` and run it again when a season starts. The schedule's ODEF
  grade is read from it in college; the NFL's are graded from the rosters
  instead and are not in it.
- `data/rosters.js` — the quarterbacks, backs, receivers and tight ends on
  each of the six's teams (college, and the NFL from 2023), by season, each with his class, overall, ESPN
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
  exactly the same thing. Also a trade, for the trades bot.
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
