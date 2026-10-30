/* ==========================================================================
   EGE Football NFL sim — the commands
   What the command line (sim.js) and the admin page's NFL Sim tab both do:
   open the world, play a week, play on to the deadline or the end of the
   regular season, the playoffs, the offseason and the draft, and the trade
   queue. Each hands back what happened; sim.js prints it and the admin page
   draws it.

   Every step that plays games is seeded from the world's seed and where the
   league is, so the same world always plays out the same way, wherever it
   is run. Each week the sim plays is kept first as a save point, so it can
   be undone or played again (lib/rewind.js); every undo moves the world to
   a new take, and the dice with it.
   ========================================================================== */

'use strict';

const { loadLeague, saveLeague } = require('./league');
const { seeded } = require('./rng');
const season = require('./season');
const { startOffseason, finishOffseason, firstModes } = require('./offseason');
const trades = require('./trades');
const { TEAMS } = require('./teams');
const { siteResults } = require('./site');
const { applyOfficial } = require('./draft-plan');
const rewind = require('./rewind');
const sixOffers = require('./six-offers');

function rngFor(league, what) {
  return seeded((league.seed || 'ege-nfl') + (league.take ? ':take' + league.take : '') + ':' + league.season + ':' +
    league.phase + ':' + (league.week || 0) + ':' + what);
}

function hooks() {
  return {
    deadline: (l) => trades.propose(l, 'deadline', rngFor(l, 'deadline')),
    closeDeadline: (l) => trades.closeWindow(l, 'deadline')
  };
}

/* The league, ready for the next step: a world that has not started yet
   gets its teams' first plans and its schedule, any draft order set by
   hand is put in force (lib/draft-plan.js), and any of the six who is a
   free agent has his offers (lib/six-offers.js). */
function open(world, seed) {
  const league = loadLeague(world);
  if (!league.seed) { league.seed = seed || 'ege-nfl'; }
  applyOfficial(league);
  if (league.phase === 'preseason') {
    if (!(league.history || []).length) { firstModes(league); }
    season.startSeason(league, rngFor(league, 'start'));
  }
  sixOffers.fill(league);
  return league;
}

function save(league) { saveLeague(league); }

/* What the next step is, in a word the admin page can put on a button. */
function nextStep(league) {
  if (league.phase === 'regular') { return 'week'; }
  if (league.phase === 'deadline') { return 'deadline'; }
  if (league.phase === 'playoffs') { return 'playoffs'; }
  if (league.phase === 'offseason') { return 'offseason'; }
  if (league.phase === 'draft') { return 'draft'; }
  return league.phase;
}

/* The next week of the regular season, or the next playoff round. */
function playNext(league) {
  if (league.phase === 'offseason' || league.phase === 'draft') { throw new Error('The season is over: run the offseason, then the draft.'); }
  rewind.mark(league);
  if (league.phase === 'playoffs') { return season.playRound(league, rngFor(league, 'round')); }
  return season.playWeek(league, rngFor(league, 'week'), hooks());
}

/* Week after week to the trade deadline, or from there to the end of the
   regular season. Stops at the deadline while there are trades to look at. */
function playOn(league) {
  const weeks = [];
  let first = true;
  while (league.phase === 'regular' || (league.phase === 'deadline' && first)) {
    first = false;
    rewind.mark(league);
    const r = season.playWeek(league, rngFor(league, 'week'), hooks());
    weeks.push(r);
    if (r.deadline) { break; }
  }
  return weeks;
}

function playPlayoffs(league) {
  if (league.phase !== 'playoffs') { throw new Error('The playoffs are not on (phase: ' + league.phase + ').'); }
  const rounds = [];
  while (league.phase === 'playoffs') {
    rewind.mark(league);
    rounds.push(season.playRound(league, rngFor(league, 'round')));
  }
  return { rounds, champion: league.playoffs.champion };
}

/* Puts the league back to before `week` of this season (a playoff round
   is the week it was played in, 19 to 22). Returns what was undone. */
function undo(league, week) { return rewind.undo(league, week); }

/* Undoes `week` and plays it again, on new dice. */
function resim(league, week) {
  const undone = rewind.undo(league, week);
  return { undone, played: playNext(league) };
}

function offseason(league) {
  if (league.phase !== 'offseason') { throw new Error('The offseason starts after the Super Bowl (phase: ' + league.phase + ').'); }
  rewind.clear(league);
  return startOffseason(league, rngFor(league, 'offseason'));
}

/* `place` puts one of the six with a team: { 'cooper-clark': 'LAC:2' }. */
function draft(league, place) { return finishOffseason(league, rngFor(league, 'draft'), place || {}); }

/* The website's weeks through `through`, taken as they were played (see
   season.importWeeks): the six's games from their season file and everybody
   else's real scores. */
function importSite(league, through) {
  const found = siteResults(league.season, through);
  return season.importWeeks(league, found.results, through, hooks(), { egeHurt: found.egeHurt });
}

function queue(league, all) {
  return trades.loadQueue(league).filter((t) => all || t.status === 'pending');
}

/* The six, as they stand: who, where (a free agent too), how good, hurt,
   and their season. */
function sixNow(league) {
  return league.players.filter((p) => p.ege && (p.status === 'active' || p.status === 'fa')).map((p) => ({
    slug: p.ege, name: p.name, pos: p.pos, team: p.team,
    teamName: p.status === 'fa' ? 'Free agent' : TEAMS[p.team] ? TEAMS[p.team].name : p.team, ovr: p.ovr,
    out: p.injury ? { what: p.injury.what, games: p.injury.games } : null,
    stats: (league.stats || {})[p.id] || {}
  }));
}

/* The six's season so far as one line of words. */
function sixLine(s) {
  const t = s.stats;
  const bits = [];
  if (t.passAtt) { bits.push(t.passCmp + '/' + t.passAtt + ', ' + t.passYds + ' yds, ' + (t.passTd || 0) + ' TD, ' + (t.passInt || 0) + ' INT'); }
  if (t.rushAtt) { bits.push(t.rushAtt + ' car, ' + t.rushYds + ' yds, ' + (t.rushTd || 0) + ' TD'); }
  if (t.rec || t.targets) { bits.push((t.rec || 0) + ' rec, ' + (t.recYds || 0) + ' yds, ' + (t.recTd || 0) + ' TD'); }
  return bits.join('; ');
}

module.exports = {
  rngFor, hooks, open, save, nextStep, playNext, playOn, playPlayoffs, offseason, draft, importSite, queue, sixNow, sixLine,
  undo, resim, savePoints: rewind.points,
  approve: trades.approve, reject: trades.reject, proposeOwn: trades.proposeOwn,
  offers: sixOffers.waiting, acceptOffer: sixOffers.accept
};
