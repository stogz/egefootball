/* ==========================================================================
   EGE Football — the NFL's 32
   Every NFL team, keyed the way the NFL sim keys them (nflverse's
   abbreviations: LA is the Rams, LAC the Chargers), for the Teams pages:
   the name, the conference and division, the colour a player's pop-up is
   drawn on, and the clock it plays on. `site` is the team's key in
   EGE.teams: the six's teams are written out in data/players.js, and every
   other team gets one made below from what is here, so one of the six can
   be traded anywhere (Sam, 2026-10-23). A team with none of the six on it
   has a page that is its roster and nothing else.

   Colours are each team's first colour from nflverse, except where white
   on it would not read: the Saints are on their black and the Titans on
   their navy. `accent` is the colour that goes with it, under the band on
   a player's pop-up (Sam, 2026-10-27: the Bears' orange): the team's
   second colour, or its next where that is black, which would run into
   the black heading of the table under it (the Bengals' and the Jets'
   white).

   The rosters themselves are the sim's (data/nfl-rosters.json, or the
   latest the admin page published to Supabase). See js/app.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.nfl = {
  teams: {
  BUF: { name: 'Buffalo Bills', conf: 'AFC', div: 'East', color: '#00338D', accent: '#C60C30', site: 'buffalo', zone: 'America/New_York' },
  MIA: { name: 'Miami Dolphins', conf: 'AFC', div: 'East', color: '#008E97', accent: '#FC4C02', site: 'miami', zone: 'America/New_York' },
  NE: { name: 'New England Patriots', conf: 'AFC', div: 'East', color: '#002244', accent: '#C60C30', site: 'newEngland', zone: 'America/New_York' },
  NYJ: { name: 'New York Jets', conf: 'AFC', div: 'East', color: '#003F2D', accent: '#FFFFFF', site: 'newYorkJets', zone: 'America/New_York' },
  BAL: { name: 'Baltimore Ravens', conf: 'AFC', div: 'North', color: '#241773', accent: '#9E7C0C', site: 'baltimore', zone: 'America/New_York' },
  CIN: { name: 'Cincinnati Bengals', conf: 'AFC', div: 'North', color: '#FB4F14', accent: '#FFFFFF', site: 'cincinnati', zone: 'America/New_York' },
  CLE: { name: 'Cleveland Browns', conf: 'AFC', div: 'North', color: '#FF3C00', accent: '#311D00', site: 'cleveland', zone: 'America/New_York' },
  PIT: { name: 'Pittsburgh Steelers', conf: 'AFC', div: 'North', color: '#000000', accent: '#FFB612', site: 'pittsburgh', zone: 'America/New_York' },
  HOU: { name: 'Houston Texans', conf: 'AFC', div: 'South', color: '#03202F', accent: '#A71930', site: 'houston', zone: 'America/Chicago' },
  IND: { name: 'Indianapolis Colts', conf: 'AFC', div: 'South', color: '#002C5F', accent: '#A2AAAD', site: 'indianapolis', zone: 'America/Indiana/Indianapolis' },
  JAX: { name: 'Jacksonville Jaguars', conf: 'AFC', div: 'South', color: '#006778', accent: '#D7A22A', site: 'jacksonville', zone: 'America/New_York' },
  TEN: { name: 'Tennessee Titans', conf: 'AFC', div: 'South', color: '#0C2340', accent: '#4B92DB', site: 'tennessee', zone: 'America/Chicago' },
  DEN: { name: 'Denver Broncos', conf: 'AFC', div: 'West', color: '#002244', accent: '#FB4F14', site: 'denver', zone: 'America/Denver' },
  KC: { name: 'Kansas City Chiefs', conf: 'AFC', div: 'West', color: '#E31837', accent: '#FFB81C', site: 'kansasCity', zone: 'America/Chicago' },
  LAC: { name: 'Los Angeles Chargers', conf: 'AFC', div: 'West', color: '#007BC7', accent: '#FFC20E', site: 'losAngelesChargers', zone: 'America/Los_Angeles' },
  LV: { name: 'Las Vegas Raiders', conf: 'AFC', div: 'West', color: '#000000', accent: '#A5ACAF', site: 'lasVegas', zone: 'America/Los_Angeles' },
  DAL: { name: 'Dallas Cowboys', conf: 'NFC', div: 'East', color: '#002244', accent: '#B0B7BC', site: 'dallas', zone: 'America/Chicago' },
  NYG: { name: 'New York Giants', conf: 'NFC', div: 'East', color: '#0B2265', accent: '#A71930', site: 'newYorkGiants', zone: 'America/New_York' },
  PHI: { name: 'Philadelphia Eagles', conf: 'NFC', div: 'East', color: '#004C54', accent: '#A5ACAF', site: 'philadelphia', zone: 'America/New_York' },
  WAS: { name: 'Washington Commanders', conf: 'NFC', div: 'East', color: '#5A1414', accent: '#FFB612', site: 'washington', zone: 'America/New_York' },
  CHI: { name: 'Chicago Bears', conf: 'NFC', div: 'North', color: '#0B162A', accent: '#C83803', site: 'chicago', zone: 'America/Chicago' },
  DET: { name: 'Detroit Lions', conf: 'NFC', div: 'North', color: '#0076B6', accent: '#B0B7BC', site: 'detroit', zone: 'America/Detroit' },
  GB: { name: 'Green Bay Packers', conf: 'NFC', div: 'North', color: '#203731', accent: '#FFB612', site: 'greenBay', zone: 'America/Chicago' },
  MIN: { name: 'Minnesota Vikings', conf: 'NFC', div: 'North', color: '#4F2683', accent: '#FFC62F', site: 'minnesota', zone: 'America/Chicago' },
  ATL: { name: 'Atlanta Falcons', conf: 'NFC', div: 'South', color: '#A71930', accent: '#A5ACAF', site: 'atlanta', zone: 'America/New_York' },
  CAR: { name: 'Carolina Panthers', conf: 'NFC', div: 'South', color: '#0085CA', accent: '#BFC0BF', site: 'carolina', zone: 'America/New_York' },
  NO: { name: 'New Orleans Saints', conf: 'NFC', div: 'South', color: '#101820', accent: '#D3BC8D', site: 'newOrleans', zone: 'America/Chicago' },
  TB: { name: 'Tampa Bay Buccaneers', conf: 'NFC', div: 'South', color: '#A71930', accent: '#B1BABF', site: 'tampaBay', zone: 'America/New_York' },
  ARI: { name: 'Arizona Cardinals', conf: 'NFC', div: 'West', color: '#97233F', accent: '#FFB612', site: 'arizona', zone: 'America/Phoenix' },
  LA: { name: 'Los Angeles Rams', conf: 'NFC', div: 'West', color: '#003594', accent: '#FFD100', site: 'losAngelesRams', zone: 'America/Los_Angeles' },
  SF: { name: 'San Francisco 49ers', conf: 'NFC', div: 'West', color: '#AA0000', accent: '#B3995D', site: 'sanFrancisco', zone: 'America/Los_Angeles' },
  SEA: { name: 'Seattle Seahawks', conf: 'NFC', div: 'West', color: '#002244', accent: '#69BE28', site: 'seattle', zone: 'America/Los_Angeles' }
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

/* What a schedule or a game log calls a team: its city alone -- Detroit,
   Kansas City, Tampa Bay -- not the city and the nickname (Sam,
   2026-10-20). New York and Los Angeles have two teams each, so theirs keep
   enough to tell the two apart: NY Giants, NY Jets, LA Rams, LA Chargers. */
EGE.nfl.SHARED_CITIES = { 'New York': 'NY', 'Los Angeles': 'LA' };

EGE.nfl.city = function (key) {
  var team = EGE.nfl.teams[key];
  if (!team) { return null; }
  var words = team.name.split(' ');
  var nickname = words.pop();
  var city = words.join(' ');
  return EGE.nfl.SHARED_CITIES[city] ? EGE.nfl.SHARED_CITIES[city] + ' ' + nickname : city;
};

/* The sim's key for a team in EGE.teams ('detroit' is DET), and back. */
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

/* Every other team as one the six can play for, in EGE.teams beside the
   ones they were drafted by (data/players.js), so a trade can send one of
   them anywhere (Sam, 2026-10-23): its name and nickname, its division and
   conference, its mark on its colour, and its clock. */
Object.keys(EGE.nfl.teams).forEach(function (key) {
  var team = EGE.nfl.teams[key];
  if (!EGE.teams || EGE.teams[team.site]) { return; }
  EGE.teams[team.site] = {
    school: team.name,
    short: team.name.split(' ').pop(),
    tier: 'nfl',
    league: team.conf + ' ' + team.div,
    conference: team.conf,
    logo: EGE.nfl.logo(key),
    ground: team.color,
    zone: team.zone
  };
});
