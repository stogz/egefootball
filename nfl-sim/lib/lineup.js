/* ==========================================================================
   EGE Football NFL sim — who plays
   A team's depth chart, and what its units add up to on game day.

   The depth chart is every healthy player at a position, best first, where
   best is his overall plus half his fit in the team's scheme -- so a Wide
   Zone team starts the back who sees the cutback lane over a slightly
   better power back, and a Cover 1 team starts its man corners. Injured
   players are left off until they are back.

   Game day is nickel against eleven personnel, the way most NFL snaps are
   played: on offense a quarterback, two backs who share the carries, three
   receivers, two tight ends (the second on heavy downs), five linemen, a
   kicker and a punter; on defense two edge rushers, two interior linemen,
   two linebackers, three corners and two safeties.
   ========================================================================== */

'use strict';

const { fitOf, schemeFor } = require('./schemes');

const DEPTH = { QB: 2, RB: 3, FB: 1, WR: 5, TE: 3, OT: 3, IOL: 4, EDGE: 4, DI: 4, LB: 3, CB: 5, S: 3, K: 1, P: 1 };

function healthy(p) { return !(p.injury && p.injury.games > 0); }

/* Best first, by overall plus half of scheme fit. */
function depthChart(team, roster) {
  const out = {};
  Object.keys(DEPTH).forEach((pos) => { out[pos] = []; });
  roster.forEach((p) => {
    if (out[p.pos] && healthy(p)) { out[p.pos].push(p); }
  });
  Object.keys(out).forEach((pos) => {
    const scheme = schemeFor(team, pos);
    out[pos].sort((a, b) => (b.ovr + 0.5 * fitOf(b, scheme)) - (a.ovr + 0.5 * fitOf(a, scheme)));
  });
  /* A fullback can carry if there is nobody else; a team with no tight end
     plays a fourth receiver. */
  if (out.RB.length < 2) { out.RB = out.RB.concat(out.FB); }
  return out;
}

/* A stand-in for a hole on the depth chart: a 55 at the position. */
function standIn(pos, team) {
  return { id: 'standin:' + team + ':' + pos, name: team + ' ' + pos, pos, ovr: 55, standIn: true,
           skills: {}, durability: 70 };
}

function skill(p, key) {
  if (!p) { return 55; }
  const v = p.skills && p.skills[key];
  return typeof v === 'number' ? v : p.ovr;
}

function weighted(list, keyOf) {
  let total = 0;
  let weight = 0;
  list.forEach(([p, w]) => {
    if (!p) { return; }
    total += keyOf(p) * w;
    weight += w;
  });
  return weight ? total / weight : 55;
}

/* Everything the game engine needs about one team on one day. */
function gameDay(team, roster) {
  const d = depthChart(team, roster);
  const get = (pos, i) => d[pos][i] || standIn(pos, team.key);
  const qb = get('QB', 0);
  const rbs = [get('RB', 0), d.RB[1] || null].filter(Boolean);
  const wrs = [get('WR', 0), get('WR', 1), d.WR[2] || d.TE[2] || get('WR', 2)];
  const tes = [d.TE[0] || d.WR[3] || get('TE', 0), d.TE[1] || null].filter(Boolean);
  const ot = [get('OT', 0), get('OT', 1)];
  const iol = [get('IOL', 0), get('IOL', 1), get('IOL', 2)];
  const edge = [get('EDGE', 0), get('EDGE', 1)];
  const di = [get('DI', 0), get('DI', 1)];
  const lb = [get('LB', 0), get('LB', 1)];
  const cb = [get('CB', 0), get('CB', 1), get('CB', 2)];
  const s = [get('S', 0), get('S', 1)];

  const line = [[ot[0], 1.25], [ot[1], 1.1], [iol[0], 0.9], [iol[1], 0.9], [iol[2], 0.9]];
  const inside = [[ot[0], 0.9], [ot[1], 0.9], [iol[0], 1.2], [iol[1], 1.2], [iol[2], 1.2]];
  const outside = [[ot[0], 1.2], [ot[1], 1.2], [iol[0], 0.9], [iol[1], 0.9], [iol[2], 0.9], [tes[0], 0.8]];

  return {
    team,
    depth: d,
    qb, backupQb: d.QB[1] || standIn('QB', team.key),
    rbs, wrs, tes, ol: ot.concat(iol),
    k: get('K', 0), p: get('P', 0),
    edge, di, lb, cb, s,
    passBlock: weighted(line, (p) => skill(p, 'passBlock')),
    runBlockInside: weighted(inside.concat([[tes[0], 0.4]]), (p) => skill(p, p.pos === 'TE' ? 'block' : 'runBlock')),
    runBlockOutside: weighted(outside, (p) => skill(p, p.pos === 'TE' ? 'block' : 'runBlock')),
    passRush: weighted([[edge[0], 1.3], [edge[1], 1.3], [di[0], 0.8], [di[1], 0.8]], (p) => skill(p, 'rush')),
    blitz: weighted([[lb[0], 1], [lb[1], 1], [s[0], 0.4]], (p) => skill(p, p.pos === 'S' ? 'box' : 'blitz')),
    runDefInside: weighted([[di[0], 1.3], [di[1], 1.3], [lb[0], 1.1], [lb[1], 1.1], [edge[0], 0.6], [edge[1], 0.6], [s[0], 0.3], [s[1], 0.3]],
      (p) => skill(p, p.pos === 'S' ? 'box' : 'run')),
    runDefOutside: weighted([[edge[0], 1.2], [edge[1], 1.2], [lb[0], 1], [lb[1], 1], [di[0], 0.5], [di[1], 0.5], [s[0], 0.5], [s[1], 0.5], [cb[0], 0.3], [cb[1], 0.3]],
      (p) => skill(p, p.pos === 'S' ? 'box' : p.pos === 'CB' ? 'tackle' : p.pos === 'LB' ? 'speed' : 'run')),
    tackling: weighted([[lb[0], 1], [lb[1], 1], [s[0], 0.8], [s[1], 0.8], [cb[0], 0.5], [cb[1], 0.5], [cb[2], 0.5]],
      (p) => skill(p, p.pos === 'S' ? 'box' : p.pos === 'CB' ? 'tackle' : 'run')),
    range: Math.max(skill(s[0], 'range'), skill(s[1], 'range')) * 0.6 + Math.min(skill(s[0], 'range'), skill(s[1], 'range')) * 0.4,
    ballSkills: weighted([[cb[0], 1], [cb[1], 1], [cb[2], 0.7], [s[0], 1], [s[1], 1], [lb[0], 0.4]], (p) => skill(p, p.pos === 'LB' ? 'cover' : 'ball')),
    offense: team.offenseTendencies,
    defense: team.defenseTendencies
  };
}

module.exports = { depthChart, gameDay, skill, healthy, standIn };
