/* ==========================================================================
   EGE Football NFL sim — rosters, contracts and free agency
   - Payroll against the salary cap (lib/value.js has the cap and what
     players get on the open market).
   - Needs: how far a team's starters at a position are below a typical
     NFL starter's.
   - Re-signing: each team keeps the expiring players it still wants and
     can pay; the rest become free agents.
   - Free agency: the best free agents first, each to the team that needs
     him most, fits him best and can pay him. Contenders pay for veterans;
     rebuilding teams do not. The six are never signed here: every team
     that wants one makes him an offer and Sam picks (lib/six-offers.js).
   - Depth: every room carries its bench -- three backs and three tight
     ends at least on a 53, and no more than a room uses (MIN, TARGET and
     MAX below). In the offseason each team fills every room to its target
     before the draft, and camp rosters stop at CAMP a position.
   - Cutdown: 53 a team, the least valuable released.
   ========================================================================== */

'use strict';

const { capFor, marketPay, playerValue, POSITION } = require('./value');
const { fitOf, schemeFor } = require('./schemes');
const { CURVES } = require('./aging');
const { skillsFrom, archetypeOf, SKILLS } = require('./skills');

/* Starters a position puts on the field, and what a 53 holds: at least
   MIN (45 in all), about TARGET (53), never more than MAX -- the way NFL
   53s run, with a real bench at every position. CAMP is the most a room
   takes in the offseason, when rosters run to 75. */
const SLOTS = { QB: 1, RB: 1, FB: 0, WR: 3, TE: 1, OT: 2, IOL: 3, EDGE: 2, DI: 2, LB: 2, CB: 3, S: 2, K: 1, P: 1 };
const MIN = { QB: 2, RB: 3, FB: 0, WR: 5, TE: 3, OT: 4, IOL: 5, EDGE: 4, DI: 4, LB: 4, CB: 5, S: 4, K: 1, P: 1 };
const TARGET = { QB: 3, RB: 4, FB: 1, WR: 6, TE: 3, OT: 4, IOL: 5, EDGE: 5, DI: 5, LB: 5, CB: 6, S: 4, K: 1, P: 1 };
const MAX = { QB: 3, RB: 5, FB: 1, WR: 7, TE: 4, OT: 5, IOL: 6, EDGE: 6, DI: 6, LB: 6, CB: 7, S: 5, K: 1, P: 1 };
const CAMP = { QB: 4, RB: 6, FB: 2, WR: 9, TE: 5, OT: 7, IOL: 8, EDGE: 8, DI: 8, LB: 8, CB: 9, S: 7, K: 2, P: 2 };
const ROSTER = 53;
const OFFSEASON_ROSTER = 75;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function onTeam(league, key) {
  return league.players.filter((p) => p.team === key && p.status === 'active');
}

function payroll(league, key) {
  return onTeam(league, key).reduce((sum, p) => sum + ((p.contract && p.contract.apy) || 0), 0);
}

function room(league, key) { return capFor(league.season) - payroll(league, key); }

function byPos(players, pos) {
  return players.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr);
}

/* A typical NFL starter's overall at each position, from the league. */
function starterLevels(league) {
  const out = {};
  Object.keys(SLOTS).forEach((pos) => {
    if (!SLOTS[pos]) { return; }
    const values = [];
    league.teams.forEach((t) => {
      byPos(onTeam(league, t.key), pos).slice(0, SLOTS[pos]).forEach((p) => values.push(p.ovr));
    });
    out[pos] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 75;
  });
  return out;
}

/* 0 (set) to 1 (a hole) at a position. */
function needAt(league, key, pos, levels, roster) {
  if (!SLOTS[pos]) { return 0; }
  const players = byPos(roster || onTeam(league, key), pos);
  if (players.length < SLOTS[pos]) { return 1; }
  const weakest = players[SLOTS[pos] - 1].ovr;
  return clamp((levels[pos] - weakest + 4) / 14, 0, 1);
}

function needs(league, key, levels) {
  const roster = onTeam(league, key);
  const out = {};
  Object.keys(SLOTS).forEach((pos) => { out[pos] = needAt(league, key, pos, levels, roster); });
  return out;
}

function contractYears(age, rng) {
  const base = age <= 25 ? 4 : age <= 28 ? 3 : age <= 31 ? 2 : 1;
  return clamp(base + (rng() < 0.3 ? 1 : 0) - (rng() < 0.3 ? 1 : 0), 1, 5);
}

function sign(p, key, league, rng, apy) {
  const years = contractYears(p.age, rng);
  p.team = key;
  p.status = 'active';
  p.contract = { through: league.season + years - 1, apy: Math.round((apy || marketPay(p, league.season)) * 10) / 10 };
  delete p.faSince;
}

/* A team over the cap in the spring cuts the veterans it pays the most
   more than they are now worth on the market (an aging star on a big deal
   first) until it is back under, the way cap casualties go in March. */
function capCasualties(league) {
  const out = [];
  const cap = capFor(league.season);
  league.teams.forEach((t) => {
    let over = payroll(league, t.key) - cap;
    if (over <= 0) { return; }
    const overpaid = onTeam(league, t.key)
      .filter((p) => !p.ege && p.age >= 27 && p.contract && p.contract.apy >= 3)
      .map((p) => [p, p.contract.apy - marketPay(p, league.season)])
      .filter(([, extra]) => extra > 1.5)
      .sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < overpaid.length && over > 0; i += 1) {
      const [p] = overpaid[i];
      over -= p.contract.apy;
      out.push({ player: p, team: t.key, apy: p.contract.apy });
      release(p, league.season);
    }
    if (over <= 0) { return; }
    /* Still over: the veterans who give the least for what they cost. */
    const costly = onTeam(league, t.key)
      .filter((p) => !p.ege && p.age >= 26 && p.contract && p.contract.apy >= 2)
      .map((p) => [p, playerValue(p, league.season, { mode: t.mode }) / p.contract.apy])
      .sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < costly.length && over > 0; i += 1) {
      const [p] = costly[i];
      over -= p.contract.apy;
      out.push({ player: p, team: t.key, apy: p.contract.apy });
      release(p, league.season);
    }
  });
  return out;
}

/* Expiring contracts: re-sign the wanted, free the rest. Teams keep
   nearly all their young starters and stars -- extensions, fifth-year
   options and franchise tags see to that in the NFL, and a team will
   restructure other deals to make room -- so only a few good players reach
   the market each year, most of them older or not starting. One of the six
   is always a free agent when his deal runs out: where he plays next is
   Sam's call, from the offers teams make him (lib/six-offers.js). */
function reSign(league, rng) {
  const out = { kept: [], freed: [] };
  const cap = capFor(league.season);
  league.teams.forEach((t) => {
    const roster = onTeam(league, t.key);
    const expiring = roster.filter((p) => p.contract && p.contract.through < league.season)
      .sort((a, b) => b.ovr - a.ovr);
    let used = roster.filter((p) => expiring.indexOf(p) === -1).reduce((sum, p) => sum + ((p.contract && p.contract.apy) || 0), 0);
    expiring.forEach((p) => {
      if (p.ege) {
        release(p, league.season);
        out.freed.push(p);
        return;
      }
      const rank = byPos(roster, p.pos).indexOf(p);
      const c = CURVES[p.pos] || CURVES.WR;
      const young = p.age <= c.peak + 1;
      const starter = rank < (SLOTS[p.pos] || 0);
      let want = p.ovr >= 85 ? (young ? 0.96 : 0.8) : starter ? (young ? 0.88 : 0.55) :
        rank < (SLOTS[p.pos] || 0) + 2 && p.ovr >= 70 ? 0.4 : 0.1;
      if (t.mode === 'rebuild' && p.age >= 29) { want *= 0.4; }
      const ask = marketPay(p, league.season) * (0.95 + rng() * 0.15);
      const stretch = p.ovr >= 85 ? 0.08 * cap : 0;
      if (rng() < want && cap + stretch - used - ask > 2) {
        sign(p, t.key, league, rng, ask);
        used += p.contract.apy;
        out.kept.push(p);
      } else {
        release(p, league.season);
        out.freed.push(p);
      }
    });
  });
  return out;
}

/* Free agency: best first, each to the team that wants him most and can
   pay him, keeping `reserve` ($M) back for the draft class. A room already
   at its camp size signs nobody, and one at its target only a player who
   would start. `hold(p, key)`, if given, says a signing has to wait for
   Sam (a star leaving his team): he goes back to his old team on the terms
   offered, the money and the spot stay set aside at the new one, and the
   move is pushed onto `held` for the queue (lib/trades.js). `setAside`
   ({ key: $M }) is money a team keeps back for an offer it has made one
   of the six, and `places` ({ key: [player] }) the six a team counts in
   its rooms while it waits to hear from them. */
function freeAgency(league, rng, opts) {
  opts = opts || {};
  const limit = opts.limit || OFFSEASON_ROSTER;
  const levels = starterLevels(league);
  const signed = [];
  const pool = league.players.filter((p) => p.status === 'fa' && !p.ege).sort((a, b) => b.ovr - a.ovr);
  const sizes = {};
  const rooms = {};
  const promised = {};
  league.teams.forEach((t) => {
    sizes[t.key] = onTeam(league, t.key).length;
    rooms[t.key] = room(league, t.key) - (opts.reserve || 0) - ((opts.setAside || {})[t.key] || 0);
    if (opts.places && opts.places[t.key]) { promised[t.key] = opts.places[t.key].slice(); }
  });
  pool.forEach((p) => {
    const ask = marketPay(p, league.season);
    let best = null;
    let bestScore = opts.minScore === undefined ? 0.2 : opts.minScore;
    league.teams.forEach((t) => {
      if (sizes[t.key] >= limit || rooms[t.key] < ask + 1) { return; }
      const roster = onTeam(league, t.key).concat(promised[t.key] || []);
      const room = byPos(roster, p.pos);
      const count = room.length;
      if (count >= (CAMP[p.pos] || 2)) { return; }
      const starts = count < (SLOTS[p.pos] || 0) || (SLOTS[p.pos] && p.ovr > room[SLOTS[p.pos] - 1].ovr);
      if (count >= (TARGET[p.pos] || 0) && !starts) { return; }
      const need = needAt(league, t.key, p.pos, levels, roster);
      const short = count < (MIN[p.pos] || 0) ? 0.6 : count < (TARGET[p.pos] || 0) ? 0.15 : -0.3;
      const fit = fitOf(p, schemeFor(t, p.pos));
      let score = need * (POSITION[p.pos] || 0.8) + short + 0.04 * fit + rng() * 0.25;
      if (t.mode === 'rebuild' && p.age >= 29) { score -= 0.5; }
      if (t.mode === 'compete' && p.ovr >= 80) { score += 0.15; }
      if (score > bestScore) { bestScore = score; best = t; }
    });
    if (best && opts.hold && opts.hold(p, best.key)) {
      const to = best.key;
      sign(p, p.lastTeam, league, rng, ask * (0.9 + rng() * 0.25));
      [to, p.team].forEach((key) => { sizes[key] += 1; rooms[key] -= p.contract.apy; });
      (promised[to] = promised[to] || []).push(p);
      if (opts.held) { opts.held.push({ player: p, from: p.team, to, contract: Object.assign({}, p.contract) }); }
    } else if (best) {
      sign(p, best.key, league, rng, ask * (0.9 + rng() * 0.25));
      sizes[best.key] += 1;
      rooms[best.key] -= p.contract.apy;
      signed.push(p);
    }
  });
  return signed;
}

/* Released or not re-signed: a free agent, who remembers whose he was. */
function release(p, season) {
  if (p.team && p.team !== 'FA') { p.lastTeam = p.team; }
  p.team = 'FA';
  p.status = 'fa';
  p.faSince = season;
}

/* A team never cuts a pick from the first four rounds in the season
   they were drafted (Sam, 2026-10-26: Luther Burden, a second-rounder, was
   nowhere after the 2025 draft; in a test of it the cut to 53 let go two
   first-rounders and a third of the second round). Real teams keep them;
   later-round picks earn their place. */
const KEEP_ROUNDS = 4;
/* Worth in the cut for each point of growth a player 24 or younger has
   left. */
const UPSIDE = 0.03;

function keptRookie(p, season) {
  return Boolean(p.draft && p.draft.pick && p.draft.year === season && p.draft.round <= KEEP_ROUNDS);
}

/* Releases a team's `n` least valuable players, never one of the six, a
   player on injured reserve, a pick from the first four rounds in his
   rookie season, or one it needs to field each position. Only a team with
   nobody else left to cut lets one of those picks go, the latest first. */
function trim(league, key, n, rng) {
  if (n <= 0) { return []; }
  const team = league.teams.find((t) => t.key === key);
  const roster = onTeam(league, key);
  const healthy = roster.filter((p) => !p.injury);
  const keep = new Set(roster.filter((p) => p.ege || p.injury));
  Object.keys(MIN).forEach((pos) => byPos(healthy, pos).slice(0, MIN[pos]).forEach((p) => keep.add(p)));
  const rookies = roster.filter((p) => !keep.has(p) && keptRookie(p, league.season));
  /* What each is worth to the team. A young player's room to grow counts
     for him: teams keep a late-round rookie with upside over a veteran
     backup of the same overall. */
  const value = new Map();
  roster.forEach((p) => {
    const upside = p.age <= 24 ? UPSIDE * Math.max(0, (p.pot || p.ovr) - p.ovr) : 0;
    value.set(p, [playerValue(p, league.season, { mode: team.mode }), p.ovr / 100 + upside + rng() * 0.01]);
  });
  const worth = (p) => value.get(p)[0] + value.get(p)[1];
  /* Each room best first, those the team keeps anyway at the top: past
     its target a player counts half, past its most he goes first. */
  const place = new Map();
  Object.keys(MAX).forEach((pos) => {
    roster.filter((p) => p.pos === pos)
      .sort((a, b) => (keep.has(b) || rookies.indexOf(b) !== -1) - (keep.has(a) || rookies.indexOf(a) !== -1) || worth(b) - worth(a))
      .forEach((p, i) => place.set(p, i));
  });
  const out = roster.filter((p) => !keep.has(p) && rookies.indexOf(p) === -1).map((p) => {
    const count = place.has(p) ? place.get(p) : 0;
    if (count >= (MAX[p.pos] || 3)) { return [p, -1 + rng() * 0.01]; }
    const surplus = count >= (TARGET[p.pos] || 3) ? 0.5 : 1;
    return [p, value.get(p)[0] * surplus + value.get(p)[1]];
  }).sort((a, b) => a[1] - b[1]).map(([p]) => p)
    .concat(rookies.sort((a, b) => b.draft.pick - a.draft.pick))
    .slice(0, n);
  out.forEach((p) => release(p, league.season));
  return out;
}

/* Down to 53: keep the position minimums, then the most valuable. */
function cutDown(league, rng) {
  const released = [];
  league.teams.forEach((t) => {
    trim(league, t.key, onTeam(league, t.key).length - ROSTER, rng).forEach((p) => released.push(p));
  });
  return released;
}

/* Signs `n` players where a team is thinnest: the best free agent there,
   or a made-up replacement-level player. */
function addPlayers(league, key, n, rng, makeName) {
  const added = [];
  for (let i = 0; i < n; i += 1) {
    const counts = {};
    onTeam(league, key).forEach((p) => { counts[p.pos] = (counts[p.pos] || 0) + 1; });
    const pos = Object.keys(TARGET).sort((a, b) => ((counts[a] || 0) - TARGET[a]) - ((counts[b] || 0) - TARGET[b]))[0];
    const p = bestAffordable(league, key, pos, 33) || replacement(league, pos, rng, makeName);
    sign(p, key, league, rng, marketPay(p, league.season));
    added.push(p);
  }
  return added;
}

/* The best free agent at a position a team can still pay (anybody at the
   minimum, whatever its cap), less any money it is keeping back (`aside`,
   $M). Never one of the six. */
function bestAffordable(league, key, pos, maxAge, aside) {
  const space = Math.max(room(league, key) - (aside || 0) - 1, capFor(league.season) / capFor(2024) * 1.2);
  return league.players.filter((p) => p.status === 'fa' && !p.ege && p.pos === pos && (!maxAge || p.age <= maxAge) &&
    marketPay(p, league.season) <= space).sort((a, b) => b.ovr - a.ovr)[0];
}

/* Before the draft every room fills to its target -- the backups and
   camp bodies a team carries into the spring -- with the best free agent
   it can pay there, or a made-up replacement-level player. `holds` is what
   the teams waiting on one of the six keep for him (lib/six-offers.js):
   the money, and his place in the room. */
function fillDepth(league, rng, makeName, holds) {
  const added = [];
  const aside = (holds && holds.setAside) || {};
  const places = (holds && holds.places) || {};
  league.teams.forEach((t) => {
    Object.keys(TARGET).forEach((pos) => {
      let count = onTeam(league, t.key).filter((p) => p.pos === pos).length +
        (places[t.key] || []).filter((p) => p.pos === pos).length;
      while (count < TARGET[pos] && onTeam(league, t.key).length < OFFSEASON_ROSTER) {
        const p = bestAffordable(league, t.key, pos, null, aside[t.key]) || replacement(league, pos, rng, makeName);
        sign(p, t.key, league, rng, marketPay(p, league.season));
        added.push(p);
        count += 1;
      }
    });
  });
  return added;
}

/* A team short at a position after everything else signs a camp body
   (and lets its least valuable player go if that takes it past 53); then
   everyone fills out to 53. */
function fillHoles(league, rng, makeName) {
  const added = [];
  league.teams.forEach((t) => {
    Object.keys(MIN).forEach((pos) => {
      let roster = onTeam(league, t.key);
      while (roster.filter((p) => p.pos === pos).length < MIN[pos]) {
        const p = bestAffordable(league, t.key, pos) || replacement(league, pos, rng, makeName);
        sign(p, t.key, league, rng, marketPay(p, league.season));
        added.push(p);
        roster = onTeam(league, t.key);
      }
    });
    const size = onTeam(league, t.key).length;
    if (size > ROSTER) { trim(league, t.key, size - ROSTER, rng); }
    addPlayers(league, t.key, ROSTER - size, rng, makeName).forEach((p) => added.push(p));
  });
  return added;
}

/* What each kind of team leaves unspent once its 53 is set, as a share of
   the cap (Sam, 2026-10-26: contenders spend all they can on the best
   players they can get, rebuilding teams keep a little room). */
const LEFT_OVER = { compete: 0.01, retool: 0.04, rebuild: 0.08 };
/* What a team pays over the market for a free agent it wants. */
const PREMIUM = { compete: 1.15, retool: 1.05, rebuild: 1 };

/* Once the 53s are set, a team with more room than its kind keeps spends
   it, contenders first: on free agents who would start for it (a
   contender takes anybody good, a rebuilding team nobody over 27), each
   replacing its least valuable player, then on extending the players whose
   deals run out this year or next, best first, at what the market pays
   them (or more, never less). Stars of 85 or more are left alone: a star
   moving goes through Sam (lib/trades.js queueMoves). The six too. Returns
   what was done. */
function spendRoom(league, rng) {
  const cap = capFor(league.season);
  const levels = starterLevels(league);
  const out = { signed: [], extended: [] };
  const order = { compete: 0, retool: 1, rebuild: 2 };
  league.teams.slice().sort((a, b) => (order[a.mode] || 1) - (order[b.mode] || 1) || (b.rating || 0) - (a.rating || 0)).forEach((t) => {
    const mode = t.mode || 'retool';
    const keep = cap * (LEFT_OVER[mode] === undefined ? LEFT_OVER.retool : LEFT_OVER[mode]);
    const maxAge = mode === 'rebuild' ? 27 : mode === 'retool' ? 30 : 34;
    const spare = () => room(league, t.key) - keep;

    /* Free agents who would start. */
    let signings = 0;
    league.players.filter((p) => p.status === 'fa' && !p.ege && p.ovr >= 70 && p.ovr < 85 && p.age <= maxAge)
      .sort((a, b) => b.ovr - a.ovr).forEach((p) => {
        if (signings >= 3 || p.status !== 'fa' || spare() <= 0) { return; }
        const pay = Math.round(marketPay(p, league.season) * (PREMIUM[mode] || 1) * 10) / 10;
        if (pay > spare()) { return; }
        const roster = onTeam(league, t.key);
        const at = byPos(roster, p.pos);
        const slots = SLOTS[p.pos] || 0;
        if (!slots || (at.length >= slots && p.ovr < at[slots - 1].ovr + 2)) { return; }
        if (needAt(league, t.key, p.pos, levels, roster) <= 0 && at.length >= slots && p.ovr < at[0].ovr) { return; }
        sign(p, t.key, league, rng, pay);
        trim(league, t.key, onTeam(league, t.key).length - ROSTER, rng);
        signings += 1;
        out.signed.push({ player: p, team: t.key, apy: p.contract.apy });
      });

    /* Extensions for the deals running out soonest, the best players first. */
    onTeam(league, t.key)
      .filter((p) => !p.ege && p.contract && p.contract.through <= league.season + 1 && p.ovr >= 68 && p.age <= maxAge)
      .sort((a, b) => playerValue(b, league.season, { mode }) - playerValue(a, league.season, { mode }))
      .forEach((p) => {
        if (spare() <= 0) { return; }
        const was = p.contract.apy || 0;
        const apy = Math.round(Math.max(was, marketPay(p, league.season) * (0.98 + rng() * 0.12)) * 10) / 10;
        if (apy - was > spare()) { return; }
        p.contract = { through: league.season + contractYears(p.age, rng), apy };
        out.extended.push({ player: p, team: t.key, from: was, apy });
      });
  });
  return out;
}

let made = 0;
function replacement(league, pos, rng, makeName) {
  made += 1;
  const ovr = Math.round(56 + rng() * 8);
  const age = 23 + Math.floor(rng() * 5);
  const z = {};
  Object.keys(SKILLS[pos] || {}).forEach((k) => { z[k] = (rng() - 0.5) * 2; });
  const p = {
    id: 'sim:' + league.season + ':r' + made + ':' + Math.floor(rng() * 1e6),
    name: makeName ? makeName(rng) : 'Player ' + made,
    pos, team: 'FA', status: 'fa', born: (league.season - age) + '-06-01', age,
    entry: league.season, draft: null, ovr, pot: ovr + Math.round(rng() * 3),
    longevity: 50, durability: Math.round(60 + rng() * 25)
  };
  p.skills = skillsFrom(pos, ovr, z);
  p.archetype = archetypeOf(pos, p.skills, ovr);
  league.players.push(p);
  return p;
}

module.exports = { SLOTS, MIN, TARGET, MAX, CAMP, ROSTER, onTeam, payroll, room, starterLevels, needAt, needs, reSign,
                   freeAgency, cutDown, trim, addPlayers, fillDepth, fillHoles, sign, release, byPos, capCasualties, spendRoom,
                   LEFT_OVER, KEEP_ROUNDS, PREMIUM };
