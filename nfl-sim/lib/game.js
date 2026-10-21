/* ==========================================================================
   EGE Football NFL sim — the game engine
   One game, snap by snap: kickoffs, the clock, downs and distance, punts,
   field goals, fourth-down calls, the two-minute drill, kneel-downs and
   overtime. Every snap is the offense's call against the defense's:

   - the call: run or pass from the team's tendencies and the situation; a
     pass is a screen, short, intermediate or deep, maybe off play-action;
     a run goes inside or outside, or is the quarterback's;
   - the defense: man or zone, one deep safety or two, blitz or not. It
     plays two-high more against a team with a deep passing game, which
     leaves fewer in the box to stop the run;
   - the rush against the protection: pressure, sacks and scrambles;
   - the throw: who it goes to (deep balls to deep threats, short ones to
     route runners, backs and tight ends), whether it is caught, picked off
     or broken up, from the passer's skill at that depth and the receiver's
     against whoever covers him -- a corner's man or zone, a safety's range
     on anything deep, a linebacker's coverage underneath;
   - the run: the back behind his line's blocking against the front, with
     breakaway runs from speed that only a rangy safety stops.

   Players get hurt during the game (more often the less durable they are)
   and the next man up plays the rest of it.

   A connection one of the six bought on the site (`opts.links`, from
   lib/boosts.js) counts while his quarterback is the one playing: a
   receiver, back or tight end with it is looked for more and caught a
   little more often, and a quarterback with his line is pressured and
   sacked less. Its strength runs 0 to 1 at VI (CHEMISTRY).

   No back, receiver or tight end scores a fourth touchdown in a game (Sam's
   rule for the six, kept for everybody): once he has three he is not the
   one the ball goes to near the goal line, and anything that would have
   been his fourth stops a yard short.

   Numbers are tuned so a league of average teams plays like the 2023 NFL;
   node nfl-sim/check.js holds it to that.
   ========================================================================== */

'use strict';

const { gameDay, skill } = require('./lineup');

/* What an average NFL starter's skills come to: the engine's zero. */
const MID = 80;
const QUARTER = 900;
const OT_REGULAR = 600;
/* How many rating points a home team plays above itself (half each way). */
const HOME_EDGE = 2;

const THROW = {
  screen: [['accuracy', 0.8], ['poise', 0.2]],
  short: [['accuracy', 0.7], ['poise', 0.3]],
  mid: [['accuracy', 0.6], ['arm', 0.2], ['poise', 0.2]],
  deep: [['deep', 0.5], ['arm', 0.3], ['accuracy', 0.2]]
};
const CATCH = {
  WR: { screen: [['yac', 0.5], ['speed', 0.3], ['hands', 0.2]], short: [['route', 0.45], ['hands', 0.35], ['yac', 0.2]],
        mid: [['route', 0.5], ['hands', 0.3], ['size', 0.2]], deep: [['deep', 0.55], ['speed', 0.3], ['size', 0.15]] },
  TE: { screen: [['yac', 0.6], ['hands', 0.4]], short: [['route', 0.45], ['hands', 0.45], ['yac', 0.1]],
        mid: [['route', 0.45], ['hands', 0.35], ['deep', 0.2]], deep: [['deep', 0.6], ['speed', 0.4]] },
  RB: { screen: [['elusive', 0.4], ['speed', 0.3], ['hands', 0.3]], short: [['hands', 0.6], ['elusive', 0.4]],
        mid: [['hands', 0.7], ['speed', 0.3]], deep: [['speed', 0.5], ['hands', 0.5]] }
};
const AFTER = { WR: [['yac', 0.6], ['speed', 0.4]], TE: [['yac', 0.7], ['speed', 0.3]],
                RB: [['elusive', 0.5], ['speed', 0.3], ['power', 0.2]] };
/* How much each kind of target is looked for at each depth. */
const SUIT = { WR: { screen: 0.8, short: 0.9, mid: 1.1, deep: 1.25 },
               TE: { screen: 0.4, short: 1.1, mid: 1, deep: 0.45 },
               RB: { screen: 2.2, short: 1.5, mid: 0.25, deep: 0.06 } };
const COMPLETE = { screen: 0.86, short: 0.755, mid: 0.59, deep: 0.385 };
const PICKED = { screen: 0.004, short: 0.012, mid: 0.026, deep: 0.048 };
const YAC = { screen: 6.2, short: 4.4, mid: 3.4, deep: 3.4 };
const PRESSURE = { screen: -0.2, short: -0.1, mid: 0.03, deep: 0.09 };
/* The 2023 league's average tendencies. Defenses lean against whatever an
   offense does more of than that -- two deep safeties against a team that
   throws deep, the rush pinned back against one that throws a lot, an
   extra man in the box against one that runs -- so no way of playing is
   free, and a scheme pays off through the players who fit it. */
const NORM = { pass: 0.552, short: 0.576, mid: 0.306, deep: 0.118, screen: 0.098 };
const LEAN = { short: 0.3, mid: 0.8, deep: 1.2, screen: 0.5 };
/* What a connection of strength 1 (VI) does: how much more he is looked
   for (a tight end gets a Kelce's three targets in ten; a back, who starts
   from far fewer, about three times his share), how much likelier a throw
   to him is caught and how much less often it is picked off, and how much
   less a quarterback with his line is pressured and sacked. */
const CHEMISTRY = { looks: { WR: 1.15, TE: 1.15, RB: 2.2 }, complete: 0.04, picked: 0.3, pressure: 0.06, sacked: 0.3 };

/* Injuries: what is hurt, by how long it keeps a player out. */
const SEVERITY = [
  [0.38, 1, 1, ['hamstring', 'ankle', 'concussion', 'shoulder', 'knee', 'groin', 'back', 'calf', 'quad']],
  [0.22, 2, 2, ['hamstring', 'ankle', 'concussion', 'knee', 'hip', 'ribs', 'foot']],
  [0.15, 3, 4, ['high ankle sprain', 'hamstring strain', 'knee sprain', 'shoulder sprain', 'broken hand']],
  [0.13, 5, 8, ['high ankle sprain', 'MCL sprain', 'broken wrist', 'broken ribs', 'turf toe']],
  [0.07, 9, 12, ['broken leg', 'Lisfranc injury', 'torn pectoral', 'broken collarbone']],
  [0.05, 20, 20, ['torn ACL', 'torn Achilles', 'torn ACL', 'broken ankle']]
];

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function blend(p, parts) {
  let total = 0;
  for (let i = 0; i < parts.length; i += 1) { total += skill(p, parts[i][0]) * parts[i][1]; }
  return total;
}

function group(p) {
  if (p.pos === 'TE') { return 'TE'; }
  if (p.pos === 'RB' || p.pos === 'FB') { return 'RB'; }
  return 'WR';
}

/* ---------------------------------------------------------------- setup -- */

/* A connection of the player's with this quarterback (or, for a
   quarterback, with his line): its strength, or 0. */
function chemistry(links, p, qb) {
  const rows = links && p && links[p.id];
  if (!rows) { return 0; }
  const key = p === qb ? null : String(qb.name || '').toLowerCase().replace(/[^a-z]/g, '');
  return rows.reduce((best, r) => (r.key === key && r.s > best ? r.s : best), 0);
}

/* The game-day lineup plus what the engine reads off it on every pass. */
function prepare(day, links) {
  const T = day.offense.targets;
  const list = [
    [day.wrs[0], 'wr', 0, T.WR * 0.38], [day.wrs[1], 'wr', 1, T.WR * 0.33], [day.wrs[2], 'wr', 2, T.WR * 0.29],
    [day.tes[0], 'te', 0, T.TE * (day.tes[1] ? 0.82 : 1)]
  ];
  if (day.tes[1]) { list.push([day.tes[1], 'te', 1, T.TE * 0.18]); }
  list.push([day.rbs[0], 'rb', 0, T.RB * (day.rbs[1] ? 0.68 : 1)]);
  if (day.rbs[1]) { list.push([day.rbs[1], 'rb', 1, T.RB * 0.32]); }
  day.targets = list.map(([p, slot, i, share]) => {
    const g = group(p);
    const t = { p, slot, i, share, group: g, after: blend(p, AFTER[g]), speed: skill(p, g === 'RB' ? 'speed' : 'speed'), catch: {},
                chem: chemistry(links, p, day.qb) };
    ['screen', 'short', 'mid', 'deep'].forEach((kind) => { t.catch[kind] = blend(p, CATCH[g][kind]); });
    return t;
  });
  const deepest = Math.max.apply(null, day.wrs.map((w) => blend(w, CATCH.WR.deep)));
  day.deepThreat = 0.5 * blend(day.qb, THROW.deep) + 0.5 * deepest;
  day.highSafety = Math.max(skill(day.s[0], 'range'), skill(day.s[1], 'range'));
  day.lbCover = (skill(day.lb[0], 'cover') + skill(day.lb[1], 'cover')) / 2;
  day.rushers = day.edge.concat(day.di);
  day.protect = chemistry(links, day.qb, day.qb);
  return day;
}

function makeSide(entry, idx, links) {
  const s = { idx, team: entry.team, roster: entry.roster, out: new Set(), timeouts: 3, day: null, links: links || null };
  refresh(s);
  return s;
}

function refresh(s) {
  const roster = s.out.size ? s.roster.filter((p) => !s.out.has(p.id)) : s.roster;
  s.day = prepare(gameDay(s.team, roster), s.links);
}

function teamStats() {
  return { plays: 0, yards: 0, passYards: 0, rushYards: 0, dropbacks: 0, attempts: 0, completions: 0,
           pressures: 0, sacks: 0, sackYards: 0, ints: 0, carries: 0, scrambles: 0, fumblesLost: 0,
           firstDowns: 0, third: 0, thirdMade: 0, fourth: 0, fourthMade: 0, punts: 0, puntYards: 0,
           fga: 0, fgm: 0, xpa: 0, xpm: 0, twoPa: 0, twoPm: 0, tds: 0, penalties: 0, penaltyYards: 0,
           drives: 0, top: 0, explosive: 0, kneels: 0, kickoffs: 0, touchbacks: 0, deepAttempts: 0,
           deepCompletions: 0, passTds: 0, rushTds: 0, explosivePass: 0, explosiveRun: 0 };
}

/* ------------------------------------------------------------ the record -- */

function stat(g, side, p, key, n) {
  if (!p || p.standIn) { return; }
  let line = g.box[p.id];
  if (!line) { line = g.box[p.id] = { name: p.name, pos: p.pos, team: g.sides[side].team.key }; }
  line[key] = (line[key] || 0) + n;
}

/* Three touchdowns already, for anybody but a quarterback. */
function capped(g, p) {
  if (!p || p.pos === 'QB') { return false; }
  const line = g.box[p.id];
  return Boolean(line) && (line.recTd || 0) + (line.rushTd || 0) >= 3;
}

/* A touchdown as the six's season file wants it: who scored, how, from
   where, when, and who threw it. */
function scoring(g, side, how, p, yards, qb) {
  g.tds.push({ side, how, id: p.id, yards, qb: qb ? qb.id : undefined, qtr: g.qtr, clock: Math.round(g.clock),
               before: g.score.slice(), ot: !!g.ot, at: g.scoring.length });
}

function longest(g, side, p, key, n) {
  if (!p || p.standIn) { return; }
  stat(g, side, p, key, 0);
  if (n > g.box[p.id][key]) { g.box[p.id][key] = n; }
}

function clockText(g) {
  const t = Math.max(0, Math.round(g.clock));
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}

function scored(g, side, kind, text) {
  g.scoring.push({ qtr: g.qtr, clock: clockText(g), team: g.sides[side].team.key, kind, text,
                   score: g.score.slice() });
}

/* ------------------------------------------------------------- injuries -- */

function hurt(g, side, p, base) {
  if (!p || p.standIn || g.opts.noInjuries) { return; }
  if (p.ege && g.opts.spareEge) { return; }
  const risk = base * (1.5 - (typeof p.durability === 'number' ? p.durability : 70) / 100);
  if (g.rng() < risk) { injure(g, side, p); }
}

function injure(g, side, p) {
  const s = g.sides[side];
  if (s.out.has(p.id)) { return; }
  let r = g.rng();
  let row = SEVERITY[SEVERITY.length - 1];
  for (let i = 0; i < SEVERITY.length; i += 1) {
    if (r < SEVERITY[i][0]) { row = SEVERITY[i]; break; }
    r -= SEVERITY[i][0];
  }
  const games = g.rng.int(row[1], row[2]);
  const what = row[3][Math.floor(g.rng() * row[3].length)];
  g.injuries.push({ id: p.id, name: p.name, team: s.team.key, pos: p.pos, games, what,
                    season: games >= 20, ege: p.ege || undefined, qtr: g.qtr });
  s.out.add(p.id);
  refresh(s);
}

/* Linemen and defensive backs get hurt in the pile, not with the ball. */
function wearAndTear(g) {
  [0, 1].forEach((side) => {
    const d = g.sides[side].day;
    d.ol.concat(d.edge, d.di, d.lb, d.cb, d.s).forEach((p) => hurt(g, side, p, 0.016));
  });
}

/* --------------------------------------------------------- the situation -- */

function diffFor(g, side) { return g.score[side] - g.score[1 - side]; }

function secondsLeft(g) {
  if (g.qtr >= 5) { return g.clock; }
  return (4 - g.qtr) * QUARTER + g.clock;
}

/* How the offense is playing the clock: 'hurry', 'milk' or 'normal'. */
function modeOf(g) {
  const diff = diffFor(g, g.poss);
  const t = g.clock;
  if (g.qtr === 2 && t <= 120 && (t >= 50 || g.yl >= 45)) { return 'hurry'; }
  if (g.qtr >= 4) {
    if (diff < 0 && (t <= 300 || (diff <= -9 && t <= 480) || (diff <= -17 && t <= 720))) { return 'hurry'; }
    if (diff > 0 && t <= 360) { return 'milk'; }
  }
  /* Overtime is short: whoever has the ball plays to win it. */
  if (g.qtr >= 5 && diff <= 0) { return 'hurry'; }
  return 'normal';
}

function kickRange(K) { return 56 + 0.3 * (skill(K, 'power') - MID); }

function fgChance(K, dist) {
  const acc = skill(K, 'accuracy');
  const pow = skill(K, 'power');
  let logit = dist <= 45 ? 4.25 - 0.137 * (dist - 25) : 1.51 - 0.12 * (dist - 45);
  logit += 0.045 * (acc - 80) + (dist > 45 ? 0.04 * (pow - 80) : 0);
  if (dist > kickRange(K) + 2) { logit -= 0.6 * (dist - kickRange(K) - 2); }
  return 1 / (1 + Math.exp(-logit));
}

/* ---------------------------------------------------------- the clock -- */

/* Time between plays, with timeouts and the two-minute warning. */
function runoff(g, mode) {
  if (!g.clockRunning) { return; }
  const o = g.poss;
  const d = 1 - o;
  let r = mode === 'hurry' ? 14 : mode === 'milk' ? 40 : 34 + g.rng() * 6;
  if (g.restart) { r = Math.max(6, r - 12); }
  const late = (g.qtr === 2 && g.clock <= 120) || (g.qtr >= 4 && g.clock <= 150);
  if (mode === 'hurry' && late && g.sides[o].timeouts > 0 && r > 6 && g.clock > 8) {
    g.sides[o].timeouts -= 1;
    r = 3;
  } else if (g.qtr >= 4 && g.clock <= 180 && diffFor(g, d) < 0 && diffFor(g, d) >= -16 && g.sides[d].timeouts > 0) {
    g.sides[d].timeouts -= 1;
    r = 3;
  }
  tick(g, r);
  g.restart = false;
}

function tick(g, seconds) {
  const before = g.clock;
  g.clock -= seconds;
  if (g.qtr <= 4) { g.stats[g.poss].top += seconds; }
  if ((g.qtr === 2 || g.qtr === 4) && before > 120 && g.clock < 120) {
    g.clock = 120;
    g.clockRunning = false;
  }
  if (g.clock < 0) { g.clock = 0; }
}

/* After a play: how long it took, and whether the clock keeps running. */
function afterPlay(g, seconds, stops, outOfBounds) {
  tick(g, seconds);
  if (stops) { g.clockRunning = false; return; }
  if (outOfBounds) {
    const late = (g.qtr === 2 && g.clock <= 120) || (g.qtr >= 4 && g.clock <= 300);
    g.clockRunning = !late;
    g.restart = !late;
    return;
  }
  g.clockRunning = true;
}

/* --------------------------------------------------------- possessions -- */

function startPossession(g, side, yl) {
  g.poss = side;
  g.yl = clamp(Math.round(yl), 1, 99);
  g.down = 1;
  g.togo = Math.min(10, 100 - g.yl);
  g.stats[side].drives += 1;
  if (g.ot) { g.ot.started[side] = true; }
}

/* The offense's possession is over (a score, a punt, a turnover, downs). */
function possessionOver(g, td) {
  if (!g.ot) { return; }
  g.ot.done += 1;
  if (g.ot.done === 1 && td) { g.ot.firstTd = true; }
  checkOt(g);
}

function checkOt(g) {
  if (!g.ot || g.over) { return; }
  if (g.score[0] === g.score[1]) { return; }
  if (!g.playoff && g.ot.firstTd) { g.over = true; return; }
  if (g.ot.done >= 2) { g.over = true; }
}

function turnover(g, newYl) {
  possessionOver(g, false);
  g.clockRunning = false;
  if (g.over) { return; }
  startPossession(g, 1 - g.poss, newYl);
}

/* ------------------------------------------------------------- scoring -- */

function touchdown(g, side, text) {
  g.score[side] += 6;
  g.stats[side].tds += 1;
  g.clockRunning = false;
  g.converted = true;
  /* A walk-off touchdown in overtime has no try. */
  if (g.ot) {
    g.ot.done += 1;
    if (g.ot.done === 1 && side === g.poss) { g.ot.firstTd = true; }
    if (diffFor(g, side) > 0) { checkOt(g); }
    if (g.over) { scored(g, side, 'TD', text); return; }
  }
  tryAfter(g, side);
  scored(g, side, 'TD', text);
  if (g.ot) { checkOt(g); if (g.over) { return; } }
  kickoff(g, side);
}

function tryAfter(g, side) {
  const diff = diffFor(g, side);
  const D = g.sides[side].day;
  const opp = g.sides[1 - side].day;
  const chart = [-2, -5, -10, -13, 1, 5, 12];
  const late = g.qtr >= 4 || (g.qtr === 3 && g.clock < 300);
  const goForTwo = (late && chart.indexOf(diff) !== -1) || g.rng() < 0.055;
  if (goForTwo) {
    g.stats[side].twoPa += 1;
    const p = clamp(0.55 + 0.003 * (D.qb.ovr - MID) + 0.002 * (D.passBlock - opp.passRush) + 0.002 * (D.runBlockInside - opp.runDefInside), 0.3, 0.7);
    if (g.rng() < p) { g.score[side] += 2; g.stats[side].twoPm += 1; }
    return;
  }
  g.stats[side].xpa += 1;
  stat(g, side, D.k, 'xpa', 1);
  if (g.rng() < fgChance(D.k, 33)) {
    g.score[side] += 1;
    g.stats[side].xpm += 1;
    stat(g, side, D.k, 'xpm', 1);
  }
}

function safety(g) {
  const d = 1 - g.poss;
  g.score[d] += 2;
  scored(g, d, 'Safety', 'Safety');
  possessionOver(g, false);
  if (g.over) { return; }
  /* Free kick from the 20: a punt, really. */
  const recv = d;
  const land = 20 + Math.round(43 + g.rng.gauss() * 5);
  const ret = Math.max(0, Math.round(8 + g.rng.gauss() * 6));
  g.clockRunning = false;
  startPossession(g, recv, clamp(100 - land + ret, 10, 60));
}

/* ------------------------------------------------------- special teams -- */

function kickoff(g, kicker) {
  const recv = 1 - kicker;
  const K = g.sides[kicker].day.k;
  const R = g.sides[recv].day;
  g.stats[kicker].kickoffs += 1;
  g.clockRunning = false;
  const diff = diffFor(g, kicker);
  const onside = g.qtr >= 4 && g.clock <= 240 && diff < 0 && diff >= -16 && !g.over;
  if (onside) {
    if (g.rng() < 0.08) { startPossession(g, kicker, 45); } else { startPossession(g, recv, 55); }
    tick(g, 3);
    return;
  }
  if (g.rng() < clamp(0.73 + 0.01 * (skill(K, 'power') - 80), 0.5, 0.92)) {
    g.stats[kicker].touchbacks += 1;
    startPossession(g, recv, 25);
    return;
  }
  const returner = R.wrs[2] || R.rbs[0];
  if (g.rng() < 0.003) {
    tick(g, 12);
    startPossession(g, recv, 25);
    g.poss = recv;
    stat(g, recv, returner, 'retTd', 1);
    touchdown(g, recv, returner.name + ' kickoff return');
    return;
  }
  let spot = Math.round(23 + g.rng.gauss() * 6);
  if (g.rng() < 0.025) { spot = 38 + Math.round(g.rng.exp(10)); }
  tick(g, 6);
  startPossession(g, recv, clamp(spot, 5, 70));
}

function punt(g) {
  const o = g.poss;
  const d = 1 - o;
  const P = g.sides[o].day.p;
  const st = g.stats[o];
  st.punts += 1;
  stat(g, o, P, 'punts', 1);
  if (g.rng() < 0.003) {
    afterPlay(g, 6, true);
    turnover(g, 100 - Math.max(1, g.yl - 8));
    return;
  }
  let gross = Math.round(46 + 0.25 * (skill(P, 'power') - 80) + g.rng.gauss() * 5.5);
  if (g.yl >= 55) {
    /* Inside the opponent's half: aim for the corner, not the end zone. */
    const aim = Math.round(100 - g.yl - 8 + g.rng.gauss() * 5);
    gross = Math.min(gross, Math.max(20, aim));
  }
  stat(g, o, P, 'puntYards', gross);
  st.puntYards += gross;
  const land = g.yl + gross;
  let recvYl;
  let seconds = 8;
  if (land >= 100) {
    recvYl = 20;
  } else if (land >= 90 || g.rng() < 0.45) {
    recvYl = 100 - land;
  } else {
    let ret = Math.max(0, Math.round(8.5 + g.rng.gauss() * 6));
    if (g.rng() < 0.03) { ret += Math.round(g.rng.exp(18)); }
    recvYl = 100 - land + ret;
    seconds = 11;
    if (recvYl >= 100) {
      afterPlay(g, seconds, true);
      possessionOver(g, false);
      if (g.over) { return; }
      g.poss = d;
      const R = g.sides[d].day;
      const returner = R.wrs[2] || R.rbs[0];
      stat(g, d, returner, 'retTd', 1);
      touchdown(g, d, returner.name + ' punt return');
      return;
    }
  }
  afterPlay(g, seconds, true);
  turnover(g, recvYl);
}

function fieldGoal(g) {
  const o = g.poss;
  const K = g.sides[o].day.k;
  const dist = 100 - g.yl + 17;
  g.stats[o].fga += 1;
  stat(g, o, K, 'fga', 1);
  afterPlay(g, 5, true);
  const made = g.rng() < fgChance(K, dist) && g.rng() > 0.01;
  g.kicks.push({ team: g.sides[o].team.key, dist, made });
  if (made) {
    g.score[o] += 3;
    g.stats[o].fgm += 1;
    stat(g, o, K, 'fgm', 1);
    longest(g, o, K, 'fgLong', dist);
    scored(g, o, 'FG', K.name + ' ' + dist + '-yard field goal');
    possessionOver(g, false);
    if (g.over) { return; }
    kickoff(g, o);
    return;
  }
  turnover(g, Math.max(20, 100 - (g.yl - 7)));
}

/* ------------------------------------------------------------ decisions -- */

/* Fourth down: 'go', 'fg' or 'punt'. */
function fourthDown(g) {
  const o = g.poss;
  const K = g.sides[o].day.k;
  const dist = 100 - g.yl + 17;
  const inRange = dist <= kickRange(K);
  const diff = diffFor(g, o);
  const left = secondsLeft(g);
  const togo = g.togo;

  if (g.ot && diff === 0 && g.clock <= 150 && !inRange && togo <= 6) { return 'go'; }
  if (g.ot && g.ot.done >= 1 && diff < 0) {
    /* Overtime, behind, last chance. */
    if (diff >= -3 && inRange) { return 'fg'; }
    return 'go';
  }
  if (g.qtr >= 4 && diff < 0) {
    const fgTies = diff >= -3;
    if (left <= 25 && fgTies && inRange) { return 'fg'; }
    if (left <= 120 || (diff < -3 && left <= 240) || (diff < -8 && left <= 420) || (diff < -16 && left <= 720)) { return 'go'; }
  }
  if (g.qtr >= 4 && diff >= 0 && left <= 30 && inRange) { return 'fg'; }
  if (g.qtr === 2 && g.clock <= 20 && inRange) { return 'fg'; }

  let goChance = 0;
  if (inRange) {
    if (togo <= 1 && g.yl < 97) { goChance = 0.55; } else if (togo <= 1) { goChance = 0.65; } else if (togo <= 2) { goChance = 0.3; } else if (togo <= 4 && g.yl >= 95) { goChance = 0.15; }
    return g.rng() < goChance ? 'go' : 'fg';
  }
  if (g.yl >= 50) {
    goChance = togo <= 1 ? 0.9 : togo <= 2 ? 0.75 : togo <= 4 ? 0.5 : togo <= 6 ? 0.18 : 0.04;
  } else if (g.yl >= 30) {
    goChance = togo <= 1 ? 0.55 : togo <= 2 ? 0.25 : togo <= 3 ? 0.06 : 0.01;
  } else {
    goChance = togo <= 1 ? 0.1 : 0;
  }
  if (g.qtr >= 4 && diff < -8) { goChance = Math.min(1, goChance * 1.8 + 0.05); }
  if (g.qtr >= 4 && diff > 0) { goChance *= 0.5; }
  return g.rng() < goChance ? 'go' : 'punt';
}

/* Whether the offense can kneel out the half or the game. */
function shouldKneel(g) {
  const o = g.poss;
  const d = 1 - o;
  const diff = diffFor(g, o);
  if (g.qtr === 2 && g.clock <= 40 && g.yl < 45 && g.down < 4) { return true; }
  if (g.qtr < 4 || diff <= 0) { return false; }
  const kneels = 5 - g.down;
  const stoppable = Math.min(g.sides[d].timeouts, kneels - 1);
  const burnable = kneels * 2 + (kneels - 1 - stoppable) * 40 + (g.clockRunning && stoppable < kneels ? 40 : 0);
  return g.clock <= burnable && g.clock <= 160;
}

function passRate(g, O, mode) {
  let p = O.offense.pass - 0.02;
  const shift = (O.offense.pass - 0.59) * 0.5;
  if (g.down === 1) {
    if (g.togo > 10) { p += 0.12; }
  } else if (g.down === 2) {
    p += g.togo >= 8 ? 0.1 : g.togo <= 3 ? -0.14 : 0;
  } else {
    p = (g.togo >= 7 ? 0.9 : g.togo >= 4 ? 0.76 : g.togo >= 2 ? 0.55 : 0.33) + shift;
  }
  if (g.yl >= 98) { p -= 0.12; }
  const diff = diffFor(g, g.poss);
  if (mode === 'hurry') { p = Math.max(p, 0.82); }
  if (mode === 'milk') { p -= 0.3; }
  if (g.qtr >= 3 && mode === 'normal') {
    if (diff <= -14) { p += 0.12; }
    if (diff >= 14) { p -= 0.14; }
  }
  return clamp(p, 0.08, 0.96);
}

/* ------------------------------------------------------------- the play -- */

function snap(g) {
  const kneeling = shouldKneel(g);
  const mode = kneeling ? 'milk' : modeOf(g);
  runoff(g, mode);
  if (g.clock <= 0) { return; }
  if (kneeling) { kneel(g); return; }
  const o = g.poss;
  const O = g.sides[o].day;
  if (g.down === 4) {
    const call = fourthDown(g);
    if (call === 'punt') { punt(g); return; }
    if (call === 'fg') { fieldGoal(g); return; }
  } else if (endOfHalfKick(g)) {
    fieldGoal(g);
    return;
  }

  /* Pre-snap flags replay the down. */
  const r = g.rng();
  if (r < 0.03) { flag(g, o, -5, false); return; }
  if (r < 0.045) { flag(g, 1 - o, 5, false); return; }

  const st = g.stats[o];
  const startDown = g.down;
  if (startDown === 3) { st.third += 1; }
  if (startDown === 4) { st.fourth += 1; }
  g.converted = false;
  if (g.rng() < passRate(g, O, mode)) { pass(g, mode); } else { run(g, mode); }
  if (g.converted) {
    if (startDown === 3) { st.thirdMade += 1; }
    if (startDown === 4) { st.fourthMade += 1; }
  }
}

/* A penalty that replays the down: against the offense (`side` = offense,
   negative yards) or the defense. */
function flag(g, side, yards, automatic) {
  g.stats[side].penalties += 1;
  g.stats[side].penaltyYards += Math.abs(yards);
  g.clockRunning = false;
  if (yards < 0) {
    const loss = Math.min(-yards, Math.floor(g.yl / 2) || 0);
    g.yl -= loss;
    g.togo += loss;
    return;
  }
  const gain = Math.min(yards, Math.floor((100 - g.yl) / 2) || 1);
  g.yl += gain;
  g.togo -= gain;
  if (automatic || g.togo <= 0) {
    g.down = 1;
    g.togo = Math.min(10, 100 - g.yl);
    g.stats[g.poss].firstDowns += 1;
  }
}

function endOfHalfKick(g) {
  const o = g.poss;
  const K = g.sides[o].day.k;
  const inRange = 100 - g.yl + 17 <= kickRange(K);
  if (!inRange) { return false; }
  const diff = diffFor(g, o);
  if (g.qtr === 2 && g.clock <= 6) { return true; }
  if (g.qtr === 4 && g.clock <= 6 && diff <= 0 && diff >= -3) { return true; }
  if (g.qtr >= 5 && g.clock <= 6 && diff <= 0 && diff >= -3) { return true; }
  /* Overtime, tied, in easy range on third down: kick it. */
  if (g.ot && g.ot.done >= 2 && diff === 0 && g.down === 3 && 100 - g.yl + 17 <= 40) { return true; }
  return false;
}

function kneel(g) {
  const o = g.poss;
  g.stats[o].kneels += 1;
  g.stats[o].plays += 1;
  stat(g, o, g.sides[o].day.qb, 'rushAtt', 1);
  stat(g, o, g.sides[o].day.qb, 'rushYds', -1);
  afterPlay(g, 2, false);
  advance(g, -1);
}

/* The offense moved the ball `yards`; downs, first downs, touchdowns and
   safeties follow from where it ended up. Returns true on a touchdown. */
function advance(g, yards, scorer) {
  const o = g.poss;
  g.yl += yards;
  if (g.yl >= 100) {
    touchdown(g, o, scorer || 'Touchdown');
    return true;
  }
  if (g.yl <= 0) {
    g.clockRunning = false;
    safety(g);
    return false;
  }
  if (yards >= g.togo) {
    g.down = 1;
    g.togo = Math.min(10, 100 - g.yl);
    g.stats[o].firstDowns += 1;
    g.converted = true;
    return false;
  }
  g.down += 1;
  g.togo -= yards;
  if (g.down > 4) {
    g.clockRunning = false;
    turnover(g, 100 - g.yl);
  }
  return false;
}

function twoHighChance(def, O) {
  return clamp(def.twoHigh + 1.5 * (O.offense.deep - NORM.deep) + 0.012 * (O.deepThreat - MID), 0.1, 0.9);
}

function pickTarget(O, kind, rng, skip) {
  const list = skip ? O.targets.filter((t) => !skip(t.p)) : O.targets;
  return rng.pick(list.length ? list : O.targets, (t) => t.share * SUIT[t.group][kind] * Math.exp((t.catch[kind] - MID) / 45) *
    (1 + CHEMISTRY.looks[t.group] * t.chem));
}

/* Who covers the target, and how well, for this call. */
function coverage(D, t, kind, man, twoHigh, blitz) {
  let defender;
  let cov;
  if (t.slot === 'wr') {
    defender = D.cb[t.i] || D.cb[D.cb.length - 1];
    cov = skill(defender, man ? 'man' : 'zone');
  } else if (t.slot === 'te') {
    const sCov = skill(D.s[1], 'cover');
    const lCov = skill(D.lb[0], 'cover');
    if (man) { defender = sCov >= lCov ? D.s[1] : D.lb[0]; cov = Math.max(sCov, lCov) - 1; } else { defender = D.lb[0]; cov = (sCov + lCov) / 2; }
  } else {
    defender = blitz ? D.lb[1] : D.lb[0];
    cov = skill(defender, 'cover') - (blitz ? 2 : 0);
  }
  if (kind === 'deep' && t.slot !== 'rb') {
    const help = twoHigh ? D.range + 2 : D.highSafety - 3;
    cov = 0.55 * cov + 0.45 * help;
  } else if (kind === 'mid') {
    cov = man ? 0.9 * cov + 0.1 * D.range : 0.8 * cov + 0.2 * D.lbCover;
  } else if (kind === 'screen') {
    cov = 0.4 * cov + 0.6 * D.tackling;
  }
  if (blitz) { cov -= 3; }
  return { defender, cov };
}

function airYards(kind, rng, room) {
  let air;
  if (kind === 'screen') { air = Math.round(-2 + rng.gauss() * 1.2); } else if (kind === 'short') { air = clamp(Math.round(3 + rng.gauss() * 2.6), -3, 9); } else if (kind === 'mid') { air = 10 + Math.floor(rng() * 10); } else { air = 20 + Math.round(rng.exp(8)); }
  return Math.min(air, room);
}

function tackler(g, d, list) {
  const p = g.rng.pick(list, (x) => x[1])[0];
  stat(g, d, p, 'tackles', 1);
  hurt(g, d, p, 0.0012);
  return p;
}

function pass(g, mode) {
  const rng = g.rng;
  const o = g.poss;
  const d = 1 - o;
  const O = g.sides[o].day;
  const D = g.sides[d].day;
  const off = O.offense;
  const def = D.defense;
  const st = g.stats[o];
  const edge = g.edge[o] - g.edge[d];
  const room = 100 - g.yl;
  const hurry = mode === 'hurry';

  /* The call. */
  let kind;
  if (rng() < off.screen * (g.down >= 3 && g.togo >= 8 ? 0.5 : 1) * (hurry ? 0.4 : 1)) {
    kind = 'screen';
  } else {
    let sh = off.short;
    let mi = off.mid;
    let de = off.deep;
    if (g.down >= 3) {
      if (g.togo >= 10) { sh *= 0.55; mi *= 1.5; de *= 1.3; } else if (g.togo <= 3) { sh *= 1.6; de *= 0.6; }
    }
    if (hurry) { de *= 1.3; mi *= 1.2; }
    if (room <= 22) { mi += de; de = 0; }
    const x = rng() * (sh + mi + de);
    kind = x < sh ? 'short' : x < sh + mi ? 'mid' : 'deep';
  }
  const pa = kind !== 'screen' && !hurry && rng() < off.playAction * (g.down === 1 ? 1.3 : g.down === 2 ? 1.1 : 0.35);

  /* The defense's call. */
  const man = rng() < def.man;
  const twoHigh = rng() < twoHighChance(def, O);
  const blitz = rng() < def.blitz * (g.down >= 3 && g.togo >= 7 ? 1.4 : 0.9);
  st.dropbacks += 1;
  st.plays += 1;

  /* The rush against the protection. */
  const qb = O.qb;
  const poise = skill(qb, 'poise');
  const mob = skill(qb, 'mobility');
  const pPress = clamp(0.3 + 0.006 * (D.passRush - O.passBlock) + (blitz ? 0.1 : 0) + PRESSURE[kind] + (pa ? 0.03 : 0) +
                       0.4 * (off.pass - NORM.pass) -
                       0.002 * (poise - MID) - 0.006 * edge - CHEMISTRY.pressure * O.protect,
                       0.06 - 0.02 * Math.min(1, O.protect), 0.65);
  const pressured = rng() < pPress;
  if (pressured) {
    st.pressures += 1;
    hurt(g, o, qb, 0.0025);
    const pSack = clamp(0.22 - 0.004 * (poise - MID) - 0.003 * (mob - MID) + (blitz ? 0.02 : 0) + (kind === 'deep' ? 0.04 : 0), 0.06, 0.45) *
                  (1 - CHEMISTRY.sacked * O.protect);
    const pScramble = kind === 'screen' ? 0 : clamp(0.12 + 0.006 * (mob - MID), 0.02, 0.35);
    const x = rng();
    if (x < pSack) { sack(g, blitz); return; }
    if (x < pSack + pScramble) { scramble(g, mode); return; }
  } else if (kind !== 'screen' && rng() < clamp(0.026 + 0.0025 * (mob - MID), 0.004, 0.08)) {
    scramble(g, mode);
    return;
  }

  st.attempts += 1;
  stat(g, o, qb, 'passAtt', 1);
  if (kind === 'deep') { st.deepAttempts += 1; }

  /* Offensive holding wipes out the play; defensive holding gives five
     and a first down. */
  const holding = rng();
  if (holding < 0.034) {
    st.attempts -= 1;
    st.plays -= 1;
    st.dropbacks -= 1;
    stat(g, o, qb, 'passAtt', -1);
    afterPlay(g, 6, true);
    if (holding < 0.022) { flag(g, o, -10, false); } else { flag(g, d, 5, true); }
    return;
  }
  if (pressured && rng() < 0.12) {
    afterPlay(g, 5, true);
    advance(g, 0);
    return;
  }

  const t = pickTarget(O, kind, rng, room <= 12 ? (p) => capped(g, p) : null);
  const target = t.p;
  const { defender, cov } = coverage(D, t, kind, man, twoHigh, blitz);
  stat(g, o, target, 'targets', 1);
  hurt(g, o, target, 0.0035);

  const qbSkill = blend(qb, THROW[kind]);
  const rec = t.catch[kind];
  let pComp = COMPLETE[kind] + 0.0032 * (qbSkill - MID) + 0.0032 * (rec - cov) + (pa ? 0.035 : 0) +
              (blitz && !pressured ? 0.03 : 0) + 0.0048 * edge - LEAN[kind] * (off[kind] - NORM[kind]) + CHEMISTRY.complete * t.chem;
  if (pressured) { pComp -= 0.15 - 0.003 * (poise - MID); }
  /* A short field is a crowded one. */
  if (room <= 20 && kind !== 'screen') { pComp -= room <= 10 ? 0.08 : 0.04; }
  pComp = clamp(pComp, 0.08, 0.95);
  const decision = 0.6 * poise + 0.4 * skill(qb, 'accuracy');
  const hands = 0.5 * skill(defender, defender.pos === 'LB' ? 'cover' : 'ball') + 0.5 * D.ballSkills;
  const pInt = clamp(PICKED[kind] * Math.exp(-(decision - MID) / 36) * Math.exp((hands - MID) / 32) *
                     Math.exp(-(rec - cov) / 55) * (pressured ? 1.6 : 1) * (1 - CHEMISTRY.picked * Math.min(1, t.chem)), 0.001, 0.15);
  const x = rng();
  let air = airYards(kind, rng, room);

  if (x < pComp) {
    /* Caught. */
    let yac = 0;
    if (air < room) {
      const factor = Math.exp((t.after - D.tackling) / 42) * (room <= 15 ? 0.5 : 1);
      yac = Math.round(rng.exp(YAC[kind] * factor));
      const breakaway = clamp(0.012 + 0.0009 * (t.speed - D.range) + (kind === 'deep' ? 0.025 : 0), 0.003, 0.08);
      if (rng() < breakaway) { yac += Math.round(10 + rng.exp(20)); }
    }
    let gain = Math.min(room, air + yac);
    if (gain < -5) { gain = -5; }
    if (gain >= room && capped(g, target)) { gain = room - 1; }
    const after = clamp(gain - Math.max(0, air), 0, Math.max(0, gain));
    st.completions += 1;
    if (kind === 'deep') { st.deepCompletions += 1; }
    if (gain >= 20) { st.explosive += 1; st.explosivePass += 1; }
    st.passYards += gain;
    st.yards += gain;
    stat(g, o, qb, 'passCmp', 1);
    stat(g, o, qb, 'passYds', gain);
    stat(g, o, target, 'rec', 1);
    stat(g, o, target, 'recYds', gain);
    stat(g, o, target, 'recYac', after);
    stat(g, o, qb, 'passYac', after);
    longest(g, o, target, 'recLong', gain);
    const oob = rng() < (hurry ? 0.45 : mode === 'milk' ? 0.06 : 0.2);
    afterPlay(g, 6, false, oob);
    if (gain >= room) {
      stat(g, o, qb, 'passTd', 1);
      stat(g, o, target, 'recTd', 1);
      st.passTds += 1;
      scoring(g, o, 'pass', target, gain, qb);
      advance(g, gain, target.name + ' ' + gain + ' pass from ' + qb.name);
      return;
    }
    if (!oob) {
      const tk = defender && rng() < 0.5 ? defender : null;
      if (tk) { stat(g, d, tk, 'tackles', 1); } else { tackler(g, d, [[D.lb[0], 1], [D.lb[1], 1], [D.s[0], 1], [D.s[1], 1], [D.cb[0], 0.6], [D.cb[1], 0.6]]); }
    }
    if (rng() < 0.008) {
      /* Fumble after the catch, recovered by the defense. */
      stat(g, o, target, 'fumLost', 1);
      st.fumblesLost += 1;
      g.yl += gain;
      if (g.yl >= 100) { g.yl = 99; }
      g.clockRunning = false;
      turnover(g, 100 - g.yl);
      return;
    }
    advance(g, gain);
    return;
  }

  if (x < pComp + pInt) {
    /* Picked off. */
    st.ints += 1;
    stat(g, o, qb, 'passInt', 1);
    const picker = rng.pick([[defender, 2.2], [D.s[0], 1], [D.s[1], 1], [D.cb[0], 0.5], [D.cb[1], 0.5], [D.lb[0], 0.25]], (x) => x[1])[0];
    stat(g, d, picker, 'ints', 1);
    const spot = g.yl + Math.max(1, air);
    afterPlay(g, 7, true);
    if (rng() < 0.075) {
      possessionOver(g, false);
      if (g.over) { return; }
      g.poss = d;
      stat(g, d, picker, 'defTd', 1);
      touchdown(g, d, picker.name + ' interception return');
      return;
    }
    let newYl = spot >= 100 ? 20 : 100 - spot + Math.round(rng.exp(9));
    if (spot >= 100 && rng() < 0.3) { newYl = Math.round(5 + rng.exp(15)); }
    turnover(g, clamp(newYl, 1, 99));
    return;
  }

  /* Incomplete. Deep and intermediate throws draw interference flags. */
  if (kind !== 'screen' && kind !== 'short' && rng() < 0.055) {
    const spotGain = Math.max(1, Math.min(air, room - 1));
    afterPlay(g, 5, true);
    g.stats[d].penalties += 1;
    g.stats[d].penaltyYards += spotGain;
    g.yl += spotGain;
    g.down = 1;
    g.togo = Math.min(10, 100 - g.yl);
    st.firstDowns += 1;
    g.converted = true;
    return;
  }
  if (defender && rng() < 0.4) { stat(g, d, defender, 'passDef', 1); }
  afterPlay(g, 5, true);
  advance(g, 0);
}

function sack(g, blitz) {
  const rng = g.rng;
  const o = g.poss;
  const d = 1 - o;
  const O = g.sides[o].day;
  const D = g.sides[d].day;
  const st = g.stats[o];
  const loss = clamp(Math.round(5 + rng.exp(2.3)), 1, 16);
  st.sacks += 1;
  st.sackYards += loss;
  st.yards -= loss;
  stat(g, o, O.qb, 'sacked', 1);
  /* Edge rushers get about half of a team's sacks; the rest go to the
     interior, the linebackers, the rotation and the odd blitzing back. */
  const rushers = D.rushers.map((p) => [p, (p.pos === 'EDGE' ? 0.85 : 0.5) * Math.exp((skill(p, 'rush') - MID) / 30)]);
  const depth = D.depth;
  rushers.push([depth.EDGE[2] || D.edge[1], 0.5], [depth.DI[2] || D.di[1], 0.3], [D.lb[0], blitz ? 0.6 : 0.3],
               [D.lb[1], blitz ? 0.3 : 0.1], [D.s[0], blitz ? 0.2 : 0.05], [D.cb[2], 0.04]);
  const sacker = rng.pick(rushers, (x) => x[1])[0];
  stat(g, d, sacker, 'sacks', 1);
  hurt(g, o, O.qb, 0.012);
  afterPlay(g, 6, false);
  if (rng() < 0.06) {
    stat(g, o, O.qb, 'fumLost', 1);
    stat(g, d, sacker, 'ff', 1);
    st.fumblesLost += 1;
    g.yl = Math.max(1, g.yl - loss);
    turnover(g, 100 - g.yl);
    return;
  }
  advance(g, -loss);
}

function scramble(g, mode) {
  const rng = g.rng;
  const o = g.poss;
  const d = 1 - o;
  const O = g.sides[o].day;
  const D = g.sides[d].day;
  const st = g.stats[o];
  const qb = O.qb;
  const mob = skill(qb, 'mobility');
  let gain = Math.round(1 + rng.exp(Math.max(2, 4.6 + 0.1 * (mob - MID))));
  if (gain > 25 && rng() < 0.6) { gain = 25; }
  gain = Math.min(gain, 100 - g.yl);
  st.scrambles += 1;
  st.carries += 1;
  if (gain >= 10) { st.explosiveRun += 1; }
  st.rushYards += gain;
  st.yards += gain;
  stat(g, o, qb, 'rushAtt', 1);
  stat(g, o, qb, 'rushYds', gain);
  longest(g, o, qb, 'rushLong', gain);
  hurt(g, o, qb, 0.003);
  const oob = rng() < (mode === 'hurry' ? 0.6 : 0.35);
  afterPlay(g, 6, false, oob);
  if (gain >= 100 - g.yl) {
    stat(g, o, qb, 'rushTd', 1);
    st.rushTds += 1;
    scoring(g, o, 'run', qb, gain);
    advance(g, gain, qb.name + ' ' + gain + ' run');
    return;
  }
  if (!oob) { tackler(g, d, [[D.lb[0], 1], [D.lb[1], 1], [D.s[0], 0.8], [D.edge[0], 0.6], [D.edge[1], 0.6]]); }
  advance(g, gain);
}

/* How often the quarterback keeps a designed run: the team's tendency,
   more with legs like his and less without. */
function qbRunChance(off, qb) { return off.qbRun * clamp((skill(qb, 'mobility') - 60) / 20, 0.2, 1.6); }

function run(g, mode) {
  const rng = g.rng;
  const o = g.poss;
  const d = 1 - o;
  const O = g.sides[o].day;
  const D = g.sides[d].day;
  const off = O.offense;
  const def = D.defense;
  const st = g.stats[o];
  const edge = g.edge[o] - g.edge[d];
  const room = 100 - g.yl;
  const qb = O.qb;
  const mob = skill(qb, 'mobility');

  /* Third or fourth and a yard: the quarterback sneak, about as sure a
     thing as football has. */
  if (g.down >= 3 && g.togo <= 1 && room > 1 && rng() < (g.down === 4 ? 0.5 : 0.3)) {
    const push = O.runBlockInside - D.runDefInside;
    const gain = rng() < clamp(0.82 + 0.006 * push, 0.6, 0.95) ? (rng() < 0.75 ? 1 : 2) : 0;
    st.carries += 1;
    st.plays += 1;
    st.rushYards += gain;
    st.yards += gain;
    stat(g, o, qb, 'rushAtt', 1);
    stat(g, o, qb, 'rushYds', gain);
    afterPlay(g, 4, false);
    tackler(g, d, [[D.di[0], 1], [D.di[1], 1], [D.lb[0], 1]]);
    advance(g, gain);
    return;
  }

  /* Who carries it, and which way. */
  let carrier;
  let qbRun = false;
  let outside = rng() < off.outside * (room <= 3 ? 0.5 : 1);
  if (rng() < qbRunChance(off, qb)) {
    carrier = qb;
    qbRun = true;
  } else if (rng() < 0.025) {
    carrier = O.wrs.reduce((a, b) => (skill(b, 'speed') > skill(a, 'speed') ? b : a));
    outside = true;
  } else {
    carrier = O.rbs.length > 1 ? rng.pick(O.rbs, (p) => (p === O.rbs[0] ? 1.4 * Math.exp((p.ovr - O.rbs[1].ovr) / 30) : 1)) : O.rbs[0];
    /* Near the goal line the other back gets it once this one has three. */
    if (room <= 12 && capped(g, carrier)) { carrier = O.rbs.filter((p) => p !== carrier && !capped(g, p))[0] || carrier; }
  }

  /* Blocking and the runner against the front. */
  const block = outside ? O.runBlockOutside : O.runBlockInside;
  const front = outside ? D.runDefOutside : D.runDefInside;
  let runner;
  if (qbRun) { runner = mob + 2; } else if (carrier.pos === 'WR') { runner = 0.5 * skill(carrier, 'speed') + 0.5 * skill(carrier, 'yac'); } else if (outside) {
    runner = 0.35 * skill(carrier, 'vision') + 0.35 * skill(carrier, 'speed') + 0.3 * skill(carrier, 'elusive');
  } else {
    runner = 0.35 * skill(carrier, 'vision') + 0.4 * skill(carrier, 'power') + 0.25 * skill(carrier, 'elusive');
  }
  /* Two deep safeties leave a light box. */
  const twoHigh = rng() < twoHighChance(def, O);
  const box = (twoHigh ? 2.5 : -1) + (6.3 - (def.box || 6.3)) * 3 - 15 * (NORM.pass - off.pass);
  let adv = 0.4 * (block - front) + 0.32 * (runner - MID) + box + 0.56 * edge;
  /* Near the goal line there is no room behind the defense. */
  if (room <= 10) { adv -= 1.5; }

  st.carries += 1;
  st.plays += 1;
  let gain;
  const pStuff = clamp(0.19 - 0.005 * adv, 0.07, 0.35);
  const pBig = clamp(0.115 + 0.0035 * adv, 0.04, 0.2);
  const x = rng();
  if (x < pStuff) {
    gain = -Math.round(rng.exp(1.3));
  } else if (x < pStuff + pBig) {
    const speed = qbRun ? mob : skill(carrier, 'speed');
    gain = 10 + Math.round(rng.exp(5 * Math.exp((speed - D.range) / 40)));
    if (rng() < 0.12) { gain += Math.round(rng.exp(20)); }
  } else {
    gain = clamp(Math.round(4.1 + 0.07 * adv + rng.gauss() * 2.2), 0, 9);
  }
  if (room <= 2 && gain < room && rng() < clamp(0.12 + 0.004 * adv + (qbRun ? 0.05 : 0), 0.02, 0.3)) { gain = room; }
  gain = Math.min(gain, room);
  if (gain >= room && !qbRun && capped(g, carrier)) { gain = room - 1; }
  if (gain >= 10) { st.explosive += 1; st.explosiveRun += 1; }
  st.rushYards += gain;
  st.yards += gain;
  stat(g, o, carrier, 'rushAtt', 1);
  stat(g, o, carrier, 'rushYds', gain);
  longest(g, o, carrier, 'rushLong', gain);
  hurt(g, o, carrier, 0.0035);

  /* Offensive holding takes it back. */
  if (gain > 3 && rng() < 0.025) {
    if (gain >= 10) { st.explosive -= 1; st.explosiveRun -= 1; }
    st.carries -= 1;
    st.plays -= 1;
    st.rushYards -= gain;
    st.yards -= gain;
    stat(g, o, carrier, 'rushAtt', -1);
    stat(g, o, carrier, 'rushYds', -gain);
    afterPlay(g, 5, true);
    flag(g, o, -10, false);
    return;
  }
  const oob = outside && rng() < (mode === 'hurry' ? 0.3 : 0.12);
  afterPlay(g, 5, false, oob);
  if (gain >= room) {
    stat(g, o, carrier, 'rushTd', 1);
    st.rushTds += 1;
    scoring(g, o, 'run', carrier, gain);
    advance(g, gain, carrier.name + ' ' + gain + ' run');
    return;
  }
  if (!oob) {
    const list = outside ?
      [[D.edge[0], 1], [D.edge[1], 1], [D.lb[0], 1.4], [D.lb[1], 1.2], [D.cb[0], 0.5], [D.cb[1], 0.5], [D.s[0], 0.6], [D.s[1], 0.6]] :
      [[D.di[0], 1.2], [D.di[1], 1.2], [D.lb[0], 1.6], [D.lb[1], 1.3], [D.edge[0], 0.6], [D.edge[1], 0.6], [D.s[0], 0.4], [D.s[1], 0.5]];
    tackler(g, d, list);
  }
  if (rng() < 0.0068) {
    stat(g, o, carrier, 'fumLost', 1);
    st.fumblesLost += 1;
    g.yl = clamp(g.yl + gain, 1, 99);
    g.clockRunning = false;
    turnover(g, 100 - g.yl);
    return;
  }
  advance(g, gain);
}

/* ------------------------------------------------------------ the game -- */

function endQuarter(g) {
  if (g.qtr === 1 || g.qtr === 3) {
    g.qtr += 1;
    g.clock = QUARTER;
    return;
  }
  if (g.qtr === 2) {
    g.qtr = 3;
    g.clock = QUARTER;
    g.sides[0].timeouts = 3;
    g.sides[1].timeouts = 3;
    kickoff(g, g.firstReceiver);
    return;
  }
  if (g.score[0] !== g.score[1]) { g.over = true; return; }
  if (g.qtr === 4) {
    g.qtr = 5;
    g.clock = g.playoff ? QUARTER : OT_REGULAR;
    g.sides[0].timeouts = 2;
    g.sides[1].timeouts = 2;
    g.ot = { done: 0, firstTd: false, started: [false, false] };
    kickoff(g, g.rng() < 0.5 ? 0 : 1);
    return;
  }
  if (g.playoff) {
    g.qtr += 1;
    g.clock = QUARTER;
    return;
  }
  g.over = true;
}

/* Plays one game. `home` and `away` are { team, roster }; `opts` takes
   `playoff` (overtime until somebody wins), `neutral` (no home edge),
   `noInjuries` and `links` (connections, by player id). Returns the score, team stats, every player's box score,
   the scoring plays and who got hurt. */
function playGame(home, away, rng, opts) {
  opts = opts || {};
  const g = {
    rng,
    opts,
    playoff: !!opts.playoff,
    sides: [makeSide(home, 0, opts.links), makeSide(away, 1, opts.links)],
    score: [0, 0],
    qtr: 1,
    clock: QUARTER,
    clockRunning: false,
    restart: false,
    poss: 0, yl: 25, down: 1, togo: 10,
    edge: opts.neutral ? [0, 0] : [HOME_EDGE / 2, -HOME_EDGE / 2],
    stats: [teamStats(), teamStats()],
    box: {},
    scoring: [],
    tds: [],
    injuries: [],
    kicks: [],
    over: false,
    ot: null,
    firstReceiver: rng() < 0.5 ? 0 : 1
  };
  kickoff(g, 1 - g.firstReceiver);
  let guard = 0;
  while (!g.over && guard < 400) {
    guard += 1;
    if (g.clock <= 0) { endQuarter(g); continue; }
    snap(g);
  }
  wearAndTear(g);
  const keys = [g.sides[0].team.key, g.sides[1].team.key];
  return {
    home: keys[0],
    away: keys[1],
    score: g.score,
    winner: g.score[0] > g.score[1] ? keys[0] : g.score[1] > g.score[0] ? keys[1] : null,
    ot: !!g.ot,
    playoff: g.playoff,
    stats: g.stats,
    box: g.box,
    scoring: g.scoring,
    tds: g.tds,
    kicks: g.kicks,
    injuries: g.injuries
  };
}

module.exports = { playGame, fgChance, HOME_EDGE, prepare, qbRunChance };
