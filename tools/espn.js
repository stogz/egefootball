/* ==========================================================================
   EGE Football — reading ESPN from the tools
   The scripts in tools/ that build a data file out of ESPN share this: a
   batch of addresses fetched many at a time, and kept on disk so a second
   run (or a run that died half way) does not ask for them all again.

   curl rather than fetch, so it goes through whatever proxy the shell has,
   and with --parallel, since a season of box scores is a few thousand
   requests. The cache lives in the system's temp folder, never in the
   repository; delete it to fetch everything fresh.
   ========================================================================== */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const CACHE = path.join(os.tmpdir(), 'ege-espn-cache');
const BATCH = 400;

function cachePath(url) {
  return path.join(CACHE, crypto.createHash('sha1').update(url).digest('hex') + '.json');
}

function read(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; }
}

/* Every address in `urls`, parsed, as a Map from address to JSON (null for
   anything that would not come back). */
function fetchAll(urls, label) {
  fs.mkdirSync(CACHE, { recursive: true });
  const wanted = [...new Set(urls)];
  const missing = wanted.filter(function (url) { return !fs.existsSync(cachePath(url)); });

  for (let at = 0; at < missing.length; at += BATCH) {
    const chunk = missing.slice(at, at + BATCH);
    const config = chunk.map(function (url) {
      return 'url = "' + url + '"\noutput = "' + cachePath(url) + '"';
    }).join('\n');
    const file = path.join(CACHE, 'batch.cfg');
    fs.writeFileSync(file, config);
    try {
      execFileSync('curl', ['-sS', '--fail', '--retry', '3', '--parallel',
        '--parallel-max', '24', '-K', file], { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (e) {
      /* A 404 or two in a batch of hundreds is normal; whatever did not land
         reads as null below. */
    }
    if (label) {
      console.log(label + ': ' + Math.min(at + BATCH, missing.length) + ' of ' +
        missing.length + ' fetched');
    }
  }

  const out = new Map();
  wanted.forEach(function (url) { out.set(url, read(cachePath(url))); });
  return out;
}

function fetchOne(url) {
  return fetchAll([url]).get(url);
}

/* ESPN's whole college team index, as id -> the name it leads with (its
   `location`), which is the name the season files use. */
function teamNames() {
  const body = fetchOne('https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=1000');
  const names = new Map();
  body.sports[0].leagues[0].teams.forEach(function (row) {
    names.set(Number(row.team.id), row.team.location);
  });
  return names;
}

/* The ids at the end of a list of core-API references. */
function refIds(items, pattern) {
  return (items || []).map(function (item) {
    const found = String(item.$ref || '').match(pattern);
    return found ? Number(found[1]) : null;
  }).filter(Boolean);
}

module.exports = { fetchAll, fetchOne, teamNames, refIds };
