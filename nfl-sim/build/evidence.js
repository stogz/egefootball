/* ==========================================================================
   EGE Football NFL sim — what each player did, a season at a time
   Everything the ratings are worked out from, gathered per player per
   regular season and keyed by his NFL id (gsis). One record holds:

   - how much he played: games, and his share of the team's snaps on his
     side of the ball (snap counts, from Pro Football Reference);
   - his box score (nflverse season stats, which carry EPA and CPOE too);
   - PFR's advanced numbers: pressures, missed tackles and coverage allowed
     for defenders, drops, broken tackles and depth of target for pass
     catchers, yards after contact for backs, on-target throws and
     pressure for quarterbacks;
   - Next Gen Stats: separation, depth of target and yards after the catch
     over expected for receivers, rushing yards over expected for backs,
     air yards, aggressiveness and completion over expected for passers.

   A field nobody recorded stays null, so a rating can tell "did not do
   it" from "nobody counted".
   ========================================================================== */

'use strict';

const { read, num } = require('./nflverse');

/* nflverse's players table: ids across sources, birth dates, measurables,
   draft and PFF's position. */
function loadPeople() {
  const people = new Map();
  const byPfr = new Map();
  read('players.csv').forEach((row) => {
    if (!row.gsis_id) { return; }
    people.set(row.gsis_id, row);
    if (row.pfr_id) { byPfr.set(row.pfr_id, row.gsis_id); }
  });
  return { people, byPfr };
}

function blank() {
  return { games: 0, offSnaps: 0, defSnaps: 0, offPct: 0, defPct: 0, stSnaps: 0 };
}

/* Snap shares: the average share of the team's snaps in the games he
   played, and how many games that was. */
function addSnaps(seasons, year, byPfr) {
  const totals = new Map();
  read('snap_counts_' + year + '.csv', (r) => r.game_type === 'REG').forEach((r) => {
    const gsis = byPfr.get(r.pfr_player_id);
    if (!gsis) { return; }
    const t = totals.get(gsis) || { g: 0, off: 0, def: 0, offPct: 0, defPct: 0, st: 0, offG: 0, defG: 0 };
    t.g += 1;
    t.off += num(r.offense_snaps) || 0;
    t.def += num(r.defense_snaps) || 0;
    t.st += num(r.st_snaps) || 0;
    if ((num(r.offense_snaps) || 0) > 0) { t.offPct += num(r.offense_pct) || 0; t.offG += 1; }
    if ((num(r.defense_snaps) || 0) > 0) { t.defPct += num(r.defense_pct) || 0; t.defG += 1; }
    totals.set(gsis, t);
  });
  totals.forEach((t, gsis) => {
    const rec = record(seasons, year, gsis);
    rec.games = Math.max(rec.games, t.g);
    rec.offSnaps = t.off;
    rec.defSnaps = t.def;
    rec.stSnaps = t.st;
    /* Share of the whole season, not of the games he played: a starter
       who missed half the year counts half as much. */
    rec.offPct = t.offPct / (year >= 2021 ? 17 : 16);
    rec.defPct = t.defPct / (year >= 2021 ? 17 : 16);
  });
}

function record(seasons, year, gsis) {
  if (!seasons[year]) { seasons[year] = new Map(); }
  let rec = seasons[year].get(gsis);
  if (!rec) { rec = blank(); seasons[year].set(gsis, rec); }
  return rec;
}

const STAT_FIELDS = {
  games: 'games', att: 'attempts', cmp: 'completions', passYds: 'passing_yards',
  passTd: 'passing_tds', int: 'passing_interceptions', sacks: 'sacks_suffered',
  passEpa: 'passing_epa', cpoe: 'passing_cpoe', airYds: 'passing_air_yards',
  pass20: 'passing_20', pass40: 'passing_40',
  carries: 'carries', rushYds: 'rushing_yards', rushTd: 'rushing_tds',
  rushEpa: 'rushing_epa', rush10: 'rushing_10', rush20: 'rushing_20', rush40: 'rushing_40',
  fumblesLost: 'fumbles_lost_total',
  rec: 'receptions', tgt: 'targets', recYds: 'receiving_yards', recTd: 'receiving_tds',
  recEpa: 'receiving_epa', recAir: 'receiving_air_yards', recYac: 'receiving_yards_after_catch',
  rec20: 'receiving_20', rec40: 'receiving_40', recFd: 'receiving_first_downs',
  tgtShare: 'target_share', airShare: 'air_yards_share', wopr: 'wopr',
  solo: 'def_tackles_solo', assists: 'def_tackle_assists', tfl: 'def_tackles_for_loss',
  dSacks: 'def_sacks', qbHits: 'def_qb_hits', dInt: 'def_interceptions',
  pd: 'def_pass_defended', ff: 'def_fumbles_forced',
  fgMade: 'fg_made', fgAtt: 'fg_att', fgLong: 'fg_long', fg50: 'fg_made_50_59', fg60: 'fg_made_60_',
  fgMiss50: 'fg_missed_50_59', fgMiss40: 'fg_missed_40_49', fg40: 'fg_made_40_49',
  patMade: 'pat_made', patAtt: 'pat_att',
  ptAtt: 'pt_att', ptYds: 'pt_yards', ptNet: 'pt_net_yards', ptIn20: 'pt_inside_20'
};

function addStats(seasons, year) {
  read('stats_player_reg_' + year + '.csv').forEach((r) => {
    if (!r.player_id) { return; }
    const rec = record(seasons, year, r.player_id);
    Object.keys(STAT_FIELDS).forEach((key) => {
      const value = num(r[STAT_FIELDS[key]]);
      if (key === 'games') { rec.games = Math.max(rec.games, value || 0); } else { rec[key] = value; }
    });
  });
}

/* PFR's advanced tables cover every season in one file each. */
function addAdvanced(seasons, years, byPfr) {
  const want = new Set(years.map(String));
  const take = (file, fields) => {
    read(file, (r) => want.has(r.season)).forEach((r) => {
      const gsis = byPfr.get(r.pfr_id);
      if (!gsis) { return; }
      const rec = record(seasons, Number(r.season), gsis);
      Object.keys(fields).forEach((key) => { rec[key] = num(r[fields[key]]); });
    });
  };
  take('advstats_season_def.csv', {
    covTgt: 'tgt', covCmp: 'cmp', covYds: 'yds', covTd: 'td', covRat: 'rat', covAdot: 'dadot',
    covInt: 'int', blitz: 'bltz', hurries: 'hrry', knockdowns: 'qbkd', pressures: 'prss',
    tackles: 'comb', missed: 'm_tkl', missedPct: 'm_tkl_percent'
  });
  take('advstats_season_rec.csv', {
    drops: 'drop', dropPct: 'drop_percent', recBrk: 'brk_tkl', pfrAdot: 'adot', ybcR: 'ybc_r', yacR: 'yac_r'
  });
  take('advstats_season_rush.csv', {
    rushAtt: 'att', ybcAtt: 'ybc_att', yacAtt: 'yac_att', rushBrk: 'brk_tkl'
  });
  take('advstats_season_pass.csv', {
    onTgtPct: 'on_tgt_pct', badPct: 'bad_throw_pct', pressurePct: 'pressure_pct',
    pocketTime: 'pocket_time', scrambles: 'scrambles', iay: 'intended_air_yards_per_pass_attempt',
    paAtt: 'pa_pass_att', rpoPlays: 'rpo_plays'
  });
}

/* Next Gen Stats: the season rows are week 0. */
function addNgs(seasons, years) {
  const want = new Set(years.map(String));
  const take = (file, fields) => {
    read(file, (r) => r.week === '0' && r.season_type === 'REG' && want.has(r.season)).forEach((r) => {
      if (!r.player_gsis_id) { return; }
      const rec = record(seasons, Number(r.season), r.player_gsis_id);
      Object.keys(fields).forEach((key) => { rec[key] = num(r[fields[key]]); });
    });
  };
  take('ngs_passing.csv.gz', {
    ttt: 'avg_time_to_throw', ngsIay: 'avg_intended_air_yards', aggressive: 'aggressiveness',
    maxAir: 'max_air_distance', avgAir: 'avg_air_distance', ngsCpoe: 'completion_percentage_above_expectation'
  });
  take('ngs_receiving.csv.gz', {
    separation: 'avg_separation', cushion: 'avg_cushion', ngsAdot: 'avg_intended_air_yards',
    yacOe: 'avg_yac_above_expectation', catchPct: 'catch_percentage'
  });
  take('ngs_rushing.csv.gz', {
    ryoe: 'rush_yards_over_expected_per_att', eightBox: 'percent_attempts_gte_eight_defenders',
    efficiency: 'efficiency'
  });
}

/* Every season from `years`, as { year: Map(gsis -> record) }. */
function loadEvidence(years, byPfr) {
  const seasons = {};
  years.forEach((year) => {
    addSnaps(seasons, year, byPfr);
    addStats(seasons, year);
  });
  addAdvanced(seasons, years, byPfr);
  addNgs(seasons, years);
  return seasons;
}

/* The combine, keyed by PFR id, for speed and size. */
function loadCombine() {
  const out = new Map();
  read('combine.csv').forEach((r) => {
    if (!r.pfr_id) { return; }
    out.set(r.pfr_id, {
      forty: num(r.forty), bench: num(r.bench), vertical: num(r.vertical),
      broad: num(r.broad_jump), cone: num(r.cone), shuttle: num(r.shuttle)
    });
  });
  return out;
}

module.exports = { loadPeople, loadEvidence, loadCombine };
