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

  /* --- when the game kicked off -------------------------------------------- */

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

  /* '7:30pm' -> { hour: 19, minute: 30 }. Anything it cannot read comes back
     null rather than guessing at midnight. */
  function clockOf(kickoff) {
    var read = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(String(kickoff || '').trim());
    if (!read) { return null; }

    var hour = Number(read[1]);
    var minute = Number(read[2] || 0);
    var half = (read[3] || '').toLowerCase();

    if (half === 'pm' && hour !== 12) { hour += 12; }
    if (half === 'am' && hour === 12) { hour = 0; }
    if (hour > 23 || minute > 59) { return null; }

    return { hour: hour, minute: minute };
  }

  /* What a given instant reads as on a given zone's clock. */
  function clockIn(instant, zone) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(new Date(instant)).reduce(function (out, part) {
      out[part.type] = part.value;
      return out;
    }, {});

    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day),
                    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second));
  }

  /* The moment a 7:00pm kickoff actually happened, as an ISO string Discord
     can render in whoever is reading's own time.

     Wall-clock time in a named zone is not something Date can be told
     directly, so: read the naive time as if it were UTC, ask what that
     instant looks like on the school's clock, and the gap between the two is
     the offset to take back off. Daylight saving comes out right because the
     zone answers for the day in question, not for today. */
  function kickoffInstant(game, team) {
    var zone = team && team.zone;
    var clock = clockOf(game.kickoff);
    var parts = String(game.date).split('-').map(Number);
    if (!zone || !clock || parts.length !== 3) { return null; }

    var naive = Date.UTC(parts[0], parts[1] - 1, parts[2], clock.hour, clock.minute);
    var offset = clockIn(naive, zone) - naive;
    return new Date(naive - offset).toISOString();
  }

  /* --- naming the week ------------------------------------------------------ */

  var WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
               'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
               'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

  function weekWord(week) {
    return WORDS[week] || String(week);
  }

  /* --- the pieces of an embed ------------------------------------------------ */

  /* Absolute URLs — Discord will not load anything relative. */
  function asset(siteUrl, path) {
    return siteUrl.replace(/\/+$/, '') + '/' + String(path).replace(/^\/+/, '');
  }

  function playerUrl(siteUrl, player) {
    return siteUrl.replace(/\/+$/, '') + '/#' + player.slug;
  }

  function code(text) { return '`' + text + '`'; }

  /* --- one game -------------------------------------------------------------- */

  function buildEmbed(player, game, options) {
    var siteUrl = options.siteUrl || SITE;
    var season = options.season || EGE.currentSeason;
    var team = EGE.teamFor(player);

    /* The admin publishes and posts in one click, so the week may not have
       been marked published yet when this is built. `played` is told, not
       looked up, and falls back to what the site already knows. */
    var played = options.played === undefined ? EGE.isFinal(game) : options.played;
    played = played && EGE.hasResult(game);

    var won = played && game.result.teamScore > game.result.opponentScore;
    var matchup = (game.home ? 'vs. ' : 'at ') + game.opponent;

    var embed = {
      color: played ? (won ? COLOR_WIN : COLOR_LOSS) : COLOR_UPCOMING,

      /* The school, with its mark, and deliberately not a link: there is
         nothing on the site to send anybody to for a school. */
      author: {
        name: team ? team.school : 'School TBD'
      },

      /* The player's face, not the school crest — the post is about him. */
      thumbnail: { url: asset(siteUrl, player.headshot) },

      fields: []
    };

    if (team && team.logo) { embed.author.icon_url = asset(siteUrl, team.logo); }

    /* The headline, and the one link in the embed: his own page. It is the
       description rather than the title because a title renders as flat text
       — the score would lose its box. */
    embed.description = played
      ? '[' + (won ? 'W' : 'L') + ' ' +
        code(game.result.teamScore + '-' + game.result.opponentScore) + ' ' +
        matchup + '](' + playerUrl(siteUrl, player) + ')'
      : '[' + matchup + '](' + playerUrl(siteUrl, player) + ')';

    if (played && game.stats) {
      var stats = EGE.statline.complete(player.position, game.stats);

      /* A field each, in the order his position's line reads. The averages
         and the totals are not here: they follow from these. */
      EGE.statline.fieldsFor(player.position, stats).forEach(function (field) {
        embed.fields.push({ name: field.label, value: code(field.value), inline: true });
      });

      var credits = EGE.economy.touchdownCredits(player, stats);
      if (credits) {
        embed.fields.push({ name: 'Credits', value: code('+' + credits), inline: true });
      }
    } else if (!played) {
      embed.fields.push({ name: 'Kickoff', value: code(kickoffLabel(game)), inline: true });
      embed.fields.push({ name: 'Where', value: code(game.home ? 'Home' : 'Away'), inline: true });
      if (game.conference) {
        embed.fields.push({ name: 'Conference', value: code('Yes'), inline: true });
      }
    }

    embed.footer = { text: player.name };

    /* Rendered in whoever is reading's own time zone, which is the whole
       point of sending an instant rather than a printed time. */
    var kickedOff = kickoffInstant(game, team);
    if (kickedOff) { embed.timestamp = kickedOff; }

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

    return {
      content: '## Week ' + weekWord(week),
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
