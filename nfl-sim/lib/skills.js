/* ==========================================================================
   EGE Football NFL sim — skills
   The overall says how good a player is; his skills say how. Two receivers
   can both be 88s and be nothing alike -- one runs past corners, one
   catches everything over the middle -- and that difference is what makes
   one of them fit a team and the other not.

   Each position has a handful of skills (SKILLS), each on the same 1-99
   scale as the overall. Weighted the way the position weighs them, they
   always average out to the overall: a player is never better or worse for
   his skills, they only say where his overall comes from. When his overall
   moves -- he develops, or he ages -- his skills move with it.

   build/skills.js reads each real player's skills off his real style.
   ========================================================================== */

'use strict';

/* Skills each position has, and how much each one counts toward the
   overall. */
const SKILLS = {
  QB: { accuracy: 0.3, deep: 0.2, arm: 0.15, poise: 0.25, mobility: 0.1 },
  RB: { power: 0.2, elusive: 0.2, speed: 0.2, vision: 0.25, hands: 0.1, block: 0.05 },
  FB: { block: 0.6, power: 0.25, hands: 0.15 },
  WR: { deep: 0.15, route: 0.25, hands: 0.2, yac: 0.15, speed: 0.15, size: 0.1 },
  TE: { route: 0.2, hands: 0.2, deep: 0.1, yac: 0.1, block: 0.3, speed: 0.1 },
  OT: { passBlock: 0.55, runBlock: 0.45 },
  IOL: { passBlock: 0.45, runBlock: 0.55 },
  EDGE: { rush: 0.55, run: 0.3, speed: 0.1, cover: 0.05 },
  DI: { rush: 0.5, run: 0.5 },
  LB: { cover: 0.35, run: 0.35, blitz: 0.15, speed: 0.15 },
  CB: { man: 0.3, zone: 0.3, ball: 0.15, speed: 0.15, tackle: 0.1 },
  S: { range: 0.25, box: 0.2, cover: 0.3, ball: 0.15, speed: 0.1 },
  K: { power: 0.4, accuracy: 0.6 },
  P: { power: 1 }
};

const SPREAD = 6;

/* Overall plus SPREAD points per z, moved so the weighted mean is the
   overall again. */
function skillsFrom(pos, ovr, z) {
  const weights = SKILLS[pos];
  const raw = {};
  let mean = 0;
  Object.keys(weights).forEach((skill) => {
    raw[skill] = ovr + SPREAD * (z[skill] || 0);
    mean += weights[skill] * raw[skill];
  });
  const shift = ovr - mean;
  const out = {};
  Object.keys(weights).forEach((skill) => {
    out[skill] = Math.max(35, Math.min(99, Math.round(raw[skill] + shift)));
  });
  return out;
}

/* A name for what he is, from his strongest skills. */
function archetypeOf(pos, s, ovr) {
  const top = (keys) => keys.slice().sort((a, b) => s[b] - s[a])[0];
  switch (pos) {
    case 'QB':
      if (s.mobility >= (ovr || 0) + 4) { return 'Dual Threat'; }
      if (s.deep + s.arm >= s.accuracy + s.poise + 5) { return 'Gunslinger'; }
      if (s.accuracy + s.poise >= s.deep + s.arm + 5) { return 'Field General'; }
      return 'Pocket Passer';
    case 'RB': {
      const t = top(['power', 'elusive', 'speed', 'hands', 'vision']);
      return { power: 'Power Back', elusive: 'Elusive Back', speed: 'Speed Back',
               hands: 'Receiving Back', vision: 'Zone Runner' }[t];
    }
    case 'WR': {
      if (s.deep >= s.route && s.speed >= s.size) { return 'Deep Threat'; }
      if (s.size >= s.speed + 4 && s.size >= s.yac) { return 'Physical Receiver'; }
      if (s.yac >= s.route && s.yac >= s.hands) { return 'Playmaker'; }
      return s.route >= s.hands ? 'Route Technician' : 'Possession Receiver';
    }
    case 'TE':
      if (s.block >= s.route + 6 && s.block >= s.hands + 6) { return 'Blocking Tight End'; }
      if (s.deep >= s.route && s.speed >= s.block) { return 'Vertical Threat'; }
      if (Math.abs(s.block - (s.route + s.hands) / 2) <= 4) { return 'Complete Tight End'; }
      return 'Possession Tight End';
    case 'EDGE':
      if (s.run >= s.rush + 3) { return 'Run Stopper'; }
      return s.speed >= s.rush - 3 ? 'Speed Rusher' : 'Power Rusher';
    case 'DI':
      return s.rush >= s.run + 3 ? 'Interior Rusher' : (s.run >= s.rush + 3 ? 'Nose Tackle' : 'Three-Down Lineman');
    case 'LB':
      return s.cover >= s.run + 3 ? 'Coverage Linebacker' : (s.blitz >= s.cover + 3 ? 'Blitzer' : 'Run Stopper');
    case 'CB':
      return s.man >= s.zone + 3 ? 'Man Corner' : (s.zone >= s.man + 3 ? 'Zone Corner' : 'Slot Corner');
    case 'S':
      if (s.range >= s.box + 4) { return 'Centerfielder'; }
      if (s.box >= s.range + 4) { return 'Box Safety'; }
      return 'Hybrid Safety';
    case 'OT':
    case 'IOL':
      return s.passBlock >= s.runBlock ? 'Pass Protector' : 'Road Grader';
    case 'FB': return 'Fullback';
    case 'K': return s.power >= s.accuracy ? 'Big Leg' : 'Accurate Kicker';
    case 'P': return 'Punter';
    default: return null;
  }
}

/* A player set to a new overall by hand (lib/edits.js): every skill moves
   by the same amount, then they are evened up to average out to it again,
   so he is the same kind of player, better or worse. */
function reRate(p, ovr) {
  const weights = SKILLS[p.pos];
  const before = p.ovr;
  p.ovr = ovr;
  if (!weights) { return; }
  const old = p.skills || {};
  const raw = {};
  let mean = 0;
  Object.keys(weights).forEach((skill) => {
    raw[skill] = (typeof old[skill] === 'number' ? old[skill] : before) + ovr - before;
    mean += weights[skill] * raw[skill];
  });
  const shift = ovr - mean;
  p.skills = {};
  Object.keys(weights).forEach((skill) => { p.skills[skill] = Math.max(30, Math.min(99, Math.round(raw[skill] + shift))); });
  p.archetype = archetypeOf(p.pos, p.skills, ovr);
}

module.exports = { SKILLS, SPREAD, skillsFrom, archetypeOf, reRate };
