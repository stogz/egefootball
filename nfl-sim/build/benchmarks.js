/* ==========================================================================
   EGE Football NFL sim — what really happened in 2023
   Writes nfl-sim/data/benchmarks-2023.json, which node nfl-sim/check.js
   holds the game engine to:

   - `league`: the 2023 regular season's league-wide averages, read off the
     real play-by-play: points, plays, how often teams threw, completion
     rate, yards a throw and a carry, sacks, interceptions, fumbles, field
     goals by distance, punts, third downs and fourth-down tries.
   - `games`: every 2023 game's real score and closing line.

       node nfl-sim/build/benchmarks.js

   (build/build-league.js writes it too, with the rest of the league.)
   ========================================================================== */

'use strict';

const { read, num } = require('./nflverse');

const COLUMNS = [
  'game_id', 'season_type', 'posteam', 'play_type', 'down', 'pass_attempt', 'sack', 'complete_pass',
  'passing_yards', 'interception', 'rush_attempt', 'rushing_yards', 'qb_kneel', 'qb_spike', 'qb_scramble',
  'fumble_lost', 'field_goal_attempt', 'field_goal_result', 'kick_distance', 'extra_point_attempt',
  'extra_point_result', 'punt_attempt', 'third_down_converted', 'third_down_failed', 'fourth_down_converted',
  'fourth_down_failed', 'yards_gained', 'pass_touchdown', 'rush_touchdown', 'two_point_attempt',
  'two_point_conv_result', 'qb_dropback', 'touchback', 'kickoff_attempt', 'return_yards', 'penalty'
];

function round(v, places) { const f = Math.pow(10, places); return Math.round(v * f) / f; }

/* League-wide averages for the 2023 regular season. "Team game" is one
   team's half of one game. */
function leagueAverages() {
  const games = read('games.csv', (r) => r.season === '2023' && r.game_type === 'REG');
  const teamGames = games.length * 2;
  const points = games.reduce((sum, g) => sum + num(g.home_score) + num(g.away_score), 0);
  const margins = games.map((g) => num(g.home_score) - num(g.away_score));
  const meanMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
  const sdMargin = Math.sqrt(margins.reduce((a, m) => a + (m - meanMargin) * (m - meanMargin), 0) / margins.length);

  const t = {
    plays: 0, dropbacks: 0, attempts: 0, completions: 0, passYards: 0, sacks: 0, ints: 0,
    carries: 0, rushYards: 0, scrambles: 0, kneels: 0, fumblesLost: 0, passTd: 0, rushTd: 0,
    fga: 0, fgm: 0, xpa: 0, xpm: 0, twoPa: 0, twoPm: 0, punts: 0, third: 0, thirdMade: 0, fourth: 0, fourthMade: 0,
    kickoffs: 0, touchbacks: 0, deep20: 0, run10: 0, penalties: 0
  };
  const fgBy = { under30: [0, 0], '30-39': [0, 0], '40-49': [0, 0], '50+': [0, 0] };
  read('play_by_play_2023.csv.gz', (r) => r.season_type === 'REG', COLUMNS).forEach((r) => {
    const yes = (k) => r[k] === '1';
    if (yes('penalty')) { t.penalties += 1; }
    if (r.play_type === 'kickoff') {
      t.kickoffs += 1;
      if (yes('touchback')) { t.touchbacks += 1; }
    }
    if (yes('two_point_attempt')) {
      t.twoPa += 1;
      if (r.two_point_conv_result === 'success') { t.twoPm += 1; }
      return;
    }
    if (yes('field_goal_attempt')) {
      t.fga += 1;
      const made = r.field_goal_result === 'made';
      if (made) { t.fgm += 1; }
      const d = num(r.kick_distance) || 0;
      const bucket = d < 30 ? 'under30' : d < 40 ? '30-39' : d < 50 ? '40-49' : '50+';
      fgBy[bucket][0] += 1;
      if (made) { fgBy[bucket][1] += 1; }
    }
    if (yes('extra_point_attempt')) {
      t.xpa += 1;
      if (r.extra_point_result === 'good') { t.xpm += 1; }
    }
    if (yes('punt_attempt')) { t.punts += 1; }
    if (yes('third_down_converted')) { t.third += 1; t.thirdMade += 1; }
    if (yes('third_down_failed')) { t.third += 1; }
    if (yes('fourth_down_converted')) { t.fourth += 1; t.fourthMade += 1; }
    if (yes('fourth_down_failed')) { t.fourth += 1; }
    if (r.play_type !== 'pass' && r.play_type !== 'run') { return; }
    if (yes('qb_spike')) { return; }
    t.plays += 1;
    if (yes('fumble_lost')) { t.fumblesLost += 1; }
    if (yes('qb_kneel')) { t.kneels += 1; return; }
    if (yes('qb_dropback')) { t.dropbacks += 1; }
    if (yes('sack')) { t.sacks += 1; return; }
    if (yes('pass_attempt')) {
      t.attempts += 1;
      t.passYards += num(r.passing_yards) || 0;
      if (yes('complete_pass')) { t.completions += 1; }
      if (yes('interception')) { t.ints += 1; }
      if (yes('pass_touchdown')) { t.passTd += 1; }
      if ((num(r.passing_yards) || 0) >= 20) { t.deep20 += 1; }
      return;
    }
    if (yes('rush_attempt')) {
      t.carries += 1;
      t.rushYards += num(r.rushing_yards) || 0;
      if (yes('qb_scramble')) { t.scrambles += 1; }
      if (yes('rush_touchdown')) { t.rushTd += 1; }
      if ((num(r.rushing_yards) || 0) >= 10) { t.run10 += 1; }
    }
  });

  const perGame = (n) => round(n / teamGames, 2);
  const fgRates = {};
  Object.keys(fgBy).forEach((k) => { fgRates[k] = round(fgBy[k][1] / fgBy[k][0], 3); });
  return {
    games: games.length,
    pointsPerTeamGame: perGame(points),
    homeMargin: round(meanMargin, 2),
    marginSd: round(sdMargin, 2),
    playsPerTeamGame: perGame(t.plays),
    dropbackRate: round(t.dropbacks / (t.plays - t.kneels), 3),
    attemptsPerTeamGame: perGame(t.attempts),
    completionPct: round(t.completions / t.attempts, 3),
    yardsPerAttempt: round(t.passYards / t.attempts, 2),
    passYardsPerTeamGame: perGame(t.passYards),
    sackRate: round(t.sacks / (t.attempts + t.sacks), 3),
    intRate: round(t.ints / t.attempts, 3),
    passTdPerTeamGame: perGame(t.passTd),
    completions20Plus: round(t.deep20 / t.attempts, 3),
    carriesPerTeamGame: perGame(t.carries),
    yardsPerCarry: round(t.rushYards / t.carries, 2),
    rushYardsPerTeamGame: perGame(t.rushYards),
    rushTdPerTeamGame: perGame(t.rushTd),
    runs10Plus: round(t.run10 / t.carries, 3),
    scramblesPerTeamGame: perGame(t.scrambles),
    fumblesLostPerTeamGame: perGame(t.fumblesLost),
    turnoversPerTeamGame: perGame(t.ints + t.fumblesLost),
    fgaPerTeamGame: perGame(t.fga),
    fgPct: round(t.fgm / t.fga, 3),
    fgPctByDistance: fgRates,
    xpPct: round(t.xpm / t.xpa, 3),
    twoPointTriesPerTeamGame: perGame(t.twoPa),
    twoPointPct: round(t.twoPm / t.twoPa, 3),
    puntsPerTeamGame: perGame(t.punts),
    thirdDownPct: round(t.thirdMade / t.third, 3),
    fourthDownTriesPerTeamGame: perGame(t.fourth),
    fourthDownPct: round(t.fourthMade / t.fourth, 3),
    kickoffTouchbackRate: round(t.touchbacks / t.kickoffs, 3),
    penaltiesPerTeamGame: perGame(t.penalties)
  };
}

/* Every 2023 game's real score and closing line (`spread` is how many
   points the home team was favored by). */
function games2023() {
  return read('games.csv', (r) => r.season === '2023').map((r) => ({
    week: Number(r.week), type: r.game_type, home: r.home_team, away: r.away_team,
    homeScore: num(r.home_score), awayScore: num(r.away_score), spread: num(r.spread_line)
  }));
}

function buildBenchmarks() {
  return { league: leagueAverages(), games: games2023() };
}

if (require.main === module) {
  const { writeJson } = require('./write');
  writeJson('benchmarks-2023.json', buildBenchmarks());
}

module.exports = { buildBenchmarks, leagueAverages };
