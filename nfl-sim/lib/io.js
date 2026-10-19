/* ==========================================================================
   EGE Football NFL sim — where it reads and writes
   Everything the sim keeps goes through here. On the command line that is
   files: nfl-sim/data/ for what never changes (the 2023 kickoff league, the
   draft classes, the schedules), the world folder for the league as it
   stands, and the website's own data files for the six. On the admin page
   the same calls go to whatever the page hands use(): the data bundled into
   js/nfl-sim.js, the world it loaded from Supabase, and the site already in
   the browser.

   A store is { data(name), has(world, name), read(world, name),
   write(world, name, value), site() }. data() and read() hand back a fresh
   copy every time, because the sim changes what it is given.
   ========================================================================== */

'use strict';

let store = null;

/* Files, for the command line. Required here rather than at the top so a
   browser bundle never needs fs. */
function fileStore() {
  const fs = require('fs');
  const path = require('path');
  const DATA = path.join(__dirname, '..', 'data');
  const ROOT = path.join(__dirname, '..', '..');
  let site = null;
  return {
    data(name) { return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8')); },
    has(world, name) { return fs.existsSync(path.join(world, name)); },
    read(world, name) { return JSON.parse(fs.readFileSync(path.join(world, name), 'utf8')); },
    write(world, name, value) {
      fs.mkdirSync(world, { recursive: true });
      const file = path.join(world, name);
      fs.writeFileSync(file + '.tmp', JSON.stringify(value));
      fs.renameSync(file + '.tmp', file);
    },
    /* The website's EGE object, loaded the way tools/ load it: the data,
       every season file, the season helpers and the file writer. */
    site() {
      if (site) { return site; }
      const vm = require('vm');
      const sandbox = { document: {} };
      sandbox.window = sandbox;
      vm.createContext(sandbox);
      const stats = fs.readdirSync(path.join(ROOT, 'stats')).filter((n) => /^\d{4}\.js$/.test(n)).sort()
        .map((n) => 'stats/' + n);
      ['data/players.js', 'data/season.js', 'data/ratings.js', 'data/shop.js', 'data/economy.js',
        'data/statline.js', 'data/brackets.js', 'data/conferences.js', 'data/logos.js', 'data/nfl.js', 'data/nfl-results.js']
        .concat(stats, ['data/games.js', 'js/exports.js'])
        .forEach((rel) => {
          const file = path.join(ROOT, rel);
          if (fs.existsSync(file)) { vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file }); }
        });
      site = sandbox.EGE;
      return site;
    }
  };
}

function get() { return store || (store = fileStore()); }

module.exports = {
  use(custom) { store = custom; },
  data: (name) => get().data(name),
  has: (world, name) => get().has(world, name),
  read: (world, name) => get().read(world, name),
  write: (world, name, value) => get().write(world, name, value),
  site: () => get().site()
};
