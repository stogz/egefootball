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
   Donald. After every offseason the best player at each position becomes
   its 99 if he has reached 96, and nobody else at the position can be one,
   so there are 99s every year (ten to thirteen of them, in the seasons
   tested) and never two at a position.

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
his overall says. It is measured against the league as it is — the typical
NFL player of 70 or better fits every scheme at 0 — so no scheme looks
better for everybody. Teams draft, trade and sign by fit, and change scheme
when their roster fits another one better.

Fit is not a bonus added on top in games; it falls out of how games are
played. A short-throwing, scrambling quarterback throws few deep balls, so a
Ja'Marr Chase beside him gets few deep targets and what makes him great is
used less. On a team whose quarterback throws deep, the same Chase is worth
much more.

## 4. Team ratings

Each team's overall (50–99) is how many points a game better or worse than
an average team it is, measured by the game engine itself
(`lib/team-ratings.js`): every team plays every other team on a neutral
field, with nobody getting hurt, and the overall is 75 plus two for every
point of average margin. So it includes everything — the players, how they
fit the schemes, how the units fit each other — and nothing is added by hand.
Alongside it are unit ratings (pass offense, run offense, protection,
coverage, pass rush, run defense, takeaways) and how well the roster fits
the team's schemes.

Team ratings are private: never shown on the site, never committed. They are
worked out when `rankings`, `report` or the offseason runs, printed for
whoever runs the sim, and saved only in the world folder.

## 5. Games

Every game is played snap by snap (`lib/game.js`): about 125 plays, with the
clock, field position, downs and distance, penalties, punts, field goals,
fourth-down decisions, the two-minute drill and 2023's overtime rules (ten
minutes in the regular season, a touchdown on the first possession wins;
playoff games go on until somebody wins). Each snap:

1. **The call.** Run or pass, from the team's tendencies and the situation
   (third and long, protecting a lead, the end of a half). A pass has a depth
   — short, intermediate or deep — and may be play-action or a screen; a run
   goes inside or outside, or is the QB's.
2. **The defense** picks man or zone, one deep safety or two, and whether to
   blitz, from its tendencies — and leans toward what the offense does most:
   a team that throws deep a lot sees more two-high shells, one that runs a
   lot sees more men in the box.
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

The average NFL starter (an 80) is the zero point: a better player moves the
odds his team's way, a worse one the other way. The home team gets about two
points.

That is where the matchups Sam described come from. Great safeties take the
deep balls away from a team that lives on them; a two-high defense that does
that leaves a light box to run against; a blitz-heavy defense gets burned by
quick throws and helps itself against a slow-developing deep game.

Every game records a box score for every player who touched the ball or made
a play. Players get hurt during plays (more often the less durable they are)
— most for a game or two, a few for the season — and the next man up plays
until he is back.

Before a game the sim can give an **assessment** (`matchup`): each side's
offense against the other's defense, unit by unit — "Detroit's pass rush
against Seattle's protection", "Seattle's deep passing against Detroit's
safeties" — the key one-on-ones, and the expected score and win chance over
a thousand simulated games.

**Checked against the real 2023 season** (`node nfl-sim/check.js`, which
plays the real 2023 schedule from the kickoff league). Points, plays, pass
rate, completion rate, yards a throw and a carry, sacks, interceptions,
third downs, field goals by distance and punts all land within a few
percent of 2023's league averages, and the home team wins by about two.
Two things run low: penalties (the real count includes every flag, declined
and offsetting ones too) and fourth-down tries, about 12% short. Played from
what was known at kickoff, the sim picks the real winner of 64% of 2023's
games (the Vegas favorite won 68%), and its team-by-team margins line up
with Vegas's (r = 0.58). The misses are the teams whose 2023 nobody saw
coming: the Jets lost Aaron Rodgers four snaps in, the Chargers and Giants
fell apart, and Brock Purdy was far better than a seventh-round rookie's
numbers said.

A whole season and its playoffs take about half a second.

## 6. Seasons

- **Schedules** are the real ones for 2023–2026 (the sim's 2024 Lions play the
  real 2024 Lions' opponents) and NFL-formula schedules after that: six
  division games, a division from each conference on rotation, and three
  same-place games, with byes in Weeks 5–14.
- **Standings and tiebreakers**: head-to-head, division record, conference
  record, point differential, points scored, then a coin flip.
- **Playoffs**: seven teams a conference, a bye for each top seed, the Super
  Bowl on a neutral field.
- **The trade deadline** comes after Week 9: the season stops there while
  any proposals wait on Sam (section 8).

The world plays its own 2023 season from the kickoff league. The site's 2023
results are not read in: the sim is its own world from Week 1 of 2023 on, and
what happens to the six in it is the sim's, not the site's.

## 7. The offseason

In two parts, so Sam can look at the pre-draft trades between them.

**`offseason`**, after the Super Bowl:

1. **Aging** (`lib/aging.js`). Everybody is a year older.
   - Young players grow toward their potential: about 40% of the gap between
     his overall and his ceiling in a year through 25, more after, so most
     are close to it by 27 or 28 — when real players were. A roll of the dice
     on top, and now and then a player breaks out and finds a higher ceiling.
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
   - **The scale holds still.** Over the years one position would otherwise
     drift — quarterbacks, who last, up; backs down — and a 90 would stop
     meaning what it means now. So each position's top group is set against
     the same group in 2023, and everyone at the position moves half of the
     way back, never more than 3 points a year. Who is better than whom never
     changes.
   - **The 99s** (section 2).
   - The six do not age here: their overalls move when they train on the site.
2. **Retirements**, likelier the older and the worse he is, by position. A
   free agent nobody signs for a year retires too.
3. **Cap casualties.** A team over the new cap cuts the veterans it overpays
   most for what they now are, until it is under.
4. **Contracts.** Each team re-signs the expiring players it still wants and
   can pay. It keeps nearly all its young starters and stars (extensions,
   fifth-year options and the franchise tag see to that), so only a few good
   players reach the market, most of them older or not starting. The six are
   always kept: where they play is Sam's call.
5. **Free agency.** The best free agents first, each to the team that needs
   him most, fits him best and can pay him, keeping some room back for its
   draft class. Contenders pay for veterans; rebuilding teams stay away from
   anyone 29 or older. An older player gets less than a young one of the same
   overall.
6. **Modes, coaches and schemes.** Each team is in one of three modes —
   **compete**, **retool** or **rebuild** — from its rating, its record and
   the age of its best players, which decides what it buys and sells. A team
   that won four games or fewer fires its staff more often than not (one
   that won eleven or more never does), and a new staff usually brings the
   schemes the roster fits best. A team that keeps its staff changes scheme
   only when its roster now fits another one clearly better (its deep-ball
   quarterback retired and its best players are a scrambler and a power
   back), or now and then when it is rebuilding and wants to try something.
7. **Pre-draft trade proposals** for Sam (section 8).

**`draft`**, once Sam has been through the trades:

1. Anything still pending expires.
2. **The draft.** Seven rounds in reverse order of the standings (playoff
   teams by how far they went), traded picks going to whoever owns them. The
   classes are the real 2024, 2025 and 2026 drafts — Caleb Williams, Jayden
   Daniels, Malik Nabers, Brock Bowers… — graded by where they really went;
   after 2026 the sim makes its own. Every prospect's ceiling is drawn for his
   draft slot from what the players taken there in 2019–2022 became (a top-ten
   pick is an 88 on average, a seventh-rounder a 71, about 6.5 either way),
   leaning on how good he really became for the 2024 and 2025 classes. Teams
   do not see ceilings: each board is the prospect's grade, adjusted for the
   team's needs and his fit in its schemes, with some scouting noise. Paxon,
   Cooper and Isaac are in the 2024 class, rated from the website. Sam can
   place any of them by hand (`--place`); one placed on a team with no pick
   left there signs with it as an undrafted rookie.
3. Free agency again for the leftovers, then **rosters are cut to 53**: the
   least valuable go, never one of the six.
4. The new season's schedule.

Run for years, the league holds steady: in seven seasons tested (2023–2029)
the average overall stayed at 74–75, with about 400 players at 80 or better
and 80–105 at 90 or better (2023 has 403 and 90), every team at 53, payrolls
around the cap, every scheme in use, and two to eight trade proposals a
window.

## 8. Trades and Sam's approval

Trades are proposed by the teams and **only happen when Sam approves them**
(`lib/trades.js`).

Twice a year — before the draft and at the trade deadline — every team that
is not rebuilding (and, at the deadline, not losing) looks at its two
biggest needs: positions where its starters are furthest below a typical NFL
starter. It goes after players on other teams who would start for it, fit
its schemes and fit under its cap. A team lets a player go if it is
rebuilding, if it is losing at the deadline, if he is aging and it is
retooling, or if he is not starting for it.

A trade only gets proposed if both sides come out ahead in their own eyes:

- **Player value** (`lib/value.js`) is what he gives a team over the next
  four seasons, less what it has to pay him. What he gives grows steeply
  with his overall (each point at the top is worth far more than one in the
  middle) and with his position (a quarterback 1.6, a back 0.7), and the
  later years follow the aging curves, so a 29-year-old back is worth a
  fraction of a 24-year-old of the same overall and regressing players go
  for less than young ones. A veteran paid what the market pays is worth
  little in a trade; a good player on a rookie deal is worth a lot.
- **Picks** are on the Rich Hill draft value chart (1,000 points for the
  first pick), placed where the team that owns them is expected to finish,
  with each year out counted 15% less.
- **Each team adds its own view**: a contender pays more for help this year;
  a rebuilding team pays more for picks and much less for anyone 29 or older;
  a player is worth more to a team that needs his position and whose schemes
  he fits.

The buyer offers the cheapest package — one to three picks and young
backups, at most one player — the seller takes. Proposals go into a queue
with the reasoning written out:

```
2023-D2 [pending]
  Giants get Paulson Adebo (CB, 74, age 24); Saints get Isaiah Hodgins (WR, 69, age 24) and 2025 4th-round pick and 2024 4th-round pick.
  - Saints are 2-7 and selling and get Isaiah Hodgins (WR, 69, age 24) and 2025 4th-round pick and 2024 4th-round pick.
  - Giants need a corner: Paulson Adebo (74, man corner) would start over Aaron Robinson (70) and fits their Cover 1 Man defense well (+2.4).
  - By their own numbers Giants value him at 4.8 and give 3.5; Saints value him at 3.9 and get 4.1.
```

Sam approves or rejects each one; anything still waiting when its window
closes expires. In season, a team that took in more players than it sent
releases the difference and one that took in fewer signs free agents, so
both stay at 53. A trade that moves one of the six is marked, and so is one
that would cost one of them his starting job. Sam can write his own trade
too: the sim says what each side thinks of it and queues it like any other.

When one of the six changes teams in the sim, the website's transfers have
to be updated by hand; the sim says so.

## 9. Running it

Everything runs with Node from the repository root, nothing to install. The
running league — every season played, the trade queue, ratings and reports
— lives in a world folder outside the repository: in the project that is
`/mnt/project-files/nfl-sim/world`; elsewhere `NFL_SIM_WORLD` or `--world`
sets it (or it falls back to `nfl-sim/world`, which git ignores).

```
node nfl-sim/sim.js status                      where the league is, and what is waiting on Sam
node nfl-sim/sim.js week                        play the next week (or playoff round)
node nfl-sim/sim.js season                      play on to the deadline, or the end of the regular season
node nfl-sim/sim.js playoffs                    play the postseason
node nfl-sim/sim.js standings
node nfl-sim/sim.js rankings                    team ratings, units and schemes (private)
node nfl-sim/sim.js team DET                    roster, depth chart, ages, ceilings, fit, payroll
node nfl-sim/sim.js player "Sam Stogsdill"      a player's card, fit in every scheme, this season's stats
node nfl-sim/sim.js matchup DET SEA             Detroit at Seattle, sized up (--neutral for a neutral field)
node nfl-sim/sim.js offseason                   aging through free agency, then the pre-draft trades
node nfl-sim/sim.js trades [all]                the proposals waiting on Sam (all: every one ever)
node nfl-sim/sim.js approve 2024-O3             apply a trade
node nfl-sim/sim.js reject 2024-O3              turn one down
node nfl-sim/sim.js trade "DET: Andrew Parr, 2025 R2 / SEA: Kenneth Walker"
                                                Sam's own trade: each side lists what that team gives
node nfl-sim/sim.js draft                       the draft, cut to 53, the next season's schedule
node nfl-sim/sim.js draft --place cooper-clark=LAC --place isaac-vitel=DET:2
                                                put one of the six on a team (in a round)
node nfl-sim/sim.js report                      a written report (ratings included) into the world folder
node nfl-sim/sim.js reset --force               start the world over from the 2023 kickoff
```

A year goes `season` (stopping at the deadline if there are trades), `trades`,
`approve`/`reject`, `season`, `playoffs`, `offseason`, `trades`,
`approve`/`reject`, `draft`. Trade ids are the season, D for the deadline, O
for the offseason or S for Sam's own, and a number.

Every command that plays games is seeded from the world and where the league
is, so the same world always plays out the same way.

## 10. Files

```
nfl-sim/
  README.md              this
  sim.js                 the command line
  check.js               the engine against the real 2023 season
  lib/                   the sim
    teams.js             the 32 teams and divisions
    schemes.js           the schemes, their tendencies and demands, fit
    skills.js            position skills and archetypes
    ege.js               the six, read from the website
    league.js            loading and saving the world
    lineup.js            depth charts and who plays
    game.js              the game engine
    assess.js            the pre-game assessment
    team-ratings.js      team ratings (private)
    schedule.js          real and formula schedules
    standings.js         standings, tiebreakers, playoff seeds
    season.js            weeks, injuries, the deadline, the playoffs
    aging.js             development, decline, retirement, the rating scale
    value.js             what players, picks and contracts are worth; the cap
    rosters.js           needs, contracts, free agency, cutdowns
    draft.js             draft classes, ceilings, the draft
    trades.js            proposals, the queue, approving
    offseason.js         the offseason, in order
    rng.js               the seeded dice
  build/                 builds data/ from nflverse
    build-league.js      the 2023 league, prospects, schedules
    benchmarks.js        real 2023 league averages and games
    evidence.js          each player's seasons
    ratings.js           season scores and the overall curve
    skills.js            skills from real style
    schemes.js           2023 tendencies from the play-by-play
    hand-set.js          overalls set by hand
    nflverse.js          downloads and CSV
    write.js             writing the data files
  data/                  what the sim starts from (committed)
    league-2023.json     teams and players, Week 1 of 2023
    prospects.json       the 2024-2026 draft classes
    schedules.json       the real 2023-2026 regular seasons
    benchmarks-2023.json real 2023 averages, scores and lines
```

To rebuild the data: `node nfl-sim/build/build-league.js` (downloads about
250 MB from nflverse into the system's temp folder the first time).
