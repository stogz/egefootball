/* ==========================================================================
   EGE Football — the rosters
   Written by tools/build-rosters.js from ESPN; run that again rather than
   editing this by hand (though a hand edit is fine until the next run).

   The skill players on each of the six's college teams, by season and by
   the team's key in EGE.teams: every quarterback, back, receiver and tight
   end, best first, with the season's line beside anybody who had one.
   `year` is his year of college that season (1 a freshman, 5 a
   fifth-year), `overall` his overall on the six's scale (how it is worked
   out is at the top of the tool), `espn` his ESPN id and `photo` whether
   ESPN has his headshot. Jersey numbers are ESPN's; EGE.rosterFor moves
   anybody wearing one of the six's. The six are not listed -- they are
   put into their rooms by EGE.rosterFor in data/games.js.
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.rosters = EGE.rosters || {};

EGE.rosters[2020] = {
  alabama: {
    QB: [
      { name: 'Mac Jones', jersey: 10, year: 4, overall: 85, height: 75, weight: 220, espn: 4241464, photo: true, line: '311/402, 4500 YDS, 41 TD, 4 INT' },
      { name: 'Bryce Young', jersey: 9, year: 1, overall: 70, height: 70, weight: 204, espn: 4685720, photo: true, line: '13/22, 156 YDS, 1 TD' }
    ],
    RB: [
      { name: 'Najee Harris', jersey: 22, year: 4, overall: 99, height: 73, weight: 232, espn: 4241457, photo: true, line: '251 CAR, 1466 YDS, 26 TD' },
      { name: 'Brian Robinson Jr.', jersey: 4, year: 4, overall: 77, height: 73, weight: 225, espn: 4241474, photo: true, line: '91 CAR, 483 YDS, 6 TD' },
      { name: 'Trey Sanders', jersey: 2, year: 2, overall: 73, height: 72, weight: 215, espn: 107494, photo: true, line: '30 CAR, 134 YDS' },
      { name: 'Jase McClellan', jersey: 2, year: 1, overall: 71, height: 71, weight: 212, espn: 4429001, photo: true, line: '23 CAR, 245 YDS, 2 TD' },
      { name: 'Roydell Williams', jersey: 5, year: 1, overall: 66, height: 70, weight: 223, espn: 4685723, photo: true, line: '19 CAR, 71 YDS, 1 TD' }
    ],
    WR: [
      { name: 'DeVonta Smith', jersey: 6, year: 4, overall: 96, height: 72, weight: 170, espn: 4241478, photo: true, line: '117 REC, 1856 YDS, 23 TD' },
      { name: 'Jaylen Waddle', jersey: 17, year: 3, overall: 84, height: 70, weight: 185, espn: 4372016, photo: true, line: '28 REC, 591 YDS, 4 TD' },
      { name: 'John Metchie III', jersey: 8, year: 2, overall: 81, height: 71, weight: 187, espn: 4567096, photo: true, line: '55 REC, 916 YDS, 6 TD' },
      { name: 'Xavier Williams', jersey: 3, year: 3, overall: 66, height: 72, weight: 180, espn: 4372015, photo: true, line: '3 REC, 24 YDS' },
      { name: 'Slade Bolden', jersey: 18, year: 3, overall: 64, height: 71, weight: 189, espn: 4360115, photo: true, line: '24 REC, 270 YDS, 1 TD' },
      { name: 'Thaiu Jones-Bell', jersey: 14, year: 1, overall: 61, height: 72, weight: 198, espn: 4430823, photo: true, line: '1 REC, -2 YDS' },
      { name: 'Javon Baker', jersey: 1, year: 1, overall: 60, height: 73, weight: 202, espn: 4692022, photo: true, line: '2 REC, 15 YDS' }
    ],
    TE: [
      { name: 'Miller Forristall', jersey: 87, year: 5, overall: 72, height: 77, weight: 243, espn: 4040714, photo: true, line: '23 REC, 253 YDS, 1 TD' },
      { name: 'Jahleel Billingsley', jersey: 9, year: 2, overall: 70, height: 76, weight: 219, espn: 4567105, photo: true, line: '18 REC, 287 YDS, 3 TD' },
      { name: 'Major Tennison', jersey: 88, year: 4, overall: 64, height: 77, weight: 252, espn: 4241480, photo: true, line: '1 REC, 4 YDS' },
      { name: 'Carl Tucker', jersey: 86, year: 5, overall: 61, height: 74, weight: 250, espn: 3895833, photo: true }
    ]
  },
  usc: {
    QB: [
      { name: 'Kedon Slovis', jersey: 10, year: 2, overall: 72, height: 74, weight: 223, espn: 4428512, photo: true, line: '177/264, 1921 YDS, 17 TD, 7 INT' },
      { name: 'Matt Fink', jersey: 19, year: 5, overall: 65, height: 75, weight: 210, espn: 4035691, photo: true, line: '1/1, -5 YDS' }
    ],
    RB: [
      { name: 'Stephen Carr', jersey: 5, year: 4, overall: 81, height: 73, weight: 215, espn: 4259633, photo: true, line: '46 CAR, 176 YDS, 2 TD' },
      { name: 'Vavae Malepeai', jersey: 6, year: 5, overall: 75, height: 72, weight: 220, espn: 4035695, photo: true, line: '54 CAR, 238 YDS, 3 TD' },
      { name: 'Markese Stepp', jersey: 30, year: 3, overall: 66, height: 73, weight: 225, espn: 4374306, photo: true, line: '45 CAR, 165 YDS, 3 TD' },
      { name: 'Kenan Christon II', jersey: 8, year: 2, overall: 66, height: 70, weight: 202, espn: 4426910, photo: true, line: '10 CAR, 70 YDS' },
      { name: 'Quincy Jountti', jersey: 27, year: 5, overall: 53, height: 71, weight: 210, espn: 4028215, photo: true, line: '2 CAR, 4 YDS' }
    ],
    WR: [
      { name: 'Amon-Ra St. Brown', jersey: 8, year: 3, overall: 90, height: 72, weight: 202, espn: 4374302, photo: true, line: '41 REC, 478 YDS, 7 TD' },
      { name: 'Tyler Vaughns', jersey: 21, year: 5, overall: 90, height: 74, weight: 184, espn: 4035692, photo: true, line: '33 REC, 406 YDS, 3 TD' },
      { name: 'Bru McCoy', jersey: 5, year: 2, overall: 76, height: 75, weight: 230, espn: 4426337, photo: true, line: '21 REC, 236 YDS, 2 TD' },
      { name: 'Drake London', jersey: 15, year: 2, overall: 71, height: 76, weight: 215, espn: 4426502, photo: true, line: '33 REC, 502 YDS, 3 TD' },
      { name: 'Gary Bryant Jr.', jersey: 2, year: 1, overall: 67, height: 71, weight: 191, espn: 4429125, photo: true, line: '7 REC, 51 YDS' },
      { name: 'John Jackson', jersey: 14, year: 3, overall: 58, height: 72, weight: 213, espn: 4569510, photo: true, line: '1 REC, 23 YDS' }
    ],
    TE: [
      { name: 'Josh Falo', jersey: 83, year: 4, overall: 68, height: 78, weight: 255, espn: 4259648, photo: true },
      { name: 'Erik Krommenhoek', jersey: 84, year: 4, overall: 62, height: 77, weight: 245, espn: 4259649, photo: true, line: '9 REC, 59 YDS, 2 TD' },
      { name: 'Jude Wolfe', jersey: 18, year: 2, overall: 61, height: 78, weight: 247, espn: 4428921, photo: true, line: '2 REC, 5 YDS' }
    ]
  },
  northDakotaState: {
    QB: [
      { name: 'Trey Lance', jersey: 5, year: 3, overall: 62, height: 76, weight: 226, espn: 4383351, line: '15/30, 149 YDS, 2 TD, 1 INT' },
      { name: 'Zeb Noland', jersey: 8, year: 5, overall: 54, height: 74, weight: 232, espn: 4035525, photo: true },
      { name: 'Cam Miller', jersey: 7, year: 1, overall: 50, height: 73, weight: 211, espn: 4693331, photo: true }
    ],
    RB: [
      { name: 'Adam Cofield', jersey: 7, year: 5, overall: 61, height: 71, weight: 215, espn: 4040935, photo: true, line: '8 CAR, 3 YDS' },
      { name: 'Kobe Johnson', jersey: 0, year: 2, overall: 53, height: 69, weight: 190, espn: 4572525, photo: true, line: '9 CAR, 31 YDS' },
      { name: 'Seth Wilson', jersey: null, year: 4, overall: 50, height: 70, weight: 200, espn: 4248540, line: '7 CAR, 55 YDS' },
      { name: 'Hunter Luepke', jersey: 44, year: 2, overall: 48, height: 73, weight: 250, espn: 4383396, photo: true, line: '2 CAR, 27 YDS, 1 TD' },
      { name: 'Jalen Bussey', jersey: 21, year: 2, overall: 48, height: 65, weight: 160, espn: 4572524 },
      { name: 'Dominic Gonnella', jersey: 34, year: 1, overall: 45, height: 71, weight: 211, espn: 4693322 },
      { name: 'Hunter Brozio', jersey: 49, year: 1, overall: 45, height: 73, weight: 233, espn: 4572540, photo: true },
      { name: 'TK Marshall', jersey: 28, year: 1, overall: 45, height: 72, weight: 208, espn: 4693330, photo: true }
    ],
    WR: [
      { name: 'Christian Watson', jersey: 1, year: 4, overall: 59, height: 76, weight: 215, espn: 4248528, line: '2 REC, 8 YDS' },
      { name: 'Zach Mathis', jersey: 0, year: 3, overall: 49, height: 79, weight: 203, espn: 4383364, line: '1 REC, 16 YDS' },
      { name: 'Braylon Henderson', jersey: 1, year: 2, overall: 47, height: 69, weight: 175, espn: 4427446, photo: true, line: '3 REC, 36 YDS' },
      { name: 'Cole Jacob', jersey: 89, year: 2, overall: 47, height: 73, weight: 203, espn: 4040929 },
      { name: 'Jake Lippe', jersey: 19, year: 1, overall: 45, height: 74, weight: 201, espn: 4572530 },
      { name: 'RaJa Nelson', jersey: 3, year: 1, overall: 45, height: 69, weight: 196, espn: 4693333, photo: true }
    ],
    TE: [
      { name: 'Noah Gindorff', jersey: null, year: 4, overall: 56, height: 78, weight: 268, espn: 4248546, photo: true, line: '1 REC, 11 YDS' },
      { name: 'Josh Babicz', jersey: 81, year: 4, overall: 55, height: 78, weight: 255, espn: 4248555, line: '3 REC, 35 YDS, 1 TD' }
    ]
  },
  illinois: {
    QB: [
      { name: 'Brandon Peters', jersey: 18, year: 5, overall: 82, height: 76, weight: 228, espn: 4036262, photo: true, line: '39/80, 429 YDS, 3 TD' },
      { name: 'Matt Robinson', jersey: 6, year: 3, overall: 51, height: 73, weight: 185, espn: 4371942, photo: true, line: '3/4, 22 YDS' }
    ],
    RB: [
      { name: 'Chase Brown', jersey: 2, year: 3, overall: 64, height: 70, weight: 210, espn: 4362238, photo: true, line: '104 CAR, 540 YDS, 3 TD' },
      { name: 'Mike Epstein', jersey: 26, year: 4, overall: 64, height: 72, weight: 205, espn: 4240543, photo: true, line: '69 CAR, 367 YDS, 4 TD' },
      { name: 'Reggie Love III', jersey: 23, year: 1, overall: 56, height: 71, weight: 215, espn: 4696690, photo: true, line: '10 CAR, 12 YDS' },
      { name: 'Kyron Cumby', jersey: 24, year: 2, overall: 55, height: 68, weight: 180, espn: 4427003, photo: true, line: '2 CAR, 11 YDS' },
      { name: 'Nick Fedanzo', jersey: 24, year: 2, overall: 51, height: 72, weight: 220, espn: 4427172, photo: true, line: '1 CAR, 2 YDS' },
      { name: 'Jakari Norwood', jersey: 29, year: 3, overall: 51, height: 70, weight: 195, espn: 4360370, photo: true, line: '2 CAR, 1 YDS' },
      { name: 'Conner Lillig', jersey: 23, year: 2, overall: 47, height: 70, weight: 190, espn: 4260370, photo: true, line: '3 CAR, 14 YDS' }
    ],
    WR: [
      { name: 'Josh Imatorbhebhe', jersey: 9, year: 5, overall: 82, height: 74, weight: 220, espn: 4035689, photo: true, line: '22 REC, 297 YDS, 3 TD' },
      { name: 'Brian Hightower', jersey: 7, year: 3, overall: 71, height: 75, weight: 215, espn: 4362501, photo: true, line: '11 REC, 209 YDS, 3 TD' },
      { name: 'Donny Navarro III', jersey: 80, year: 4, overall: 56, height: 71, weight: 185, espn: 4249535, photo: true, line: '8 REC, 88 YDS' },
      { name: 'Carlos Sandy', jersey: 11, year: 3, overall: 55, height: 69, weight: 185, espn: 4360373, photo: true, line: '1 REC, 29 YDS, 1 TD' },
      { name: 'James Frenchie Jr.', jersey: 13, year: 1, overall: 55, height: 70, weight: 175, espn: 4429116, photo: true },
      { name: 'Khmari Thompson', jersey: 8, year: 3, overall: 55, height: 73, weight: 207, espn: 4362752, photo: true },
      { name: 'Dalevon Campbell', jersey: 15, year: 2, overall: 54, height: 76, weight: 220, espn: 4569372, photo: true, line: '3 REC, 48 YDS' },
      { name: 'Casey Washington', jersey: 14, year: 2, overall: 53, height: 72, weight: 200, espn: 4428796, photo: true, line: '10 REC, 106 YDS' },
      { name: 'Deuce Spann', jersey: 22, year: 1, overall: 52, height: 76, weight: 210, espn: 4696686, photo: true },
      { name: 'Ty Lindenman', jersey: 15, year: 1, overall: 45, height: 66, weight: 165, espn: 4696687, photo: true }
    ],
    TE: [
      { name: 'Luke Ford', jersey: 82, year: 3, overall: 71, height: 78, weight: 265, espn: 4379402, photo: true, line: '2 REC, 15 YDS' },
      { name: 'Daniel Barker', jersey: 9, year: 3, overall: 63, height: 76, weight: 250, espn: 4360400, photo: true, line: '19 REC, 268 YDS, 2 TD' },
      { name: 'Daniel Imatorbhebhe', jersey: 0, year: 5, overall: 63, height: 76, weight: 240, espn: 3682406, photo: true, line: '3 REC, 54 YDS, 1 TD' },
      { name: 'Michael Marchese', jersey: 42, year: 4, overall: 51, height: 76, weight: 235, espn: 4240546, photo: true },
      { name: 'Griffin Moore', jersey: 13, year: 2, overall: 50, height: 76, weight: 250, espn: 4430190, photo: true },
      { name: 'Tip Reiman', jersey: 89, year: 1, overall: 45, height: 77, weight: 271, espn: 4696700, photo: true }
    ]
  },
  ohioState: {
    QB: [
      { name: 'Justin Fields', jersey: 1, year: 3, overall: 92, height: 75, weight: 227, espn: 4362887, photo: true, line: '158/225, 2100 YDS, 22 TD, 6 INT' },
      { name: 'C.J. Stroud', jersey: 7, year: 1, overall: 67, height: 75, weight: 218, espn: 4432577, photo: true },
      { name: 'Gunnar Hoak', jersey: 12, year: 5, overall: 60, height: 76, weight: 215, espn: 4035051, photo: true },
      { name: 'Jack Miller III', jersey: 10, year: 1, overall: 57, height: 75, weight: 210, espn: 4685091, photo: true }
    ],
    RB: [
      { name: 'Trey Sermon', jersey: 8, year: 4, overall: 83, height: 72, weight: 215, espn: 4241401, photo: true, line: '116 CAR, 870 YDS, 4 TD' },
      { name: 'Master Teague', jersey: 33, year: 3, overall: 74, height: 71, weight: 220, espn: 4361354, photo: true, line: '104 CAR, 514 YDS, 8 TD' },
      { name: 'Marcus Crowley', jersey: 24, year: 2, overall: 62, height: 73, weight: 213, espn: 4429481, photo: true, line: '6 CAR, 14 YDS' },
      { name: 'Miyan Williams', jersey: 3, year: 1, overall: 55, height: 69, weight: 226, espn: 4432637, photo: true, line: '10 CAR, 64 YDS' }
    ],
    WR: [
      { name: 'Garrett Wilson', jersey: 5, year: 2, overall: 88, height: 72, weight: 183, espn: 4569618, photo: true, line: '43 REC, 723 YDS, 6 TD' },
      { name: 'Chris Olave', jersey: 2, year: 3, overall: 77, height: 72, weight: 187, espn: 4361370, photo: true, line: '50 REC, 729 YDS, 7 TD' },
      { name: 'Jameson Williams', jersey: 1, year: 2, overall: 70, height: 73, weight: 184, espn: 4426388, photo: true, line: '9 REC, 154 YDS, 2 TD' },
      { name: 'Julian Fleming', jersey: 3, year: 1, overall: 70, height: 74, weight: 206, espn: 4430800, photo: true, line: '7 REC, 74 YDS' },
      { name: 'Jaxon Smith-Njigba', jersey: 11, year: 1, overall: 69, height: 72, weight: 197, espn: 4430878, photo: true, line: '10 REC, 49 YDS, 1 TD' },
      { name: 'Kamryn Babb', jersey: 0, year: 3, overall: 69, height: 72, weight: 210, espn: 4361347, photo: true },
      { name: 'Jaylen Harris', jersey: 15, year: 4, overall: 66, height: 77, weight: 215, espn: 4241991, photo: true },
      { name: 'Xavier Johnson', jersey: 0, year: 3, overall: 55, height: 73, weight: 210, espn: 4385430, photo: true },
      { name: 'Chris Booker', jersey: 86, year: 1, overall: 45, height: 75, weight: 192, espn: 4029426, photo: true }
    ],
    TE: [
      { name: 'Jeremy Ruckert', jersey: 88, year: 3, overall: 79, height: 77, weight: 250, espn: 4361372, photo: true, line: '13 REC, 151 YDS, 5 TD' },
      { name: 'Luke Farrell', jersey: 89, year: 5, overall: 72, height: 77, weight: 250, espn: 4040612, photo: true, line: '5 REC, 37 YDS, 1 TD' },
      { name: 'Jake Hausmann', jersey: 81, year: 5, overall: 71, height: 76, weight: 245, espn: 4040617, photo: true, line: '1 REC, 13 YDS' },
      { name: 'Cade Stover', jersey: 8, year: 2, overall: 47, height: 76, weight: 251, espn: 4426496, photo: true }
    ]
  }
};

EGE.rosters[2021] = {
  alabama: {
    QB: [
      { name: 'Bryce Young', jersey: 9, year: 2, overall: 95, height: 70, weight: 204, espn: 4685720, photo: true, line: '314/462, 4322 YDS, 43 TD, 4 INT' },
      { name: 'Jalen Milroe', jersey: 4, year: 1, overall: 65, height: 74, weight: 216, espn: 4432734, photo: true, line: '3/7, 41 YDS, 1 TD' },
      { name: 'Paul Tyson', jersey: 15, year: 3, overall: 61, height: 76, weight: 215, espn: 4567102, photo: true, line: '10/16, 150 YDS' },
      { name: 'Braxton Barker', jersey: 7, year: 4, overall: 51, height: 73, weight: 202, espn: 4372013, photo: true, line: '1/1, 10 YDS' }
    ],
    RB: [
      { name: 'Brian Robinson Jr.', jersey: 4, year: 5, overall: 93, height: 73, weight: 225, espn: 4241474, photo: true, line: '223 CAR, 1071 YDS, 14 TD' },
      { name: 'Trey Sanders', jersey: 2, year: 3, overall: 78, height: 72, weight: 215, espn: 107494, photo: true, line: '56 CAR, 242 YDS, 2 TD' },
      { name: 'Jase McClellan', jersey: 2, year: 2, overall: 74, height: 71, weight: 212, espn: 4429001, photo: true, line: '40 CAR, 191 YDS, 1 TD' },
      { name: 'Roydell Williams', jersey: 5, year: 2, overall: 73, height: 70, weight: 223, espn: 4685723, photo: true, line: '48 CAR, 284 YDS, 1 TD' }
    ],
    WR: [
      { name: 'Jameson Williams', jersey: 1, year: 3, overall: 92, height: 73, weight: 184, espn: 4426388, photo: true, line: '68 REC, 1445 YDS, 15 TD' },
      { name: 'John Metchie III', jersey: 8, year: 3, overall: 86, height: 71, weight: 187, espn: 4567096, photo: true, line: '96 REC, 1142 YDS, 8 TD' },
      { name: 'JoJo Earle', jersey: 11, year: 1, overall: 69, height: 70, weight: 185, espn: 4432694, photo: true, line: '12 REC, 148 YDS' },
      { name: 'Ja\'Corey Brooks', jersey: 1, year: 1, overall: 69, height: 75, weight: 195, espn: 4431506, photo: true, line: '5 REC, 79 YDS, 1 TD' },
      { name: 'Slade Bolden', jersey: 18, year: 4, overall: 68, height: 71, weight: 189, espn: 4360115, photo: true, line: '32 REC, 333 YDS, 2 TD' },
      { name: 'Agiye Hall', jersey: null, year: 1, overall: 67, height: 75, weight: 194, espn: 4567774, photo: true, line: '2 REC, 20 YDS' },
      { name: 'Christian Leary', jersey: 1, year: 1, overall: 66, height: 70, weight: 180, espn: 4587702, photo: true, line: '2 REC, 4 YDS, 1 TD' },
      { name: 'Traeshon Holden', jersey: 1, year: 2, overall: 65, height: 74, weight: 208, espn: 4429172, photo: true, line: '15 REC, 211 YDS, 1 TD' },
      { name: 'Javon Baker', jersey: 1, year: 2, overall: 64, height: 73, weight: 202, espn: 4692022, photo: true, line: '7 REC, 101 YDS, 1 TD' },
      { name: 'Thaiu Jones-Bell', jersey: 14, year: 2, overall: 64, height: 72, weight: 198, espn: 4430823, photo: true, line: '2 REC, 16 YDS' },
      { name: 'Jacoby Boykins', jersey: 84, year: 1, overall: 45, height: 73, weight: 195, espn: 4880047, photo: true }
    ],
    TE: [
      { name: 'Jahleel Billingsley', jersey: 9, year: 3, overall: 71, height: 76, weight: 219, espn: 4567105, photo: true, line: '16 REC, 244 YDS, 3 TD' },
      { name: 'Cameron Latu', jersey: 81, year: 4, overall: 64, height: 77, weight: 244, espn: 4372026, photo: true, line: '20 REC, 299 YDS, 6 TD' },
      { name: 'Robbie Ouzts', jersey: 45, year: 1, overall: 54, height: 75, weight: 274, espn: 4691688, photo: true, line: '1 REC, 8 YDS' }
    ]
  },
  usc: {
    QB: [
      { name: 'Jaxson Dart', jersey: 2, year: 1, overall: 74, height: 74, weight: 223, espn: 4689114, photo: true, line: '117/189, 1353 YDS, 9 TD, 5 INT' },
      { name: 'Kedon Slovis', jersey: 10, year: 3, overall: 70, height: 74, weight: 223, espn: 4428512, photo: true, line: '193/297, 2153 YDS, 11 TD, 8 INT' },
      { name: 'Miller Moss', jersey: 7, year: 1, overall: 65, height: 73, weight: 211, espn: 4431580, photo: true, line: '8/13, 74 YDS, 1 TD' }
    ],
    RB: [
      { name: 'Keaontay Ingram', jersey: 28, year: 4, overall: 86, height: 72, weight: 220, espn: 4362087, photo: true, line: '156 CAR, 911 YDS, 5 TD' },
      { name: 'Vavae Malepeai', jersey: 6, year: 5, overall: 78, height: 72, weight: 220, espn: 4035695, photo: true, line: '114 CAR, 502 YDS, 6 TD' },
      { name: 'Darwin Barlow', jersey: 24, year: 3, overall: 65, height: 72, weight: 220, espn: 4426635, photo: true, line: '62 CAR, 289 YDS, 2 TD' },
      { name: 'Kenan Christon II', jersey: 8, year: 3, overall: 61, height: 70, weight: 202, espn: 4426910, photo: true },
      { name: 'Brandon Campbell', jersey: 23, year: 1, overall: 58, height: 70, weight: 210, espn: 4433965, photo: true, line: '12 CAR, 53 YDS' },
      { name: 'Quincy Jountti', jersey: 27, year: 5, overall: 53, height: 71, weight: 210, espn: 4028215, photo: true }
    ],
    WR: [
      { name: 'Drake London', jersey: 15, year: 3, overall: 86, height: 76, weight: 215, espn: 4426502, photo: true, line: '88 REC, 1084 YDS, 7 TD' },
      { name: 'Gary Bryant Jr.', jersey: 2, year: 2, overall: 83, height: 71, weight: 191, espn: 4429125, photo: true, line: '44 REC, 579 YDS, 7 TD' },
      { name: 'Kyle Ford', jersey: 81, year: 3, overall: 77, height: 73, weight: 225, espn: 4426357, photo: true, line: '19 REC, 252 YDS, 2 TD' },
      { name: 'K.D. Nixon', jersey: 21, year: 5, overall: 66, height: 68, weight: 190, espn: 4243168, photo: true, line: '3 REC, 35 YDS, 1 TD' },
      { name: 'Tahj Washington', jersey: 16, year: 3, overall: 65, height: 70, weight: 174, espn: 4567506, photo: true, line: '54 REC, 602 YDS, 1 TD' },
      { name: 'Kyron Hudson', jersey: 11, year: 1, overall: 62, height: 73, weight: 212, espn: 4432784, photo: true, line: '2 REC, 4 YDS' },
      { name: 'John Jackson', jersey: 14, year: 4, overall: 60, height: 72, weight: 213, espn: 4569510, photo: true, line: '3 REC, 16 YDS' },
      { name: 'Michael Jackson III', jersey: 2, year: 1, overall: 58, height: 72, weight: 205, espn: 4592573, photo: true, line: '12 REC, 116 YDS' },
      { name: 'Joseph Manjack IV', jersey: 14, year: 1, overall: 55, height: 75, weight: 210, espn: 4683227, photo: true, line: '7 REC, 67 YDS' }
    ],
    TE: [
      { name: 'Malcolm Epps', jersey: 7, year: 4, overall: 71, height: 78, weight: 255, espn: 4362110, photo: true, line: '10 REC, 173 YDS, 1 TD' },
      { name: 'Erik Krommenhoek', jersey: 84, year: 5, overall: 66, height: 77, weight: 245, espn: 4259649, photo: true, line: '15 REC, 137 YDS, 1 TD' },
      { name: 'Michael Trigg', jersey: 1, year: 1, overall: 66, height: 76, weight: 240, espn: 4594749, photo: true, line: '7 REC, 109 YDS, 1 TD' },
      { name: 'Jude Wolfe', jersey: 18, year: 3, overall: 65, height: 78, weight: 247, espn: 4428921, photo: true, line: '8 REC, 56 YDS' },
      { name: 'Lake McRee', jersey: 87, year: 1, overall: 58, height: 76, weight: 243, espn: 4566198, photo: true, line: '7 REC, 91 YDS' },
      { name: 'Grant Jones', jersey: 46, year: 1, overall: 45, height: 74, weight: 220, espn: 4400898, photo: true }
    ]
  },
  northDakotaState: {
    QB: [
      { name: 'Quincy Patterson', jersey: 16, year: 4, overall: 65, height: 75, weight: 235, espn: 4361959, photo: true, line: '55/101, 813 YDS, 6 TD, 4 INT' },
      { name: 'Cam Miller', jersey: 7, year: 2, overall: 59, height: 73, weight: 211, espn: 4693331, photo: true, line: '84/119, 1153 YDS, 11 TD, 3 INT' },
      { name: 'Cole Payton', jersey: 9, year: 1, overall: 45, height: 74, weight: 232, espn: 4879250, photo: true, line: '1/3, 6 YDS' }
    ],
    RB: [
      { name: 'TaMerik Williams', jersey: 22, year: 4, overall: 64, height: 72, weight: 227, espn: 4360564, photo: true, line: '107 CAR, 699 YDS, 12 TD' },
      { name: 'Kobe Johnson', jersey: 0, year: 3, overall: 56, height: 69, weight: 190, espn: 4572525, photo: true, line: '97 CAR, 557 YDS, 2 TD' },
      { name: 'Hunter Luepke', jersey: 44, year: 3, overall: 55, height: 73, weight: 250, espn: 4383396, photo: true, line: '54 CAR, 351 YDS, 5 TD' },
      { name: 'Jalen Bussey', jersey: 21, year: 3, overall: 54, height: 65, weight: 160, espn: 4572524, line: '47 CAR, 356 YDS, 4 TD' },
      { name: 'Dominic Gonnella', jersey: 34, year: 2, overall: 52, height: 71, weight: 211, espn: 4693322, line: '64 CAR, 377 YDS, 2 TD' },
      { name: 'TK Marshall', jersey: 28, year: 2, overall: 50, height: 72, weight: 208, espn: 4693330, photo: true, line: '22 CAR, 236 YDS, 1 TD' },
      { name: 'Mitchell Kartes', jersey: 8, year: 3, overall: 48, height: 72, weight: 202, espn: 4383400, line: '3 CAR, 8 YDS' },
      { name: 'Nathan Goldade', jersey: 26, year: 1, overall: 45, height: 71, weight: 193, espn: 4693321, line: '3 CAR, 16 YDS' },
      { name: 'Logan Hofstedt', jersey: 33, year: 1, overall: 45, height: 73, weight: 238, espn: 4572529, photo: true }
    ],
    WR: [
      { name: 'Christian Watson', jersey: 1, year: 5, overall: 66, height: 76, weight: 215, espn: 4248528, line: '39 REC, 739 YDS, 7 TD' },
      { name: 'Phoenix Sproles', jersey: 0, year: 4, overall: 54, height: 71, weight: 194, espn: 4383359, photo: true, line: '18 REC, 265 YDS, 2 TD' },
      { name: 'Braylon Henderson', jersey: 1, year: 3, overall: 51, height: 69, weight: 175, espn: 4427446, photo: true, line: '14 REC, 130 YDS' },
      { name: 'Zach Mathis', jersey: 0, year: 4, overall: 51, height: 79, weight: 203, espn: 4383364, line: '8 REC, 112 YDS' },
      { name: 'RaJa Nelson', jersey: 3, year: 2, overall: 48, height: 69, weight: 196, espn: 4693333, photo: true, line: '11 REC, 91 YDS, 1 TD' },
      { name: 'DJ Hart', jersey: 9, year: 3, overall: 48, height: 71, weight: 191, espn: 4693324, line: '1 REC, 4 YDS' },
      { name: 'Jake Lippe', jersey: 19, year: 2, overall: 47, height: 74, weight: 201, espn: 4572530, line: '1 REC, 8 YDS' },
      { name: 'Giancarlo Volpentesta', jersey: 83, year: 1, overall: 45, height: 72, weight: 214, espn: 4572517, line: '1 REC, 4 YDS' },
      { name: 'Tyler Terhark', jersey: 6, year: 1, overall: 45, height: 74, weight: 209, espn: 4693342, photo: true }
    ],
    TE: [
      { name: 'Noah Gindorff', jersey: null, year: 5, overall: 58, height: 78, weight: 268, espn: 4248546, photo: true, line: '17 REC, 193 YDS, 2 TD' },
      { name: 'Josh Babicz', jersey: 81, year: 5, overall: 57, height: 78, weight: 255, espn: 4248555, line: '9 REC, 196 YDS, 3 TD' },
      { name: 'Joe Stoffel', jersey: 82, year: 2, overall: 50, height: 76, weight: 245, espn: 4693341, photo: true, line: '1 REC, 8 YDS' }
    ]
  },
  illinois: {
    QB: [
      { name: 'Brandon Peters', jersey: 18, year: 5, overall: 80, height: 76, weight: 228, espn: 4036262, photo: true, line: '91/169, 1170 YDS, 7 TD, 4 INT' },
      { name: 'Artur Sitkowski', jersey: 9, year: 4, overall: 66, height: 77, weight: 225, espn: 4361530, photo: true, line: '74/148, 704 YDS, 6 TD, 2 INT' }
    ],
    RB: [
      { name: 'Chase Brown', jersey: 2, year: 4, overall: 76, height: 70, weight: 210, espn: 4362238, photo: true, line: '170 CAR, 1005 YDS, 5 TD' },
      { name: 'Mike Epstein', jersey: 26, year: 5, overall: 64, height: 72, weight: 205, espn: 4240543, photo: true, line: '25 CAR, 107 YDS, 1 TD' },
      { name: 'Chase Hayden', jersey: 22, year: 5, overall: 64, height: 70, weight: 205, espn: 4242158, photo: true, line: '5 CAR, 18 YDS' },
      { name: 'Josh McCray', jersey: 2, year: 1, overall: 60, height: 73, weight: 235, espn: 4682640, photo: true, line: '112 CAR, 549 YDS, 2 TD' },
      { name: 'Reggie Love III', jersey: 23, year: 2, overall: 60, height: 71, weight: 215, espn: 4696690, photo: true, line: '44 CAR, 158 YDS' },
      { name: 'Jakari Norwood', jersey: 29, year: 4, overall: 54, height: 70, weight: 195, espn: 4360370, photo: true, line: '27 CAR, 120 YDS' }
    ],
    WR: [
      { name: 'Jafar Armstrong', jersey: 9, year: 5, overall: 62, height: 73, weight: 220, espn: 4258584, photo: true },
      { name: 'Casey Washington', jersey: 14, year: 3, overall: 59, height: 72, weight: 200, espn: 4428796, photo: true, line: '21 REC, 294 YDS' },
      { name: 'Deuce Spann', jersey: 22, year: 2, overall: 58, height: 76, weight: 210, espn: 4696686, photo: true, line: '5 REC, 124 YDS, 2 TD' },
      { name: 'Carlos Sandy', jersey: 11, year: 4, overall: 57, height: 69, weight: 185, espn: 4360373, photo: true, line: '4 REC, 16 YDS' },
      { name: 'Khmari Thompson', jersey: 8, year: 4, overall: 57, height: 73, weight: 207, espn: 4362752, photo: true },
      { name: 'Donny Navarro III', jersey: 80, year: 5, overall: 56, height: 71, weight: 185, espn: 4249535, photo: true, line: '17 REC, 167 YDS' },
      { name: 'Dalevon Campbell', jersey: 15, year: 3, overall: 56, height: 76, weight: 220, espn: 4569372, photo: true, line: '3 REC, 50 YDS' },
      { name: 'Pat Bryant', jersey: 13, year: 1, overall: 54, height: 74, weight: 204, espn: 4600981, photo: true, line: '6 REC, 98 YDS' }
    ],
    TE: [
      { name: 'Luke Ford', jersey: 82, year: 4, overall: 77, height: 78, weight: 265, espn: 4379402, photo: true, line: '15 REC, 114 YDS, 2 TD' },
      { name: 'Daniel Barker', jersey: 9, year: 4, overall: 65, height: 76, weight: 250, espn: 4360400, photo: true, line: '18 REC, 202 YDS, 4 TD' },
      { name: 'Michael Marchese', jersey: 42, year: 5, overall: 54, height: 76, weight: 235, espn: 4240546, photo: true, line: '2 REC, 30 YDS' },
      { name: 'Tip Reiman', jersey: 89, year: 2, overall: 49, height: 77, weight: 271, espn: 4696700, photo: true, line: '3 REC, 43 YDS, 1 TD' }
    ]
  },
  ohioState: {
    QB: [
      { name: 'C.J. Stroud', jersey: 7, year: 2, overall: 92, height: 75, weight: 218, espn: 4432577, photo: true, line: '280/395, 3862 YDS, 38 TD, 5 INT' },
      { name: 'Kyle McCord', jersey: 6, year: 1, overall: 70, height: 75, weight: 218, espn: 4433971, photo: true, line: '25/38, 416 YDS, 2 TD, 2 INT' },
      { name: 'Jack Miller III', jersey: 10, year: 2, overall: 59, height: 75, weight: 210, espn: 4685091, photo: true, line: '7/14, 101 YDS' }
    ],
    RB: [
      { name: 'TreVeyon Henderson', jersey: 32, year: 1, overall: 91, height: 70, weight: 202, espn: 4432710, photo: true, line: '167 CAR, 1172 YDS, 15 TD' },
      { name: 'Master Teague', jersey: 33, year: 4, overall: 74, height: 71, weight: 220, espn: 4361354, photo: true, line: '66 CAR, 348 YDS, 4 TD' },
      { name: 'Evan Pryor', jersey: 21, year: 1, overall: 67, height: 70, weight: 189, espn: 4432757, photo: true, line: '21 CAR, 98 YDS, 1 TD' },
      { name: 'Miyan Williams', jersey: 3, year: 2, overall: 66, height: 69, weight: 226, espn: 4432637, photo: true, line: '69 CAR, 490 YDS, 3 TD' },
      { name: 'Marcus Crowley', jersey: 24, year: 3, overall: 62, height: 73, weight: 213, espn: 4429481, photo: true, line: '20 CAR, 103 YDS' },
      { name: 'Robert Cope', jersey: 43, year: 1, overall: 45, height: 69, weight: 198, espn: 4385427, photo: true, line: '2 CAR, 4 YDS' }
    ],
    WR: [
      { name: 'Garrett Wilson', jersey: 5, year: 3, overall: 96, height: 72, weight: 183, espn: 4569618, photo: true, line: '70 REC, 1058 YDS, 12 TD' },
      { name: 'Jaxon Smith-Njigba', jersey: 11, year: 2, overall: 93, height: 72, weight: 197, espn: 4430878, photo: true, line: '80 REC, 1259 YDS, 6 TD' },
      { name: 'Chris Olave', jersey: 2, year: 4, overall: 85, height: 72, weight: 187, espn: 4361370, photo: true, line: '65 REC, 936 YDS, 13 TD' },
      { name: 'Julian Fleming', jersey: 3, year: 2, overall: 72, height: 74, weight: 206, espn: 4430800, photo: true, line: '7 REC, 51 YDS, 1 TD' },
      { name: 'Emeka Egbuka', jersey: 2, year: 1, overall: 71, height: 73, weight: 205, espn: 4567750, photo: true, line: '6 REC, 145 YDS' },
      { name: 'Kamryn Babb', jersey: 0, year: 4, overall: 71, height: 72, weight: 210, espn: 4361347, photo: true },
      { name: 'Marvin Harrison Jr.', jersey: 18, year: 1, overall: 65, height: 75, weight: 220, espn: 4432708, photo: true, line: '5 REC, 68 YDS' },
      { name: 'Jayden Ballard', jersey: 4, year: 1, overall: 64, height: 74, weight: 205, espn: 4431498, photo: true, line: '1 REC, 4 YDS' },
      { name: 'Xavier Johnson', jersey: 0, year: 4, overall: 57, height: 73, weight: 210, espn: 4385430, photo: true },
      { name: 'Sam Wiglusz', jersey: 12, year: 3, overall: 49, height: 72, weight: 187, espn: 4385438, photo: true, line: '2 REC, 14 YDS' },
      { name: 'Chris Booker', jersey: 86, year: 2, overall: 48, height: 75, weight: 192, espn: 4029426, photo: true, line: '2 REC, 27 YDS' },
      { name: 'Joop Mitchell', jersey: 83, year: 1, overall: 45, height: 73, weight: 180, espn: 4893906, photo: true }
    ],
    TE: [
      { name: 'Jeremy Ruckert', jersey: 88, year: 4, overall: 84, height: 77, weight: 250, espn: 4361372, photo: true, line: '23 REC, 284 YDS, 3 TD' },
      { name: 'Gee Scott Jr.', jersey: 88, year: 2, overall: 69, height: 75, weight: 238, espn: 4429115, photo: true, line: '5 REC, 42 YDS' },
      { name: 'Joe Royer', jersey: 11, year: 2, overall: 58, height: 77, weight: 250, espn: 4565859, photo: true, line: '1 REC, 9 YDS' },
      { name: 'Cade Stover', jersey: 8, year: 3, overall: 51, height: 76, weight: 251, espn: 4426496, photo: true, line: '5 REC, 76 YDS' },
      { name: 'Mitch Rossi', jersey: 34, year: 3, overall: 50, height: 73, weight: 250, espn: 4257374, photo: true, line: '3 REC, 6 YDS, 1 TD' }
    ]
  }
};
