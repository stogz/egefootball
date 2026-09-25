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
   wrong hour for four of the five schools. The zones are read off where the
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
  }
};

EGE.players = [
  {
    slug: 'andrew-parr',
    name: 'Andrew Parr',
    first: 'Andrew',
    last: 'Parr',
    team: 'wakeForest',
    position: 'TE',
    jersey: 87,
    height: 72,               // inches
    weight: 245,              // pounds
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
    position: 'TE',
    jersey: 10,
    height: 74,               // inches
    weight: 275,              // pounds
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
    position: 'QB',
    jersey: 8,
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
    position: 'RB',
    jersey: 34,
    height: 73,               // inches
    weight: 210,              // pounds
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

/* The team a player suits up for, or null while their school is unknown. */
EGE.teamFor = function (player) {
  return (player && player.team && EGE.teams[player.team]) || null;
};

/* The accounts allowed to sign in. */
EGE.playersWithAccounts = function () {
  return EGE.players.filter(function (p) { return Boolean(p.email); });
};

/* Look a player up by the slug used in the URL hash, e.g. #paxon-hatch. */
EGE.playerBySlug = function (slug) {
  return EGE.players.filter(function (p) { return p.slug === slug; })[0] || null;
};
