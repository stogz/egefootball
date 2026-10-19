/* ==========================================================================
   EGE Football NFL sim — overalls set by hand
   The formula in build/ratings.js gets most players about right. These are
   the ones it does not, checked against how the league saw them going into
   2023 (Madden 24's launch ratings, PFF's preseason top 101, and the
   All-Pro voting for 2022):

   - stars whose 2022 was lost or cut short by injury (Cooper Kupp, T.J.
     Watt, Lamar Jackson, Matthew Stafford), whom a season score undersells;
   - offensive linemen, for whom snap counts and pay are all the public
     data there is, so the best tackles in football otherwise rate like
     every other full-time starter;
   - the 99s. Sam wants them rare -- one a position at most -- so they are
     only ever set here: Patrick Mahomes, Justin Jefferson, Travis Kelce,
     Nick Bosa (the 2022 Defensive Player of the Year) and Aaron Donald.

   Each is keyed by the player's name as nflverse spells it. `pos` guards
   against a namesake (there are two Josh Allens). `pot` sets a ceiling as
   well, for a young star whose formula ceiling is off.
   ========================================================================== */

'use strict';

const HAND_SET = {
  /* Quarterbacks */
  'Patrick Mahomes': { ovr: 99 },
  'Josh Allen': { pos: 'QB', ovr: 92, pot: 94 },
  'Jalen Hurts': { ovr: 91 },
  'Lamar Jackson': { ovr: 91, pot: 94 },
  'Justin Herbert': { ovr: 89, pot: 91 },
  'Dak Prescott': { ovr: 86 },
  'Trevor Lawrence': { ovr: 85, pot: 89 },
  'Tua Tagovailoa': { ovr: 85, pot: 87 },
  'Kirk Cousins': { ovr: 84 },
  'Matthew Stafford': { ovr: 84 },
  'Kyler Murray': { ovr: 83 },
  'Geno Smith': { ovr: 82 },
  'Derek Carr': { ovr: 80 },
  'Jimmy Garoppolo': { ovr: 79 },
  'Justin Fields': { ovr: 78 },
  'Daniel Jones': { ovr: 77 },
  'Deshaun Watson': { ovr: 77 },
  'Ryan Tannehill': { ovr: 77 },
  'Russell Wilson': { ovr: 78 },
  'Mac Jones': { ovr: 72 },
  'Kenny Pickett': { ovr: 71 },
  'Teddy Bridgewater': { ovr: 70 },
  'Marcus Mariota': { ovr: 70 },
  'Sam Darnold': { ovr: 70 },
  'Zach Wilson': { ovr: 66 },

  /* Running backs */
  'Christian McCaffrey': { ovr: 98 },
  'Nick Chubb': { ovr: 96 },
  'Josh Jacobs': { ovr: 92 },
  'Derrick Henry': { ovr: 91 },
  'Saquon Barkley': { ovr: 91 },
  'Austin Ekeler': { ovr: 89 },
  'Aaron Jones': { ovr: 88 },
  'Tony Pollard': { ovr: 88 },
  'Alvin Kamara': { ovr: 86 },
  'Joe Mixon': { ovr: 84 },
  'Dalvin Cook': { ovr: 84 },

  /* Receivers */
  'Justin Jefferson': { ovr: 99 },
  'Tyreek Hill': { ovr: 97 },
  'Davante Adams': { ovr: 95 },
  "Ja'Marr Chase": { ovr: 95, pot: 98 },
  'Cooper Kupp': { ovr: 94 },
  'Stefon Diggs': { ovr: 93 },
  'A.J. Brown': { ovr: 93 },
  'CeeDee Lamb': { ovr: 92, pot: 96 },
  'Amon-Ra St. Brown': { ovr: 91, pot: 94 },
  'Jaylen Waddle': { ovr: 89, pot: 92 },
  'Mike Evans': { ovr: 89 },
  'Keenan Allen': { ovr: 89 },
  'Deebo Samuel': { ovr: 88 },
  'DK Metcalf': { ovr: 88 },
  'DeVonta Smith': { ovr: 88, pot: 91 },
  'Garrett Wilson': { ovr: 87, pot: 95 },
  'Tee Higgins': { ovr: 87 },
  'Terry McLaurin': { ovr: 87 },
  'Chris Godwin': { ovr: 87 },
  'Amari Cooper': { ovr: 86 },
  'D.J. Moore': { ovr: 86 },
  'Chris Olave': { ovr: 86, pot: 91 },

  /* Tight ends */
  'Travis Kelce': { ovr: 99 },
  'Mark Andrews': { ovr: 93 },
  'George Kittle': { ovr: 92 },
  'T.J. Hockenson': { ovr: 87 },
  'Dallas Goedert': { ovr: 86 },
  'Darren Waller': { ovr: 85 },
  'Kyle Pitts': { pot: 88 },
  'Cole Kmet': { ovr: 83 },
  'Dalton Schultz': { ovr: 82 },
  'Dawson Knox': { ovr: 80 },
  'Hunter Henry': { ovr: 80 },

  /* Offensive line */
  'Trent Williams': { ovr: 98 },
  'Lane Johnson': { ovr: 95 },
  'Tristan Wirfs': { ovr: 93, pot: 96 },
  'Andrew Thomas': { ovr: 92 },
  'Laremy Tunsil': { ovr: 91 },
  'Penei Sewell': { ovr: 91, pot: 97 },
  'Rashawn Slater': { ovr: 89 },
  'Terron Armstead': { ovr: 89 },
  'Jordan Mailata': { ovr: 89 },
  'Christian Darrisaw': { ovr: 88 },
  'Kolton Miller': { ovr: 88 },
  'David Bakhtiari': { ovr: 86 },
  'Taylor Moton': { ovr: 86 },
  'Jawaan Taylor': { ovr: 84 },
  'Kaleb McGary': { ovr: 83 },
  'Zack Martin': { ovr: 97 },
  'Jason Kelce': { ovr: 94 },
  'Chris Lindstrom': { ovr: 94 },
  'Joel Bitonio': { ovr: 94 },
  'Joe Thuney': { ovr: 92 },
  'Quenton Nelson': { ovr: 91 },
  'Creed Humphrey': { ovr: 91 },
  'Frank Ragnow': { ovr: 89 },
  'Wyatt Teller': { ovr: 88 },
  'Landon Dickerson': { ovr: 88 },
  'Elgton Jenkins': { ovr: 87 },
  'Laken Tomlinson': { ovr: 82 },
  'Robert Hunt': { ovr: 84 },

  /* Edge rushers */
  'Nick Bosa': { ovr: 99 },
  'T.J. Watt': { ovr: 96 },
  'Myles Garrett': { ovr: 96 },
  'Micah Parsons': { ovr: 95, pot: 97 },
  'Maxx Crosby': { ovr: 94 },
  'Trey Hendrickson': { ovr: 89 },
  'Haason Reddick': { ovr: 89 },
  'Brian Burns': { ovr: 89 },
  'Joey Bosa': { ovr: 88 },
  'Matt Judon': { ovr: 88 },
  'Danielle Hunter': { ovr: 87 },
  'Aidan Hutchinson': { ovr: 86, pot: 94 },
  'Khalil Mack': { ovr: 85 },
  'Harold Landry': { ovr: 84 },
  'Von Miller': { ovr: 85 },

  /* Interior defensive line */
  'Aaron Donald': { ovr: 99 },
  'Chris Jones': { ovr: 96 },
  'Quinnen Williams': { ovr: 93 },
  'Dexter Lawrence': { ovr: 93 },
  'Cameron Heyward': { ovr: 92 },
  'Jeffery Simmons': { ovr: 92 },
  'DeForest Buckner': { ovr: 90 },
  'Daron Payne': { ovr: 89 },
  'Jonathan Allen': { ovr: 89 },
  'Vita Vea': { ovr: 88 },

  /* Linebackers */
  'Fred Warner': { ovr: 96 },
  'Roquan Smith': { ovr: 95 },
  'Matt Milano': { ovr: 92 },
  'Demario Davis': { ovr: 90 },
  'Bobby Wagner': { ovr: 88 },
  'Lavonte David': { ovr: 88 },
  'C.J. Mosley': { ovr: 87 },
  'Foyesade Oluokun': { ovr: 86 },
  'Dre Greenlaw': { ovr: 86 },
  'Devin White': { ovr: 85 },

  /* Corners */
  'Ahmad Gardner': { ovr: 94, pot: 97 },
  'Patrick Surtain': { ovr: 94, pot: 97 },
  'Jalen Ramsey': { ovr: 92 },
  'Jaire Alexander': { ovr: 92 },
  'Darius Slay': { ovr: 90 },
  'Marlon Humphrey': { ovr: 90 },
  'Trevon Diggs': { ovr: 88 },
  'Denzel Ward': { ovr: 88 },
  'Charvarius Ward': { ovr: 88 },
  'James Bradberry': { ovr: 87 },
  'Xavien Howard': { ovr: 87 },
  "L'Jarius Sneed": { ovr: 87 },
  'Marshon Lattimore': { ovr: 87 },
  'Tariq Woolen': { ovr: 86 },
  'Michael Davis': { ovr: 80 },

  /* Safeties */
  'Derwin James': { ovr: 95 },
  'Minkah Fitzpatrick': { ovr: 94 },
  'Justin Simmons': { ovr: 91 },
  'Jessie Bates': { ovr: 90 },
  'Kevin Byard': { ovr: 89 },
  'Harrison Smith': { ovr: 89 },
  'Budda Baker': { ovr: 89 },
  'Antoine Winfield': { ovr: 89 },
  'Kyle Hamilton': { ovr: 87, pot: 96 },
  'Jordan Poyer': { ovr: 88 },
  'Tyrann Mathieu': { ovr: 87 },
  'Jevon Holland': { ovr: 87 },
  'Talanoa Hufanga': { ovr: 86 },

  /* Kickers */
  'Justin Tucker': { ovr: 98 },
  'Harrison Butker': { ovr: 93 },
  'Daniel Carlson': { ovr: 92 },
  'Jake Elliott': { ovr: 91 },
  'Evan McPherson': { ovr: 90 }
};

/* Players nflverse files at a position they do not play for the sim:
   Jalen Ramsey and James Bradberry were corners in 2023. */
const POSITION_FIX = {
  'Jalen Ramsey': 'CB',
  'James Bradberry': 'CB'
};

module.exports = { HAND_SET, POSITION_FIX };
