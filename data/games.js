/* ==========================================================================
   EGE Football — reading the seasons
   Every game lives in stats/{year}.js. This is how the rest of the site gets
   at them, and the one place that decides what "played" means.

   Published, not just filled in
   -----------------------------
   A season file can hold every result of the year and the site will still
   show none of them. A week becomes real when the admin publishes it, which
   is a row in Supabase rather than anything in the repository — so the
   numbers can sit in git for as long as it takes, and a booster somebody
   used after the file was written can still be put right first.

   EGE.isFinal is what everything downstream reads, and it answers no until
   the week is published. That is what keeps the schedule, the record, the
   game log, the touchdown credits and the Discord bot from ever getting
   ahead of the admin. Where the admin needs to see what has not been
   published — the season editor — it reads EGE.hasResult instead.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.stats = EGE.stats || {};

/* --- which weeks are out ------------------------------------------------- */

/* Filled in by js/wallet.js from Supabase, as { season: [week, week, ...] }.
   Empty until it has loaded, which means a page that cannot reach Supabase
   shows fixtures rather than inventing results. */
EGE.publishedWeeks = {};

EGE.isPublished = function (season, week) {
  var year = season || EGE.currentSeason;
  var weeks = EGE.publishedWeeks[year] || [];
  return weeks.indexOf(Number(week)) !== -1;
};

/* --- getting at the games ------------------------------------------------ */

/* Every season with a file behind it, oldest first. */
EGE.seasonsPlayed = function () {
  return Object.keys(EGE.stats).map(Number).sort(function (a, b) { return a - b; });
};

/* A game arrives from the file knowing its week and its opponent but not
   whose it is or which season it belongs to. Stamping that on once means
   nothing downstream has to be told twice. */
function stamp(year, slug, games) {
  games.forEach(function (game) {
    if (game.season === undefined) {
      game.season = Number(year);
      game.slug = slug;
    }
  });
  return games;
}

EGE.gamesFor = function (player, season) {
  var year = season || EGE.currentSeason;
  var forSeason = EGE.stats[year];
  if (!player || !forSeason) { return []; }
  return stamp(year, player.slug, forSeason.games[player.slug] || []);
};

EGE.gameInWeek = function (player, week, season) {
  return EGE.gamesFor(player, season).filter(function (game) {
    return game.week === Number(week);
  })[0] || null;
};

/* Every player with a game in this week, in roster order. */
EGE.gamesInWeek = function (week, season) {
  return EGE.players.map(function (player) {
    var game = EGE.gameInWeek(player, week, season);
    return game ? { player: player, game: game } : null;
  }).filter(Boolean);
};

/* How many weeks the season runs to, across every player. */
EGE.lastWeek = function (season) {
  var year = season || EGE.currentSeason;
  var forSeason = EGE.stats[year];
  if (!forSeason) { return 0; }

  var last = 0;
  Object.keys(forSeason.games).forEach(function (slug) {
    forSeason.games[slug].forEach(function (game) {
      if (game.week > last) { last = game.week; }
    });
  });
  return last;
};

/* Every week that has a game in it, in order. */
EGE.weeksIn = function (season) {
  var year = season || EGE.currentSeason;
  var forSeason = EGE.stats[year];
  if (!forSeason) { return []; }

  var seen = {};
  Object.keys(forSeason.games).forEach(function (slug) {
    forSeason.games[slug].forEach(function (game) { seen[game.week] = true; });
  });
  return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
};

/* --- played, and published ----------------------------------------------- */

/* Whether the file has a score in it. The admin's view — it says nothing
   about whether anybody else can see it. */
EGE.hasResult = function (game) {
  return Boolean(game && game.result &&
    typeof game.result.teamScore === 'number' &&
    typeof game.result.opponentScore === 'number');
};

/* Whether the game is played as far as the site is concerned: a score in the
   file, and a week the admin has put out. */
EGE.isFinal = function (game) {
  return EGE.hasResult(game) && EGE.isPublished(game.season, game.week);
};

EGE.gamesPlayed = function (player, season) {
  return EGE.gamesFor(player, season).filter(EGE.isFinal);
};

EGE.recordFor = function (player, season) {
  var wins = 0;
  var losses = 0;
  EGE.gamesPlayed(player, season).forEach(function (game) {
    if (game.result.teamScore > game.result.opponentScore) { wins += 1; } else { losses += 1; }
  });
  return { wins: wins, losses: losses, text: wins + '-' + losses };
};

/* The games scouts will attend. Only worth reading when the player has Intel
   for that season. */
EGE.scoutedGames = function (player, season) {
  return EGE.gamesFor(player, season).filter(function (game) { return game.scouts; });
};

/* --- the postseason ------------------------------------------------------ */

/* Every week with a playoff game in it, in order.

   The postseason is not a week number. Five schools in four states play their
   first round across three different Saturdays, and a season could open its
   playoffs at week 12 or week 15 -- so which weeks are postseason is read off
   the games rather than counted from a constant. */
EGE.playoffWeeks = function (season) {
  var year = season || EGE.currentSeason;
  var forSeason = EGE.stats[year];
  if (!forSeason) { return []; }

  var seen = {};
  Object.keys(forSeason.games).forEach(function (slug) {
    forSeason.games[slug].forEach(function (game) {
      if (game.playoff) { seen[game.week] = true; }
    });
  });
  return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
};

/* Which round of the postseason a week is, counting from one, or 0 for a
   regular-season week. It is the week's place in the list above rather than
   a subtraction, so a gap between two playoff weeks does not invent a round
   nobody played. */
EGE.playoffRound = function (week, season) {
  return EGE.playoffWeeks(season).indexOf(Number(week)) + 1;
};

/* --- boosters ------------------------------------------------------------ */

/* What was riding on a game.

   A published week reads from the season file, where the admin wrote it, and
   that is the record for good — which is what lets the row behind it be
   cleared out of Supabase at the end of a season. A week still to come reads
   from Supabase, because that is where a player putting a sticker on a game
   this afternoon puts it. */
EGE.boosterOn = function (player, game) {
  if (!game) { return null; }

  if (game.booster) {
    var item = EGE.shopItem(game.booster);
    return {
      key: game.booster,
      name: item ? item.name : game.booster,
      multiplier: EGE.multiplierFor(game.booster),
      hardcoded: true
    };
  }

  var live = ((EGE.gameBoosters || {})[player.slug] || {})[game.week];
  if (!live || live.season !== game.season) { return null; }

  return {
    key: live.item_key,
    name: live.item_name,
    multiplier: EGE.multiplierFor(live.item_key),
    id: live.id,
    hardcoded: false
  };
};

/* --- what a game paid ----------------------------------------------------- */

/* The credits a published game earned, which is what the marker on the
   schedule row is showing. Nothing is owed for a week nobody has put out. */
EGE.creditsFromGame = function (player, game) {
  if (!EGE.isFinal(game)) { return 0; }
  return EGE.economy.touchdownCredits(player, game.stats);
};
