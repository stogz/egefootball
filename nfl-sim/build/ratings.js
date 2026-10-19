/* ==========================================================================
   EGE Football NFL sim — overalls out of real seasons
   Nobody publishes a rating for every NFL player, so the league works one
   out from what each player really did, the way a scout's grade folds a
   season into a number:

   1. A season score. For every player and every regular season, a few
      numbers that say how good his season was at his position (below),
      each turned into a z-score against everybody else at the position that
      year and added up with weights. Playing time is always one of them:
      the coaches who see him every day are the best scouts there are.
      Efficiency numbers (EPA per play, yards per target, passer rating
      allowed) are pulled toward replacement level by how little he did, so
      twelve good snaps do not outrank a whole good season.

   2. The 2023 score. 2022 counts 65%, 2021 35% (2020 stands in for a
      season lost to injury). What the market paid him counts a quarter for
      a veteran on a second contract -- an NFL front office's grade, in
      dollars -- and where he was drafted counts for a player in his first
      three years.

   3. The overall. Players are ranked at their position, and the rank is
      read off one curve: the best starter in the league about 98, the
      middle starter 79, the worst 73, backups in the 60s and the bottom of
      the roster at 50. The curve is in starters, so the 96th receiver and
      the 32nd quarterback both sit where the last starter does. Nothing
      is below 50, and 99s are set by hand -- at most one a position.

   Rookies have no NFL season, so their overall comes from where they were
   picked (pickOverall).
   ========================================================================== */

'use strict';

/* How many players at each position start, per team -- the unit the
   rating curve counts in. */
const STARTERS = {
  QB: 1, RB: 1.2, FB: 0.35, WR: 3, TE: 1.3, OT: 2, IOL: 3,
  EDGE: 2, DI: 2.3, LB: 2.2, CB: 2.6, S: 2, K: 1, P: 1
};

/* The curve: q is the rank in starters (0 = best in the league, 1 = the
   last starter), the value the overall at that point. */
const CURVE = [
  [0, 98], [0.02, 95], [0.06, 91], [0.15, 87], [0.3, 83], [0.5, 79.5],
  [0.75, 76], [1.0, 73], [1.4, 68], [2.0, 63], [3.0, 57], [4.5, 51], [6, 50]
];

function curve(q) {
  for (let i = 1; i < CURVE.length; i += 1) {
    if (q <= CURVE[i][0]) {
      const [q0, v0] = CURVE[i - 1];
      const [q1, v1] = CURVE[i];
      return v0 + (v1 - v0) * (q - q0) / (q1 - q0);
    }
  }
  return 50;
}

/* Pulls a rate toward a prior by how little volume is behind it. */
function shrink(value, n, prior, k) {
  if (value === null || value === undefined || !Number.isFinite(value) || !n) { return prior; }
  return (value * n + prior * k) / (n + k);
}

function div(a, b) { return b ? (a || 0) / b : null; }

/* The numbers a season is judged on, by position. Each is [value, sign]:
   a sign of -1 means lower is better (passer rating allowed). The weights
   in WEIGHTS go with the same keys. */
function metrics(pos, e) {
  const g = e.games || 0;
  switch (pos) {
    case 'QB': {
      const db = (e.att || 0) + (e.sacks || 0);
      const plays = db + (e.carries || 0);
      return {
        epa: shrink(div((e.passEpa || 0) + (e.rushEpa || 0), plays), plays, -0.12, 200),
        cpoe: shrink(e.cpoe, e.att || 0, -3, 250),
        volume: Math.min(db, 620) / 620
      };
    }
    case 'RB': {
      const car = e.carries || 0;
      return {
        ryoe: shrink(e.ryoe, car, -0.35, 100),
        afterContact: shrink(e.yacAtt, e.rushAtt || car, 2.5, 80),
        epa: shrink(div(e.rushEpa, car), car, -0.15, 120),
        scrimmage: ((e.rushYds || 0) + (e.recYds || 0)) / 17,
        receiving: (e.recYds || 0) / 17,
        role: e.offPct || 0
      };
    }
    case 'FB':
      return { role: e.offPct || 0, touches: ((e.carries || 0) + (e.rec || 0)) / 17 };
    case 'WR':
    case 'TE': {
      const tgt = e.tgt || 0;
      return {
        yards: (e.recYds || 0) / 17,
        perTarget: shrink(div(e.recYds, tgt), tgt, pos === 'TE' ? 5.8 : 6.3, 60),
        epa: shrink(div(e.recEpa, tgt), tgt, -0.05, 60),
        share: e.tgtShare || 0,
        role: e.offPct || 0
      };
    }
    case 'EDGE':
    case 'DI':
      return {
        pressures: (e.pressures || 0) / 17,
        sacks: (e.dSacks || 0) / 17,
        tfl: (e.tfl || 0) / 17,
        tackles: (e.tackles || ((e.solo || 0) + (e.assists || 0))) / 17,
        missed: shrink(e.missedPct, e.tackles || 0, 0.15, 30),
        role: e.defPct || 0
      };
    case 'LB':
    case 'CB':
    case 'S': {
      const tgt = e.covTgt || 0;
      return {
        rating: shrink(e.covRat, tgt, pos === 'LB' ? 108 : 102, 40),
        perTarget: shrink(div(e.covYds, tgt), tgt, pos === 'LB' ? 8.2 : 8.8, 40),
        completion: shrink(div(e.covCmp, tgt), tgt, 0.68, 40),
        ball: shrink(div((e.dInt || 0) + (e.pd || 0), tgt), tgt, 0.07, 40),
        tackles: (e.tackles || ((e.solo || 0) + (e.assists || 0))) / 17,
        tfl: (e.tfl || 0) / 17,
        pressures: (e.pressures || 0) / 17,
        missed: shrink(e.missedPct, e.tackles || 0, 0.14, 30),
        role: e.defPct || 0
      };
    }
    case 'OT':
    case 'IOL':
      return { role: e.offPct || 0, games: g / 17 };
    case 'K':
      return {
        accuracy: shrink(div(e.fgMade, e.fgAtt), e.fgAtt || 0, 0.78, 15),
        long: ((e.fg50 || 0) + (e.fg60 || 0) * 1.5) / 17,
        volume: Math.min(e.fgAtt || 0, 35) / 35
      };
    case 'P':
      return {
        net: shrink(div(e.ptNet, e.ptAtt), e.ptAtt || 0, 38.5, 20),
        inside20: shrink(div(e.ptIn20, e.ptAtt), e.ptAtt || 0, 0.3, 20),
        volume: Math.min(e.ptAtt || 0, 70) / 70
      };
    default:
      return {};
  }
}

const WEIGHTS = {
  QB: { epa: 0.45, cpoe: 0.2, volume: 0.35 },
  RB: { ryoe: 0.14, afterContact: 0.12, epa: 0.1, scrimmage: 0.3, receiving: 0.09, role: 0.25 },
  FB: { role: 0.8, touches: 0.2 },
  WR: { yards: 0.3, perTarget: 0.12, epa: 0.13, share: 0.2, role: 0.25 },
  TE: { yards: 0.25, perTarget: 0.08, epa: 0.07, share: 0.15, role: 0.45 },
  EDGE: { pressures: 0.33, sacks: 0.12, tfl: 0.08, tackles: 0, missed: -0.07, role: 0.4 },
  DI: { pressures: 0.25, sacks: 0.08, tfl: 0.12, tackles: 0.08, missed: -0.05, role: 0.42 },
  LB: { role: 0.42, tackles: 0.18, tfl: 0.08, rating: -0.12, perTarget: -0.06, pressures: 0.06, missed: -0.08 },
  CB: { role: 0.38, rating: -0.2, perTarget: -0.12, ball: 0.15, completion: -0.08, missed: -0.07 },
  S: { role: 0.4, rating: -0.15, perTarget: -0.08, ball: 0.12, tackles: 0.12, tfl: 0.05, missed: -0.08 },
  OT: { role: 0.85, games: 0.15 },
  IOL: { role: 0.85, games: 0.15 },
  K: { accuracy: 0.5, long: 0.25, volume: 0.25 },
  P: { net: 0.6, inside20: 0.2, volume: 0.2 }
};

function meanSd(values) {
  if (!values.length) { return { mean: 0, sd: 1 }; }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / values.length) || 1;
  return { mean, sd };
}

/* Everybody's season score for one season: Map gsis -> score, where the
   score is the weighted sum of z-scores (so about 0 for a typical player
   who saw the field, negative for the end of the bench). `posOf` says
   which position to judge a player at. */
function seasonScores(season, posOf) {
  const byPos = {};
  season.forEach((e, gsis) => {
    const pos = posOf(gsis);
    if (!pos || !WEIGHTS[pos]) { return; }
    const played = (e.offSnaps || 0) + (e.defSnaps || 0) + (e.att || 0) + (e.fgAtt || 0) + (e.ptAtt || 0);
    if (!played) { return; }
    (byPos[pos] = byPos[pos] || []).push({ gsis, m: metrics(pos, e) });
  });

  const out = new Map();
  Object.keys(byPos).forEach((pos) => {
    const rows = byPos[pos];
    const weights = WEIGHTS[pos];
    const stats = {};
    Object.keys(weights).forEach((key) => {
      stats[key] = meanSd(rows.map((r) => r.m[key]).filter(Number.isFinite));
    });
    rows.forEach((r) => {
      let score = 0;
      Object.keys(weights).forEach((key) => {
        const v = Number.isFinite(r.m[key]) ? r.m[key] : stats[key].mean;
        score += weights[key] * (v - stats[key].mean) / stats[key].sd;
      });
      out.set(r.gsis, { pos, score, metrics: r.m });
    });
  });
  return out;
}

/* Rank-to-overall for a set of scores at one position: Map id -> overall. */
function rankToOverall(entries, pos) {
  const sorted = entries.slice().sort((a, b) => b.score - a.score);
  const slots = 32 * (STARTERS[pos] || 1);
  const out = new Map();
  sorted.forEach((entry, rank) => {
    out.set(entry.id, curve(rank / slots));
  });
  return out;
}

/* A rookie's overall from where he was picked: about 77 for the first
   pick, 68 at the end of the first round, 62 for the last pick and 58 for
   a player nobody drafted. Running backs and receivers are readier on day
   one than quarterbacks and linemen, the way Madden rates its rookies. */
const ROOKIE_READY = { QB: -3, RB: 3, FB: 0, WR: 1, TE: -1, OT: -1, IOL: 0, EDGE: 0, DI: 0, LB: 0, CB: 0, S: 0, K: 4, P: 4 };

function pickOverall(pick, pos) {
  const base = pick ? 77 - 2.6 * Math.log(pick) : 57;
  return base + (ROOKIE_READY[pos] || 0);
}

module.exports = { STARTERS, curve, shrink, metrics, seasonScores, rankToOverall, pickOverall, meanSd };
