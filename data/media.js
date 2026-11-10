/* ==========================================================================
   EGE Football — the Media page's preset accounts
   The accounts every admin can tweet as (Sam, 2026-11-10): the league and
   the networks, each verified. Nobody else sees them in the account menu.

   `org` gives an account X's gold check and a rounded-square picture, the
   way a verified organisation shows there; without it the check is blue
   and the picture round. Pictures live in icon/media/.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.mediaPresets = [
  { id: 'preset:nfl',        name: 'NFL',        handle: 'NFL',       photo: 'icon/media/nfl.jpg',        org: true },
  { id: 'preset:espn',       name: 'ESPN',       handle: 'espn',      photo: 'icon/media/espn.jpg',       org: true },
  { id: 'preset:nbc-sports', name: 'NBC Sports', handle: 'NBCSports', photo: 'icon/media/nbc-sports.jpg', org: true }
];
