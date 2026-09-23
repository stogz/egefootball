/* ==========================================================================
   EGE Football — the Discord post
   One week, as a Discord message. Loaded by the browser so the admin's
   publish button can build it, and by the bot so a scheduled run builds
   exactly the same thing — there is no second opinion about what a week
   looks like in the channel.

   ## Week {n} — Results
   {an embed per player with a game that week}
   {a link back to the site}

   A game that has been played shows the result, the final score, the
   player's stat line and, when any were typed in, the game's big plays. A
   game that has not shows the matchup and the kickoff.
   A player on a bye, one with no game that week, and one with no schedule at
   all are simply left out.

   A postseason week is headed "Playoffs Week One" rather than "Week
   Fourteen". Which weeks those are is read off the games -- see
   EGE.playoffWeeks in data/games.js -- so the heading does not need telling
   when the regular season ends.
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

  /* What the message is headed. The postseason counts from one again: week
     fourteen is Playoffs Week One, and a channel reading it should not have
     to know which week of the year the brackets came out. */
  function weekTitle(week, season) {
    var round = EGE.playoffRound(week, season);
    return round
      ? 'Playoffs Week ' + weekWord(round)
      : 'Week ' + weekWord(week);
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
     happened in the game: the block below is always four lines, and there
     are always exactly three fields under it.

     Three numbers a line does it. Every position's line is eleven or twelve
     typed numbers — a quarterback's twelve fill four rows exactly, and
     everyone else's eleven leave one gap on the last row.

     It used to be four a line, which fit on a wide screen and fell apart on
     a narrow one. The headshot takes its column out of the embed, so a
     phone or a half-width window leaves the block about thirty characters,
     and a busy game — three-digit yards, five-letter labels — went past
     that. Discord wraps a code block rather than scrolling it, so the last
     cell of every row dropped onto a line of its own and the table turned
     into a jumble. Three a line is never wider than the space it has. */
  var PER_LINE = 3;

  /* The widest a line may be, in characters. Comfortably inside the room a
     narrow embed leaves beside the headshot, so nothing in the block ever
     wraps whatever the numbers are. */
  var BLOCK_WIDTH = 30;

  /* How many lines the stat block always is. */
  var BLOCK_LINES = 4;

  /* Right-align the numbers and left-align the labels, column by column, so
     the block reads as a table rather than a run-on sentence. Discord renders
     a code block in a monospace font, which is the only reason this lines up
     at all.

     Two spaces between columns reads best, and is what nearly every game
     gets. A line that would come out wider than BLOCK_WIDTH with two tries
     again with one, and a line still too wide after that — a four-digit
     number nobody will post — loses the gap between a number and its label
     rather than wrapping. */
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

    function layout(gap, join) {
      return rows.map(function (row) {
        return row.map(function (cell, column) {
          return padStart(cell.value, valueWidth[column]) + join +
                 padEnd(cell.label, labelWidth[column]);
        }).join(gap).replace(/\s+$/, '');
      });
    }

    function fits(lines) {
      return lines.every(function (line) { return line.length <= BLOCK_WIDTH; });
    }

    var roomy = layout('  ', ' ');
    if (fits(roomy)) { return roomy; }

    var tight = layout(' ', ' ');
    if (fits(tight)) { return tight; }

    return layout(' ', '');
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

  /* Anything typed goes inside a code block, where a backtick would close
     the block early and spill the rest of the embed out as markdown. A
     straight quote reads the same. */
  function plain(text) {
    return String(text).replace(/`/g, "'").replace(/\s+/g, ' ').trim();
  }

  /* Always the same number of lines, so the height of an embed does not
     depend on what happened in the game.

     The lines are not padded out to a common width any more. The spacer
     image at the bottom already pins the embed's width, and trailing spaces
     were only ever one more thing that could wrap on a narrow screen. */
  function asBlock(lines, count) {
    var out = lines.slice(0, count);
    while (out.length < count) { out.push(''); }

    return '```\n' + out.join('\n') + '\n```';
  }

  function statBlock(player, stats) {
    return asBlock(gridOf(EGE.statline.fieldsFor(player.position, stats)), BLOCK_LINES);
  }

  /* A game nobody has played has no numbers to show, so it shows what is
     known about it instead — in the same four lines, so the embed comes out
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
    }), BLOCK_LINES);
  }

  /* --- the big plays ----------------------------------------------------------- */

  /* The moments worth a line of their own, typed in on the admin page one to
     a line: `- 44 yard receiving touchdown bomb`.

     They go in a block of their own under the stat line, and they are
     wrapped here, at word boundaries and to the same width as the block
     above, rather than left for Discord to break wherever the screen ends.
     A play that runs long carries on under its own first word, so it still
     reads as one play and not two.

     Five plays at most, and a hundred characters a play. Discord takes no
     more than 6000 characters of text across every embed in a message, and
     six players' worth of long lists would go past it and lose the whole
     week's post rather than just the tail of one list. */
  var MAX_PLAYS = 5;
  var MAX_PLAY_LENGTH = 100;

  function wrapPlay(text) {
    var room = BLOCK_WIDTH - 2;
    var lines = [];
    var line = '';

    plain(text).split(' ').forEach(function (word) {
      /* A single word longer than a whole line is cut, not left to wrap. */
      while (word.length > room) {
        if (line) { lines.push(line); line = ''; }
        lines.push(word.slice(0, room));
        word = word.slice(room);
      }
      if (!word) { return; }

      if (line && (line + ' ' + word).length > room) {
        lines.push(line);
        line = word;
      } else {
        line = line ? line + ' ' + word : word;
      }
    });
    if (line) { lines.push(line); }

    return lines.map(function (part, at) { return (at ? '  ' : '- ') + part; });
  }

  function bigPlaysOf(game) {
    return (game.bigPlays || []).map(function (play) {
      var text = plain(play);
      return text.length > MAX_PLAY_LENGTH
        ? text.slice(0, MAX_PLAY_LENGTH - 3).replace(/\s+$/, '') + '...'
        : text;
    }).filter(Boolean).slice(0, MAX_PLAYS);
  }

  function bigPlaysBlock(game) {
    var plays = bigPlaysOf(game);
    if (!plays.length) { return null; }

    var lines = [];
    plays.forEach(function (play) {
      wrapPlay(play).forEach(function (line) { lines.push(line); });
    });
    return asBlock(lines, lines.length);
  }

  /* --- the three that matter ------------------------------------------------- */

  /* `5/9, 59YDS` — what he did with what he was given, then the yards.

     The YDS is there so nobody has to guess which number is the yardage.
     Every field is also set in a code span, the same dark box the score
     sits in, which is monospaced — so it measures the same whatever the
     digits are, and the three fields line up from one embed to the next.

     Nothing to report collapses to a nought rather than spelling out zeroes. */
  function outOf(made, given, yards) {
    if (!given) { return '0'; }
    return made + '/' + given + ', ' + yards + 'YDS';
  }

  /* `14 CAR, 76YDS`. Carrying has no attempts to fall short of, so it says
     how many rather than how many of how many — and it keeps CAR, because a
     bare `14, 76YDS` gives no clue what the first number is. */
  function runs(carries, yards) {
    if (!carries) { return '0'; }
    return carries + ' CAR, ' + yards + 'YDS';
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

    /* A bye has nobody to play, so it is said rather than written as a
       fixture -- "at null" is what this read before there were byes in the
       file. The postseason is marked the way the schedule marks it. */
    /* buildWeekPost drops byes before it gets here, but this is exported on
       its own, and "at null" is what a bye read as before there was a guard.
       No mark for a playoff game: the whole message is headed Playoffs Week
       One, and a pair of asterisks in a Discord link is bold rather than a
       footnote. */
    var matchup = game.bye
      ? 'Bye week'
      : (game.home ? 'vs. ' : 'at ') + game.opponent;

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
        matchup + (game.overtime ? ' (OT)' : '') + '](' + playerUrl(siteUrl, player) + ')'
      : '[' + matchup + '](' + playerUrl(siteUrl, player) + ')';

    /* Three fields, always, and never a fourth: a fourth wraps onto a second
       row and makes that embed taller than the one above it. The number is
       the field's name and the heading is its value, because Discord draws a
       name above its value and the number is what should be read first. */
    var stats = played && game.stats
      ? EGE.statline.complete(player.position, game.stats)
      : null;

    /* The big plays, when any were typed in, go straight under the stat
       line in a block of their own. A game without any has nothing there
       rather than an empty box. */
    var plays = stats ? bigPlaysBlock(game) : null;

    embed.description = headline + '\n' +
      (stats ? statBlock(player, stats) : fixtureBlock(game)) +
      (plays ? '\n' + plays : '');

    summaryFor(player).forEach(function (part) {
      embed.fields.push({
        name: stats ? code(part.text(player, stats)) : '\u2014',
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

    /* A bye is on the schedule because the week is, but there is nothing to
       post about a player who is not playing -- the same rule that already
       leaves out a player with no game that week at all. */
    var playing = EGE.gamesInWeek(week, season).filter(function (entry) {
      return !entry.game.bye;
    });
    if (!playing.length) { return null; }

    return {
      content: '## ' + weekTitle(week, season),
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
