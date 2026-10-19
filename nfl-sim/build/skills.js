/* ==========================================================================
   EGE Football NFL sim — what kind of player he is
   Each position has a handful of skills (lib/skills.js). They are read off
   his real style: a receiver's depth of target and catches of 20+ yards
   make his `deep`, his separation and catch rate his `route`, his drop
   rate his `hands`, yards after the catch over expected his `yac`, his
   40 time his `speed`. Each style number is a z-score against the rest of
   the position, and a skill is the overall plus six points per z, then
   moved as a group so the skills, weighted the way the position weighs
   them, average out to the overall again. A player is never better or
   worse for his skills; they only say where his overall comes from.

   His archetype is a name for his strongest pair, in words a scout would
   use.
   ========================================================================== */

'use strict';

const { shrink, meanSd } = require('./ratings');
const { SKILLS, skillsFrom } = require('../lib/skills');

function per(a, b) { return b ? (a || 0) / b : null; }

/* Blends a player's 2021 and 2022 into one record, weighting each season
   by how much he played in it, so a style number from a full season beats
   one from three games. */
function pooled(seasons) {
  const out = {};
  const usable = seasons.filter(Boolean);
  if (!usable.length) { return out; }
  const keys = new Set();
  usable.forEach((s) => Object.keys(s).forEach((k) => keys.add(k)));
  keys.forEach((key) => {
    let total = 0;
    let weight = 0;
    usable.forEach((s, i) => {
      if (!Number.isFinite(s[key])) { return; }
      const w = (s.games || 1) * (i === usable.length - 1 ? 1.5 : 1);
      total += s[key] * w;
      weight += w;
    });
    out[key] = weight ? total / weight : null;
  });
  /* Counting stats are summed, not averaged. */
  ['att', 'cmp', 'sacks', 'int', 'carries', 'rushYds', 'tgt', 'rec', 'recYds', 'pass20', 'rec20',
   'rush20', 'rush40', 'covTgt', 'covCmp', 'covYds', 'dInt', 'pd', 'pressures', 'tackles', 'tfl',
   'offSnaps', 'defSnaps', 'games', 'fgAtt', 'fgMade', 'fg50', 'fg60', 'fgMiss50', 'ptAtt', 'ptYds',
   'recBrk', 'rushBrk', 'rushAtt', 'drops', 'scrambles', 'blitz', 'recFd', 'dSacks'].forEach((key) => {
    const values = usable.map((s) => s[key]).filter(Number.isFinite);
    out[key] = values.length ? values.reduce((a, b) => a + b, 0) : null;
  });
  return out;
}

/* The style numbers behind each skill: [value, prior] pairs are shrunk by
   volume before they are compared. Everything here is "higher is better
   at this skill". */
function style(pos, e, body) {
  const forty = body.forty ? -body.forty : null;
  const h = body.height || null;
  const w = body.weight || null;
  switch (pos) {
    case 'QB': {
      const db = (e.att || 0) + (e.sacks || 0);
      return {
        accuracy: [shrink(Number.isFinite(e.ngsCpoe) ? e.ngsCpoe : e.cpoe, e.att || 0, -3, 200),
                   shrink(e.onTgtPct, e.att || 0, 72, 200)],
        deep: [shrink(Number.isFinite(e.ngsIay) ? e.ngsIay : e.iay, e.att || 0, 7.5, 150),
               shrink(per(e.pass20, e.att), e.att || 0, 0.08, 200)],
        arm: [e.maxAir, e.avgAir],
        poise: [-shrink(per(e.sacks, db), db, 0.08, 150), -shrink(per(e.int, e.att), e.att || 0, 0.03, 200),
                -shrink(e.badPct, e.att || 0, 20, 200)],
        mobility: [(e.rushYds || 0) / Math.max(e.games || 1, 1), forty]
      };
    }
    case 'RB': {
      const car = e.carries || 0;
      return {
        power: [shrink(e.yacAtt, e.rushAtt || car, 2.7, 80), w],
        elusive: [shrink(per((e.rushBrk || 0) + (e.recBrk || 0), car + (e.rec || 0)), car + (e.rec || 0), 0.08, 80),
                  shrink(per(e.rush20, car), car, 0.025, 120)],
        speed: [forty, shrink(per(e.rush40, car), car, 0.005, 150)],
        vision: [shrink(e.ryoe, car, -0.2, 100)],
        hands: [(e.tgt || 0) / Math.max(e.games || 1, 1), shrink(per(e.rec, e.tgt), e.tgt || 0, 0.72, 30)],
        block: [w]
      };
    }
    case 'FB':
      return { block: [w], power: [w], hands: [(e.rec || 0)] };
    case 'WR':
    case 'TE': {
      const tgt = e.tgt || 0;
      const s = {
        deep: [shrink(Number.isFinite(e.ngsAdot) ? e.ngsAdot : e.pfrAdot, tgt, pos === 'TE' ? 6.5 : 10, 40),
               shrink(per(e.rec20, tgt), tgt, pos === 'TE' ? 0.06 : 0.1, 50)],
        route: [shrink(e.separation, tgt, 2.9, 40), shrink(per(e.recFd, tgt), tgt, 0.35, 50)],
        hands: [-shrink(e.dropPct, tgt, 0.06, 40), shrink(per(e.rec, tgt), tgt, 0.62, 50)],
        yac: [shrink(e.yacOe, e.rec || 0, -0.3, 30), shrink(per(e.recBrk, e.rec), e.rec || 0, 0.05, 30)],
        speed: [forty]
      };
      if (pos === 'WR') {
        s.size = [h, w];
      } else {
        /* A tight end who is on the field a lot and rarely thrown to is
           there to block. */
        s.block = [(e.offPct || 0) - 2.5 * (e.tgtShare || 0), w];
      }
      return s;
    }
    case 'OT':
    case 'IOL':
      return { passBlock: [w ? -w : null], runBlock: [w] };
    case 'EDGE':
    case 'DI': {
      const snaps = e.defSnaps || 0;
      const s = {
        rush: [shrink(per(e.pressures, snaps), snaps, 0.04, 250), shrink(per(e.dSacks, snaps), snaps, 0.006, 300)],
        run: [shrink(per((e.tackles || 0) + 2 * (e.tfl || 0), snaps), snaps, 0.06, 250),
              -shrink(e.missedPct, e.tackles || 0, 0.15, 30), pos === 'DI' ? w : null]
      };
      if (pos === 'EDGE') { s.speed = [forty]; s.cover = [w ? -w : null]; }
      return s;
    }
    case 'LB':
    case 'CB':
    case 'S': {
      const snaps = e.defSnaps || 0;
      const tgt = e.covTgt || 0;
      const cover = [-shrink(e.covRat, tgt, 100, 40), -shrink(per(e.covYds, tgt), tgt, 8.5, 40)];
      const ball = [shrink(per((e.dInt || 0) * 2 + (e.pd || 0), tgt), tgt, 0.1, 40)];
      const tackle = [-shrink(e.missedPct, e.tackles || 0, 0.14, 30)];
      const box = [shrink(per((e.tackles || 0) + 2 * (e.tfl || 0), snaps), snaps, 0.08, 250),
                   shrink(per(e.pressures, snaps), snaps, 0.01, 300)];
      if (pos === 'LB') {
        return {
          cover, run: box.slice(0, 1).concat(tackle),
          blitz: [shrink(per(e.pressures, snaps), snaps, 0.015, 300), shrink(per(e.blitz, snaps), snaps, 0.03, 300)],
          speed: [forty]
        };
      }
      if (pos === 'CB') {
        return {
          man: [forty, h, -shrink(per(e.covCmp, tgt), tgt, 0.66, 40)],
          zone: cover.concat(ball), ball, speed: [forty], tackle
        };
      }
      return {
        range: [shrink(e.covAdot, tgt, 8, 30), forty].concat(ball),
        box, cover, ball, speed: [forty]
      };
    }
    case 'K':
      return {
        power: [shrink(per((e.fg50 || 0) + (e.fg60 || 0), (e.fg50 || 0) + (e.fg60 || 0) + (e.fgMiss50 || 0)),
                       (e.fg50 || 0) + (e.fgMiss50 || 0), 0.6, 6), e.fgLong],
        accuracy: [shrink(per(e.fgMade, e.fgAtt), e.fgAtt || 0, 0.8, 15)]
      };
    case 'P':
      return { power: [shrink(per(e.ptYds, e.ptAtt), e.ptAtt || 0, 45, 20)] };
    default:
      return {};
  }
}

/* Skills for everybody at once, since every style number is a z-score
   against the rest of the position. `players` carry pos, ovr and the
   pooled evidence `e` and `body` ({ forty, height, weight }). `rng` adds a
   little variety to players nobody has numbers on. */
function assignSkills(players, rng) {
  const byPos = {};
  players.forEach((p) => {
    if (!SKILLS[p.pos]) { return; }
    p._style = style(p.pos, p.e || {}, p.body || {});
    (byPos[p.pos] = byPos[p.pos] || []).push(p);
  });

  Object.keys(byPos).forEach((pos) => {
    const group = byPos[pos];
    const weights = SKILLS[pos];
    /* z-score each style number across the position, then average the
       numbers behind a skill. */
    const stats = {};
    Object.keys(weights).forEach((skill) => {
      const width = Math.max(...group.map((p) => (p._style[skill] || []).length), 0);
      stats[skill] = [];
      for (let i = 0; i < width; i += 1) {
        stats[skill].push(meanSd(group.map((p) => (p._style[skill] || [])[i]).filter(Number.isFinite)));
      }
    });
    group.forEach((p) => {
      const z = {};
      Object.keys(weights).forEach((skill) => {
        const values = p._style[skill] || [];
        const parts = [];
        values.forEach((v, i) => {
          if (Number.isFinite(v)) { parts.push((v - stats[skill][i].mean) / stats[skill][i].sd); }
        });
        const noise = (rng() - 0.5) * 0.6;
        z[skill] = parts.length
          ? Math.max(-2.5, Math.min(2.5, parts.reduce((a, b) => a + b, 0) / parts.length)) + noise * 0.3
          : noise;
      });
      p.skills = skillsFrom(pos, p.ovr, z);
      p.style = z;
      delete p._style;
    });
  });
}

module.exports = { pooled, assignSkills };
