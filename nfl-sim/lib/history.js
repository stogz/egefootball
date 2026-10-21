/* ==========================================================================
   EGE Football NFL sim — rosters by season
   When a season ends (the offseason starts), every team's roster is kept in
   the world as rosters-{season}.json: every position, with the team's
   record. The season being played is read live. Set against the season
   before, a roster says who came (and from where) and who went (and
   where to): the admin page's Rosters by season.
   ========================================================================== */

'use strict';

const io = require('./io');
const { readWorld, writeWorld } = require('./season');
const { standings, recordText } = require('./standings');

const ORDER = ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DI', 'LB', 'CB', 'S', 'K', 'P'];

function fileFor(season) { return 'rosters-' + season + '.json'; }

/* Every team's players as they stand. */
function snapshot(league) {
  /* Before the draft the schedule is still last season's. */
  const played = league.phase !== 'draft' && league.schedule && league.schedule.some((g) => g.score);
  const records = played ? standings(league.schedule, league.season).records : {};
  const teams = {};
  league.teams.forEach((t) => {
    teams[t.key] = {
      record: records[t.key] ? recordText(records[t.key]) : null,
      players: (league.byTeam.get(t.key) || []).slice()
        .sort((a, b) => ORDER.indexOf(a.pos) - ORDER.indexOf(b.pos) || b.ovr - a.ovr || a.name.localeCompare(b.name))
        .map((p) => {
          const row = { id: p.id, name: p.name, pos: p.pos, age: p.age, ovr: p.ovr };
          if (p.draft && p.draft.year === league.season) { row.rookie = { round: p.draft.round, pick: p.draft.pick }; }
          if (p.ege) { row.ege = p.ege; }
          return row;
        })
    };
  });
  return { season: league.season, phase: league.phase, teams };
}

/* Called as the season ends. */
function keep(league) { writeWorld(league, fileFor(league.season), snapshot(league)); }

/* The seasons there are rosters for, newest first. */
function seasons(league) {
  const out = [league.season];
  (league.history || []).forEach((h) => {
    if (h.season !== league.season && io.has(league.world, fileFor(h.season))) { out.push(h.season); }
  });
  return out.sort((a, b) => b - a);
}

function rostersIn(league, season) {
  return season === league.season ? snapshot(league) : readWorld(league, fileFor(season), null);
}

/* A team's season set against the one before: who arrived, from where
   (another team, the draft, free agency), and who left, to where (another
   team, retired, released). Null with no season before to go on. */
function changes(league, key, season) {
  const now = rostersIn(league, season);
  const then = rostersIn(league, season - 1);
  if (!now || !then || !now.teams[key] || !then.teams[key]) { return null; }
  const whereIn = (shot) => {
    const at = {};
    Object.keys(shot.teams).forEach((k) => shot.teams[k].players.forEach((p) => { at[p.id] = k; }));
    return at;
  };
  const before = whereIn(then);
  const after = whereIn(now);
  const was = new Set(then.teams[key].players.map((p) => p.id));
  const is = new Set(now.teams[key].players.map((p) => p.id));
  const arrived = now.teams[key].players.filter((p) => !was.has(p.id)).map((p) => {
    const from = before[p.id];
    return { player: p, from: from || null, how: from ? 'moved' : p.rookie ? 'draft' : 'signed' };
  });
  const left = then.teams[key].players.filter((p) => !is.has(p.id)).map((p) => {
    const to = after[p.id];
    const gone = league.byId.get(p.id);
    const retired = gone && gone.status === 'retired' && gone.retired && gone.retired <= season;
    return { player: p, to: to || null, how: to ? 'moved' : retired ? 'retired' : 'released' };
  });
  return { arrived, left };
}

module.exports = { keep, snapshot, seasons, rostersIn, changes };
