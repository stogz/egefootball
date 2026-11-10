/* ==========================================================================
   EGE Football — the Media page's preset accounts
   The accounts every admin can tweet as (Sam, 2026-11-10): the league and
   the networks, each verified, and the personalities who now and then
   weigh in on the week (`voice: true`; their tweets are written in
   js/media-voices.js). Nobody else sees them in the account menu.

   `org` gives an account X's gold check and a rounded-square picture, the
   way a verified organisation shows there; without it the check is blue
   and the picture round. Sleeper is the one personality that is an
   organisation (Sam: "gold verified with box icon"). Pictures live in
   icon/media/.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.mediaPresets = [
  { id: 'preset:nfl',        name: 'NFL',             handle: 'NFL',             photo: 'icon/media/nfl.jpg',             org: true },
  { id: 'preset:espn',       name: 'ESPN',            handle: 'espn',            photo: 'icon/media/espn.jpg',            org: true },
  { id: 'preset:nbc-sports', name: 'NBC Sports',      handle: 'NBCSports',       photo: 'icon/media/nbc-sports.jpg',      org: true },
  { id: 'preset:stephen-a',  name: 'Stephen A Smith', handle: 'stephenasmith',   photo: 'icon/media/stephen-a-smith.jpg', voice: true },
  { id: 'preset:sleeper',    name: 'SleeperNFL',      handle: 'SleeperNFL',      photo: 'icon/media/sleeper.jpg',         voice: true, org: true },
  { id: 'preset:skip',       name: 'Skip Bayless',    handle: 'RealSkipBayless', photo: 'icon/media/skip-bayless.jpg',    voice: true },
  { id: 'preset:rapsheet',   name: 'Ian Rapoport',    handle: 'RapSheet',        photo: 'icon/media/ian-rapoport.jpg',    voice: true },
  { id: 'preset:cam',        name: 'Cam Newton',      handle: 'CameronNewton',   photo: 'icon/media/cam-newton.jpg',      voice: true },
  { id: 'preset:mcafee',     name: 'Pat McAfee',      handle: 'PatMcAfeeShow',   photo: 'icon/media/pat-mcafee.jpg',      voice: true }
];
