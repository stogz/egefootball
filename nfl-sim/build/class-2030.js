/* ==========================================================================
   EGE Football NFL sim — the 2030 draft class
   Writes the 2030 class into nfl-sim/data/prospects.json, after the 2029
   class (Sam, 2026-11-14: "This class will be the first fully fictional
   draft class. Use unused headshots from players in Division 2 Schools and
   just assign them fictional names that are realistic to the NFL, give them
   all better colleges like a lot of them should be going to places like
   Ohio State, Florida, Miami, Alabama, Georgia, Notre Dame, all of the top
   football colleges, some of the later picks should go to smaller schools.
   Assign them all fictional positions and skills"; then "If you can't find
   a bunch of Division II headshots, just take a bunch of unused college
   football headshots and use them ... They just have to be unused in the
   sim"):

     node nfl-sim/build/class-2030.js

   Every one of the 320 is made up (`madeUp`, as 48 of the 2029 class were):

   - His picture is a real ESPN college headshot that is nowhere else on the
     site (build/class-2030-sources.json). ESPN has pictures of very few
     Division II players, so four are from Ferris State and the rest from
     four small FBS rosters, each checked for ESPN's nophoto picture.
   - His position suits the build of the player in the picture, and the
     positions take turns by their share of a real class (the 2028 class's
     MIX), quarterbacks, pass rushers, tackles, receivers and corners going
     first in the first round and kickers not before pick 180.
   - His name sounds like an NFL player's and is nobody's: no college player
     of 2021-2026, no NFL player ever, nobody in an earlier class.
   - His school is real: the top of the class mostly from the best programs
     (Ohio State, Georgia, Alabama, Texas ...), the late rounds more and more
     from smaller ones, Division II among them.
   - His skills are his own: an archetype that suits his build (a 230-pound
     back is a Power Back more often than not), given as a lean on each of
     his position's skills (`style`, lib/draft.js styleOf) and a forty time
     for the skill that is speed. The Mock Draft shows that archetype, and
     he is drafted with it.

   The class is as strong as 2029's: a point and a half above 2027 at every
   pick (prospects.json `lift`), and nobody's draft-night overall is set.
   Where anyone goes is still the sim's draft, by its own order and every
   team's needs.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { read, download } = require('./nflverse');
const { rows } = require('./write');
const { hash, seeded } = require('../lib/rng');
const { SKILLS } = require('../lib/skills');
const c27 = require('./class-2027');
const c28 = require('./class-2028');

const YEAR = 2030;
const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(__dirname, '..', 'data', 'prospects.json');
const SOURCES = require('./class-2030-sources.json');
const SIZE = 320;
/* Points on every pick's overall and ceiling, against the 2027 class: the
   same as 2028's and 2029's. */
const LIFT = 1.5;
/* Kickers go in the late rounds. */
const KICKERS_FROM = 180;
/* The picks that get a picture with an NFL build. */
const TOP_BUILD = 64;
const MIX = c28.MIX;
/* How much more (or less) often each position comes up in the first round
   than its share: the premium positions go early. */
const FIRST_ROUND = { QB: 1.7, EDGE: 1.8, OT: 1.6, WR: 1.4, CB: 1.3, DI: 1.1, RB: 0.6, TE: 0.5, S: 0.6, LB: 0.6, IOL: 0.6, K: 0 };

/* ---------------------------------------------------------------- names -- */

/* First names and surnames heard around the NFL. The six's own names are
   not among them. */
const FIRST = ['Aaron', 'Adonai', 'Aidan', 'Alijah', 'Alonzo', 'Amari', 'Andre', 'Antonio', 'Armani', 'Ashton', 'Austin', 'Avery',
  'Beau', 'Blake', 'Bo', 'Braden', 'Brady', 'Brandon', 'Brayden', 'Brennan', 'Brock', 'Bryce', 'Bryson', 'Cade', 'Caden', 'Caleb',
  'Calvin', 'Camden', 'Cameron', 'Carson', 'Carter', 'Cayden', 'Cedric', 'Chase', 'Chidi', 'Christian', 'Clay', 'Colby', 'Cole',
  'Colton', 'Connor', 'Corey', 'Cortez', 'Curtis', 'Dakota', 'Dallas', 'Damarion', 'Damien', 'Damon', 'Dante', 'Darian', 'Darius',
  'Darnell', 'Davion', 'Dawson', 'DeAndre', 'DeMarcus', 'Demetrius', 'Deonte', 'Derek', 'Derrick', 'Desmond', 'Devin', 'Devon',
  'Dexter', 'D\'Marco', 'Dominic', 'Donovan', 'Drake', 'Drew', 'Dylan', 'Eli', 'Elijah', 'Emeka', 'Emmanuel', 'Eric', 'Ethan', 'Evan',
  'Femi', 'Gabe', 'Garrett', 'Gavin', 'Grady', 'Graham', 'Grant', 'Hayden', 'Hunter', 'Isaia', 'Isaiah', 'Jabari', 'Jace', 'Jackson',
  'Jadon', 'Jake', 'Ja\'Kobi', 'Jalen', 'Jamal', 'Jamari', 'Jameson', 'Jamir', 'Ja\'Quan', 'Jared', 'Jarrett', 'Javon', 'Jaxon',
  'Jayden', 'Jaylen', 'Jaylin', 'Jayson', 'Jermaine', 'Jett', 'Joel', 'Jonah', 'Jordan', 'Josh', 'Josiah', 'Julian', 'Justin',
  'Kaden', 'Kai', 'Kalani', 'Kaleb', 'Kamari', 'Kareem', 'Keanu', 'Keaton', 'Keegan', 'Kei\'Shawn', 'Keith', 'Kelechi', 'Kendall',
  'Kendrick', 'Kenny', 'Keon', 'Keshawn', 'Kevin', 'Khalil', 'Kobe', 'Kolby', 'Korey', 'Kyle', 'Kyler', 'Lamar', 'Landon',
  'Lawrence', 'Levi', 'Logan', 'Lucas', 'Luke', 'Malachi', 'Malik', 'Marcus', 'Mario', 'Marquez', 'Marquis', 'Marshall', 'Mason',
  'Matthew', 'Maurice', 'Max', 'Micah', 'Michael', 'Miles', 'Mitchell', 'Mosiah', 'Nate', 'Nathan', 'Nick', 'Noah', 'Nolan', 'Obinna',
  'Omar', 'Omari', 'Owen', 'Parker', 'Peyton', 'Preston', 'Quentin', 'Quinn', 'Rashaan', 'Rashad', 'Reed', 'Reggie', 'Ricky',
  'Riley', 'Robert', 'Roman', 'Ryan', 'Sean', 'Sebastian', 'Shane', 'Shawn', 'Sione', 'Spencer', 'Tanner', 'Tavion', 'Terrance',
  'Terrell', 'Tevita', 'Tobi', 'Tommy', 'Tre\'Von', 'Trent', 'Trevor', 'Trey', 'Tristan', 'Troy', 'Tucker', 'Ty', 'Tyler', 'Tyree',
  'Tyrell', 'Tyson', 'Vincent', 'Wesley', 'Will', 'Wyatt', 'Xavier', 'Zach', 'Zaire', 'Zion'];
const LAST = ['Abbott', 'Acosta', 'Adams', 'Adebayo', 'Adeleke', 'Aguilar', 'Alexander', 'Allen', 'Alston', 'Anderson',
  'Andrews', 'Armstrong', 'Arnold', 'Atkins', 'Aumavae', 'Austin', 'Ayers', 'Bailey', 'Baker', 'Banks', 'Barnes', 'Barrett',
  'Bass', 'Bates', 'Battle', 'Baxter', 'Beasley', 'Beck', 'Bell', 'Bennett', 'Benson', 'Bishop', 'Black', 'Blackmon', 'Blair',
  'Blake', 'Bland', 'Bolden', 'Booker', 'Bowers', 'Bowman', 'Boyd', 'Bradley', 'Bradshaw', 'Brewer', 'Bridges', 'Briggs',
  'Brooks', 'Brown', 'Bryant', 'Buchanan', 'Burke', 'Burns', 'Burton', 'Bush', 'Butler', 'Byrd', 'Caldwell', 'Campbell',
  'Cannon', 'Carr', 'Carroll', 'Carter', 'Cash', 'Castillo', 'Chambers', 'Chandler', 'Chapman', 'Chavez', 'Cherry', 'Clayton',
  'Cline', 'Cobb', 'Coleman', 'Collins', 'Conner', 'Cook', 'Copeland', 'Cotton', 'Cox', 'Craig', 'Crawford', 'Crosby', 'Cross',
  'Cunningham', 'Curry', 'Daniels', 'Daugherty', 'Davenport', 'Davis', 'Dawson', 'Day', 'Dean', 'Delgado', 'Dennis', 'Dillard',
  'Dixon', 'Dorsey', 'Dotson', 'Douglas', 'Doyle', 'Drummond', 'Dudley', 'Dukes', 'Duncan', 'Dunn', 'Edwards', 'Elliott',
  'Ellis', 'Epps', 'Evans', 'Eze', 'Faalele', 'Farmer', 'Ferguson', 'Fields', 'Fifita', 'Fisher', 'Fleming', 'Fletcher',
  'Flowers', 'Floyd', 'Fonoti', 'Ford', 'Foster', 'Fowler', 'Franklin', 'Frazier', 'Freeman', 'Fuller', 'Gaines', 'Gamble',
  'Gardner', 'Garner', 'Garrett', 'Gates', 'Gibbs', 'Gibson', 'Gilbert', 'Gill', 'Glover', 'Goodwin', 'Gordon', 'Graham',
  'Granger', 'Grant', 'Graves', 'Gray', 'Green', 'Greer', 'Griffin', 'Guidry', 'Hairston', 'Hale', 'Haley', 'Hall', 'Hamilton',
  'Hampton', 'Hanna', 'Hardy', 'Harmon', 'Harper', 'Harrell', 'Harris', 'Hart', 'Hatcher', 'Hawkins', 'Hayes', 'Haynes',
  'Henderson', 'Hendricks', 'Henry', 'Herrera', 'Hester', 'Hicks', 'Hill', 'Hines', 'Hinton', 'Hobbs', 'Hogan', 'Holland',
  'Holloway', 'Holmes', 'Holt', 'Hood', 'Hooper', 'Hopkins', 'Horne', 'Horton', 'House', 'Houston', 'Howard', 'Hubbard',
  'Hudson', 'Hughes', 'Hunt', 'Hurst', 'Ingram', 'Irving', 'Ivory', 'Jackson', 'Jacobs', 'James', 'Jarrett', 'Jefferson',
  'Jenkins', 'Johnson', 'Jones', 'Jordan', 'Joyner', 'Kelly', 'Kemp', 'Kennedy', 'King', 'Kirby', 'Knight', 'Lacy', 'Lamb',
  'Lane', 'Langston', 'Lawrence', 'Ledbetter', 'Leota', 'Lewis', 'Little', 'Lockett', 'Lofton', 'Lolohea', 'Love', 'Lucas',
  'Lyons', 'Mack', 'Maddox', 'Mann', 'Marsh', 'Marshall', 'Martin', 'Mason', 'Matthews', 'Mauga', 'Maxwell', 'McBride', 'McCall',
  'McClain', 'McCoy', 'McCray', 'McDaniel', 'McGee', 'McIntosh', 'McKinney', 'McKnight', 'McNeil', 'Meeks', 'Melton', 'Mendoza',
  'Merritt', 'Miles', 'Miller', 'Mims', 'Mitchell', 'Moala', 'Montgomery', 'Moody', 'Moore', 'Morgan', 'Morris', 'Mosley',
  'Moss', 'Murphy', 'Murray', 'Nash', 'Navarro', 'Neal', 'Nelson', 'Newton', 'Nichols', 'Nix', 'Norman', 'Norris', 'Nwachukwu',
  'Oakes', 'Obi', 'Odom', 'Okafor', 'Okonkwo', 'Oliver', 'Ortega', 'Owens', 'Pace', 'Page', 'Palmer', 'Parker', 'Parrish',
  'Patterson', 'Payne', 'Pearson', 'Peoples', 'Perkins', 'Perry', 'Peters', 'Phillips', 'Pierce', 'Pittman', 'Pope', 'Porter',
  'Powell', 'Pratt', 'Price', 'Pryor', 'Pugh', 'Quarles', 'Ramirez', 'Ramsey', 'Randall', 'Ray', 'Redmond', 'Reed', 'Reese',
  'Reid', 'Reynolds', 'Rhodes', 'Rice', 'Richards', 'Richardson', 'Riley', 'Rivers', 'Roberts', 'Robinson', 'Rogers', 'Rollins',
  'Ross', 'Rowe', 'Russell', 'Salazar', 'Sampson', 'Sanders', 'Scott', 'Sharpe', 'Shaw', 'Shelton', 'Shields', 'Short',
  'Simmons', 'Simpson', 'Sims', 'Singleton', 'Slater', 'Sloan', 'Smith', 'Snead', 'Sparks', 'Spencer', 'Stanley', 'Stark',
  'Steele', 'Stephens', 'Stokes', 'Stone', 'Strong', 'Sutton', 'Swain', 'Tago', 'Talley', 'Tate', 'Taufa', 'Taylor', 'Teague',
  'Terrell', 'Thomas', 'Thompson', 'Tillman', 'Tolbert', 'Townsend', 'Truitt', 'Tucker', 'Tuipulotu', 'Tupou', 'Turner',
  'Underwood', 'Upshaw', 'Vaki', 'Vaughn', 'Wade', 'Walker', 'Wallace', 'Walls', 'Walton', 'Ward', 'Warren', 'Washington',
  'Waters', 'Watkins', 'Watson', 'Weaver', 'Webb', 'Wells', 'West', 'Wheeler', 'Whitaker', 'White', 'Whitfield', 'Wiggins',
  'Wilder', 'Wilkins', 'Williams', 'Willis', 'Wilson', 'Winfield', 'Witherspoon', 'Womack', 'Woods', 'Worthy', 'Wright', 'Yates',
  'Young', 'Zeigler'];
/* A few go by Jr., II or III, as a real class does. */
const SUFFIX = [['Jr.', 0.05], ['II', 0.02], ['III', 0.01]];
/* The most times a first name or surname comes up in the class. */
const NAME_USES = 2;

/* -------------------------------------------------------------- schools -- */

/* Real schools in four tiers, by how often they send players to the NFL.
   A tier-one school's number is how much more often than the others it
   comes up. None is a school one of the pictures came from. */
const ELITE = { 'Ohio State': 3.2, Georgia: 3.1, Alabama: 3, 'Notre Dame': 2.5, Miami: 2.4, Florida: 2.3, Texas: 2.3, LSU: 2.2,
  Michigan: 2.2, Oregon: 2, 'Penn State': 1.8, Clemson: 1.6, USC: 1.6, Tennessee: 1.5, 'Florida State': 1.4, 'Texas A&M': 1.4,
  Oklahoma: 1.3, 'Ole Miss': 1.3, Auburn: 1.2 };
const POWER = ['Washington', 'Iowa', 'Wisconsin', 'Utah', 'Missouri', 'Kentucky', 'South Carolina', 'Arkansas', 'Mississippi State',
  'Louisville', 'NC State', 'North Carolina', 'Virginia Tech', 'Arizona State', 'Arizona', 'Colorado', 'Kansas State',
  'Oklahoma State', 'TCU', 'Baylor', 'Texas Tech', 'BYU', 'UCLA', 'Nebraska', 'Minnesota', 'Illinois', 'Michigan State',
  'Pittsburgh', 'Duke', 'SMU', 'Cincinnati', 'Iowa State', 'Maryland', 'Rutgers', 'Purdue', 'Indiana', 'Vanderbilt', 'Syracuse',
  'Boston College', 'Georgia Tech', 'Wake Forest', 'Virginia', 'Kansas', 'West Virginia', 'UCF', 'Houston', 'California',
  'Stanford', 'Northwestern'];
const SMALL = ['Boise State', 'Tulane', 'Memphis', 'Toledo', 'App State', 'James Madison', 'UNLV', 'Liberty', 'Army', 'Navy',
  'Fresno State', 'San Diego State', 'Western Kentucky', 'Coastal Carolina', 'South Alabama', 'Louisiana', 'Marshall', 'UTSA',
  'North Texas', 'Ohio', 'Miami (OH)', 'Northern Illinois', 'Air Force', 'Colorado State', 'Utah State', 'Wyoming',
  'Georgia Southern', 'Troy', 'Old Dominion', 'Buffalo', 'Western Michigan', 'Central Michigan', 'Texas State', 'Arkansas State',
  'Jacksonville State', 'Sam Houston', 'Hawaii', 'Rice', 'East Carolina', 'South Florida', 'Florida Atlantic', 'Temple',
  'North Dakota State', 'South Dakota State', 'Montana', 'Montana State', 'Sacramento State', 'Idaho', 'Villanova',
  'Incarnate Word', 'Southern Illinois', 'Northern Iowa', 'Youngstown State', 'Furman', 'Mercer', 'Chattanooga', 'UC Davis',
  'Jackson State', 'Florida A&M', 'Tennessee State', 'Abilene Christian', 'Lehigh', 'Princeton', 'Harvard', 'Richmond',
  'William & Mary', 'North Carolina A&T', 'South Carolina State', 'Holy Cross', 'Tarleton State', 'Austin Peay', 'Southern'];
const D2 = ['Ferris State', 'Grand Valley State', 'Pittsburg State', 'Harding', 'Valdosta State', 'Colorado Mines', 'Kutztown',
  'Slippery Rock', 'Lenoir-Rhyne', 'Ouachita Baptist', 'Central Missouri', 'Minnesota State', 'Bemidji State',
  'Northwest Missouri State', 'Delta State', 'Shepherd', 'Angelo State', 'Texas A&M-Kingsville', 'Central Washington',
  'Davenport', 'Hillsdale', 'Indiana (PA)'];
/* Each tier's share of a stretch of the class: [last pick, elite, power,
   small, Division II]. */
const TIERS = [[32, 0.9, 0.1, 0, 0], [64, 0.75, 0.25, 0, 0], [100, 0.6, 0.35, 0.05, 0], [160, 0.45, 0.4, 0.15, 0],
  [224, 0.3, 0.35, 0.25, 0.1], [320, 0.15, 0.3, 0.35, 0.2]];
/* The most players one school sends. */
const SCHOOL_MOST = 14;

/* ------------------------------------------------------------ positions -- */

/* An NFL build at each position: height, weight, and the lightest and
   heaviest a prospect there is listed at. */
const BUILD = {
  QB: [75, 218, 205, 240], RB: [70, 210, 195, 230], WR: [73, 195, 178, 222], TE: [77, 248, 238, 265], OT: [78, 312, 300, 335],
  IOL: [76, 310, 298, 335], EDGE: [76, 255, 242, 275], DI: [75, 302, 285, 335], LB: [73, 232, 222, 248], CB: [72, 190, 180, 202],
  S: [72, 203, 192, 218], K: [72, 195, 180, 220]
};

/* The positions the player in a picture could play, by his build. */
function fitsAs(photo) {
  const w = photo.weight;
  const h = photo.height;
  switch (photo.roster) {
    case 'QB': return ['QB'];
    case 'RB': return ['RB'];
    case 'FB': return w <= 235 ? ['RB'] : ['TE'];
    case 'WR': return w > 200 || h >= 75 ? ['WR'] : ['WR', 'CB'];
    case 'TE': return w >= 225 ? ['TE'] : ['WR', 'TE'];
    case 'OT': return ['OT'];
    case 'G': case 'C': return ['IOL'];
    case 'OL': return h >= 77 ? ['OT'] : ['IOL'];
    case 'DE': case 'DL': case 'DT':
      if (w >= 280) { return ['DI']; }
      if (w >= 265) { return ['EDGE', 'DI']; }
      if (w >= 235) { return ['EDGE']; }
      return ['LB', 'EDGE'];
    case 'LB': return w >= 235 ? ['LB', 'EDGE'] : (w < 210 ? ['LB', 'S'] : ['LB']);
    case 'CB': return ['CB'];
    case 'DB': return w >= 200 ? ['S', 'CB'] : ['CB', 'S'];
    case 'S': return ['S'];
    case 'PK': return ['K'];
    default: return [];
  }
}

/* -------------------------------------------------------------- skills -- */

/* What each archetype leans on, as a lean on his position's skills (lib/
   skills.js archetypeOf names him from them). */
const LEANS = {
  QB: { 'Dual Threat': { mobility: 1.9 }, Gunslinger: { deep: 1.1, arm: 1.3, accuracy: -0.5, poise: -0.3, mobility: -0.2 },
    'Field General': { accuracy: 1.1, poise: 1.1, deep: -0.4, arm: -0.4, mobility: -0.2 }, 'Pocket Passer': { mobility: -0.9 } },
  RB: { 'Power Back': { power: 1.6 }, 'Elusive Back': { elusive: 1.6 }, 'Speed Back': { speed: 1.6 },
    'Receiving Back': { hands: 1.9 }, 'Zone Runner': { vision: 1.6 } },
  WR: { 'Deep Threat': { deep: 1.3, speed: 1.3, size: -0.4 }, 'Physical Receiver': { size: 1.7, speed: -0.6, yac: -0.3, deep: -0.3 },
    Playmaker: { yac: 1.6, route: -0.4, hands: -0.3, deep: -0.6 },
    'Route Technician': { route: 1.4, hands: 0.4, deep: -0.7, yac: -0.6 },
    'Possession Receiver': { hands: 1.6, route: 0.3, deep: -0.7, yac: -0.7, speed: -0.4 } },
  TE: { 'Blocking Tight End': { block: 1.6, route: -0.7, hands: -0.6 }, 'Vertical Threat': { deep: 1.4, speed: 1.4, block: -0.7 },
    'Complete Tight End': { block: 0.5, route: 0.5, hands: 0.5, deep: -0.4 },
    'Possession Tight End': { hands: 1.1, route: 0.9, block: -0.9, deep: -0.5, speed: -0.4 } },
  OT: { 'Pass Protector': { passBlock: 1 }, 'Road Grader': { runBlock: 1 } },
  IOL: { 'Pass Protector': { passBlock: 1 }, 'Road Grader': { runBlock: 1 } },
  EDGE: { 'Speed Rusher': { speed: 1.5, rush: 0.5, run: -0.4 }, 'Power Rusher': { rush: 1.2, speed: -0.9 },
    'Run Stopper': { run: 1.5, rush: -0.4 } },
  DI: { 'Interior Rusher': { rush: 1.1 }, 'Nose Tackle': { run: 1.1 }, 'Three-Down Lineman': {} },
  LB: { 'Coverage Linebacker': { cover: 1.3, run: -0.4 }, Blitzer: { blitz: 1.7, cover: -0.5 },
    'Run Stopper': { run: 1.3, cover: -0.5 } },
  CB: { 'Man Corner': { man: 1.1 }, 'Zone Corner': { zone: 1.1 }, 'Slot Corner': {} },
  S: { Centerfielder: { range: 1.3, box: -0.5 }, 'Box Safety': { box: 1.4, range: -0.5 }, 'Hybrid Safety': {} },
  K: { 'Big Leg': { power: 1.1 }, 'Accurate Kicker': { accuracy: 1.1 } }
};

/* How likely each archetype is for a player of this build. */
function archetypeOdds(pos, height, weight) {
  switch (pos) {
    case 'QB': return { 'Pocket Passer': 3, 'Field General': 2.5, Gunslinger: 2, 'Dual Threat': weight <= 215 ? 3.5 : 2 };
    case 'RB': return weight >= 218 ? { 'Power Back': 5, 'Zone Runner': 2, 'Elusive Back': 1, 'Speed Back': 0.5, 'Receiving Back': 1 } :
      weight <= 200 ? { 'Speed Back': 3, 'Elusive Back': 3, 'Receiving Back': 2.5, 'Zone Runner': 1, 'Power Back': 0.3 } :
      { 'Zone Runner': 2.5, 'Elusive Back': 2, 'Power Back': 2, 'Speed Back': 1.5, 'Receiving Back': 1.5 };
    case 'WR': return height >= 75 ? { 'Physical Receiver': 3.5, 'Deep Threat': 3, 'Possession Receiver': 1.5, 'Route Technician': 1 } :
      height <= 70 ? { Playmaker: 3.5, 'Route Technician': 2.5, 'Deep Threat': 2, 'Possession Receiver': 1 } :
      { 'Route Technician': 2.5, 'Deep Threat': 2.5, Playmaker: 2, 'Possession Receiver': 2, 'Physical Receiver': 1 };
    case 'TE': return weight >= 252 ? { 'Blocking Tight End': 3, 'Complete Tight End': 2.5, 'Possession Tight End': 1 } :
      { 'Vertical Threat': 3, 'Possession Tight End': 2.5, 'Complete Tight End': 1.5, 'Blocking Tight End': 0.7 };
    case 'OT': return { 'Pass Protector': 3, 'Road Grader': 2 };
    case 'IOL': return { 'Road Grader': 3, 'Pass Protector': 2 };
    case 'EDGE': return weight >= 265 ? { 'Power Rusher': 3, 'Run Stopper': 2.5, 'Speed Rusher': 1 } :
      weight <= 250 ? { 'Speed Rusher': 4, 'Power Rusher': 1, 'Run Stopper': 0.7 } :
      { 'Speed Rusher': 2.5, 'Power Rusher': 2.5, 'Run Stopper': 1.5 };
    case 'DI': return weight >= 315 ? { 'Nose Tackle': 4, 'Three-Down Lineman': 2, 'Interior Rusher': 1 } :
      weight <= 295 ? { 'Interior Rusher': 4, 'Three-Down Lineman': 2, 'Nose Tackle': 0.5 } :
      { 'Three-Down Lineman': 3, 'Interior Rusher': 2, 'Nose Tackle': 2 };
    case 'LB': return weight <= 228 ? { 'Coverage Linebacker': 3.5, Blitzer: 2, 'Run Stopper': 1 } :
      { 'Run Stopper': 3, Blitzer: 2.5, 'Coverage Linebacker': 1.5 };
    case 'CB': return { 'Man Corner': 3, 'Zone Corner': 3, 'Slot Corner': height <= 70 ? 3 : 1.5 };
    case 'S': return weight >= 208 ? { 'Box Safety': 3.5, 'Hybrid Safety': 2, Centerfielder: 1 } :
      { Centerfielder: 3, 'Hybrid Safety': 2.5, 'Box Safety': 1 };
    case 'K': return { 'Big Leg': 1, 'Accurate Kicker': 1 };
    default: return {};
  }
}

/* The forty-yard dash each position runs on average (lib/draft.js FORTY):
   a prospect's forty is his lean on the skill that is speed, a tenth of a
   second for every 1.25 of it. */
const FORTY = { QB: 4.8, RB: 4.52, WR: 4.48, TE: 4.7, OT: 5.2, IOL: 5.25, EDGE: 4.7, DI: 4.95, LB: 4.65, CB: 4.45, S: 4.52 };
const SPEED_SKILL = { QB: 'mobility', RB: 'speed', WR: 'speed', TE: 'speed', EDGE: 'speed', LB: 'speed', CB: 'speed', S: 'speed' };

function round(x, places) { const f = Math.pow(10, places); return Math.round(x * f) / f; }

/* His lean on each skill: the archetype's, with a little of his own. The
   speed skill is read back off his forty, so the two always agree. */
function styleFor(pos, archetype, rng) {
  const lean = LEANS[pos][archetype] || {};
  const style = {};
  Object.keys(SKILLS[pos]).forEach((k) => { style[k] = round(rng.gauss() * 0.45 + (lean[k] || 0), 2); });
  let forty = null;
  const speedKey = SPEED_SKILL[pos];
  if (speedKey) {
    forty = round(FORTY[pos] - Math.max(-2.5, Math.min(2.5, style[speedKey])) * 0.08, 2);
    style[speedKey] = round((FORTY[pos] - forty) / 0.08, 3);
  } else if (FORTY[pos]) {
    forty = round(FORTY[pos] + rng.gauss() * 0.08, 2);
  }
  return { style, forty };
}

/* ---------------------------------------------------- earlier pictures -- */

/* Every ESPN id the site already shows a picture for: the other draft
   classes, the kickoff league, the college rosters and season files, and
   every NFL player nflverse knows. (Not this class as last built, so a
   rebuild deals the same pictures.) */
function onTheSite(all, nflPlayers) {
  const ids = new Set();
  Object.keys(all.classes).filter((y) => Number(y) !== YEAR).forEach((y) => {
    all.classes[y].forEach((pr) => { if (pr.espn) { ids.add(String(pr.espn)); } });
  });
  const files = [];
  const add = (dir, test) => {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) { return; }
    fs.readdirSync(full).filter((n) => test.test(n)).forEach((n) => files.push(path.join(full, n)));
  };
  add('nfl-sim/data', /^(?!prospects\.json$).*\.json$/);
  add('data', /\.(js|json)$/);
  add('stats', /\.js$/);
  files.forEach((file) => {
    const text = fs.readFileSync(file, 'utf8');
    const re = /"?espn"?\s*:\s*"?(\d{4,9})/g;
    let m;
    while ((m = re.exec(text))) { ids.add(m[1]); }
  });
  nflPlayers.forEach((p) => { if (p.espn_id) { ids.add(String(p.espn_id)); } });
  return ids;
}

function photos(skip) {
  const out = [];
  SOURCES.photos.groups.forEach((g) => g.players.forEach((line) => {
    const [espn, roster, height, weight] = line.split('|');
    if (!skip.has(espn)) { out.push({ espn, roster, height: Number(height) || null, weight: Number(weight) || null, from: g.school }); }
  }));
  return out.sort((a, b) => hash('photo:' + YEAR + ':' + a.espn) - hash('photo:' + YEAR + ':' + b.espn));
}

/* ---------------------------------------------------------------- deal -- */

function shuffled(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* Names: no full name anyone has had, and no first name or surname more
   than NAME_USES times (a second time only now and then). */
function namer(taken) {
  const rng = seeded('names:' + YEAR);
  const uses = {};
  const odds = (again) => (x) => ((uses[x] || 0) >= NAME_USES ? 0 : (uses[x] ? again : 1));
  return function () {
    for (let tries = 0; tries < 500; tries += 1) {
      const first = rng.pick(FIRST, odds(0.2));
      const last = rng.pick(LAST, odds(0.05));
      const full = first + ' ' + last;
      if (taken.has(c27.norm(full))) { continue; }
      taken.add(c27.norm(full));
      uses[first] = (uses[first] || 0) + 1;
      uses[last] = (uses[last] || 0) + 1;
      let r = rng();
      const suffix = SUFFIX.find(([, p]) => (r -= p) < 0);
      return suffix ? full + ' ' + suffix[0] : full;
    }
    throw new Error('Ran out of names');
  };
}

/* Schools: the tier by where he is picked, then a school in it. A
   tier-one school is the one furthest short of its share, give or take a
   little, so the best programs send the most, none past SCHOOL_MOST; the
   other tiers are a draw. */
function schooler() {
  const rng = seeded('schools:' + YEAR);
  const count = {};
  const tiers = [Object.keys(ELITE), POWER, SMALL, D2];
  return function (n) {
    const row = TIERS.find((t) => n <= t[0]);
    const tier = rng.pick([0, 1, 2, 3], (i) => row[i + 1]);
    let school = null;
    if (tier === 0) {
      let best = Infinity;
      tiers[0].forEach((s) => {
        if ((count[s] || 0) >= SCHOOL_MOST) { return; }
        const short = ((count[s] || 0) + 0.3 + rng() * 1.2) / ELITE[s];
        if (short < best) { best = short; school = s; }
      });
    } else {
      school = rng.pick(tiers[tier], (s) => ((count[s] || 0) >= SCHOOL_MOST ? 0 : 1));
    }
    count[school] = (count[school] || 0) + 1;
    return school;
  };
}

/* ------------------------------------------------------------- the class -- */

function main() {
  const { preview } = require('../lib/draft');
  download('players.csv');
  const all = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  delete all.classes[YEAR];
  const nflPlayers = read('players.csv');

  /* Nobody's name: every college player of 2021-2026, every NFL player,
     every earlier prospect and everyone in the kickoff league. */
  const taken = new Set();
  [2021, 2022, 2023, 2024, 2025, 2026].forEach((y) => {
    download('cfb_rosters_' + y + '.csv');
    read('cfb_rosters_' + y + '.csv').forEach((r) => taken.add(c27.norm(r.first_name + ' ' + r.last_name)));
  });
  nflPlayers.forEach((p) => {
    taken.add(c27.norm(p.display_name));
    if (p.first_name && p.last_name) { taken.add(c27.norm(p.first_name + ' ' + p.last_name)); }
  });
  Object.keys(all.classes).forEach((y) => all.classes[y].forEach((pr) => taken.add(c27.norm(pr.name))));
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'league-2023.json'), 'utf8')).players
    .forEach((p) => taken.add(c27.norm(p.name)));

  const pool = photos(onTheSite(all, nflPlayers));
  const name = namer(taken);
  const school = schooler();
  const rng = seeded('made-up:' + YEAR);

  /* The class, pick by pick. Next is the position furthest short of its
     share (the premium ones sooner in the first round) that a picture is
     left for. */
  const total = Object.keys(MIX).reduce((a, k) => a + MIX[k], 0);
  const counts = {};
  const out = [];
  const missed = [];
  while (out.length < SIZE) {
    const n = out.length + 1;
    let pos = null;
    let best = Infinity;
    Object.keys(MIX).forEach((p) => {
      if (p === 'K' && n < KICKERS_FROM) { return; }
      const lean = n <= 32 ? FIRST_ROUND[p] : 1;
      if (!lean || !pool.some((ph) => fitsAs(ph).indexOf(p) !== -1)) { return; }
      const share = ((counts[p] || 0) + 1) / (MIX[p] / total * lean);
      if (share < best) { best = share; pos = p; }
    });
    if (!pos) { break; }
    /* The top two rounds get the pictures nearest an NFL build for the
       position, of the next few that fit. */
    const [height, weight, light, heavy] = BUILD[pos];
    const fits = pool.map((ph, i) => i).filter((i) => fitsAs(pool[i]).indexOf(pos) !== -1).slice(0, n <= TOP_BUILD ? 10 : 1);
    const off = (ph) => Math.abs((ph.height || height) - height) + Math.abs((ph.weight || weight) - weight) / 8;
    const at = fits.reduce((a, b) => (off(pool[b]) < off(pool[a]) ? b : a));
    const photo = pool.splice(at, 1)[0];
    const tall = photo.height ? Math.max(height - 4, Math.min(height + 4, photo.height)) : height + rng.int(-1, 1);
    const listed = Math.min(heavy, Math.max(light, (photo.weight || weight) + rng.int(0, 8)));
    const age = rng.pick([21, 22, 23], (a) => ({ 21: 3, 22: 4.5, 23: 2.5 }[a]));
    const born = (YEAR - age) + '-' + String(rng.int(1, 8)).padStart(2, '0') + '-' + String(rng.int(1, 28)).padStart(2, '0');
    const pr = {
      id: 'made:' + YEAR + ':' + photo.espn,
      name: name(),
      pos,
      college: c27.shown(school(n)),
      espn: photo.espn,
      collegePhoto: true,
      madeUp: true,
      born,
      age,
      height: tall,
      weight: listed,
      forty: null,
      grade: n,
      realPeak: null
    };
    /* His archetype, and the skills that make him one: drawn again until
       lib/skills.js names him the same. */
    const want = rng.pick(Object.keys(archetypeOdds(pos, tall, listed)), (a) => archetypeOdds(pos, tall, listed)[a]);
    for (let tries = 0; tries < 40; tries += 1) {
      const { style, forty } = styleFor(pos, want, rng);
      pr.style = style;
      pr.forty = forty;
      if (preview(pr, YEAR, LIFT).archetype === want) { break; }
      if (tries === 39) { missed.push(pr.name + ' (' + want + ')'); }
    }
    out.push(pr);
    counts[pos] = (counts[pos] || 0) + 1;
  }

  all.classes[YEAR] = out;
  all.lift = Object.assign({}, all.lift, { [YEAR]: LIFT });
  fs.writeFileSync(DATA, rows(all, '') + '\n');
  const schools = {};
  out.forEach((pr) => { schools[pr.college] = (schools[pr.college] || 0) + 1; });
  process.stderr.write('Wrote nfl-sim/data/prospects.json: ' + out.length + ' made-up prospects in ' + YEAR + ', ' +
                       pool.length + ' pictures left over\n');
  process.stderr.write('By position: ' + Object.keys(counts).map((k) => k + ' ' + counts[k]).join(', ') + '\n');
  process.stderr.write('Schools (' + Object.keys(schools).length + '): ' + Object.keys(schools)
    .sort((a, b) => schools[b] - schools[a]).map((k) => k + ' ' + schools[k]).join(', ') + '\n');
  if (missed.length) { process.stderr.write('Archetype not reached: ' + missed.join(', ') + '\n'); }
}

if (require.main === module) { main(); }

module.exports = { fitsAs, archetypeOdds, LEANS };
