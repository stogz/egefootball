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

**Stars, for an admin** (`lib/fit.js`). A fit is in overall points, and
how wide fits run differs by position (linebackers and linemen far wider
than tight ends), so for the Teams pages it is read against the spread of
fits at his position across every scheme on his side of the ball, among the
league's players of 70 or better: 2.5 stars is an ordinary fit, each
standard deviation a star, five stars about the best one in thirty, in
halves. A team's stars for its offense and its defense are its starters'
fits read the same way (the quarterback counting double, injured starters
too), set against the other 31 teams at a star and a quarter a standard
deviation. Only an admin ever sees either.

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

### The six's boosters and connections

Two things the six buy on the website come into their games
(`lib/boosts.js`):

- **A booster** on a game does not make him play 1.5, 2 or 2.5 times as
  well. It makes a good game likelier: the game is played more than once
  and one version is kept. With a 1.5x it is the better of two for him (on
  fantasy points), with a 2.0x the best of three, and with a 2.5x one of
  his best four of twelve, which locks in a solid to great game without
  handing him his best one every time. Whether any of the six gets hurt is
  settled by the first version, so a booster never keeps anybody healthy.
  Played 1,500 times each, Sam against Arizona:

  | | Under his median | Under his bottom quarter | Over his top quarter |
  | --- | --- | --- | --- |
  | No booster | 48% | 24% | 26% |
  | 1.5x | 23% | 7% | 45% |
  | 2.0x | 13% | 3% | 56% |
  | 2.5x | 4% | 2% | 68% |

  A booster is read from the season file once its week is out, and from
  Supabase's `game_boosters` before that. Wagers change nothing. The other
  games of the week are played on the same dice either way.
- **A connection** counts while that quarterback is the one playing. A
  receiver, back or tight end with a QB Connection is looked for more and
  caught a little more often; a quarterback's O-Line Connection means fewer
  pressures and sacks. Each level is worth about 1.7 times the one before,
  so I to III change little, IV and V are noticeable, and VI is a Mahomes
  and Kelce connection; past VI it still grows, by less each time. Andrew
  with Jared Goff against Green Bay (1,500 games a level):

  | Level | – | I | II | III | IV | V | VI | X |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Targets a game | 5.6 | 5.7 | 5.9 | 6.3 | 7.0 | 8.0 | 9.6 | 10.3 |
  | Share of the targets | 17% | 18% | 18% | 20% | 22% | 25% | 30% | 32% |

  A back starts from far fewer targets and goes to about three times his
  share at VI. Jaykeb with his line against Indianapolis is sacked on 7.1%
  of dropbacks without it, 5.9% at IV and 3.8% at VI.

  The connections come from `player_inventory` (`qb-connection`, the level
  in `quantity`, the quarterback in `target`).

On the admin page both are read from Supabase before every step. On the
command line a `live.json` in the world folder stands in for them, with the
same rows: `{ "boosters": [game_boosters rows], "inventory":
[player_inventory rows] }`.

**What a team does, for an admin** (`lib/tendencies.js`, `tendencies CHI`,
or the Tendencies panel on an NFL team's page). The numbers above that the
engine reads off a team to call its plays, each with where it ranks among
the 32: how often it throws, play-action, outside runs, the share of
designed runs its quarterback keeps (its tendency scaled by the starter's
mobility: 1.6 times it for a Justin Fields or a Jalen Hurts, down to a
fifth of it for a quarterback who cannot run), the depth of its throws and how its targets split; on defense
man, two high, blitz and the box. Then who gets the ball: carries and
targets a game expected from the lineup as it is (the team against every
other team twice, nobody hurt, the six's connections counted) beside the
season's. What decides a back's carries is all here: how often his team
runs, how many of those runs its quarterback keeps, and the split between
the two backs, the first getting 1.4 times the second's share at the same
overall, more the better he is than the second. The engine has no fatigue,
hot hand or usage rule that changes week to week; the score does the rest
(a team 14 down in the second half throws more, 14 up runs more).

**Every game's record** in `games-YEAR.json` keeps its score, scoring
plays, leaders, injuries and the six's lines, and since 2026-10-21 both
teams' numbers (`teams`: plays, dropbacks, carries, yards, third downs,
time of possession...) and a box score (`box`: everybody who threw, ran,
was thrown to, or got a sack or a pick). `games 12` (or **Week stats** on
the NFL Sim tab) shows a week from it (`lib/weeks.js`).

Before a game the sim can give an **assessment** (`matchup`): each side's
offense against the other's defense, unit by unit — "Detroit's pass rush
against Seattle's protection", "Seattle's deep passing against Detroit's
safeties" — the key one-on-ones, and the expected score and win chance over
a thousand simulated games.

**The offseason is checked too** (`node nfl-sim/check.js --offseason
--years 6`): from the 2023 kickoff in a world of its own, every draft's
first four rounds are full and all their picks are on a 53, every team is
at 53, the league keeps 360–480 players at 80 or better and 70–130 at 90
or better (2024–2029: 426–456 and 97–115), each kind of team leaves about
the cap room it should, nobody is more than 3% over, and a starter develops
faster than a backup. Each line passes or fails, and a failure exits 1.

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
- **Playing a week again** (`lib/rewind.js`). Before the sim plays a week
  or a playoff round, the league and the trade queue are kept as that
  week's save point (`rewind-{season}-{week}.json`; playoff rounds are
  Weeks 19-22, as on the site). `resim 12` puts the league back to before
  Week 12 and plays it again on new dice; `undo 12` only goes back. Either
  way every week played after it is undone, and so is anything done since:
  an edit, a signing, a trade approved. Every undo moves the world on to a
  new take, so nothing after it comes out the same way. A week out on the
  website can't be undone, nor one before it, and weeks taken in from the
  site have no save point. The offseason clears the season's save points.

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
   - **Starting is experience** (Sam, 2026-10-26). Every regular-season
     game counts who started it (the quarterback, a back, three receivers,
     a tight end, five linemen, the eleven on defense, the kicker and
     punter, as game day lines them up), and a player still growing who
     started his team's games closes a fifth more of the gap to his
     ceiling, gains three quarters of a point on top (and his ceiling a
     point), and is likelier to break out, each in proportion to the share
     he started. A 24-year-old 74 with an 85 ceiling grows about 6 points a
     year starting and 4.5 on the bench. Michael Penix starting for
     Pittsburgh develops faster than he would as a backup; a backup
     develops as he always did. Games the sim did not watch (taken in
     from the site, or played before it counted) go by the end-of-season
     depth chart.
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
   players reach the market, most of them older or not starting.

   **The six's free agency is Sam's** (2026-10-30). When
   one of the six's deals runs out he is a free agent, and every team that
   wants him makes an offer (`lib/six-offers.js`): a team he would start
   for, or one that needs his position badly enough, with the room to pay
   him. It offers what the market pays his overall, more the keener it is
   and the more it is out to win now, for as long as a player his age gets
   (three or four years at 26); his own team always offers, and makes room
   for him up to a point. In a six-season test each of them had 4 to 14
   offers (a 92 quarterback asking $50M a year the fewest). The NFL Sim tab
   lists them, a row a team: the deal, where he would stand there ("Starts
   over Evan Engram (72)"), his fit in its scheme in stars, and whether it
   is competing, retooling or rebuilding, with last season's record. Sign
   takes one. Until then every team that offered keeps the money and his
   spot through free agency, and the draft waits until all of them have
   signed. A new team is his from Week 1 of the new season on the website
   (`lib/six-trades.js`). One of the six cut between seasons, or not
   drafted, gets offers the same way; the AI never signs any of them.
5. **Free agency.** The best free agents first, each to the team that needs
   him most, fits him best and can pay him, keeping some room back for its
   draft class. Contenders pay for veterans; rebuilding teams stay away from
   anyone 29 or older. An older player gets less than a young one of the same
   overall. A room that already has its bench signs only a player who would
   start, and none takes more than a camp's worth (four quarterbacks, six
   backs, five tight ends, nine receivers...).

   **Big moves wait for Sam.** A star — 85 or better, or 80 and an 85 last
   season — who would leave the team he played for goes into the queue like
   a trade (`2024-F1`, F for free agency): "Christian McCaffrey (RB, 99, age
   28) leaves the 49ers for the Chiefs: 4 years, $14.1M a year." Until Sam
   approves, the player stays with his old team on the deal the new one
   offered, and the new team keeps the money and the spot set aside;
   approved, he goes. Turned down or left waiting until the draft, he stays.
   Kickers, punters and the six never wait. About ten a year.

   **Depth.** Then every team fills each room to a full bench before the
   draft — three quarterbacks, four backs and a fullback, six receivers,
   three tight ends, four tackles, five interior linemen, five edge rushers,
   five interior defensive linemen, five linebackers, six corners, four
   safeties — with the best free agents it can pay, or camp bodies.
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

**`draft`**, once Sam has been through the trades and each of the six in
free agency has signed:

1. Anything still pending expires.
2. **The draft.** Seven rounds in reverse order of the standings (playoff
   teams by how far they went), traded picks going to whoever owns them. The
   classes are the real 2024, 2025 and 2026 drafts — Caleb Williams, Jayden
   Daniels, Malik Nabers, Brock Bowers… — graded by where they really went.
   **The 2027 class** (Sam, 2026-10-30: "based on a few mock drafts") is the
   real college players of fall 2026 — Jeremiah Smith, Leonard Moore, Colin
   Simmons, Arch Manning… — 338 of them, graded by the consensus of four
   October first-round mocks (CBS, FanSided, FOX, PFF) and five big boards,
   one of them 321 deep (`build/class-2027.js`, its lists in
   `build/class-2027-sources.json`): his average spot on the nine lists, a
   list that leaves him out counting him just past its end (or where the
   deep board has him, if further) and a mock that leaves him out counting
   him where the boards have him. Who he is — ESPN id, height, weight, class
   — comes from cfbfastR's 2026 college rosters; ages go by class, as the
   rosters have no birthdays. ESPN has no NFL picture of a player drafted
   before the real 2027 draft, so the class is marked `collegePhoto` and the
   website shows each one's college headshot, in the NFL too. Where they go
   is still the sim's draft, by its order and every team's needs. After 2027
   the sim makes its own classes. Every prospect's ceiling is drawn for his
   draft slot from what the players taken there in 2019–2022 became (a top-ten
   pick is an 88 on average, a seventh-rounder a 71, about 6.5 either way),
   leaning on how good he really became for the 2024 and 2025 classes. Teams
   do not see ceilings: each board is the prospect's grade, adjusted for the
   team's needs and his fit in its schemes, with some scouting noise. Paxon,
   Cooper and Isaac are in the 2024 class, rated from the website. Sam can
   place any of them by hand (`--place`); one placed on a team with no pick
   left there signs with it as an undrafted rookie.

   **A draft written by hand** (`lib/draft-plan.js`). Sam can upload the
   first rounds of the next draft himself, at any point before it, as the
   Discord lists (`### Round One`, `7. :CHI: __**Cooper Clark**__`),
   numbered lines with a team and a player, a CSV with Pick, Team and
   Player columns, or JSON. Each pick is checked against the order and the
   class: an unknown player (with the nearest name), a team that does not
   own the pick, a player or pick in twice, and a round with picks missing
   are all errors, and nothing is kept until it reads cleanly. Those picks
   then go exactly as written, the six included, and the sim drafts the
   rest. While the draft waits, the picks it covers are out of every trade.

   **Picks out to 2030** (`lib/picks.js`, Sam 2026-10-22). Every team has
   its own seven picks in every draft through 2030, and six drafts ahead
   after that: as each draft is held the year six out is added (2031 at
   the 2025 draft). A world saved with fewer is filled in the next time it
   opens. Picks more than three drafts off are valued with their slot
   drifting back to the middle of the round (nobody knows where a team
   will be). The AI's own trades and the packages the trade finder builds
   still use only the next three drafts' picks; Sam's trade builder and a
   pick's own trade finder take any of them.

   **An order set by hand** (`data/draft-orders.json`). A year can have its
   order fixed: the first round, the teams tied on record (who take turns
   each round, the first of them in one round picking last of them in the
   next, as in the NFL) and pick trades made before the 2023 kickoff, which
   the starting league does not have. 2024's is the order in the "2024 NFL
   Combine and Mock Draft" doc: New England first, Chicago second and
   seventh (Carolina's pick), Houston with Cleveland's first, Arizona with
   Houston's, New Orleans with Denver's second, Philadelphia with New
   Orleans' and Green Bay with the Jets'. It goes for all seven rounds,
   whatever the sim's own 2023 standings say. Every real pick trade made
   before the kickoff is there (from nflverse's trades.csv, 2026-10-22):
   56 for 2024, Miami's forfeited third among them (an owner of `null`),
   and 11 for 2025, a year listed with trades and no order, so its picks
   move and the sim's standings still set it. Conditional picks are in
   where the condition is known (Ridley, Hockenson, Mayfield, Reagor,
   Mullens); swaps and conditions nobody can settle yet are left out. Each
   trade is made once, the first time a world opens with it, and only for
   a pick its own team still has, so the sim's trades always stand
   (`league.officialTrades` keeps which are done).
   Every draft has all seven rounds and never fewer than four full ones:
   a team missing from an order picks last in that round, a pick missing
   from the league (and not forfeited) goes back to its team, and a draft
   that would still come up short stops with an error. The draft's report
   on the admin page lists every round, each opening to its picks with
   how many made a 53.
3. Free agency again for the leftovers, then **rosters are cut to 53**: the
   least valuable go, never one of the six and never a pick from the first
   four rounds of the draft just held (Sam, 2026-10-26: the 2025 cut had
   let go two first-rounders and a third of the second round). A young
   player's room to grow counts for him, so a late-round rookie with upside
   beats a veteran backup of the same overall, and a room's extras go by
   that worth, not by overall alone. Every 53 keeps a real bench: at
   least two quarterbacks, three backs, five receivers, three tight ends,
   four tackles, five interior linemen and four at each defensive spot (four
   safeties, five corners), and never more than a room uses (three
   quarterbacks, five backs, seven receivers, four tight ends...).
4. **The room gets spent** (`spendRoom`, Sam 2026-10-26). With the 53s
   set, a team with more cap room than its kind keeps — 1% of the cap
   for a contender, 4% retooling, 8% rebuilding — spends it, contenders
   first: on up to three free agents of 70 or better who would start for
   it, at 15% over the market for a contender (a rebuilding team takes
   nobody over 27), each replacing its least valuable player; then on
   extending its players whose deals run out this year or next, the best
   first, at what the market pays them. Stars of 85 or better and the six
   are left out of it. A team still over the cap after all that lets its
   most overpaid veterans go and signs minimum players to stay at 53.
   Tested over 2024–2029: contenders leave 1–2% of the cap, rebuilding
   teams 3–8%, nobody more than 3% over.
5. The new season's schedule. From 2027 on it is the sim's own, made from
   how the divisions finished, and the same in every browser and on the
   command line (a seeded shuffle, not a sort with a random comparison,
   which each engine does its own way). The NFL Sim tab's **Download the
   season files** gives the new season's `stats/{year}.js` from it as soon
   as the offseason starts: each of the six's regular season on his team
   (`six-trades.js seasonGames`).

Run for years, the league holds steady: in seven seasons tested (2023–2029)
the average overall stayed at 74–75, with about 400 players at 80 or better
and 80–105 at 90 or better (2023 has 403 and 90), every team at 53, payrolls
around the cap, every scheme in use, and two to eight trade proposals a
window. With the fuller benches (tested 2024–2028): 400–440 at 80 or better,
every team at 53 with three or four backs and three or four tight ends, and
9–15 big free-agent moves waiting on Sam each spring.

**Every season's rosters are kept** (`lib/history.js`). When a season ends,
every team's roster — every position, with its record — is saved in the
world as `rosters-{season}.json`. `rosters DET 2025` (or Rosters by season
on the admin page) shows a team's roster in any season kept, and who
arrived (from which team, drafted or signed) and who left (to which team,
retired or released) since the season before.

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

**The six, traded** (`lib/six-trades.js`, Sam 2026-10-23). Sam can trade
one of the six like anybody else, in season too, up to the deadline; the
teams never offer one of them at the deadline themselves. The games he has
played stay on his page as the team he played them for. From the week he
moves (the next one the league plays, or Week 1 of the next season between
seasons) his schedule is the new team's: each game with its real date and
kickoff on the team's own clock (`schedules.json`, nflverse's Eastern
times), its bye, and nothing past the regular season. The league keeps
every move (`egeTrades`), so undoing a week takes one back. The admin page
stores each as a row of `sim_trades` with those games, which every page and
the Discord bot lay over the season file (`js/stored-weeks.js`), and
**Download the season files** writes it in (`trades` in stats/{year}.js).
A wager on a game he no longer plays, or a booster on what is now his bye,
comes off; the booster goes back in his drawer. On the command line `site`
lays the moves over the season files it writes. Signing one of the six as a
free agent moves him the same way.

**The trade finder** (`lib/trade-finder.js`, `find-trades "Name"`, or **Find
trades** in a player's pop-up on the Teams pages) looks at every other team
for one player and keeps those that suit him better, all told: his stars in
its scheme against his stars now, its status (competing 1, retooling ½,
rebuilding 0) and record against his team's, and a star for a starting job
he does not have now. A team he would not start for while he starts now
never suits him better, and a rebuilding one never does for a player of 29
or more. Each that suits him and comes out ahead by its own numbers
(`valueOf`, the view every trade is weighed by) offers the cheapest package
his team takes, from its picks for the next three drafts and its players of
62 or better (none at his position, no kicker or punter, never its
quarterback, a starter of 85 or more or one of the six): one to four of
them, at most two players, with both teams under the cap afterwards or no
further over it than they were. His team can put more in with him (Sam,
2026-10-21): for each team, the four of its own players and picks (the same
rules) that team values most above what his team does are tried with him
one at a time, and the package must then cover both, so a bigger one comes
out even (`extras`, each player with his stars in the buyer's schemes). The
best six come back, one a team and as many with extras as without where
there are enough of both, as the trade builder's two sides, to make,
propose or open in the builder, each player the seller would get with his
stars in its schemes (`incoming`). `refresh` (1, 2, ...; `find-trades
--refresh 1`, or **Refresh** in the pop-up) shakes each trade's place up a
little and puts the ones already shown (`seen`) to the back, for another
set. The deadline holds as for any trade.

A pick is shopped the same way (`findPickTrades`, `find-trades 2026-R1-DET`,
or **Find trades** in a pick's pop-up on the Teams pages' Picks side, Sam
2026-10-22): every other team that comes out ahead by its own numbers
offers the cheapest package the pick's owner takes, alone or with one of
the owner's own players or picks it wants, under the same rules. The best
for the owner come first: its surplus, the buyer's, and half a point for
each player coming in who would start for it. Each says the owner's cap
space after.

On the admin page Sam builds his own trade from dropdowns: a team on each
side, then its players and picks added one at a time (one side can be
empty). **Make the trade** puts it straight through; **Propose** queues it
with what both teams think of it.

**Sam's edits** (`lib/edits.js`). Any player's overall and ceiling can be set
by hand — `edit "Drake Maye" --ovr 85 --pot 95`, or the admin page's player
editor. His skills all move by the same amount, so he is the same kind of
player and plays like the new number from the next game; his ceiling is
never below his overall. From there he ages and develops like anybody else,
toward the new ceiling. A prospect in a real class not drafted yet can be
edited too: the numbers are kept until the draft, and a new overall moves
where teams grade him. The six are rated on the website, not here.

The Teams pages give an admin the rest of `lib/edits.js` on the season being
played: `editPlayer` (overall, ceiling, archetype and any skill — new skills
make the overall they average to, `skills.js overallOf`, unless an overall
comes too), `freeAgents` and `signFreeAgent` (the + under a room, each free
agent with his stars in the team's scheme; he signs at `marketPay`),
`teamInfo` (schemes and mode) and `setScheme` (`scheme DET offense "Air
Raid"`, or the Offense and Defense dropdowns): the team's tendencies move
to the new scheme's the way a new staff's do (`offseason.js adopt`), and
it keeps the scheme (`offenseSet`, `defenseSet`) through the offseason's
fit switches until its coaches are fired. Archetypes come from
`ARCHETYPES` in `skills.js`; one picked by hand sets `archetypeSet`, and
`reRate` and development leave it alone from then on. Contracts too:
`setContract` sets what he is paid a year (up to $80M) and the last season
it runs through (this season to seven years out), so a raise, a pay cut or
an extension (`contract "Name" --apy 12 --through 2027`); `releasePlayer`
cuts him (`release "Name"`: a free agent from then on, no dead money, and
his team a man short until it signs somebody; one of the six only between
seasons); `teamPay` is a team's payroll, every player counted, against
`capFor`, with the cap for this season and the next three. Every edit is a
transaction (`kind` `edit`, `signing`, `scheme`, `contract` or `release`).

**The six's archetypes** are set here, though their ratings are the
website's (`archetype SLUG "Power Back"`, or the NFL Sim tab's **The six’s
archetypes**): `setSixArchetype` keeps it in `league.egeArchetypes`, which
`syncSix` puts back every time the world loads and the draft gives a
prospect of the six. With none set, his archetype is the one his skills
make (`archetypeOf`). Like anyone's, it is a name, and his skills decide how
he plays.

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
node nfl-sim/sim.js resim 12                    play Week 12 again on new dice (19-22: a playoff round)
node nfl-sim/sim.js undo [12]                   back to before Week 12 (alone: what can be undone)
node nfl-sim/sim.js standings
node nfl-sim/sim.js rankings                    team ratings, units and schemes (private)
node nfl-sim/sim.js team DET                    roster, depth chart, ages, ceilings, fit, payroll
node nfl-sim/sim.js player "Sam Stogsdill"      a player's card, fit in every scheme, this season's stats
node nfl-sim/sim.js matchup DET SEA             Detroit at Seattle, sized up (--neutral for a neutral field)
node nfl-sim/sim.js tendencies CHI              how a team calls plays and who gets the ball, expected and so far
node nfl-sim/sim.js games [12] [--season 2024]  a week as played: the six's lines, every score and its leaders
node nfl-sim/sim.js offseason                   aging through free agency, then the pre-draft trades
node nfl-sim/sim.js offers                      every team's offer for the six in free agency
node nfl-sim/sim.js accept sam-stogsdill SF     he takes the 49ers' offer
node nfl-sim/sim.js trades [all]                the proposals waiting on Sam (all: every one ever)
node nfl-sim/sim.js approve 2024-O3             apply a trade
node nfl-sim/sim.js reject 2024-O3              turn one down
node nfl-sim/sim.js trade "DET: Andrew Parr, 2025 R2 / SEA: Kenneth Walker"
                                                Sam's own trade: each side lists what that team gives
node nfl-sim/sim.js edit "Drake Maye" --ovr 85 [--pot 95]
                                                set a player's overall and ceiling (a prospect too)
node nfl-sim/sim.js contract "Drake Maye" --apy 12 --through 2027
                                                change what a player is paid and for how long
node nfl-sim/sim.js release "Drake Maye"        cut a player
node nfl-sim/sim.js archetype [cooper-clark "Receiving Back"]
                                                the six's archetypes, or set one ("" clears it)
node nfl-sim/sim.js find-trades "Khalil Herbert" [--refresh 1]
                                                teams he would suit better, and the trades
node nfl-sim/sim.js rosters DET [2025]          a team's roster that season, who came and who went
node nfl-sim/sim.js draft                       the draft, cut to 53, the next season's schedule
node nfl-sim/sim.js draft --place cooper-clark=LAC --place isaac-vitel=DET:2
                                                put one of the six on a team (in a round)
node nfl-sim/sim.js draft-order [2024]          every round's order and who owns each pick
node nfl-sim/sim.js upload-draft FILE           a draft written by hand (rounds 1-2, say), checked and
                                                kept for the next draft (--check: only check; --remove)
node nfl-sim/sim.js report                      a written report (ratings included) into the world folder
node nfl-sim/sim.js reset --force               start the world over from the 2023 kickoff

node nfl-sim/sim.js import-site --through 9     take the site's Weeks 1-9 as played
node nfl-sim/sim.js site [--season 2023]        write stats/2023.js and data/nfl-results.js
node nfl-sim/sim.js export                      write data/nfl-rosters.json for the Teams pages
```

**Taking a season up from the site.** The site had 2023 out through Week 9
before the sim existed, so `import-site` takes those weeks as they were
played: the six's games from `stats/2023.js` and everybody else's real
scores from `data/conferences.js`. Nobody gets a box score for them;
injuries heal week by week, the deadline comes after Week 9 as usual, and if
one of the six was already hurt, that was his one injury of the season. From
Week 10 the sim plays every NFL game. `site` writes the six's sim games into
their season file (scores, stat lines, big plays, injuries, and their
playoff games as their teams reach them; weeks it has not played yet are
emptied) and every other score into `data/nfl-results.js`, which the
standings use from the week the sim took over. Commit both and publish the
weeks as usual.

**The admin page.** The same commands, as buttons, are the admin page's NFL
Sim tab (see the site's README). There the world is kept in Supabase
(`nfl_sim_files`, admin only) instead of a folder, and after every step the
rosters are published to `nfl_sim_rosters` (`site.js publicRosters`: every
player on every team, with nothing private about him and his fit in his
team's schemes in stars, his seasons from 2025 on for his pop-up (`seasons`:
team, age and line, from `stats-{season}.json` and the season being played,
less every week the site has not published, taken off by the game log's box
scores, which keep every player's line with his id for it), the salary cap for the season and the three after
it, and each team's `systems`: its offense and defense, its stars for each
and its status, which the Teams pages show everybody since 2026-10-21; and
for the site's search, since 2026-10-26, the free agents and every retired
player with the season he retired and the team he last played for; and
since 2026-10-30 every season's playoff draw, `playoffs`, for the NFL
bracket on the six's pages: `playoffDraw` seeds it as `startPlayoffs` does,
or again from a past season's game log, and `playoffsOut` keeps a round's
games out until the week before it is published and their scores until its
own week is); and since 2026-10-30 the season's regular-season `schedule`
(`scheduleOut`: each game's week and teams, no scores, null in the draft
while the schedule kept is last season's) for the League page's weeks to
come); and for its upcoming free agents, on everybody whose contract runs
out with the season, what the market would pay him next season (`market`,
`marketPay`) and up to three teams likeliest to want him (`interest`,
`six-offers.js interested`); and since 2026-10-31 every approved trade for
the League page's Trade Report (`trades`, `tradesOut`: when, and what each
team got, a player at his overall then, a pick with its number and the
player it became). `lib/io.js` is what makes that
work: everything the sim reads or writes goes through it, to files on the
command line and to memory, filled from Supabase, on the page.
`build/bundle.js` writes `js/nfl-sim.js`, every module in `lib/` and the data
they read in one file; run it again after changing either.

**Stored weeks.** On the admin page every week the sim plays is also stored
in Supabase (`sim_weeks`, from `site.js weekRows`): the six's games as their
season file would have them and every other score of the week. The site lays
them over `stats/{year}.js` and `data/nfl-results.js` (`js/stored-weeks.js`),
so a week can be played, published from the tab and the next one played
without committing anything; the tab's download writes them into the files
whenever wanted. `site` here still writes the files from the world.

A year goes `season` (stopping at the deadline if there are trades), `trades`,
`approve`/`reject`, `season`, `playoffs`, `offseason`, `trades`,
`approve`/`reject`, `draft`. Trade ids are the season, D for the deadline, O
for the offseason, F for a big free-agent move or S for Sam's own, and a
number.

Every command that plays games is seeded from the world and where the league
is (and how many times a week has been undone), so the same world always
plays out the same way.

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
    io.js                where everything is read and written: files, or the admin page's memory
    run.js               the commands, shared by sim.js and the admin page
    site.js              the website's side: its weeks in, the season files and rosters out
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
    rosters.js           needs, contracts, free agency, depth, cutdowns
    draft.js             draft classes, ceilings, the draft
    draft-plan.js        a draft written by hand, draft orders set by hand, every team's picks
    picks.js             how far out the picks go (2030, then six drafts ahead)
    trades.js            proposals, the queue (big free-agent moves too), approving
    trade-finder.js      teams a player would suit better, and the trades for him (or a pick)
    six-trades.js        the six, traded: when they move, and the new team's games for the site
    six-offers.js        the six in free agency: every team's offer, and the one Sam takes
    fit.js               fit as 0-5 stars, players and teams (an admin's only)
    tendencies.js        how a team calls plays and who gets the ball (an admin's only)
    weeks.js             a week as it was played, from the game log (an admin's only)
    edits.js             ratings, archetypes, contracts and signings set by hand
    boosts.js            the six's boosters and connections from the site
    rewind.js            save points, to undo or resim a week
    history.js           every team's roster, season by season
    offseason.js         the offseason, in order
    rng.js               the seeded dice
  build/                 builds data/ from nflverse
    build-league.js      the 2023 league, prospects, schedules
    class-2027.js        the 2027 class, from the mock drafts and big boards in
                         class-2027-sources.json and the 2026 college rosters
    benchmarks.js        real 2023 league averages and games
    evidence.js          each player's seasons
    ratings.js           season scores and the overall curve
    skills.js            skills from real style
    schemes.js           2023 tendencies from the play-by-play
    hand-set.js          overalls set by hand
    nflverse.js          downloads and CSV
    write.js             writing the data files
    bundle.js            js/nfl-sim.js, the sim for the admin page
  data/                  what the sim starts from (committed)
    league-2023.json     teams and players, Week 1 of 2023
    prospects.json       the 2024-2026 draft classes and the 2027 class
    draft-orders.json    draft orders set by hand (2024's, from the mock draft doc) and the
                         real pick trades made before the 2023 kickoff (2024, 2025)
    schedules.json       the real 2023-2026 regular seasons, with dates and Eastern kickoffs
    benchmarks-2023.json real 2023 averages, scores and lines
```

To rebuild the data: `node nfl-sim/build/build-league.js` (downloads about
250 MB from nflverse into the system's temp folder the first time).
