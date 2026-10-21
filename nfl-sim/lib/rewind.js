/* ==========================================================================
   EGE Football NFL sim — playing a week again
   Before the sim plays a week (or a playoff round), the league as it stands
   and the trade queue are kept in the world as that week's save point,
   rewind-{season}-{week}.json. Undoing a week puts the league back to it:
   the week's scores, injuries and stats are gone, and so is every week
   played after it and anything done since -- an edit, a signing, a trade
   approved -- and the game log loses those weeks too. To resim is to undo
   and play the week again.

   Every undo moves the world on to a new take (league.take, which the dice
   are seeded with: lib/run.js), so the week comes out differently, and so
   does everything after it.

   Weeks taken in from the site have no save point. A week that is out on
   the website cannot be undone, and nor can one before it: the site has
   shown it and paid for it. Save points last until the offseason, which
   clears them.
   ========================================================================== */

'use strict';

const io = require('./io');
const { saved, ready } = require('./league');
const { readWorld, writeWorld, lastWeek, ROUNDS } = require('./season');

function fileFor(season, week) { return 'rewind-' + season + '-' + week + '.json'; }

/* The week the league plays next: a regular-season week, or the playoff
   round in the weeks after it (19-22, as on the site). */
function nextWeek(league) {
  if (league.phase === 'playoffs') { return lastWeek(league) + league.playoffs.rounds.length + 1; }
  return league.week;
}

function labelFor(league, week) {
  const last = lastWeek(league);
  return week > last ? ROUNDS[week - last - 1] || 'Week ' + week : 'Week ' + week;
}

/* Keeps the league as it is now as the save point of the week it plays
   next. Called just before that week is played. */
function mark(league) {
  if (league.phase !== 'regular' && league.phase !== 'deadline' && league.phase !== 'playoffs') { return; }
  const week = nextWeek(league);
  const list = (league.rewinds || []).filter((r) => !(r.season === league.season && r.week >= week));
  league.rewinds = list;
  io.write(league.world, fileFor(league.season, week), {
    season: league.season, week, league: saved(league), trades: readWorld(league, 'trades.json', [])
  });
  list.push({ season: league.season, week, label: labelFor(league, week), changes: (league.transactions || []).length });
}

function published(season, week) {
  let site = null;
  try { site = io.site(); } catch (err) { site = null; }
  return Boolean(site && site.isPublished && site.isPublished(season, week));
}

/* The weeks of this season that can be played again, newest first:
   { week, label, later (weeks played after it), changes (made since) }.
   None from before a week that is out on the site. */
function points(league) {
  const list = (league.rewinds || []).filter((r) => r.season === league.season).sort((a, b) => b.week - a.week);
  const now = (league.transactions || []).length;
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    if (published(league.season, list[i].week)) { break; }
    out.push({ week: list[i].week, label: list[i].label, later: list.slice(0, i).map((r) => r.label).reverse(),
               changes: Math.max(0, now - list[i].changes) });
  }
  return out;
}

/* Puts the league back to where it was before `week`. Returns what went:
   { week, label, later, changes }. */
function undo(league, week) {
  const point = points(league).filter((p) => p.week === Number(week))[0];
  if (!point) {
    const known = (league.rewinds || []).some((r) => r.season === league.season && r.week === Number(week));
    throw new Error(known ? 'Week ' + week + ', or a week after it, is already out on the site.' :
      'There is no save point for Week ' + week + ' of ' + league.season + '.');
  }
  const name = fileFor(league.season, point.week);
  if (!io.has(league.world, name)) { throw new Error('The save point for ' + point.label + ' is missing.'); }
  const back = io.read(league.world, name);
  const take = (league.take || 0) + 1;
  const world = league.world;
  Object.keys(league).forEach((k) => { delete league[k]; });
  Object.assign(league, back.league, { world, take });
  ready(league);
  const log = 'games-' + league.season + '.json';
  writeWorld(league, log, readWorld(league, log, []).filter((g) => g.season !== league.season || g.week < point.week));
  writeWorld(league, 'trades.json', back.trades || []);
  return point;
}

/* The season is over: its save points go. */
function clear(league) {
  const last = lastWeek(league) + ROUNDS.length;
  for (let week = 1; week <= last; week += 1) { io.remove(league.world, fileFor(league.season, week)); }
  league.rewinds = [];
}

module.exports = { mark, points, undo, clear, fileFor };
