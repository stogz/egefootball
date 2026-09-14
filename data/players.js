/* ==========================================================================
   EGE Football — player data
   Source of truth for the six. Everything on the site reads from here.

   Loaded with a plain <script> tag (not an ES module) so the site works
   from file:// as well as over http.

   TBD is written as null, never as a placeholder value. If it is not
   confirmed, it stays null and the UI renders "TBD".

   `email` is the address that player signs in with. Only the six listed
   here can hold an account; a null email means their portal is not open
   yet. These are sign-in identifiers, not contact details.
   ========================================================================== */

window.EGE = window.EGE || {};

/* The season ladder. See README — 2018 junior year of high school through
   the 2023 NFL Draft. */
EGE.seasons = [
  { year: 2018, level: 'High school varsity', class: 'Junior year' },
  { year: 2019, level: 'High school varsity', class: 'Senior year' },
  { year: 2020, level: 'College football',    class: 'Freshman year' },
  { year: 2021, level: 'College football',    class: 'Sophomore year' },
  { year: 2022, level: 'College football',    class: 'Junior year' },
  { year: 2023, level: 'College football',    class: 'Senior year', optional: true }
];

/* The season the site opens on. */
EGE.currentSeason = 2018;

EGE.players = [
  {
    slug: 'andrew-parr',
    name: 'Andrew Parr',
    first: 'Andrew',
    last: 'Parr',
    school: null,             // TBD
    position: null,           // TBD
    jersey: null,             // TBD
    email: null,          // TBD
    headshot: 'headshot/parr.png'
  },
  {
    slug: 'cooper-clark',
    name: 'Cooper Clark',
    first: 'Cooper',
    last: 'Clark',
    school: 'Carlsbad High School',
    position: null,           // TBD
    jersey: null,             // TBD
    email: null,          // TBD
    headshot: 'headshot/clark.png'
  },
  {
    slug: 'paxon-hatch',
    name: 'Paxon Hatch',
    first: 'Paxon',
    last: 'Hatch',
    school: 'Bloomington High School',
    position: 'TE',           // the one confirmed position
    jersey: null,             // TBD
    email: null,          // TBD
    headshot: 'headshot/hatch.png'
  },
  {
    slug: 'isaac-vitel',
    name: 'Isaac Vitel',
    first: 'Isaac',
    last: 'Vitel',
    school: null,             // TBD
    position: null,           // TBD
    jersey: null,             // TBD
    email: null,          // TBD
    headshot: 'headshot/vitel.png'
  },
  {
    slug: 'sam-stogsdill',
    name: 'Sam Stogsdill',
    first: 'Sam',
    last: 'Stogsdill',
    school: 'Normal Community High School',
    position: null,           // TBD
    jersey: null,             // TBD
    email: 'stogzfam@gmail.com',
    headshot: 'headshot/stogsdill.png'
  },
  {
    slug: 'jaykeb-stewart',
    name: 'Jaykeb Stewart',
    first: 'Jaykeb',
    last: 'Stewart',
    school: null,             // TBD
    position: null,           // TBD
    jersey: null,             // TBD
    email: null,          // TBD
    headshot: 'headshot/stewart.png'
  }
];

/* The accounts allowed to sign in. */
EGE.playersWithAccounts = function () {
  return EGE.players.filter(function (p) { return Boolean(p.email); });
};

/* Look a player up by the slug used in the URL hash, e.g. #paxon-hatch. */
EGE.playerBySlug = function (slug) {
  return EGE.players.filter(function (p) { return p.slug === slug; })[0] || null;
};
