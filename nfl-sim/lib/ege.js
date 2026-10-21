/* ==========================================================================
   EGE Football NFL sim — the six, from the website
   Sam, Andrew and Jaykeb (and Paxon, Cooper and Isaac once they are
   drafted) are ordinary players in the league: they start, get targeted,
   get traded for, and the rest of the league reacts to them like anybody
   else. What is different is where their numbers come from. The website
   already rates them -- data/ratings.js, plus whatever they have bought in
   the shop -- so the league reads that every time it loads instead of
   keeping its own copy, and the sim never ages them: their overall moves
   when they train on the site, not on the sim's curves.

   Their site attributes are Madden's, so each sim skill is an average of
   the Madden attributes that make it up, moved so the skills average out to
   their site overall again.
   ========================================================================== */

'use strict';

const io = require('./io');
const { SKILLS, skillsFrom, archetypeOf } = require('./skills');

/* Born in 2001: they were high school juniors in 2018. Nothing on the
   site says otherwise, and the sim needs an age. */
const BORN = 2001;

/* Which site attributes make up each sim skill. */
const FROM_SITE = {
  QB: {
    accuracy: ['throwAccuracyShort', 'throwAccuracyMid'], deep: ['throwAccuracyDeep'],
    arm: ['throwPower'], poise: ['throwUnderPressure', 'awareness', 'breakSack'],
    mobility: ['speed', 'acceleration', 'agility', 'throwOnTheRun']
  },
  RB: {
    power: ['trucking', 'breakTackle', 'strength', 'stiffArm'],
    elusive: ['jukeMove', 'spinMove', 'changeOfDirection', 'agility'],
    speed: ['speed', 'acceleration'], vision: ['bcVision', 'awareness'],
    hands: ['catching', 'routeRunningShort'], block: ['strength', 'awareness']
  },
  WR: {
    deep: ['routeRunningDeep', 'speed'], route: ['routeRunningShort', 'routeRunningMedium', 'release'],
    hands: ['catching', 'catchInTraffic'], yac: ['breakTackle', 'agility', 'changeOfDirection'],
    speed: ['speed', 'acceleration'], size: ['spectacularCatch', 'jumping', 'strength']
  },
  TE: {
    route: ['routeRunningShort', 'routeRunningMedium', 'release'], hands: ['catching', 'catchInTraffic'],
    deep: ['routeRunningDeep', 'speed'], yac: ['breakTackle', 'trucking', 'agility'],
    block: ['runBlock', 'passBlock', 'impactBlocking', 'runBlockPower', 'leadBlock'],
    speed: ['speed', 'acceleration']
  }
};

/* The website's EGE object: loaded from its files on the command line, and
   the page's own on the admin page (lib/io.js). */
function loadSite() { return io.site(); }

function average(values, keys) {
  const found = keys.map((k) => values[k]).filter((v) => typeof v === 'number');
  return found.length ? found.reduce((a, b) => a + b, 0) / found.length : null;
}

/* One of the six as a sim player: overall, skills and durability from the
   site, the archetype his skills give him (unless one was set by hand,
   league.egeArchetypes), the rest left to whoever calls (team, contract). */
function simPlayer(site, player) {
  const values = site.valuesFor(player) || {};
  const ovr = site.overallFor(player);
  const pos = player.position;
  const map = FROM_SITE[pos] || {};
  /* Each skill's distance from his overall, read off the site, then put
     back around the overall the way every other player's skills are. */
  const z = {};
  Object.keys(SKILLS[pos] || {}).forEach((skill) => {
    const raw = average(values, map[skill] || []);
    z[skill] = raw === null ? 0 : (raw - ovr) / 6;
  });
  const skills = skillsFrom(pos, ovr, z);
  return {
    id: 'ege:' + player.slug,
    ege: player.slug,
    name: player.name,
    pos,
    born: BORN + '-09-01',
    height: player.height || null,
    weight: player.weight || null,
    ovr,
    pot: ovr,
    skills,
    archetype: archetypeOf(pos, skills, ovr),
    longevity: 50,
    durability: typeof values.injury === 'number' ? values.injury : 70
  };
}

/* Every one of the six the site has, keyed by slug, with the NFL team the
   site puts him on (or null while he is in college). */
function sixFromSite(season) {
  const site = loadSite();
  const out = {};
  site.players.forEach((player) => {
    const p = simPlayer(site, player);
    const transfers = player.transfers || {};
    const years = Object.keys(transfers).map(Number).filter((y) => y <= season).sort();
    const key = years.length ? transfers[years[years.length - 1]] : null;
    const team = key && site.teams && site.teams[key] && site.teams[key].tier === 'nfl' ? key : null;
    out[player.slug] = { player: p, siteTeam: team };
  });
  return out;
}

module.exports = { sixFromSite, simPlayer, loadSite, BORN };
