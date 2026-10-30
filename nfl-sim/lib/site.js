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
const { capFor } = require('./value');
const { playerFit, teamFit } = require('./fit');
const { OFFENSE, DEFENSE } = require('./schemes');
const { board } = require('./draft-plan');
const { seasons, rostersIn } = require('./history');
const { standings } = require('./standings');
const { nextRound, lastWeek, ROUNDS } = require('./season');

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
    (games[player.slug] || []).forEach((g) => {
      if (g.bye || g.playoff || g.week > through || !g.result) { return; }
      /* The team he played that week for: a trade moves him (EGE.teamKeyFor). */
      const key = simKey(site.teamKeyFor(player, season, g.week));
      if (!key) { return; }
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
   on the Sunday after that, and the Super Bowl a fortnight later. A team
   whose last game was the Saturday (2025's Seahawks and Buccaneers) counts
   from the Sunday after it, like everybody else. */
function playoffDate(lastDate, round) {
  const days = [6, 13, 21, 35][round] || 6;
  const d = new Date(lastDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + (7 - d.getUTCDay()) % 7 + days);
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

/* ------------------------------------------------------ out: the playoffs -- */

/* The playoff draw of `season`, the site's NFL bracket (data/brackets.js),
   for the rosters to carry (playoffsOut): a round at a time from the Wild
   Card, each game with both teams by name, their seeds in their
   conference, and the score once it is played. The Wild Card has each
   conference's top seed in it too, as a bye, so the whole field is there
   from the first round. The round the league plays next is in it before it
   is played, without scores; each round knows which it is (`played`).

   [{ week, round, played, games: [{ week, round, conf, home, away, seeds,
   score, overtime, neutral, bye }] }], oldest first, or null before the
   regular season is over. `conf` is the Super Bowl's 'SB'.

   The seeds are the league's own while it is in that season's playoffs or
   just past them. A season behind it has had its playoffs put away, so its
   seeds are worked out again from its games the way they were then, and
   the draw is only given if its Wild Card games agree with them. */
function playoffDraw(league, season) {
  const name = 'games-' + season + '.json';
  const log = io.has(league.world, name) ? io.read(league.world, name) : [];
  const ours = league.playoffs && league.playoffs.season === season && league.playoffs.seeds ? league.playoffs : null;
  const played = log.filter((g) => g.season === season && g.playoff && g.score);
  let seeds = ours ? ours.seeds : null;
  if (!seeds) {
    if (!played.length) { return null; }
    seeds = standings(log.filter((g) => g.season === season && !g.playoff && g.score), season).seeds;
  }
  const seedOf = (key) => {
    const at = seeds.AFC.indexOf(key);
    return at !== -1 ? at + 1 : seeds.NFC.indexOf(key) + 1;
  };
  const entry = (g, round, week) => {
    const out = {
      week, round, conf: round === 'Super Bowl' ? 'SB' : TEAMS[g.home].conf,
      home: TEAMS[g.home].name, away: TEAMS[g.away].name, seeds: [seedOf(g.home), seedOf(g.away)]
    };
    if (g.score) { out.score = g.score.slice(); }
    if (g.ot) { out.overtime = true; }
    if (g.neutral) { out.neutral = true; }
    return out;
  };

  const rounds = [];
  played.map((g) => g.week).filter((week, i, all) => all.indexOf(week) === i).sort((a, b) => a - b).forEach((week) => {
    const games = played.filter((g) => g.week === week);
    const round = games[0].round;
    rounds.push({ week, round, played: true, games: games.map((g) => entry(g, round, week)) });
  });
  if (ours && league.phase === 'playoffs' && ours.rounds.length < ROUNDS.length) {
    const round = ROUNDS[ours.rounds.length];
    const week = lastWeek(league) + ours.rounds.length + 1;
    rounds.push({ week, round, played: false, games: nextRound(league).map((g) => entry(g, round, week)) });
  }
  if (!rounds.length || rounds[0].round !== ROUNDS[0]) { return null; }

  const opening = rounds[0];
  const agrees = ['AFC', 'NFC'].every((conf) => [[2, 7], [3, 6], [4, 5]].every((pair) =>
    opening.games.some((g) => g.conf === conf && g.seeds.join() === pair.join())));
  if (!agrees) { return null; }
  ['AFC', 'NFC'].forEach((conf) => {
    opening.games.push({ week: opening.week, round: opening.round, conf, home: TEAMS[seeds[conf][0]].name, away: null,
                         seeds: [1, null], bye: true });
  });
  return rounds;
}

/* Every season's playoff draw as far as the website has put it out, for
   the bracket on the pages of the six whose teams made it (Sam,
   2026-10-26): a round's games once the week before it is out, so the
   field is there the moment the regular season's last week is, and their
   scores once the round's own week is. Worked out again every time the
   rosters go out, the way the season lines are, so nothing is out before
   its week. { season: [game] }, each game as playoffDraw gives it. */
function playoffsOut(league, site) {
  const isOut = (season, week) => Boolean(site && site.isPublished && site.isPublished(season, week));
  const out = {};
  for (let season = 2023; season <= league.season; season += 1) {
    const games = [];
    (playoffDraw(league, season) || []).forEach((r) => {
      if (!isOut(season, r.week - 1)) { return; }
      const scored = r.played && isOut(season, r.week);
      r.games.forEach((g) => {
        const game = Object.assign({}, g);
        if (!scored) {
          delete game.score;
          delete game.overtime;
        }
        games.push(game);
      });
    });
    if (games.length) { out[season] = games; }
  }
  return out;
}

/* The season's regular season as the schedule has it, for the weeks still
   to come on the League page (Sam, 2026-10-30): each game's week and teams
   by key, and nothing about how it went. Null while the schedule kept is
   still last season's, before the draft's season starts. */
function scheduleOut(league) {
  if (league.phase === 'draft' || league.phase === 'preseason' || !league.schedule) { return null; }
  return league.schedule.map((g) => {
    const row = { week: g.week, home: g.home, away: g.away };
    if (g.neutral) { row.neutral = true; }
    return row;
  });
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
    /* The weeks folded in from the admin page's stored weeks, and when each
       was saved (js/stored-weeks.js). */
    const stamped = Object.keys(r.stored || {}).map(Number).sort((a, b) => a - b);
    if (stamped.length) {
      lines.push('    stored: {');
      stamped.forEach((week, j) => { lines.push('      ' + week + ': ' + q(r.stored[week]) + (j < stamped.length - 1 ? ',' : '')); });
      lines.push('    },');
    }
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

/* ----------------------------------------------------- out: stored weeks -- */

/* Every week the sim has played of `season`, as the admin page stores it
   for the site to lay over the season files (sim_weeks, js/stored-weeks.js),
   so a week can go out with nothing committed. { from, imported, weeks },
   the weeks oldest first, each { week, games, scores, fixtures }:

   - games: the six's results, stat lines (completed the way the season
     file writes them), big plays and injuries, by slug;
   - scores: every NFL score that week, regular season only, as
     data/nfl-results.js has them;
   - fixtures: the six's playoff games that week, whether or not the season
     file has a row for them yet, or null in the regular season.

   `from` is the first week the sim played itself and `imported` the weeks
   it took in from the site, which are the site's own. Worked out from the
   season file as committed: the page lays the stored weeks off first. */
function weekRows(league, season) {
  const site = io.site();
  const name = 'games-' + season + '.json';
  const log = io.has(league.world, name) ? io.read(league.world, name) : [];
  const imported = {};
  log.filter((g) => g.season === season && g.imported).forEach((g) => { imported[g.week] = true; });
  const played = log.filter((g) => g.season === season && !g.imported && g.score);
  if (!played.length) { return { from: null, imported: Object.keys(imported).map(Number), weeks: [] }; }
  const from = Math.min.apply(null, played.map((g) => g.week));
  const made = sixEdits(log, season, from);
  const file = ((site.stats || {})[season] || {}).games || {};
  const weeks = {};
  const weekOf = (n) => weeks[n] || (weeks[n] = { week: n, games: {}, scores: [], fixtures: null });
  played.forEach((g) => { weekOf(g.week); });

  Object.keys(made.edits).forEach((slug) => {
    const player = site.playerBySlug(slug);
    const list = file[slug] || [];
    const regular = list.filter((g) => !g.playoff);
    const lastDate = regular.filter((g) => g.date).map((g) => g.date).sort().pop() || season + 1 + '-01-07';
    const lastWeek = Math.max.apply(null, regular.map((g) => g.week).concat([0]));
    Object.keys(made.edits[slug]).forEach((n) => {
      const e = made.edits[slug][n];
      const have = list.filter((g) => g.week === e.week)[0];
      if (have && !e.playoff && have.opponent !== e.opponent) {
        throw new Error(slug + '’s Week ' + e.week + ' is against ' + have.opponent + ' on the site but ' + e.opponent + ' in the sim.');
      }
      const w = weekOf(e.week);
      w.games[slug] = {
        result: e.result, stats: site.statline.complete(player.position, e.stats), bigPlays: e.bigPlays,
        overtime: e.overtime, injured: Boolean(e.injured), injury: e.injury || null,
        health: typeof e.health === 'number' ? e.health : null
      };
      if (e.playoff) {
        w.fixtures = w.fixtures || {};
        w.fixtures[slug] = {
          week: e.week, date: have && have.date ? have.date : playoffDate(lastDate, e.week - lastWeek - 1),
          kickoff: have ? have.kickoff || null : null, name: e.name, opponent: e.opponent, home: e.home,
          conference: false, neutral: Boolean(e.neutral), playoff: true, result: null, booster: null, stats: null
        };
      }
    });
  });

  const results = simResults(league, season);
  (results ? results.games : []).forEach((g) => {
    const score = { home: g.home, away: g.away, score: g.score.slice() };
    if (g.overtime) { score.overtime = true; }
    if (g.neutral) { score.neutral = true; }
    weekOf(g.week).scores.push(score);
  });
  return {
    from,
    imported: Object.keys(imported).map(Number),
    weeks: Object.keys(weeks).map(Number).sort((a, b) => a - b).map((n) => weeks[n])
  };
}

/* ------------------------------------------------------ out: box scores -- */

/* Every game the sim has played, a row a week, for the League page (Sam,
   2026-10-30): sim_box_scores, which nobody but an admin can read until
   the week is published. { season, week, games, digest }, oldest first.
   Each game is its score, both teams' numbers ([home, away], as the score
   is), every player's line, the scoring plays and who got hurt, in the
   order the schedule has them. A player is his name, position and team,
   with his ESPN id for his headshot and which of the six he is: never the
   sim's own id. A game played before the box scores were kept has its
   leaders instead. Weeks taken in from the site are the site's, and left
   out. `digest` changes whenever anything in the row does, so the NFL Sim
   tab writes only the weeks that changed. */
function boxRows(league) {
  const rows = [];
  for (let season = 2023; season <= league.season; season += 1) {
    const name = 'games-' + season + '.json';
    if (!io.has(league.world, name)) { continue; }
    const weeks = {};
    io.read(league.world, name).filter((g) => g.season === season && !g.imported && g.score).forEach((g) => {
      const game = { home: g.home, away: g.away, score: g.score };
      if (g.ot) { game.ot = true; }
      if (g.neutral) { game.neutral = true; }
      if (g.round) { game.round = g.round; }
      if (g.box) {
        game.teams = (g.teams || []).map((t) => Object.assign({}, t, t.top ? { top: Math.round(t.top) } : {}));
        game.box = g.box.map((l) => {
          const p = l.id ? league.byId.get(l.id) : null;
          const line = { name: l.name, pos: l.pos, team: l.team };
          if (p && p.espn) { line.espn = String(p.espn); }
          if (p && p.collegePhoto) { line.collegePhoto = true; }
          if (l.ege || (p && p.ege)) { line.ege = l.ege || p.ege; }
          Object.keys(l).forEach((k) => { if (typeof l[k] === 'number') { line[k] = l[k]; } });
          return line;
        });
      } else {
        game.leaders = { passing: g.passing || [], rushing: g.rushing || [], receiving: g.receiving || [] };
      }
      game.scoring = g.scoring || [];
      game.injuries = g.injuries || [];
      (weeks[g.week] || (weeks[g.week] = [])).push(game);
    });
    Object.keys(weeks).map(Number).sort((a, b) => a - b).forEach((week) => {
      rows.push({ season, week, games: weeks[week], digest: digest(JSON.stringify(weeks[week])) });
    });
  }
  return rows;
}

/* Two 32-bit FNV-1a hashes of the text, run different ways, as hex. */
function digest(text) {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x811c9dc5) + i;
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0') + text.length.toString(16);
}

/* ---------------------------------------------------- out: season lines -- */

/* The first season a player's pop-up has his numbers for (Sam, 2026-10-26):
   2025, the first the sim kept for everybody. */
const LINES_FROM = 2025;

/* What a season line carries: his games, and the numbers the pop-up shows
   at one position or another. */
const LINE_KEYS = ['games', 'passCmp', 'passAtt', 'passYds', 'passTd', 'passInt', 'rushAtt', 'rushYds', 'rushTd',
                   'targets', 'rec', 'recYds', 'recTd', 'tackles', 'sacks', 'ints', 'passDef', 'ff', 'defTd',
                   'fgm', 'fga', 'xpm', 'xpa', 'punts', 'puntYards'];

/* A season's totals (stats-{season}.json, or the season being played) as
   far as the website has put it out: every week not out yet is taken off,
   line by line from the game log's box scores, so a pop-up never gives a
   game away before it is published. { lines: by player id, through: the
   last week counted, 0 for none }. A box line from before the lines had
   ids is matched by name and position. */
function linesOut(league, season, totals, site) {
  const name = 'games-' + season + '.json';
  const log = io.has(league.world, name) ? io.read(league.world, name) : [];
  const isOut = (week) => Boolean(site && site.isPublished && site.isPublished(season, week));
  const held = {};
  let through = 0;
  log.forEach((g) => {
    if (isOut(g.week)) { through = Math.max(through, g.week); return; }
    (g.box || []).forEach((l) => {
      const key = l.id || l.name + '|' + l.pos;
      const h = held[key] || (held[key] = { games: 0 });
      h.games += 1;
      LINE_KEYS.forEach((k) => { if (k !== 'games' && l[k]) { h[k] = (h[k] || 0) + l[k]; } });
    });
  });
  const lines = {};
  Object.keys(totals || {}).forEach((id) => {
    const t = totals[id];
    const h = held[id] || held[t.name + '|' + t.pos] || {};
    const line = {};
    LINE_KEYS.forEach((k) => {
      const n = (t[k] || 0) - (h[k] || 0);
      if (n) { line[k] = n; }
    });
    if (line.games) { lines[id] = line; }
  });
  return { lines, through };
}

/* Every player's seasons for his pop-up, 2025 on, by id: the season, the
   team he finished it with, how old he was, and his line (none for a
   season he was on a roster and never got one: a lineman, a backup who
   never played). A season over takes the team and age from that season's
   final rosters (rosters-{season}.json), or the team he last played for;
   the season being played, his team now, or the last he played for if
   nobody has him (a free agent the search finds). A season with no week
   out on the site is left off. */
function seasonLines(league, site) {
  const out = new Map();
  const add = (id, entry) => { if (!out.has(id)) { out.set(id, []); } out.get(id).push(entry); };
  const through = {};
  for (let season = LINES_FROM; season <= league.season; season += 1) {
    const now = season === league.season;
    if (!now && !io.has(league.world, 'stats-' + season + '.json')) { continue; }
    const totals = now ? league.stats || {} : io.read(league.world, 'stats-' + season + '.json');
    const got = linesOut(league, season, totals, site);
    if (!got.through) { continue; }
    through[season] = got.through;
    const ago = league.season - season;
    const ageThen = (p) => (typeof p.age === 'number' ? p.age - ago : null);
    if (now) {
      league.players.forEach((p) => {
        const line = got.lines[p.id] || null;
        const on = p.status === 'active' && TEAMS[p.team] ? p.team : null;
        const team = on || (line && totals[p.id] ? totals[p.id].team : null);
        if (team) { add(p.id, { season, team, age: ageThen(p), line }); }
      });
      continue;
    }
    const shot = io.has(league.world, 'rosters-' + season + '.json') ? io.read(league.world, 'rosters-' + season + '.json') : null;
    const ended = {};
    if (shot) {
      Object.keys(shot.teams).forEach((key) => shot.teams[key].players.forEach((r) => { ended[r.id] = { team: key, age: r.age }; }));
    }
    const ids = new Set(Object.keys(ended).concat(Object.keys(got.lines)));
    ids.forEach((id) => {
      const p = league.byId.get(id);
      const team = ended[id] ? ended[id].team : totals[id] ? totals[id].team : null;
      if (!team) { return; }
      const age = ended[id] && typeof ended[id].age === 'number' ? ended[id].age : p ? ageThen(p) : null;
      add(id, { season, team, age, line: got.lines[id] || null });
    });
  }
  return { byId: out, through };
}

/* --------------------------------------------------------- out: rosters -- */

/* How many seasons of the salary cap go out with the rosters: this one and
   the three after it, the years a team's contracts are shown for. */
const CAP_YEARS = 4;

/* Every team's players as the Teams pages and the player pop-up show them,
   best first: every player, the linemen, kickers and punters too, since
   the Teams pages' line rating and payroll count them (Sam, 2026-10-21)
   and the rooms show them (2026-10-22), each with his fit in the team's
   schemes in stars.
   With them, the salary cap for the next few seasons, and each team's
   system: its offense and defense with how well it is built for them in
   stars, and its status (Sam, 2026-10-21: for everybody to see). Each
   player carries his seasons from 2025 on, for his pop-up (seasonLines),
   and `linesThrough` says how far into this season they count, so the
   site can have them published again once another week is out. Every
   season's playoff draw comes too, as far as it is out (playoffsOut), and
   the season's schedule (scheduleOut). */
function publicRosters(league) {
  let site = null;
  try { site = io.site(); } catch (err) { site = null; }
  const lines = seasonLines(league, site);
  const teams = {};
  league.teams.forEach((t) => {
    teams[t.key] = (league.byTeam.get(t.key) || []).slice()
      .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
      .map((p) => {
        const row = {
          name: p.name, pos: p.pos, ovr: p.ovr, age: p.age,
          years: p.entry ? league.season - p.entry + 1 : null,
          height: p.height || null, weight: p.weight || null, archetype: p.archetype || null, college: siteCollege(site, p),
          draft: p.draft && p.draft.pick ? { year: p.draft.year, round: p.draft.round, pick: p.draft.pick, team: p.draft.team || null } : null,
          skills: p.skills || null,
          contract: p.contract ? { apy: p.contract.apy, through: p.contract.through } : null
        };
        if (p.espn) { row.espn = String(p.espn); }
        if (p.collegePhoto) { row.collegePhoto = true; }
        if (p.ege) { row.ege = p.ege; }
        const fit = playerFit(league, p, t.key);
        if (fit) { row.fit = fit.stars; }
        /* The week he was hurt, so the Teams pages hold an injury back until
           that week is out on the site. */
        if (p.injury) {
          row.out = { what: p.injury.what, games: p.injury.games >= 20 ? null : p.injury.games, week: p.injury.week || 0 };
        }
        if (lines.byId.has(p.id)) { row.seasons = lines.byId.get(p.id); }
        return row;
      });
  });
  const caps = {};
  for (let y = league.season; y < league.season + CAP_YEARS; y += 1) { caps[y] = capFor(y); }
  const systems = {};
  league.teams.forEach((t) => {
    const built = teamFit(league, t.key) || {};
    systems[t.key] = {
      offense: OFFENSE[t.offense] ? OFFENSE[t.offense].name : t.offense || null,
      defense: DEFENSE[t.defense] ? DEFENSE[t.defense].name : t.defense || null,
      offenseStars: built.offense ? built.offense.stars : null,
      defenseStars: built.defense ? built.defense.stars : null,
      mode: t.mode || 'compete'
    };
  });
  /* Every team's picks out to 2030 and beyond (lib/picks.js): the year
     and round, whose pick it was when it is not the team's own, and its
     number once the draft's order is known. */
  const owned = board(league);
  const picks = {};
  Object.keys(owned).forEach((key) => {
    picks[key] = owned[key].map((p) => {
      const row = { year: p.year, round: p.round };
      if (p.from !== key) { row.from = p.from; }
      if (p.n) { row.n = p.n; }
      return row;
    });
  });
  return { season: league.season, phase: league.phase, week: league.week || null, savedAt: new Date().toISOString(), caps, systems,
           picks, linesThrough: lines.through[league.season] || 0, teams, freeAgents: freeAgents(league, site, lines),
           retired: retiredPlayers(league, site, lines), playoffs: playoffsOut(league, site), schedule: scheduleOut(league) };
}

function siteCollege(site, p) {
  const sitePlayer = p.ege && site ? site.playerBySlug(p.ege) : null;
  return sitePlayer && site.teams[sitePlayer.college] ? site.teams[sitePlayer.college].school : p.college || null;
}

/* For the site's search (Sam, 2026-10-26): everybody nobody has signed,
   as a roster row without a contract or a fit, best first. */
function freeAgents(league, site, lines) {
  return league.players.filter((p) => p.status === 'fa' || (p.status === 'active' && !league.byTeam.has(p.team)))
    .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
    .map((p) => {
      const row = {
        name: p.name, pos: p.pos, ovr: p.ovr, age: p.age,
        years: p.entry ? league.season - p.entry + 1 : null,
        height: p.height || null, weight: p.weight || null, archetype: p.archetype || null, college: siteCollege(site, p),
        draft: p.draft && p.draft.pick ? { year: p.draft.year, round: p.draft.round, pick: p.draft.pick, team: p.draft.team || null } : null,
        skills: p.skills || null
      };
      if (p.espn) { row.espn = String(p.espn); }
      if (p.collegePhoto) { row.collegePhoto = true; }
      if (p.ege) { row.ege = p.ege; }
      if (lines && lines.byId.has(p.id)) { row.seasons = lines.byId.get(p.id); }
      return row;
    });
}

/* And everybody who has retired, with the season he retired before and the
   team he last played for: the newest season kept in the world with him on
   a roster (lib/history.js), or the one that let him go. A retired player
   keeps only who he was in the world (lib/offseason.js), so no skills. */
function retiredPlayers(league, site, lines) {
  const lastTeam = {};
  seasons(league).filter((s) => s !== league.season).forEach((s) => {
    const shot = rostersIn(league, s);
    if (!shot || !shot.teams) { return; }
    Object.keys(shot.teams).forEach((key) => {
      (shot.teams[key].players || []).forEach((p) => {
        if (!lastTeam[p.id]) { lastTeam[p.id] = key; }
      });
    });
  });
  return league.players.filter((p) => p.status === 'retired')
    .sort((a, b) => (b.retired || 0) - (a.retired || 0) || b.ovr - a.ovr || a.name.localeCompare(b.name))
    .map((p) => {
      const row = {
        name: p.name, pos: p.pos, ovr: p.ovr, age: p.age, retired: p.retired || null,
        team: lastTeam[p.id] || (p.lastTeam && TEAMS[p.lastTeam] ? p.lastTeam : null),
        height: p.height || null, weight: p.weight || null, archetype: p.archetype || null, college: siteCollege(site, p),
        draft: p.draft && p.draft.pick ? { year: p.draft.year, round: p.draft.round, pick: p.draft.pick, team: p.draft.team || null } : null
      };
      if (p.espn) { row.espn = String(p.espn); }
      if (p.collegePhoto) { row.collegePhoto = true; }
      if (p.ege) { row.ege = p.ege; }
      if (lines && lines.byId.has(p.id)) { row.seasons = lines.byId.get(p.id); }
      return row;
    });
}

module.exports = { siteResults, sixEdits, seasonFileText, simResults, playoffDraw, playoffsOut, resultsFileText, siteFiles, weekRows, boxRows,
                   publicRosters, seasonLines, simKey };
