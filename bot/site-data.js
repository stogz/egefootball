/* ==========================================================================
   Loads the site's own data files into Node.
   The bot and the website read exactly the same players, ratings, seasons
   and stat lines — there is no second copy to keep in step. The data files
   are plain browser scripts, so they run in a sandbox whose global doubles
   as `window`.

   Every season in stats/ is loaded, whatever it is called, so a new season
   needs no change here.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* Before the seasons: everything they lean on. */
const BEFORE = [
  'data/players.js',
  'data/season.js',
  'data/ratings.js',
  'data/shop.js',
  'data/economy.js',
  'data/statline.js'
];

/* After them: the accessors that read across seasons, and the post builder. */
const AFTER = [
  'data/games.js',
  'js/discord-post.js'
];

function seasonFiles() {
  const dir = path.join(ROOT, 'stats');
  if (!fs.existsSync(dir)) { return []; }
  return fs.readdirSync(dir)
    .filter(function (name) { return /^\d{4}\.js$/.test(name); })
    .sort()
    .map(function (name) { return path.join('stats', name); });
}

function loadSiteData() {
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  BEFORE.concat(seasonFiles(), AFTER).forEach(function (rel) {
    const file = path.join(ROOT, rel);
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  });

  if (!sandbox.EGE || !sandbox.EGE.players) {
    throw new Error('site data did not load — check data/*.js and stats/*.js');
  }
  return sandbox.EGE;
}

module.exports = { loadSiteData, seasonFiles };
