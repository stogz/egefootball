/* ==========================================================================
   EGE Football — the NFL's 32
   Every NFL team, keyed the way the NFL sim keys them (nflverse's
   abbreviations: LA is the Rams, LAC the Chargers), for the Teams pages:
   the name, the conference and division, and the colour a player's
   pop-up is drawn on. `site` is the team's key in EGE.teams for the three
   the six play for, which have pages of their own already; every other
   team's page is its roster and nothing else.

   Colours are each team's first colour from nflverse, except where white
   on it would not read: the Saints are on their black and the Titans on
   their navy.

   The rosters themselves are the sim's (data/nfl-rosters.json, or the
   latest the admin page published to Supabase). See js/app.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.nfl = {
  teams: {
  BUF: { name: 'Buffalo Bills', conf: 'AFC', div: 'East', color: '#00338D' },
  MIA: { name: 'Miami Dolphins', conf: 'AFC', div: 'East', color: '#008E97' },
  NE: { name: 'New England Patriots', conf: 'AFC', div: 'East', color: '#002244' },
  NYJ: { name: 'New York Jets', conf: 'AFC', div: 'East', color: '#003F2D' },
  BAL: { name: 'Baltimore Ravens', conf: 'AFC', div: 'North', color: '#241773' },
  CIN: { name: 'Cincinnati Bengals', conf: 'AFC', div: 'North', color: '#FB4F14' },
  CLE: { name: 'Cleveland Browns', conf: 'AFC', div: 'North', color: '#FF3C00' },
  PIT: { name: 'Pittsburgh Steelers', conf: 'AFC', div: 'North', color: '#000000' },
  HOU: { name: 'Houston Texans', conf: 'AFC', div: 'South', color: '#03202F', site: 'houston' },
  IND: { name: 'Indianapolis Colts', conf: 'AFC', div: 'South', color: '#002C5F' },
  JAX: { name: 'Jacksonville Jaguars', conf: 'AFC', div: 'South', color: '#006778' },
  TEN: { name: 'Tennessee Titans', conf: 'AFC', div: 'South', color: '#0C2340' },
  DEN: { name: 'Denver Broncos', conf: 'AFC', div: 'West', color: '#002244' },
  KC: { name: 'Kansas City Chiefs', conf: 'AFC', div: 'West', color: '#E31837' },
  LAC: { name: 'Los Angeles Chargers', conf: 'AFC', div: 'West', color: '#007BC7' },
  LV: { name: 'Las Vegas Raiders', conf: 'AFC', div: 'West', color: '#000000' },
  DAL: { name: 'Dallas Cowboys', conf: 'NFC', div: 'East', color: '#002244' },
  NYG: { name: 'New York Giants', conf: 'NFC', div: 'East', color: '#0B2265' },
  PHI: { name: 'Philadelphia Eagles', conf: 'NFC', div: 'East', color: '#004C54' },
  WAS: { name: 'Washington Commanders', conf: 'NFC', div: 'East', color: '#5A1414' },
  CHI: { name: 'Chicago Bears', conf: 'NFC', div: 'North', color: '#0B162A' },
  DET: { name: 'Detroit Lions', conf: 'NFC', div: 'North', color: '#0076B6', site: 'detroit' },
  GB: { name: 'Green Bay Packers', conf: 'NFC', div: 'North', color: '#203731' },
  MIN: { name: 'Minnesota Vikings', conf: 'NFC', div: 'North', color: '#4F2683' },
  ATL: { name: 'Atlanta Falcons', conf: 'NFC', div: 'South', color: '#A71930' },
  CAR: { name: 'Carolina Panthers', conf: 'NFC', div: 'South', color: '#0085CA' },
  NO: { name: 'New Orleans Saints', conf: 'NFC', div: 'South', color: '#101820' },
  TB: { name: 'Tampa Bay Buccaneers', conf: 'NFC', div: 'South', color: '#A71930' },
  ARI: { name: 'Arizona Cardinals', conf: 'NFC', div: 'West', color: '#97233F' },
  LA: { name: 'Los Angeles Rams', conf: 'NFC', div: 'West', color: '#003594' },
  SF: { name: 'San Francisco 49ers', conf: 'NFC', div: 'West', color: '#AA0000' },
  SEA: { name: 'Seattle Seahawks', conf: 'NFC', div: 'West', color: '#002244', site: 'seattle' }
  }
};

/* A team's address on the Teams page -- #teams/kansas-city-chiefs -- the
   same as the six's teams have from EGE.teamSlug. */
EGE.nfl.slug = function (key) {
  var team = EGE.nfl.teams[key];
  return team ? team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null;
};

EGE.nfl.keyBySlug = function (slug) {
  return Object.keys(EGE.nfl.teams).filter(function (key) { return EGE.nfl.slug(key) === slug; })[0] || null;
};

EGE.nfl.keyByName = function (name) {
  return Object.keys(EGE.nfl.teams).filter(function (key) { return EGE.nfl.teams[key].name === name; })[0] || null;
};

/* The sim's key for one of the six's teams ('detroit' is DET), and back. */
EGE.nfl.keyForSite = function (siteKey) {
  return Object.keys(EGE.nfl.teams).filter(function (key) { return EGE.nfl.teams[key].site === siteKey; })[0] || null;
};

/* A team's mark, in icon/nfl/, for its own colour: the team pages' header
   and a player's pop-up. A schedule or a standings table, on cream, asks
   EGE.logoFor instead (data/logos.js). */
EGE.nfl.logo = function (key) {
  var team = EGE.nfl.teams[key];
  var file = team && EGE.nflLogos && EGE.nflLogos[team.name];
  return file ? 'icon/nfl/' + file + '.png' : null;
};
