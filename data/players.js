/* ==========================================================================
   EGE Football — player data
   Source of truth for the six. Everything on the site reads from here.

   Loaded with a plain <script> tag (not an ES module) so the site works
   from file:// as well as over http.

   TBD is written as null, never as a placeholder value. If it is not
   confirmed, it stays null and the UI renders "TBD".

   `credits` is the shop balance. Everyone starts on nothing and earns it
   an offseason at a time.

   `height` is in inches and `weight` in pounds, so they are numbers rather
   than something to be parsed back apart. EGE.heightText and
   EGE.weightText below turn them into the text the page shows.

   `team` is the high school a player played for and `college` the college,
   both as keys in EGE.teams below. Which one a season shows is its tier on
   the ladder -- see EGE.teamFor. A player who transferred has `transfers`
   as well, `{ 2022: 'texas' }`: the school he is at from that season on,
   so his earlier seasons still say where he was then. Being drafted is a
   transfer too, to an NFL team -- `{ 2023: 'seattle' }` -- and an NFL
   team (`tier: 'nfl'` in EGE.teams) is what puts a player in the NFL
   that season, whatever the rest of the six are doing.

   `trophies` is what is in his trophy case on his page, oldest first:
   `{ name, season, image, about, scale }`. `image` is a picture of it under
   icon/trophies/ (without one it is drawn as a gold cup with `name` and
   `season` on a plate) and `about` is what the tag says when it is pointed
   at (a \n starts a new line). `scale` stands a bigger one taller than
   the rest on the shelf -- 1.35 is a third again as tall; leave it out
   for the usual size. Leave it out for a player who has not won anything yet.

   `email` is the address that player signs in with. Only the six listed
   here can hold an account; a null email means their portal is not open
   yet. These are sign-in identifiers, not contact details.

   Written lowercase, always. Supabase lowercases the address in auth.users,
   so the JWT carries the lowercase form, and every row policy on the site is
   `email = auth.jwt() ->> 'email'` -- a byte comparison in Postgres. An
   address stored here as Jkeb.stew@gmail.com would read fine and then have
   every single write to its credits, inventory and boosters refused.
   ========================================================================== */

window.EGE = window.EGE || {};

/* The season ladder. See the project spec — 2018 junior year of high school
   through the 2023 NFL Draft, and on from there.

   2023 is the first season the six are split: Sam, Andrew and Jaykeb were
   drafted and play it in the NFL, and Paxon, Cooper and Isaac stay in
   college. Its `level` names both, for the places that say what a season
   is for everybody at once (the home page, the Teams pages); a player's own
   page says his own, from EGE.levelFor. */
EGE.seasons = [
  { year: 2018, level: 'High School Varsity', tier: 'highSchool', class: 'Junior Year' },
  { year: 2019, level: 'High School Varsity', tier: 'highSchool', class: 'Senior Year' },
  { year: 2020, level: 'College Football',    tier: 'college',    class: 'Freshman Year' },
  { year: 2021, level: 'College Football',    tier: 'college',    class: 'Sophomore Year' },
  { year: 2022, level: 'College Football',    tier: 'college',    class: 'Junior Year' },
  { year: 2023, level: 'NFL & College Football', tier: 'college', class: 'Senior Year', optional: true }
];

/* What each level of football is called on a player's own page. */
EGE.TIER_LEVELS = {
  highSchool: 'High School Varsity',
  college: 'College Football',
  nfl: 'NFL'
};

/* Which level of football a season is played at: 'highSchool', 'college'
   or 'nfl'. Given a player, it is his own level that season -- a player
   whose team that season is an NFL one is in the NFL, whatever the
   ladder says the rest are doing. Without one, it is the ladder's. */
EGE.tierFor = function (season, player) {
  var year = season || EGE.currentSeason;
  var found = EGE.seasons.filter(function (s) { return s.year === year; })[0];
  if (!found) { return null; }
  if (player && found.tier !== 'highSchool') {
    var team = EGE.teams[EGE.teamKeyFor(player, year)];
    if (team && team.tier === 'nfl') { return 'nfl'; }
  }
  return found.tier;
};

/* The level a player played at that season, as his page names it:
   'NFL', 'College Football'. */
EGE.levelFor = function (player, season) {
  return EGE.TIER_LEVELS[EGE.tierFor(season, player)] || null;
};

/* Whether a season has anybody in the NFL in it. */
EGE.seasonHasNfl = function (season) {
  return EGE.players.some(function (player) {
    return EGE.tierFor(season, player) === 'nfl';
  });
};

/* Which of the two leagues a player's week goes out with: 'nfl' for a
   player in the NFL that season, and 'college' for everybody else -- the
   high school years too, which went out to the one channel there was
   before anybody had been drafted. Each has its own Discord bot, its own
   week numbers (the NFL's 1 to 18, the colleges' 0 to 13) and its own
   postseason. */
EGE.LEAGUES = ['nfl', 'college'];

EGE.leagueOf = function (player, season) {
  return EGE.tierFor(season, player) === 'nfl' ? 'nfl' : 'college';
};

/* Which season is live is not here: it changes every year, and the admin
   portal rewrites the file that holds it. See data/season.js. */

/* Schools, their leagues, their marks, and the clock they play on.

   `zone` is what turns a 7:00pm kickoff into a real moment. A Carlsbad game
   and a Wake Forest game both listed at 7:00pm are three hours apart, and a
   Discord timestamp is an instant — without this it would show everyone the
   wrong hour for most of the schools. The zones are read off where the
   schools are, and they follow daylight saving on their own. */
EGE.teams = {
  carlsbad: {
    school: 'Carlsbad High School',
    league: 'Avocado League',
    logo: 'icon/carlsbad.png',
    zone: 'America/Los_Angeles'
  },
  bloomington: {
    school: 'Bloomington High School',
    league: 'Big Twelve',
    logo: 'icon/bloomington.png',
    zone: 'America/Chicago'
  },
  normal: {
    school: 'Normal Community High School',
    league: 'Big Twelve',
    logo: 'icon/normal.png',
    zone: 'America/Chicago'
  },
  naples: {
    school: 'Naples High School',
    league: '6A District 12',
    logo: 'icon/naples.png',
    zone: 'America/New_York'
  },
  wakeForest: {
    school: 'Wake Forest High School',
    league: 'Northern 4A',
    logo: 'icon/wake.png',
    zone: 'America/New_York'
  },

  /* The colleges, from 2020 on. Their marks are the ones already cut for
     the offer stickers in icon/offers/, so a school has one logo on the
     site whether it is offering somebody or playing for them.
     `discordLogo`, where a school has one, replaces the logo in the Discord
     posts only — for a mark too dark to read on Discord's background.

     `ground` is the colour the Teams pages put behind the mark, and
     `whiteMark: true` draws the mark in white on it -- Alabama's script A
     is the same crimson as its ground. */
  ohioState: {
    school: 'Ohio State',
    league: 'Big Ten',
    logo: 'icon/offers/OhioState.png',
    discordLogo: 'icon/OhioStateWhite.png',
    ground: '#FFFFFF',
    zone: 'America/New_York'
  },
  northDakotaState: {
    school: 'North Dakota State',
    league: 'Missouri Valley',
    logo: 'icon/offers/NDSU.png',
    ground: '#0A5640',
    zone: 'America/Chicago'
  },
  usc: {
    school: 'USC',
    league: 'Pac-12',
    logo: 'icon/offers/USC.png',
    ground: '#9D2235',
    zone: 'America/Los_Angeles'
  },
  alabama: {
    school: 'Alabama',
    league: 'SEC',
    logo: 'icon/offers/Alabama.png',
    ground: '#9E1B32',
    whiteMark: true,
    zone: 'America/Chicago'
  },
  illinois: {
    school: 'Illinois',
    league: 'Big Ten',
    logo: 'icon/offers/Illinois.png',
    ground: '#FF5F05',
    zone: 'America/Chicago'
  },
  /* Isaac's school from 2022. */
  texas: {
    school: 'Texas',
    league: 'Big 12',
    logo: 'icon/offers/Texas.png',
    ground: '#BF5700',
    whiteMark: true,
    zone: 'America/Chicago'
  },
  /* Paxon's school from 2022. */
  northCarolina: {
    school: 'North Carolina',
    league: 'ACC',
    logo: 'icon/offers/UNC.png',
    ground: '#13294B',
    zone: 'America/New_York'
  },

  /* The NFL, from 2023: the teams that drafted Jaykeb (Houston, 2nd),
     Andrew (Detroit, 18th) and Sam (Seattle, 52nd). `tier: 'nfl'` is
     what makes a season on one of these an NFL season. `league` is the
     division, which is what the standings place a team in, and
     `conference` the AFC or the NFC. The marks are in icon/nfl/, in their
     full colours: each has a white edge of its own, so it stands out on
     the team's colour, where drawn in white it was only a silhouette. */
  seattle: {
    school: 'Seattle Seahawks',
    short: 'Seahawks',
    tier: 'nfl',
    league: 'NFC West',
    conference: 'NFC',
    logo: 'icon/nfl/Seahawks.png',
    ground: '#002244',
    zone: 'America/Los_Angeles'
  },
  detroit: {
    school: 'Detroit Lions',
    short: 'Lions',
    tier: 'nfl',
    league: 'NFC North',
    conference: 'NFC',
    logo: 'icon/nfl/Lions.png',
    ground: '#0076B6',
    zone: 'America/Detroit'
  },
  houston: {
    school: 'Houston Texans',
    short: 'Texans',
    tier: 'nfl',
    league: 'AFC South',
    conference: 'AFC',
    logo: 'icon/nfl/Texans.png',
    ground: '#03202F',
    zone: 'America/Chicago'
  }
};

/* Which set of headshots is up. Discord keeps its own copy of every image a
   post points at, for good, and goes by the address alone -- so a picture
   replaced under the same file name never reaches a new post. The Discord
   posts put this on the end of the headshot's address, which makes it a new
   address. Change it whenever a headshot in headshot/ is replaced. */
EGE.headshotVersion = '2026-10-17';

EGE.players = [
  {
    slug: 'andrew-parr',
    name: 'Andrew Parr',
    first: 'Andrew',
    last: 'Parr',
    team: 'wakeForest',
    college: 'alabama',       // from 2020
    /* Drafted 18th by Detroit in 2023, the first tight end taken. */
    transfers: { 2023: 'detroit' },
    position: 'TE',
    jersey: 87,
    height: 76,               // inches
    weight: 265,              // pounds
    email: 'daikrotlr@gmail.com',
    credits: 0,
    headshot: 'headshot/parr.png',
    trophies: [
      { name: 'Regional Champion', season: 2018,
        image: 'icon/trophies/parr-2018-regional.webp',
        about: '2018 North Carolina Class 4A Regional Champion\nWake Forest High School' },
      { name: 'Regional Champion', season: 2019,
        image: 'icon/trophies/parr-2019-regional.webp',
        about: '2019 North Carolina Class 4A Regional Champion\nWake Forest High School' },
      { name: 'Regional Tournament MVP', season: 2019,
        image: 'icon/trophies/parr-2019-regional-mvp.webp',
        about: '2019 North Carolina Class 4A Regional Tournament MVP\nWake Forest High School' },
      { name: 'CFB National Championship', season: 2020, scale: 1.35,
        image: 'icon/trophies/parr-2020-cfp-national-championship.webp',
        about: '2020 College Football National Champion\nAlabama' }
    ]
  },
  {
    slug: 'cooper-clark',
    name: 'Cooper Clark',
    first: 'Cooper',
    last: 'Clark',
    team: 'carlsbad',
    college: 'usc',           // from 2020
    position: 'RB',
    jersey: 25,
    height: 68,               // inches
    weight: 175,              // pounds
    email: 'cooperclrk@gmail.com',
    credits: 0,
    headshot: 'headshot/clark.png',
    trophies: [
      { name: 'CIF-SDS Open Division Championship', season: 2019, scale: 1.35,
        image: 'icon/trophies/clark-2019-cif-sds-open-division.webp',
        about: '2019 CIF San Diego Section Open Division Champion\nCarlsbad High School' }
    ]
  },
  {
    slug: 'paxon-hatch',
    name: 'Paxon Hatch',
    first: 'Paxon',
    last: 'Hatch',
    team: 'bloomington',
    college: 'northDakotaState', // from 2020
    transfers: { 2022: 'northCarolina' },
    position: 'WR',
    /* A tight end in high school, a receiver full-time from 2020. Only the
       header of an old season's page says so; everything else -- his
       ratings, his overall, his stat lines -- is a receiver's. */
    pastPositions: { 2018: 'TE', 2019: 'TE' },
    jersey: 10,
    height: 74,               // inches
    weight: 265,              // pounds
    email: 'paxonhatch@gmail.com',
    credits: 0,
    headshot: 'headshot/hatch.png',
    trophies: [
      { name: 'FCS National Championship', season: 2020, scale: 1.35,
        image: 'icon/trophies/hatch-2020-fcs-national-championship.webp',
        about: '2020 FCS National Champion\nNorth Dakota State' },
      { name: 'FCS National Championship', season: 2021, scale: 1.35,
        image: 'icon/trophies/hatch-2021-fcs-national-championship.webp',
        about: '2021 FCS National Champion\nNorth Dakota State' }
    ]
  },
  {
    slug: 'isaac-vitel',
    name: 'Isaac Vitel',
    first: 'Isaac',
    last: 'Vitel',
    team: 'bloomington',
    college: 'illinois',      // from 2020
    transfers: { 2022: 'texas' },
    position: 'QB',
    jersey: 8,
    /* Redshirted his freshman year: 2020 used no eligibility, so from 2021
       his class runs a year behind everybody else's -- a freshman while
       they are sophomores (see EGE.classFor). */
    redshirt: 2020,
    height: 69,               // inches
    weight: 185,              // pounds
    email: 'isaacvitel2005@gmail.com',
    credits: 0,
    headshot: 'headshot/vitel.png'
  },
  {
    slug: 'sam-stogsdill',
    name: 'Sam Stogsdill',
    first: 'Sam',
    last: 'Stogsdill',
    team: 'normal',
    college: 'ohioState',     // from 2020
    /* Drafted 52nd by Seattle in 2023. */
    transfers: { 2023: 'seattle' },
    position: 'RB',
    jersey: 34,
    height: 73,               // inches
    weight: 245,              // pounds
    email: 'stogzfam@gmail.com',
    credits: 0,
    headshot: 'headshot/stogsdill.png'
  },
  {
    slug: 'jaykeb-stewart',
    name: 'Jaykeb Stewart',
    first: 'Jaykeb',
    last: 'Stewart',
    team: 'naples',
    college: 'ohioState',     // from 2020
    /* Drafted 2nd by Houston in 2023. */
    transfers: { 2023: 'houston' },
    position: 'QB',
    jersey: 2,
    height: 71,               // inches
    weight: 185,              // pounds
    email: 'jkeb.stew@gmail.com',
    credits: 0,
    headshot: 'headshot/stewart.png',
    trophies: [
      { name: 'State Championship', season: 2019, scale: 1.35,
        image: 'icon/trophies/stewart-2019-fhsaa-6a-state-championship.webp',
        about: '2019 Florida Class 6A State Champion\nNaples High School' }
    ]
  }
];

/* Feet and inches, the way a programme prints them. Stored as inches so two
   players can be compared without parsing a string back apart. */
EGE.heightText = function (player) {
  var inches = player && player.height;
  if (typeof inches !== 'number') { return null; }
  return Math.floor(inches / 12) + '\u2032' + (inches % 12) + '\u2033';
};

EGE.weightText = function (player) {
  var pounds = player && player.weight;
  return typeof pounds === 'number' ? pounds + ' lbs' : null;
};

/* Which school a player was at in a season, as its key in EGE.teams: `team`
   through the high school years, `college` from the first college one, and
   after a transfer the school he moved to (`transfers`, from the season he
   got there). A season left out means the live one. Null while a school is
   unknown. */
EGE.teamKeyFor = function (player, season) {
  if (!player) { return null; }
  var year = season || EGE.currentSeason;
  if (EGE.tierFor(year) === 'highSchool') { return player.team || null; }
  var key = player.college;
  Object.keys(player.transfers || {}).map(Number).sort(function (a, b) {
    return a - b;
  }).forEach(function (from) {
    if (from <= year) { key = player.transfers[from]; }
  });
  return key || null;
};

/* What a player's page header calls his position in a season: what he
   played then, if he played something else, or what he plays now. */
EGE.positionFor = function (player, season) {
  if (!player) { return null; }
  var year = season || EGE.currentSeason;
  var past = player.pastPositions && player.pastPositions[year];
  return past || player.position || null;
};

/* The team a player suits up for that season, or null while it is unknown. */
EGE.teamFor = function (player, season) {
  var key = EGE.teamKeyFor(player, season);
  return (key && EGE.teams[key]) || null;
};

/* A player's class in a season, as his own page says it: Junior Year,
   Freshman Year. The ladder's `class` is what it is for a player who never
   redshirts. A player with `redshirt: {year}` sits that college season out
   without using a year of eligibility: that season reads 'Redshirt', and
   every one after it is the year of eligibility he is in, a year behind
   everybody else -- Isaac is a 'Freshman Year' in 2021. Only the player pages say a class this way;
   everywhere else a season is a year and a level, since the six are not all
   in the same class. */
var COLLEGE_CLASSES = ['Freshman Year', 'Sophomore Year', 'Junior Year', 'Senior Year', 'Fifth Year'];
var NFL_CLASSES = ['Rookie Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year',
                   'Sixth Year', 'Seventh Year', 'Eighth Year', 'Ninth Year', 'Tenth Year'];

EGE.classFor = function (player, season) {
  var year = season || EGE.currentSeason;
  var found = EGE.seasons.filter(function (s) { return s.year === year; })[0];
  if (!found) { return null; }
  if (found.tier === 'highSchool') { return found.class; }

  /* In the NFL a season is how far into his career he is: his first is
     his rookie year. */
  var pro = EGE.nflYearFor(player, year);
  if (pro) { return NFL_CLASSES[Math.min(pro, NFL_CLASSES.length) - 1]; }

  /* The redshirt year itself is just that; after it, the class is the
     year of eligibility he is in -- a freshman again the year after. */
  if (player && player.redshirt === year) { return 'Redshirt'; }
  var eligibility = EGE.eligibilityYearFor(player, year);
  return COLLEGE_CLASSES[Math.min(eligibility, COLLEGE_CLASSES.length) - 1];
};

/* Which year of eligibility a player is in that college season, 1 to 5:
   one for every college season so far, less the one he redshirted once it
   is behind him. Null in high school. */
EGE.eligibilityYearFor = function (player, season) {
  var year = season || EGE.currentSeason;
  if (EGE.tierFor(year, player) !== 'college') { return null; }
  var count = EGE.seasons.filter(function (s) {
    return s.tier === 'college' && s.year <= year && EGE.tierFor(s.year, player) === 'college';
  }).length;
  if (player && player.redshirt && player.redshirt < year) { count -= 1; }
  return Math.max(1, count);
};

/* Which season of his NFL career a player is in, 1 for his rookie year,
   or null for a season he is not in the NFL. */
EGE.nflYearFor = function (player, season) {
  var year = season || EGE.currentSeason;
  if (!player || EGE.tierFor(year, player) !== 'nfl') { return null; }
  return EGE.seasons.filter(function (s) {
    return s.year <= year && EGE.tierFor(s.year, player) === 'nfl';
  }).length;
};

/* The accounts allowed to sign in. */
EGE.playersWithAccounts = function () {
  return EGE.players.filter(function (p) { return Boolean(p.email); });
};

/* Look a player up by the slug used in the URL hash, e.g. #paxon-hatch. */
EGE.playerBySlug = function (slug) {
  return EGE.players.filter(function (p) { return p.slug === slug; })[0] || null;
};
