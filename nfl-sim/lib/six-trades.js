/* ==========================================================================
   EGE Football NFL sim — the six, traded
   One of the six can be traded like anybody else, in season too (Sam,
   2026-10-23). The games he has played stay on his page as the team he
   played them for; from the week he moves, his season file's games are
   his new team's.

   Every move is kept in the league as it is made (league.egeTrades), so a
   week undone takes one back with everything else done since. The admin
   page stores them for the site (sim_trades, js/stored-weeks.js), each
   with the new team's games from that week to the end of the regular
   season, written the way a season file writes a game: the date, and the
   kickoff on the team's own clock, from the real schedule (data/
   schedules.json, nflverse's Eastern times); a season with no real one
   gets the Sundays and no kickoffs.
   ========================================================================== */

'use strict';

const io = require('./io');
const { TEAMS } = require('./teams');
const { scheduleFor } = require('./schedule');
const { lastPlaces } = require('./season');

const DAY = 24 * 60 * 60 * 1000;

/* The season and week he first plays for the new team: the week the
   league plays next in the regular season, or the next season's first
   when the move is made between seasons. Before the draft the league is
   already in the season to come (offseason.js moves it on), so that one's
   Week 1. */
function startOf(league) {
  if (league.phase === 'regular' || league.phase === 'deadline') { return { season: league.season, week: league.week }; }
  if (league.phase === 'preseason' || league.phase === 'draft') { return { season: league.season, week: 1 }; }
  return { season: league.season + 1, week: 1 };
}

/* One of the six has gone from `from` to `to` (sim keys). Two moves before
   he plays a game are one, and one that sends him back where he was is
   none. */
function record(league, p, from, to) {
  if (!p || !p.ege || from === to) { return null; }
  const at = startOf(league);
  const list = league.egeTrades = league.egeTrades || [];
  const same = list.filter((t) => t.slug === p.ege && t.season === at.season && t.week === at.week)[0];
  if (same) {
    same.to = to;
    if (same.from === to) { list.splice(list.indexOf(same), 1); }
    return same;
  }
  const move = { slug: p.ege, season: at.season, week: at.week, from: from || null, to };
  list.push(move);
  return move;
}

/* --------------------------------------------------- the games he plays -- */

/* Sunday of Week 1: the Sunday after Labor Day. */
function firstSunday(season) {
  const sept = new Date(Date.UTC(season, 8, 1));
  const labor = 1 + (8 - sept.getUTCDay()) % 7;
  return Date.UTC(season, 8, labor + 6);
}

function sundayOf(season, week) {
  return new Date(firstSunday(season) + (week - 1) * 7 * DAY).toISOString().slice(0, 10);
}

/* The parts of a moment on a zone's clock. */
function partsIn(ms, zone) {
  const parts = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true
  }).formatToParts(new Date(ms)).forEach((part) => { parts[part.type] = part.value; });
  return parts;
}

function wallMs(parts) {
  const hour = Number(parts.hour) % 12 + (String(parts.dayPeriod).toLowerCase() === 'pm' ? 12 : 0);
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), hour, Number(parts.minute));
}

/* An Eastern date and time ('2025-11-09', '13:00') as the date and kickoff
   the team's own clock reads: { date: '2025-11-09', kickoff: '12:00pm' }. */
function localKickoff(date, time, zone) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let at = wall;
  for (let i = 0; i < 2; i += 1) { at = wall - (wallMs(partsIn(at, 'America/New_York')) - at); }
  const here = partsIn(at, zone || 'America/New_York');
  return {
    date: here.year + '-' + here.month + '-' + here.day,
    kickoff: Number(here.hour) + ':' + here.minute + String(here.dayPeriod || '').toLowerCase()
  };
}

function zoneOf(key) {
  let site = null;
  try { site = io.site(); } catch (err) { site = null; }
  const team = site && site.teams ? site.teams[TEAMS[key].site] : null;
  return (team && team.zone) || 'America/New_York';
}

/* `key`'s regular season from `week` on, as season file rows: each game,
   and the bye if it is still to come. */
function rowsFor(league, season, key, week) {
  /* Before the draft the schedule kept is last season's. */
  const current = league.season === season && league.schedule && league.phase !== 'draft';
  const schedule = current ? league.schedule : scheduleFor(season, lastPlaces(league));
  const real = {};
  (io.data('schedules.json')[season] || []).forEach((g) => { real[g.week + '|' + g.home + '|' + g.away] = g; });
  const zone = zoneOf(key);
  const last = schedule.reduce((n, g) => Math.max(n, g.week), 0);
  const rows = [];
  for (let w = week; w <= last; w += 1) {
    const g = schedule.filter((x) => x.week === w && (x.home === key || x.away === key))[0];
    if (!g) {
      rows.push({ week: w, date: sundayOf(season, w), kickoff: null, opponent: null, home: false, conference: false, bye: true,
                  result: null, booster: null, stats: null });
      continue;
    }
    const opp = g.home === key ? g.away : g.home;
    const dated = real[g.week + '|' + g.home + '|' + g.away];
    const when = dated && dated.date && dated.time ? localKickoff(dated.date, dated.time, zone) : { date: sundayOf(season, w), kickoff: null };
    const row = { week: w, date: when.date, kickoff: when.kickoff, opponent: TEAMS[opp].name, home: g.home === key && !g.neutral,
                  conference: false };
    if (TEAMS[opp].conf === TEAMS[key].conf && TEAMS[opp].div === TEAMS[key].div) { row.division = true; }
    if (g.neutral) { row.neutral = true; }
    rows.push(Object.assign(row, { result: null, booster: null, stats: null }));
  }
  return rows;
}

/* Every move of the six the league has made, as the site stores it:
   { season, week, slug, from, to, games }, the teams by their keys on the
   site and `games` the new team's rows from that week on. */
function siteTrades(league) {
  return (league.egeTrades || []).map((t) => ({
    season: t.season, week: t.week, slug: t.slug,
    from: t.from && TEAMS[t.from] ? TEAMS[t.from].site : null,
    to: TEAMS[t.to].site,
    games: rowsFor(league, t.season, t.to, t.week)
  }));
}

/* On the command line, where there is no Supabase to lay them over the
   season files from: each trade the files do not have yet put into the
   site's copy of them (as js/stored-weeks.js does on the page), so the
   files written from it have the new team's games. */
function layOver(site, league) {
  siteTrades(league).forEach((t) => {
    const forSeason = site.stats && site.stats[t.season];
    if (!forSeason) { return; }
    const trades = forSeason.trades = forSeason.trades || {};
    const had = (trades[t.slug] || []).filter((x) => x.week === t.week)[0];
    if (had && had.to === t.to) { return; }
    trades[t.slug] = (trades[t.slug] || []).filter((x) => x.week !== t.week).concat([{ week: t.week, from: t.from, to: t.to }])
      .sort((a, b) => a.week - b.week);
    forSeason.games[t.slug] = (forSeason.games[t.slug] || []).filter((g) => g.playoff || g.week < t.week).concat(t.games)
      .sort((a, b) => a.week - b.week);
  });
}

module.exports = { record, siteTrades, rowsFor, layOver, localKickoff, sundayOf };
