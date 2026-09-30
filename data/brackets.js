/* ==========================================================================
   EGE Football — the playoff brackets
   One bracket per school that made its state playoffs, a season at a time,
   as the field was drawn: every first-round matchup and every seed, and
   nothing else.

   Empty on purpose
   ----------------
   There are no scores in here and nobody is advanced. A bracket is the shape
   of a tournament before it is played, and that is all this is: the later
   rounds are blank slots that fill in as the weeks are published. What
   happened in a game lives in stats/{year}.js like every other game, because
   a playoff game is a game.

   The shape
   ---------
   Every one of these is the same tournament at one size or another: two
   halves of first-round matchups, each half narrowing to one survivor, and
   the two survivors meeting in the final. Most are thirty-two teams, eight
   matchups a half narrowing 8 -> 4 -> 2 -> 1, and that is why one renderer
   draws an Illinois bracket, a North Carolina bracket with byes in it and a
   Florida bracket cut into four regions without knowing which is which. San
   Diego's Open Division is four teams, one semifinal a half. How many rounds
   a half runs to is how many `rounds` a bracket lists, and nothing else has
   to be told.

   `blocks` is how a side is labelled. Illinois ran its halves straight
   through in 2018, one unnamed block of eight each, and printed quadrants in
   2019; North Carolina names each half; Florida plays two regions a side, so
   a side is two named blocks of four. The renderer just lays the blocks out
   in order and writes the names it finds.

   `us` is the school whose page the bracket is on -- the one row drawn in
   the site's own ink rather than grey. It is matched by name, so it has to
   read exactly as it does in the matchup below.

   A matchup with no `b` is a bye.
   ========================================================================== */

window.EGE = window.EGE || {};

(function () {
  'use strict';

  /* A matchup, and a first-round bye. Seeds are what the bracket printed,
     which is a straight 1..32 in one state and 1..16 a side in another. */
  function m(seedA, nameA, seedB, nameB) {
    return { a: { seed: seedA, name: nameA }, b: { seed: seedB, name: nameB } };
  }
  function bye(seed, name) {
    return { a: { seed: seed, name: name }, b: null };
  }

  /* Keyed by season, and within a season by the team key in data/players.js,
     so a player's bracket is whatever his school was playing in that year. A
     bracket belongs to one year's playoffs: a season with no draws written in
     yet has no bracket rather than last year's, and a school with no entry
     for a season has none that season -- the switcher does not offer one. */
  EGE.brackets = {};

  EGE.brackets[2018] = {

    /* --- Sam Stogsdill -------------------------------------------------- */
    normal: {
      title: 'IHSA Class 7A',
      us: 'Normal Community',
      rounds: [
        { label: 'First Round' },
        { label: 'Second Round' },
        { label: 'Quarterfinal' },
        { label: 'Semifinal' }
      ],
      final: { label: 'State Final', date: 'Nov 24' },
      left: [
        { label: null, games: [
          m(1, 'Simeon', 32, 'Rockford East'),
          m(16, 'Harlem', 17, 'Lincoln-Way West'),
          m(8, 'Nazareth Academy', 25, 'Andrew'),
          m(9, 'Hersey', 24, 'Lincoln-Way Central'),
          m(4, 'Batavia', 29, 'Granite City'),
          m(13, 'Moline', 20, 'Glenbrook North'),
          m(5, 'Willowbrook', 28, 'Lincoln Park'),
          m(12, 'Maine West', 21, 'Benet Academy')
        ] }
      ],
      right: [
        { label: null, games: [
          m(2, 'Glenbard East', 31, 'Prospect'),
          m(15, 'East St. Louis', 18, 'Hoffman Estates'),
          m(7, 'Chicago Mt. Carmel', 26, 'Thornton Fractional North'),
          m(10, 'DeKalb', 23, 'Lake Zurich'),
          m(3, 'Hononegah', 30, 'Buffalo Grove'),
          m(14, 'Wheaton-Warrenville South', 19, 'Belleville West'),
          m(6, 'Rolling Meadows', 27, 'Alton'),
          m(11, 'Normal Community', 22, 'St. Charles North')
        ] }
      ]
    },

    /* --- Paxon Hatch and Isaac Vitel ------------------------------------ */
    bloomington: {
      title: 'IHSA Class 6A',
      us: 'Bloomington',
      rounds: [
        { label: 'First Round' },
        { label: 'Second Round' },
        { label: 'Quarterfinal' },
        { label: 'Semifinal' }
      ],
      final: { label: 'State Final', date: 'Nov 24' },
      left: [
        { label: null, games: [
          m(1, 'Cary-Grove', 16, 'Wauconda'),
          m(8, 'Kaneland', 9, 'Von Steuben'),
          m(4, 'Phillips', 13, 'Lake Forest'),
          m(5, 'Prairie Ridge', 12, 'Hinsdale South'),
          m(2, 'Antioch', 15, 'Reavis'),
          m(7, 'Lakes', 10, 'Belvidere North'),
          m(3, 'Kenwood', 14, 'Crystal Lake South'),
          m(6, 'Niles Notre Dame', 11, 'Saint Ignatius College Prep')
        ] }
      ],
      right: [
        { label: null, games: [
          m(1, 'Richards', 16, 'Rock Island'),
          m(8, 'Yorkville', 9, 'Dunlap'),
          m(4, 'Normal West', 13, 'Peoria Notre Dame'),
          m(5, 'Shepard', 12, 'Springfield'),
          m(2, 'Washington', 15, 'Providence Catholic'),
          m(7, 'Sacred Heart-Griffin', 10, 'Quincy'),
          m(3, 'Glenwood', 14, 'Lemont'),
          m(6, 'Bloomington', 11, 'Crete-Monee')
        ] }
      ]
    },

    /* --- Andrew Parr ----------------------------------------------------- */
    wakeForest: {
      title: 'NCHSAA 4A',
      us: 'Wake Forest',
      rounds: [
        { label: 'First Round' },
        { label: 'Second Round' },
        { label: 'Third Round' },
        { label: 'Regional Round', date: 'Dec 7' }
      ],
      final: { label: 'Championship' },
      left: [
        { label: 'East', games: [
          bye(1, 'Wake Forest'),
          m(8, 'Fuquay-Varina', 9, 'Wakefield'),
          bye(4, 'Leesville Road'),
          m(5, 'Rolesville', 12, 'Broughton'),
          bye(3, 'Holly Springs'),
          m(6, 'Pinecrest', 11, 'Panther Creek'),
          m(7, 'Enloe', 10, 'Garner'),
          bye(2, 'Hoggard')
        ] }
      ],
      right: [
        { label: 'West', games: [
          bye(1, 'Mallard Creek'),
          m(8, 'Hough', 9, 'North Mecklenburg'),
          bye(4, 'Ardrey Kell'),
          m(5, 'Chambers', 12, 'Northwest Guilford'),
          bye(3, 'Butler'),
          m(6, 'Myers Park', 11, 'Providence'),
          m(7, 'West Forsyth', 10, 'Reagan'),
          bye(2, 'Richmond Senior')
        ] }
      ]
    },

    /* --- Jaykeb Stewart --------------------------------------------------- */
    naples: {
      title: 'FHSAA Class 6A',
      us: 'Naples',
      rounds: [
        { label: 'Region Quarterfinal', date: 'Nov 9' },
        { label: 'Region Semifinal', date: 'Nov 16' },
        { label: 'Region Final', date: 'Nov 23' },
        { label: 'State Semifinal', date: 'Nov 30' }
      ],
      final: { label: 'Championship', date: 'Dec 8' },
      left: [
        { label: 'Region 1', games: [
          m(1, 'Navarre', 8, 'Pace'),
          m(4, 'St. Augustine', 5, 'Escambia'),
          m(3, 'Crestview', 6, 'Niceville'),
          m(2, 'Pine Forest', 7, 'Gulf Breeze')
        ] },
        { label: 'Region 2', games: [
          m(1, 'Vanguard', 8, 'Sebring'),
          m(4, 'Lake Wales', 5, 'Gainesville'),
          m(3, 'Mitchell', 6, 'Lake Weir'),
          m(2, 'Armwood', 7, 'South Lake')
        ] }
      ],
      right: [
        { label: 'Region 3', games: [
          m(1, 'Naples', 8, 'Lehigh'),
          m(4, 'Fort Myers', 5, 'Barron Collier'),
          m(3, 'Largo', 6, 'North Fort Myers'),
          m(2, 'Charlotte', 7, 'Clearwater')
        ] },
        { label: 'Region 4', games: [
          m(1, 'Carol City', 8, 'Norland'),
          m(4, 'Dillard', 5, 'Central'),
          m(3, 'Mainland', 6, 'Northwestern'),
          m(2, 'Heritage', 7, 'Eau Gallie')
        ] }
      ]
    }
  };

  /* Bloomington missed the 2019 playoffs, so Paxon and Isaac have no draw
     this year. Carlsbad has one for the first time. */
  EGE.brackets[2019] = {

    /* --- Sam Stogsdill -------------------------------------------------- */
    normal: {
      title: 'IHSA Class 7A',
      us: 'Normal Community',
      rounds: [
        { label: 'First Round' },
        { label: 'Second Round' },
        { label: 'Quarterfinal' },
        { label: 'Semifinal' }
      ],
      final: { label: 'State Final', date: 'Nov 30' },
      left: [
        { label: 'Quadrant 1', games: [
          m(1, 'Chicago Mt. Carmel', 32, 'Blue Island Eisenhower'),
          m(16, 'Glenbard North', 17, 'Benet Academy'),
          m(8, 'Phillips', 25, 'Lincoln-Way West'),
          m(9, 'Normal Community', 24, 'Reavis')
        ] },
        { label: 'Quadrant 2', games: [
          m(4, 'Hersey', 29, 'Rockford Auburn'),
          m(13, 'Andrew', 20, 'Lake Zurich'),
          m(5, 'Willowbrook', 28, 'Moline'),
          m(12, 'Yorkville', 21, 'Thornton Fractional South')
        ] }
      ],
      right: [
        { label: 'Quadrant 3', games: [
          m(2, 'Nazareth Academy', 31, 'Libertyville'),
          m(15, 'Thornton', 18, 'Pekin'),
          m(7, 'Batavia', 26, 'Thornwood'),
          m(10, 'Hononegah', 23, 'Grant Community')
        ] },
        { label: 'Quadrant 4', games: [
          m(3, 'Rolling Meadows', 30, 'Lincoln Park'),
          m(14, 'Prospect', 19, 'DeKalb'),
          m(6, 'Maine West', 27, 'Downers Grove North'),
          m(11, 'Harlem', 22, 'Wheaton-Warrenville South')
        ] }
      ]
    },

    /* --- Andrew Parr ----------------------------------------------------- */
    /* The first year of 4AA, the bigger schools split off from 4A. The East's
       3 seed was never filled -- the bracket printed TBA -- so whoever came
       out of Garner and Wakefield had the second round off as well. */
    wakeForest: {
      title: 'NCHSAA 4AA',
      us: 'Wake Forest',
      rounds: [
        { label: 'First Round' },
        { label: 'Second Round' },
        { label: 'Third Round' },
        { label: 'Regional Round', date: 'Dec 6' }
      ],
      final: { label: 'Championship', date: 'Dec 14' },
      left: [
        { label: 'East', games: [
          bye(1, 'Wake Forest'),
          m(8, 'Rolesville', 9, 'Panther Creek'),
          m(5, 'Green Hope', 12, 'Apex Friendship'),
          bye(4, 'Hoggard'),
          bye(3, 'TBA'),
          m(6, 'Garner', 11, 'Wakefield'),
          m(7, 'Hoke County', 10, 'Millbrook'),
          bye(2, 'Leesville Road')
        ] }
      ],
      right: [
        { label: 'West', games: [
          bye(1, 'Richmond Senior'),
          m(8, 'Hough', 9, 'Olympic'),
          m(5, 'Ardrey Kell', 12, 'Independence'),
          bye(4, 'Myers Park'),
          bye(3, 'West Forsyth'),
          m(6, 'Pinecrest', 11, 'Reagan'),
          m(7, 'Butler', 10, 'Chambers'),
          bye(2, 'Mallard Creek')
        ] }
      ]
    },

    /* --- Jaykeb Stewart --------------------------------------------------- */
    /* Naples moved to Region 4 this year, the bottom of the right half. */
    naples: {
      title: 'FHSAA Class 6A',
      us: 'Naples',
      rounds: [
        { label: 'Region Quarterfinal', date: 'Nov 8' },
        { label: 'Region Semifinal', date: 'Nov 15' },
        { label: 'Region Final', date: 'Nov 22' },
        { label: 'State Semifinal', date: 'Nov 29' }
      ],
      final: { label: 'Championship', date: 'Dec 12' },
      left: [
        { label: 'Region 1', games: [
          m(1, 'Escambia', 8, 'New Smyrna Beach'),
          m(4, 'Mainland', 5, 'Booker T. Washington'),
          m(3, 'Ponte Vedra', 6, 'Columbia'),
          m(2, 'Riverside', 7, 'St. Augustine')
        ] },
        { label: 'Region 2', games: [
          m(1, 'Gaither', 8, 'Boca Ciega'),
          m(4, 'Hollins', 5, 'Clearwater'),
          m(3, 'Lake Minneola', 6, 'Springstead'),
          m(2, 'Largo', 7, 'Countryside')
        ] }
      ],
      right: [
        { label: 'Region 3', games: [
          m(1, 'Palmetto', 8, 'Braden River'),
          m(4, 'Hillsborough', 5, 'Port Charlotte'),
          m(3, 'Westwood', 6, 'Charlotte'),
          m(2, 'Lake Gibson', 7, 'Auburndale')
        ] },
        { label: 'Region 4', games: [
          m(1, 'Naples', 8, 'South Fort Myers'),
          m(4, 'Central', 5, 'Dunbar'),
          m(3, 'Fort Myers', 6, 'North Fort Myers'),
          m(2, 'Dillard', 7, 'Lely')
        ] }
      ]
    },

    /* --- Cooper Clark ---------------------------------------------------- */
    /* The San Diego Section's Open Division: its top four, seeded, and two
       rounds -- a semifinal a half and the final. */
    carlsbad: {
      title: 'CIF-SDS Open Division',
      us: 'Carlsbad',
      rounds: [
        { label: 'Semifinal', date: 'Nov 15' }
      ],
      final: { label: 'Championship', date: 'Nov 23' },
      left: [
        { label: null, games: [
          m(1, 'Helix', 4, 'St. Augustine')
        ] }
      ],
      right: [
        { label: null, games: [
          m(2, 'Cathedral Catholic', 3, 'Carlsbad')
        ] }
      ]
    }
  };

  /* College. The College Football Playoff is four teams, drawn the way the
     committee drew them on selection day: one against four in the semifinal
     the top seed chose, two against three in the other. Ohio State and
     Alabama are both in it, so it is written once and handed to both, each
     with its own school as `us`. */
  function cfp(us) {
    return {
      title: 'College Football Playoff',
      us: us,
      rounds: [
        { label: 'Semifinal', date: 'Jan 1' }
      ],
      final: { label: 'National Championship', date: 'Jan 11' },
      left: [
        { label: 'Sugar Bowl', games: [
          m(1, 'Ohio State', 4, 'Notre Dame')
        ] }
      ],
      right: [
        { label: 'Rose Bowl', games: [
          m(2, 'Alabama', 3, 'Clemson')
        ] }
      ]
    };
  }

  EGE.brackets[2020] = {

    /* --- Sam Stogsdill, Jaykeb Stewart ------------------------------------ */
    ohioState: cfp('Ohio State'),

    /* --- Andrew Parr ------------------------------------------------------ */
    alabama: cfp('Alabama'),

    /* --- Paxon Hatch ------------------------------------------------------ */
    /* The FCS playoffs: twenty-four teams, the eight seeds off in the first
       round and at home to its winners in the second. Unseeded teams have
       no number. The field is 2019's, the last the pandemic left alone, with
       the Missouri Valley's bids read off this season's Valley table. */
    northDakotaState: {
      title: 'NCAA Division I FCS Playoffs',
      us: 'North Dakota State',
      rounds: [
        { label: 'First Round', date: 'Nov 28' },
        { label: 'Second Round', date: 'Dec 5' },
        { label: 'Quarterfinal', date: 'Dec 12' },
        { label: 'Semifinal', date: 'Dec 19' }
      ],
      final: { label: 'National Championship', date: 'Jan 9' },
      left: [
        { label: null, games: [
          bye(1, 'North Dakota State'),
          m(null, 'Nicholls', null, 'North Dakota'),
          bye(8, 'Central Arkansas'),
          m(null, 'Southeast Missouri State', null, 'Missouri State'),
          bye(4, 'Sacramento State'),
          m(null, 'Austin Peay', null, 'Furman'),
          bye(5, 'Montana State'),
          m(null, 'Albany', null, 'Central Connecticut')
        ] }
      ],
      right: [
        { label: null, games: [
          bye(2, 'James Madison'),
          m(null, 'Monmouth', null, 'Holy Cross'),
          bye(7, 'South Dakota State'),
          m(null, 'Northern Iowa', null, 'San Diego'),
          bye(3, 'Weber State'),
          m(null, 'Wofford', null, 'Kennesaw State'),
          bye(6, 'Montana'),
          m(null, 'SE Louisiana', null, 'Villanova')
        ] }
      ]
    }
  };

  /* The bracket a player's school was in that season, or null. Carlsbad in
     2018 is the case this has to answer for: two playoff games and no draw
     written in for them, because a school can be in the postseason without
     its bracket having been drawn up. */
  EGE.bracketFor = function (player, season) {
    var year = season || EGE.currentSeason;
    var team = EGE.teamKeyFor(player, year);
    if (!team) { return null; }
    var draws = EGE.brackets[year] || {};
    return draws[team] || null;
  };

  /* --- how far the draw has got ---------------------------------------------

     A bracket fills in a week at a time. Round one is a week in the season
     file, and until that week is published nothing in the draw is settled --
     the same rule the schedule, the record and the credits already follow, so
     a bracket can never be ahead of what the admin has put out.

     A matchup is settled from one of three places, in this order:

       a bye          advances on its own, with no score
       his own game   read off stats/{year}.js, where it has a stat line
       everything else  read off the `playoffs` block in the same file

     His own game is never taken from the results list even if something is
     written there. A playoff game is a game, it is in the season file like
     every other game, and a bracket that could disagree with the schedule
     about whether he won is worse than no bracket.

     Round two's matchups are round one's winners, so publishing a week both
     fills that round in and stands the next one up with the teams that
     reached it.

     A result with no score, [winner, null, null], is a team that went
     through without playing -- North Carolina's Garner in 2019, drawn
     against a seed that was never filled. It advances like any winner and is
     drawn without a score. */

  function settle(slot, round, rounds, bracket, player, year, at) {
    var written = rounds[round] || {};
    var week = written.week;
    if (!week || !EGE.isPublished(year, week)) { return null; }

    /* A bye is not a game. Nobody was played and there is no score. */
    if (slot.a && !slot.b) { return { name: slot.a.name, bye: true }; }
    if (!slot.a || !slot.b) { return null; }

    if (slot.a.name === bracket.us || slot.b.name === bracket.us) {
      var game = EGE.gameInWeek(player, week, year);
      if (!EGE.isFinal(game)) { return null; }
      var won = game.result.teamScore > game.result.opponentScore;
      var other = slot.a.name === bracket.us ? slot.b.name : slot.a.name;
      return won
        ? { name: bracket.us, hi: game.result.teamScore, lo: game.result.opponentScore }
        : { name: other, hi: game.result.opponentScore, lo: game.result.teamScore };
    }

    var row = (written.results || [])[at];
    if (!row) { return null; }
    return { name: row[0], hi: row[1], lo: row[2] };
  }

  /* Whoever came out of a matchup, as the seed line the next round draws. */
  function survivor(slot) {
    if (!slot || !slot.result) { return null; }
    if (slot.a && slot.a.name === slot.result.name) { return slot.a; }
    if (slot.b && slot.b.name === slot.result.name) { return slot.b; }
    /* A winner nobody in the matchup is named after is a typo in the file
       rather than a team, and is better shown as a blank than as a team that
       was not playing. */
    return null;
  }

  /* The whole draw as it stands: every matchup, whoever is in it, and
     whatever has been settled.

     How big it is comes off the bracket rather than a constant -- how many
     rounds a half runs to before the final, and how many matchups open it --
     so a four-team section final and a thirty-two-team state draw are worked
     through the same way. */
  EGE.bracketState = function (player, season) {
    var year = season || EGE.currentSeason;
    var bracket = EGE.bracketFor(player, year);
    if (!bracket) { return null; }

    var forSeason = EGE.stats[year] || {};
    var rounds = ((forSeason.playoffs || {})[EGE.teamKeyFor(player, year)]) || [];

    var openers = EGE.bracketOpeners(bracket.left)
      .concat(EGE.bracketOpeners(bracket.right));
    var depth = bracket.rounds.length;      /* per side, before the final */

    /* Where a round's slot sits in the flat list of that round's matchups:
       the whole left half first, then the whole right. */
    function flatIndex(round, flip, at) {
      return (flip ? (openers.length / 2) >> round : 0) + at;
    }

    var out = [];
    for (var r = 0; r < depth; r += 1) {
      var here = [];
      var count = openers.length >> r;
      for (var i = 0; i < count; i += 1) {
        var slot = r === 0
          ? { a: openers[i].game.a, b: openers[i].game.b }
          : { a: survivor(out[r - 1][i * 2]), b: survivor(out[r - 1][i * 2 + 1]) };
        slot.result = settle(slot, r, rounds, bracket, player, year, i);
        here.push(slot);
      }
      out.push(here);
    }

    var last = out[depth - 1];
    var final = { a: survivor(last[0]), b: survivor(last[1]) };
    final.result = settle(final, depth, rounds, bracket, player, year, 0);

    return {
      bracket: bracket,
      rounds: out,
      final: final,
      champion: final.result ? final.result.name : null,
      at: flatIndex
    };
  };

  /* Every first-round matchup down one side, with its block's name carried
     onto the first of them so the renderer can write it once. */
  EGE.bracketOpeners = function (side) {
    var out = [];
    (side || []).forEach(function (block) {
      block.games.forEach(function (game, at) {
        out.push({ game: game, label: at === 0 ? block.label : null,
                   first: at === 0, last: at === block.games.length - 1 });
      });
    });
    return out;
  };
}());
