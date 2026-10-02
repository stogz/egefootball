/* ==========================================================================
   EGE Football — the football calendar, for the tools
   Which week a game is in, and what its date and kickoff read as where it
   is played. Shared by tools/build-season.js and tools/build-conferences.js
   so a season file and the conference races agree on every week number.

   Week 1 is Labor Day weekend: the weekend of the first Saturday in
   September, running Tuesday to Monday so a Thursday opener and a Monday
   night game both land in it. The Saturday before is week 0, the way
   college football numbers it -- Illinois and Nebraska opened 2021 there.
   ========================================================================== */

'use strict';

const DAY = 24 * 60 * 60 * 1000;

/* The first Saturday in September, as a UTC midnight. */
function firstSaturday(season) {
  const first = Date.UTC(season, 8, 1);
  const weekday = new Date(first).getUTCDay();
  return first + ((6 - weekday + 7) % 7) * DAY;
}

/* The week a 'YYYY-MM-DD' date is in. */
function weekOf(date, season) {
  const [y, m, d] = date.split('-').map(Number);
  const start = firstSaturday(season) - 4 * DAY;           /* the Tuesday */
  return Math.floor((Date.UTC(y, m - 1, d) - start) / (7 * DAY)) + 1;
}

/* A moment, as the date and kickoff the schedule prints where the game is
   played: { date: '2021-09-04', kickoff: '7:30pm' }. */
function localParts(iso, zone) {
  const when = new Date(iso);
  const parts = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: 'numeric', minute: '2-digit', hour12: true
  }).formatToParts(when).forEach(function (part) { parts[part.type] = part.value; });
  return {
    date: parts.year + '-' + parts.month + '-' + parts.day,
    kickoff: parts.hour + ':' + parts.minute + String(parts.dayPeriod || '').toLowerCase()
  };
}

module.exports = { weekOf, localParts };
