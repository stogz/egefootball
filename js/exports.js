/* ==========================================================================
   EGE Football — season exports
   Turns what is in Supabase into files for the repository, which is where
   anything permanent has to end up: Supabase holds a season in progress, and
   git holds what a season came to.

   Three of them, all built here and downloaded from the admin portal:

     data/ratings.js        every player's ratings with the season's
                            purchases folded into the base numbers, so the
                            improvements are hardcoded and the shop rows
                            behind them can go
     data/logs/season-N.js  what happened: the stats posted in each game,
                            which booster was riding on it, and every credit
                            earned or spent
     data/season.js         the season pointer, moved on a year

   Nothing here writes to Supabase. Building a file and clearing the rows it
   replaces are deliberately two separate actions, in that order, with the
   commit in between — see the portal.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.exports = (function () {
  'use strict';

  var RATINGS_FILE = 'data/ratings.js';
  var START = '/* ege:ratings:start */';
  var END = '/* ege:ratings:end */';

  /* --- writing javascript ------------------------------------------------- */

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  /* Runs of `key: value,` wrapped the same width the file already wraps them
     at, so a player nobody spent anything on comes out byte for byte as they
     went in and the diff is only the players who changed. */
  var WRAP = 74;

  function wrapPairs(pairs, indent) {
    var lines = [];
    var line = '';

    pairs.forEach(function (pair) {
      var next = line ? line + ' ' + pair : pair;
      if (line && (indent + next).length > WRAP) {
        lines.push(indent + line);
        line = pair;
      } else {
        line = next;
      }
    });
    if (line) { lines.push(indent + line); }
    return lines;
  }

  /* One player's attributes, grouped and commented the way the file already
     does it, so a season lock reads as a diff of numbers rather than a
     rewrite of everything. */
  function ratingsBlock(player, values) {
    var lines = ["  '" + player.slug + "': {"];

    EGE.ratingGroups.forEach(function (group) {
      var pairs = group.attributes.filter(function (attr) {
        return typeof values[attr.key] === 'number';
      }).map(function (attr) {
        return attr.key + ': ' + values[attr.key] + ',';
      });
      if (!pairs.length) { return; }

      lines.push('    /* ' + group.label + ' */');
      wrapPairs(pairs, '    ').forEach(function (line) { lines.push(line); });
    });

    lines.push('  },');
    return lines.join('\n');
  }

  /* The replacement for everything between the markers: the same object, with
     every base number moved up to what the player actually has now. */
  function ratingsSource(season) {
    var lines = [
      START,
      '/* Locked on ' + today() + ', at the end of the ' + season + ' season. Every rating',
      '   point and every offseason workout bought during that season is part of',
      '   these numbers now, and the shop rows behind them have been cleared. */',
      'EGE.ratings = {'
    ];

    Object.keys(EGE.ratings).forEach(function (slug) {
      var player = EGE.playerBySlug(slug);
      if (!player) { return; }
      lines.push(ratingsBlock(player, EGE.valuesFor(player)));
    });

    lines.push('};');
    lines.push(END);
    return lines.join('\n');
  }

  /* What the lock will change, so the portal can say so before it is done. */
  function ratingsDiff(season) {
    return EGE.players.filter(function (player) {
      return EGE.ratings[player.slug];
    }).map(function (player) {
      var base = EGE.ratings[player.slug];
      var values = EGE.valuesFor(player);
      var moved = Object.keys(base).filter(function (key) {
        return values[key] !== base[key];
      });

      /* The overall the file would carry afterwards is the one showing now:
         locking changes where the numbers live, never what they are. */
      return {
        player: player,
        attributes: moved.length,
        points: moved.reduce(function (sum, key) {
          return sum + (values[key] - base[key]);
        }, 0),
        overall: EGE.overallFor(player)
      };
    });
  }

  /* The current file with a new ratings block spliced into it. Read rather
     than rebuilt, so every comment, weight and helper in it survives
     untouched — this replaces the numbers and nothing else.

     It needs the file over http, which the deployed site is. Opened straight
     off a disk it cannot read its own source, and says so rather than
     handing over half a file. */
  function ratingsFile(season) {
    return fetch(RATINGS_FILE, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.text();
    }).then(function (source) {
      var from = source.indexOf(START);
      var to = source.indexOf(END);
      if (from === -1 || to === -1 || to < from) {
        throw new Error('The markers in ' + RATINGS_FILE + ' are missing.');
      }

      var out = source.slice(0, from) + ratingsSource(season) +
                source.slice(to + END.length);

      /* Never hand over a file that would not load. */
      /* eslint-disable no-new-func */
      new Function('window', out);
      /* eslint-enable no-new-func */

      Object.keys(EGE.ratings).forEach(function (slug) {
        if (out.indexOf("'" + slug + "'") === -1) {
          throw new Error(slug + ' went missing from the export.');
        }
      });

      return out;
    }).catch(function (error) {
      throw new Error('Could not rebuild ' + RATINGS_FILE + ': ' + error.message +
                      '. This needs the site open over http, not from a file.');
    });
  }

  /* --- the season log ---------------------------------------------------- */

  function jsonBlock(value, indent) {
    return JSON.stringify(value, null, 2).split('\n').map(function (line, at) {
      return at === 0 ? line : indent + line;
    }).join('\n');
  }

  /* One player's season: every game with what was posted in it and what was
     riding on it, every credit in, and everything bought. */
  function playerLog(player, season, inventory, awards) {
    var mine = inventory.filter(function (row) {
      return player.email && row.email &&
             row.email.toLowerCase() === player.email.toLowerCase();
    });
    var paid = awards.filter(function (row) {
      return player.email && row.email &&
             row.email.toLowerCase() === player.email.toLowerCase();
    });
    return {
      name: player.name,
      position: player.position,
      team: player.team,
      record: EGE.recordFor(player, season).text,

      /* The overall as the file had it going in, and as it ended up. The
         difference is the season's shopping. */
      overall: {
        start: baseOverall(player),
        end: EGE.overallFor(player)
      },

      games: EGE.gamesFor(player, season).map(function (game) {
        var booster = EGE.boosterOn(player, game);
        return {
          week: game.week,
          date: game.date,
          opponent: game.opponent,
          home: game.home,
          conference: Boolean(game.conference),
          scouts: Boolean(game.scouts),
          published: EGE.isPublished(season, game.week),
          result: game.result || null,
          stats: game.stats || null,
          booster: booster ? {
            key: booster.key,
            name: booster.name,
            multiplier: booster.multiplier
          } : null,
          touchdowns: EGE.economy.touchdownsIn(game.stats),
          creditsEarned: EGE.economy.touchdownCredits(player, game.stats)
        };
      }),

      credits: {
        earned: paid.reduce(function (sum, row) { return sum + row.credits; }, 0),
        spent: mine.reduce(function (sum, row) { return sum + (row.credits || 0); }, 0),
        awards: paid.map(function (row) {
          return { key: row.award_key, credits: row.credits, note: row.note };
        })
      },

      bought: mine.map(function (row) {
        return {
          key: row.item_key,
          name: row.item_name,
          target: row.target || null,
          quantity: EGE.wallet.quantityOf(row),
          credits: row.credits || 0,
          effects: row.effects || {}
        };
      })
    };
  }

  /* The overall the ratings file carries on its own, before anything bought
     this season is added to it. */
  function baseOverall(player) {
    var boosts = EGE.appliedBoosts;
    EGE.appliedBoosts = {};
    var overall = EGE.overallFor(player);
    EGE.appliedBoosts = boosts;
    return overall;
  }

  function seasonLogSource(season, inventory, awards) {
    var log = {
      season: season,
      level: (EGE.seasons.filter(function (s) { return s.year === season; })[0] || {}).level || null,
      loggedOn: today(),
      players: {}
    };

    /* All six, including anyone who had no schedule that season. An empty
       entry is part of the record too — it says they played nothing. */
    EGE.players.forEach(function (player) {
      log.players[player.slug] = playerLog(player, season, inventory, awards);
    });

    return [
      '/* ==========================================================================',
      '   EGE Football — the ' + season + ' season, as it happened',
      '   Written by the admin portal at the end of the season. Every game with the',
      '   stats posted in it and the booster that was riding on it, every credit',
      '   earned, and everything bought with them.',
      '',
      '   A record, not a source: nothing on the site reads this to work anything',
      '   out. It is here so a season that has been cleared out of Supabase is',
      '   still on the record afterwards.',
      '   ========================================================================== */',
      '',
      'window.EGE = window.EGE || {};',
      'EGE.seasonLogs = EGE.seasonLogs || {};',
      '',
      'EGE.seasonLogs[' + season + '] = ' + jsonBlock(log, '') + ';',
      ''
    ].join('\n');
  }

  /* Everything the log needs, read in one go. Only an admin's policies return
     more than one account's worth of any of it. */
  function seasonLogFile(season) {
    var year = season || EGE.currentSeason;

    return Promise.all([
      EGE.wallet.allInventory(),
      EGE.wallet.allAwards(year),
      EGE.wallet.loadGameBoosters(year)
    ]).then(function (all) {
      return seasonLogSource(year, all[0], all[1]);
    });
  }

  /* --- the season file ------------------------------------------------------ */

  /* Writes stats/{year}.js back out: the same fixtures it went in with, and
     whatever the editor has changed on top.

     The whole file is regenerated rather than spliced, because unlike
     data/ratings.js it is data all the way down — there is no hand-written
     helper in it to preserve. What it keeps is the shape: a comment per
     player, one line per game, and the numbers in the order a reader expects.

     The worked-out numbers — averages, totals, a passer rating — are filled
     in here from the ones that were typed, so a file written by the editor
     and a file typed by hand come out the same. */
  function seasonFile(season, edits) {
    var forSeason = EGE.stats[season];
    if (!forSeason) { throw new Error('There is no ' + season + ' season file.'); }

    /* Every week that was opened in the editor, not only the one on screen. */
    var changed = (edits && edits.season === season) ? (edits.weeks || {}) : {};

    var lines = seasonHeader(season);
    lines.push('window.EGE = window.EGE || {};');
    lines.push('EGE.stats = EGE.stats || {};');
    lines.push('');
    lines.push('EGE.stats[' + season + '] = {');
    lines.push('  season: ' + season + ',');
    lines.push('  level: ' + quote(forSeason.level || '') + ',');
    lines.push('');
    playoffLines(forSeason).forEach(function (line) { lines.push(line); });
    lines.push('  games: {');

    EGE.players.forEach(function (player) {
      var games = forSeason.games[player.slug] || [];
      var team = EGE.teamFor(player);
      lines.push('');

      if (!games.length) {
        lines.push('    /* ' + player.name + ' — no school yet, so no fixtures. */');
        lines.push('    ' + quote(player.slug) + ': [],');
        return;
      }

      lines.push('    /* ' + player.name + ' — ' + (team ? team.school : 'school TBD') + ' */');
      lines.push('    ' + quote(player.slug) + ': [');

      games.forEach(function (game) {
        /* A week the editor has open is taken from there; every other week is
           written back exactly as it was read. */
        var edited = (changed[game.week] || {})[player.slug] || null;
        gameLines(player, game, edited).forEach(function (line) { lines.push(line); });
      });

      lines.push('    ],');
    });

    lines.push('  }');
    lines.push('};');
    lines.push('');

    var out = lines.join('\n');

    /* Never hand over a file that would not load, or one that has lost a
       player on the way through. */
    /* eslint-disable no-new-func */
    new Function('window', out);
    /* eslint-enable no-new-func */
    EGE.players.forEach(function (player) {
      if (out.indexOf(quote(player.slug)) === -1) {
        throw new Error(player.name + ' went missing from the file.');
      }
    });

    return Promise.resolve(out);
  }

  /* Null writes as the literal, not as the four letters in quotes. A bye has
     no opponent and no kickoff, and 'null' in that slot would read back in as
     a team called null. */
  function quote(text) {
    if (text === null || text === undefined) { return 'null'; }
    return String(text).indexOf("'") === -1
      ? "'" + text + "'"
      : JSON.stringify(text);
  }

  function pad(number) {
    return String(number).length < 2 ? ' ' + number : String(number);
  }

  /* The draws, written back out as they were read.

     The editor never touches these -- there is nothing in it that edits a
     game somebody else played -- but the file is rewritten whole, so
     anything not written here is dropped. That is how the playoff flags were
     nearly lost, and thirty results a bracket is a worse thing to lose. */
  function playoffLines(forSeason) {
    var draws = forSeason.playoffs;
    if (!draws || !Object.keys(draws).length) { return []; }

    var out = ['  /* How the rest of each draw went. See data/brackets.js for the',
               '     order: the whole left half top to bottom, then the whole right.',
               '     [winner, winner\'s score, loser\'s score], or null for a bye and',
               '     for the one matchup his own school is in. */',
               '  playoffs: {'];

    Object.keys(draws).forEach(function (key, at) {
      if (at) { out.push(''); }
      out.push('    ' + key + ': [');
      (draws[key] || []).forEach(function (round) {
        var results = round.results || [];
        if (!results.length) {
          out.push('      { week: ' + round.week + ', results: [] },');
          return;
        }
        out.push('      { week: ' + round.week + ', results: [');
        results.forEach(function (row) {
          out.push('        ' + (row
            ? '[' + quote(row[0]) + ', ' + row[1] + ', ' + row[2] + '],'
            : 'null,'));
        });
        out.push('      ] },');
      });
      out.push('    ],');
    });

    out.push('  },');
    out.push('');
    return out;
  }

  /* One game, as the two or three lines the file writes it on. */
  function gameLines(player, game, edited) {
    var result = edited ? edited.result : game.result;
    var booster = edited ? edited.booster : game.booster;
    var typed = edited ? edited.stats : game.stats;

    /* A score is only a score with both halves of it. */
    var scored = result &&
      typeof result.teamScore === 'number' &&
      typeof result.opponentScore === 'number';

    var stats = scored ? EGE.statline.complete(player.position, typed) : null;

    /* Every flag the file can carry, or the editor writing a season back out
       would quietly drop the ones it does not know about -- a playoff game
       would come back as a regular one the first time anybody saved. */
    var flags = ['home: ' + (game.home ? 'true' : 'false'),
                 'conference: ' + (game.conference ? 'true' : 'false')];
    if (game.playoff) { flags.push('playoff: true'); }
    if (game.bye) { flags.push('bye: true'); }
    if (game.scouts) { flags.push('scouts: true'); }

    var out = [
      '      { week: ' + pad(game.week) + ', date: ' + quote(game.date) +
        ', kickoff: ' + quote(game.kickoff) + ',',
      '        opponent: ' + quote(game.opponent) + ', ' + flags.join(', ') + ','
    ];

    var resultText = scored
      ? '{ teamScore: ' + result.teamScore + ', opponentScore: ' + result.opponentScore + ' }'
      : 'null';
    var boosterText = booster ? quote(booster) : 'null';

    if (!stats) {
      out.push('        result: ' + resultText + ', booster: ' + boosterText + ', stats: null },');
      return out;
    }

    out.push('        result: ' + resultText + ', booster: ' + boosterText + ',');
    out.push('        stats: {');
    statLines(player, stats).forEach(function (line) { out.push(line); });
    out.push('        } },');
    return out;
  }

  /* The stat line, wrapped so it reads as a line rather than a column. */
  function statLines(player, stats) {
    var pairs = Object.keys(stats).filter(function (key) {
      return stats[key] !== null && stats[key] !== undefined;
    }).map(function (key) {
      return key + ': ' + stats[key] + ',';
    });

    /* The last one loses its comma, which is the only thing that would look
       hand-written if it were wrong. */
    if (pairs.length) { pairs[pairs.length - 1] = pairs[pairs.length - 1].replace(/,$/, ''); }
    return wrapPairs(pairs, '          ');
  }

  function seasonHeader(season) {
    return [
      '/* ==========================================================================',
      '   EGE Football — the ' + season + ' season',
      '   The whole season in one file: who each of them plays, when, and what they',
      '   did in it. One of these per season, and nothing else holds a fixture or a',
      '   stat line — the schedule lives here too, because a game and what happened',
      '   in it are the same thing.',
      '',
      '   Filling it in',
      '   -------------',
      '   `result` and `stats` are null until a game has been played. Put the numbers',
      '   in by hand, or use the season editor on the admin page, which writes this',
      '   file back out for you.',
      '',
      '   `booster` is the performance booster that was riding on the game, as its',
      "   shop key — 'boost-2-5', 'boost-2-0', 'boost-1-5' — or null. Once a week",
      '   is published this is where a booster lives for good, so the row behind it',
      '   can be cleared out of Supabase.',
      '',
      '   Nothing here shows on the site until the admin publishes that week. The',
      '   numbers can sit in the repository for as long as it takes.',
      '',
      '   `conference: true` marks the games listed with an asterisk, and',
      '   `scouts: true` marks a game scouts will be at — what Intel buys is the',
      '   right to see it.',
      '   ========================================================================== */',
      ''
    ];
  }

  /* --- the season pointer ------------------------------------------------- */

  function seasonFileSource(current, locked) {
    return fetch('data/season.js', { cache: 'no-store' }).then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.text();
    }).then(function (source) {
      var out = source
        .replace(/EGE\.currentSeason = \d+;/, 'EGE.currentSeason = ' + current + ';')
        .replace(/EGE\.lockedSeasons = \[[^\]]*\];/,
                 'EGE.lockedSeasons = [' + locked.join(', ') + '];');

      if (out.indexOf('EGE.currentSeason = ' + current + ';') === -1) {
        throw new Error('data/season.js does not look the way it should.');
      }
      /* eslint-disable no-new-func */
      new Function('window', out);
      /* eslint-enable no-new-func */
      return out;
    }).catch(function (error) {
      throw new Error('Could not rebuild data/season.js: ' + error.message +
                      '. This needs the site open over http, not from a file.');
    });
  }

  /* --- handing the file over ---------------------------------------------- */

  function download(name, text) {
    var blob = new Blob([text], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    /* Revoked late: Safari has been known to cancel a download whose blob
       goes away in the same tick. */
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  return {
    seasonFile: seasonFile,
    ratingsFile: ratingsFile,
    ratingsSource: ratingsSource,
    ratingsDiff: ratingsDiff,
    seasonLogFile: seasonLogFile,
    seasonLogSource: seasonLogSource,
    seasonFileSource: seasonFileSource,
    baseOverall: baseOverall,
    download: download
  };
})();
