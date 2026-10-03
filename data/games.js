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
   once. Conference title games are not standings games.

   `through`, when given, stops at that week -- how the table looked then,
   which is what the week-on-week movement is measured against. */
EGE.conferenceResults = function (conference, season, through) {
  var year = season || EGE.currentSeason;
  var upTo = typeof through === 'number' ? through : Infinity;
  var members = {};
  Object.keys(conference.divisions).forEach(function (division) {
    conference.divisions[division].forEach(function (school) { members[school] = true; });
  });

  var results = conference.games.filter(function (game) {
    return EGE.isPublished(year, game.week) && game.week <= upTo;
  });

  var seen = {};
  EGE.players.forEach(function (player) {
    var team = EGE.teamFor(player, year);
    if (!team || !members[team.school]) { return; }
    EGE.gamesPlayed(player, year).forEach(function (game) {
      if (!game.conference || game.playoff || !members[game.opponent]) { return; }
      if (game.week > upTo) { return; }
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
   flickers between loads.

   Each row also carries its conference `streak` -- { won, count, text:
   'W3' }, or null before a game -- and, with `through`, the table is the
   one as it stood after that week. */
EGE.divisionTable = function (school, season, through) {
  var year = season || EGE.currentSeason;
  var found = EGE.conferenceOf(school, year);
  if (!found) { return null; }

  var results = EGE.conferenceResults(found.conference, year, through);
  var rows = {};
  found.conference.divisions[found.division].forEach(function (name) {
    rows[name] = { school: name, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, games: [] };
  });

  results.forEach(function (game) {
    [[game.home, game.score[0], game.score[1]],
     [game.away, game.score[1], game.score[0]]].forEach(function (side) {
      var row = rows[side[0]];
      if (!row) { return; }
      if (side[1] > side[2]) { row.wins += 1; } else { row.losses += 1; }
      row.pointsFor += side[1];
      row.pointsAgainst += side[2];
      row.games.push({ week: game.week, won: side[1] > side[2] });
    });
  });

  /* The run each school is on in conference play, counted back from its
     latest conference game. */
  Object.keys(rows).forEach(function (name) {
    var games = rows[name].games.sort(function (a, b) { return a.week - b.week; });
    delete rows[name].games;
    if (!games.length) { rows[name].streak = null; return; }
    var latest = games[games.length - 1].won;
    var count = 0;
    for (var i = games.length - 1; i >= 0 && games[i].won === latest; i -= 1) { count += 1; }
    rows[name].streak = { won: latest, count: count, text: (latest ? 'W' : 'L') + count };
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
   live one once the team has played its last postseason game -- beaten in a
   playoff, champions, or through its bowl -- or was never in the postseason
   at all once it has started without it. A team still going, or waiting on
   its next game, is not.

   The last game is the last one in the season file. A high school team that
   loses a playoff game has nothing after it, and neither does a champion;
   a college team that loses its conference title game still has its bowl
   to come, so a loss alone does not end a season. */
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
  return !EGE.gamesFor(player, year).some(function (game) { return game.week > last.week; });
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

  /* Nobody knows where they are going past the postseason's first week
     until that week is out: the bowls are picked after the conference title
     games. Illinois has no title game, so without this its bowl would be on
     the schedule the moment the regular season ended. */
  var postseason = EGE.playoffWeeks(season);
  var opening = postseason.length ? postseason[0] : Infinity;
  var picked = !postseason.length || EGE.isPublished(season || EGE.currentSeason, opening);

  return games.filter(function (game) {
    if (!game.playoff || EGE.isPublished(game.season, game.week)) { return true; }
    return game.week <= next && (game.week === opening || picked);
  });
};

/* Whether the player's bracket can be shown yet: a game of that tournament
   on the schedule they can see -- a draw with their school in it says they
   made it, so it waits. For a high school draw that is the first playoff
   game on the schedule, because the playoffs are the whole of it.
   A college postseason starts before its bracket does -- Ohio State's
   conference title game is a playoff game, and the College Football Playoff
   is picked after it -- so a draw with the school in it waits for a game in
   or past the draw's first round, which the schedule only shows once the
   title game is out. */
EGE.bracketInSight = function (player, season) {
  var year = season || EGE.currentSeason;
  if (!EGE.bracketFor || !EGE.bracketFor(player, year)) { return false; }
  var rounds = ((EGE.stats[year] || {}).playoffs || {})[EGE.teamKeyFor(player, year)] || [];
  var from = rounds.length ? rounds[0].week : -Infinity;
  return EGE.scheduleFor(player, year).some(function (game) {
    return game.playoff && game.week >= from;
  });
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

/* --- how good the defense across the way is ------------------------------

   Every opponent's defense, graded A to F for the player looking at it: a
   back is graded on the run defense he is about to run into, everybody else
   -- the quarterbacks and the receivers -- on the pass defense. A stingy
   run defense is an A for Cooper or Sam, a sieve is an F.

   The numbers are each school's real yards allowed a game that season, from
   data/defenses.js, ranked among every school at its level: FBS against
   FBS, FCS against FCS. A grade is a fifth of that list -- the top fifth an
   A, the bottom fifth an F. A season with no table yet borrows the latest
   one before it, so a new season's schedule is graded from the day its file
   goes in. High schools have no numbers anywhere and get no grade. */

EGE.GRADES = ['A', 'B', 'C', 'D', 'F'];

/* Which side of the ball a position runs into. */
EGE.defenseSide = function (position) {
  return position === 'RB' || position === 'FB' ? 'rush' : 'pass';
};

EGE.defenseTable = function (season) {
  var tables = EGE.defenses || {};
  var years = Object.keys(tables).map(Number).filter(function (year) {
    return year <= season;
  }).sort(function (a, b) { return b - a; });
  return years.length ? { season: years[0], schools: tables[years[0]] } : null;
};

/* The grade a game's opponent gets for this player, or null where there is
   nothing to grade on:
     { letter: 'A', side: 'rush', yards: 78.1, perPlay: 2.5, rank: 1,
       of: 125, level: 'FBS', season: 2020, text: 'Run defense: ...' } */
EGE.defenseGrade = function (player, game) {
  if (!game || game.bye || !game.opponent) { return null; }
  if (EGE.tierFor(game.season) !== 'college') { return null; }

  var table = EGE.defenseTable(game.season);
  var school = table && table.schools[game.opponent];
  if (!school) { return null; }

  var side = EGE.defenseSide(EGE.positionFor(player, game.season));
  var rank = side === 'rush' ? school.rushRank : school.passRank;
  var share = (rank - 1) / school.of;
  var letter = EGE.GRADES[Math.min(EGE.GRADES.length - 1, Math.floor(share * EGE.GRADES.length))];
  var yards = side === 'rush' ? school.rush : school.pass;
  var perPlay = side === 'rush' ? school.perCarry : school.perAttempt;
  perPlay = typeof perPlay === 'number' ? perPlay.toFixed(1) : perPlay;
  var from = school.from || table.season;

  return {
    letter: letter,
    side: side,
    yards: yards,
    perPlay: perPlay,
    rank: rank,
    of: school.of,
    level: school.level,
    season: from,
    text: (side === 'rush' ? 'Run' : 'Pass') + ' defense: ' + letter + ' — ' +
      yards + ' ' + (side === 'rush' ? 'rushing' : 'passing') + ' yards a game allowed (' +
      perPlay + ' a ' + (side === 'rush' ? 'carry' : 'throw') + '), ' +
      EGE.ordinal(rank).toLowerCase() + ' of ' + school.of + ' ' + school.level +
      ' in ' + from
  };
};

/* --- the teams ------------------------------------------------------------ */

/* A school's address on the Teams page -- #teams/ohio-state -- and back. */
EGE.teamSlug = function (key) {
  var team = EGE.teams[key];
  return team ? team.school.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : key;
};

EGE.teamKeyBySlug = function (slug) {
  return Object.keys(EGE.teams).filter(function (key) { return EGE.teamSlug(key) === slug; })[0] || null;
};

/* Every school one of the six is at that season, as
   { key, team, players: [...] }, in the order the players are listed. */
EGE.teamsIn = function (season) {
  var year = season || EGE.currentSeason;
  var byKey = {};
  var order = [];
  EGE.players.forEach(function (player) {
    var key = EGE.teamKeyFor(player, year);
    if (!key || !EGE.teams[key]) { return; }
    if (!byKey[key]) {
      byKey[key] = { key: key, team: EGE.teams[key], players: [] };
      order.push(byKey[key]);
    }
    byKey[key].players.push(player);
  });
  return order;
};

/* What a year of college is called, 1 to 5. */
EGE.CLASSES = [null,
  { short: 'FR', name: 'Freshman' },
  { short: 'SO', name: 'Sophomore' },
  { short: 'JR', name: 'Junior' },
  { short: 'SR', name: 'Senior' },
  { short: 'GR', name: 'Fifth year' }];

/* Which year of college one of the six is in that season, by eligibility
   (EGE.eligibilityYearFor -- a redshirt year does not count once it is
   behind him). Null in high school. */
EGE.collegeYearFor = function (player, season) {
  return EGE.eligibilityYearFor(player, season);
};

/* The numbers a position wears when it has to be given a new one, in the
   order they are tried: a tight end goes to the 80s first, a back to the
   20s, 30s and 40s. */
var JERSEY_RANGES = {
  QB: [[1, 19]],
  RB: [[20, 49], [1, 19]],
  WR: [[1, 19], [80, 89]],
  TE: [[80, 89], [40, 49], [1, 19]]
};

function freeJersey(position, wanted, used) {
  var ranges = JERSEY_RANGES[position] || [[1, 99]];
  for (var r = 0; r < ranges.length; r += 1) {
    var open = [];
    for (var n = ranges[r][0]; n <= ranges[r][1]; n += 1) {
      if (!used[n]) { open.push(n); }
    }
    if (open.length) {
      /* The nearest free number to the one he wore, so a 87 becomes an 86
         or an 88 rather than an 80. */
      open.sort(function (a, b) {
        return (Math.abs(a - wanted) - Math.abs(b - wanted)) || (a - b);
      });
      return open[0];
    }
  }
  return null;
}

/* A team's position rooms that season: the real roster from
   data/rosters.js with the six on that team put in at their positions, each
   room ordered by overall, best first, so a room reads as a depth chart and
   the six land wherever their overall puts them. A season with no roster
   yet borrows the latest one before it. Null for a school with no roster at
   all (every high school).

   Nobody shares a number. The six keep theirs, and a real player wearing
   one already taken -- one of the six's, or a teammate's further up the
   rooms -- is given the nearest free number his position wears, with the
   one he really wore kept as `realJersey`. Andrew Parr is Alabama's 87, so
   Miller Forristall becomes an 85 -- the nearest tight end number nobody
   on the team wears. */
EGE.rosterFor = function (teamKey, season) {
  var year = season || EGE.currentSeason;
  var rosters = EGE.rosters || {};
  var years = Object.keys(rosters).map(Number).filter(function (y) {
    return y <= year && rosters[y][teamKey];
  }).sort(function (a, b) { return b - a; });
  var ours = EGE.players.filter(function (player) {
    return EGE.teamKeyFor(player, year) === teamKey;
  });
  if (!years.length && !ours.length) { return null; }

  var base = years.length ? rosters[years[0]][teamKey] : {};
  var positions = ['QB', 'RB', 'WR', 'TE'];

  var used = {};
  ours.forEach(function (player) {
    if (typeof player.jersey === 'number') { used[player.jersey] = true; }
  });

  var real = {};
  positions.forEach(function (position) {
    real[position] = (base[position] || []).filter(function (row) {
      return row && row.name;
    }).map(function (row) {
      var copy = {};
      Object.keys(row).forEach(function (k) { copy[k] = row[k]; });
      return copy;
    });
  });
  /* Everybody whose number is free keeps it -- players who stayed before
     players who later transferred out, then the best first -- before
     anybody is moved -- so a player moved off one of the six's numbers never
     lands on a teammate's and moves him in turn. */
  var clashes = [];
  positions.reduce(function (all, position) {
    return all.concat(real[position].map(function (row) { return { row: row, position: position }; }));
  }, []).sort(function (a, b) {
    /* A player who later left has ESPN's number from his next school, so a
       teammate who stayed keeps a shared number before him. */
    return ((a.row.left ? 1 : 0) - (b.row.left ? 1 : 0)) ||
      ((b.row.overall || 0) - (a.row.overall || 0));
  }).forEach(function (entry) {
    var row = entry.row;
    if (typeof row.jersey !== 'number') { return; }
    if (used[row.jersey]) { clashes.push(entry); } else { used[row.jersey] = true; }
  });
  clashes.forEach(function (entry) {
    var row = entry.row;
    var moved = freeJersey(entry.position, row.jersey, used);
    if (moved === null) { return; }
    row.realJersey = row.jersey;
    row.jersey = moved;
    used[moved] = true;
  });

  var rooms = {};
  positions.forEach(function (position) {
    rooms[position] = ours.filter(function (player) {
      return EGE.positionFor(player, year) === position;
    }).map(function (player) {
      return { name: player.name, jersey: player.jersey, height: player.height,
               weight: player.weight, year: EGE.collegeYearFor(player, year),
               redshirting: Boolean(player.redshirt === year),
               overall: EGE.overallFor(player), player: player };
    }).concat(real[position]).sort(function (a, b) {
      return ((b.overall || 0) - (a.overall || 0)) || (b.player ? 1 : 0) - (a.player ? 1 : 0);
    });
  });
  rooms.season = years.length ? years[0] : year;
  /* Whether there is a real roster behind the rooms, or only the six. */
  rooms.real = years.length > 0;
  return rooms;
};

/* An ESPN headshot for a roster player, or null where ESPN has none. */
EGE.rosterPhoto = function (row) {
  if (!row || !row.photo || !row.espn) { return null; }
  return 'https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/' +
    row.espn + '.png&w=96&h=70';
};

/* The quarterbacks a player can spend a QB Connection on: everybody in his
   team's quarterback room that season, the six's own included, and never
   himself. */
EGE.quarterbacksFor = function (player, season) {
  var key = EGE.teamKeyFor(player, season);
  var rooms = key ? EGE.rosterFor(key, season) : null;
  if (!rooms) { return []; }
  return rooms.QB.filter(function (row) {
    return !(row.player && row.player.slug === player.slug);
  }).map(function (row) { return row.name; });
};

/* A school's whole record, every game it has played that is out: its
   conference games (EGE.conferenceResults), the games outside the league it
   really played (the season's `nonConference` list in data/conferences.js),
   and any game against one of the six's schools, read from the season file.
   For one of the six's schools it is simply that school's games. Null for a
   season whose races have no outside games to count -- 2020's are drawn,
   and a record of conference games only would just repeat the W-L. */
EGE.overallRecord = function (school, season, through) {
  var year = season || EGE.currentSeason;
  var upTo = typeof through === 'number' ? through : Infinity;
  var found = EGE.conferenceOf(school, year);
  if (!found || !found.conference.nonConference) { return null; }

  var record = { wins: 0, losses: 0 };
  function count(won) { if (won) { record.wins += 1; } else { record.losses += 1; } }

  var own = EGE.players.filter(function (player) {
    var team = EGE.teamFor(player, year);
    return team && team.school === school;
  })[0];
  if (own) {
    EGE.gamesPlayed(own, year).forEach(function (game) {
      if (game.week <= upTo) { count(game.result.teamScore > game.result.opponentScore); }
    });
    return record;
  }

  EGE.conferenceResults(found.conference, year, through).forEach(function (game) {
    if (game.home === school) { count(game.score[0] > game.score[1]); }
    if (game.away === school) { count(game.score[1] > game.score[0]); }
  });
  found.conference.nonConference.forEach(function (game) {
    if (game.school === school && game.week <= upTo && EGE.isPublished(year, game.week)) {
      count(game.score[0] > game.score[1]);
    }
  });
  /* Outside the league against one of the six -- Oregon at Ohio State. A
     game is kept once, however many of the six play in it. */
  var seen = {};
  EGE.players.forEach(function (player) {
    EGE.gamesPlayed(player, year).forEach(function (game) {
      if (game.opponent !== school || game.conference || game.week > upTo) { return; }
      var key = game.week + '|' + EGE.teamFor(player, year).school;
      if (seen[key]) { return; }
      seen[key] = true;
      count(game.result.opponentScore > game.result.teamScore);
    });
  });
  return record;
};

/* The whole conference a school plays in that season, a division table at a
   time, the school's own division first:
     { conference: 'Big Ten', school, week, tables: [divisionTable, ...] }
   Null for a school with no race in data/conferences.js.

   Each row carries `change`: how many places it has moved since the week
   before the latest one published -- 2 up, -1 down, 0 for none -- or null
   while there is no earlier table with conference games in it to move
   from. And `overall`, its whole record from EGE.overallRecord (null in a
   season with no outside games to count), which moves every week a game is
   published, conference game or not. */
EGE.conferenceTables = function (school, season) {
  var year = season || EGE.currentSeason;
  var found = EGE.conferenceOf(school, year);
  if (!found) { return null; }
  var divisions = Object.keys(found.conference.divisions);
  divisions.sort(function (a, b) {
    return (b === found.division) - (a === found.division);
  });

  var published = (EGE.publishedWeeks[year] || []).slice().sort(function (a, b) { return a - b; });
  var latest = published.length ? published[published.length - 1] : null;
  var before = published.length > 1 ? published[published.length - 2] : null;

  function started(table) {
    return table.rows.some(function (row) { return row.wins + row.losses; });
  }

  return {
    conference: found.conference.name,
    school: school,
    week: latest,
    /* Whether the rows carry an overall record (see EGE.overallRecord). */
    overall: Boolean(found.conference.nonConference),
    tables: divisions.map(function (division) {
      var first = found.conference.divisions[division][0];
      var table = EGE.divisionTable(first, year);
      var then = before !== null ? EGE.divisionTable(first, year, before) : null;
      var places = {};
      if (then && started(then)) {
        then.rows.forEach(function (row, i) { places[row.school] = i + 1; });
      }
      table.rows.forEach(function (row, i) {
        row.change = started(table) && places[row.school] ? places[row.school] - (i + 1) : null;
        row.overall = EGE.overallRecord(row.school, year);
      });
      return table;
    })
  };
};

/* --- injuries ------------------------------------------------------------

   A game marked `injured: true` in the season file is one the player sits
   out hurt, with what in `injury` and, optionally, how healthy he is that
   week as a percentage in `health`. The player page shows it as an injury
   report -- only while that week is the one being played, which is the
   first week of the live season not yet published. Before it nobody knows,
   and once the week is out the report goes with it unless the next week is
   marked too. */

/* The week the live season is on: the first one not yet published, or null
   once every week is out. */
EGE.currentWeek = function (season) {
  var year = season || EGE.currentSeason;
  var ahead = EGE.weeksIn(year).filter(function (week) {
    return !EGE.isPublished(year, week);
  });
  return ahead.length ? ahead[0] : null;
};

/* What the injury report says, or null when there is nothing to report:
     { week, injury: 'Hamstring', health: 60, status: 'Out',
       back: 8 (the next week he is not marked, or null) } */
EGE.injuryFor = function (player, season) {
  var year = season || EGE.currentSeason;
  if (year !== EGE.currentSeason) { return null; }
  var week = EGE.currentWeek(year);
  if (week === null) { return null; }

  var game = EGE.gameInWeek(player, week, year);
  if (!game || !game.injured) { return null; }

  var health = typeof game.health === 'number'
    ? Math.max(0, Math.min(100, Math.round(game.health))) : null;
  var back = EGE.gamesFor(player, year).filter(function (other) {
    return other.week > week && !other.bye && !other.injured;
  }).sort(function (a, b) { return a.week - b.week; })[0];

  return {
    week: week,
    injury: game.injury || null,
    health: health,
    status: 'Out',
    back: back ? back.week : null
  };
};

/* --- how many boosters a season can take ----------------------------------

   Five a season at most, and no more than two 2.5x, three 2.0x and four
   1.5x of them (`boosterSeasonLimit` and each booster's `seasonLimit` in
   data/shop.js). What counts is what is on the season's games: stuck on
   from Supabase, or written into the season file once the week was out. */
EGE.boostersUsed = function (player, season) {
  var year = season || EGE.currentSeason;
  var used = { total: 0, byKey: {} };
  EGE.gamesFor(player, year).forEach(function (game) {
    var booster = EGE.boosterOn(player, game);
    if (!booster) { return; }
    used.total += 1;
    used.byKey[booster.key] = (used.byKey[booster.key] || 0) + 1;
  });
  return used;
};

/* Whether one more of this booster can go on this season's games, and how
   many of it and in all are left: { ok, reason, left, totalLeft }. */
EGE.boosterRoom = function (player, itemKey, season) {
  var item = EGE.shopItem(itemKey);
  var used = EGE.boostersUsed(player, season);
  var total = EGE.shop.boosterSeasonLimit || Infinity;
  var limit = item && typeof item.seasonLimit === 'number' ? item.seasonLimit : Infinity;
  var mine = used.byKey[itemKey] || 0;
  var room = {
    ok: true,
    reason: null,
    used: mine,
    limit: limit,
    left: Math.max(0, limit - mine),
    totalUsed: used.total,
    totalLimit: total,
    totalLeft: Math.max(0, total - used.total)
  };
  if (used.total >= total) {
    room.ok = false;
    room.reason = 'That is all ' + total + ' boosters for this season \u2014 peel one off an ' +
      'unplayed game to move it.';
  } else if (mine >= limit) {
    room.ok = false;
    room.reason = 'Only ' + limit + ' ' + (item ? item.name : 'of those') + 's a season, and ' +
      'they are all on games.';
  }
  return room;
};
