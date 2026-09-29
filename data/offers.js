/* ==========================================================================
   EGE Football — college offers
   Who has offered whom, and what an offer looks like on the page: a die-cut
   sticker in the team's colour with the team's mark on it, stuck in the top
   corner of the player's header.

   Two things live here.

   `EGE.colleges` is one entry per school: what to call it, the colour the
   sticker is printed in, the ink an abbreviation is set in when there is no
   logo yet, and the file the mark lives in.

     ground   the sticker's own colour. Picked so the mark reads against it,
              which is not always the school's first colour -- a maroon dog
              on maroon is a hole in the sticker. Every one of these is a
              design choice and a one-line change.
     ink      what the short name is set in, for a school whose mark has not
              been added yet.
     logo     icon/offers/{file}.png. Missing is fine: the sticker falls back
              to the short name, and drops the mark in the moment the file
              lands, with no change here.

   `EGE.offers` is slug -> [school key, ...], in the order they came in.
   Nobody's offers are secret: an offer is a thing a school has said out
   loud, so these draw for anyone reading the page.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.colleges = {
  /* --- Illinois and the Valley ------------------------------------------ */
  /* White rather than ISU red: the cardinal is red, and a red bird on a red
     sticker is a hole. White is the school's other colour and the mark is
     drawn for it. A true white rather than the page's warm cream, so the
     die-cut edge still shows when the sticker lands on the panel. */
  ISU:        { name: 'Illinois State',    short: 'ISU',   ground: '#FFFFFF', ink: '#CE1126', logo: 'ISU' },
  EIU:        { name: 'Eastern Illinois',  short: 'EIU',   ground: '#A7A8AA', ink: '#0033A0', logo: 'EIU' },
  SIU:        { name: 'Southern Illinois', short: 'SIU',   ground: '#72001B', ink: '#F4F1EA', logo: 'SIU' },
  WIU:        { name: 'Western Illinois',  short: 'WIU',   ground: '#582C83', ink: '#FFC72C', logo: 'WIU' },
  UNI:        { name: 'Northern Iowa',     short: 'UNI',   ground: '#FFC72C', ink: '#4F2D7F', logo: 'UNI' },
  /* Navy rather than the crimson this started on. Two reasons: the crimson
     sat against Southeast Missouri's red on Sam's header and the pair read as
     one sticker, and the Sycamore mark is itself royal blue, so a royal blue
     ground would have left only its white keyline holding it apart from the
     colour behind it. Navy gives the mark room and nothing else in his
     handful is near it. */
  INDY:       { name: 'Indy State',        short: 'INDY',  ground: '#0C2340', ink: '#FFFFFF', logo: 'INDY' },
  SEMO:       { name: 'Southeast Missouri', short: 'SEMO', ground: '#C8102E', ink: '#FFFFFF', logo: 'SEMO' },

  /* --- California -------------------------------------------------------- */
  SacState:   { name: 'Sacramento State',  short: 'SAC',   ground: '#00573F', ink: '#C4B581', logo: 'SacState' },
  UCDavis:    { name: 'UC Davis',          short: 'DAVIS', ground: '#FFBF00', ink: '#022851', logo: 'UCDavis' },
  CalPoly:    { name: 'Cal Poly',          short: 'POLY',  ground: '#154734', ink: '#BD8B13', logo: 'CalPoly' },

  /* --- the south --------------------------------------------------------- */
  GaSouthern: { name: 'Georgia Southern',  short: 'GASO',  ground: '#041E42', ink: '#A89968', logo: 'GeorgiaSouthern' },
  FAU:        { name: 'Florida Atlantic',  short: 'FAU',   ground: '#003366', ink: '#FFFFFF', logo: 'FAU' },
  FIU:        { name: 'Florida Intl',      short: 'FIU',   ground: '#081E3F', ink: '#B6862C', logo: 'FIU' },
  /* Black for the gold UCF: the letters carry their own white keyline. Sand
     for the green bull and gold for the maroon BC, so none of the three
     sits on its own colour. */
  UCF:        { name: 'UCF',               short: 'UCF',   ground: '#000000', ink: '#B7A369', logo: 'UCF' },
  USF:        { name: 'South Florida',     short: 'USF',   ground: '#CFC493', ink: '#006747', logo: 'USF' },
  Bethune:    { name: 'Bethune-Cookman',   short: 'BCU',   ground: '#F2A900', ink: '#6F263D', logo: 'Bethune' },

  /* --- the Carolinas and Virginia ---------------------------------------- */
  ODU:        { name: 'Old Dominion',      short: 'ODU',   ground: '#003057', ink: '#A1D2F1', logo: 'dominion' },
  JMU:        { name: 'James Madison',     short: 'JMU',   ground: '#CBB677', ink: '#450084', logo: 'JMU' },
  Elon:       { name: 'Elon',              short: 'ELON',  ground: '#FFFFFF', ink: '#73000A', logo: 'elon' },
  NCCentral:  { name: 'NC Central',        short: 'NCCU',  ground: '#A2AAAD', ink: '#880023', logo: 'NCCentral' },

  /* --- the Mountain West and the desert ----------------------------------- */
  /* Twelve on Cooper's header, so the grounds are spread to keep neighbours
     apart: Fresno on navy rather than red (Arizona has the red), Boise on its
     orange rather than its blue horse's blue, UNLV's red letters on black. */
  SDSU:       { name: 'San Diego State',   short: 'SDSU',  ground: '#FFFFFF', ink: '#A6192E', logo: 'SDSU' },
  Fresno:     { name: 'Fresno State',      short: 'FRES',  ground: '#13284C', ink: '#DB0032', logo: 'Fresno' },
  SJSU:       { name: 'San Jose State',    short: 'SJSU',  ground: '#0055A2', ink: '#E5A823', logo: 'SJSU' },
  Nevada:     { name: 'Nevada',            short: 'NEV',   ground: '#B1B3B3', ink: '#003366', logo: 'Nevada' },
  UNLV:       { name: 'UNLV',              short: 'UNLV',  ground: '#1A1A1A', ink: '#CF0A2C', logo: 'UNLV' },
  ColoState:  { name: 'Colorado State',    short: 'CSU',   ground: '#C8C372', ink: '#1E4D2B', logo: 'ColoradoState' },
  Boise:      { name: 'Boise State',       short: 'BSU',   ground: '#D64309', ink: '#0033A0', logo: 'Boise' },
  Arizona:    { name: 'Arizona',           short: 'ARIZ',  ground: '#AB0520', ink: '#FFFFFF', logo: 'Arizona' },
  ASU:        { name: 'Arizona State',     short: 'ASU',   ground: '#8C1D40', ink: '#FFC627', logo: 'ASU' },

  /* --- the senior-year offers ------------------------------------------- */
  /* Added with the 2019 recruiting calls. Six of these are on the school's
     second colour rather than its first, because the mark itself is in the
     first and vanished into it: EMU and Duke on white, Utah State on
     silver, Cal on gold, Charlotte on its old gold, Navy on its gold. */

  /* Big Ten and the Big 12 */
  Illinois:    { name: 'Illinois',          short: 'ILL',   ground: '#13294B', ink: '#FF5F05', logo: 'Illinois' },
  Iowa:        { name: 'Iowa',              short: 'IOWA',  ground: '#000000', ink: '#FFCD00', logo: 'Iowa' },
  Minnesota:   { name: 'Minnesota',         short: 'MINN',  ground: '#7A0019', ink: '#FFCC33', logo: 'Minnesota' },
  Indiana:     { name: 'Indiana',           short: 'IU',    ground: '#EEEDEB', ink: '#990000', logo: 'Indiana' },
  Purdue:      { name: 'Purdue',            short: 'PUR',   ground: '#CEB888', ink: '#000000', logo: 'Purdue' },
  IowaState:   { name: 'Iowa State',        short: 'IAST',  ground: '#F1BE48', ink: '#C8102E', logo: 'IowaState' },

  /* The MAC */
  NIU:         { name: 'Northern Illinois', short: 'NIU',   ground: '#BA0C2F', ink: '#FFFFFF', logo: 'NIU' },
  BallState:   { name: 'Ball State',        short: 'BALL',  ground: '#FFFFFF', ink: '#BA0C2F', logo: 'BallState' },
  WMU:         { name: 'Western Michigan',  short: 'WMU',   ground: '#6C4023', ink: '#B5A167', logo: 'WMU' },
  EMU:         { name: 'Eastern Michigan',  short: 'EMU',   ground: '#FFFFFF', ink: '#006633', logo: 'EMU' },
  CMU:         { name: 'Central Michigan',  short: 'CMU',   ground: '#6A0032', ink: '#FFC82E', logo: 'CMU' },
  Toledo:      { name: 'Toledo',            short: 'TOL',   ground: '#15397F', ink: '#FFDA00', logo: 'Toledo' },

  /* The Valley */
  YSU:         { name: 'Youngstown State',  short: 'YSU',   ground: '#C8102E', ink: '#FFFFFF', logo: 'YSU' },
  SouthDakota: { name: 'South Dakota',      short: 'USD',   ground: '#FFFFFF', ink: '#AD0000', logo: 'SouthDakota' },

  /* The West */
  WSU:         { name: 'Washington State',  short: 'WSU',   ground: '#981E32', ink: '#FFFFFF', logo: 'WSU' },
  OregonState: { name: 'Oregon State',      short: 'OSU',   ground: '#000000', ink: '#DC4405', logo: 'OregonState' },
  Colorado:    { name: 'Colorado',          short: 'CU',    ground: '#CFB87C', ink: '#000000', logo: 'Colorado' },
  Utah:        { name: 'Utah',              short: 'UTAH',  ground: '#BE0000', ink: '#FFFFFF', logo: 'Utah' },
  Cal:         { name: 'Cal',               short: 'CAL',   ground: '#FDB515', ink: '#003262', logo: 'Cal' },
  Hawaii:      { name: 'Hawaii',            short: 'UH',    ground: '#024731', ink: '#FFFFFF', logo: 'Hawaii' },
  UtahState:   { name: 'Utah State',        short: 'USU',   ground: '#A7A8AA', ink: '#0F2439', logo: 'UtahState' },

  /* The ACC, the academies and the Carolinas */
  WakeForest:  { name: 'Wake Forest',       short: 'WAKE',  ground: '#000000', ink: '#9E7E38', logo: 'WakeForest' },
  NCState:     { name: 'NC State',          short: 'NCSU',  ground: '#CC0000', ink: '#FFFFFF', logo: 'NCState' },
  Duke:        { name: 'Duke',              short: 'DUKE',  ground: '#FFFFFF', ink: '#003087', logo: 'Duke' },
  AppState:    { name: 'App State',         short: 'APP',   ground: '#FFCC00', ink: '#000000', logo: 'AppState' },
  ECU:         { name: 'East Carolina',     short: 'ECU',   ground: '#592A8A', ink: '#FDC82F', logo: 'ECU' },
  Charlotte:   { name: 'Charlotte',         short: 'CLT',   ground: '#B9975B', ink: '#046A38', logo: 'Charlotte' },
  Coastal:     { name: 'Coastal Carolina',  short: 'CCU',   ground: '#006F71', ink: '#A27752', logo: 'Coastal' },
  Army:        { name: 'Army',              short: 'ARMY',  ground: '#D4BF91', ink: '#000000', logo: 'Army' },
  Navy:        { name: 'Navy',              short: 'NAVY',  ground: '#C5B783', ink: '#00205B', logo: 'Navy' },

  /* The South */
  WKU:         { name: 'Western Kentucky',  short: 'WKU',   ground: '#FFFFFF', ink: '#C60C30', logo: 'WKU' },
  SouthAlabama:{ name: 'South Alabama',     short: 'USA',   ground: '#00205B', ink: '#BF0D3E', logo: 'SouthAlabama' },
  FAMU:        { name: 'Florida A&M',       short: 'FAMU',  ground: '#F47321', ink: '#008142', logo: 'FAMU' },
  JaxState:    { name: 'Jacksonville State', short: 'JSU',  ground: '#CC0000', ink: '#FFFFFF', logo: 'JaxState' },

  /* --- after the 2019 playoffs ----------------------------------------- */
  /* Placed against where the real 2020 recruits rated beside each of them
     signed. Grounds picked the same way as the rest: the mark's second
     colour where its first would vanish into it -- Carolina blue on navy,
     Georgia Tech's gold on navy, West Virginia's navy mark on its gold,
     Oregon green on yellow. Nebraska is on white rather than its cream,
     which is the page's own colour and would lose the die-cut edge. */

  /* Big Ten */
  Wisconsin:     { name: 'Wisconsin',          short: 'WIS',   ground: '#FFFFFF', ink: '#C5050C', logo: 'Wisconsin' },
  Nebraska:      { name: 'Nebraska',           short: 'NEB',   ground: '#FFFFFF', ink: '#E41C38', logo: 'Nebraska' },
  MichiganState: { name: 'Michigan State',     short: 'MSU',   ground: '#FFFFFF', ink: '#18453B', logo: 'MichiganState' },
  Northwestern:  { name: 'Northwestern',       short: 'NU',    ground: '#E4E0EE', ink: '#4E2A84', logo: 'Northwestern' },
  Maryland:      { name: 'Maryland',           short: 'UMD',   ground: '#FFD200', ink: '#E03A3E', logo: 'Maryland' },

  /* Pac-12 and BYU */
  UCLA:          { name: 'UCLA',               short: 'UCLA',  ground: '#FFD100', ink: '#2774AE', logo: 'UCLA' },
  USC:           { name: 'USC',                short: 'USC',   ground: '#FFFFFF', ink: '#990000', logo: 'USC' },
  Washington:    { name: 'Washington',         short: 'UW',    ground: '#B7A57A', ink: '#4B2E83', logo: 'Washington' },
  Oregon:        { name: 'Oregon',             short: 'ORE',   ground: '#FEE123', ink: '#154733', logo: 'Oregon' },
  BYU:           { name: 'BYU',                short: 'BYU',   ground: '#FFFFFF', ink: '#002E5D', logo: 'BYU' },

  /* ACC, SEC and the Big 12 */
  UNC:           { name: 'North Carolina',     short: 'UNC',   ground: '#13294B', ink: '#7BAFD4', logo: 'UNC' },
  VirginiaTech:  { name: 'Virginia Tech',      short: 'VT',    ground: '#E5751F', ink: '#630031', logo: 'VirginiaTech' },
  Louisville:    { name: 'Louisville',         short: 'LOU',   ground: '#000000', ink: '#AD0000', logo: 'Louisville' },
  GeorgiaTech:   { name: 'Georgia Tech',       short: 'GT',    ground: '#003057', ink: '#B3A369', logo: 'GeorgiaTech' },
  Syracuse:      { name: 'Syracuse',           short: 'CUSE',  ground: '#000E54', ink: '#F76900', logo: 'Syracuse' },
  SouthCarolina: { name: 'South Carolina',     short: 'SC',    ground: '#FFFFFF', ink: '#73000A', logo: 'SouthCarolina' },
  Kentucky:      { name: 'Kentucky',           short: 'UK',    ground: '#FFFFFF', ink: '#0033A0', logo: 'Kentucky' },
  WestVirginia:  { name: 'West Virginia',      short: 'WVU',   ground: '#EAAA00', ink: '#002855', logo: 'WestVirginia' },

  /* Group of Five and FCS */
  Memphis:       { name: 'Memphis',            short: 'MEM',   ground: '#FFFFFF', ink: '#003087', logo: 'Memphis' },
  Buffalo:       { name: 'Buffalo',            short: 'UB',    ground: '#FFFFFF', ink: '#005BBB', logo: 'Buffalo' },
  MiamiOH:       { name: 'Miami (OH)',         short: 'MIA',   ground: '#FFFFFF', ink: '#C3142D', logo: 'MiamiOH' },
  KentState:     { name: 'Kent State',         short: 'KENT',  ground: '#002664', ink: '#EAAB00', logo: 'KentState' },
  MurrayState:   { name: 'Murray State',       short: 'MUR',   ground: '#ECAC00', ink: '#002144', logo: 'MurrayState' },
  NDSU:          { name: 'North Dakota State', short: 'NDSU',  ground: '#FFC72A', ink: '#0A5640', logo: 'NDSU' },

  /* --- after the 2019 re-rankings ---------------------------------------- */
  /* The national programmes that came in once Sam, Cooper, Andrew and Jaykeb
     climbed into the top of 247's 2020 lists. As before, the ground is the
     school's second colour wherever the mark is drawn in its first: the
     crimson A on Alabama's grey, the orange paw on Clemson purple, the
     Gator on Florida blue, the Seminole on gold, the Georgia G on red
     (black would make three black stickers on Andrew's header), the U on
     Miami green, the block M on navy, the navy ND on gold and Ohio State on
     its grey. Tennessee's orange T is on white rather than its smokey grey,
     so it does not sit beside Ohio State's grey on Jaykeb's header. */
  Alabama:       { name: 'Alabama',            short: 'BAMA',  ground: '#828A8F', ink: '#9E1B32', logo: 'Alabama' },
  Clemson:       { name: 'Clemson',            short: 'CLEM',  ground: '#522D80', ink: '#F56600', logo: 'Clemson' },
  Florida:       { name: 'Florida',            short: 'UF',    ground: '#0021A5', ink: '#FA4616', logo: 'Florida' },
  FloridaState:  { name: 'Florida State',      short: 'FSU',   ground: '#CEB888', ink: '#782F40', logo: 'FloridaState' },
  Georgia:       { name: 'Georgia',            short: 'UGA',   ground: '#BA0C2F', ink: '#FFFFFF', logo: 'Georgia' },
  Miami:         { name: 'Miami',              short: 'MIA',   ground: '#005030', ink: '#F47321', logo: 'Miami' },
  Michigan:      { name: 'Michigan',           short: 'MICH',  ground: '#00274C', ink: '#FFCB05', logo: 'Michigan' },
  NotreDame:     { name: 'Notre Dame',         short: 'ND',    ground: '#C99700', ink: '#0C2340', logo: 'NotreDame' },
  OhioState:     { name: 'Ohio State',         short: 'OSU',   ground: '#666666', ink: '#FFFFFF', logo: 'OhioState' },
  Oklahoma:      { name: 'Oklahoma',           short: 'OU',    ground: '#FFFFFF', ink: '#841617', logo: 'Oklahoma' },
  PennState:     { name: 'Penn State',         short: 'PSU',   ground: '#FFFFFF', ink: '#041E42', logo: 'PennState' },
  Stanford:      { name: 'Stanford',           short: 'STAN',  ground: '#FFFFFF', ink: '#8C1515', logo: 'Stanford' },
  Tennessee:     { name: 'Tennessee',          short: 'TENN',  ground: '#FFFFFF', ink: '#FF8200', logo: 'Tennessee' }
};

/* Who has offered whom. Add a key to a list and the sticker is on the page;
   there is nothing else to change.

   The four biggest handfuls -- Sam, Cooper, Andrew and Jaykeb -- were cut
   back to their best seventeen or eighteen: past that the corner was a pile
   rather than a handful, and the smallest programmes at the bottom of it
   were the ones nobody was looking for. Their schools stay in
   `EGE.colleges` above, so putting one back is putting its key back. */
EGE.offers = {
  'sam-stogsdill': ['NIU', 'BallState',
                    'Illinois', 'Iowa', 'Minnesota', 'Indiana', 'Purdue', 'IowaState',
                    'Wisconsin', 'Nebraska', 'MichiganState', 'Northwestern',
                    'NotreDame', 'OhioState', 'Michigan', 'PennState', 'Alabama'],
  'paxon-hatch':   ['ISU', 'UNI', 'WIU', 'EIU', 'SIU',
                    'INDY', 'YSU', 'SouthDakota', 'NIU', 'BallState',
                    'MiamiOH', 'WMU', 'Toledo', 'EMU', 'MurrayState', 'NDSU'],
  'cooper-clark':  ['Boise', 'Arizona', 'ASU',
                    'WSU', 'OregonState', 'Colorado', 'Utah', 'Cal',
                    'UCLA', 'Washington', 'Oregon', 'BYU', 'USC',
                    'Stanford', 'NotreDame', 'Georgia', 'Oklahoma', 'Michigan'],
  'jaykeb-stewart': ['GaSouthern', 'UCF', 'USF',
                     'SouthAlabama', 'WKU',
                     'GeorgiaTech', 'WestVirginia', 'Louisville', 'Syracuse', 'Kentucky', 'Memphis',
                     'Florida', 'FloridaState', 'Miami', 'Georgia', 'Tennessee', 'OhioState'],
  'andrew-parr':   ['AppState', 'Army', 'Navy',
                    'WakeForest', 'NCState', 'Duke',
                    'UNC', 'VirginiaTech', 'SouthCarolina', 'Maryland', 'Louisville',
                    'Clemson', 'NotreDame', 'PennState', 'Georgia', 'Michigan',
                    'Alabama', 'OhioState'],
  'isaac-vitel':   ['ISU', 'EIU', 'WIU', 'SIU', 'SEMO', 'INDY', 'NIU', 'BallState', 'UNI',
                    'Illinois', 'Toledo', 'WMU', 'Buffalo', 'MiamiOH', 'KentState']
};

/* Where each of them stands as a recruit, the way 247Sports would have it:
   the stars, the rating behind them (70-79 is two stars, 80-89 three,
   90-97 four, 98 and up five), and the rank among the players at that
   position in that state, and the rank at that position nationally. Drawn
   under the name on the player's page.

   The ranks are placed against the real 247Sports 2020 class: the rating
   is the simulation's, and the rank is where it falls among the real
   recruits at the same position in the same state, and in the whole
   country: one more than the real players at that position rated above
   it. A quarterback is
   counted against pro-style and dual-threat alike, and a back against
   247's RBs. Who is above each of them, as 247 has it, after the 2019
   season and its playoffs:

     Sam      #5  nationally, after 3,247 yards and 43 touchdowns on the
                  ground and a Class 7A state final lost in overtime (287
                  yards, 4 touchdowns in it): Bijan Robinson (Salpointe
                  Catholic, AZ, 98), Demarkcus Bowman (Lakeland, FL, 98),
                  Zach Evans (North Shore, TX, 97) and Jahmyr Gibbs
                  (Dalton, GA, 97); level with six at 95
     Cooper   #2  in California, behind Kendall Milton (Buchanan, 95); #11
                  nationally, level with Woody Marks and Jaylan Knighton
                  (94), after 1,810 rushing and 732 receiving yards, 30
                  touchdowns and the CIF-SDS Open Division title
     Andrew   #3  nationally, after his 2019 senior year (113 catches,
                  1,837 yards, 30 touchdowns): Arik Gilbert (Marietta, GA,
                  99) and Michael Mayer (Covington Catholic, KY, 98); level
                  with Theo Johnson (Holy Names, ON, 96)
     Jaykeb   #1  in Florida, now clear of Carson Beck (Mandarin) and
                  Anthony Richardson (Eastside), both 92; #12 nationally
                  after going 14-0 to the FHSAA 6A title with 3,761 yards,
                  45 touchdowns and 4 interceptions
     Paxon    #5  as a wide receiver, the position Paxon is recruited at
                  though he plays tight end: A.J. Henning (Lincoln-Way
                  East, 94), Jadon Thompson (Naperville Central, 89),
                  Kaevion Mack (Peoria, 84), Lawaun Powell (East St.
                  Louis, 83)
     Sam, Andrew, Jaykeb and Isaac are rated above everybody real in
     their state. */
EGE.recruiting = {
  'sam-stogsdill':  { stars: 4, rating: 95, stateRank: 1,  nationalRank: 5,   position: 'RB', state: 'Illinois' },
  'cooper-clark':   { stars: 4, rating: 94, stateRank: 2,  nationalRank: 11,  position: 'RB', state: 'California' },
  'andrew-parr':    { stars: 4, rating: 96, stateRank: 1,  nationalRank: 3,   position: 'TE', state: 'North Carolina' },
  'jaykeb-stewart': { stars: 4, rating: 93, stateRank: 1,  nationalRank: 12,  position: 'QB', state: 'Florida' },
  'isaac-vitel':    { stars: 3, rating: 84, stateRank: 1,  nationalRank: 71,  position: 'QB', state: 'Illinois' },
  'paxon-hatch':    { stars: 3, rating: 81, stateRank: 5,  nationalRank: 269, position: 'WR', state: 'Illinois' }
};

/* The offers a player is holding, as whole college records rather than keys.
   A key with no college behind it is dropped rather than drawn blank. */
EGE.offersFor = function (player) {
  if (!player) { return []; }
  return (EGE.offers[player.slug] || []).map(function (key) {
    var college = EGE.colleges[key];
    return college ? { key: key, college: college } : null;
  }).filter(Boolean);
};
