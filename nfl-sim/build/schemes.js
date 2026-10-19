/* ==========================================================================
   EGE Football NFL sim — what each team really ran in 2023
   Reads every 2023 regular-season snap and measures each offense and
   defense: how often it threw on early downs in a close game, how far
   downfield, play-action, screens, RPOs and motion (FTN's charting),
   quarterback runs, which way it ran, its personnel, and on defense how
   often it played man, two deep safeties and five or more rushers (Next
   Gen Stats' coverage calls in nflverse's participation data).

   Those numbers become the team's own tendencies, and the scheme it is
   filed under is the one in lib/schemes.js its numbers look most like.
   ========================================================================== */

'use strict';

const { read, num } = require('./nflverse');
const { OFFENSE, DEFENSE } = require('../lib/schemes');
const { meanSd } = require('./ratings');

function ratio(a, b) { return b ? a / b : 0; }

function countIn(text, label) {
  const m = new RegExp('(\\d+) ' + label + '(,|$)').exec(text || '');
  return m ? Number(m[1]) : 0;
}

function measure(positionOf) {
  const plays = read('play_by_play_2023.csv.gz', (r) => r.season_type === 'REG' && r.posteam && r.two_point_attempt !== '1', [
    'game_id', 'play_id', 'season_type', 'posteam', 'defteam', 'down', 'ydstogo', 'wp', 'qtr',
    'pass', 'rush', 'play_type', 'air_yards', 'shotgun', 'qb_scramble', 'rusher_player_id',
    'receiver_player_id', 'run_location', 'run_gap', 'pass_attempt', 'sack', 'two_point_attempt'
  ]);
  const part = new Map();
  read('pbp_participation_2023.csv', null, [
    'nflverse_game_id', 'play_id', 'offense_personnel', 'defense_personnel', 'defenders_in_box',
    'number_of_pass_rushers', 'defense_man_zone_type', 'defense_coverage_type', 'time_to_throw'
  ]).forEach((r) => part.set(r.nflverse_game_id + ':' + r.play_id, r));
  const ftn = new Map();
  read('ftn_charting_2023.csv', null, [
    'nflverse_game_id', 'nflverse_play_id', 'is_play_action', 'is_screen_pass', 'is_rpo', 'is_motion', 'n_blitzers', 'n_pass_rushers'
  ]).forEach((r) => ftn.set(r.nflverse_game_id + ':' + r.nflverse_play_id, r));

  const off = {};
  const def = {};
  const o = (team) => (off[team] = off[team] || {
    neutral: 0, neutralPass: 0, att: 0, air: 0, airN: 0, short: 0, mid: 0, deep: 0, screen: 0, pa: 0,
    dropbacks: 0, rpo: 0, motion: 0, charted: 0, runs: 0, qbRuns: 0, outside: 0, located: 0,
    personnel: 0, heavy: 0, eleven: 0, shotgun: 0, snaps: 0, tgt: { WR: 0, TE: 0, RB: 0 }
  });
  const d = (team) => (def[team] = def[team] || {
    coverage: 0, man: 0, shell: 0, twoHigh: 0, rushCounted: 0, blitz: 0, boxN: 0, box: 0,
    front: 0, threeFront: 0, nickel: 0
  });

  plays.forEach((p) => {
    const isPass = p.pass === '1';
    const isRush = p.rush === '1';
    if (!isPass && !isRush) { return; }
    const key = p.game_id + ':' + p.play_id;
    const pa = part.get(key);
    const ft = ftn.get(key);
    const T = o(p.posteam);
    const D = d(p.defteam);
    T.snaps += 1;
    if (p.shotgun === '1') { T.shotgun += 1; }

    const wp = num(p.wp);
    const down = num(p.down);
    if (wp !== null && wp > 0.2 && wp < 0.8 && (down === 1 || down === 2) && num(p.qtr) <= 3) {
      T.neutral += 1;
      if (isPass) { T.neutralPass += 1; }
    }

    if (isPass) {
      T.dropbacks += 1;
      const air = num(p.air_yards);
      if (p.pass_attempt === '1' && p.sack !== '1' && air !== null) {
        T.att += 1; T.air += air; T.airN += 1;
        if (air >= 20) { T.deep += 1; } else if (air >= 7) { T.mid += 1; } else { T.short += 1; }
        const pos = positionOf(p.receiver_player_id);
        if (pos && T.tgt[pos] !== undefined) { T.tgt[pos] += 1; }
      }
    }
    if (isRush && p.qb_scramble !== '1') {
      T.runs += 1;
      if (positionOf(p.rusher_player_id) === 'QB') { T.qbRuns += 1; }
      if (p.run_location) {
        T.located += 1;
        if (p.run_location !== 'middle' && p.run_gap === 'end') { T.outside += 1; }
      }
    }
    if (ft) {
      T.charted += 1;
      if (ft.is_motion === 'TRUE' || ft.is_motion === '1') { T.motion += 1; }
      if (ft.is_rpo === 'TRUE' || ft.is_rpo === '1') { T.rpo += 1; }
      if (isPass) {
        if (ft.is_play_action === 'TRUE' || ft.is_play_action === '1') { T.pa += 1; }
        if (ft.is_screen_pass === 'TRUE' || ft.is_screen_pass === '1') { T.screen += 1; }
      }
      const blitzers = num(ft.n_blitzers);
      const rushers = num(ft.n_pass_rushers);
      if (isPass && rushers) {
        D.rushCounted += 1;
        if (rushers >= 5 || (blitzers || 0) >= 1) { D.blitz += 1; }
      }
    }
    if (pa) {
      const personnel = pa.offense_personnel;
      if (personnel) {
        T.personnel += 1;
        const backs = countIn(personnel, 'RB') + countIn(personnel, 'FB');
        const ends = countIn(personnel, 'TE');
        if (ends >= 2 || backs >= 2) { T.heavy += 1; }
        if (ends === 1 && backs === 1) { T.eleven += 1; }
      }
      if (isPass && pa.defense_man_zone_type) {
        D.coverage += 1;
        if (pa.defense_man_zone_type === 'MAN_COVERAGE') { D.man += 1; }
      }
      const shell = pa.defense_coverage_type;
      if (isPass && shell && shell !== 'COMBO' && shell !== 'PREVENT' && shell !== 'BLOWN') {
        D.shell += 1;
        if (['COVER_2', 'COVER_4', 'COVER_6', '2_MAN'].indexOf(shell) !== -1) { D.twoHigh += 1; }
      }
      const box = num(pa.defenders_in_box);
      if (box && down && down <= 2) { D.boxN += 1; D.box += box; }
      const dp = pa.defense_personnel;
      if (dp) {
        D.front += 1;
        const linemen = countIn(dp, 'DE') + countIn(dp, 'DT') + countIn(dp, 'NT');
        if (linemen <= 3 && (countIn(dp, 'OLB') >= 2 || countIn(dp, 'NT') >= 1)) { D.threeFront += 1; }
        if (countIn(dp, 'CB') + countIn(dp, 'FS') + countIn(dp, 'SS') + countIn(dp, 'DB') + countIn(dp, 'SAF') >= 5) { D.nickel += 1; }
      }
    }
  });

  const offense = {};
  Object.keys(off).forEach((team) => {
    const T = off[team];
    const tgt = T.tgt.WR + T.tgt.TE + T.tgt.RB;
    offense[team] = {
      pass: ratio(T.neutralPass, T.neutral),
      adot: ratio(T.air, T.airN),
      short: ratio(T.short, T.att), mid: ratio(T.mid, T.att), deep: ratio(T.deep, T.att),
      screen: ratio(T.screen, T.dropbacks), playAction: ratio(T.pa, T.dropbacks),
      rpo: ratio(T.rpo, T.charted), motion: ratio(T.motion, T.charted),
      qbRun: ratio(T.qbRuns, T.runs), outside: ratio(T.outside, T.located),
      heavy: ratio(T.heavy, T.personnel), eleven: ratio(T.eleven, T.personnel),
      shotgun: ratio(T.shotgun, T.snaps),
      targets: { WR: ratio(T.tgt.WR, tgt), TE: ratio(T.tgt.TE, tgt), RB: ratio(T.tgt.RB, tgt) }
    };
  });
  const defense = {};
  Object.keys(def).forEach((team) => {
    const D = def[team];
    defense[team] = {
      man: ratio(D.man, D.coverage), twoHigh: ratio(D.twoHigh, D.shell), blitz: ratio(D.blitz, D.rushCounted),
      box: ratio(D.box, D.boxN), front: ratio(D.threeFront, D.front) > 0.4 ? 34 : 43,
      threeFront: ratio(D.threeFront, D.front), nickel: ratio(D.nickel, D.front)
    };
  });
  return { offense, defense };
}

/* Which scheme a team's numbers look most like. Each scheme scores the
   z-scores of the numbers that define it; the highest score wins. */
const OFFENSE_SIGNS = {
  airRaid: { adot: 1, deep: 1, pass: 1, shotgun: 0.5, eleven: 0.5, playAction: -0.3 },
  westCoast: { adot: -1, screen: 0.8, rb: 0.8, pass: 0.4, short: 0.6 },
  wideZone: { playAction: 1, outside: 1, motion: 1, heavy: 0.5, shotgun: -0.7 },
  spreadOption: { qbRun: 1.8, rpo: 1, shotgun: 0.4 },
  powerRun: { pass: -1, heavy: 1, outside: -0.6, shotgun: -0.6, playAction: 0.3 }
};
const DEFENSE_SIGNS = {
  cover3: { twoHigh: -1, man: -0.6, box: 0.4 },
  quarters: { twoHigh: 1.2, blitz: -0.4, box: -0.6 },
  manBlitz: { man: 1.2, blitz: 1, twoHigh: -0.3 },
  pressure34: { threeFront: 1.2, blitz: 0.6 },
  tampa2: { twoHigh: 0.8, man: -1, blitz: -0.8, threeFront: -0.5 }
};

function classify(table, signs, extra) {
  const teams = Object.keys(table);
  const keys = new Set();
  Object.values(signs).forEach((s) => Object.keys(s).forEach((k) => keys.add(k)));
  const value = (team, key) => (extra && extra[key] ? extra[key](table[team]) : table[team][key]);
  const stats = {};
  keys.forEach((key) => { stats[key] = meanSd(teams.map((t) => value(t, key))); });
  const out = {};
  teams.forEach((team) => {
    const scores = {};
    Object.keys(signs).forEach((scheme) => {
      let s = 0;
      Object.keys(signs[scheme]).forEach((key) => {
        s += signs[scheme][key] * (value(team, key) - stats[key].mean) / stats[key].sd;
      });
      scores[scheme] = s;
    });
    out[team] = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
  });
  return out;
}

/* Where the numbers alone file a team somewhere a football person would
   not, the 2023 play-caller's own system decides. The tendencies the
   engine plays with are still the measured ones; this is only the label
   the team drafts and trades for. */
const KNOWN_2023 = {
  offense: {
    CAR: 'westCoast',    // Frank Reich and Thomas Brown
    CIN: 'airRaid',      // Zac Taylor's spread; the short 2023 numbers are Burrow's calf
    CLE: 'wideZone',     // Kevin Stefanski
    DAL: 'westCoast',    // Mike McCarthy took the play-calling back
    GB: 'wideZone',      // Matt LaFleur
    HOU: 'wideZone',     // Bobby Slowik, from Kyle Shanahan's staff
    JAX: 'westCoast',    // Doug Pederson
    LA: 'wideZone',      // Sean McVay
    NO: 'westCoast',     // Pete Carmichael
    NYJ: 'wideZone',     // Nathaniel Hackett
    PIT: 'powerRun',     // Matt Canada, the league's most run-first early-down offense
    SEA: 'wideZone',     // Shane Waldron, from McVay's staff
    TEN: 'powerRun',     // Tim Kelly and Derrick Henry
    WAS: 'westCoast'     // Eric Bieniemy, from Andy Reid's staff
  },
  defense: {
    DET: 'manBlitz',     // Aaron Glenn
    IND: 'cover3',       // Gus Bradley
    KC: 'manBlitz',      // Steve Spagnuolo
    LAC: 'quarters',     // Brandon Staley, from Vic Fangio's staff
    MIA: 'quarters',     // Vic Fangio
    NYJ: 'cover3'        // Robert Saleh
  }
};

/* Each team's schemes and its own measured tendencies, in the shape the
   game engine reads (lib/schemes.js `tendencies`). */
function teamSchemes(positionOf) {
  const { offense, defense } = measure(positionOf);
  const offenseScheme = Object.assign(classify(offense, OFFENSE_SIGNS, { rb: (t) => t.targets.RB }), KNOWN_2023.offense);
  const defenseScheme = Object.assign(classify(defense, DEFENSE_SIGNS), KNOWN_2023.defense);
  const out = {};
  Object.keys(offense).forEach((team) => {
    const m = offense[team];
    const dm = defense[team];
    out[team] = {
      offense: offenseScheme[team],
      defense: defenseScheme[team],
      offenseTendencies: {
        pass: round(m.pass), short: round(m.short), mid: round(m.mid), deep: round(m.deep),
        screen: round(m.screen), playAction: round(m.playAction), qbRun: round(m.qbRun),
        outside: round(m.outside), heavy: round(m.heavy),
        targets: { WR: round(m.targets.WR), TE: round(m.targets.TE), RB: round(m.targets.RB) }
      },
      defenseTendencies: {
        man: round(dm.man), twoHigh: round(dm.twoHigh), blitz: round(dm.blitz), box: round(dm.box), front: dm.front
      },
      measured: { offense: m, defense: dm }
    };
  });
  return out;
}

function round(x) { return Math.round(x * 1000) / 1000; }

module.exports = { teamSchemes, OFFENSE, DEFENSE };
