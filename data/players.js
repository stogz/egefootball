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
   the ladder -- see EGE.teamFor.

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
   through the 2023 NFL Draft. */
EGE.seasons = [
  { year: 2018, level: 'High School Varsity', tier: 'highSchool', class: 'Junior Year' },
  { year: 2019, level: 'High School Varsity', tier: 'highSchool', class: 'Senior Year' },
  { year: 2020, level: 'College Football',    tier: 'college',    class: 'Freshman Year' },
  { year: 2021, level: 'College Football',    tier: 'college',    class: 'Sophomore Year' },
  { year: 2022, level: 'College Football',    tier: 'college',    class: 'Junior Year' },
  { year: 2023, level: 'College Football',    tier: 'college',    class: 'Senior Year', optional: true }
];

/* Which level of football a season is played at. Nothing is at 'nfl' yet —
   the ladder ends at the draft. */
EGE.tierFor = function (season) {
  var year = season || EGE.currentSeason;
  var found = EGE.seasons.filter(function (s) { return s.year === year; })[0];
  return found ? found.tier : null;
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
  }
};

/* Which set of headshots is up. Discord keeps its own copy of every image a
   post points at, for good, and goes by the address alone -- so a picture
   replaced under the same file name never reaches a new post. The Discord
   posts put this on the end of the headshot's address, which makes it a new
   address. Change it whenever a headshot in headshot/ is replaced. */
EGE.headshotVersion = '2026-09-30';

EGE.players = [
  {
    slug: 'andrew-parr',
    name: 'Andrew Parr',
    first: 'Andrew',
    last: 'Parr',
    team: 'wakeForest',
    college: 'alabama',       // from 2020
    position: 'TE',
    jersey: 87,
    height: 76,               // inches
    weight: 265,              // pounds
    email: 'daikrotlr@gmail.com',
    credits: 0,
    headshot: 'headshot/parr.png'
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
    headshot: 'headshot/clark.png'
  },
  {
    slug: 'paxon-hatch',
    name: 'Paxon Hatch',
    first: 'Paxon',
    last: 'Hatch',
    team: 'bloomington',
    college: 'northDakotaState', // from 2020
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
    headshot: 'headshot/hatch.png'
  },
  {
    slug: 'isaac-vitel',
    name: 'Isaac Vitel',
    first: 'Isaac',
    last: 'Vitel',
    team: 'bloomington',
    college: 'illinois',      // from 2020
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
    position: 'QB',
    jersey: 2,
    height: 71,               // inches
    weight: 185,              // pounds
    email: 'jkeb.stew@gmail.com',
    credits: 0,
    headshot: 'headshot/stewart.png'
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
   through the high school years, `college` from the first college one. A
   season left out means the live one. Null while a school is unknown. */
EGE.teamKeyFor = function (player, season) {
  if (!player) { return null; }
  var key = EGE.tierFor(season) === 'college' ? player.college : player.team;
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

EGE.classFor = function (player, season) {
  var year = season || EGE.currentSeason;
  var found = EGE.seasons.filter(function (s) { return s.year === year; })[0];
  if (!found) { return null; }
  if (found.tier !== 'college') { return found.class; }

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
  if (EGE.tierFor(year) !== 'college') { return null; }
  var count = EGE.seasons.filter(function (s) {
    return s.tier === 'college' && s.year <= year;
  }).length;
  if (player && player.redshirt && player.redshirt < year) { count -= 1; }
  return Math.max(1, count);
};

/* Whether a player has a redshirt year behind him that season. */
EGE.redshirtedBy = function (player, season) {
  return Boolean(player && player.redshirt && player.redshirt < (season || EGE.currentSeason));
};

/* The accounts allowed to sign in. */
EGE.playersWithAccounts = function () {
  return EGE.players.filter(function (p) { return Boolean(p.email); });
};

/* Look a player up by the slug used in the URL hash, e.g. #paxon-hatch. */
EGE.playerBySlug = function (slug) {
  return EGE.players.filter(function (p) { return p.slug === slug; })[0] || null;
};
