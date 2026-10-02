/* ==========================================================================
   EGE Football — the rosters
   Written by tools/build-rosters.js from ESPN; run that again rather than
   editing this by hand (though a hand edit is fine until the next run).

   The skill players on each of the six's college teams, by season and by
   the team's key in EGE.teams: every quarterback, back, receiver and tight
   end, best first.
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
      { name: 'Mac Jones', jersey: 10, year: 4, overall: 82, height: 75, weight: 220, espn: 4241464, photo: true },
      { name: 'Bryce Young', jersey: 9, year: 1, overall: 59, height: 70, weight: 204, espn: 4685720, photo: true }
    ],
    RB: [
      { name: 'Najee Harris', jersey: 22, year: 4, overall: 84, height: 73, weight: 232, espn: 4241457, photo: true },
      { name: 'Brian Robinson Jr.', jersey: 4, year: 4, overall: 66, height: 73, weight: 225, espn: 4241474, photo: true },
      { name: 'Jase McClellan', jersey: 2, year: 1, overall: 61, height: 71, weight: 212, espn: 4429001, photo: true },
      { name: 'Trey Sanders', jersey: 2, year: 2, overall: 61, height: 72, weight: 215, espn: 107494, photo: true, left: true },
      { name: 'Roydell Williams', jersey: 5, year: 1, overall: 58, height: 70, weight: 223, espn: 4685723, photo: true }
    ],
    WR: [
      { name: 'DeVonta Smith', jersey: 6, year: 4, overall: 84, height: 72, weight: 170, espn: 4241478, photo: true },
      { name: 'John Metchie III', jersey: 8, year: 2, overall: 70, height: 71, weight: 187, espn: 4567096, photo: true },
      { name: 'Jaylen Waddle', jersey: 17, year: 3, overall: 69, height: 70, weight: 185, espn: 4372016, photo: true },
      { name: 'Slade Bolden', jersey: 18, year: 3, overall: 59, height: 71, weight: 189, espn: 4360115, photo: true },
      { name: 'Xavier Williams', jersey: 3, year: 3, overall: 58, height: 72, weight: 180, espn: 4372015, photo: true, left: true },
      { name: 'Thaiu Jones-Bell', jersey: 14, year: 1, overall: 56, height: 72, weight: 198, espn: 4430823, photo: true },
      { name: 'Javon Baker', jersey: 1, year: 1, overall: 55, height: 73, weight: 202, espn: 4692022, photo: true, left: true }
    ],
    TE: [
      { name: 'Jahleel Billingsley', jersey: 9, year: 2, overall: 64, height: 76, weight: 219, espn: 4567105, photo: true, left: true },
      { name: 'Miller Forristall', jersey: 87, year: 5, overall: 64, height: 77, weight: 243, espn: 4040714, photo: true },
      { name: 'Major Tennison', jersey: 88, year: 4, overall: 58, height: 77, weight: 252, espn: 4241480, photo: true },
      { name: 'Carl Tucker', jersey: 86, year: 5, overall: 56, height: 74, weight: 250, espn: 3895833, photo: true }
    ]
  },
  usc: {
    QB: [
      { name: 'Kedon Slovis', jersey: 10, year: 2, overall: 69, height: 74, weight: 223, espn: 4428512, photo: true, left: true },
      { name: 'Matt Fink', jersey: 19, year: 5, overall: 59, height: 75, weight: 210, espn: 4035691, photo: true }
    ],
    RB: [
      { name: 'Stephen Carr', jersey: 5, year: 4, overall: 67, height: 73, weight: 215, espn: 4259633, photo: true, left: true },
      { name: 'Vavae Malepeai', jersey: 6, year: 5, overall: 65, height: 72, weight: 220, espn: 4035695, photo: true },
      { name: 'Kenan Christon II', jersey: 8, year: 2, overall: 61, height: 70, weight: 202, espn: 4426910, photo: true, left: true },
      { name: 'Markese Stepp', jersey: 30, year: 3, overall: 60, height: 73, weight: 225, espn: 4374306, photo: true, left: true },
      { name: 'Quincy Jountti', jersey: 27, year: 5, overall: 54, height: 71, weight: 210, espn: 4028215, photo: true }
    ],
    WR: [
      { name: 'Amon-Ra St. Brown', jersey: 8, year: 3, overall: 72, height: 72, weight: 202, espn: 4374302, photo: true },
      { name: 'Tyler Vaughns', jersey: 21, year: 5, overall: 72, height: 74, weight: 184, espn: 4035692, photo: true },
      { name: 'Drake London', jersey: 15, year: 2, overall: 63, height: 76, weight: 215, espn: 4426502, photo: true },
      { name: 'Bru McCoy', jersey: 5, year: 2, overall: 63, height: 75, weight: 230, espn: 4426337, photo: true, left: true },
      { name: 'Gary Bryant Jr.', jersey: 2, year: 1, overall: 58, height: 71, weight: 191, espn: 4429125, photo: true, left: true },
      { name: 'John Jackson', jersey: 14, year: 3, overall: 55, height: 72, weight: 213, espn: 4569510, photo: true, left: true }
    ],
    TE: [
      { name: 'Josh Falo', jersey: 83, year: 4, overall: 59, height: 78, weight: 255, espn: 4259648, photo: true },
      { name: 'Erik Krommenhoek', jersey: 84, year: 4, overall: 58, height: 77, weight: 245, espn: 4259649, photo: true },
      { name: 'Jude Wolfe', jersey: 18, year: 2, overall: 56, height: 78, weight: 247, espn: 4428921, photo: true }
    ]
  },
  northDakotaState: {
    QB: [
      { name: 'Trey Lance', jersey: 5, year: 3, overall: 66, height: 76, weight: 226, espn: 4383351 },
      { name: 'Zeb Noland', jersey: 8, year: 5, overall: 55, height: 74, weight: 232, espn: 4035525, photo: true, left: true },
      { name: 'Cam Miller', jersey: 7, year: 1, overall: 52, height: 73, weight: 211, espn: 4693331, photo: true }
    ],
    RB: [
      { name: 'Adam Cofield', jersey: 7, year: 5, overall: 62, height: 71, weight: 215, espn: 4040935, photo: true, left: true },
      { name: 'Kobe Johnson', jersey: 0, year: 2, overall: 57, height: 69, weight: 190, espn: 4572525, photo: true, left: true },
      { name: 'Seth Wilson', jersey: null, year: 4, overall: 53, height: 70, weight: 200, espn: 4248540 },
      { name: 'Hunter Luepke', jersey: 44, year: 2, overall: 52, height: 73, weight: 250, espn: 4383396, photo: true },
      { name: 'Jalen Bussey', jersey: 21, year: 2, overall: 52, height: 65, weight: 160, espn: 4572524 },
      { name: 'Dominic Gonnella', jersey: 34, year: 1, overall: 50, height: 71, weight: 211, espn: 4693322, left: true },
      { name: 'Hunter Brozio', jersey: 49, year: 1, overall: 50, height: 73, weight: 233, espn: 4572540, photo: true },
      { name: 'TK Marshall', jersey: 28, year: 1, overall: 50, height: 72, weight: 208, espn: 4693330, photo: true }
    ],
    WR: [
      { name: 'Christian Watson', jersey: 1, year: 4, overall: 60, height: 76, weight: 215, espn: 4248528 },
      { name: 'Zach Mathis', jersey: 0, year: 3, overall: 52, height: 79, weight: 203, espn: 4383364 },
      { name: 'Braylon Henderson', jersey: 1, year: 2, overall: 51, height: 69, weight: 175, espn: 4427446, photo: true },
      { name: 'Cole Jacob', jersey: 89, year: 2, overall: 51, height: 73, weight: 203, espn: 4040929 },
      { name: 'Jake Lippe', jersey: 19, year: 1, overall: 50, height: 74, weight: 201, espn: 4572530 },
      { name: 'RaJa Nelson', jersey: 3, year: 1, overall: 50, height: 69, weight: 196, espn: 4693333, photo: true }
    ],
    TE: [
      { name: 'Josh Babicz', jersey: 81, year: 4, overall: 57, height: 78, weight: 255, espn: 4248555 },
      { name: 'Noah Gindorff', jersey: null, year: 4, overall: 57, height: 78, weight: 268, espn: 4248546, photo: true }
    ]
  },
  illinois: {
    QB: [
      { name: 'Brandon Peters', jersey: 18, year: 5, overall: 69, height: 76, weight: 228, espn: 4036262, photo: true },
      { name: 'Matt Robinson', jersey: 6, year: 3, overall: 54, height: 73, weight: 185, espn: 4371942, photo: true }
    ],
    RB: [
      { name: 'Chase Brown', jersey: 2, year: 3, overall: 62, height: 70, weight: 210, espn: 4362238, photo: true },
      { name: 'Mike Epstein', jersey: 26, year: 4, overall: 61, height: 72, weight: 205, espn: 4240543, photo: true },
      { name: 'Reggie Love III', jersey: 23, year: 1, overall: 54, height: 71, weight: 215, espn: 4696690, photo: true },
      { name: 'Kyron Cumby', jersey: 24, year: 2, overall: 54, height: 68, weight: 180, espn: 4427003, photo: true, left: true },
      { name: 'Jakari Norwood', jersey: 29, year: 3, overall: 53, height: 70, weight: 195, espn: 4360370, photo: true, left: true },
      { name: 'Nick Fedanzo', jersey: 24, year: 2, overall: 52, height: 72, weight: 220, espn: 4427172, photo: true },
      { name: 'Conner Lillig', jersey: 23, year: 2, overall: 51, height: 70, weight: 190, espn: 4260370, photo: true }
    ],
    WR: [
      { name: 'Josh Imatorbhebhe', jersey: 9, year: 5, overall: 68, height: 74, weight: 220, espn: 4035689, photo: true },
      { name: 'Brian Hightower', jersey: 7, year: 3, overall: 61, height: 75, weight: 215, espn: 4362501, photo: true, left: true },
      { name: 'Donny Navarro III', jersey: 80, year: 4, overall: 56, height: 71, weight: 185, espn: 4249535, photo: true, left: true },
      { name: 'Casey Washington', jersey: 14, year: 2, overall: 54, height: 72, weight: 200, espn: 4428796, photo: true },
      { name: 'Dalevon Campbell', jersey: 15, year: 2, overall: 54, height: 76, weight: 220, espn: 4569372, photo: true, left: true },
      { name: 'Carlos Sandy', jersey: 11, year: 3, overall: 54, height: 69, weight: 185, espn: 4360373, photo: true, left: true },
      { name: 'James Frenchie Jr.', jersey: 13, year: 1, overall: 54, height: 70, weight: 175, espn: 4429116, photo: true },
      { name: 'Khmari Thompson', jersey: 8, year: 3, overall: 54, height: 73, weight: 207, espn: 4362752, photo: true },
      { name: 'Deuce Spann', jersey: 22, year: 1, overall: 53, height: 76, weight: 210, espn: 4696686, photo: true, left: true },
      { name: 'Ty Lindenman', jersey: 15, year: 1, overall: 50, height: 66, weight: 165, espn: 4696687, photo: true }
    ],
    TE: [
      { name: 'Daniel Barker', jersey: 9, year: 3, overall: 61, height: 76, weight: 250, espn: 4360400, photo: true, left: true },
      { name: 'Luke Ford', jersey: 82, year: 3, overall: 60, height: 78, weight: 265, espn: 4379402, photo: true },
      { name: 'Daniel Imatorbhebhe', jersey: 0, year: 5, overall: 58, height: 76, weight: 240, espn: 3682406, photo: true, left: true },
      { name: 'Michael Marchese', jersey: 42, year: 4, overall: 53, height: 76, weight: 235, espn: 4240546, photo: true },
      { name: 'Griffin Moore', jersey: 13, year: 2, overall: 52, height: 76, weight: 250, espn: 4430190, photo: true },
      { name: 'Tip Reiman', jersey: 89, year: 1, overall: 50, height: 77, weight: 271, espn: 4696700, photo: true }
    ]
  },
  ohioState: {
    QB: [
      { name: 'Justin Fields', jersey: 1, year: 3, overall: 78, height: 75, weight: 227, espn: 4362887, photo: true },
      { name: 'C.J. Stroud', jersey: 7, year: 1, overall: 58, height: 75, weight: 218, espn: 4432577, photo: true },
      { name: 'Gunnar Hoak', jersey: 12, year: 5, overall: 56, height: 76, weight: 215, espn: 4035051, photo: true },
      { name: 'Jack Miller III', jersey: 10, year: 1, overall: 54, height: 75, weight: 210, espn: 4685091, photo: true }
    ],
    RB: [
      { name: 'Trey Sermon', jersey: 8, year: 4, overall: 71, height: 72, weight: 215, espn: 4241401, photo: true },
      { name: 'Master Teague', jersey: 33, year: 3, overall: 66, height: 71, weight: 220, espn: 4361354, photo: true },
      { name: 'Marcus Crowley', jersey: 24, year: 2, overall: 58, height: 73, weight: 213, espn: 4429481, photo: true },
      { name: 'Miyan Williams', jersey: 3, year: 1, overall: 54, height: 69, weight: 226, espn: 4432637, photo: true }
    ],
    WR: [
      { name: 'Garrett Wilson', jersey: 5, year: 2, overall: 72, height: 72, weight: 183, espn: 4569618, photo: true },
      { name: 'Chris Olave', jersey: 2, year: 3, overall: 68, height: 72, weight: 187, espn: 4361370, photo: true },
      { name: 'Jameson Williams', jersey: 1, year: 2, overall: 60, height: 73, weight: 184, espn: 4426388, photo: true, left: true },
      { name: 'Julian Fleming', jersey: 3, year: 1, overall: 59, height: 74, weight: 206, espn: 4430800, photo: true },
      { name: 'Jaxon Smith-Njigba', jersey: 11, year: 1, overall: 59, height: 72, weight: 197, espn: 4430878, photo: true },
      { name: 'Kamryn Babb', jersey: 0, year: 3, overall: 59, height: 72, weight: 210, espn: 4361347, photo: true },
      { name: 'Jaylen Harris', jersey: 15, year: 4, overall: 58, height: 77, weight: 215, espn: 4241991, photo: true },
      { name: 'Xavier Johnson', jersey: 0, year: 3, overall: 54, height: 73, weight: 210, espn: 4385430, photo: true },
      { name: 'Chris Booker', jersey: 86, year: 1, overall: 50, height: 75, weight: 192, espn: 4029426, photo: true }
    ],
    TE: [
      { name: 'Jeremy Ruckert', jersey: 88, year: 3, overall: 66, height: 77, weight: 250, espn: 4361372, photo: true },
      { name: 'Luke Farrell', jersey: 89, year: 5, overall: 62, height: 77, weight: 250, espn: 4040612, photo: true },
      { name: 'Jake Hausmann', jersey: 81, year: 5, overall: 60, height: 76, weight: 245, espn: 4040617, photo: true },
      { name: 'Cade Stover', jersey: 8, year: 2, overall: 51, height: 76, weight: 251, espn: 4426496, photo: true }
    ]
  }
};

EGE.rosters[2021] = {
  alabama: {
    QB: [
      { name: 'Bryce Young', jersey: 9, year: 2, overall: 84, height: 70, weight: 204, espn: 4685720, photo: true },
      { name: 'Jalen Milroe', jersey: 4, year: 1, overall: 58, height: 74, weight: 216, espn: 4432734, photo: true },
      { name: 'Paul Tyson', jersey: 15, year: 3, overall: 57, height: 76, weight: 215, espn: 4567102, photo: true, left: true },
      { name: 'Braxton Barker', jersey: 7, year: 4, overall: 53, height: 73, weight: 202, espn: 4372013, photo: true }
    ],
    RB: [
      { name: 'Brian Robinson Jr.', jersey: 4, year: 5, overall: 80, height: 73, weight: 225, espn: 4241474, photo: true },
      { name: 'Trey Sanders', jersey: 2, year: 3, overall: 64, height: 72, weight: 215, espn: 107494, photo: true, left: true },
      { name: 'Roydell Williams', jersey: 5, year: 2, overall: 63, height: 70, weight: 223, espn: 4685723, photo: true, left: true },
      { name: 'Jase McClellan', jersey: 2, year: 2, overall: 63, height: 71, weight: 212, espn: 4429001, photo: true }
    ],
    WR: [
      { name: 'Jameson Williams', jersey: 1, year: 3, overall: 83, height: 73, weight: 184, espn: 4426388, photo: true },
      { name: 'John Metchie III', jersey: 8, year: 3, overall: 75, height: 71, weight: 187, espn: 4567096, photo: true },
      { name: 'Slade Bolden', jersey: 18, year: 4, overall: 61, height: 71, weight: 189, espn: 4360115, photo: true },
      { name: 'JoJo Earle', jersey: 11, year: 1, overall: 60, height: 70, weight: 185, espn: 4432694, photo: true, left: true },
      { name: 'Traeshon Holden', jersey: 1, year: 2, overall: 59, height: 74, weight: 208, espn: 4429172, photo: true, left: true },
      { name: 'Ja\'Corey Brooks', jersey: 1, year: 1, overall: 59, height: 75, weight: 195, espn: 4431506, photo: true, left: true },
      { name: 'Javon Baker', jersey: 1, year: 2, overall: 58, height: 73, weight: 202, espn: 4692022, photo: true, left: true },
      { name: 'Agiye Hall', jersey: null, year: 1, overall: 58, height: 75, weight: 194, espn: 4567774, photo: true, left: true },
      { name: 'Christian Leary', jersey: 1, year: 1, overall: 58, height: 70, weight: 180, espn: 4587702, photo: true, left: true },
      { name: 'Thaiu Jones-Bell', jersey: 14, year: 2, overall: 57, height: 72, weight: 198, espn: 4430823, photo: true },
      { name: 'Jacoby Boykins', jersey: 84, year: 1, overall: 50, height: 73, weight: 195, espn: 4880047, photo: true, left: true }
    ],
    TE: [
      { name: 'Jahleel Billingsley', jersey: 9, year: 3, overall: 64, height: 76, weight: 219, espn: 4567105, photo: true, left: true },
      { name: 'Cameron Latu', jersey: 81, year: 4, overall: 63, height: 77, weight: 244, espn: 4372026, photo: true },
      { name: 'Robbie Ouzts', jersey: 45, year: 1, overall: 53, height: 75, weight: 274, espn: 4691688, photo: true }
    ]
  },
  usc: {
    QB: [
      { name: 'Kedon Slovis', jersey: 10, year: 3, overall: 67, height: 74, weight: 223, espn: 4428512, photo: true, left: true },
      { name: 'Jaxson Dart', jersey: 2, year: 1, overall: 65, height: 74, weight: 223, espn: 4689114, photo: true, left: true },
      { name: 'Miller Moss', jersey: 7, year: 1, overall: 57, height: 73, weight: 211, espn: 4431580, photo: true }
    ],
    RB: [
      { name: 'Keaontay Ingram', jersey: 28, year: 4, overall: 73, height: 72, weight: 220, espn: 4362087, photo: true },
      { name: 'Vavae Malepeai', jersey: 6, year: 5, overall: 67, height: 72, weight: 220, espn: 4035695, photo: true },
      { name: 'Darwin Barlow', jersey: 24, year: 3, overall: 60, height: 72, weight: 220, espn: 4426635, photo: true, left: true },
      { name: 'Kenan Christon II', jersey: 8, year: 3, overall: 56, height: 70, weight: 202, espn: 4426910, photo: true, left: true },
      { name: 'Brandon Campbell', jersey: 23, year: 1, overall: 55, height: 70, weight: 210, espn: 4433965, photo: true, left: true },
      { name: 'Quincy Jountti', jersey: 27, year: 5, overall: 53, height: 71, weight: 210, espn: 4028215, photo: true }
    ],
    WR: [
      { name: 'Drake London', jersey: 15, year: 3, overall: 74, height: 76, weight: 215, espn: 4426502, photo: true },
      { name: 'Gary Bryant Jr.', jersey: 2, year: 2, overall: 69, height: 71, weight: 191, espn: 4429125, photo: true, left: true },
      { name: 'Kyle Ford', jersey: 81, year: 3, overall: 64, height: 73, weight: 225, espn: 4426357, photo: true, left: true },
      { name: 'Tahj Washington', jersey: 16, year: 3, overall: 62, height: 70, weight: 174, espn: 4567506, photo: true },
      { name: 'K.D. Nixon', jersey: 21, year: 5, overall: 58, height: 68, weight: 190, espn: 4243168, photo: true },
      { name: 'Michael Jackson III', jersey: 2, year: 1, overall: 56, height: 72, weight: 205, espn: 4592573, photo: true, left: true },
      { name: 'John Jackson', jersey: 14, year: 4, overall: 56, height: 72, weight: 213, espn: 4569510, photo: true, left: true },
      { name: 'Kyron Hudson', jersey: 11, year: 1, overall: 56, height: 73, weight: 212, espn: 4432784, photo: true },
      { name: 'Joseph Manjack IV', jersey: 14, year: 1, overall: 54, height: 75, weight: 210, espn: 4683227, photo: true, left: true }
    ],
    TE: [
      { name: 'Malcolm Epps', jersey: 7, year: 4, overall: 62, height: 78, weight: 255, espn: 4362110, photo: true, left: true },
      { name: 'Erik Krommenhoek', jersey: 84, year: 5, overall: 60, height: 77, weight: 245, espn: 4259649, photo: true },
      { name: 'Michael Trigg', jersey: 1, year: 1, overall: 59, height: 76, weight: 240, espn: 4594749, photo: true, left: true },
      { name: 'Jude Wolfe', jersey: 18, year: 3, overall: 58, height: 78, weight: 247, espn: 4428921, photo: true, left: true },
      { name: 'Lake McRee', jersey: 87, year: 1, overall: 56, height: 76, weight: 243, espn: 4566198, photo: true },
      { name: 'Grant Jones', jersey: 46, year: 1, overall: 50, height: 74, weight: 220, espn: 4400898, photo: true }
    ]
  },
  northDakotaState: {
    QB: [
      { name: 'Quincy Patterson', jersey: 16, year: 4, overall: 63, height: 75, weight: 235, espn: 4361959, photo: true, left: true },
      { name: 'Cam Miller', jersey: 7, year: 2, overall: 60, height: 73, weight: 211, espn: 4693331, photo: true },
      { name: 'Cole Payton', jersey: 9, year: 1, overall: 51, height: 74, weight: 232, espn: 4879250, photo: true }
    ],
    RB: [
      { name: 'TaMerik Williams', jersey: 22, year: 4, overall: 64, height: 72, weight: 227, espn: 4360564, photo: true },
      { name: 'Kobe Johnson', jersey: 0, year: 3, overall: 59, height: 69, weight: 190, espn: 4572525, photo: true, left: true },
      { name: 'Jalen Bussey', jersey: 21, year: 3, overall: 57, height: 65, weight: 160, espn: 4572524 },
      { name: 'Hunter Luepke', jersey: 44, year: 3, overall: 57, height: 73, weight: 250, espn: 4383396, photo: true },
      { name: 'Dominic Gonnella', jersey: 34, year: 2, overall: 55, height: 71, weight: 211, espn: 4693322, left: true },
      { name: 'TK Marshall', jersey: 28, year: 2, overall: 53, height: 72, weight: 208, espn: 4693330, photo: true },
      { name: 'Mitchell Kartes', jersey: 8, year: 3, overall: 52, height: 72, weight: 202, espn: 4383400 },
      { name: 'Nathan Goldade', jersey: 26, year: 1, overall: 50, height: 71, weight: 193, espn: 4693321 },
      { name: 'Logan Hofstedt', jersey: 33, year: 1, overall: 50, height: 73, weight: 238, espn: 4572529, photo: true }
    ],
    WR: [
      { name: 'Christian Watson', jersey: 1, year: 5, overall: 65, height: 76, weight: 215, espn: 4248528 },
      { name: 'Phoenix Sproles', jersey: 0, year: 4, overall: 56, height: 71, weight: 194, espn: 4383359, photo: true, left: true },
      { name: 'Braylon Henderson', jersey: 1, year: 3, overall: 54, height: 69, weight: 175, espn: 4427446, photo: true },
      { name: 'Zach Mathis', jersey: 0, year: 4, overall: 54, height: 79, weight: 203, espn: 4383364 },
      { name: 'RaJa Nelson', jersey: 3, year: 2, overall: 52, height: 69, weight: 196, espn: 4693333, photo: true },
      { name: 'Jake Lippe', jersey: 19, year: 2, overall: 51, height: 74, weight: 201, espn: 4572530 },
      { name: 'DJ Hart', jersey: 9, year: 3, overall: 51, height: 71, weight: 191, espn: 4693324 },
      { name: 'Giancarlo Volpentesta', jersey: 83, year: 1, overall: 50, height: 72, weight: 214, espn: 4572517 },
      { name: 'Tyler Terhark', jersey: 6, year: 1, overall: 50, height: 74, weight: 209, espn: 4693342, photo: true }
    ],
    TE: [
      { name: 'Noah Gindorff', jersey: null, year: 5, overall: 59, height: 78, weight: 268, espn: 4248546, photo: true },
      { name: 'Josh Babicz', jersey: 81, year: 5, overall: 58, height: 78, weight: 255, espn: 4248555 },
      { name: 'Joe Stoffel', jersey: 82, year: 2, overall: 52, height: 76, weight: 245, espn: 4693341, photo: true }
    ]
  },
  illinois: {
    QB: [
      { name: 'Brandon Peters', jersey: 18, year: 5, overall: 67, height: 76, weight: 228, espn: 4036262, photo: true },
      { name: 'Artur Sitkowski', jersey: 9, year: 4, overall: 61, height: 77, weight: 225, espn: 4361530, photo: true }
    ],
    RB: [
      { name: 'Chase Brown', jersey: 2, year: 4, overall: 70, height: 70, weight: 210, espn: 4362238, photo: true },
      { name: 'Josh McCray', jersey: 2, year: 1, overall: 60, height: 73, weight: 235, espn: 4682640, photo: true },
      { name: 'Mike Epstein', jersey: 26, year: 5, overall: 60, height: 72, weight: 205, espn: 4240543, photo: true },
      { name: 'Chase Hayden', jersey: 22, year: 5, overall: 58, height: 70, weight: 205, espn: 4242158, photo: true },
      { name: 'Reggie Love III', jersey: 23, year: 2, overall: 57, height: 71, weight: 215, espn: 4696690, photo: true, left: true },
      { name: 'Jakari Norwood', jersey: 29, year: 4, overall: 54, height: 70, weight: 195, espn: 4360370, photo: true, left: true }
    ],
    WR: [
      { name: 'Casey Washington', jersey: 14, year: 3, overall: 57, height: 72, weight: 200, espn: 4428796, photo: true },
      { name: 'Jafar Armstrong', jersey: 9, year: 5, overall: 57, height: 73, weight: 220, espn: 4258584, photo: true, left: true },
      { name: 'Donny Navarro III', jersey: 80, year: 5, overall: 56, height: 71, weight: 185, espn: 4249535, photo: true, left: true },
      { name: 'Deuce Spann', jersey: 22, year: 2, overall: 56, height: 76, weight: 210, espn: 4696686, photo: true, left: true },
      { name: 'Dalevon Campbell', jersey: 15, year: 3, overall: 55, height: 76, weight: 220, espn: 4569372, photo: true, left: true },
      { name: 'Carlos Sandy', jersey: 11, year: 4, overall: 55, height: 69, weight: 185, espn: 4360373, photo: true, left: true },
      { name: 'Khmari Thompson', jersey: 8, year: 4, overall: 55, height: 73, weight: 207, espn: 4362752, photo: true },
      { name: 'Pat Bryant', jersey: 13, year: 1, overall: 54, height: 74, weight: 204, espn: 4600981, photo: true }
    ],
    TE: [
      { name: 'Luke Ford', jersey: 82, year: 4, overall: 64, height: 78, weight: 265, espn: 4379402, photo: true },
      { name: 'Daniel Barker', jersey: 9, year: 4, overall: 62, height: 76, weight: 250, espn: 4360400, photo: true, left: true },
      { name: 'Michael Marchese', jersey: 42, year: 5, overall: 54, height: 76, weight: 235, espn: 4240546, photo: true },
      { name: 'Tip Reiman', jersey: 89, year: 2, overall: 52, height: 77, weight: 271, espn: 4696700, photo: true }
    ]
  },
  ohioState: {
    QB: [
      { name: 'C.J. Stroud', jersey: 7, year: 2, overall: 82, height: 75, weight: 218, espn: 4432577, photo: true },
      { name: 'Kyle McCord', jersey: 6, year: 1, overall: 60, height: 75, weight: 218, espn: 4433971, photo: true, left: true },
      { name: 'Jack Miller III', jersey: 10, year: 2, overall: 55, height: 75, weight: 210, espn: 4685091, photo: true }
    ],
    RB: [
      { name: 'TreVeyon Henderson', jersey: 32, year: 1, overall: 81, height: 70, weight: 202, espn: 4432710, photo: true },
      { name: 'Master Teague', jersey: 33, year: 4, overall: 65, height: 71, weight: 220, espn: 4361354, photo: true },
      { name: 'Miyan Williams', jersey: 3, year: 2, overall: 62, height: 69, weight: 226, espn: 4432637, photo: true },
      { name: 'Evan Pryor', jersey: 21, year: 1, overall: 59, height: 70, weight: 189, espn: 4432757, photo: true, left: true },
      { name: 'Marcus Crowley', jersey: 24, year: 3, overall: 57, height: 73, weight: 213, espn: 4429481, photo: true },
      { name: 'Robert Cope', jersey: 43, year: 1, overall: 50, height: 69, weight: 198, espn: 4385427, photo: true }
    ],
    WR: [
      { name: 'Garrett Wilson', jersey: 5, year: 3, overall: 80, height: 72, weight: 183, espn: 4569618, photo: true },
      { name: 'Jaxon Smith-Njigba', jersey: 11, year: 2, overall: 78, height: 72, weight: 197, espn: 4430878, photo: true },
      { name: 'Chris Olave', jersey: 2, year: 4, overall: 73, height: 72, weight: 187, espn: 4361370, photo: true },
      { name: 'Emeka Egbuka', jersey: 2, year: 1, overall: 60, height: 73, weight: 205, espn: 4567750, photo: true },
      { name: 'Julian Fleming', jersey: 3, year: 2, overall: 60, height: 74, weight: 206, espn: 4430800, photo: true, left: true },
      { name: 'Kamryn Babb', jersey: 0, year: 4, overall: 59, height: 72, weight: 210, espn: 4361347, photo: true },
      { name: 'Marvin Harrison Jr.', jersey: 18, year: 1, overall: 58, height: 75, weight: 220, espn: 4432708, photo: true },
      { name: 'Jayden Ballard', jersey: 4, year: 1, overall: 57, height: 74, weight: 205, espn: 4431498, photo: true },
      { name: 'Xavier Johnson', jersey: 0, year: 4, overall: 55, height: 73, weight: 210, espn: 4385430, photo: true },
      { name: 'Sam Wiglusz', jersey: 12, year: 3, overall: 52, height: 72, weight: 187, espn: 4385438, photo: true, left: true },
      { name: 'Chris Booker', jersey: 86, year: 2, overall: 51, height: 75, weight: 192, espn: 4029426, photo: true },
      { name: 'Joop Mitchell', jersey: 83, year: 1, overall: 50, height: 73, weight: 180, espn: 4893906, photo: true }
    ],
    TE: [
      { name: 'Jeremy Ruckert', jersey: 88, year: 4, overall: 69, height: 77, weight: 250, espn: 4361372, photo: true },
      { name: 'Gee Scott Jr.', jersey: 88, year: 2, overall: 59, height: 75, weight: 238, espn: 4429115, photo: true },
      { name: 'Joe Royer', jersey: 11, year: 2, overall: 55, height: 77, weight: 250, espn: 4565859, photo: true, left: true },
      { name: 'Cade Stover', jersey: 8, year: 3, overall: 54, height: 76, weight: 251, espn: 4426496, photo: true },
      { name: 'Mitch Rossi', jersey: 34, year: 3, overall: 52, height: 73, weight: 250, espn: 4257374, photo: true }
    ]
  }
};
