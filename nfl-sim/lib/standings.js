/* ==========================================================================
   EGE Football NFL sim — standings and seeding
   Records from a season's results, ordered the NFL's way: win percentage,
   then head-to-head, division record (inside a division), conference
   record, point differential and points scored, and a coin flip (a fixed
   one, so the same results always give the same order).
   ========================================================================== */

'use strict';

const { TEAMS, KEYS } = require('./teams');
const { hash } = require('./rng');

function blank(key) {
  return { key, w: 0, l: 0, t: 0, pf: 0, pa: 0, divW: 0, divL: 0, divT: 0, confW: 0, confL: 0, confT: 0, vs: {} };
}

function pct(w, l, t) { const g = w + l + t; return g ? (w + t / 2) / g : 0; }

/* Every team's record from the regular-season games that have a score. */
function records(games) {
  const rec = {};
  KEYS.forEach((k) => { rec[k] = blank(k); });
  games.forEach((g) => {
    if (!g.score || g.playoff) { return; }
    const [hs, as] = g.score;
    const h = rec[g.home];
    const a = rec[g.away];
    const sameDiv = TEAMS[g.home].conf === TEAMS[g.away].conf && TEAMS[g.home].div === TEAMS[g.away].div;
    const sameConf = TEAMS[g.home].conf === TEAMS[g.away].conf;
    [[h, hs, as, g.away], [a, as, hs, g.home]].forEach(([r, mine, theirs, opp]) => {
      r.pf += mine;
      r.pa += theirs;
      const res = mine > theirs ? 'W' : mine < theirs ? 'L' : 'T';
      r[res.toLowerCase()] += 1;
      if (sameDiv) { r['div' + res] += 1; }
      if (sameConf) { r['conf' + res] += 1; }
      const v = r.vs[opp] || (r.vs[opp] = { w: 0, l: 0, t: 0 });
      v[res.toLowerCase()] += 1;
    });
  });
  Object.keys(rec).forEach((k) => {
    const r = rec[k];
    r.pct = pct(r.w, r.l, r.t);
    r.divPct = pct(r.divW, r.divL, r.divT);
    r.confPct = pct(r.confW, r.confL, r.confT);
    r.diff = r.pf - r.pa;
  });
  return rec;
}

/* Orders tied teams by the tiebreakers, applied to the whole group. */
function breakTie(group, rec, season) {
  if (group.length < 2) { return group; }
  const keys = group.map((r) => r.key);
  const h2h = (r) => {
    let w = 0;
    let l = 0;
    let t = 0;
    keys.forEach((k) => { const v = r.vs[k]; if (v) { w += v.w; l += v.l; t += v.t; } });
    return w + l + t ? pct(w, l, t) : 0.5;
  };
  const sameDiv = group.every((r) => TEAMS[r.key].div === TEAMS[group[0].key].div && TEAMS[r.key].conf === TEAMS[group[0].key].conf);
  return group.slice().sort((a, b) =>
    (h2h(b) - h2h(a)) ||
    (sameDiv ? b.divPct - a.divPct : 0) ||
    (b.confPct - a.confPct) ||
    (b.diff - a.diff) ||
    (b.pf - a.pf) ||
    (hash(season + a.key) - hash(season + b.key)));
}

function order(list, rec, season) {
  const sorted = list.slice().sort((a, b) => b.pct - a.pct);
  const out = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && Math.abs(sorted[j].pct - sorted[i].pct) < 1e-9) { j += 1; }
    out.push.apply(out, breakTie(sorted.slice(i, j), rec, season));
    i = j;
  }
  return out;
}

/* Division tables, and each conference's seven playoff seeds. */
function standings(games, season) {
  const rec = records(games);
  const divisions = {};
  KEYS.forEach((k) => {
    const name = TEAMS[k].conf + ' ' + TEAMS[k].div;
    (divisions[name] = divisions[name] || []).push(rec[k]);
  });
  Object.keys(divisions).forEach((d) => { divisions[d] = order(divisions[d], rec, season); });
  const seeds = {};
  ['AFC', 'NFC'].forEach((conf) => {
    const winners = order(Object.keys(divisions).filter((d) => d.indexOf(conf) === 0).map((d) => divisions[d][0]), rec, season);
    const rest = order(KEYS.filter((k) => TEAMS[k].conf === conf && winners.indexOf(rec[k]) === -1).map((k) => rec[k]), rec, season);
    seeds[conf] = winners.concat(rest.slice(0, 3)).map((r) => r.key);
  });
  return { records: rec, divisions, seeds };
}

function recordText(r) { return r.w + '-' + r.l + (r.t ? '-' + r.t : ''); }

module.exports = { standings, records, recordText, order };
