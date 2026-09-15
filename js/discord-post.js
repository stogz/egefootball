/* ==========================================================================
   EGE Football — the Discord post
   One week, as a Discord message. Loaded by the browser so the admin's
   publish button can build it, and by the bot so a scheduled run builds
   exactly the same thing — there is no second opinion about what a week
   looks like in the channel.

   ## Week {n} — Results
   {an embed per player with a game that week}
   {a link back to the site}

   A game that has been played shows the result, the final score and the
   player's stat line. A game that has not shows the matchup and the kickoff.
   A player on a bye, one with no game that week, and one with no schedule at
   all are simply left out.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.discordPost = (function () {
  'use strict';

  var SITE = 'http://egefootball.vercel.app';

  var COLOR_WIN      = 0x41713c;   /* the site's grass green */
  var COLOR_LOSS     = 0xa64412;   /* the site's deep accent */
  var COLOR_UPCOMING = 0xf0b82a;   /* the site's gold, for a game not yet played */

  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* Dates are plain calendar days, so read them as such rather than letting
     the runtime's time zone move them. */
  function kickoffLabel(game) {
    var parts = String(game.date).split('-').map(Number);
    var when = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    var day = WEEKDAYS[when.getUTCDay()] + ' ' + MONTHS[when.getUTCMonth()] + ' ' + when.getUTCDate();
    return game.kickoff ? day + ', ' + game.kickoff : day;
  }

  /* Absolute URLs — Discord will not load anything relative. */
  function asset(siteUrl, path) {
    return siteUrl.replace(/\/+$/, '') + '/' + String(path).replace(/^\/+/, '');
  }

  function playerUrl(siteUrl, player) {
    return siteUrl.replace(/\/+$/, '') + '/#' + player.slug;
  }

  /* Opponents are mostly schools we hold nothing for, but a few of them are
     each other — Bloomington and Normal Community share a league — so look
     the name up and use the mark when there is one. */
  function opponentTeam(name) {
    var wanted = String(name).toLowerCase();
    var key = Object.keys(EGE.teams).filter(function (id) {
      var school = EGE.teams[id].school.toLowerCase();
      return school === wanted || school.indexOf(wanted + ' ') === 0;
    })[0];
    return key ? EGE.teams[key] : null;
  }

  /* The headline, in the three columns Discord gives us. */
  function summaryFields(player, stats) {
    var fields = [];
    var add = function (name, value) {
      fields.push({ name: name, value: String(value), inline: true });
    };

    if (player.position === 'QB') {
      add('Passing', stats.completions + '/' + stats.attempts + ', ' + stats.passingYards + ' yds');
      add('TD / INT', stats.passingTd + ' / ' + stats.interceptions);
      add('Rating', stats.rating === null ? '—' : stats.rating);
      return fields;
    }

    if (player.position === 'RB') {
      add('Rushing', stats.carries + ' car, ' + stats.rushingYards + ' yds');
      add('Receiving', stats.receptions + ' rec, ' + stats.receivingYards + ' yds');
      add('Touchdowns', stats.totalTd);
      return fields;
    }

    add('Receiving', stats.receptions + '/' + stats.targets + ', ' + stats.receivingYards + ' yds');
    add('Yards After Catch', stats.receivingYac);
    add('Touchdowns', stats.totalTd);
    return fields;
  }

  /* The full line underneath, as a code block so the columns stay lined up in
     Discord's proportional font. */
  function fullLine(player, stats) {
    var heads = [];
    var values = [];

    EGE.statline.lineFor(player.position).forEach(function (column) {
      var value = column.text(stats);
      var width = Math.max(column.label.length, value.length);
      heads.push(pad(column.label, width));
      values.push(pad(value, width));
    });

    return '```\n' + heads.join(' ') + '\n' + values.join(' ') + '\n```';
  }

  /* padStart, written out: the bot runs on whatever Node the runner has and
     the browser is whatever the players open it in. */
  function pad(text, width) {
    var out = String(text);
    while (out.length < width) { out = ' ' + out; }
    return out;
  }

  /* Record through the given week, so the embed says where the season stands.
     Nothing rather than a meaningless 0-0 before anything has been played. */
  function recordThrough(player, week, season) {
    var wins = 0;
    var losses = 0;
    var counted = 0;

    EGE.gamesPlayed(player, season).forEach(function (game) {
      if (game.week > week) { return; }
      counted += 1;
      if (game.result.teamScore > game.result.opponentScore) { wins += 1; } else { losses += 1; }
    });
    return counted ? wins + '-' + losses : null;
  }

  function buildEmbed(player, game, options) {
    var siteUrl = options.siteUrl || SITE;
    var season = options.season || EGE.currentSeason;
    var team = EGE.teamFor(player);
    var opponent = opponentTeam(game.opponent);

    /* The admin publishes and posts in one click, so the week may not have
       been marked published yet when this is built. `played` is told, not
       looked up, and falls back to what the site already knows. */
    var played = options.played === undefined ? EGE.isFinal(game) : options.played;
    played = played && EGE.hasResult(game);

    var won = played && game.result.teamScore > game.result.opponentScore;
    var matchup = (game.home ? 'vs ' : 'at ') + game.opponent;

    var embed = {
      color: played ? (won ? COLOR_WIN : COLOR_LOSS) : COLOR_UPCOMING,
      author: {
        name: player.name,
        url: playerUrl(siteUrl, player),
        icon_url: asset(siteUrl, player.headshot)
      },
      title: played
        ? (won ? 'W ' : 'L ') + game.result.teamScore + '–' +
          game.result.opponentScore + ' ' + matchup
        : matchup,
      url: playerUrl(siteUrl, player),
      fields: []
    };

    if (played && game.stats) {
      var stats = EGE.statline.complete(player.position, game.stats);
      embed.fields = summaryFields(player, stats).concat([
        { name: '​', value: fullLine(player, stats), inline: false }
      ]);

      var credits = EGE.economy.touchdownCredits(player, stats);
      if (credits) {
        embed.fields.push({
          name: 'Credits earned', value: '+' + credits, inline: true
        });
      }
    } else if (!played) {
      embed.fields.push({ name: 'Kickoff', value: kickoffLabel(game), inline: true });
      embed.fields.push({ name: 'Where', value: game.home ? 'Home' : 'Away', inline: true });
      if (game.conference) {
        embed.fields.push({ name: 'Conference', value: 'Yes', inline: true });
      }
    }

    /* The player's own mark leads; the opponent's sits in the footer when we
       have one, which is as close to both crests as an embed allows. */
    if (team && team.logo) { embed.thumbnail = { url: asset(siteUrl, team.logo) }; }

    var footer = [team ? team.school : 'School TBD'];
    if (team && team.league) { footer.push(team.league); }
    var record = recordThrough(player, game.week, season);
    footer.push(record ? season + ' · ' + record : String(season));

    embed.footer = { text: footer.join(' · ') };
    if (opponent && opponent.logo) { embed.footer.icon_url = asset(siteUrl, opponent.logo); }

    return embed;
  }

  /* One week, ready to send. `options.played` forces the results form, which
     is what the publish button wants — it has just made the week real and is
     not waiting for a reload to say so. */
  function buildWeekPost(week, options) {
    var settings = options || {};
    var season = settings.season || EGE.currentSeason;
    var siteUrl = settings.siteUrl || SITE;

    var playing = EGE.gamesInWeek(week, season);
    if (!playing.length) { return null; }

    var results = playing.some(function (entry) {
      return settings.played === undefined ? EGE.isFinal(entry.game) : settings.played;
    }) && playing.some(function (entry) { return EGE.hasResult(entry.game); });

    var heading = results ? '## Week ' + week + ' — Results' : '## Week ' + week;

    return {
      content: heading + '\n' + siteUrl.replace(/\/+$/, ''),
      embeds: playing.map(function (entry) {
        return buildEmbed(entry.player, entry.game, {
          season: season, siteUrl: siteUrl, played: settings.played
        });
      }),
      allowed_mentions: { parse: [] }
    };
  }

  return {
    SITE: SITE,
    buildWeekPost: buildWeekPost,
    buildEmbed: buildEmbed
  };
})();
