/* ==========================================================================
   EGE Football NFL sim — the website's side of it
   Three things pass between the sim and the site:

   - in: weeks the site has already played (siteResults), so the sim can
     take a season up from where the site is, with the six's own games from
     their season file and everybody else's real scores;
   - out, the games: the six's games as their season file writes them
     (sixEdits, then seasonFileText), and every other NFL score from the week
     the sim took over (resultsFileText, data/nfl-results.js), which the
     standings use in place of the real ones;
   - out, the rosters: every team's players as the Teams pages show them
     (publicRosters). Only what the site shows goes in: nothing about a
     team's rating, a player's potential or how long he will last.

   The site is io.site(): the browser's own EGE on the admin page, its files
   loaded into a sandbox on the command line.
   ========================================================================== */

'use strict';

const io = require('./io');
const { TEAMS, KEYS, keyForName } = require('./teams');

/* The sim's key for a team the six play for on the site ('detroit' is DET). */
function simKey(siteKey) { return KEYS.filter((k) => TEAMS[k].site === siteKey)[0] || null; }

/* ------------------------------------------------------------------ in -- */

/* Every NFL game the site has in `season` through week `through`, with team
   keys and score [home, away]: the six's from their season file first, so
   that wins wherever both have a game, then everybody else's from
   data/conferences.js (and, from the week the sim took over, its own
   results). `egeHurt` is whether one of the six has had his injury. */
function siteResults(season, through) {
  const site = io.site();
  const results = [];
  const seen = {};
  let egeHurt = false;
  const add = (week, homeName, awayName, score, ot) => {
    const home = keyForName(homeName);
    const away = keyForName(awayName);
    if (!home || !away) { throw new Error('Week ' + week + ' has a team the sim does not know: ' + homeName + ' or ' + awayName + '.'); }
    const key = week + '|' + [home, away].sort().join('|');
    if (seen[key]) { return; }
    seen[key] = true;
    results.push({ week, home, away, score: score.slice(), ot: Boolean(ot) });
  };

  const games = ((site.stats || {})[season] || {}).games || {};
  site.players.forEach((player) => {
    const key = simKey(site.teamKeyFor(player, season));
    if (!key) { return; }
    (games[player.slug] || []).forEach((g) => {
      if (g.bye || g.playoff || g.week > through || !g.result) { return; }
      if (g.injured) { egeHurt = true; }
      const us = TEAMS[key].name;
      const r = g.result;
      if (g.home || g.neutral) { add(g.week, us, g.opponent, [r.teamScore, r.opponentScore], g.overtime); } else {
        add(g.week, g.opponent, us, [r.opponentScore, r.teamScore], g.overtime);
      }
    });
  });

  const simmed = (site.nflSimResults || {})[season];
  const from = simmed ? simmed.from : Infinity;
  const leagues = (site.conferences || {})[season] || {};
  Object.keys(leagues).forEach((id) => {
    const league = leagues[id];
    if (!league.nfl) { return; }
    league.games.forEach((g) => { if (g.week <= through && g.week < from) { add(g.week, g.home, g.away, g.score, g.overtime); } });
    (league.nonConference || []).forEach((g) => {
      if (g.week <= through && g.week < from) { add(g.week, g.school, g.opponent, g.score, g.overtime); }
    });
  });
  if (simmed) {
    simmed.games.forEach((g) => { if (g.week <= through) { add(g.week, g.home, g.away, g.score, g.overtime); } });
  }
  return { results, egeHurt };
}

/* ----------------------------------------------------------- out: games -- */

function title(text) { return String(text).replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bAcl\b/, 'ACL').replace(/\bMcl\b/, 'MCL'); }

function roman(n) {
  const table = [[50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  table.forEach(([v, s]) => { while (n >= v) { out += s; n -= v; } });
  return out;
}

/* A box score line in the season file's words. */
function statsFrom(position, line) {
  const l = line || {};
  if (position === 'QB') {
    return {
      completions: l.passCmp || 0, attempts: l.passAtt || 0, passingYards: l.passYds || 0,
      passingYac: Math.min(l.passYac || 0, Math.max(0, l.passYds || 0)), passingTd: l.passTd || 0, interceptions: l.passInt || 0,
      carries: l.rushAtt || 0, rushingYards: l.rushYds || 0, rushingTd: l.rushTd || 0, rushingLong: l.rushAtt ? l.rushLong || 0 : 0,
      sacks: l.sacked || 0, fumbles: l.fumLost || 0
    };
  }
  return {
    carries: l.rushAtt || 0, rushingYards: l.rushYds || 0, rushingTd: l.rushTd || 0, rushingLong: l.rushAtt ? l.rushLong || 0 : 0,
    receptions: l.rec || 0, receivingYards: l.recYds || 0, receivingYac: Math.min(l.recYac || 0, Math.max(0, l.recYds || 0)),
    receivingTd: l.recTd || 0, receivingLong: l.rec ? l.recLong || 0 : 0, targets: l.targets || 0, fumbles: l.fumLost || 0
  };
}

function bigPlays(tds) {
  return (tds || []).map((t) => t.yards + ' yard ' + (t.winning ? 'game-winning ' : '') +
    (!t.mine ? 'passing' : t.how === 'pass' ? 'receiving' : 'rushing') + ' touchdown');
}

const ROUND_NAMES = { 'Wild Card': 'Wild Card', Divisional: 'Divisional Round', 'Conference Championship': 'Championship' };

/* What the sim played for the six in `season` from week `from` on, as the
   season file's editor writes a game: { slug: { week: edit } }, plus the
   playoff games their season file does not have yet (`added`). Weeks the
   sim took in from the site are left alone. */
function sixEdits(log, season, from) {
  const site = io.site();
  const edits = {};
  const added = {};
  const outRuns = {};
  const entries = log.filter((g) => g.season === season && !g.imported && g.week >= from && g.six);
  entries.sort((a, b) => a.week - b.week);
  const last = {};
  entries.forEach((g) => {
    Object.keys(g.six).forEach((slug) => {
      const player = site.playerBySlug(slug);
      if (!player) { return; }
      const e = g.six[slug];
      const home = g.home === e.team;
      const opp = home ? g.away : g.home;
      const ours = home ? g.score[0] : g.score[1];
      const theirs = home ? g.score[1] : g.score[0];
      const edit = {
        week: g.week, opponent: TEAMS[opp].name, home: home && !g.neutral,
        result: { teamScore: ours, opponentScore: theirs }, overtime: Boolean(g.ot),
        stats: statsFrom(site.positionFor(player, season), e.out ? null : e.line),
        bigPlays: e.out ? [] : bigPlays(e.tds)
      };
      if (e.out) {
        edit.injured = true;
        edit.injury = title(e.out);
        (outRuns[slug] = outRuns[slug] || []).push(edit);
      }
      if (g.playoff) {
        const conf = TEAMS[e.team].conf;
        edit.playoff = true;
        edit.neutral = Boolean(g.neutral) || undefined;
        edit.name = g.round === 'Super Bowl' ? 'Super Bowl ' + roman(season - 1965) : conf + ' ' + (ROUND_NAMES[g.round] || g.round);
      }
      (edits[slug] = edits[slug] || {})[g.week] = edit;
      last[slug] = g;
    });
  });
  /* How healthy he is each week he misses: worse the longer he still has
     to go, and nearly himself the week before he is back. */
  Object.keys(outRuns).forEach((slug) => {
    const run = outRuns[slug];
    run.forEach((edit, i) => {
      let left = 0;
      for (let j = i + 1; j < run.length && run[j].week === run[j - 1].week + 1; j += 1) { left += 1; }
      edit.health = Math.max(20, 80 - 13 * left);
    });
  });
  /* Playoff games the season file has no row for yet. */
  const games = ((site.stats || {})[season] || {}).games || {};
  Object.keys(edits).forEach((slug) => {
    const have = {};
    (games[slug] || []).forEach((g) => { have[g.week] = g; });
    Object.keys(edits[slug]).forEach((week) => {
      const edit = edits[slug][week];
      if (have[week]) { return; }
      if (!edit.playoff) { throw new Error(slug + ' has no Week ' + week + ' game in stats/' + season + '.js to write into.'); }
      (added[slug] = added[slug] || []).push(edit);
    });
  });
  return { edits, added, from };
}

/* Playoff dates from the last Sunday of the regular season: the wild card
   round the Saturday after, the divisional round a week on, the title games
   on the Sunday after that, and the Super Bowl a fortnight later. */
function playoffDate(lastDate, round) {
  const days = [6, 13, 21, 35][round] || 6;
  const d = new Date(lastDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/* stats/{season}.js with the sim's games written in, as a promise of its text: each played week's
   score, line, big plays and injury, the booster that was on it kept, and
   the six's playoff games added as their teams reach them. */
function seasonFileText(season, made) {
  const site = io.site();
  const forSeason = site.stats[season];
  if (!forSeason) { throw new Error('There is no stats/' + season + '.js to write into.'); }
  const weeks = {};
  const keep = forSeason.games;
  const copy = {};
  Object.keys(keep).forEach((slug) => { copy[slug] = keep[slug].slice(); });

  Object.keys(made.added).forEach((slug) => {
    const list = copy[slug] || (copy[slug] = []);
    const regular = list.filter((g) => !g.playoff);
    const lastDate = regular.filter((g) => g.date).map((g) => g.date).sort().pop() || season + 1 + '-01-07';
    const lastWeek = Math.max.apply(null, regular.map((g) => g.week).concat([0]));
    made.added[slug].forEach((e) => {
      list.push({ week: e.week, date: playoffDate(lastDate, e.week - lastWeek - 1), kickoff: null, name: e.name,
                  opponent: e.opponent, home: e.home, conference: false, neutral: e.neutral, playoff: true,
                  result: null, booster: null, stats: null });
    });
    list.sort((a, b) => a.week - b.week);
  });
  /* A regular-season week from the one the sim took over that it has not
     played yet is left empty, so nothing from before the sim is published
     by mistake. */
  site.players.forEach((player) => {
    if (!simKey(site.teamKeyFor(player, season))) { return; }
    (copy[player.slug] || []).forEach((game) => {
      if (game.playoff || game.bye || game.week < made.from || (made.edits[player.slug] || {})[game.week]) { return; }
      (weeks[game.week] = weeks[game.week] || {})[player.slug] = {
        result: null, booster: game.booster || null, stats: null, bigPlays: [], overtime: false, injured: false
      };
    });
  });
  Object.keys(made.edits).forEach((slug) => {
    const byWeek = {};
    (copy[slug] || []).forEach((g) => { byWeek[g.week] = g; });
    Object.keys(made.edits[slug]).forEach((week) => {
      const e = made.edits[slug][week];
      const game = byWeek[week];
      if (game.opponent !== e.opponent) {
        throw new Error(slug + '\u2019s Week ' + week + ' is against ' + game.opponent + ' on the site but ' + e.opponent + ' in the sim.');
      }
      (weeks[week] = weeks[week] || {})[slug] = {
        result: e.result, booster: game.booster || null, stats: e.stats, bigPlays: e.bigPlays,
        overtime: e.overtime, injured: Boolean(e.injured), injury: e.injury || null, health: e.health
      };
    });
  });

  /* The writer reads the live season, so the added games go in for as long
     as it takes to write it -- which it does before it returns -- and come
     straight back out. Hands back a promise of the text, as the writer does. */
  forSeason.games = copy;
  try {
    return site.exports.seasonFile(season, { season, weeks });
  } finally {
    forSeason.games = keep;
  }
}

/* Every NFL score the sim played in `season` from the week it took over,
   regular season only, by team name: what data/nfl-results.js holds. Read
   from the season's game log, so a season can still be written once the
   league has moved on to the next. */
function simResults(league, season) {
  const name = 'games-' + season + '.json';
  const log = io.has(league.world, name) ? io.read(league.world, name) : [];
  const played = log.filter((g) => g.season === season && !g.playoff && !g.imported && g.score);
  if (!played.length) { return null; }
  const from = Math.min.apply(null, played.map((g) => g.week));
  return {
    from,
    games: played.slice().sort((a, b) => a.week - b.week || TEAMS[a.home].name.localeCompare(TEAMS[b.home].name)).map((g) => ({
      week: g.week, home: TEAMS[g.home].name, away: TEAMS[g.away].name, score: g.score.slice(), overtime: g.ot || undefined,
      neutral: g.neutral || undefined
    }))
  };
}

/* data/nfl-results.js: every season the sim has written, this one replaced
   with `results` (or left out when there are none). */
function resultsFileText(season, results) {
  const site = io.site();
  const all = Object.assign({}, site.nflSimResults || {});
  if (results) { all[season] = results; } else { delete all[season]; }
  const q = (s) => (/['\\]/.test(s) ? JSON.stringify(s) : "'" + s + "'");
  const lines = [
    '/* ==========================================================================',
    '   EGE Football \u2014 the NFL sim\u2019s results',
    '   Written by the NFL sim (the admin page\u2019s NFL Sim tab, or',
    '   node nfl-sim/sim.js site); write it again from there rather than by hand.',
    '',
    '   From `from` on, a season\u2019s NFL games are the ones the sim played: the',
    '   standings use these in place of the real scores in data/conferences.js.',
    '   The six\u2019s own games are in stats/{year}.js, which wins wherever both',
    '   have the same game. A game counts once its week is published, like every',
    '   other result. `score` is [home, away].',
    '   ========================================================================== */',
    '',
    'window.EGE = window.EGE || {};',
    '',
    'EGE.nflSimResults = {'
  ];
  const years = Object.keys(all).map(Number).sort((a, b) => a - b);
  years.forEach((year, i) => {
    const r = all[year];
    lines.push('  ' + year + ': {');
    lines.push('    from: ' + r.from + ',');
    lines.push('    games: [');
    r.games.forEach((g, j) => {
      const flags = (g.overtime ? ', overtime: true' : '') + (g.neutral ? ', neutral: true' : '');
      lines.push('      { week: ' + (g.week < 10 ? ' ' : '') + g.week + ', home: ' + q(g.home) + ', away: ' + q(g.away) +
        ', score: [' + g.score[0] + ', ' + g.score[1] + ']' + flags + ' }' + (j < r.games.length - 1 ? ',' : ''));
    });
    lines.push('    ]');
    lines.push('  }' + (i < years.length - 1 ? ',' : ''));
  });
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

/* Both files for `season`, as a promise of { season, from, games, stats,
   results }: stats/{season}.js and data/nfl-results.js as text. Null when
   the sim has played none of that season. */
function siteFiles(league, season) {
  return Promise.resolve().then(() => {
    const results = simResults(league, season);
    if (!results) { return null; }
    const name = 'games-' + season + '.json';
    const made = sixEdits(io.has(league.world, name) ? io.read(league.world, name) : [], season, results.from);
    const text = resultsFileText(season, results);
    return seasonFileText(season, made).then((stats) => ({
      season, from: results.from, games: results.games.length, stats, results: text
    }));
  });
}

/* --------------------------------------------------------- out: rosters -- */

/* The positions the Teams pages show: the offense's skill players and the
   defense. */
const SHOWN = ['QB', 'RB', 'FB', 'WR', 'TE', 'EDGE', 'DI', 'LB', 'CB', 'S'];

/* Every team's players as the Teams pages and the player pop-up show them,
   best first. */
function publicRosters(league) {
  let site = null;
  try { site = io.site(); } catch (err) { site = null; }
  const teams = {};
  league.teams.forEach((t) => {
    teams[t.key] = (league.byTeam.get(t.key) || []).filter((p) => SHOWN.indexOf(p.pos) !== -1)
      .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
      .map((p) => {
        const sitePlayer = p.ege && site ? site.playerBySlug(p.ege) : null;
        const college = sitePlayer && site.teams[sitePlayer.college] ? site.teams[sitePlayer.college].school : p.college;
        const row = {
          name: p.name, pos: p.pos, ovr: p.ovr, age: p.age,
          years: p.entry ? league.season - p.entry + 1 : null,
          height: p.height || null, weight: p.weight || null, archetype: p.archetype || null, college: college || null,
          draft: p.draft && p.draft.pick ? { year: p.draft.year, round: p.draft.round, pick: p.draft.pick, team: p.draft.team || null } : null,
          skills: p.skills || null,
          contract: p.contract ? { apy: p.contract.apy, through: p.contract.through } : null
        };
        if (p.espn) { row.espn = String(p.espn); }
        if (p.ege) { row.ege = p.ege; }
        /* The week he was hurt, so the Teams pages hold an injury back until
           that week is out on the site. */
        if (p.injury) {
          row.out = { what: p.injury.what, games: p.injury.games >= 20 ? null : p.injury.games, week: p.injury.week || 0 };
        }
        return row;
      });
  });
  return { season: league.season, phase: league.phase, week: league.week || null, savedAt: new Date().toISOString(), teams };
}

module.exports = { siteResults, sixEdits, seasonFileText, simResults, resultsFileText, siteFiles, publicRosters, simKey };
