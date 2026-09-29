/* ==========================================================================
   EGE Football — the ESPN logo list
   Writes data/logos.js: every college team ESPN carries, against the number
   its logo is filed under, so a schedule can put a mark beside any
   opponent without a picture ever being saved into the site.

     node tools/build-logos.js

   The list comes from ESPN's public team index (every division, about 760
   schools) and is keyed by the name ESPN leads with -- 'Ohio State', 'Ole
   Miss', 'UConn' -- which is the name the season files already use. The
   few places the site spells a school some other way are in ALIASES.
   Run it again if ESPN adds a school the site needs.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SOURCE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=1000';
const OUT = path.join(__dirname, '..', 'data', 'logos.js');

/* Other spellings, to ESPN's. The offer stickers' names are here too, so
   anything on the site that names a college can find its mark. */
const ALIASES = {
  'Hawaii': "Hawai'i",
  'San Jose State': 'San José State',
  'Appalachian State': 'App State',
  'FIU': 'Florida International',
  'Florida Intl': 'Florida International',
  'Miami (FL)': 'Miami',
  'Cal': 'California',
  'Indy State': 'Indiana State',
  'Southeast Missouri': 'Southeast Missouri State',
  'SEMO': 'Southeast Missouri State',
  'NC Central': 'North Carolina Central',
  'UMass': 'Massachusetts',
  'Pitt': 'Pittsburgh'
};

function main() {
  /* curl rather than fetch, so it goes through whatever proxy the shell has. */
  const body = execFileSync('curl', ['-sSf', SOURCE], { maxBuffer: 32 * 1024 * 1024 }).toString();
  const teams = JSON.parse(body).sports[0].leagues[0].teams.map((row) => row.team);

  /* Two schools share a name now and then -- Charlotte, Troy -- and the lower
     number is the long-standing Division I programme. */
  const ids = new Map();
  teams.sort((a, b) => Number(a.id) - Number(b.id)).forEach(function (team) {
    if (!ids.has(team.location)) { ids.set(team.location, Number(team.id)); }
  });

  Object.keys(ALIASES).forEach(function (alias) {
    const id = ids.get(ALIASES[alias]);
    if (!id) { console.warn('alias ' + alias + ' -> ' + ALIASES[alias] + ' is not in ESPN\'s list'); return; }
    if (!ids.has(alias)) { ids.set(alias, id); }
  });

  const names = [...ids.keys()].sort((a, b) => a.localeCompare(b));
  const out = [];
  out.push('/* ==========================================================================');
  out.push('   EGE Football — opponents\' marks');
  out.push('   Written by tools/build-logos.js from ESPN\'s team index; run that again');
  out.push('   rather than editing this by hand.');
  out.push('');
  out.push('   Every college team ESPN carries, against the number ESPN files its logo');
  out.push('   under. The picture is never saved into the site: the page asks ESPN\'s');
  out.push('   image server for it, at the size it needs. Bowling Green, for one:');
  out.push('');
  out.push('     https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/189.png&h=40&w=40');
  out.push('');
  out.push('   Keyed by the name exactly as the season files write an opponent -- \'Ole');
  out.push('   Miss\', \'California\', \'UConn\' -- so a new fixture against any of these');
  out.push('   has its mark with nothing else to do. A school that is not here (every');
  out.push('   high school) is drawn with its name alone.');
  out.push('   ========================================================================== */');
  out.push('');
  out.push('window.EGE = window.EGE || {};');
  out.push('');
  out.push('EGE.espnIds = {');
  names.forEach(function (name, i) {
    const quoted = "'" + name.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    out.push('  ' + quoted + ': ' + ids.get(name) + (i < names.length - 1 ? ',' : ''));
  });
  out.push('};');
  out.push('');
  out.push('/* The picture for a school, or null for one ESPN does not have. `size` is');
  out.push('   the pixels on a side to ask for; the schedule draws its marks at 20, so');
  out.push('   it asks for twice that for a sharp picture on a high-density screen. */');
  out.push('EGE.logoFor = function (name, size) {');
  out.push('  var id = EGE.espnIds[name];');
  out.push('  if (!id) { return null; }');
  out.push('  var px = size || 40;');
  out.push("  return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/' + id +");
  out.push("    '.png&h=' + px + '&w=' + px;");
  out.push('};');
  out.push('');
  fs.writeFileSync(OUT, out.join('\n'));
  console.log(names.length + ' names written to data/logos.js');
}

main();
