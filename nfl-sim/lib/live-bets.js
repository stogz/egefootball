/* ==========================================================================
   EGE Football NFL sim — Live Mode's bets
   What anybody watching a live game can put diamonds on (Sam, 2026-11-04),
   and what each bet comes to, worked out when the game goes live:

   - before kickoff: the spread the bot's first post gives (Sam,
     2026-11-04: the site's own line, the favourite giving the half point
     past it), a touchdown scorer and three players' over/unders, each on
     the stat he piles up most, the line halfway between his season's
     average and what the sim expects of him in this game (all the sim's
     before he has three games behind him).
   - at halftime: a touchdown scorer for the rest of the game, and the
     spread again as the bot's halftime post has it: the score at the half
     and half the pregame line still to play.

   What each pays, the stake included (Sam left the numbers to us,
   2026-11-04): either side of a spread or an over/under 1.9 times, the
   way a book pays a coin flip, so nobody gains on it in the long run; a
   scorer what his chance of scoring is worth less 15%, from 1.25 for
   somebody who scores nearly every week to 5 for an outside chance.

   The prices come only from what anybody could know before the game: the
   league as it stood before the week was played (the week's save point,
   lib/rewind.js), the matchup played RUNS times on dice of its own, each
   player's games so far this season, and the site's own pregame line.
   Nothing of the game itself goes into them, but the halftime line's
   score and who has been hurt by then, which the page has already shown. What each bet comes to is read off the
   game's own plays, and kept where only the database sees it
   (supabase/schema.sql live_feeds), until the final whistle settles it.

   Players are named as the feed names them ({ n, pos, t, e, g, c }), never
   by the sim's own ids. A bet's pick is a market's own id for it: 'home'
   or 'away', 'over' or 'under', or 'p3' for a player.
   ========================================================================== */

'use strict';

const { index, side } = require('./league');
const { playGame } = require('./game');
const boosts = require('./boosts');
const { seeded } = require('./rng');

const MIN = 10;
const SPREAD = 1.9;
const PROP = 1.9;
const RUNS = 200;

/* A touchdown scorer's price: what his chance of scoring is worth, less
   the house's share, between TD_X[0] and TD_X[1]. */
const TD_EDGE = 0.85;
const TD_X = [1.25, 5];

/* The longest spread the bot gives (EGE.discordPost.spreadText). */
const LONGEST = 24.5;

/* How many players a side can be picked to score, at most. */
const PER_TEAM = 6;

const TD_KEYS = ['rushTd', 'recTd', 'retTd', 'defTd'];
const CARRIERS = { QB: true, RB: true, FB: true, WR: true, TE: true };

const STATS = { passYds: 'Passing yards', rushYds: 'Rushing yards', recYds: 'Receiving yards' };

/* --------------------------------------------------------------- odds -- */

function round05(x) { return Math.round(x * 20) / 20; }

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

/* The price for a chance `p` of scoring. */
function tdPrice(p) { return round05(clamp(TD_EDGE / Math.max(p, 0.01), TD_X[0], TD_X[1])); }

/* The points the home side is given (less than nothing when it gives
   them), as the bot's spread has it (EGE.discordPost.spreadText): the
   side `first` names (the one with the six) gets the half point past its
   margin, `longest` at most, giving it when favoured and getting it when
   not. Never a whole number, so never a push. */
function homePoints(margin, firstIsHome, longest) {
  const theirs = firstIsHome ? margin : -margin;
  const spread = Math.min(longest || Infinity, Math.floor(Math.abs(theirs)) + 0.5);
  const first = theirs > 0 ? -spread : spread;
  return firstIsHome ? first : -first;
}

function scored(line) { return TD_KEYS.reduce((n, k) => n + ((line && line[k]) || 0), 0); }

function median(list) {
  if (!list.length) { return 0; }
  const s = list.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* ---------------------------------------------------------- the matchup -- */

/* The game played RUNS times from the league as it stood before the week:
   each player's chance of scoring, of scoring after the half, and what he
   piles up; the home side's margin. */
function project(pre, game) {
  index(pre);
  const home = side(pre, game.home);
  const away = side(pre, game.away);
  let links = null;
  try { links = boosts.read(pre).links; } catch (err) { links = null; }
  const rng = seeded(['live-bets', pre.seed || 'ege-nfl', game.season, game.week, game.away, game.home].join(':'));
  const per = {};
  let margin = 0;
  for (let i = 0; i < RUNS; i += 1) {
    const r = playGame(home, away, rng, { neutral: !!game.neutral, playoff: !!game.playoff, noInjuries: true, links });
    margin += r.score[0] - r.score[1];
    const late = {};
    r.tds.forEach((t) => { if (t.qtr >= 3 && t.id) { late[t.id] = true; } });
    Object.keys(r.box).forEach((id) => {
      const line = r.box[id];
      const e = per[id] || (per[id] = { team: line.team, td: 0, td2: 0, passYds: [], rushYds: [], recYds: [], touches: 0 });
      if (scored(line)) { e.td += 1; }
      if (late[id]) { e.td2 += 1; }
      Object.keys(STATS).forEach((k) => e[k].push(line[k] || 0));
      e.touches += (line.rushAtt || 0) + (line.targets || 0) + (line.passAtt || 0);
    });
  }
  /* Everybody who did not get on the field in a run had nothing then. */
  Object.keys(per).forEach((id) => {
    const e = per[id];
    Object.keys(STATS).forEach((k) => { while (e[k].length < RUNS) { e[k].push(0); } });
    e.td /= RUNS;
    e.td2 /= RUNS;
    e.touches /= RUNS;
  });
  return { per, margin: margin / RUNS };
}

/* Each player's games this season before this week, by id, newest first:
   his line in each. */
function form(games, game) {
  const out = {};
  (games || []).filter((g) => g.season === game.season && g.week < game.week && Array.isArray(g.box))
    .sort((a, b) => b.week - a.week)
    .forEach((g) => g.box.forEach((line) => { (out[line.id] = out[line.id] || []).push(line); }));
  return out;
}

/* A player as the feed has him. */
function who(p) {
  const row = { n: p.name, pos: p.pos, t: p.team };
  if (p.espn) { row.e = String(p.espn); }
  if (p.ege) { row.g = p.ege; }
  if (p.collegePhoto) { row.c = true; }
  return row;
}

/* ---------------------------------------------------------------- menus -- */

/* Everything about a live game's bets: `pre` the league as it stood before
   the week (a save point's, which this changes no more than rebuilding
   its lookups), `game` { season, week, home, away, neutral, playoff,
   margin: the home side's margin as the site's line has it, or null },
   `kept` the game's plays as its plays file has them, `plan` the feed
   lib/live.js built from them, and `games` the season's games file.
   Returns { bets, half, results }: the menu before kickoff (anybody may
   see it), the halftime menu with when it opens and closes (milliseconds
   from kickoff), and each market's winning picks, with `push` the markets
   that give the stake back (a tie). */
function build(pre, game, kept, plan, games) {
  const plays = kept.plays || [];
  const last = plays[plays.length - 1];
  const final = last ? last.post.s : [0, 0];
  /* The side the bot's posts put first: the one with one of the six. */
  const mark = (plan.players || []).filter((p) => p.g)[0];
  const firstIsHome = !mark || mark.t === game.home;
  function spreadMarket(id, points, half) {
    const m = { id, kind: 'spread',
                picks: [{ id: 'away', t: game.away, line: -points, x: SPREAD }, { id: 'home', t: game.home, line: points, x: SPREAD }] };
    if (half) { m.half = true; }
    return m;
  }
  function covers(points) { return final[0] + points > final[1] ? 'home' : 'away'; }

  /* What each player did in the game, from its plays: touchdowns, those
     after the half, and his yards. */
  const did = {};
  const hurtEarly = {};
  plays.forEach((e) => {
    Object.keys(e.d || {}).forEach((id) => {
      const x = did[id] || (did[id] = { td: 0, td2: 0, passYds: 0, rushYds: 0, recYds: 0 });
      const n = scored(e.d[id]);
      x.td += n;
      if (e.pre && e.pre.q >= 3) { x.td2 += n; }
      Object.keys(STATS).forEach((k) => { x[k] += e.d[id][k] || 0; });
    });
    if (e.pre && e.pre.q <= 2) { (e.hurt || []).forEach((id) => { hurtEarly[id] = true; }); }
  });

  const markets = [];
  const results = { push: [] };
  let half = null;

  /* Where the halftime bets open and close: from the halftime entry until
     the second half's kickoff. */
  const at = (plan.entries || []).findIndex((e) => e.tag === 'half');
  const opens = at >= 0 ? plan.entries[at].ms : null;
  const closes = at >= 0 && plan.entries[at + 1] ? plan.entries[at + 1].ms : null;
  const halfScore = at >= 0 ? plan.entries[at].post.s : null;

  const proj = pre ? project(pre, game) : null;
  /* The site's line, or the matchup's where the site has none. */
  const margin = typeof game.margin === 'number' ? game.margin : proj ? proj.margin : 0;
  const points = homePoints(margin, firstIsHome, LONGEST);
  markets.push(spreadMarket('sp', points));
  results.sp = [covers(points)];

  if (!pre) {
    return { bets: { min: MIN, markets }, half: null, results };
  }

  const seen = form(games, game);
  const rng = seeded(['live-props', game.season, game.week, game.away, game.home].join(':'));

  /* The chance each one scores: mostly the matchup's, the rest how often
     he has this season and in his last five games. */
  const chance = {};
  Object.keys(proj.per).forEach((id) => {
    const p = pre.byId.get(id);
    if (!p || !CARRIERS[p.pos]) { return; }
    const lines = seen[id] || [];
    const recent = lines.slice(0, 5);
    const rate = (list) => (list.length ? list.filter((l) => scored(l) > 0).length / list.length : 0);
    const wSeason = 0.3 * Math.min(lines.length, 8) / 8;
    const wRecent = 0.2 * Math.min(recent.length, 5) / 5;
    const sim = proj.per[id].td;
    const p0 = (1 - wSeason - wRecent) * sim + wSeason * rate(lines) + wRecent * rate(recent);
    chance[id] = { p: p0, p2: proj.per[id].td2 * clamp(sim ? p0 / sim : 1, 0.5, 1.5), sim, player: p };
  });

  /* Who can be picked: each side's likeliest, and any of the six who
     plays. Numbered by side, likeliest first. */
  const picked = [];
  [game.away, game.home].forEach((key) => {
    const mine = Object.keys(chance).filter((id) => chance[id].player.team === key && proj.per[id].team === key)
      .sort((a, b) => chance[b].p - chance[a].p);
    const top = mine.filter((id) => chance[id].sim >= 0.06).slice(0, PER_TEAM);
    mine.forEach((id) => { if (chance[id].player.ege && top.indexOf(id) === -1 && proj.per[id].touches >= 1) { top.push(id); } });
    top.forEach((id) => picked.push(id));
  });
  const pickId = {};
  picked.forEach((id, i) => { pickId[id] = 'p' + i; });
  markets.push({ id: 'td', kind: 'td', picks: picked.map((id) => Object.assign({ id: pickId[id], x: tdPrice(chance[id].p) },
                                                                              who(chance[id].player))) });
  results.td = picked.filter((id) => did[id] && did[id].td > 0).map((id) => pickId[id]);

  /* The over/unders: the six who play first, then anybody else who gets
     the ball enough for one, in a random order of the game's own; three,
     no more than two from one side. */
  const props = [];
  function statOf(id) {
    const p = pre.byId.get(id);
    if (p.pos === 'QB') { return 'passYds'; }
    const e = proj.per[id];
    if (p.pos === 'RB' || p.pos === 'FB') { return median(e.rushYds) >= median(e.recYds) ? 'rushYds' : 'recYds'; }
    return 'recYds';
  }
  const pool = Object.keys(proj.per).filter((id) => {
    const p = pre.byId.get(id);
    if (!p || !CARRIERS[p.pos] || p.team !== proj.per[id].team) { return false; }
    return median(proj.per[id][statOf(id)]) >= (p.pos === 'QB' ? 120 : 30);
  });
  const six = pool.filter((id) => pre.byId.get(id).ege);
  const rest = pool.filter((id) => !pre.byId.get(id).ege);
  function shuffle(list) {
    const out = list.slice().sort();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }
  const order = shuffle(six).concat(shuffle(rest));
  const sides = {};
  order.forEach((id) => {
    const team = pre.byId.get(id).team;
    if (props.length >= 3 || (sides[team] || 0) >= 2) { return; }
    sides[team] = (sides[team] || 0) + 1;
    props.push(id);
  });
  props.forEach((id, i) => {
    const p = pre.byId.get(id);
    const stat = statOf(id);
    const lines = seen[id] || [];
    const sim = median(proj.per[id][stat]);
    const mid = lines.length >= 3 ? (lines.reduce((a, l) => a + (l[stat] || 0), 0) / lines.length + sim) / 2 : sim;
    const line = Math.floor(mid) + 0.5;
    const mkt = 'o' + (i + 1);
    markets.push({ id: mkt, kind: 'prop', who: who(p), stat, label: STATS[stat], line,
                   picks: [{ id: 'over', x: PROP }, { id: 'under', x: PROP }] });
    results[mkt] = [((did[id] && did[id][stat]) || 0) > line ? 'over' : 'under'];
  });

  /* Halftime: the spread as the bot's halftime post has it, the score at
     the half and half the pregame line still to play, and who scores in
     the rest of the game. */
  if (opens !== null && closes !== null) {
    const lead = halfScore[0] - halfScore[1];
    const points2 = homePoints(margin / 2 + lead, firstIsHome);
    const later = picked.filter((id) => !hurtEarly[id]);
    half = {
      opens, closes,
      markets: [
        spreadMarket('sp2', points2, true),
        { id: 'td2', kind: 'td', half: true,
          picks: later.map((id) => Object.assign({ id: pickId[id], x: tdPrice(chance[id].p2) }, who(chance[id].player))) }
      ]
    };
    results.sp2 = [covers(points2)];
    results.td2 = later.filter((id) => did[id] && did[id].td2 > 0).map((id) => pickId[id]);
  }

  return { bets: { min: MIN, markets }, half, results };
}

module.exports = { build, tdPrice, homePoints, MIN, SPREAD, PROP };
