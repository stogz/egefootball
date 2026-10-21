/* ==========================================================================
   EGE Football NFL sim — the 32 teams
   Keyed by nflverse's abbreviations (LA is the Rams, LAC the Chargers), the
   same keys every data file here uses. `site` is the team's key in
   EGE.teams on the website, for the ones the six are on.
   ========================================================================== */

'use strict';

const TEAMS = {
  BUF: { name: 'Buffalo Bills', conf: 'AFC', div: 'East' },
  MIA: { name: 'Miami Dolphins', conf: 'AFC', div: 'East' },
  NE: { name: 'New England Patriots', conf: 'AFC', div: 'East' },
  NYJ: { name: 'New York Jets', conf: 'AFC', div: 'East' },
  BAL: { name: 'Baltimore Ravens', conf: 'AFC', div: 'North' },
  CIN: { name: 'Cincinnati Bengals', conf: 'AFC', div: 'North' },
  CLE: { name: 'Cleveland Browns', conf: 'AFC', div: 'North' },
  PIT: { name: 'Pittsburgh Steelers', conf: 'AFC', div: 'North' },
  HOU: { name: 'Houston Texans', conf: 'AFC', div: 'South', site: 'houston' },
  IND: { name: 'Indianapolis Colts', conf: 'AFC', div: 'South' },
  JAX: { name: 'Jacksonville Jaguars', conf: 'AFC', div: 'South' },
  TEN: { name: 'Tennessee Titans', conf: 'AFC', div: 'South' },
  DEN: { name: 'Denver Broncos', conf: 'AFC', div: 'West' },
  KC: { name: 'Kansas City Chiefs', conf: 'AFC', div: 'West' },
  LAC: { name: 'Los Angeles Chargers', conf: 'AFC', div: 'West' },
  LV: { name: 'Las Vegas Raiders', conf: 'AFC', div: 'West' },
  DAL: { name: 'Dallas Cowboys', conf: 'NFC', div: 'East' },
  NYG: { name: 'New York Giants', conf: 'NFC', div: 'East', site: 'newYorkGiants' },
  PHI: { name: 'Philadelphia Eagles', conf: 'NFC', div: 'East' },
  WAS: { name: 'Washington Commanders', conf: 'NFC', div: 'East' },
  CHI: { name: 'Chicago Bears', conf: 'NFC', div: 'North', site: 'chicago' },
  DET: { name: 'Detroit Lions', conf: 'NFC', div: 'North', site: 'detroit' },
  GB: { name: 'Green Bay Packers', conf: 'NFC', div: 'North' },
  MIN: { name: 'Minnesota Vikings', conf: 'NFC', div: 'North' },
  ATL: { name: 'Atlanta Falcons', conf: 'NFC', div: 'South' },
  CAR: { name: 'Carolina Panthers', conf: 'NFC', div: 'South' },
  NO: { name: 'New Orleans Saints', conf: 'NFC', div: 'South' },
  TB: { name: 'Tampa Bay Buccaneers', conf: 'NFC', div: 'South', site: 'tampaBay' },
  ARI: { name: 'Arizona Cardinals', conf: 'NFC', div: 'West' },
  LA: { name: 'Los Angeles Rams', conf: 'NFC', div: 'West' },
  SF: { name: 'San Francisco 49ers', conf: 'NFC', div: 'West' },
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
