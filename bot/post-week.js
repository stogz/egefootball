#!/usr/bin/env node
/* ==========================================================================
   EGE Football — Discord scores bot

   Posts one week of the regular season per run, in order, to a Discord
   webhook. Four runs a day walk the season out slowly.

   Posting windows are 07:00, 12:00, 16:00 and 20:00 America/Chicago. The
   schedule that triggers this runs at the UTC equivalents of both CST and
   CDT, and this script checks the actual Chicago hour before posting, so
   daylight saving never shifts the times.

     node bot/post-week.js                 post the next week, if it is time
     node bot/post-week.js --force         ignore the clock
     node bot/post-week.js --week 4        post a specific week
     node bot/post-week.js --dry-run       print the payload, post nothing

   Environment:
     DISCORD_WEBHOOK_URL   required unless --dry-run
     SITE_URL              default https://egefootball.vercel.app
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const { loadSiteData } = require('./site-data');
const { buildWeekPost } = require('./build-post');

const STATE_FILE = path.join(__dirname, 'state.json');
const POST_HOURS = [7, 12, 16, 20];          /* America/Chicago */
const DEFAULT_SITE = 'https://egefootball.vercel.app';

/* --- arguments ------------------------------------------------------------ */

function parseArgs(argv) {
  const args = { dryRun: false, force: false, week: null, season: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') { args.dryRun = true; }
    else if (arg === '--force') { args.force = true; }
    else if (arg === '--week') { args.week = Number(argv[i += 1]); }
    else if (arg === '--season') { args.season = Number(argv[i += 1]); }
  }
  return args;
}

/* --- the clock ------------------------------------------------------------ */

function chicagoHour(now) {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', hour: 'numeric', hour12: false
  }).format(now || new Date());
  return Number(hour) % 24;
}

function isPostingHour(now) {
  return POST_HOURS.indexOf(chicagoHour(now)) !== -1;
}

/* --- where we are in the season ------------------------------------------- */

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (err) {
    return { season: null, lastPostedWeek: 0, lastPostedAt: null };
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

/* The next week that actually has games. Weeks where nobody played — every
   player on a bye — are stepped over rather than posted empty. */
function nextWeekWithGames(EGE, after, season) {
  const last = EGE.lastWeek(season);
  for (let week = after + 1; week <= last; week += 1) {
    if (buildWeekPost(EGE, week, { season: season, siteUrl: DEFAULT_SITE })) { return week; }
  }
  return null;
}

/* --- posting -------------------------------------------------------------- */

async function postToDiscord(webhookUrl, payload) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error('Discord replied ' + response.status + ': ' + body.slice(0, 400));
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const EGE = loadSiteData();

  const season = args.season || EGE.currentSeason;
  const siteUrl = process.env.SITE_URL || DEFAULT_SITE;
  const state = readState();

  if (state.season !== season) {
    state.season = season;
    state.lastPostedWeek = 0;
  }

  if (!args.force && args.week === null && !isPostingHour()) {
    console.log('Not a posting hour in Chicago (' + chicagoHour() + ':00). Nothing to do.');
    return;
  }

  const week = args.week !== null ? args.week : nextWeekWithGames(EGE, state.lastPostedWeek, season);

  if (week === null) {
    console.log('The ' + season + ' regular season has been posted in full.');
    return;
  }

  const payload = buildWeekPost(EGE, week, { season: season, siteUrl: siteUrl });
  if (!payload) {
    console.log('Week ' + week + ' has no games. Nothing to post.');
    return;
  }

  if (args.dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n[dry run] week ' + week + ', ' + payload.embeds.length + ' embed(s), nothing sent.');
    return;
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set. Use --dry-run to build the post without sending it.');
    process.exitCode = 1;
    return;
  }

  await postToDiscord(webhookUrl, payload);
  console.log('Posted week ' + week + ' (' + payload.embeds.length + ' game(s)).');

  if (args.week === null) {
    state.lastPostedWeek = week;
    state.lastPostedAt = new Date().toISOString();
    writeState(state);
  }
}

main().catch(function (err) {
  console.error(err.message);
  process.exitCode = 1;
});
