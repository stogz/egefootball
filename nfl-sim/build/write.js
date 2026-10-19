/* ==========================================================================
   EGE Football NFL sim — writing the data files
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'data');

/* JSON with every row of a list on its own line, so a rebuild's diff
   shows which players moved rather than one changed line a megabyte long. */
function writeJson(name, value) {
  fs.writeFileSync(path.join(OUT, name), rows(value, '') + '\n');
  process.stderr.write('Wrote nfl-sim/data/' + name + '\n');
}

function rows(value, indent) {
  if (Array.isArray(value)) {
    if (!value.length || typeof value[0] !== 'object') { return JSON.stringify(value); }
    return '[\n' + value.map((v) => indent + '  ' + JSON.stringify(v)).join(',\n') + '\n' + indent + ']';
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined);
    return '{\n' + keys.map((k) => indent + '  ' + JSON.stringify(k) + ': ' + rows(value[k], indent + '  ')).join(',\n') +
      '\n' + indent + '}';
  }
  return JSON.stringify(value);
}

module.exports = { writeJson, rows };
