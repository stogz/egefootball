/* ==========================================================================
   EGE Football — the 247Sports Composite, for the tools
   Every college player was ranked once, coming out of high school (or a
   junior college): the 247Sports Composite, which averages the recruiting
   services into one rating, star count, national rank and position rank.
   It is the one ranking with every scholarship player in it, so it is what
   the Teams page uses to say how much talent is in a room.

   This reads the Composite lists, one recruiting class and one position at
   a time, and finds a player in them by name. tools/build-rosters.js uses it
   to put each player's ranking and his class year into data/rosters.js.

   Only the positions a skill room can hold are read -- pro-style and
   dual-threat quarterbacks, backs, all-purpose backs, receivers, tight ends
   and athletes -- which is a third of each class. Junior college lists are
   read whole, since they are short.
   ========================================================================== */

'use strict';

const { fetchAll } = require('./espn');

const LIST = 'https://247sports.com/season/{year}-football/compositerecruitrankings/' +
  '?ViewPath=~%2FViews%2FSkyNet%2FPlayerSportRanking%2F_SimpleSetForSeason.ascx' +
  '&InstitutionGroup={group}{position}&Page={page}';

/* 247 split quarterbacks into pro-style and dual-threat, and backs into
   running and all-purpose, until the class of 2021 put each back together. */
function positionsFor(year) {
  return year >= 2021
    ? ['QB', 'RB', 'WR', 'TE', 'ATH']
    : ['PRO', 'DUAL', 'RB', 'APB', 'WR', 'TE', 'ATH'];
}

/* Which of 247's positions a player in a room could have been recruited as.
   An athlete could end up anywhere; a tight end is sometimes a receiver
   grown into one. */
const FITS = {
  QB: ['QB', 'PRO', 'DUAL', 'ATH'],
  RB: ['RB', 'APB', 'ATH', 'FB'],
  WR: ['WR', 'ATH', 'APB', 'RB', 'DUAL', 'QB'],
  TE: ['TE', 'WR', 'ATH']
};

const ROUND = 8;   /* pages asked for at a time, per list */

function decode(text) {
  return String(text)
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
}

/* The players on one page of a list. */
function parse(html, year, juco) {
  const out = [];
  if (!html) { return out; }
  html.split('<li class="rankings-page__list-item">').slice(1).forEach(function (chunk) {
    const name = chunk.match(/class="rankings-page__name-link"[^>]*>([^<]+)</);
    if (!name) { return; }
    const link = chunk.match(/href="\/player\/([^/"]+)\//);
    const position = chunk.match(/<div class="position">\s*([^<]+?)\s*<\/div>/);
    const score = chunk.match(/<span class="score">\s*([\d.]+)\s*<\/span>/);
    const national = chunk.match(/class="natrank"[^>]*>\s*(\d+)\s*</);
    const positional = chunk.match(/class="posrank"[^>]*>\s*(\d+)\s*</);
    const school = chunk.match(/<div class="status">[\s\S]*?title="([^"]+)"/);
    const stars = (chunk.split('<div class="rating">')[1] || '').split('rankings-page__comp-strength')[0]
      .split('icon-starsolid yellow').length - 1;
    out.push({
      name: decode(name[1]),
      slug: link ? link[1] : null,
      position: position ? decode(position[1]) : null,
      year: year,
      juco: juco,
      stars: stars || null,
      rating: score ? Math.round(Number(score[1]) * 10000) / 100 : null,
      rank: national ? Number(national[1]) : null,
      positionRank: positional ? Number(positional[1]) : null,
      school: school ? decode(school[1]) : null
    });
  });
  return out;
}

/* Every page of one list, asked for a round at a time until one comes back
   empty. */
function wholeList(year, group, position) {
  const players = [];
  for (let first = 1; ; first += ROUND) {
    const urls = [];
    for (let page = first; page < first + ROUND; page += 1) {
      urls.push(LIST.replace('{year}', year).replace('{group}', group)
        .replace('{position}', position ? '&Position=' + position : '').replace('{page}', page));
    }
    let got = fetchAll(urls, null, { text: true, parallel: 8 });
    /* A page that did not come back is asked for again (only what is not
       cached is) before an empty one is taken as the end of the list. */
    for (let retry = 0; retry < 3 && urls.some(function (url) { return got.get(url) === null; }); retry += 1) {
      got = fetchAll(urls, null, { text: true, parallel: 4 });
    }
    let ended = false;
    urls.forEach(function (url) {
      const rows = parse(got.get(url), year, group === 'JuniorCollege');
      if (!rows.length) { ended = true; }
      rows.forEach(function (row) { players.push(row); });
    });
    if (ended) { return players; }
  }
}

/* 'Jack Miller III' and 'Jack Miller' are the same player, and so are
   'C.J. Stroud' and 'CJ Stroud'. */
function key(name) {
  return String(name).toLowerCase()
    .replace(/[.'’`-]/g, '')
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Every class from `from` to `to`, read once, indexed by name. */
function load(from, to) {
  const byName = new Map();
  for (let year = from; year <= to; year += 1) {
    const lists = positionsFor(year).map(function (position) {
      return wholeList(year, 'HighSchool', position);
    });
    lists.push(wholeList(year, 'JuniorCollege', null));
    let count = 0;
    lists.forEach(function (list) {
      list.forEach(function (row) {
        const k = key(row.name);
        const found = byName.get(k) || [];
        if (!found.some(function (other) { return other.slug === row.slug && other.year === row.year; })) {
          found.push(row);
          count += 1;
        }
        byName.set(k, found);
      });
    });
    console.log('247 class of ' + year + ': ' + count + ' players');
  }
  return byName;
}

/* The recruit a roster player was, or null. Of everybody with his name in a
   class that had enrolled by that season and not used up its six years,
   the ones recruited at a position his room fits -- and if that leaves
   more than one, or none, the one who signed with this school (a
   linebacker who became a tight end there is still found that way). If
   that does not settle it either, nobody, rather than a guess. */
function find(index, name, room, school, season) {
  const fits = FITS[room] || [];
  const named = (index.get(key(name)) || []).filter(function (row) {
    const years = yearsIn(row, season);
    return years >= 1 && years <= 6;
  });
  const fitting = named.filter(function (row) {
    return !row.position || fits.indexOf(row.position) !== -1;
  });
  if (fitting.length === 1) { return fitting[0]; }
  const signed = (fitting.length ? fitting : named).filter(function (row) {
    return row.school === school;
  });
  return signed.length === 1 ? signed[0] : null;
}

/* What year of college a recruit is in that season: a high school recruit
   arrives as a freshman, a junior college one as a junior. */
function yearsIn(recruit, season) {
  return season - recruit.year + (recruit.juco ? 3 : 1);
}

module.exports = { load, find, yearsIn };
