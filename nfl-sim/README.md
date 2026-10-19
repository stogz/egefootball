# EGE Football NFL Sim

A simulation of the whole NFL, built to run alongside the website: every team,
every rostered player, their schemes, games, seasons, aging, the draft, free
agency and trades. Sam Stogsdill, Andrew Parr and Jaykeb Stewart are in it as
ordinary players from 2023, and Paxon Hatch, Cooper Clark and Isaac Vitel join
in the 2024 draft. The rest of the league reacts to them the way it reacts to
anybody: defenses game-plan for them, teams trade for them, and their fit in
their team's scheme decides how much they help it.

Nothing here touches the live site. The folder is left out of the Vercel
deploy (`.vercelignore`), and team ratings are never written to the
repository, which is public: they are worked out when the sim runs and only
ever shown to whoever runs it.

**Contents**

1. [The league it starts from](#1-the-league-it-starts-from)
2. [Players](#2-players)
3. [Schemes and fit](#3-schemes-and-fit)
4. [Team ratings](#4-team-ratings)
5. [Games](#5-games)
6. [Seasons](#6-seasons)
7. [The offseason](#7-the-offseason)
8. [Trades and Sam's approval](#8-trades-and-sams-approval)
9. [Running it](#9-running-it)
10. [Files](#10-files)

---

## 1. The league it starts from

Kickoff of the 2023 season, the first season three of the six are in the NFL.

- **Rosters** are each club's real Week 1 roster — the 53, the game-day
  inactives and injured reserve — from [nflverse](https://github.com/nflverse/nflverse-data):
  1,946 players.
- **The 2023 draft went the EGE way.** Every rookie the EGE mock draft names
  (the "2023 NFL Combine and Mock Draft" doc) is on the team that took him
  there: Jaykeb second to Houston, C.J. Stroud fourth to Indianapolis, Anthony
  Richardson seventh to Las Vegas, Bijan Robinson twelfth to Detroit, Andrew
  eighteenth to Detroit, Jahmyr Gibbs to Dallas, Sam 52nd to Seattle, Zach
  Charbonnet to New Orleans, and so on. Every other rookie is where he really
  went.
- **Schemes** are what each team really ran in 2023 (section 3).

## 2. Players

Every player has:

| | |
| --- | --- |
| `ovr` | Overall, 50–99. |
| `skills` | Four to six position skills on the same scale, which say *how* he is good. |
| `archetype` | A name for his style: Deep Threat, Possession Receiver, Dual Threat, Power Back, Man Corner, Centerfielder… |
| `pot` | Potential: the ceiling his overall grows toward while he is young. Hidden. |
| `longevity` | 1–99, 50 the norm: how well he holds off age. Hidden. |
| `durability` | 1–99: how rarely he gets hurt. |
| `age`, `born` | From his real birth date. |
| `contract` | What he is paid and the last season it runs through. |

### Overall

Nobody publishes a rating for every NFL player, so the sim works one out from
what each player really did, the way a scout folds a season into a grade
(`build/ratings.js`):

1. **A season score** for every player and season, from the numbers that
   matter at his position, each as a z-score against the rest of the position
   that year. Playing time is always one of them — the coaches who see him
   every day are the best scouts there are.

   | Position | What the score is made of |
   | --- | --- |
   | QB | EPA per play, completion % over expected, dropbacks |
   | RB | Rush yards over expected, yards after contact, EPA, scrimmage yards, snap share |
   | WR, TE | Yards per game, yards per target, EPA per target, target share, snap share |
   | EDGE, DI | Pressures, sacks, tackles for loss, missed tackles, snap share |
   | LB, CB, S | Passer rating and yards per target allowed, interceptions and breakups, tackles, missed tackles, snap share |
   | OT, IOL | Snap share and games (and the market, below) |
   | K, P | Field goal %, 50-yarders, net punting |

   Efficiency numbers are pulled toward replacement level by how little he
   did, so twelve good snaps do not outrank a whole good season.
2. **The 2023 score**: 2022 counts 65% and 2021 35% (2020 stands in for a
   season lost to injury). What the market pays him counts a quarter for a
   veteran on a second contract — half for linemen, who have little else to
   go on — and his draft slot counts in his first three years.
3. **The overall**: players are ranked at their position and the rank read
   off one curve, counted in starters: the best starter in the league about
   98, the middle starter 79, the last starter 73, backups in the 60s and
   the bottom of a roster at 50. Rookies are rated from where they were
   picked: about 77 for the first pick, 68 at the end of the first round, 62
   in the seventh.
4. **By hand** (`build/hand-set.js`): stars whose 2022 was lost to injury
   (Cooper Kupp, T.J. Watt, Lamar Jackson), the best offensive linemen, and
   the 99s. 99s are rare — one a position at most. In 2023 there are five:
   Patrick Mahomes, Justin Jefferson, Travis Kelce, Nick Bosa and Aaron
   Donald. After every offseason only the best player at a position can
   stay a 99.

The six are the exception: their overalls and skills come from the
website's ratings, shop purchases included, read fresh every time the sim
loads. Jaykeb starts as an 83, Sam a 74, Andrew a 70.

### Skills

| Position | Skills |
| --- | --- |
| QB | accuracy, deep, arm, poise, mobility |
| RB | power, elusive, speed, vision, hands, block |
| WR | deep, route, hands, yac, speed, size |
| TE | route, hands, deep, yac, block, speed |
| OT, IOL | passBlock, runBlock |
| EDGE | rush, run, speed, cover |
| DI | rush, run |
| LB | cover, run, blitz, speed |
| CB | man, zone, ball, speed, tackle |
| S | range, box, cover, ball, speed |
| K | power, accuracy |

Skills come from each player's real style: a receiver's depth of target and
20-yard catches make his `deep`, Next Gen Stats separation his `route`, his
drop rate his `hands`, yards after catch over expected his `yac`, his combine
40 his `speed`. Weighted the way the position weighs them, a player's skills
always average out to his overall: two 88 receivers are equally good, but
not good at the same things.

### Potential, longevity, durability

- **Potential** for a player under 28 blends what his age and draft slot say
  he should grow into with how good he really became in 2023–2025. So Puka
  Nacua (a 66 in 2023) has a ceiling around 90 and Brock Purdy around 93, and
  a bust has a low one. The sim still rolls its own dice — players beat their
  ceilings and fall short of them — but the ceilings are real ones.
- **Longevity** for a player 27 or older compares his real 2023–2025 to what
  his age alone would have done: Derrick Henry, who stayed great into his 30s,
  has a 92.
- **Durability** is the share of games he played in 2020–2022.

## 3. Schemes and fit

Every team runs one offense and one defense (`lib/schemes.js`).

| Offense | How it plays | What it needs |
| --- | --- | --- |
| West Coast | Quick timed throws underneath, backs and tight ends in the passing game | Accurate, poised QB; route runners with good hands; receiving backs |
| Wide Zone | Outside-zone runs, bootlegs and play-action, motion | A back with vision and speed; YAC receivers; a tight end who blocks; athletic linemen |
| Air Raid | Three and four receivers, the ball pushed downfield | A big arm with deep accuracy; fast deep receivers; pass protectors |
| Spread Option | The QB is a runner: zone reads, RPOs, designed runs | A mobile QB first of all; elusive, fast backs |
| Power Run | Under center, heavy personnel, gap runs, play-action shots | A back who runs through people; blocking tight ends; road-grading linemen; a QB who can push it deep |

| Defense | How it plays | What it needs |
| --- | --- | --- |
| Cover 3 | Single-high zone, a safety in the box | A rangy free safety; a box safety; zone corners with speed |
| Quarters | Two deep safeties, a light box | Safeties who cover; linebackers who cover; it can be run on |
| Cover 1 Man | Press-man corners, one deep safety, pressure from everywhere | Man corners with speed; blitzing linebackers |
| 3-4 Pressure | A nose tackle, two rushing outside linebackers, disguised pressure | Edge rushers; a run-stuffing nose |
| Tampa 2 | A four-man rush, everyone else in zone | Edge rushers who win alone; a fast middle linebacker; zone corners |

A team's **tendencies** — how often it throws in a close game on early
downs, how deep, play-action, screens, QB runs, which way it runs, who gets
targeted; and on defense how often it plays man, two-high and blitzes — start
from what it really did in 2023, measured off every snap of the 2023
play-by-play (nflverse, with FTN's charting and Next Gen Stats' coverage
calls). Its scheme is the one its numbers look most like, with the 2023
play-caller's own system deciding the handful of close calls (Sean McVay's
Rams are Wide Zone, Steve Spagnuolo's Chiefs are Cover 1 Man).

A player's **fit** in a scheme is his skills weighted by what the scheme
needs at his position, less his overall: above zero he is better in it than
his overall says. Teams draft, trade and sign by fit, and change scheme when
their roster fits another one better.

Fit is not a bonus added on top in games; it falls out of how games are
played. A short-throwing, scrambling quarterback throws few deep balls, so a
Ja'Marr Chase beside him gets few deep targets and what makes him great is
used less. On a team whose quarterback throws deep, the same Chase is worth
much more.

## 4. Team ratings

Each team's overall (50–99) is how many points better or worse than an
average team it plays, measured by the game engine itself: its offense
against every defense in the league and its defense against every offense,
over thousands of simulated drives. So it includes everything — the players,
how they fit the schemes, and how the units fit each other — and nothing is
added by hand. Alongside it are unit ratings (pass offense, run offense, pass
rush, coverage, run defense) and the team's scheme fit.

Team ratings are private: never shown on the site, never committed. The sim
prints them for whoever runs it, and its reports go to the project's own
folder.

## 5. Games

Every game is played snap by snap (`lib/game.js`): about 125 plays, with the
clock, field position, downs and distance, punts, field goals, fourth-down
decisions, the two-minute drill and overtime. Each snap:

1. **The call.** Run or pass, from the team's tendencies and the situation
   (third and long, protecting a lead, the end of a half). A pass has a depth
   — short, intermediate or deep — and may be play-action or a screen; a run
   goes inside or outside, or is the QB's.
2. **The defense** picks man or zone, one deep safety or two, and whether to
   blitz, from its tendencies.
3. **The pass rush** against the protection: pressure, sacks and scrambles,
   from the rushers' `rush` and the blockers' `passBlock`, with blitzes and
   quick throws moving the odds.
4. **The throw.** Who it goes to depends on depth: deep balls go to deep
   threats, short ones to route runners, backs and tight ends. Whether it is
   caught, how far, and whether it is picked off is the quarterback's skill
   for that depth and the receiver's against whoever covers him — a corner's
   `man` or `zone`, a safety's `range` on deep balls, a linebacker's `cover`
   underneath.
5. **The run.** The back's vision, power and elusiveness behind the line's
   `runBlock`, against the front's `run` and the number in the box. Breakaway
   runs come from speed, and a safety with range is what stops them going the
   distance.

That is where the matchups Sam described come from. Great safeties take the
deep balls away from a team that lives on them; a two-high defense that does
that leaves a light box to run against; a blitz-heavy defense gets burned by
quick throws and helps itself against a slow-developing deep game.

Every game records a box score for every player who touched the ball or made
a play. Players get hurt (more often the less durable they are), and an
injured starter's backup plays until he is back.

Before a game the sim can give an **assessment**: each side's offense against
the other's defense, unit by unit — "Detroit's pass rush against Seattle's
protection", "Seattle's deep passing against Detroit's safeties" — and the
expected score.

The engine is checked against the real 2023 season (`node nfl-sim/check.js`):
league-wide points, yards, completion rate, sacks and interceptions should
land on 2023's averages, and the predicted margin of every 2023 game should
track the Vegas line and the real result.

## 6. Seasons

- **Schedules** are the real ones for 2023–2026 (the sim's 2024 Lions play the
  real 2024 Lions' opponents) and NFL-formula schedules after that.
- **Standings and tiebreakers**: division, then conference; tiebreakers by
  record, head-to-head, division record, conference record and point
  differential, the order the site already uses.
- **Playoffs**: seven teams a conference, byes for the top seeds, the Super
  Bowl.
- **The trade deadline** comes after Week 9 (section 8).

The 2023 regular season already happened on the site, so the sim's job starts
with what comes after it. A 2023 season can still be simulated for testing.

## 7. The offseason

In the order the real league does it:

1. **Aging** (`lib/aging.js`). Everybody is a year older.
   - Young players grow toward their potential, quickly at 21 and less each
     year: a 22-year-old closes about 38% of the gap in a year, a 26-year-old
     about 24%, with a roll of the dice on top. Now and then a player breaks
     out and finds a higher ceiling.
   - Past his position's peak a player declines, a little more each year, and
     past its cliff age each year carries a chance of a sudden 5–12 point
     drop. Some players fade slowly and some fall off a cliff.

     | Position | Peak through | First-year decline | Cliff risk from |
     | --- | --- | --- | --- |
     | RB | 26 | 1.5, then +0.9 a year | 28 |
     | CB | 28 | 1.8, then +0.9 | 30 |
     | WR | 28 | 1.2, then +0.8 | 31 |
     | LB | 28 | 1.5, then +0.8 | 31 |
     | S | 29 | 1.5, then +0.8 | 31 |
     | EDGE | 29 | 1.4, then +0.8 | 32 |
     | TE | 29 | 1.2, then +0.7 | 32 |
     | DI | 29 | 1.3, then +0.7 | 32 |
     | OT, IOL | 30–31 | 1.0, then +0.6 | 33–34 |
     | QB | 33 | 1.0, then +0.6 | 36 |
     | K, P | 35 | 0.5, then +0.3 | 39 |

     These come from real careers: measured across every NFL player from
     1999 to 2023, backs' production falls from 26 by about 10% a year,
     receivers' from 28 and tight ends' from 29, and quarterbacks hold up
     into their mid-30s. A player's longevity scales his decline: a 90
     declines about half as fast as a 50.
   - Physical skills (speed, elusiveness, a corner's man coverage, a
     quarterback's legs) fall faster than mental ones, so an aging receiver
     turns into a possession receiver and may stop fitting his scheme.
   - The six do not age here: their overalls move when they train on the site.
2. **Retirements**, likelier the older and the worse he is, by position.
3. **Contracts and free agency.** Each team re-signs the expiring players it
   still wants; the rest are free agents. Teams sign them by need, fit and
   what they can pay — with a salary cap, so nobody hoards stars — and an old
   player gets less than a young one of the same overall.
4. **Coaches and schemes.** A team that lost badly may fire its staff, and a
   new staff brings a scheme. A team keeps its scheme otherwise — unless its
   roster now fits another one clearly better (say its deep-ball quarterback
   retired and its best players are a scrambler and a power back), or it is
   rebuilding and willing to try something new.
5. **Trades**, pre-draft (section 8).
6. **The draft.** Seven rounds in reverse order of the standings (playoff
   teams by how far they went). The classes are the real 2024, 2025 and 2026
   drafts — Caleb Williams, Jayden Daniels, Malik Nabers, Brock Bowers… —
   graded by where they really went, with ceilings from how good they really
   became; Paxon, Cooper and Isaac are in the 2024 class. Where anyone goes is
   the sim's own: each team's board is the best prospect adjusted for its
   needs and his fit in its schemes. After 2026, classes are generated. Sam
   can place any of the six by hand (`draft --place`).
7. **Rosters** are cut to 53.

A team is in one of three modes — **compete**, **retool** or **rebuild** —
from its rating, its record and the age of its best players. It decides what
the team buys and sells.

## 8. Trades and Sam's approval

Trades are proposed by the teams and **only happen when Sam approves them**.

Twice a year — before the draft and at the trade deadline — every team looks
at itself: where it is weakest, which positions fit its schemes worst, and
whether it is competing or rebuilding. Teams with a need go looking for
players on other teams who would fill it *and fit their schemes*; teams
selling look to move players who are aging, surplus, or a poor fit for them.

A trade only gets proposed if both sides come out ahead in their own eyes:

- **Player value** comes from his overall (each point at the top is worth
  far more than one in the middle), his position (a quarterback is worth more
  than a running back), his age and potential, and his contract. Age is where
  the decline curves bite: a 29-year-old back is worth a fraction of a
  24-year-old of the same overall, so teams trade regressing players for less
  than young ones.
- **Picks** are valued on the Rich Hill draft value chart, with future picks
  discounted.
- **Each team adds its own view**: a contender pays more for help now; a
  rebuilding team pays more for youth and picks and less for anyone over 28;
  a player who fits the buyer's scheme is worth more to it than to a team he
  does not fit.

Proposals go into a queue with the reasoning written out ("Chicago is
rebuilding and gets a first-round pick; Kansas City gets the deep threat its
offense lacks"). Sam approves or rejects each one; anything still waiting
when the window closes expires. A trade involving one of the six is marked,
and Sam can also put together his own trade for the sim to apply.

## 9. Running it

Everything runs with Node from the repository root, no install needed. The
running league (every season played, every pending trade) lives in a world
folder outside the repository — for the project that is
`/mnt/project-files/nfl-sim/world` — set with `NFL_SIM_WORLD` or `--world`.

```
node nfl-sim/sim.js status                 where the league is, and what is waiting on Sam
node nfl-sim/sim.js rankings               power rankings: team ratings, units, fit (private)
node nfl-sim/sim.js team DET               a roster, depth chart and scheme fit
node nfl-sim/sim.js player "Sam Stogsdill" a player's card
node nfl-sim/sim.js matchup DET SEA        the pre-game assessment
node nfl-sim/sim.js week                   play the next week
node nfl-sim/sim.js season                 play the rest of the regular season
node nfl-sim/sim.js playoffs               play the postseason
node nfl-sim/sim.js offseason              aging, retirements, free agency, coaches, then the pre-draft trade window
node nfl-sim/sim.js trades                 the proposals waiting on Sam
node nfl-sim/sim.js approve 3              apply trade 3
node nfl-sim/sim.js reject 3               turn trade 3 down
node nfl-sim/sim.js draft                  the draft (--place paxon-hatch=CHI to place one of the six)
node nfl-sim/sim.js new-season             cut to 53 and start the next season
node nfl-sim/sim.js report                 write the private reports to the world folder
```

## 10. Files

```
nfl-sim/
  README.md            this
  sim.js               the command line
  check.js             the engine against real 2023
  lib/                 the sim
    teams.js           the 32 teams and divisions
    schemes.js         the schemes, their tendencies and demands, fit
    skills.js          position skills and archetypes
    ege.js             the six, read from the website
    aging.js           development, decline, retirement
    ...
  build/               builds data/ from nflverse
    build-league.js    the 2023 league, prospects, schedules, benchmarks
    evidence.js        each player's seasons
    ratings.js         season scores and the overall curve
    skills.js          skills from real style
    schemes.js         2023 tendencies from the play-by-play
    hand-set.js        overalls set by hand
    nflverse.js        downloads and CSV
  data/                what the sim starts from (committed)
    league-2023.json   teams and players, Week 1 of 2023
    prospects.json     the 2024-2026 draft classes
    schedules.json     the real 2023-2026 regular seasons
    benchmarks-2023.json  real 2023 scores and lines
```

To rebuild the data: `node nfl-sim/build/build-league.js` (downloads about
250 MB from nflverse into the system's temp folder the first time).
