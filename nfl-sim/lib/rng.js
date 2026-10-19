/* ==========================================================================
   EGE Football NFL sim — dice
   Every random thing in the sim comes from one of these, seeded, so the
   same league with the same seed plays out exactly the same way. That is
   what lets a season be re-run to check a change, and what keeps team
   ratings from wobbling between two runs.
   ========================================================================== */

'use strict';

/* mulberry32: small, fast and good enough for a football game. */
function seeded(seed) {
  let s = (typeof seed === 'string' ? hash(seed) : seed) >>> 0;
  const next = function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.gauss = function () {
    const u = Math.max(next(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
  };
  /* An exponential draw with this mean. */
  next.exp = function (mean) { return -Math.log(Math.max(next(), 1e-12)) * mean; };
  /* An item from `items`, each as likely as its weight. */
  next.pick = function (items, weightOf) {
    let total = 0;
    const weights = items.map((item) => { const w = Math.max(0, weightOf ? weightOf(item) : 1); total += w; return w; });
    if (!total) { return items[0]; }
    let r = next() * total;
    for (let i = 0; i < items.length; i += 1) {
      r -= weights[i];
      if (r <= 0) { return items[i]; }
    }
    return items[items.length - 1];
  };
  next.chance = function (p) { return next() < p; };
  next.int = function (lo, hi) { return lo + Math.floor(next() * (hi - lo + 1)); };
  return next;
}

/* A string to a 32-bit seed, so seeds can be words ("2024-week-3"). */
function hash(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

module.exports = { seeded, hash };
