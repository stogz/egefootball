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
  function playerLog(player, season, inventory, awards, stickers) {
    var mine = inventory.filter(function (row) {
      return player.email && row.email &&
             row.email.toLowerCase() === player.email.toLowerCase();
    });
    var paid = awards.filter(function (row) {
      return player.email && row.email &&
             row.email.toLowerCase() === player.email.toLowerCase();
    });
    var weeks = stickers[player.slug] || {};

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
        var sticker = weeks[game.week] || null;
        return {
          week: game.week,
          date: game.date,
          opponent: game.opponent,
          home: game.home,
          conference: Boolean(game.conference),
          scouts: Boolean(game.scouts),
          result: game.result || null,
          stats: game.stats || null,
          booster: sticker ? {
            key: sticker.item_key,
            name: sticker.item_name,
            multiplier: EGE.multiplierFor(sticker.item_key),
            appliedAt: sticker.applied_at
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

  function seasonLogSource(season, inventory, awards, stickers) {
    var log = {
      season: season,
      level: (EGE.seasons.filter(function (s) { return s.year === season; })[0] || {}).level || null,
      loggedOn: today(),
      players: {}
    };

    /* All six, including anyone who had no schedule that season. An empty
       entry is part of the record too — it says they played nothing. */
    EGE.players.forEach(function (player) {
      log.players[player.slug] = playerLog(player, season, inventory, awards, stickers);
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
      return seasonLogSource(year, all[0], all[1], all[2] || {});
    });
  }

  /* --- the week's results -------------------------------------------------- */

  var RESULTS_FILE = 'data/results.js';
  var R_START = '/* ege:results:start */';
  var R_END = '/* ege:results:end */';

  /* Everything published so far, plus the week just rolled. Each week is
     added rather than replacing what came before, so the file grows a week at
     a time and the diff for a Friday is that Friday.

     `rolled` is what EGE.statgen.playWeek handed back. */
  function resultsSource(season, week, rolled) {
    var published = {};

    /* What is already in data/results.js, deep enough to copy safely. */
    Object.keys(EGE.results || {}).forEach(function (year) {
      published[year] = {};
      Object.keys(EGE.results[year]).forEach(function (slug) {
        published[year][slug] = {};
        Object.keys(EGE.results[year][slug]).forEach(function (at) {
          published[year][slug][at] = EGE.results[year][slug][at];
        });
      });
    });

    var forSeason = published[season] || (published[season] = {});

    rolled.forEach(function (entry) {
      var forPlayer = forSeason[entry.player.slug] || (forSeason[entry.player.slug] = {});
      forPlayer[week] = {
        result: entry.outcome.result,
        stats: entry.outcome.stats,
        booster: entry.booster || null,
        seed: entry.outcome.seed,
        publishedOn: today()
      };
    });

    var lines = [
      R_START,
      '/* Weeks published so far. Each one was rolled in the admin portal and',
      '   carries the seed it came from, so the same numbers can always be',
      '   worked out again. Last published ' + today() + '. */',
      'EGE.results = ' + jsonBlock(published, '') + ';',
      R_END
    ];
    return lines.join('\n');
  }

  /* The current file with the new week spliced in. Same handling as the
     ratings lock: read the real file, replace what sits between the markers,
     and refuse rather than hand over something that would not load. */
  function resultsFile(season, week, rolled) {
    return fetch(RESULTS_FILE, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.text();
    }).then(function (source) {
      var from = source.indexOf(R_START);
      var to = source.indexOf(R_END);
      if (from === -1 || to === -1 || to < from) {
        throw new Error('The markers in ' + RESULTS_FILE + ' are missing.');
      }

      var out = source.slice(0, from) + resultsSource(season, week, rolled) +
                source.slice(to + R_END.length);

      /* It has to load, and it has to still carry the week just rolled. */
      /* eslint-disable no-new-func */
      new Function('window', out.replace(/EGE\.applyResults\(\);\s*$/, ''));
      /* eslint-enable no-new-func */

      rolled.forEach(function (entry) {
        if (out.indexOf('"' + entry.player.slug + '"') === -1) {
          throw new Error(entry.player.name + ' went missing from the file.');
        }
      });

      return out;
    }).catch(function (error) {
      throw new Error('Could not rebuild ' + RESULTS_FILE + ': ' + error.message +
                      '. This needs the site open over http, not from a file.');
    });
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
    resultsFile: resultsFile,
    resultsSource: resultsSource,
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
