/* ==========================================================================
   EGE Football — a new season's fixtures
   Writes stats/{year}.js for a college season that has not been played yet:
   every regular-season game each of the six's schools really played that
   year, from ESPN, with the result, booster and stat line left empty for
   the season editor to fill in a week at a time.

     node tools/build-season.js 2021

   It will not write over a season file that is already there -- that file
   is where the results live -- unless told to with --force.

   What it fills in, per game: the week (see tools/calendar.js -- week 0 is
   the Saturday before Labor Day weekend), the date and kickoff where the
   school plays (null for a kickoff ESPN never set), home and away, a
   neutral site, and whether it is a conference game, which is read off the
   conference the school is in in data/conferences.js. Conference title
   games are left out: who plays in one is decided by the season, and the
   postseason goes in once the regular season has been played, the way
   2020's did. A game ESPN lists as postponed or cancelled is left out too.

   Nothing is marked for scouts. Which games scouts attend is the admin's
   call; add `scouts: true` to them by hand.

   The file is written through js/exports.js, the same code the season
   editor saves with, so it comes out exactly as the editor would write it.
   Then add the year to SEASONS in js/site-data.js. The site shows a season
   from the day its file is in for the admin to edit, and to everyone else
   once it is rolled over to.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { fetchAll } = require('./espn');
const { weekOf, localParts } = require('./calendar');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

/* The site's data, with the season writer, in one sandbox. */
function load() {
  const sandbox = { document: {} };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const stats = fs.readdirSync(path.join(ROOT, 'stats'))
    .filter((name) => /^\d{4}\.js$/.test(name)).sort().map((name) => 'stats/' + name);
  ['data/players.js', 'data/season.js', 'data/ratings.js', 'data/shop.js', 'data/economy.js',
   'data/statline.js', 'data/brackets.js', 'data/conferences.js', 'data/logos.js']
    .concat(stats, ['data/games.js', 'js/exports.js'])
    .forEach(function (rel) {
      const file = path.join(ROOT, rel);
      vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
    });
  return sandbox.EGE;
}

/* The schools in a school's conference: from the season's races if they
   are in, otherwise the latest season before it. */
function conferenceMates(EGE, school, season) {
  const years = Object.keys(EGE.conferences || {}).map(Number)
    .filter((y) => y <= season).sort((a, b) => b - a);
  for (const year of years) {
    const found = EGE.conferenceOf(school, year);
    if (found) {
      return new Set([].concat(...Object.values(found.conference.divisions)));
    }
  }
  return new Set();
}

function fixtures(EGE, player, season) {
  const team = EGE.teamFor(player, season);
  if (!team) { return []; }
  const id = EGE.espnIds[team.school];
  if (!id) { throw new Error('No ESPN id for ' + team.school); }

  const url = SITE + '/teams/' + id + '/schedule?season=' + season + '&seasontype=2';
  const body = fetchAll([url]).get(url);
  if (!body || !body.events) { throw new Error('No ' + season + ' schedule for ' + team.school); }
  const mates = conferenceMates(EGE, team.school, season);

  /* A game ESPN still lists as postponed or cancelled never happened on that
     date -- USC's trip to California moved from November 13 to December 4
     and is on the schedule both times. */
  return body.events.filter(function (event) {
    const game = event.competitions[0];
    const notes = ((game.notes || [])[0] || {}).headline || '';
    const status = ((game.status || {}).type || {}).name || '';
    return !/championship/i.test(notes) && !/POSTPONED|CANCELED|CANCELLED/.test(status);
  }).map(function (event) {
    const game = event.competitions[0];
    const us = game.competitors.filter((c) => Number(c.team.id) === Number(id))[0];
    const them = game.competitors.filter((c) => c !== us)[0];
    const when = localParts(game.date, team.zone);
    const opponent = them.team.location;
    const row = {
      week: weekOf(when.date, season),
      date: when.date,
      kickoff: game.timeValid === false ? null : when.kickoff,
      opponent: opponent,
      home: !game.neutralSite && us.homeAway === 'home',
      conference: mates.has(opponent),
      result: null,
      booster: null,
      stats: null
    };
    if (game.neutralSite) { row.neutral = true; }
    return row;
  }).sort((a, b) => a.week - b.week);
}

function main() {
  const season = Number(process.argv[2]);
  const force = process.argv.indexOf('--force') !== -1;
  if (!season) { throw new Error('Which season? node tools/build-season.js 2021'); }
  const out = path.join(ROOT, 'stats', season + '.js');
  if (fs.existsSync(out) && !force) {
    throw new Error('stats/' + season + '.js is already there, results and all. ' +
                    'Pass --force to write over it.');
  }

  const EGE = load();
  if (EGE.tierFor(season) !== 'college') { throw new Error(season + ' is not a college season.'); }

  EGE.stats[season] = { season: season, level: 'College football', playoffs: {}, games: {} };
  EGE.players.forEach(function (player) {
    EGE.stats[season].games[player.slug] = fixtures(EGE, player, season);
    const games = EGE.stats[season].games[player.slug];
    console.log(player.name + ': ' + games.length + ' games, ' +
      games.filter((g) => g.conference).length + ' in conference, weeks ' +
      games[0].week + '-' + games[games.length - 1].week);
  });

  EGE.exports.seasonFile(season, {}).then(function (text) {
    fs.writeFileSync(out, text);
    console.log('written to stats/' + season + '.js');
  });
}

main();
