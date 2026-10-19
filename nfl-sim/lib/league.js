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
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { sixFromSite } = require('./ege');
const { marketPay } = require('./value');
const { centreOn } = require('./schemes');

const DATA = path.join(__dirname, '..', 'data');
const PROJECT_WORLD = '/mnt/project-files/nfl-sim/world';

function worldDir(explicit) {
  if (explicit) { return path.resolve(explicit); }
  if (process.env.NFL_SIM_WORLD) { return path.resolve(process.env.NFL_SIM_WORLD); }
  if (fs.existsSync('/mnt/project-files')) { return PROJECT_WORLD; }
  return path.join(__dirname, '..', 'world');
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

/* The league as it stands: the saved world, or the 2023 kickoff league. */
function loadLeague(dir) {
  const world = worldDir(dir);
  const saved = path.join(world, 'league.json');
  const league = fs.existsSync(saved) ? readJson(saved) : readJson(path.join(DATA, 'league-2023.json'));
  league.world = world;
  fillPay(league);
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

function saveLeague(league) {
  fs.mkdirSync(league.world, { recursive: true });
  const out = Object.assign({}, league);
  delete out.world;
  delete out.byId;
  delete out.byTeam;
  const file = path.join(league.world, 'league.json');
  fs.writeFileSync(file + '.tmp', JSON.stringify(out));
  fs.renameSync(file + '.tmp', file);
}

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

/* The six's overall, skills and durability, from the site as it is now. */
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
  });
}

function teamOf(league, key) { return league.teams.find((t) => t.key === key); }
function rosterOf(league, key) { return league.byTeam.get(key) || []; }
function side(league, key) { return { team: teamOf(league, key), roster: rosterOf(league, key) }; }

module.exports = { loadLeague, saveLeague, index, syncSix, teamOf, rosterOf, side, worldDir, readJson, DATA };
