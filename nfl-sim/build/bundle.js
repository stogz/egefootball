#!/usr/bin/env node
/* ==========================================================================
   EGE Football NFL sim — the admin page's copy
   Writes js/nfl-sim.js: every module in lib/ and the data they read (the
   2023 kickoff league, the draft classes, the schedules and the draft
   orders set by hand) in one file the admin page loads when its NFL Sim
   tab is opened. Nothing private goes in: no world, no team ratings --
   those are worked out on the page and kept in Supabase where only an
   admin can read them.

   Run it again after changing anything in lib/ or data/:
     node nfl-sim/build/bundle.js
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '..', 'js', 'nfl-sim.js');
const DATA = ['league-2023.json', 'prospects.json', 'schedules.json', 'draft-orders.json'];

const modules = fs.readdirSync(path.join(ROOT, 'lib')).filter((n) => /\.js$/.test(n)).sort();
const parts = [];

parts.push('/* ==========================================================================');
parts.push('   EGE Football — the NFL sim, for the admin page');
parts.push('   Built by nfl-sim/build/bundle.js from nfl-sim/lib and nfl-sim/data. Do not');
parts.push('   edit it here: change those and run node nfl-sim/build/bundle.js again.');
parts.push('   Loaded only when an admin opens the NFL Sim tab.');
parts.push('   ========================================================================== */');
parts.push('');
parts.push('(function () {');
parts.push('  \'use strict\';');
parts.push('');
parts.push('  var sources = {};');
modules.forEach((name) => {
  const code = fs.readFileSync(path.join(ROOT, 'lib', name), 'utf8');
  parts.push('');
  parts.push('  sources[' + JSON.stringify(name.replace(/\.js$/, '')) + '] = function (module, exports, require, __dirname) {');
  parts.push(code);
  parts.push('  };');
});
parts.push('');
parts.push('  var data = {};');
DATA.forEach((name) => {
  const text = JSON.stringify(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', name), 'utf8')));
  parts.push('  data[' + JSON.stringify(name) + '] = ' + JSON.stringify(text) + ';');
});
parts.push(`
  var cache = {};
  function load(name) {
    var key = String(name).replace(/^\\.\\//, '').replace(/\\.js$/, '');
    if (cache[key]) { return cache[key].exports; }
    if (!sources[key]) { throw new Error('The NFL sim has no ' + name + ' in the browser.'); }
    var module = cache[key] = { exports: {} };
    sources[key].call(module.exports, module, module.exports, load, '');
    return module.exports;
  }

  /* A world kept in memory: files is { name: JSON text }, filled from
     Supabase and saved back by the page. dirty collects what changed (a
     file removed is dirty and gone). live is the Supabase rows the six's
     boosters and connections come from (lib/boosts.js). */
  function memoryStore(files, dirty, site, live) {
    return {
      data: function (name) {
        if (!data[name]) { throw new Error('No ' + name + ' in the NFL sim.'); }
        return JSON.parse(data[name]);
      },
      has: function (world, name) { return Object.prototype.hasOwnProperty.call(files, name); },
      read: function (world, name) { return JSON.parse(files[name]); },
      write: function (world, name, value) { files[name] = JSON.stringify(value); dirty[name] = true; },
      remove: function (world, name) { delete files[name]; dirty[name] = true; },
      site: function () { return site; },
      live: function () { return live || {}; }
    };
  }

  window.EGE = window.EGE || {};
  window.EGE.nflSim = {
    /* Points the sim at a world held in memory, and the site at the page. */
    use: function (files, dirty, site, live) { load('io').use(memoryStore(files, dirty, site || window.EGE, live)); },
    run: load('run'),
    site: load('site'),
    season: load('season'),
    standings: load('standings'),
    teams: load('teams'),
    trades: load('trades'),
    draftPlan: load('draft-plan'),
    edits: load('edits'),
    rewind: load('rewind'),
    history: load('history'),
    fit: load('fit'),
    tradeFinder: load('trade-finder'),
    tendencies: load('tendencies'),
    weeks: load('weeks')
  };
})();
`);

fs.writeFileSync(OUT, parts.join('\n'));
process.stderr.write('Wrote js/nfl-sim.js (' + Math.round(fs.statSync(OUT).size / 1024) + ' KB)\n');
