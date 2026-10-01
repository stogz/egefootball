/* ==========================================================================
   EGE Football — the rosters
   Written by tools/build-rosters.js from ESPN; run that again rather than
   editing this by hand (though a hand edit is fine until the next run).

   The skill players on each of the six's college teams, by season and by
   the team's key in EGE.teams: every quarterback, back, receiver and tight
   end, in the order they produced that season, with the season's line
   beside anybody who had one. The six are not listed -- they
   are put into their rooms by EGE.rosterFor in data/games.js.
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.rosters = EGE.rosters || {};

EGE.rosters[2020] = {
  alabama: {
    QB: [
      { name: 'Mac Jones', jersey: 10, height: 75, weight: 220, line: '311/402, 4500 YDS, 41 TD, 4 INT' },
      { name: 'Bryce Young', jersey: 9, height: 70, weight: 204, line: '13/22, 156 YDS, 1 TD' },
      { name: 'Taulia Tagovailoa', jersey: 3, height: 71, weight: 208 }
    ],
    RB: [
      { name: 'Najee Harris', jersey: 22, height: 73, weight: 232, line: '251 CAR, 1466 YDS, 26 TD' },
      { name: 'Brian Robinson Jr.', jersey: 4, height: 73, weight: 225, line: '91 CAR, 483 YDS, 6 TD' },
      { name: 'Jase McClellan', jersey: 2, height: 71, weight: 212, line: '23 CAR, 245 YDS, 2 TD' },
      { name: 'Trey Sanders', jersey: 2, height: 72, weight: 215, line: '30 CAR, 134 YDS' },
      { name: 'Roydell Williams', jersey: 5, height: 70, weight: 223, line: '19 CAR, 71 YDS, 1 TD' },
      { name: 'Jerome Ford', jersey: 24, height: 70, weight: 210 }
    ],
    WR: [
      { name: 'DeVonta Smith', jersey: 6, height: 72, weight: 170, line: '117 REC, 1856 YDS, 23 TD' },
      { name: 'John Metchie III', jersey: 8, height: 71, weight: 187, line: '55 REC, 916 YDS, 6 TD' },
      { name: 'Jaylen Waddle', jersey: 17, height: 70, weight: 185, line: '28 REC, 591 YDS, 4 TD' },
      { name: 'Slade Bolden', jersey: 18, height: 71, weight: 189, line: '24 REC, 270 YDS, 1 TD' },
      { name: 'Xavier Williams', jersey: 3, height: 72, weight: 180, line: '3 REC, 24 YDS' },
      { name: 'Javon Baker', jersey: 1, height: 73, weight: 202, line: '2 REC, 15 YDS' },
      { name: 'Tyrell Shavers', jersey: 14, height: 76, weight: 211 },
      { name: 'Thaiu Jones-Bell', jersey: 14, height: 72, weight: 198, line: '1 REC, -2 YDS' }
    ],
    TE: [
      { name: 'Jahleel Billingsley', jersey: 9, height: 76, weight: 219, line: '18 REC, 287 YDS, 3 TD' },
      { name: 'Miller Forristall', jersey: 87, height: 77, weight: 243, line: '23 REC, 253 YDS, 1 TD' },
      { name: 'Major Tennison', jersey: 88, height: 77, weight: 252, line: '1 REC, 4 YDS' },
      { name: 'Carl Tucker', jersey: 86, height: 74, weight: 250 },
      { name: 'Giles Amos', jersey: 85, height: 76, weight: 242 }
    ]
  },
  usc: {
    QB: [
      { name: 'Kedon Slovis', jersey: 10, height: 74, weight: 223, line: '177/264, 1921 YDS, 17 TD, 7 INT' },
      { name: 'Jack Sears', jersey: 16, height: 74, weight: 213 },
      { name: 'Matt Fink', jersey: 19, height: 75, weight: 210, line: '1/1, -5 YDS' }
    ],
    RB: [
      { name: 'Vavae Malepeai', jersey: 6, height: 72, weight: 220, line: '54 CAR, 238 YDS, 3 TD' },
      { name: 'Stephen Carr', jersey: 5, height: 73, weight: 215, line: '46 CAR, 176 YDS, 2 TD' },
      { name: 'Markese Stepp', jersey: 30, height: 73, weight: 225, line: '45 CAR, 165 YDS, 3 TD' },
      { name: 'Kenan Christon II', jersey: 8, height: 70, weight: 202, line: '10 CAR, 70 YDS' },
      { name: 'Quincy Jountti', jersey: 27, height: 71, weight: 210, line: '2 CAR, 4 YDS' }
    ],
    WR: [
      { name: 'Drake London', jersey: 15, height: 76, weight: 215, line: '33 REC, 502 YDS, 3 TD' },
      { name: 'Amon-Ra St. Brown', jersey: 8, height: 72, weight: 202, line: '41 REC, 478 YDS, 7 TD' },
      { name: 'Tyler Vaughns', jersey: 21, height: 74, weight: 184, line: '33 REC, 406 YDS, 3 TD' },
      { name: 'Bru McCoy', jersey: 5, height: 75, weight: 230, line: '21 REC, 236 YDS, 2 TD' },
      { name: 'Gary Bryant Jr.', jersey: 2, height: 71, weight: 191, line: '7 REC, 51 YDS' },
      { name: 'John Jackson', jersey: 14, height: 72, weight: 213, line: '1 REC, 23 YDS' },
      { name: 'Velus Jones Jr.', jersey: 1, height: 72, weight: 204 }
    ],
    TE: [
      { name: 'Erik Krommenhoek', jersey: 84, height: 77, weight: 245, line: '9 REC, 59 YDS, 2 TD' },
      { name: 'Jude Wolfe', jersey: 18, height: 78, weight: 247, line: '2 REC, 5 YDS' },
      { name: 'Josh Falo', jersey: 83, height: 78, weight: 255 }
    ]
  },
  northDakotaState: {
    QB: [
      { name: 'Trey Lance', jersey: 5, height: 76, weight: 226, line: '15/30, 149 YDS, 2 TD, 1 INT' },
      { name: 'Cam Miller', jersey: 7, height: 73, weight: 211 },
      { name: 'Quincy Patterson', jersey: 16, height: 75, weight: 235 },
      { name: 'Zeb Noland', jersey: 8, height: 74, weight: 232 }
    ],
    RB: [
      { name: 'Seth Wilson', jersey: null, height: 70, weight: 200, line: '7 CAR, 55 YDS' },
      { name: 'Kobe Johnson', jersey: 0, height: 69, weight: 190, line: '9 CAR, 31 YDS' },
      { name: 'Hunter Luepke', jersey: 44, height: 73, weight: 250, line: '2 CAR, 27 YDS, 1 TD' },
      { name: 'Adam Cofield', jersey: 7, height: 71, weight: 215, line: '8 CAR, 3 YDS' },
      { name: 'Dominic Gonnella', jersey: 34, height: 71, weight: 211 },
      { name: 'Hunter Brozio', jersey: 49, height: 73, weight: 233 },
      { name: 'Jalen Bussey', jersey: 21, height: 65, weight: 160 },
      { name: 'TK Marshall', jersey: 28, height: 72, weight: 208 }
    ],
    WR: [
      { name: 'Braylon Henderson', jersey: 1, height: 69, weight: 175, line: '3 REC, 36 YDS' },
      { name: 'Zach Mathis', jersey: 0, height: 79, weight: 203, line: '1 REC, 16 YDS' },
      { name: 'Christian Watson', jersey: 1, height: 76, weight: 215, line: '2 REC, 8 YDS' },
      { name: 'Cole Jacob', jersey: 89, height: 73, weight: 203 },
      { name: 'Jake Lippe', jersey: 19, height: 74, weight: 201 },
      { name: 'RaJa Nelson', jersey: 3, height: 69, weight: 196 }
    ],
    TE: [
      { name: 'Josh Babicz', jersey: 81, height: 78, weight: 255, line: '3 REC, 35 YDS, 1 TD' },
      { name: 'Noah Gindorff', jersey: null, height: 78, weight: 268, line: '1 REC, 11 YDS' }
    ]
  },
  illinois: {
    QB: [
      { name: 'Brandon Peters', jersey: 18, height: 76, weight: 228, line: '39/80, 429 YDS, 3 TD' },
      { name: 'Matt Robinson', jersey: 6, height: 73, weight: 185, line: '3/4, 22 YDS' }
    ],
    RB: [
      { name: 'Chase Brown', jersey: 2, height: 70, weight: 210, line: '104 CAR, 540 YDS, 3 TD' },
      { name: 'Mike Epstein', jersey: 26, height: 72, weight: 205, line: '69 CAR, 367 YDS, 4 TD' },
      { name: 'Conner Lillig', jersey: 23, height: 70, weight: 190, line: '3 CAR, 14 YDS' },
      { name: 'Reggie Love III', jersey: 23, height: 71, weight: 215, line: '10 CAR, 12 YDS' },
      { name: 'Kyron Cumby', jersey: 24, height: 68, weight: 180, line: '2 CAR, 11 YDS' },
      { name: 'Nick Fedanzo', jersey: 24, height: 72, weight: 220, line: '1 CAR, 2 YDS' },
      { name: 'Jakari Norwood', jersey: 29, height: 70, weight: 195, line: '2 CAR, 1 YDS' }
    ],
    WR: [
      { name: 'Josh Imatorbhebhe', jersey: 9, height: 74, weight: 220, line: '22 REC, 297 YDS, 3 TD' },
      { name: 'Brian Hightower', jersey: 7, height: 75, weight: 215, line: '11 REC, 209 YDS, 3 TD' },
      { name: 'Casey Washington', jersey: 14, height: 72, weight: 200, line: '10 REC, 106 YDS' },
      { name: 'Donny Navarro III', jersey: 80, height: 71, weight: 185, line: '8 REC, 88 YDS' },
      { name: 'Dalevon Campbell', jersey: 15, height: 76, weight: 220, line: '3 REC, 48 YDS' },
      { name: 'Carlos Sandy', jersey: 11, height: 69, weight: 185, line: '1 REC, 29 YDS, 1 TD' },
      { name: 'Deuce Spann', jersey: 22, height: 76, weight: 210 },
      { name: 'James Frenchie Jr.', jersey: 13, height: 70, weight: 175 },
      { name: 'Khmari Thompson', jersey: 8, height: 73, weight: 207 },
      { name: 'Ty Lindenman', jersey: 15, height: 66, weight: 165 }
    ],
    TE: [
      { name: 'Daniel Barker', jersey: 9, height: 76, weight: 250, line: '19 REC, 268 YDS, 2 TD' },
      { name: 'Daniel Imatorbhebhe', jersey: 0, height: 76, weight: 240, line: '3 REC, 54 YDS, 1 TD' },
      { name: 'Luke Ford', jersey: 82, height: 78, weight: 265, line: '2 REC, 15 YDS' },
      { name: 'Griffin Moore', jersey: 13, height: 76, weight: 250 },
      { name: 'Michael Marchese', jersey: 42, height: 76, weight: 235 },
      { name: 'Tip Reiman', jersey: 89, height: 77, weight: 271 }
    ]
  },
  ohioState: {
    QB: [
      { name: 'Justin Fields', jersey: 1, height: 75, weight: 227, line: '158/225, 2100 YDS, 22 TD, 6 INT' },
      { name: 'C.J. Stroud', jersey: 7, height: 75, weight: 218 },
      { name: 'Gunnar Hoak', jersey: 12, height: 76, weight: 215 },
      { name: 'Jack Miller III', jersey: 10, height: 75, weight: 210 }
    ],
    RB: [
      { name: 'Trey Sermon', jersey: 8, height: 72, weight: 215, line: '116 CAR, 870 YDS, 4 TD' },
      { name: 'Master Teague', jersey: 33, height: 71, weight: 220, line: '104 CAR, 514 YDS, 8 TD' },
      { name: 'Miyan Williams', jersey: 3, height: 69, weight: 226, line: '10 CAR, 64 YDS' },
      { name: 'Marcus Crowley', jersey: 24, height: 73, weight: 213, line: '6 CAR, 14 YDS' }
    ],
    WR: [
      { name: 'Chris Olave', jersey: 2, height: 72, weight: 187, line: '50 REC, 729 YDS, 7 TD' },
      { name: 'Garrett Wilson', jersey: 5, height: 72, weight: 183, line: '43 REC, 723 YDS, 6 TD' },
      { name: 'Jameson Williams', jersey: 1, height: 73, weight: 184, line: '9 REC, 154 YDS, 2 TD' },
      { name: 'Julian Fleming', jersey: 3, height: 74, weight: 206, line: '7 REC, 74 YDS' },
      { name: 'Jaxon Smith-Njigba', jersey: 11, height: 72, weight: 197, line: '10 REC, 49 YDS, 1 TD' },
      { name: 'Chris Booker', jersey: 86, height: 75, weight: 192 },
      { name: 'Jaelen Gill', jersey: 5, height: 72, weight: 185 },
      { name: 'Jaylen Harris', jersey: 15, height: 77, weight: 215 },
      { name: 'Kamryn Babb', jersey: 0, height: 72, weight: 210 },
      { name: 'Xavier Johnson', jersey: 0, height: 73, weight: 210 }
    ],
    TE: [
      { name: 'Jeremy Ruckert', jersey: 88, height: 77, weight: 250, line: '13 REC, 151 YDS, 5 TD' },
      { name: 'Luke Farrell', jersey: 89, height: 77, weight: 250, line: '5 REC, 37 YDS, 1 TD' },
      { name: 'Jake Hausmann', jersey: 81, height: 76, weight: 245, line: '1 REC, 13 YDS' },
      { name: 'Cade Stover', jersey: 8, height: 76, weight: 251 }
    ]
  }
};

EGE.rosters[2021] = {
  alabama: {
    QB: [
      { name: 'Bryce Young', jersey: 9, height: 70, weight: 204, line: '314/462, 4322 YDS, 43 TD, 4 INT' },
      { name: 'Paul Tyson', jersey: 15, height: 76, weight: 215, line: '10/16, 150 YDS' },
      { name: 'Jalen Milroe', jersey: 4, height: 74, weight: 216, line: '3/7, 41 YDS, 1 TD' },
      { name: 'Braxton Barker', jersey: 7, height: 73, weight: 202, line: '1/1, 10 YDS' }
    ],
    RB: [
      { name: 'Brian Robinson Jr.', jersey: 4, height: 73, weight: 225, line: '223 CAR, 1071 YDS, 14 TD' },
      { name: 'Roydell Williams', jersey: 5, height: 70, weight: 223, line: '48 CAR, 284 YDS, 1 TD' },
      { name: 'Trey Sanders', jersey: 2, height: 72, weight: 215, line: '56 CAR, 242 YDS, 2 TD' },
      { name: 'Jase McClellan', jersey: 2, height: 71, weight: 212, line: '40 CAR, 191 YDS, 1 TD' },
      { name: 'AJ Gates Jr.', jersey: 23, height: 67, weight: 162 },
      { name: 'Keilan Robinson', jersey: 7, height: 68, weight: 191 }
    ],
    WR: [
      { name: 'Jameson Williams', jersey: 1, height: 73, weight: 184, line: '68 REC, 1445 YDS, 15 TD' },
      { name: 'John Metchie III', jersey: 8, height: 71, weight: 187, line: '96 REC, 1142 YDS, 8 TD' },
      { name: 'Slade Bolden', jersey: 18, height: 71, weight: 189, line: '32 REC, 333 YDS, 2 TD' },
      { name: 'Traeshon Holden', jersey: 1, height: 74, weight: 208, line: '15 REC, 211 YDS, 1 TD' },
      { name: 'JoJo Earle', jersey: 11, height: 70, weight: 185, line: '12 REC, 148 YDS' },
      { name: 'Javon Baker', jersey: 1, height: 73, weight: 202, line: '7 REC, 101 YDS, 1 TD' },
      { name: 'Ja\'Corey Brooks', jersey: 1, height: 75, weight: 195, line: '5 REC, 79 YDS, 1 TD' },
      { name: 'Agiye Hall', jersey: null, height: 75, weight: 194, line: '2 REC, 20 YDS' },
      { name: 'Thaiu Jones-Bell', jersey: 14, height: 72, weight: 198, line: '2 REC, 16 YDS' },
      { name: 'Christian Leary', jersey: 1, height: 70, weight: 180, line: '2 REC, 4 YDS, 1 TD' },
      { name: 'Jacoby Boykins', jersey: 84, height: 73, weight: 195 },
      { name: 'Joshua Lanier', jersey: 1, height: 73, weight: 170 }
    ],
    TE: [
      { name: 'Cameron Latu', jersey: 81, height: 77, weight: 244, line: '20 REC, 299 YDS, 6 TD' },
      { name: 'Jahleel Billingsley', jersey: 9, height: 76, weight: 219, line: '16 REC, 244 YDS, 3 TD' },
      { name: 'Robbie Ouzts', jersey: 45, height: 75, weight: 274, line: '1 REC, 8 YDS' }
    ]
  },
  usc: {
    QB: [
      { name: 'Kedon Slovis', jersey: 10, height: 74, weight: 223, line: '193/297, 2153 YDS, 11 TD, 8 INT' },
      { name: 'Jaxson Dart', jersey: 2, height: 74, weight: 223, line: '117/189, 1353 YDS, 9 TD, 5 INT' },
      { name: 'Miller Moss', jersey: 7, height: 73, weight: 211, line: '8/13, 74 YDS, 1 TD' },
      { name: 'Caleb Williams', jersey: 13, height: 73, weight: 226 }
    ],
    RB: [
      { name: 'Keaontay Ingram', jersey: 28, height: 72, weight: 220, line: '156 CAR, 911 YDS, 5 TD' },
      { name: 'Vavae Malepeai', jersey: 6, height: 72, weight: 220, line: '114 CAR, 502 YDS, 6 TD' },
      { name: 'Darwin Barlow', jersey: 24, height: 72, weight: 220, line: '62 CAR, 289 YDS, 2 TD' },
      { name: 'Brandon Campbell', jersey: 23, height: 70, weight: 210, line: '12 CAR, 53 YDS' },
      { name: 'Kenan Christon II', jersey: 8, height: 70, weight: 202 },
      { name: 'Markese Stepp', jersey: 30, height: 73, weight: 225 },
      { name: 'Quincy Jountti', jersey: 27, height: 71, weight: 210 },
      { name: 'Stephen Carr', jersey: 5, height: 73, weight: 215 }
    ],
    WR: [
      { name: 'Drake London', jersey: 15, height: 76, weight: 215, line: '88 REC, 1084 YDS, 7 TD' },
      { name: 'Tahj Washington', jersey: 16, height: 70, weight: 174, line: '54 REC, 602 YDS, 1 TD' },
      { name: 'Gary Bryant Jr.', jersey: 2, height: 71, weight: 191, line: '44 REC, 579 YDS, 7 TD' },
      { name: 'Kyle Ford', jersey: 81, height: 73, weight: 225, line: '19 REC, 252 YDS, 2 TD' },
      { name: 'Michael Jackson III', jersey: 2, height: 72, weight: 205, line: '12 REC, 116 YDS' },
      { name: 'Joseph Manjack IV', jersey: 14, height: 75, weight: 210, line: '7 REC, 67 YDS' },
      { name: 'K.D. Nixon', jersey: 21, height: 68, weight: 190, line: '3 REC, 35 YDS, 1 TD' },
      { name: 'John Jackson', jersey: 14, height: 72, weight: 213, line: '3 REC, 16 YDS' },
      { name: 'Kyron Hudson', jersey: 11, height: 73, weight: 212, line: '2 REC, 4 YDS' },
      { name: 'Jordan Addison', jersey: 3, height: 71, weight: 179 }
    ],
    TE: [
      { name: 'Malcolm Epps', jersey: 7, height: 78, weight: 255, line: '10 REC, 173 YDS, 1 TD' },
      { name: 'Erik Krommenhoek', jersey: 84, height: 77, weight: 245, line: '15 REC, 137 YDS, 1 TD' },
      { name: 'Michael Trigg', jersey: 1, height: 76, weight: 240, line: '7 REC, 109 YDS, 1 TD' },
      { name: 'Lake McRee', jersey: 87, height: 76, weight: 243, line: '7 REC, 91 YDS' },
      { name: 'Jude Wolfe', jersey: 18, height: 78, weight: 247, line: '8 REC, 56 YDS' },
      { name: 'Grant Jones', jersey: 46, height: 74, weight: 220 }
    ]
  },
  northDakotaState: {
    QB: [
      { name: 'Cam Miller', jersey: 7, height: 73, weight: 211, line: '84/119, 1153 YDS, 11 TD, 3 INT' },
      { name: 'Quincy Patterson', jersey: 16, height: 75, weight: 235, line: '55/101, 813 YDS, 6 TD, 4 INT' },
      { name: 'Cole Payton', jersey: 9, height: 74, weight: 232, line: '1/3, 6 YDS' },
      { name: 'Zeb Noland', jersey: 8, height: 74, weight: 232 }
    ],
    RB: [
      { name: 'TaMerik Williams', jersey: 22, height: 72, weight: 227, line: '107 CAR, 699 YDS, 12 TD' },
      { name: 'Kobe Johnson', jersey: 0, height: 69, weight: 190, line: '97 CAR, 557 YDS, 2 TD' },
      { name: 'Dominic Gonnella', jersey: 34, height: 71, weight: 211, line: '64 CAR, 377 YDS, 2 TD' },
      { name: 'Jalen Bussey', jersey: 21, height: 65, weight: 160, line: '47 CAR, 356 YDS, 4 TD' },
      { name: 'Hunter Luepke', jersey: 44, height: 73, weight: 250, line: '54 CAR, 351 YDS, 5 TD' },
      { name: 'TK Marshall', jersey: 28, height: 72, weight: 208, line: '22 CAR, 236 YDS, 1 TD' },
      { name: 'Nathan Goldade', jersey: 26, height: 71, weight: 193, line: '3 CAR, 16 YDS' },
      { name: 'Mitchell Kartes', jersey: 8, height: 72, weight: 202, line: '3 CAR, 8 YDS' },
      { name: 'Adam Cofield', jersey: 7, height: 71, weight: 215 },
      { name: 'Logan Hofstedt', jersey: 33, height: 73, weight: 238 }
    ],
    WR: [
      { name: 'Christian Watson', jersey: 1, height: 76, weight: 215, line: '39 REC, 739 YDS, 7 TD' },
      { name: 'Phoenix Sproles', jersey: 0, height: 71, weight: 194, line: '18 REC, 265 YDS, 2 TD' },
      { name: 'Braylon Henderson', jersey: 1, height: 69, weight: 175, line: '14 REC, 130 YDS' },
      { name: 'Zach Mathis', jersey: 0, height: 79, weight: 203, line: '8 REC, 112 YDS' },
      { name: 'RaJa Nelson', jersey: 3, height: 69, weight: 196, line: '11 REC, 91 YDS, 1 TD' },
      { name: 'Jake Lippe', jersey: 19, height: 74, weight: 201, line: '1 REC, 8 YDS' },
      { name: 'DJ Hart', jersey: 9, height: 71, weight: 191, line: '1 REC, 4 YDS' },
      { name: 'Giancarlo Volpentesta', jersey: 83, height: 72, weight: 214, line: '1 REC, 4 YDS' },
      { name: 'Tyler Terhark', jersey: 6, height: 74, weight: 209 }
    ],
    TE: [
      { name: 'Josh Babicz', jersey: 81, height: 78, weight: 255, line: '9 REC, 196 YDS, 3 TD' },
      { name: 'Noah Gindorff', jersey: null, height: 78, weight: 268, line: '17 REC, 193 YDS, 2 TD' },
      { name: 'Joe Stoffel', jersey: 82, height: 76, weight: 245, line: '1 REC, 8 YDS' }
    ]
  },
  illinois: {
    QB: [
      { name: 'Brandon Peters', jersey: 18, height: 76, weight: 228, line: '91/169, 1170 YDS, 7 TD, 4 INT' },
      { name: 'Artur Sitkowski', jersey: 9, height: 77, weight: 225, line: '74/148, 704 YDS, 6 TD, 2 INT' }
    ],
    RB: [
      { name: 'Chase Brown', jersey: 2, height: 70, weight: 210, line: '170 CAR, 1005 YDS, 5 TD' },
      { name: 'Josh McCray', jersey: 2, height: 73, weight: 235, line: '112 CAR, 549 YDS, 2 TD' },
      { name: 'Reggie Love III', jersey: 23, height: 71, weight: 215, line: '44 CAR, 158 YDS' },
      { name: 'Jakari Norwood', jersey: 29, height: 70, weight: 195, line: '27 CAR, 120 YDS' },
      { name: 'Mike Epstein', jersey: 26, height: 72, weight: 205, line: '25 CAR, 107 YDS, 1 TD' },
      { name: 'Chase Hayden', jersey: 22, height: 70, weight: 205, line: '5 CAR, 18 YDS' },
      { name: 'Kenyon Sims', jersey: 20, height: 71, weight: 191 }
    ],
    WR: [
      { name: 'Casey Washington', jersey: 14, height: 72, weight: 200, line: '21 REC, 294 YDS' },
      { name: 'Donny Navarro III', jersey: 80, height: 71, weight: 185, line: '17 REC, 167 YDS' },
      { name: 'Deuce Spann', jersey: 22, height: 76, weight: 210, line: '5 REC, 124 YDS, 2 TD' },
      { name: 'Pat Bryant', jersey: 13, height: 74, weight: 204, line: '6 REC, 98 YDS' },
      { name: 'Dalevon Campbell', jersey: 15, height: 76, weight: 220, line: '3 REC, 50 YDS' },
      { name: 'Carlos Sandy', jersey: 11, height: 69, weight: 185, line: '4 REC, 16 YDS' },
      { name: 'Jafar Armstrong', jersey: 9, height: 73, weight: 220 },
      { name: 'Khmari Thompson', jersey: 8, height: 73, weight: 207 }
    ],
    TE: [
      { name: 'Daniel Barker', jersey: 9, height: 76, weight: 250, line: '18 REC, 202 YDS, 4 TD' },
      { name: 'Luke Ford', jersey: 82, height: 78, weight: 265, line: '15 REC, 114 YDS, 2 TD' },
      { name: 'Tip Reiman', jersey: 89, height: 77, weight: 271, line: '3 REC, 43 YDS, 1 TD' },
      { name: 'Michael Marchese', jersey: 42, height: 76, weight: 235, line: '2 REC, 30 YDS' },
      { name: 'Daniel Imatorbhebhe', jersey: 0, height: 76, weight: 240 }
    ]
  },
  ohioState: {
    QB: [
      { name: 'C.J. Stroud', jersey: 7, height: 75, weight: 218, line: '280/395, 3862 YDS, 38 TD, 5 INT' },
      { name: 'Kyle McCord', jersey: 6, height: 75, weight: 218, line: '25/38, 416 YDS, 2 TD, 2 INT' },
      { name: 'Jack Miller III', jersey: 10, height: 75, weight: 210, line: '7/14, 101 YDS' }
    ],
    RB: [
      { name: 'TreVeyon Henderson', jersey: 32, height: 70, weight: 202, line: '167 CAR, 1172 YDS, 15 TD' },
      { name: 'Miyan Williams', jersey: 3, height: 69, weight: 226, line: '69 CAR, 490 YDS, 3 TD' },
      { name: 'Master Teague', jersey: 33, height: 71, weight: 220, line: '66 CAR, 348 YDS, 4 TD' },
      { name: 'Marcus Crowley', jersey: 24, height: 73, weight: 213, line: '20 CAR, 103 YDS' },
      { name: 'Evan Pryor', jersey: 21, height: 70, weight: 189, line: '21 CAR, 98 YDS, 1 TD' },
      { name: 'Robert Cope', jersey: 43, height: 69, weight: 198, line: '2 CAR, 4 YDS' }
    ],
    WR: [
      { name: 'Jaxon Smith-Njigba', jersey: 11, height: 72, weight: 197, line: '80 REC, 1259 YDS, 6 TD' },
      { name: 'Garrett Wilson', jersey: 5, height: 72, weight: 183, line: '70 REC, 1058 YDS, 12 TD' },
      { name: 'Chris Olave', jersey: 2, height: 72, weight: 187, line: '65 REC, 936 YDS, 13 TD' },
      { name: 'Emeka Egbuka', jersey: 2, height: 73, weight: 205, line: '6 REC, 145 YDS' },
      { name: 'Marvin Harrison Jr.', jersey: 18, height: 75, weight: 220, line: '5 REC, 68 YDS' },
      { name: 'Julian Fleming', jersey: 3, height: 74, weight: 206, line: '7 REC, 51 YDS, 1 TD' },
      { name: 'Chris Booker', jersey: 86, height: 75, weight: 192, line: '2 REC, 27 YDS' },
      { name: 'Sam Wiglusz', jersey: 12, height: 72, weight: 187, line: '2 REC, 14 YDS' },
      { name: 'Jayden Ballard', jersey: 4, height: 74, weight: 205, line: '1 REC, 4 YDS' },
      { name: 'Jameson Williams', jersey: 1, height: 73, weight: 184 },
      { name: 'Joop Mitchell', jersey: 83, height: 73, weight: 180 },
      { name: 'Kamryn Babb', jersey: 0, height: 72, weight: 210 },
      { name: 'Mookie Cooper', jersey: 5, height: 69, weight: 185 },
      { name: 'Xavier Johnson', jersey: 0, height: 73, weight: 210 }
    ],
    TE: [
      { name: 'Jeremy Ruckert', jersey: 88, height: 77, weight: 250, line: '23 REC, 284 YDS, 3 TD' },
      { name: 'Cade Stover', jersey: 8, height: 76, weight: 251, line: '5 REC, 76 YDS' },
      { name: 'Gee Scott Jr.', jersey: 88, height: 75, weight: 238, line: '5 REC, 42 YDS' },
      { name: 'Joe Royer', jersey: 11, height: 77, weight: 250, line: '1 REC, 9 YDS' },
      { name: 'Mitch Rossi', jersey: 34, height: 73, weight: 250, line: '3 REC, 6 YDS, 1 TD' }
    ]
  }
};
