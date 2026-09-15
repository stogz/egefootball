/* ==========================================================================
   Loads the site's own data files into Node.
   The bot and the website read exactly the same players, teams, ratings and
   schedules — there is no second copy to keep in step. The data files are
   plain browser scripts, so they run in a sandbox whose global doubles as
   `window`.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_FILES = ['players.js', 'ratings.js', 'schedule.js'];

function loadSiteData() {
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  DATA_FILES.forEach(function (name) {
    const file = path.join(__dirname, '..', 'data', name);
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  });

  if (!sandbox.EGE || !sandbox.EGE.players) {
    throw new Error('site data did not load — check data/*.js');
  }
  return sandbox.EGE;
}

module.exports = { loadSiteData };
