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
  let state;
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (err) {
    state = { season: null };
  }

  /* A week gets posted twice now — the fixtures before it is played and the
     results once they are published — so the two are tracked separately.
     State written before that change only knew one number; everything up to
     it counts as previewed. */
  if (!Array.isArray(state.previewed)) {
    const upTo = Number(state.lastPostedWeek) || 0;
    state.previewed = [];
    for (let week = 1; week <= upTo; week += 1) { state.previewed.push(week); }
  }
  if (!Array.isArray(state.published)) { state.published = []; }

  return state;
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

function done(list, week) { return list.indexOf(week) !== -1; }

function hasGames(EGE, week, season) {
  return Boolean(buildWeekPost(EGE, week, { season: season, siteUrl: DEFAULT_SITE }));
}

/* Whether a week has results in data/results.js yet. */
function isPlayed(EGE, week, season) {
  return EGE.players.some(function (player) {
    const game = EGE.gameInWeek(player, week, season);
    return game && EGE.isFinal(game);
  });
}

/* What to post next, if anything.

   Results come first: a week that has just been published is the news, and
   waiting on the fixtures for a later week would bury it. Failing that, the
   next week nobody has seen the fixtures for.

   A week that was played before its fixtures ever went out — a season caught
   up on in one go — is posted once, as results. */
function nextPost(EGE, state, season) {
  const last = EGE.lastWeek(season);

  for (let week = 1; week <= last; week += 1) {
    if (!hasGames(EGE, week, season)) { continue; }
    if (isPlayed(EGE, week, season) && !done(state.published, week)) {
      return { week: week, kind: 'results' };
    }
  }

  for (let week = 1; week <= last; week += 1) {
    if (!hasGames(EGE, week, season)) { continue; }
    if (done(state.previewed, week) || isPlayed(EGE, week, season)) { continue; }
    return { week: week, kind: 'preview' };
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
    state.previewed = [];
    state.published = [];
  }

  if (!args.force && args.week === null && !isPostingHour()) {
    console.log('Not a posting hour in Chicago (' + chicagoHour() + ':00). Nothing to do.');
    return;
  }

  const next = args.week !== null
    ? { week: args.week, kind: isPlayed(EGE, args.week, season) ? 'results' : 'preview' }
    : nextPost(EGE, state, season);

  if (next === null) {
    console.log('The ' + season + ' regular season has been posted in full.');
    return;
  }

  const week = next.week;
  const payload = buildWeekPost(EGE, week, {
    season: season, siteUrl: siteUrl, kind: next.kind
  });
  if (!payload) {
    console.log('Week ' + week + ' has no games. Nothing to post.');
    return;
  }

  if (args.dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n[dry run] week ' + week + ' (' + next.kind + '), ' +
                payload.embeds.length + ' embed(s), nothing sent.');
    return;
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set. Use --dry-run to build the post without sending it.');
    process.exitCode = 1;
    return;
  }

  await postToDiscord(webhookUrl, payload);
  console.log('Posted week ' + week + ' ' + next.kind + ' (' +
              payload.embeds.length + ' game(s)).');

  if (args.week === null) {
    const list = next.kind === 'results' ? state.published : state.previewed;
    if (!done(list, week)) { list.push(week); }
    state.lastPostedAt = new Date().toISOString();
    writeState(state);
  }
}

main().catch(function (err) {
  console.error(err.message);
  process.exitCode = 1;
});
