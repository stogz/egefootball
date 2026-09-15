#!/usr/bin/env node
/* ==========================================================================
   EGE Football — Discord scores bot

   A backstop, not the main event. The admin publishes a week from the admin
   page and that same click posts it to Discord through the post-week edge
   function. This catches anything that did not go out: the function was not
   deployed, Discord was down, the click half-landed.

   Every run it asks Supabase which weeks are published but not yet posted,
   posts them oldest first, and marks them. A week that already went out is
   never posted twice, because `posted_at` is what it checks, not a file in
   this repository.

     node bot/post-week.js                 post anything owed, if it is time
     node bot/post-week.js --force         ignore the clock
     node bot/post-week.js --week 4        post one week, published or not
     node bot/post-week.js --dry-run       print the payload, post nothing

   Posting windows are 07:00, 12:00, 16:00 and 20:00 America/Chicago. The
   schedule that triggers this runs at the UTC equivalents of both CST and
   CDT, and this script checks the actual Chicago hour before posting, so
   daylight saving never shifts the times.

   Environment:
     DISCORD_WEBHOOK_URL        required unless --dry-run
     SUPABASE_URL               required: which weeks are out lives there
     SUPABASE_SERVICE_ROLE_KEY  required: reading and marking them needs it.
                                A server-side key. It belongs in the repo's
                                Actions secrets and nowhere near the browser.
     SITE_URL                   default http://egefootball.vercel.app
   ========================================================================== */

'use strict';

const { loadSiteData } = require('./site-data');

const POST_HOURS = [7, 12, 16, 20];          /* America/Chicago */
const DEFAULT_SITE = 'http://egefootball.vercel.app';

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

/* --- what is owed --------------------------------------------------------- */

function supabase(pathAndQuery, options) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed to ' +
                    'see which weeks are published.');
  }

  const settings = options || {};
  return fetch(url.replace(/\/+$/, '') + '/rest/v1/' + pathAndQuery, {
    method: settings.method || 'GET',
    headers: Object.assign({
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
    }, settings.headers || {}),
    body: settings.body ? JSON.stringify(settings.body) : undefined
  }).then(function (response) {
    if (!response.ok) {
      return response.text().then(function (text) {
        throw new Error('Supabase replied ' + response.status + ': ' + text.slice(0, 300));
      });
    }
    return response.status === 204 ? null : response.json();
  });
}

/* Every published week, whether it has been posted or not.

   The bot needs all of them, not just the ones it owes: a record through
   week 4 counts the weeks before it, and EGE.isFinal answers no for a week
   the site has not been told about. */
function allPublished(season) {
  return supabase('published_weeks?select=season,week,posted_at' +
                  (season ? '&season=eq.' + season : '') +
                  '&order=season.asc,week.asc');
}

function markPosted(season, week) {
  return supabase('published_weeks?season=eq.' + season + '&week=eq.' + week, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: { posted_at: new Date().toISOString() }
  });
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

  const siteUrl = process.env.SITE_URL || DEFAULT_SITE;

  if (!args.force && args.week === null && !isPostingHour()) {
    console.log('Not a posting hour in Chicago (' + chicagoHour() + ':00). Nothing to do.');
    return;
  }

  /* --week posts one, whatever Supabase thinks, which is how a week is put
     into a test channel without publishing it. It still asks for the rest, so
     the records in the footers are right, and carries on without them if
     Supabase is not configured. */
  let published = [];
  try {
    published = await allPublished(args.season);
  } catch (err) {
    if (args.week === null) { throw err; }
    console.log('(no Supabase: ' + err.message + ')');
  }

  /* Tell the site data which weeks are out, the same way the browser does. */
  EGE.publishedWeeks = {};
  published.forEach(function (row) {
    const weeks = EGE.publishedWeeks[row.season] || (EGE.publishedWeeks[row.season] = []);
    weeks.push(row.week);
  });

  const owed = args.week !== null
    ? [{ season: args.season || EGE.currentSeason, week: args.week }]
    : published.filter(function (row) { return !row.posted_at; });

  if (!owed.length) {
    console.log('Every published week has been posted. Nothing to do.');
    return;
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl && !args.dryRun) {
    console.error('DISCORD_WEBHOOK_URL is not set. Use --dry-run to build the post without sending it.');
    process.exitCode = 1;
    return;
  }

  for (const entry of owed) {
    const payload = EGE.discordPost.buildWeekPost(entry.week, {
      season: entry.season,
      siteUrl: siteUrl,
      /* Anything owed is a week the admin has already put out. */
      played: true
    });

    if (!payload) {
      console.log('Week ' + entry.week + ' has no games. Nothing to post.');
      if (args.week === null) { await markPosted(entry.season, entry.week); }
      continue;
    }

    if (args.dryRun) {
      console.log(JSON.stringify(payload, null, 2));
      console.log('\n[dry run] ' + entry.season + ' week ' + entry.week + ', ' +
                  payload.embeds.length + ' embed(s), nothing sent.');
      continue;
    }

    await postToDiscord(webhookUrl, payload);
    console.log('Posted ' + entry.season + ' week ' + entry.week +
                ' (' + payload.embeds.length + ' game(s)).');

    if (args.week === null) { await markPosted(entry.season, entry.week); }
  }
}

main().catch(function (err) {
  console.error(err.message || err);
  process.exitCode = 1;
});
