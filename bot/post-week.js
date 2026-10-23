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

   From 2023 a week is one message per league -- the NFL's players to the
   NFL bot's channel, the colleges' to the college bot's -- and
   `posted_leagues` says which have gone, so a week where one landed and
   the other did not gets only the missing one.

     node bot/post-week.js                 post anything owed, if it is time
     node bot/post-week.js --force         ignore the clock
     node bot/post-week.js --week 4        post one week, published or not
     node bot/post-week.js --league nfl    only that league's post
     node bot/post-week.js --dry-run       print the payload, post nothing

   Posting windows are 07:00, 12:00, 16:00 and 20:00 America/Chicago. The
   schedule that triggers this runs at the UTC equivalents of both CST and
   CDT, and this script checks the actual Chicago hour before posting, so
   daylight saving never shifts the times.

   Environment:
     SUPABASE_URL               required: which weeks are out lives there,
                                and so do the two webhooks, saved on the
                                admin page (the discord_webhooks table)
     DISCORD_WEBHOOK_URL_COLLEGE
     DISCORD_WEBHOOK_URL_NFL    optional: used for a league whose webhook
                                is not saved in Supabase
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
  const args = { dryRun: false, force: false, week: null, season: null, league: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') { args.dryRun = true; }
    else if (arg === '--force') { args.force = true; }
    else if (arg === '--week') { args.week = Number(argv[i += 1]); }
    else if (arg === '--season') { args.season = Number(argv[i += 1]); }
    else if (arg === '--league') { args.league = String(argv[i += 1] || '').toLowerCase(); }
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
  const rest = (season ? '&season=eq.' + season : '') + '&order=season.asc,week.asc';
  /* A database that has not had schema.sql re-run has no posted_leagues
     yet, and a week there is posted whole or not at all. */
  return supabase('published_weeks?select=season,week,posted_at,posted_leagues' + rest)
    .catch(function () { return supabase('published_weeks?select=season,week,posted_at' + rest); });
}

/* The NFL Sim tab's stored weeks (sim_weeks, js/stored-weeks.js), and the
   six's trades under them (sim_trades). */
function storedWeeks() {
  return supabase('sim_weeks?select=season,week,part,games,scores,saved_at');
}

function storedTrades() {
  return supabase('sim_trades?select=season,slug,week,from_team,to_team,games,saved_at');
}

function markPosted(season, week, leagues, done) {
  const body = { posted_leagues: leagues };
  if (done) { body.posted_at = new Date().toISOString(); }
  const where = 'published_weeks?season=eq.' + season + '&week=eq.' + week;
  const patch = function (values) {
    return supabase(where, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: values });
  };
  return patch(body).catch(function (err) {
    if (!done) { throw err; }
    return patch({ posted_at: body.posted_at });
  });
}

/* The two channels' webhooks, { college, nfl }: the ones saved on the admin
   page, and the environment's for a league that has none saved. */
async function webhooks() {
  const out = {
    college: process.env.DISCORD_WEBHOOK_URL_COLLEGE || null,
    nfl: process.env.DISCORD_WEBHOOK_URL_NFL || null
  };
  try {
    const rows = await supabase('discord_webhooks?select=league,url');
    (rows || []).forEach(function (row) { if (row.url) { out[row.league] = row.url; } });
  } catch (err) {
    console.log('(no saved webhooks: ' + err.message + ')');
  }
  return out;
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

  /* And lay the weeks the NFL sim stored over the season files, as the
     browser does: a week published from the NFL Sim tab may be in no file
     yet. */
  try {
    const trades = await storedTrades().catch(function (err) {
      console.log('(no stored trades: ' + err.message + ')');
      return undefined;
    });
    EGE.storedWeeks.apply(await storedWeeks(), trades);
  } catch (err) {
    console.log('(no stored weeks: ' + err.message + ')');
  }

  const owed = args.week !== null
    ? [{ season: args.season || EGE.currentSeason, week: args.week }]
    : published.filter(function (row) { return !row.posted_at; });

  if (!owed.length) {
    console.log('Every published week has been posted. Nothing to do.');
    return;
  }

  const hooks = args.dryRun ? {} : await webhooks();

  for (const entry of owed) {
    const posts = EGE.discordPost.buildWeekPosts(entry.week, {
      season: entry.season,
      siteUrl: siteUrl,
      /* Anything owed is a week the admin has already put out. */
      played: true
    }).filter(function (post) { return !args.league || post.league === args.league; });

    if (!posts.length) {
      console.log('Week ' + entry.week + ' has no games. Nothing to post.');
      if (args.week === null && !args.league) { await markPosted(entry.season, entry.week, [], true); }
      continue;
    }

    const sent = (entry.posted_leagues || []).slice();
    let missing = 0;
    for (const post of posts) {
      if (args.week === null && sent.indexOf(post.league) !== -1) { continue; }
      const label = entry.season + ' week ' + entry.week + ' (' + post.league + ')';

      if (args.dryRun) {
        console.log(JSON.stringify(post.payload, null, 2));
        console.log('\n[dry run] ' + label + ', ' + post.payload.embeds.length + ' embed(s), nothing sent.');
        continue;
      }
      if (!hooks[post.league]) {
        console.error('No ' + post.league + ' webhook: save it on the admin page, or set DISCORD_WEBHOOK_URL_' +
                      post.league.toUpperCase() + '. Skipping ' + label + '.');
        missing += 1;
        process.exitCode = 1;
        continue;
      }

      await postToDiscord(hooks[post.league], post.payload);
      console.log('Posted ' + label + ', ' + post.payload.embeds.length + ' game(s).');
      sent.push(post.league);
    }

    if (args.week === null && !args.dryRun) {
      const done = !missing && posts.every(function (post) { return sent.indexOf(post.league) !== -1; });
      await markPosted(entry.season, entry.week, sent, done);
    }
  }
}

main().catch(function (err) {
  console.error(err.message || err);
  process.exitCode = 1;
});
