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

  /* --- the whole line, in a block -------------------------------------------- */

  /* Every embed is the same height, whatever the position and whatever
     happened in the game. Two things make that true: the block below is
     always three lines, and there are always exactly three fields under it.

     Four numbers a line does it. Every position's line is eleven or twelve
     typed numbers — a quarterback's twelve fill three rows exactly, and
     everyone else's eleven leave one gap on the last row. Wrapping by
     character width, which is what this used to do, gave two lines for one
     player and three for the next. */
  var PER_LINE = 4;

  /* Right-align the numbers and left-align the labels, column by column, so
     the block reads as a table rather than a run-on sentence. Discord renders
     a code block in a monospace font, which is the only reason this lines up
     at all. */
  function gridOf(cells) {
    var rows = [];
    for (var at = 0; at < cells.length; at += PER_LINE) {
      rows.push(cells.slice(at, at + PER_LINE));
    }

    /* How wide each column has to be to hold its widest entry. */
    var valueWidth = [];
    var labelWidth = [];
    rows.forEach(function (row) {
      row.forEach(function (cell, column) {
        valueWidth[column] = Math.max(valueWidth[column] || 0, cell.value.length);
        labelWidth[column] = Math.max(labelWidth[column] || 0, cell.label.length);
      });
    });

    return rows.map(function (row) {
      return row.map(function (cell, column) {
        return padStart(cell.value, valueWidth[column]) + ' ' +
               padEnd(cell.label, labelWidth[column]);
      }).join('  ');
    });
  }

  function padStart(text, width) {
    var out = String(text);
    while (out.length < width) { out = ' ' + out; }
    return out;
  }

  function padEnd(text, width) {
    var out = String(text);
    while (out.length < width) { out += ' '; }
    return out;
  }

  /* How wide the block is, in characters — and so how wide the embed is.

     Discord sizes an embed to its widest content, so a quiet game came out
     narrower than a busy one and the right-hand edge moved from post to post.
     Padding every line to the same length fixes it in place.

     No invisible character is needed for this, and the one people reach for
     would not work anyway: a zero-width space is, as the name says, zero
     wide. Inside a code block ordinary spaces are kept rather than collapsed,
     and the font is monospaced, so 39 characters is always the same number of
     pixels whatever is in them.

     39 is what the format can produce at its widest — every number three
     digits, which is a tight team of tight ends short of a stat line anybody
     will post. Wider would be wasted, and wide enough to wrap on a phone,
     where the block has about 41 characters to play with. */
  var BLOCK_WIDTH = 39;

  /* Always three lines of always the same length, so neither the height nor
     the width of an embed depends on what happened in the game. */
  function asBlock(lines) {
    var out = lines.slice(0, 3);
    while (out.length < 3) { out.push(''); }

    return '```\n' + out.map(function (line) {
      return padEnd(line, BLOCK_WIDTH);
    }).join('\n') + '\n```';
  }

  function statBlock(player, stats) {
    return asBlock(gridOf(EGE.statline.fieldsFor(player.position, stats)));
  }

  /* A game nobody has played has no numbers to show, so it shows what is
     known about it instead — in the same three lines, so the embed comes out
     the same height as every other one. */
  function fixtureBlock(game) {
    var rows = [
      ['Kickoff', kickoffLabel(game)],
      ['Where', game.home ? 'Home' : 'Away'],
      ['Game', game.conference ? 'Conference' : 'Non-conference']
    ];
    var width = rows.reduce(function (widest, row) {
      return Math.max(widest, row[0].length);
    }, 0);

    return asBlock(rows.map(function (row) {
      return padEnd(row[0], width) + '  ' + row[1];
    }));
  }

  /* --- the three that matter ------------------------------------------------- */

  /* `5/9, 52` — what he did with what he was given, then the yards.

     No YDS on the end. A field column is about 95 pixels on a phone, and
     `12/18, 187YDS` measures 95 exactly while `24 CAR, 287YDS` measures 110 —
     either wraps to a second line and makes that embed taller than the one
     above it. Without the suffix the widest either gets is 81. The heading
     underneath already says whether these are receiving yards or rushing
     ones, so the suffix was only ever saying it twice.

     Nothing to report collapses to a nought rather than spelling out zeroes. */
  function outOf(made, given, yards) {
    if (!given) { return '0'; }
    return made + '/' + given + ', ' + yards;
  }

  /* `14 CAR, 76`. Carrying has no attempts to fall short of, so it says how
     many rather than how many of how many — and it keeps CAR, because a bare
     `14, 76` gives no clue which number is which. */
  function runs(carries, yards) {
    if (!carries) { return '0'; }
    return carries + ' CAR, ' + yards;
  }

  function touchdowns(player, stats) {
    return String(EGE.economy.touchdownsIn(stats));
  }

  /* The headline three, in the order each position is read in: what he did
     most of first, and what he did least of last. */
  var SUMMARY = {
    QB: [
      /* Shortened on purpose. Spelled out in full it is 150px wide, which is
         wider than a field column on any screen, so it wraps to two lines and
         makes every quarterback's embed taller than everybody else's. */
      { label: 'Touchdowns/INT',
        text: function (p, s) { return touchdowns(p, s) + '/' + (s.interceptions || 0); } },
      { label: 'Passing',
        text: function (p, s) { return outOf(s.completions, s.attempts, s.passingYards); } },
      { label: 'Rushing',
        text: function (p, s) { return runs(s.carries, s.rushingYards); } }
    ],
    RB: [
      { label: 'Touchdowns', text: touchdowns },
      { label: 'Rushing',
        text: function (p, s) { return runs(s.carries, s.rushingYards); } },
      { label: 'Receiving',
        text: function (p, s) { return outOf(s.receptions, s.targets, s.receivingYards); } }
    ],
    TE: [
      { label: 'Touchdowns', text: touchdowns },
      { label: 'Receiving',
        text: function (p, s) { return outOf(s.receptions, s.targets, s.receivingYards); } },
      { label: 'Rushing',
        text: function (p, s) { return runs(s.carries, s.rushingYards); } }
    ]
  };

  SUMMARY.WR = SUMMARY.TE;

  function summaryFor(player) {
    return SUMMARY[player.position] || SUMMARY.TE;
  }

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
       — the score would lose its box, and a code block could not go under
       it at all. */
    var headline = played
      ? '[' + (won ? 'W' : 'L') + ' ' +
        code(game.result.teamScore + '-' + game.result.opponentScore) + ' ' +
        matchup + '](' + playerUrl(siteUrl, player) + ')'
      : '[' + matchup + '](' + playerUrl(siteUrl, player) + ')';

    /* Three fields, always, and never a fourth: a fourth wraps onto a second
       row and makes that embed taller than the one above it. The number is
       the field's name and the heading is its value, because Discord draws a
       name above its value and the number is what should be read first. */
    var stats = played && game.stats
      ? EGE.statline.complete(player.position, game.stats)
      : null;

    embed.description = headline + '\n' +
      (stats ? statBlock(player, stats) : fixtureBlock(game));

    summaryFor(player).forEach(function (part) {
      embed.fields.push({
        name: stats ? part.text(player, stats) : '\u2014',
        value: part.label,
        inline: true
      });
    });

    /* Pins the embed to its full width, so the right-hand edge lands in the
       same place on every post rather than shrinking to fit a quiet game.

       There is no invisible *character* that will do this. A zero-width space
       is zero wide by definition, and a braille blank — the usual suggestion —
       is a character in a proportional font, so a run of them is only ever
       approximately as wide as the next run. An image is measured: Discord
       scales an embed image down to the embed's maximum width, so one that is
       deliberately wider than any embed pins it there exactly.

       It is 1600x2 and entirely transparent — 92 bytes, and under a pixel tall
       once it has been scaled down, which is why the height does not move
       either. */
    embed.image = { url: asset(siteUrl, 'icon/spacer.png') };

    embed.footer = { text: 'EGE Football Simulation' };

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
