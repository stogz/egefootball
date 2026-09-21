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
  FIU:        { name: 'Florida Intl',      short: 'FIU',   ground: '#081E3F', ink: '#B6862C', logo: 'FIU' }
};

/* Who has offered whom. Add a key to a list and the sticker is on the page;
   there is nothing else to change. */
EGE.offers = {
  'sam-stogsdill': ['ISU', 'EIU', 'SIU', 'INDY', 'SEMO'],
  'paxon-hatch':   ['ISU', 'UNI', 'WIU'],
  'cooper-clark':  ['SacState', 'UCDavis', 'CalPoly'],
  'jaykeb-stewart': ['GaSouthern', 'FAU', 'FIU']
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
