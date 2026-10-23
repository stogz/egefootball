/* ==========================================================================
   EGE Football NFL sim — the 32 teams
   Keyed by nflverse's abbreviations (LA is the Rams, LAC the Chargers), the
   same keys every data file here uses. `site` is the team's key in
   EGE.teams on the website (data/nfl.js), where any of them can have one
   of the six.
   ========================================================================== */

'use strict';

const TEAMS = {
  BUF: { name: 'Buffalo Bills', conf: 'AFC', div: 'East', site: 'buffalo' },
  MIA: { name: 'Miami Dolphins', conf: 'AFC', div: 'East', site: 'miami' },
  NE: { name: 'New England Patriots', conf: 'AFC', div: 'East', site: 'newEngland' },
  NYJ: { name: 'New York Jets', conf: 'AFC', div: 'East', site: 'newYorkJets' },
  BAL: { name: 'Baltimore Ravens', conf: 'AFC', div: 'North', site: 'baltimore' },
  CIN: { name: 'Cincinnati Bengals', conf: 'AFC', div: 'North', site: 'cincinnati' },
  CLE: { name: 'Cleveland Browns', conf: 'AFC', div: 'North', site: 'cleveland' },
  PIT: { name: 'Pittsburgh Steelers', conf: 'AFC', div: 'North', site: 'pittsburgh' },
  HOU: { name: 'Houston Texans', conf: 'AFC', div: 'South', site: 'houston' },
  IND: { name: 'Indianapolis Colts', conf: 'AFC', div: 'South', site: 'indianapolis' },
  JAX: { name: 'Jacksonville Jaguars', conf: 'AFC', div: 'South', site: 'jacksonville' },
  TEN: { name: 'Tennessee Titans', conf: 'AFC', div: 'South', site: 'tennessee' },
  DEN: { name: 'Denver Broncos', conf: 'AFC', div: 'West', site: 'denver' },
  KC: { name: 'Kansas City Chiefs', conf: 'AFC', div: 'West', site: 'kansasCity' },
  LAC: { name: 'Los Angeles Chargers', conf: 'AFC', div: 'West', site: 'losAngelesChargers' },
  LV: { name: 'Las Vegas Raiders', conf: 'AFC', div: 'West', site: 'lasVegas' },
  DAL: { name: 'Dallas Cowboys', conf: 'NFC', div: 'East', site: 'dallas' },
  NYG: { name: 'New York Giants', conf: 'NFC', div: 'East', site: 'newYorkGiants' },
  PHI: { name: 'Philadelphia Eagles', conf: 'NFC', div: 'East', site: 'philadelphia' },
  WAS: { name: 'Washington Commanders', conf: 'NFC', div: 'East', site: 'washington' },
  CHI: { name: 'Chicago Bears', conf: 'NFC', div: 'North', site: 'chicago' },
  DET: { name: 'Detroit Lions', conf: 'NFC', div: 'North', site: 'detroit' },
  GB: { name: 'Green Bay Packers', conf: 'NFC', div: 'North', site: 'greenBay' },
  MIN: { name: 'Minnesota Vikings', conf: 'NFC', div: 'North', site: 'minnesota' },
  ATL: { name: 'Atlanta Falcons', conf: 'NFC', div: 'South', site: 'atlanta' },
  CAR: { name: 'Carolina Panthers', conf: 'NFC', div: 'South', site: 'carolina' },
  NO: { name: 'New Orleans Saints', conf: 'NFC', div: 'South', site: 'newOrleans' },
  TB: { name: 'Tampa Bay Buccaneers', conf: 'NFC', div: 'South', site: 'tampaBay' },
  ARI: { name: 'Arizona Cardinals', conf: 'NFC', div: 'West', site: 'arizona' },
  LA: { name: 'Los Angeles Rams', conf: 'NFC', div: 'West', site: 'losAngelesRams' },
  SF: { name: 'San Francisco 49ers', conf: 'NFC', div: 'West', site: 'sanFrancisco' },
  SEA: { name: 'Seattle Seahawks', conf: 'NFC', div: 'West', site: 'seattle' }
};

const KEYS = Object.keys(TEAMS);

/* A team key from a full name ("Detroit Lions") or a nickname ("Lions"). */
function keyForName(name) {
  const text = String(name || '').toLowerCase();
  return KEYS.filter((key) => {
    const full = TEAMS[key].name.toLowerCase();
    return full === text || full.split(' ').pop() === text;
  })[0] || null;
}

function divisionOf(key) { return TEAMS[key].conf + ' ' + TEAMS[key].div; }

module.exports = { TEAMS, KEYS, keyForName, divisionOf };
