/* ==========================================================================
   EGE Football — the rosters
   Written by tools/build-rosters.js from ESPN; run that again rather than
   editing this by hand (though a hand edit is fine until the next run).

   The skill players on each of the six's teams, by season and by
   the team's key in EGE.teams: every quarterback, back, receiver and tight
   end, best first.
   `year` is his year of college that season (1 a freshman, 5 a
   fifth-year), `overall` his overall on the six's scale (how it is worked
   out is at the top of the tool), `espn` his ESPN id and `photo` whether
   ESPN has his headshot. Jersey numbers are ESPN's; EGE.rosterFor moves
   anybody wearing one of the six's. The six are not listed -- they are
   put into their rooms by EGE.rosterFor in data/games.js.

   2022 was worked out the same way, by the same formula, from the
   cfbfastR copies of ESPN's 2022 rosters and play-by-play, since ESPN
   itself could not be reached when it was written. Where there was no
   2021 line here to read a player's recruiting rating back from (all of
   Texas and North Carolina, the transfers and the freshmen), the
   Composite rating was put in by hand for the players who matter and
   taken as a low three-star for the rest. Bryce Young's 86 is set by
   hand: the only overall above 84.

   2023's college rooms are the same again from cfbfastR's 2023 copies
   (with the Composite put in by hand, as in 2022). MarShawn Lloyd's and
   Devontez Walker's seasons count for less than they really did, since
   Cooper and Paxon have most of their touches here.

   2023's NFL rooms -- Seattle, Detroit and Houston -- come from nflverse's
   2023 rosters and stats. In the NFL `year` is his season in the league
   (1 a rookie), and `espn` points at ESPN's NFL headshots. The overall is
   on the same scale, worked out from where he was drafted, how long he
   has been in the league and his 2023 regular season:

     overall = 50 + 34 x (0.20 x draft + 0.15 x experience + 0.75 x production)

   draft the first pick everything and the last nothing, squared, and
   nothing undrafted; experience a rookie nothing and a sixth-year on all;
   production scrimmage yards plus 20 a touchdown against an MVP-calibre
   season (5000 for a quarterback, 2000 a back, 1800 a receiver, 1300 a
   tight end). The mock draft moved a few of them: Zach Charbonnet is a
   Saint, Jahmyr Gibbs a Cowboy, Sam LaPorta a Packer and C.J. Stroud a
   Colt, and Bijan Robinson is a Lion.
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
      { name: 'Kyle McCord', jersey: 6, year: 1, overall: 60, height: 75, weight: 218, espn: 4433971, photo: true, left: true },
      { name: 'Jack Miller III', jersey: 10, year: 2, overall: 55, height: 75, weight: 210, espn: 4685091, photo: true }
    ],
    RB: [
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

EGE.rosters[2022] = {
  alabama: {
    QB: [
      { name: 'Bryce Young', jersey: 9, year: 3, overall: 86, height: 72, weight: 194, espn: 4685720, photo: true },
      { name: 'Jalen Milroe', jersey: 4, year: 2, overall: 62, height: 74, weight: 225, espn: 4432734, photo: true },
      { name: 'Ty Simpson', jersey: 15, year: 1, overall: 58, height: 74, weight: 208, espn: 4685522, photo: true }
    ],
    RB: [
      { name: 'Jahmyr Gibbs', jersey: 1, year: 3, overall: 76, height: 71, weight: 200, espn: 4429795, photo: true },
      { name: 'Jase McClellan', jersey: 2, year: 3, overall: 71, height: 71, weight: 212, espn: 4429001, photo: true },
      { name: 'Roydell Williams', jersey: 5, year: 3, overall: 64, height: 70, weight: 221, espn: 4685723, photo: true, left: true },
      { name: 'Trey Sanders', jersey: 2, year: 4, overall: 64, height: 72, weight: 215, espn: 107494, photo: true, left: true },
      { name: 'Jam Miller', jersey: 26, year: 1, overall: 54, height: 70, weight: 221, espn: 4685477, photo: true },
      { name: 'Jonathan Bennett', jersey: 27, year: 3, overall: 54, height: 70, weight: 180, espn: 4695287, photo: true, left: true }
    ],
    WR: [
      { name: 'Ja\'Corey Brooks', jersey: 1, year: 2, overall: 69, height: 75, weight: 195, espn: 4431506, photo: true, left: true },
      { name: 'Jermaine Burton', jersey: 3, year: 3, overall: 69, height: 72, weight: 194, espn: 4429033, photo: true },
      { name: 'Traeshon Holden', jersey: 1, year: 3, overall: 63, height: 75, weight: 215, espn: 4429172, photo: true, left: true },
      { name: 'JoJo Earle', jersey: 11, year: 2, overall: 62, height: 70, weight: 185, espn: 4432694, photo: true, left: true },
      { name: 'Christian Leary', jersey: 1, year: 2, overall: 59, height: 70, weight: 180, espn: 4587702, photo: true, left: true },
      { name: 'Thaiu Jones-Bell', jersey: 14, year: 3, overall: 58, height: 72, weight: 198, espn: 4430823, photo: true },
      { name: 'Kobe Prentice', jersey: 16, year: 1, overall: 57, height: 71, weight: 190, espn: 4869965, photo: true, left: true },
      { name: 'Isaiah Bond', jersey: 7, year: 1, overall: 57, height: 71, weight: 180, espn: 4808839, photo: true, left: true },
      { name: 'Tyler Harrell', jersey: 15, year: 5, overall: 56, height: 72, weight: 200, espn: 4360818, photo: true, left: true },
      { name: 'Emmanuel Henderson Jr.', jersey: 2, year: 1, overall: 54, height: 73, weight: 190, espn: 4685381, photo: true, left: true },
      { name: 'Kendrick Law', jersey: 1, year: 1, overall: 53, height: 72, weight: 205, espn: 4685441, photo: true, left: true }
    ],
    TE: [
      { name: 'Cameron Latu', jersey: 81, year: 5, overall: 63, height: 77, weight: 244, espn: 4372026, photo: true },
      { name: 'Robbie Ouzts', jersey: 45, year: 2, overall: 55, height: 76, weight: 270, espn: 4691688, photo: true },
      { name: 'Amari Niblack', jersey: 84, year: 1, overall: 53, height: 75, weight: 235, espn: 4869534, photo: true, left: true },
      { name: 'Miles Kitselman', jersey: 87, year: 1, overall: 52, height: 77, weight: 255, espn: 5089453, photo: true, left: true }
    ]
  },
  usc: {
    QB: [
      { name: 'Caleb Williams', jersey: 13, year: 2, overall: 84, height: 73, weight: 215, espn: 4431611, photo: true },
      { name: 'Miller Moss', jersey: 7, year: 2, overall: 59, height: 74, weight: 210, espn: 4431580, photo: true, left: true }
    ],
    RB: [
      { name: 'Travis Dye', jersey: 26, year: 5, overall: 72, height: 70, weight: 200, espn: 4360691, photo: true },
      { name: 'Austin Jones', jersey: 6, year: 4, overall: 68, height: 70, weight: 200, espn: 4569330, photo: true },
      { name: 'Raleek Brown', jersey: 0, year: 1, overall: 62, height: 69, weight: 193, espn: 4685268, photo: true, left: true },
      { name: 'Darwin Barlow', jersey: 24, year: 4, overall: 60, height: 72, weight: 220, espn: 4426635, photo: true, left: true }
    ],
    WR: [
      { name: 'Jordan Addison', jersey: 3, year: 3, overall: 72, height: 72, weight: 175, espn: 4429205, photo: true },
      { name: 'Gary Bryant Jr.', jersey: 2, year: 3, overall: 68, height: 71, weight: 191, espn: 4429125, photo: true, left: true },
      { name: 'Kyle Ford', jersey: 81, year: 4, overall: 67, height: 73, weight: 225, espn: 4426357, photo: true, left: true },
      { name: 'Tahj Washington', jersey: 16, year: 4, overall: 66, height: 70, weight: 175, espn: 4567506, photo: true },
      { name: 'Mario Williams', jersey: 4, year: 2, overall: 66, height: 69, weight: 178, espn: 4431618, photo: true, left: true },
      { name: 'Brenden Rice', jersey: 2, year: 3, overall: 62, height: 75, weight: 210, espn: 4686781, photo: true },
      { name: 'Michael Jackson III', jersey: 2, year: 2, overall: 60, height: 72, weight: 205, espn: 4592573, photo: true, left: true },
      { name: 'Terrell Bynum', jersey: null, year: 5, overall: 57, height: 73, weight: 190, espn: 4243319, photo: true },
      { name: 'Kyron Hudson', jersey: 10, year: 1, overall: 54, height: 73, weight: 200, espn: 5085025, photo: true },
      { name: 'C.J. Williams', jersey: 3, year: 1, overall: 52, height: 73, weight: 205, espn: 5085024, photo: true, left: true }
    ],
    TE: [
      { name: 'Malcolm Epps', jersey: 7, year: 5, overall: 62, height: 78, weight: 255, espn: 4362110, photo: true, left: true },
      { name: 'Lake McRee', jersey: 87, year: 2, overall: 58, height: 76, weight: 250, espn: 4566198, photo: true },
      { name: 'Josh Falo', jersey: 83, year: 5, overall: 57, height: 78, weight: 255, espn: 4259648, photo: true }
    ]
  },
  northCarolina: {
    QB: [
      { name: 'Drake Maye', jersey: 10, year: 2, overall: 83, height: 76, weight: 230, espn: 4431452, photo: true },
      { name: 'Jacolby Criswell', jersey: 6, year: 3, overall: 57, height: 73, weight: 230, espn: 4429463, photo: true, left: true }
    ],
    RB: [
      { name: 'Elijah Green', jersey: 21, year: 3, overall: 64, height: 71, weight: 210, espn: 4688817, photo: true, left: true },
      { name: 'Omarion Hampton', jersey: 28, year: 1, overall: 64, height: 72, weight: 220, espn: 4685382, photo: true },
      { name: 'Caleb Hood', jersey: 4, year: 2, overall: 59, height: 72, weight: 220, espn: 4595341, photo: true },
      { name: 'DJ Jones', jersey: 26, year: 3, overall: 57, height: 71, weight: 207, espn: 4688818, photo: true, left: true },
      { name: 'George Pettaway', jersey: 6, year: 1, overall: 57, height: 70, weight: 200, espn: 4685494, photo: true, left: true }
    ],
    WR: [
      { name: 'Josh Downs', jersey: 11, year: 3, overall: 71, height: 70, weight: 175, espn: 4688813, photo: true },
      { name: 'Antoine Green', jersey: 3, year: 5, overall: 70, height: 74, weight: 200, espn: 4373266, photo: true },
      { name: 'J.J. Jones', jersey: 5, year: 2, overall: 61, height: 74, weight: 210, espn: 4596596, photo: true },
      { name: 'Kobe Paysour', jersey: 8, year: 2, overall: 58, height: 73, weight: 190, espn: 4431505, photo: true },
      { name: 'Gavin Blackwell', jersey: 6, year: 2, overall: 57, height: 71, weight: 185, espn: 4432664, photo: true, left: true },
      { name: 'Justin Olson', jersey: 4, year: 4, overall: 56, height: 75, weight: 210, espn: 4428167, photo: true, left: true }
    ],
    TE: [
      { name: 'Bryson Nesbit', jersey: 18, year: 2, overall: 67, height: 77, weight: 235, espn: 4602969, photo: true },
      { name: 'Kamari Morales', jersey: 88, year: 4, overall: 66, height: 75, weight: 249, espn: 4428050, photo: true, left: true },
      { name: 'John Copenhaver', jersey: 81, year: 3, overall: 58, height: 75, weight: 240, espn: 4431045, photo: true }
    ]
  },
  texas: {
    QB: [
      { name: 'Hudson Card', jersey: 1, year: 3, overall: 63, height: 75, weight: 210, espn: 4429032, photo: true, left: true }
    ],
    RB: [
      { name: 'Bijan Robinson', jersey: 5, year: 3, overall: 84, height: 72, weight: 220, espn: 4430807, photo: true },
      { name: 'Roschon Johnson', jersey: 2, year: 4, overall: 68, height: 74, weight: 223, espn: 4426386, photo: true },
      { name: 'Keilan Robinson', jersey: 7, year: 4, overall: 62, height: 69, weight: 188, espn: 4567095, photo: true },
      { name: 'Jonathon Brooks', jersey: 24, year: 2, overall: 59, height: 72, weight: 207, espn: 4678008, photo: true },
      { name: 'Jaydon Blue', jersey: 23, year: 1, overall: 56, height: 72, weight: 200, espn: 4685279, photo: true },
      { name: 'Savion Red', jersey: 0, year: 1, overall: 53, height: 70, weight: 233, espn: 4690811, photo: true, left: true }
    ],
    WR: [
      { name: 'Xavier Worthy', jersey: 1, year: 2, overall: 69, height: 73, weight: 172, espn: 4683062, photo: true },
      { name: 'Jordan Whittington', jersey: 13, year: 4, overall: 69, height: 73, weight: 204, espn: 4569382, photo: true },
      { name: 'Agiye Hall', jersey: 15, year: 2, overall: 59, height: 75, weight: 194, espn: 4567774, photo: true },
      { name: 'Tarique Milton', jersey: 16, year: 5, overall: 56, height: 70, weight: 192, espn: 4259197, photo: true },
      { name: 'Troy Omeire', jersey: 5, year: 3, overall: 56, height: 77, weight: 226, espn: 4430827, photo: true, left: true },
      { name: 'Brenen Thompson', jersey: 0, year: 1, overall: 55, height: 69, weight: 170, espn: 4685553, photo: true, left: true },
      { name: 'Casey Cain', jersey: 2, year: 1, overall: 54, height: 75, weight: 200, espn: 4603190, photo: true, left: true },
      { name: 'Gabe Sulser', jersey: 83, year: 4, overall: 54, height: 69, weight: 167, espn: 4364649, photo: true }
    ],
    TE: [
      { name: 'Ja\'Tavion Sanders', jersey: null, year: 2, overall: 75, height: 76, weight: 243, espn: 4431588, photo: true },
      { name: 'Jahleel Billingsley', jersey: 9, year: 4, overall: 58, height: 76, weight: 219, espn: 4567105, photo: true },
      { name: 'Gunnar Helm', jersey: 85, year: 2, overall: 55, height: 77, weight: 250, espn: 4686728, photo: true }
    ]
  },
  ohioState: {
    QB: [
      { name: 'Kyle McCord', jersey: 6, year: 2, overall: 60, height: 75, weight: 220, espn: 4433971, photo: true, left: true },
      { name: 'Devin Brown', jersey: 33, year: 1, overall: 57, height: 75, weight: 215, espn: 4695709, photo: true, left: true }
    ],
    RB: [
      { name: 'Miyan Williams', jersey: 3, year: 3, overall: 69, height: 69, weight: 226, espn: 4432637, photo: true },
      { name: 'Dallan Hayden', jersey: 7, year: 1, overall: 62, height: 71, weight: 208, espn: 4698727, photo: true, left: true },
      { name: 'Chip Trayanum', jersey: 1, year: 3, overall: 55, height: 71, weight: 227, espn: 4430893, photo: true, left: true },
      { name: 'Cayden Saunders', jersey: 26, year: 2, overall: 53, height: 69, weight: 188, espn: 4875585, photo: true },
      { name: 'TC Caffey', jersey: 20, year: 1, overall: 52, height: 70, weight: 215, espn: 5081809, photo: true, left: true }
    ],
    WR: [
      { name: 'Emeka Egbuka', jersey: 2, year: 2, overall: 76, height: 73, weight: 205, espn: 4567750, photo: true },
      { name: 'Marvin Harrison Jr.', jersey: 18, year: 2, overall: 75, height: 76, weight: 205, espn: 4432708, photo: true },
      { name: 'Jaxon Smith-Njigba', jersey: 11, year: 3, overall: 75, height: 73, weight: 200, espn: 4430878, photo: true },
      { name: 'Julian Fleming', jersey: 3, year: 3, overall: 68, height: 74, weight: 206, espn: 4430800, photo: true, left: true },
      { name: 'Jayden Ballard', jersey: 4, year: 2, overall: 60, height: 74, weight: 205, espn: 4431498, photo: true, left: true },
      { name: 'Kamryn Babb', jersey: null, year: 5, overall: 60, height: 72, weight: 210, espn: 4361347, photo: true },
      { name: 'Xavier Johnson', jersey: null, year: 5, overall: 59, height: 73, weight: 210, espn: 4385430, photo: true },
      { name: 'Kaleb Brown', jersey: 8, year: 1, overall: 56, height: 70, weight: 200, espn: 4685283, photo: true, left: true },
      { name: 'Kyion Grayes', jersey: 6, year: 1, overall: 55, height: 72, weight: 190, espn: 4688541, photo: true, left: true },
      { name: 'Reis Stocksdale', jersey: 86, year: 2, overall: 53, height: 70, weight: 185, espn: 4875583, photo: true, left: true }
    ],
    TE: [
      { name: 'Cade Stover', jersey: 8, year: 4, overall: 66, height: 76, weight: 251, espn: 4426496, photo: true },
      { name: 'Gee Scott Jr.', jersey: 88, year: 3, overall: 60, height: 75, weight: 243, espn: 4429115, photo: true },
      { name: 'Joe Royer', jersey: 11, year: 3, overall: 56, height: 77, weight: 250, espn: 4565859, photo: true, left: true },
      { name: 'Mitch Rossi', jersey: 34, year: 4, overall: 54, height: 73, weight: 250, espn: 4257374, photo: true }
    ]
  }
};

EGE.rosters[2023] = {
  detroit: {
    QB: [
      { name: 'Jared Goff', jersey: 16, year: 8, overall: 82, height: 76, weight: 223, espn: 3046779, photo: true },
      { name: 'Teddy Bridgewater', jersey: 10, year: 10, overall: 60, height: 74, weight: 215, espn: 16728, photo: true },
      { name: 'Nate Sudfeld', jersey: 10, year: 8, overall: 56, height: 78, weight: 227, espn: 2979501, photo: true },
      { name: 'Hendon Hooker', jersey: 12, year: 1, overall: 54, height: 75, weight: 218, espn: null, photo: false }
    ],
    RB: [
      { name: 'David Montgomery', jersey: 5, year: 5, overall: 84, height: 71, weight: 222, espn: 4035538, photo: true },
      { name: 'Bijan Robinson', jersey: 7, year: 1, overall: 80, height: 71, weight: 214, espn: null, photo: false },
      { name: 'Craig Reynolds', jersey: 13, year: 5, overall: 57, height: 71, weight: 215, espn: 4421446, photo: true },
      { name: 'Devine Ozigbo', jersey: 33, year: 5, overall: 54, height: 74, weight: 225, espn: 3699935, photo: true },
      { name: 'Jason Cabinda', jersey: 45, year: 6, overall: 54, height: 73, weight: 235, espn: 3116158, photo: true },
      { name: 'Jake Funk', jersey: 37, year: 3, overall: 52, height: 70, weight: 205, espn: 4036224, photo: true },
      { name: 'Bam Knight', jersey: 28, year: 2, overall: 51, height: 70, weight: 210, espn: 4427728, photo: true }
    ],
    WR: [
      { name: 'Amon-Ra St. Brown', jersey: 14, year: 3, overall: 79, height: 72, weight: 195, espn: 4374302, photo: true },
      { name: 'Josh Reynolds', jersey: 8, year: 7, overall: 67, height: 75, weight: 196, espn: 3115306, photo: true },
      { name: 'Kalif Raymond', jersey: 11, year: 8, overall: 63, height: 68, weight: 182, espn: 2973405, photo: true },
      { name: 'Jameson Williams', jersey: 9, year: 2, overall: 63, height: 73, weight: 189, espn: 4426388, photo: true },
      { name: 'Marvin Jones', jersey: 0, year: 12, overall: 56, height: 74, weight: 198, espn: 15072, photo: true },
      { name: 'Donovan Peoples-Jones', jersey: 19, year: 4, overall: 55, height: 74, weight: 208, espn: 4258195, photo: true },
      { name: 'Antoine Green', jersey: 80, year: 1, overall: 50, height: 74, weight: 200, espn: null, photo: false }
    ],
    TE: [
      { name: 'Zach Ertz', jersey: 86, year: 11, overall: 84, height: 77, weight: 250, espn: 15835, photo: true },
      { name: 'Anthony Firkser', jersey: 86, year: 7, overall: 55, height: 74, weight: 246, espn: 3049698, photo: true },
      { name: 'Brock Wright', jersey: 89, year: 3, overall: 54, height: 77, weight: 255, espn: 4242392, photo: true },
      { name: 'James Mitchell', jersey: 82, year: 2, overall: 52, height: 76, weight: 255, espn: 4361988, photo: true },
      { name: 'Shane Zylstra', jersey: 84, year: 3, overall: 52, height: 76, weight: 215, espn: 4608362, photo: true }
    ]
  },
  usc: {
    QB: [
      { name: 'Caleb Williams', jersey: 13, year: 3, overall: 83, height: 73, weight: 215, espn: 4431611, photo: true },
      { name: 'Miller Moss', jersey: 7, year: 4, overall: 61, height: 74, weight: 210, espn: 4431580, photo: true },
      { name: 'Jake Jensen', jersey: 16, year: 4, overall: 55, height: 73, weight: 212, espn: 4875428, photo: true }
    ],
    RB: [
      { name: 'Austin Jones', jersey: 6, year: 4, overall: 66, height: 70, weight: 200, espn: 4569330, photo: true },
      { name: 'MarShawn Lloyd', jersey: null, year: 3, overall: 65, height: 69, weight: 210, espn: 4429023, photo: true },
      { name: 'Quinten Joyner', jersey: 0, year: 3, overall: 59, height: 71, weight: 220, espn: 4917949, photo: true },
      { name: 'Darwin Barlow', jersey: 24, year: 4, overall: 56, height: 72, weight: 220, espn: 4426635, photo: true },
      { name: 'Raleek Brown', jersey: 0, year: 4, overall: 55, height: 69, weight: 193, espn: 4685268, photo: true },
      { name: 'Matt Colombo', jersey: 5, year: 4, overall: 55, height: 71, weight: 205, espn: 4697524, photo: true },
      { name: 'A\'Marion Peterson', jersey: 28, year: 3, overall: 54, height: 72, weight: 215, espn: 4918111, photo: true }
    ],
    WR: [
      { name: 'Tahj Washington', jersey: 16, year: 4, overall: 72, height: 70, weight: 175, espn: 4567506, photo: true },
      { name: 'Brenden Rice', jersey: 2, year: 4, overall: 68, height: 75, weight: 210, espn: 4686781, photo: true },
      { name: 'Zachariah Branch', jersey: 1, year: 3, overall: 66, height: 70, weight: 180, espn: 4870612, photo: true },
      { name: 'Duce Robinson', jersey: 0, year: 4, overall: 66, height: 78, weight: 230, espn: 4870922, photo: true },
      { name: 'Mario Williams', jersey: 4, year: 3, overall: 64, height: 69, weight: 178, espn: 4431618, photo: true },
      { name: 'Kyron Hudson', jersey: 11, year: 4, overall: 60, height: 73, weight: 215, espn: 4432784, photo: true },
      { name: 'Dorian Singer', jersey: 3, year: 4, overall: 59, height: 72, weight: 177, espn: 4711055, photo: true },
      { name: 'Ja\'Kobi Lane', jersey: 8, year: 3, overall: 59, height: 76, weight: 200, espn: 4870847, photo: true },
      { name: 'Michael Jackson III', jersey: 2, year: 4, overall: 57, height: 72, weight: 205, espn: 4592573, photo: true },
      { name: 'Makai Lemon', jersey: 6, year: 3, overall: 55, height: 71, weight: 195, espn: 4870795, photo: true },
      { name: 'Josiah Zamora', jersey: 44, year: 4, overall: 55, height: 68, weight: 185, espn: 4875308, photo: true }
    ],
    TE: [
      { name: 'Lake McRee', jersey: 87, year: 4, overall: 65, height: 76, weight: 250, espn: 4566198, photo: true },
      { name: 'Carson Tabaracci', jersey: 24, year: 4, overall: 55, height: 73, weight: 230, espn: 4905248, photo: true },
      { name: 'Jude Wolfe', jersey: 18, year: 4, overall: 55, height: 78, weight: 247, espn: 4428921, photo: true }
    ]
  },
  northCarolina: {
    QB: [
      { name: 'Drake Maye', jersey: 10, year: 2, overall: 80, height: 76, weight: 230, espn: 4431452, photo: true },
      { name: 'Conner Harrell', jersey: 15, year: 4, overall: 58, height: 74, weight: 210, espn: 4801306, photo: true },
      { name: 'Jefferson Boaz', jersey: 14, year: 3, overall: 54, height: 79, weight: 235, espn: 4430950, photo: true }
    ],
    RB: [
      { name: 'Omarion Hampton', jersey: 28, year: 3, overall: 84, height: 72, weight: 220, espn: 4685382, photo: true },
      { name: 'British Brooks', jersey: 24, year: 4, overall: 61, height: 71, weight: 225, espn: 4373273, photo: true },
      { name: 'Caleb Hood', jersey: 4, year: 4, overall: 56, height: 72, weight: 220, espn: 4595341, photo: true },
      { name: 'Elijah Green', jersey: 21, year: 4, overall: 55, height: 71, weight: 210, espn: 4688817, photo: true },
      { name: 'George Pettaway', jersey: 6, year: 4, overall: 55, height: 70, weight: 200, espn: 4685494, photo: true },
      { name: 'Kellan Hood', jersey: 25, year: 1, overall: 52, height: 71, weight: 190, espn: 5081409, photo: true },
      { name: 'Jordan Louie', jersey: 34, year: 1, overall: 52, height: 70, weight: 215, espn: 5076125, photo: true }
    ],
    WR: [
      { name: 'J.J. Jones', jersey: 5, year: 4, overall: 66, height: 74, weight: 210, espn: 4596596, photo: true },
      { name: 'Nate McCollum', jersey: 6, year: 4, overall: 62, height: 69, weight: 185, espn: 4432387, photo: true },
      { name: 'Kobe Paysour', jersey: 8, year: 4, overall: 61, height: 73, weight: 190, espn: 4431505, photo: true },
      { name: 'Devontez Walker', jersey: 9, year: 3, overall: 60, height: 75, weight: 200, espn: 4696882, photo: true },
      { name: 'Gavin Blackwell', jersey: 6, year: 4, overall: 59, height: 71, weight: 185, espn: 4432664, photo: true },
      { name: 'Tychaun Chapman', jersey: 1, year: 4, overall: 57, height: 69, weight: 178, espn: 4685290, photo: true },
      { name: 'Andre Greene Jr.', jersey: 18, year: 4, overall: 55, height: 74, weight: 205, espn: 4685364, photo: true },
      { name: 'Christian Hamilton', jersey: 9, year: 3, overall: 54, height: 71, weight: 186, espn: 4870739, photo: true },
      { name: 'Chris Culliver', jersey: 3, year: 3, overall: 54, height: 73, weight: 195, espn: 4899472, photo: true }
    ],
    TE: [
      { name: 'Bryson Nesbit', jersey: 18, year: 4, overall: 71, height: 77, weight: 235, espn: 4602969, photo: true },
      { name: 'John Copenhaver', jersey: 81, year: 4, overall: 63, height: 75, weight: 240, espn: 4431045, photo: true },
      { name: 'Kamari Morales', jersey: 88, year: 4, overall: 59, height: 75, weight: 249, espn: 4428050, photo: true },
      { name: 'Deems May', jersey: 88, year: 4, overall: 55, height: 74, weight: 230, espn: 5081426, photo: true }
    ]
  },
  texas: {
    QB: [
      { name: 'Maalik Murphy', jersey: 6, year: 4, overall: 60, height: 77, weight: 238, espn: 4685497, photo: true },
      { name: 'Arch Manning', jersey: 16, year: 3, overall: 60, height: 76, weight: 222, espn: 4870906, photo: true }
    ],
    RB: [
      { name: 'Jonathon Brooks', jersey: 24, year: 2, overall: 75, height: 72, weight: 207, espn: 4678008, photo: true },
      { name: 'CJ Baxter', jersey: 1, year: 3, overall: 70, height: 73, weight: 230, espn: 4870609, photo: true },
      { name: 'Jaydon Blue', jersey: 23, year: 3, overall: 63, height: 72, weight: 200, espn: 4685279, photo: true },
      { name: 'Keilan Robinson', jersey: 7, year: 4, overall: 60, height: 69, weight: 188, espn: 4567095, photo: true },
      { name: 'Savion Red', jersey: 0, year: 4, overall: 57, height: 70, weight: 233, espn: 4690811, photo: true },
      { name: 'Quintrevion Wisner', jersey: 5, year: 4, overall: 56, height: 72, weight: 203, espn: 4871076, photo: true }
    ],
    WR: [
      { name: 'Xavier Worthy', jersey: 1, year: 3, overall: 74, height: 73, weight: 172, espn: 4683062, photo: true },
      { name: 'Adonai Mitchell', jersey: 5, year: 3, overall: 68, height: 76, weight: 196, espn: 4597500, photo: true },
      { name: 'Jordan Whittington', jersey: 13, year: 4, overall: 67, height: 73, weight: 204, espn: 4569382, photo: true },
      { name: 'Johntay Cook II', jersey: 0, year: 4, overall: 62, height: 71, weight: 190, espn: 4870656, photo: true },
      { name: 'Isaiah Neyor', jersey: 18, year: 4, overall: 55, height: 76, weight: 220, espn: 4428116, photo: true },
      { name: 'Casey Cain', jersey: 2, year: 4, overall: 55, height: 75, weight: 200, espn: 4603190, photo: true }
    ],
    TE: [
      { name: 'Ja\'Tavion Sanders', jersey: null, year: 3, overall: 76, height: 76, weight: 243, espn: 4431588, photo: true },
      { name: 'Gunnar Helm', jersey: 85, year: 4, overall: 60, height: 77, weight: 250, espn: 4686728, photo: true }
    ]
  },
  seattle: {
    QB: [
      { name: 'Geno Smith', jersey: 7, year: 11, overall: 81, height: 75, weight: 221, espn: 15864, photo: true },
      { name: 'Drew Lock', jersey: 2, year: 5, overall: 61, height: 76, weight: 228, espn: 3924327, photo: true }
    ],
    RB: [
      { name: 'Kenneth Walker', jersey: 9, year: 2, overall: 73, height: 69, weight: 210, espn: 4567048, photo: true },
      { name: 'DeeJay Dallas', jersey: 31, year: 4, overall: 55, height: 70, weight: 214, espn: 4240631, photo: true },
      { name: 'Kenny McIntosh', jersey: 25, year: 1, overall: 50, height: 72, weight: 210, espn: null, photo: false }
    ],
    WR: [
      { name: 'DK Metcalf', jersey: 14, year: 5, overall: 75, height: 76, weight: 230, espn: 4047650, photo: true },
      { name: 'Tyler Lockett', jersey: 16, year: 9, overall: 73, height: 70, weight: 182, espn: 2577327, photo: true },
      { name: 'Jaxon Smith-Njigba', jersey: 11, year: 1, overall: 66, height: 72, weight: 198, espn: null, photo: false },
      { name: 'D\'Wayne Eskridge', jersey: 1, year: 3, overall: 56, height: 69, weight: 190, espn: 4043016, photo: true },
      { name: 'Jake Bobo', jersey: 19, year: 1, overall: 54, height: 76, weight: 215, espn: null, photo: false },
      { name: 'Cody Thompson', jersey: 13, year: 5, overall: 54, height: 74, weight: 205, espn: 3126115, photo: true },
      { name: 'Dareke Young', jersey: 83, year: 2, overall: 51, height: 74, weight: 210, espn: 4401805, photo: true }
    ],
    TE: [
      { name: 'Noah Fant', jersey: 87, year: 5, overall: 67, height: 76, weight: 249, espn: 4036131, photo: true },
      { name: 'Colby Parkinson', jersey: 84, year: 4, overall: 60, height: 79, weight: 251, espn: 4242557, photo: true },
      { name: 'Will Dissly', jersey: 89, year: 6, overall: 60, height: 76, weight: 267, espn: 3127292, photo: true },
      { name: 'Brady Russell', jersey: 38, year: 1, overall: 50, height: 75, weight: 250, espn: null, photo: false }
    ]
  },
  houston: {
    QB: [
      { name: 'Case Keenum', jersey: 18, year: 12, overall: 57, height: 73, weight: 215, espn: 15168, photo: true },
      { name: 'Davis Mills', jersey: 10, year: 3, overall: 57, height: 76, weight: 225, espn: 4242546, photo: true },
      { name: 'Tim Boyle', jersey: 16, year: 6, overall: 56, height: 76, weight: 233, espn: 3045169, photo: true }
    ],
    RB: [
      { name: 'Devin Singletary', jersey: 26, year: 5, overall: 72, height: 67, weight: 203, espn: 4040761, photo: true },
      { name: 'Dameon Pierce', jersey: 31, year: 2, overall: 60, height: 70, weight: 215, espn: 4360238, photo: true },
      { name: 'Dare Ogunbowale', jersey: 33, year: 7, overall: 56, height: 71, weight: 205, espn: 2983509, photo: true },
      { name: 'Andrew Beck', jersey: 47, year: 5, overall: 55, height: 75, weight: 255, espn: 3125107, photo: true },
      { name: 'Troy Hairston', jersey: 34, year: 2, overall: 51, height: 71, weight: 245, espn: 4274040, photo: true }
    ],
    WR: [
      { name: 'Nico Collins', jersey: 12, year: 3, overall: 75, height: 76, weight: 222, espn: 4258173, photo: true },
      { name: 'Tank Dell', jersey: 3, year: 1, overall: 66, height: 70, weight: 165, espn: null, photo: false },
      { name: 'Robert Woods', jersey: 2, year: 11, overall: 66, height: 72, weight: 193, espn: 15880, photo: true },
      { name: 'Noah Brown', jersey: 85, year: 7, overall: 64, height: 74, weight: 225, espn: 3121409, photo: true },
      { name: 'John Metchie III', jersey: 8, year: 2, overall: 58, height: 71, weight: 195, espn: 4567096, photo: true },
      { name: 'Steven Sims', jersey: 82, year: 5, overall: 54, height: 70, weight: 176, espn: 3917960, photo: true },
      { name: 'Xavier Hutchinson', jersey: 19, year: 1, overall: 52, height: 75, weight: 210, espn: null, photo: false },
      { name: 'Jesse Matthews', jersey: 41, year: 1, overall: 50, height: 72, weight: 190, espn: null, photo: false }
    ],
    TE: [
      { name: 'Dalton Schultz', jersey: 86, year: 6, overall: 70, height: 77, weight: 242, espn: 3117256, photo: true },
      { name: 'Brevin Jordan', jersey: 9, year: 3, overall: 58, height: 75, weight: 245, espn: 4362504, photo: true },
      { name: 'Eric Saubert', jersey: 81, year: 7, overall: 56, height: 77, weight: 253, espn: 2975863, photo: true },
      { name: 'Teagan Quitoriano', jersey: 84, year: 2, overall: 52, height: 78, weight: 259, espn: 4374045, photo: true }
    ]
  }
};
