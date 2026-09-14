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

| Player | School | Position | Notes |
| --- | --- | --- | --- |
| Andrew Parr | TBD | TBD | |
| Cooper Clark | Carlsbad High School | TBD | |
| Paxon Hatch | Bloomington High School | TE | Only confirmed position |
| Isaac Vitel | TBD | TBD | |
| Sam Stogsdill | Normal Community High School | TBD | |
| Jaykeb Stewart | TBD | TBD | |

Everything marked TBD is genuinely unknown right now and should stay TBD in code
and data until it is confirmed — no placeholder guesses that later read as facts.

Headshots already in the repo under `headshot/`, keyed by last name:
`parr.png`, `clark.png`, `hatch.png`, `vitel.png`, `stogsdill.png`,
`stewart.png`.

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
  opponent, home/away, result (W/L and score) once played, or upcoming if not.
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

## Player Portal (login)

Each of the six gets an account and a private portal.

- **Login** — one account per player; a player only edits their own profile.
  Built on Supabase auth against a hardcoded list of six emails — nobody
  outside that list can hold an account. A player's first sign-in sets their
  password; after that it can only be used, never re-set. Sam Stogsdill's
  email is in; the other five are TBD.
- **Overalls** — a rating per attribute (speed, strength, catching, route
  running, awareness, etc. — final attribute list TBD) plus a single overall.
- **Offseason workouts** — the progression mechanic. Between seasons a player
  spends workouts as boosts to raise specific attributes. Workouts are a limited
  resource, so choices have a cost.
- **Interactive layer** — beyond workouts, the portal is meant to be something a
  player actually plays with between games. Scope TBD; workouts come first.

The read-only side of the site (schedules, records, stats) stays public — no
login needed to browse.

---

## Files

Built so far:

- `index.html` — the homepage: player select, plus a placeholder player view.
- `js/app.js` — renders the six cards and routes `#{slug}` to a player view.
- `data/players.js` — the six players and the season ladder. Source of truth.
- `js/auth.js` — Supabase auth: sign in, first-time password, session state.
- `js/supabase-config.js` — your Supabase URL and anon key. Blank by default.
- `site.css` — the theme (palette overriding the kit's tokens) plus the page
  components the kit doesn't cover (player card, roster grid, login form).

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
3. Under **Authentication → Providers → Email**, turn **Confirm email** off.
   With it on, Supabase emails a confirmation link before a new password takes
   effect, which is friction the six don't need. Login handles both settings,
   but off is the smoother path.

Until those two values are filled in, the site runs normally and the portal
reports that login isn't configured yet.

**Worth knowing:** a first sign-in is what sets the password, so whoever gets
there first claims the account. With six known players that's usually fine, but
say the word and this can move to emailed magic links instead, where only the
inbox owner can ever get in.

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
   same shape once 2018 is working.
6. **Stat lines** — TE game log for Paxon Hatch first, other position sets as
   positions are confirmed.
7. **Login + portal** — Supabase auth, accounts, attributes, overalls.
   *Login is in: allowlisted emails, one-time password, session in the nav.
   The portal behind it — attributes and overalls — is not.*
8. **Offseason workouts** — the boost mechanic.
9. **Extra interactive layer** — scope defined once the above is working.

---

## Open Questions

- Does any of the six play the optional 2023 senior college season instead of
  declaring for the 2023 draft?
- College programs for all six — the ladder needs them from the 2020 season on.
- Positions for Parr, Clark, Vitel, Stogsdill, Stewart.
- Schools for Parr, Vitel, Stewart.
- Full attribute list behind a player's overall.
- Sign-in emails for the other five players.
- Whether workout and overall changes persist per browser (`localStorage`) or in
  Supabase. Read-only season data stays in the `data/*.js` files either way.
