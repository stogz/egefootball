/* ==========================================================================
   EGE Football NFL sim — reading nflverse
   The league is built out of nflverse's public data: rosters, snap counts,
   season stats, Next Gen Stats, Pro Football Reference's advanced stats,
   contracts, the draft and the combine, and the 2023 play-by-play the team
   schemes are read off. All of it is CSV on GitHub, which is reachable from
   the cloud when ESPN and the stats sites are not.

   Files are kept on disk after the first download, in the system's temp
   folder (or NFL_SIM_CACHE), never in the repository; delete the folder to
   fetch everything fresh.
   ========================================================================== */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const CACHE = process.env.NFL_SIM_CACHE || path.join(os.tmpdir(), 'ege-nflverse-cache');
const RELEASES = 'https://github.com/nflverse/nflverse-data/releases/download/';
const NFLDATA = 'https://raw.githubusercontent.com/nflverse/nfldata/master/data/';

/* Where each file lives. Release assets are `tag/file`. */
function urlFor(name) {
  if (name === 'games.csv') { return NFLDATA + name; }
  const tags = [
    [/^roster_weekly_/, 'weekly_rosters'], [/^roster_/, 'rosters'],
    [/^depth_charts_/, 'depth_charts'], [/^snap_counts_/, 'snap_counts'],
    [/^stats_player_/, 'stats_player'], [/^player_stats_/, 'player_stats'],
    [/^ngs_/, 'nextgen_stats'], [/^advstats_/, 'pfr_advstats'],
    [/^draft_picks/, 'draft_picks'], [/^combine/, 'combine'],
    [/^historical_contracts/, 'contracts'], [/^players\.csv/, 'players'],
    [/^pbp_participation_/, 'pbp_participation'], [/^ftn_charting_/, 'ftn_charting'],
    [/^play_by_play_/, 'pbp']
  ];
  const tag = tags.filter((t) => t[0].test(name))[0];
  if (!tag) { throw new Error('No nflverse release is known for ' + name); }
  return RELEASES + tag[1] + '/' + name;
}

/* The file on disk, downloaded first if it is not there yet. curl rather
   than fetch, so it goes through whatever proxy the shell has. */
function download(name) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, name);
  if (fs.existsSync(file) && fs.statSync(file).size > 0) { return file; }
  process.stderr.write('Downloading ' + name + '\n');
  execFileSync('curl', ['-sS', '-L', '--fail', '--max-time', '600', '-o', file, urlFor(name)]);
  return file;
}

/* One CSV, as an array of row objects keyed by the header. Quoted fields
   (with commas, doubled quotes or line breaks inside) are handled; values
   stay strings, and an empty field is ''. With `columns`, only those keys
   are kept, which is what lets the play-by-play (370 columns) fit in
   memory. */
function parse(text, columns) {
  const out = [];
  let header = null;
  let keys = null;
  let row = [];
  let field = '';
  let quoted = false;

  const finish = () => {
    row.push(field); field = '';
    if (!header) {
      header = row;
      keys = header.map((key, at) => [key, at]).filter((k) => !columns || columns.indexOf(k[0]) !== -1);
    } else if (row.length > 1 || row[0] !== '') {
      const obj = {};
      for (let k = 0; k < keys.length; k += 1) {
        const value = row[keys[k][1]];
        obj[keys[k][0]] = value === undefined ? '' : value;
      }
      out.push(obj);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
      } else { field += c; }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') { i += 1; }
      finish();
    } else { field += c; }
  }
  if (field !== '' || row.length) { finish(); }
  return out;
}

/* A file's rows, read through a filter so the big ones (the play-by-play is
   a few hundred thousand rows) do not all stay in memory. */
function read(name, keep, columns) {
  const file = download(name);
  let text = fs.readFileSync(file);
  if (/\.gz$/.test(name)) { text = zlib.gunzipSync(text); }
  const rows = parse(text.toString('utf8'), columns);
  return keep ? rows.filter(keep) : rows;
}

/* A number out of a CSV field, or null for an empty or NA one. */
function num(value) {
  if (value === undefined || value === null || value === '' || value === 'NA') { return null; }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

module.exports = { read, num, download, CACHE };
