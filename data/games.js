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

/* The run the team is on: how many results in a row, counting back from the
   latest published game, have gone the same way. Null before a game has been
   played. A tie counts as a loss, as it does in the record. */
EGE.streakFor = function (player, season) {
  var played = EGE.gamesPlayed(player, season).slice().sort(function (a, b) {
    return a.week - b.week;
  });
  if (!played.length) { return null; }

  function won(game) { return game.result.teamScore > game.result.opponentScore; }

  var latest = won(played[played.length - 1]);
  var count = 0;
  for (var i = played.length - 1; i >= 0 && won(played[i]) === latest; i -= 1) {
    count += 1;
  }
  return { won: latest, count: count, text: (latest ? 'W' : 'L') + count };
};

/* --- the conference races ---------------------------------------------- */

/* The conference and division a school plays in that season, from
   data/conferences.js, or null for one that is not in there. */
EGE.conferenceOf = function (school, season) {
  var year = season || EGE.currentSeason;
  var leagues = (EGE.conferences || {})[year] || {};
  var found = null;
  Object.keys(leagues).forEach(function (id) {
    var divisions = leagues[id].divisions;
    Object.keys(divisions).forEach(function (division) {
      if (!found && divisions[division].indexOf(school) !== -1) {
        found = { id: id, conference: leagues[id], division: division };
      }
    });
  });
  return found;
};

/* Every conference game in the books so far, as { week, home, away, score }.
   Everybody else's are in data/conferences.js and count once their week is
   published; the six's own come from the season files once they are final,
   exactly as the schedule shows them. Ohio State's are there twice over (two
   players) and Ohio State-Illinois from both sides, so each game is kept
   once. Conference title games are not standings games. */
EGE.conferenceResults = function (conference, season) {
  var year = season || EGE.currentSeason;
  var members = {};
  Object.keys(conference.divisions).forEach(function (division) {
    conference.divisions[division].forEach(function (school) { members[school] = true; });
  });

  var results = conference.games.filter(function (game) {
    return EGE.isPublished(year, game.week);
  });

  var seen = {};
  EGE.players.forEach(function (player) {
    var team = EGE.teamFor(player, year);
    if (!team || !members[team.school]) { return; }
    EGE.gamesPlayed(player, year).forEach(function (game) {
      if (!game.conference || game.playoff || !members[game.opponent]) { return; }
      var key = game.week + '|' + [team.school, game.opponent].sort().join('|');
      if (seen[key]) { return; }
      seen[key] = true;
      var ours = game.result.teamScore;
      var theirs = game.result.opponentScore;
      results.push(game.home
        ? { week: game.week, home: team.school, away: game.opponent, score: [ours, theirs] }
        : { week: game.week, home: game.opponent, away: team.school, score: [theirs, ours] });
    });
  });
  return results;
};

/* A division's table as it stands, top to bottom: each school's conference
   wins and losses, and points for and against in those games.

   Ordered the way a conference orders one: by winning percentage (a school
   yet to play counts as .500), then more wins, then fewer losses. Schools
   still level are split on their games against each other, then on
   conference point differential, then alphabetically so the order never
   flickers between loads. */
EGE.divisionTable = function (school, season) {
  var year = season || EGE.currentSeason;
  var found = EGE.conferenceOf(school, year);
  if (!found) { return null; }

  var results = EGE.conferenceResults(found.conference, year);
  var rows = {};
  found.conference.divisions[found.division].forEach(function (name) {
    rows[name] = { school: name, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
  });

  results.forEach(function (game) {
    [[game.home, game.score[0], game.score[1]],
     [game.away, game.score[1], game.score[0]]].forEach(function (side) {
      var row = rows[side[0]];
      if (!row) { return; }
      if (side[1] > side[2]) { row.wins += 1; } else { row.losses += 1; }
      row.pointsFor += side[1];
      row.pointsAgainst += side[2];
    });
  });

  function pct(row) {
    var played = row.wins + row.losses;
    return played ? row.wins / played : 0.5;
  }
  function level(a, b) {
    return pct(a) === pct(b) && a.wins === b.wins && a.losses === b.losses;
  }
  var list = Object.keys(rows).map(function (name) { return rows[name]; });

  /* Head to head only means anything among the schools actually level. */
  list.forEach(function (row) {
    var group = {};
    list.forEach(function (other) { if (level(row, other)) { group[other.school] = true; } });
    var won = 0;
    var played = 0;
    results.forEach(function (game) {
      if (!group[game.home] || !group[game.away]) { return; }
      if (game.home !== row.school && game.away !== row.school) { return; }
      played += 1;
      var ours = game.home === row.school ? game.score[0] : game.score[1];
      var theirs = game.home === row.school ? game.score[1] : game.score[0];
      if (ours > theirs) { won += 1; }
    });
    row.headToHead = played ? won / played : 0.5;
  });

  list.sort(function (a, b) {
    return (pct(b) - pct(a)) || (b.wins - a.wins) || (a.losses - b.losses) ||
      (b.headToHead - a.headToHead) ||
      ((b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)) ||
      a.school.localeCompare(b.school);
  });
  return { conference: found.conference.name, division: found.division, rows: list };
};

/* Where a player's team stands in its division on the season on show:
   { league: 'Big Ten East', place: 2, wins, losses }. The place is null until
   the team has a conference result to be placed on. A school with no race
   in data/conferences.js falls back to its league and no place; a season
   with no school, to null. */
EGE.standingFor = function (player, season) {
  var year = season || EGE.currentSeason;
  var team = EGE.teamFor(player, year);
  if (!team) { return null; }

  var table = EGE.divisionTable(team.school, year);
  if (!table) { return team.league ? { league: team.league, place: null } : null; }

  var at = 0;
  table.rows.forEach(function (row, i) { if (row.school === team.school) { at = i; } });
  var row = table.rows[at];
  return {
    league: table.division,
    conference: table.conference,
    place: row.wins + row.losses ? at + 1 : null,
    wins: row.wins,
    losses: row.losses
  };
};

/* 1ST, 2ND, 3RD, 4TH ... 11TH, 12TH, 13TH ... 21ST. */
EGE.ordinal = function (number) {
  var tens = number % 100;
  var suffix = (tens >= 11 && tens <= 13) ? 'TH'
    : ({ 1: 'ST', 2: 'ND', 3: 'RD' })[number % 10] || 'TH';
  return number + suffix;
};

/* Whether a team's season is done: any season before the live one, or the
   live one once the team is out of the playoffs -- beaten in a playoff game,
   or champions, or never in them at all once they have started without it.
   A team still going, or waiting on its next game, is not. */
EGE.seasonOverFor = function (player, season) {
  var year = season || EGE.currentSeason;
  if (year < EGE.currentSeason) { return true; }

  /* Missed the playoffs: none of the player's games has the flag, and the
     first week of them is out. Until then a team with its regular season
     finished could still be waiting to hear. */
  var inPostseason = EGE.gamesFor(player, year).some(function (game) { return game.playoff; });
  if (!inPostseason) {
    var postseason = EGE.playoffWeeks(year);
    return postseason.length > 0 && EGE.isPublished(year, postseason[0]);
  }

  var played = EGE.gamesPlayed(player, year).slice().sort(function (a, b) {
    return a.week - b.week;
  });
  var last = played[played.length - 1];
  if (!last || !last.playoff) { return false; }
  if (last.result.teamScore <= last.result.opponentScore) { return true; }

  var state = EGE.bracketState ? EGE.bracketState(player, year) : null;
  return Boolean(state && state.champion && state.champion === state.bracket.us);
};

/* The games scouts will attend. Only worth reading when the player has Intel
   for that season. Only the games they can see coming count: a scout at a
   playoff game past the next one is a playoff game past the next one. */
EGE.scoutedGames = function (player, season) {
  return EGE.scheduleFor(player, season).filter(function (game) { return game.scouts; });
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

/* --- how far ahead a player can see ----------------------------------------

   The regular season is drawn up before it starts, and every fixture in it
   is on the schedule from the first week. The postseason is not. Nobody
   knows they are in it until the regular season is over, or who they play
   next until they have won this week -- and a schedule that listed a state
   final in October would be telling a player they get there.

   So a playoff game only comes into sight once every week before it on the
   player's schedule is out, which makes it the next game or one already
   played, and nothing past it does. Out rather than played: a bye has no
   score, and is behind them once its week is published, the week after it
   being the next matchup from then on. A playoff week that is published is
   in sight whatever else is, since its result is out for everyone.

   The file still holds the whole postseason, the way it holds every result
   before its week is published. This is what the page shows, not a lock. */

/* The schedule as the player can see it: every regular-season fixture, and
   the postseason as far as the next game and no further. */
EGE.scheduleFor = function (player, season) {
  var games = EGE.gamesFor(player, season);
  var ahead = games.filter(function (game) {
    return !EGE.isPublished(game.season, game.week);
  }).map(function (game) { return game.week; });
  var next = ahead.length ? Math.min.apply(null, ahead) : Infinity;

  return games.filter(function (game) {
    return !game.playoff || game.week <= next || EGE.isPublished(game.season, game.week);
  });
};

/* Whether the player's postseason is in sight yet: a playoff game on the
   schedule they can see. Until it is there is no bracket to show them
   either, because a draw with their school in it says they made it. */
EGE.postseasonInSight = function (player, season) {
  return EGE.scheduleFor(player, season).some(function (game) { return game.playoff; });
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
  return EGE.economy.gameCredits(player, game.stats, game.season);
};
