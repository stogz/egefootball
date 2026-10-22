/* ==========================================================================
   EGE Football NFL sim — the league on disk
   The league the sim plays is the 2023 kickoff league (data/league-2023.json)
   until the first time it is saved; after that it is the world folder's
   league.json, which every command reads and writes. The world folder is
   private (team ratings live there): /mnt/project-files/nfl-sim/world in
   the project, or NFL_SIM_WORLD, or --world on the command line. It is
   never committed.

   Every load re-reads the six from the website (lib/ege.js), so a rating
   bought or trained on the site is in the next simulated game.

   On the admin page the world is not a folder but what the page loaded from
   Supabase (lib/io.js); `world` is then only a name.
   ========================================================================== */

'use strict';

const io = require('./io');
const { sixFromSite } = require('./ege');
const { marketPay } = require('./value');
const { centreOn } = require('./schemes');
const { archetypeOf } = require('./skills');
const { fillPicks } = require('./picks');

const PROJECT_WORLD = '/mnt/project-files/nfl-sim/world';

function worldDir(explicit) {
  const fs = require('fs');
  const path = require('path');
  if (explicit) { return path.resolve(explicit); }
  if (process.env.NFL_SIM_WORLD) { return path.resolve(process.env.NFL_SIM_WORLD); }
  if (fs.existsSync('/mnt/project-files')) { return PROJECT_WORLD; }
  return path.join(__dirname, '..', 'world');
}

/* The league as it stands: the saved world, or the 2023 kickoff league.
   `world` is a folder on the command line and a name on the admin page. */
function loadLeague(world) {
  const league = io.has(world, 'league.json') ? io.read(world, 'league.json') : io.data('league-2023.json');
  league.world = world;
  return ready(league);
}

/* What every load does to the league as saved: pay filled in, the picks
   out to 2030 and beyond (lib/picks.js), the six read from the site, the
   lookups built. */
function ready(league) {
  fillPay(league);
  fillPicks(league);
  syncSix(league);
  index(league);
  centreOn(league);
  return league;
}

/* Contracts the data has no money for (about a third, mostly mid-level
   veterans): a little under what the market pays for his overall. */
function fillPay(league) {
  league.players.forEach((p) => {
    if (p.contract && typeof p.contract.apy !== 'number' && p.status !== 'retired') {
      p.contract.apy = Math.round(marketPay(p, league.season) * 0.85 * 10) / 10;
    }
  });
}

/* The league as it is saved, without the folder and the lookups. */
function saved(league) {
  const out = Object.assign({}, league);
  delete out.world;
  delete out.byId;
  delete out.byTeam;
  return out;
}

function saveLeague(league) { io.write(league.world, 'league.json', saved(league)); }

/* Lookups rebuilt after anything moves. */
function index(league) {
  league.byId = new Map();
  league.byTeam = new Map();
  league.teams.forEach((t) => league.byTeam.set(t.key, []));
  league.players.forEach((p) => {
    league.byId.set(p.id, p);
    if (p.status === 'active' && league.byTeam.has(p.team)) { league.byTeam.get(p.team).push(p); }
  });
}

/* The six's overall, skills and durability, from the site as it is now,
   and the archetype those skills give, unless Sam set one by hand
   (lib/edits.js setSixArchetype). */
function syncSix(league) {
  let six;
  try { six = sixFromSite(league.season); } catch (err) { return; }
  league.players.forEach((p) => {
    if (!p.ege || !six[p.ege]) { return; }
    const site = six[p.ege].player;
    p.ovr = site.ovr;
    p.pot = Math.max(site.ovr, p.pot || 0);
    p.skills = site.skills;
    p.durability = site.durability;
    p.archetype = (league.egeArchetypes || {})[p.ege] || archetypeOf(p.pos, p.skills, p.ovr);
  });
}

function teamOf(league, key) { return league.teams.find((t) => t.key === key); }
function rosterOf(league, key) { return league.byTeam.get(key) || []; }
function side(league, key) { return { team: teamOf(league, key), roster: rosterOf(league, key) }; }

module.exports = { loadLeague, saveLeague, saved, ready, index, syncSix, teamOf, rosterOf, side, worldDir };
