/* ==========================================================================
   EGE Football NFL sim — what players, picks and contracts are worth
   One scale for trades, free agency and the draft board.

   A player is worth what he will give a team over the next four seasons,
   less what it has to pay him, each year counted a little less than the
   one before. What he gives is his overall (each point at the top worth
   far more than one in the middle) times what his position is worth, and
   the overall in later years comes from the aging curves -- so a 29-year-
   old back is worth a fraction of a 24-year-old with the same overall, and
   a regressing star goes for less than a young one.

   Picks are on a smooth fit to the Rich Hill draft value chart (1,000
   points for the first pick, about 270 for the 32nd, 120 for the 64th),
   with next year's picks counted as a bit less and the year after's less
   again.
   ========================================================================== */

'use strict';

const { expectedChange, growthRate } = require('./aging');

/* What each position is worth to a team, relative to an average one. */
const POSITION = { QB: 1.6, EDGE: 1.2, OT: 1.1, WR: 1.1, CB: 1.05, DI: 1.0, S: 0.85, TE: 0.85, IOL: 0.85, LB: 0.8,
                   RB: 0.7, FB: 0.25, K: 0.25, P: 0.2 };

/* The top of each position's market in 2024, $M a year. */
const TOP_PAY = { QB: 55, EDGE: 34, WR: 35, DI: 31, OT: 28, CB: 24, S: 20, LB: 20, IOL: 22, TE: 19, RB: 16, FB: 4,
                  K: 6, P: 4 };
/* Share of the top of the market by overall. */
const PAY_CURVE = [[60, 0.01], [65, 0.03], [70, 0.08], [75, 0.18], [80, 0.35], [85, 0.55], [90, 0.78], [95, 0.92], [99, 1]];
const MIN_PAY = 1.1;

/* The salary cap, $M. Real through 2025; 2026 as projected; 7% a year
   after that. */
const CAP = { 2023: 224.8, 2024: 255.4, 2025: 279.2, 2026: 301.2 };

function capFor(season) {
  if (CAP[season]) { return CAP[season]; }
  return Math.round(CAP[2026] * Math.pow(1.07, season - 2026) * 10) / 10;
}

function lerp(table, x) {
  if (x <= table[0][0]) { return table[0][1]; }
  for (let i = 1; i < table.length; i += 1) {
    if (x <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
  }
  return table[table.length - 1][1];
}

/* The whole market a little under the top-of-market deals: paid like
   this, a typical roster (with its rookie contracts) comes to about the
   cap, as real ones do. */
const MARKET = 0.87;

/* What a player at this overall gets on the open market, $M a year. Older
   players get less for the same overall. */
function marketPay(p, season, ovr) {
  const o = typeof ovr === 'number' ? ovr : p.ovr;
  let pay = MARKET * (TOP_PAY[p.pos] || 10) * lerp(PAY_CURVE, o) * capFor(season) / CAP[2024];
  if (p.age >= 30) { pay *= Math.max(0.55, 1 - 0.07 * (p.age - 29)); }
  return Math.max(MIN_PAY * capFor(season) / CAP[2024], Math.round(pay * 10) / 10);
}

/* On-field value of one season at this overall. */
function seasonWorth(pos, ovr) {
  return (POSITION[pos] || 0.8) * Math.exp((ovr - 70) / 7);
}

/* $1M of salary in the same units as seasonWorth: a market contract eats
   most of what a veteran gives a team, so veterans on big deals go for
   little in trades and cheap young players for a lot, as in the NFL. */
function dollarWorth(season) {
  return 0.9 * CAP[2024] / capFor(season);
}

/* His overall over the next `years` seasons, by the aging curves. */
function projection(p, years) {
  const out = [p.ovr];
  let ovr = p.ovr;
  let pot = p.pot || p.ovr;
  for (let t = 1; t < years; t += 1) {
    const age = (p.age || 26) + t;
    const growth = Math.max(0, pot - ovr) * growthRate(age);
    const change = p.ege ? 0 : growth + expectedChange(p.pos, age, p.longevity);
    ovr = Math.max(40, Math.min(99, ovr + change));
    out.push(ovr);
  }
  return out;
}

/* A player's value to a team. `view` adjusts it for the team looking:
   { mode: 'compete'|'retool'|'rebuild', need: 0-1, fit: overall points }. */
function playerValue(p, season, view) {
  view = view || {};
  const years = 4;
  const proj = projection(p, years);
  const discount = view.mode === 'rebuild' ? 0.9 : view.mode === 'compete' ? 0.72 : 0.8;
  let total = 0;
  for (let t = 0; t < years; t += 1) {
    const under = p.contract && typeof p.contract.apy === 'number' && p.contract.through >= season + t;
    const pay = under ? p.contract.apy * capFor(season + t) / capFor(season) : marketPay(p, season + t, proj[t]);
    let worth = seasonWorth(p.pos, proj[t]);
    if (t === 0 && view.mode === 'compete') { worth *= 1.25; }
    const net = worth - pay * dollarWorth(season) * (under ? 0.7 : 0.8);
    total += Math.pow(discount, t) * Math.max(net, worth * 0.15);
  }
  if (view.mode === 'rebuild' && p.age >= 29) { total *= 0.6; }
  if (view.need) { total *= 1 + 0.35 * view.need; }
  if (view.fit) { total *= 1 + 0.03 * Math.max(-5, Math.min(5, view.fit)); }
  return total;
}

/* Rich Hill points for an overall pick number. */
function pickPoints(n) {
  if (n <= 32) { return 1000 * Math.exp(-0.042 * (n - 1)); }
  return 1000 * Math.exp(-1.31 - 0.0245 * (n - 32));
}

/* Points per unit of player value: the first pick is worth about what a
   young 92-rated corner on a rookie deal is. */
const POINTS_PER_UNIT = 15;

/* A pick's value: its slot (where the team that owns it is expected to
   finish if it is not set yet) and how far off it is. More than three
   drafts off, nobody knows where a team will be: the slot drifts back to
   the middle of the round. */
function pickValue(pick, season, slotOf, view) {
  const yearsOut = Math.max(0, pick.year - season - (pick.thisDraft ? 1 : 0));
  let slot = typeof pick.slot === 'number' ? pick.slot : (slotOf ? slotOf(pick.from) : 16);
  if (typeof pick.slot !== 'number' && yearsOut > 3) { slot = 16.5 + (slot - 16.5) * Math.pow(0.6, yearsOut - 3); }
  const n = (pick.round - 1) * 32 + slot;
  let v = pickPoints(n) / POINTS_PER_UNIT * Math.pow(0.85, yearsOut);
  if (view && view.mode === 'rebuild') { v *= 1.2; }
  if (view && view.mode === 'compete') { v *= 0.85; }
  return v;
}

module.exports = { POSITION, TOP_PAY, capFor, marketPay, playerValue, pickPoints, pickValue, projection, seasonWorth,
                   POINTS_PER_UNIT };
