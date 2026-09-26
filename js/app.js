/* ==========================================================================
   EGE Football — homepage
   Renders the six player cards, routes #{slug} to a player view, and runs
   the player portal.
   Plain script, no build step, no modules — works from file:// and http.
   ========================================================================== */

(function () {
  'use strict';

  var TBD = 'TBD';

  var roster     = document.getElementById('roster');
  var viewHome   = document.getElementById('view-home');
  var viewShop   = document.getElementById('view-shop');
  var viewPlayer = document.getElementById('view-player');
  var viewAdmin  = document.getElementById('view-admin');
  var loginBtn   = document.getElementById('loginBtn');
  var loginModal = document.getElementById('loginModal');

  /* --- helpers ---------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  /* --- the loading screen ----------------------------------------------

     The overlay in index.html is up from the first paint. Each thing that
     goes to Supabase before the page is worth looking at holds it up with
     loading() and lets go with loaded(); the last one to let go takes it
     down. The page load itself is the first hold. */
  var loaderHolds = 1;
  var loaderTimer = null;

  /* The script is running, so it is in charge of the overlay from here and
     the stylesheet's eight-second backstop stands down -- otherwise the
     overlay could never come back up for a sign-in later on. */
  document.getElementById('siteLoader').classList.add('is-managed');

  function loading() {
    loaderHolds += 1;
    var loader = document.getElementById('siteLoader');
    if (loader) { loader.classList.remove('is-done'); }
    document.documentElement.classList.add('is-loading');
  }

  function loaded() {
    loaderHolds = Math.max(0, loaderHolds - 1);
    if (loaderHolds) { return; }
    /* A beat's grace, so two loads back to back do not flash it off and on. */
    window.clearTimeout(loaderTimer);
    loaderTimer = window.setTimeout(function () {
      if (loaderHolds) { return; }
      var loader = document.getElementById('siteLoader');
      if (loader) { loader.classList.add('is-done'); }
      document.documentElement.classList.remove('is-loading');
    }, 120);
  }

  function seasonLabel(year) {
    var s = EGE.seasons.filter(function (x) { return x.year === year; })[0];
    return s ? s.year + ' · ' + s.class + ' · ' + s.level : String(year);
  }

  /* The home page's line follows the live season rather than being typed
     into index.html, so rolling a season over moves it too. */
  document.getElementById('homeSeasonLabel').textContent = seasonLabel(EGE.currentSeason);

  /* School name with its mark beside it, or a plain TBD while unknown. */
  function schoolLine(player, className) {
    var team = EGE.teamFor(player);
    var line = el('div', 'ege-school' + (className ? ' ' + className : ''));

    if (!team) {
      line.appendChild(el('span', 'ege-school__name', 'School ' + TBD));
      return line;
    }

    /* Not every school has a mark in icon/ yet. */
    if (team.logo) {
      var logo = el('img', 'ege-school__logo');
      logo.src = team.logo;
      logo.alt = '';          /* decorative: the name is right beside it */
      logo.loading = 'lazy';
      line.appendChild(logo);
    }
    line.appendChild(el('span', 'ege-school__name', team.school));
    return line;
  }

  /* --- the overall box ---------------------------------------------------- */

  /* One element for every place an overall is shown, so the number reads the
     same on a card as it does on a page. The site's own dark chip: the word
     in the accent orange, the number under it in cream. */
  function overallBox(overall, modifier) {
    if (typeof overall !== 'number') { return null; }

    var box = el('div', 'ege-ovrbox' + (modifier ? ' ' + modifier : ''));
    box.title = overall + ' overall';
    box.appendChild(el('span', 'ege-ovrbox__label', 'OVR'));
    box.appendChild(el('span', 'ege-ovrbox__value', String(overall)));
    return box;
  }

  /* --- player cards ----------------------------------------------------- */

  /* The headshot across the top, and under it the name, the school with its
     mark, the way in, and the overall in a box on the right.

     No league line and no position or season chip: both are on the player's
     own page, one tap away, and what a roster is for is telling six people
     apart and putting them in order. */
  function buildCard(player) {
    var card = el('a', 'ege-card');
    card.href = '#' + player.slug;

    var photo = el('div', 'ege-card__photo');
    var img = el('img');
    img.src = player.headshot;
    img.alt = player.name;
    img.loading = 'lazy';
    photo.appendChild(img);
    card.appendChild(photo);

    /* The words on the left, the overall on the right. */
    var body = el('div', 'ege-card__body');
    var text = el('div', 'ege-card__text');
    text.appendChild(el('h3', 'ege-card__name', player.name));
    text.appendChild(schoolLine(player));
    text.appendChild(el('span', 'ege-card__go', 'View player →'));
    body.appendChild(text);

    var box = overallBox(EGE.overallFor(player), 'ege-ovrbox--card');
    if (box) { body.appendChild(box); }

    card.appendChild(body);
    return card;
  }

  /* Best first, three across, so the top three are the top row. A player
     with no ratings yet has no overall to be ranked on and goes last; names
     break a tie, so the order never wobbles between two equal players. */
  function byOverall(a, b) {
    var left = EGE.overallFor(a);
    var right = EGE.overallFor(b);
    if (left === right) { return a.name.localeCompare(b.name); }
    if (left === null) { return 1; }
    if (right === null) { return -1; }
    return right - left;
  }

  function renderRoster() {
    var frag = document.createDocumentFragment();
    EGE.players.slice().sort(byOverall).forEach(function (player) {
      frag.appendChild(buildCard(player));
    });
    roster.appendChild(frag);
  }

  /* One <img> is reused for every player, and a browser keeps painting the
     file it already has until the new one has decoded -- so for an instant
     after clicking a player you are still looking at the one you left.

     Hiding it until the new file is ready shows the empty frame instead,
     which is at least not somebody else's face. A file already in the cache
     is ready in the same tick and never blinks, so this costs nothing on the
     second visit to a player. */
  function showPhoto(img, src, alt) {
    img.alt = alt;
    if (img.getAttribute('src') === src) { return; }

    /* Ask a throwaway first. A file the browser already holds is complete the
       moment it is asked for, and swapping to it is instantaneous -- hiding
       and fading that one in would be a flicker of its own, put there by the
       code meant to remove one. Every headshot is on the roster, so in
       practice this is the path nearly every click takes. */
    var probe = new Image();
    probe.src = src;
    if (probe.complete) {
      img.classList.remove('is-loading');
      img.src = src;
      return;
    }

    img.classList.add('is-loading');
    img.onload = img.onerror = function () { img.classList.remove('is-loading'); };
    img.src = src;
  }

  /* --- player view ------------------------------------------------------ */

  function renderPlayer(player) {
    renderSeasonBar(player);
    var season = shownSeason();

    document.getElementById('playerStripLabel').textContent = seasonLabel(season);

    showPhoto(document.getElementById('playerPhoto'), player.headshot, player.name);

    var school = document.getElementById('playerSchool');
    school.innerHTML = '';
    school.appendChild(schoolLine(player, 'ege-school--lg'));

    document.getElementById('playerName').textContent = player.name;
    /* Three facts under the name: what he plays, how his team's season is
       going, and the number on his back. Which season, class and level it
       is are across the strip at the top of the panel, in full. */
    document.getElementById('playerPosition').textContent = player.position || TBD;
    /* The team's wins and losses over the season on show, 0-0 until the
       first result is published. */
    var record = document.getElementById('playerRecord');
    record.textContent = EGE.recordFor(player, season).text;
    /* The run the team is on, green for wins and red for losses, while the
       season is still being played. Once it is over the record says it all. */
    var streak = EGE.streakFor(player, season);
    if (streak && !EGE.seasonOverFor(player, season)) {
      record.appendChild(el('span', 'ege-record__dot', ' \u00b7 '));
      var run = el('span', 'ege-streak ege-streak--' + (streak.won ? 'win' : 'loss'),
        streak.text + ' Streak');
      run.title = streak.count + (streak.won ? ' win' : ' loss') +
        (streak.count === 1 ? '' : (streak.won ? 's' : 'es')) + ' in a row';
      record.appendChild(run);
    }
    document.getElementById('playerJersey').textContent =
      typeof player.jersey === 'number' ? '#' + player.jersey : TBD;

    renderStars(player);
    renderVitals(player);
    renderOffers(player);
    renderTally(player, season);

    renderSchedule(player);
    renderGameLog(player);
    renderRatings(player);
  }

  /* --- the season, at a glance --------------------------------------------

     Ten numbers on one rule-ruled strip: ten across where there is room for
     it, five and five on anything narrower. Every cell is the same width as
     every other, the numbers all sit on one baseline, and a hairline between
     them says where one stat ends and the next begins. The layout is CSS's
     alone -- this only says which ten and in what order.

     The numbers are the season's totals over the games that have been
     published -- the same totals the game log foots with, from the same
     columns, so the two can never disagree. Nothing private is in here: a
     stat line belongs to whoever is reading it. */
  function renderTally(player, season) {
    var tally = document.getElementById('playerTally');
    tally.innerHTML = '';

    /* The bar goes with it: an empty dark band under the panel says nothing
       and looks like a mistake. What the season is up to is on the schedule
       below either way. */
    var played = EGE.gamesPlayed(player, season);
    document.getElementById('playerTallyBar').hidden = !played.length;
    if (!played.length) { return; }

    var totals = EGE.statline.totalLine(player.position, played.map(function (game) {
      return EGE.statline.complete(player.position, game.stats);
    }));

    EGE.statline.headlineFor(player.position).forEach(function (column) {
      var cell = el('div', 'ege-tally__cell');
      cell.title = column.title;
      cell.appendChild(el('span', 'ege-tally__value',
        EGE.statline.show(totals.columns[column.key])));
      cell.appendChild(el('span', 'ege-tally__label', column.label));
      tally.appendChild(cell);
    });

    fitTally(tally);
  }

  /* The stylesheet asks for the biggest number the design allows. Whether it
     fits depends on how wide a digit is, which depends on the font, and
     Caprasimo is still on its way down when the first draw happens -- so it
     is measured here, against the text that actually rendered.

     One correction for the whole grid, taken from the worst cell, so the ten
     stay the same size as each other. Sizing each to its own length was the
     obvious thing and it looked wrong: 120/228 beside 21 at two different
     sizes reads as a mistake rather than as a design. */
  function fitTally(tally) {
    tally.style.removeProperty('--tally-fit');

    var worst = 1;
    Array.prototype.forEach.call(
      tally.querySelectorAll('.ege-tally__cell'),
      function (cell) {
        /* The content box, not the border box: the cell's padding is what
           keeps a long number off the hairline beside it, and measuring
           against the outside would let it sit right on the rule. */
        var pad = window.getComputedStyle(cell);
        var room = cell.getBoundingClientRect().width
          - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
        var need = cell.querySelector('.ege-tally__value').getBoundingClientRect().width;
        if (room > 0 && need > room) { worst = Math.max(worst, need / room); }
      }
    );

    if (worst > 1) { tally.style.setProperty('--tally-fit', String(1 / worst)); }
  }

  /* Re-measured when the width changes, and again when the webfont lands --
     the first measurement is of the fallback face, and Caprasimo is not the
     same width. */
  function refitTally() {
    var bar = document.getElementById('playerTallyBar');
    if (bar && !bar.hidden) { fitTally(document.getElementById('playerTally')); }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refitTally);
    /* A face the home page never used -- a weight only the player page
       asks for -- lands after `ready` has already gone, so listen for
       every load rather than only the first round. */
    if (document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', refitTally);
    }
  }

  /* Stars out of five, the empty ones drawn as outlines, and where he ranks
     at his position in his state. */
  function renderStars(player) {
    var box = document.getElementById('playerStars');
    box.innerHTML = '';
    var recruit = (EGE.recruiting || {})[player.slug];
    box.hidden = !recruit;
    if (!recruit) { return; }

    var row = el('span', 'ege-stars__row');
    row.setAttribute('role', 'img');
    row.setAttribute('aria-label', recruit.stars + '-star recruit');
    for (var i = 1; i <= 5; i += 1) {
      var star = el('span', 'ege-stars__star' + (i > recruit.stars ? ' is-empty' : ''), '\u2605');
      star.setAttribute('aria-hidden', 'true');
      row.appendChild(star);
    }
    box.appendChild(row);
    box.appendChild(el('span', 'ege-stars__rank',
      '#' + recruit.stateRank + ' ' + recruit.position + ' in ' + recruit.state));
    box.title = recruit.stars + '-star \u00b7 247 rating ' + recruit.rating;
  }

  /* The two facts about a player that no season changes, under his picture.
     Dark, like the overall box, because they belong to him rather than to
     the year -- everything in the list beside them is about this season. */
  function renderVitals(player) {
    var box = document.getElementById('playerVitals');
    box.innerHTML = '';

    var shown = [
      { label: 'Height', value: EGE.heightText(player) },
      { label: 'Weight', value: EGE.weightText(player) }
    ].filter(function (one) { return one.value; });

    box.hidden = !shown.length;

    shown.forEach(function (one) {
      var cell = el('div', 'ege-vitals__cell');
      cell.appendChild(el('span', 'ege-vitals__label', one.label));
      cell.appendChild(el('span', 'ege-vitals__value', one.value));
      box.appendChild(cell);
    });
  }

  /* --- schedule --------------------------------------------------------- */

  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* Dates are plain calendar days — read them as such so a time zone can
     never shift a Saturday game onto the Friday. */
  function gameDate(game) {
    var parts = String(game.date).split('-');
    var when = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    return WEEKDAYS[when.getUTCDay()] + ' ' + MONTHS[when.getUTCMonth()] + ' ' + when.getUTCDate();
  }

  /* A head and shoulders in the margin of a scouted game. */
  function scoutMark() {
    var mark = el('span', 'ege-scout');
    mark.title = 'SCOUTS IN ATTENDANCE';
    mark.setAttribute('aria-label', 'Scouts in attendance');
    mark.setAttribute('role', 'img');
    return mark;
  }

  var showScouts = false;
  var showBoosters = false;
  var schedulePlayer = null;

  /* Which season a player page is showing. The live one: with one season on
     the ladder so far there is nothing to choose between, and the picker
     that used to sit in the schedule's head is gone. Everything reads this
     rather than EGE.currentSeason directly, so adding a way back to an older
     year is a change to this function and nothing else. */
  function shownSeason() {
    return viewedSeason || EGE.currentSeason;
  }

  /* The season picked on the switcher under the player header, or null for
     the live one. Opening a different player goes back to the live season:
     the switcher is for looking back at one player, not a setting. */
  var viewedSeason = null;
  var seasonFor = null;

  /* Every season with a file in stats/, up to the live one. A season still to
     come is on the ladder in data/players.js but has nothing to show. */
  function loggedSeasons() {
    return EGE.seasonsPlayed().filter(function (year) {
      return year <= EGE.currentSeason;
    });
  }

  function renderSeasonBar(player) {
    if (seasonFor !== player.slug) {
      seasonFor = player.slug;
      viewedSeason = null;
    }

    var years = loggedSeasons();
    var season = shownSeason();
    var bar = document.getElementById('seasonBar');
    bar.hidden = years.length < 2;
    if (bar.hidden) { return; }

    var pick = document.getElementById('seasonPick');
    pick.innerHTML = '';
    years.slice().reverse().forEach(function (year) {
      var option = el('option');
      option.value = year;
      pick.appendChild(option);
    });
    labelSeasons();
    pick.value = String(season);

    var at = years.indexOf(season);
    document.getElementById('seasonPrev').disabled = at <= 0;
    document.getElementById('seasonNext').disabled = at === -1 || at >= years.length - 1;
  }

  /* What each season in the picker says: the year and the class on a wider
     screen, and the year alone on a phone, where the picker shares its row
     with the way back and both arrows. The level is across the strip at the
     top of the panel either way. */
  var narrowBar = window.matchMedia('(max-width: 620px)');

  function labelSeasons() {
    var options = document.getElementById('seasonPick').options;
    Array.prototype.forEach.call(options, function (option) {
      var year = Number(option.value);
      var s = EGE.seasons.filter(function (x) { return x.year === year; })[0];
      option.textContent = narrowBar.matches || !s
        ? String(year)
        : year + ' \u00b7 ' + s.class;
    });
  }

  /* A phone turned on its side, or a window dragged narrower. */
  if (narrowBar.addEventListener) {
    narrowBar.addEventListener('change', labelSeasons);
  } else if (narrowBar.addListener) {
    narrowBar.addListener(labelSeasons);
  }

  function showSeason(year) {
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    if (!player) { return; }
    viewedSeason = year === EGE.currentSeason ? null : year;
    renderPlayer(player);
  }

  function stepSeason(by) {
    var years = loggedSeasons();
    var next = years[years.indexOf(shownSeason()) + by];
    if (next) { showSeason(next); }
  }

  document.getElementById('seasonPick').addEventListener('change', function (e) {
    showSeason(Number(e.target.value));
  });
  document.getElementById('seasonPrev').addEventListener('click', function () { stepSeason(-1); });
  document.getElementById('seasonNext').addEventListener('click', function () { stepSeason(1); });

  /* --- booster stickers --------------------------------------------------- */

  var STICKER_LOOK = {
    'boost-2-5': { modifier: 'holo',   label: '2.5x' },
    'boost-2-0': { modifier: 'gold',   label: '2.0x' },
    'boost-1-5': { modifier: 'silver', label: '1.5x' }
  };

  /* A scatter that is random per sticker but settled once it is placed: the
     row's own id is the seed, so the angle survives every redraw and no two
     stickers land the same way. */
  function scatter(seed) {
    var hash = 2166136261;
    String(seed).split('').forEach(function (ch) {
      hash ^= ch.charCodeAt(0);
      hash = (hash * 16777619) >>> 0;
    });
    return {
      tilt: ((hash % 33) - 16),                  /* -16deg .. +16deg */
      nudge: (((hash >>> 8) % 13) - 6)           /* -6px .. +6px  */
    };
  }

  /* `size` in pixels, or null to leave it to the stylesheet -- which is what
     the sticker on a schedule row does, because how big it should be depends
     on how much row there is, and that is a question CSS is holding the
     answer to rather than this. */
  function stickerEl(itemKey, size, seed) {
    var look = STICKER_LOOK[itemKey];
    if (!look) { return null; }

    var sticker = el('span', 'ege-sticker ege-sticker--' + look.modifier);
    if (size) { sticker.style.setProperty('--sticker-size', size + 'px'); }
    sticker.style.setProperty('--tilt', scatter(seed == null ? itemKey : seed).tilt + 'deg');

    var face = el('span', 'ege-sticker__face');
    face.appendChild(el('span', 'ege-sticker__text', look.label));
    sticker.appendChild(face);

    return sticker;
  }

  /* --- college offers ------------------------------------------------------

     One sticker per offer, stuck in the top corner of the header. They are
     laid on a loose grid and then knocked off it -- position, tilt and all --
     so a row of them reads as stickers somebody pressed on rather than as
     icons in a line.

     Every bit of that comes out of the same hash the boosters use, seeded on
     the player and the school. So a sticker lands in the same place and at
     the same angle on every draw, on every device, for good: it is a thing
     stuck to the page, and a thing that moves when you reload is not stuck to
     anything. */

  var OFFER_SIZE = 92;      /* the die-cut, in pixels */

  /* Two across up to four of them, three across beyond that. Three offers on
     a three-wide grid is a row, and a row is the one thing a handful of
     stickers never looks like. */
  function offerCols(count) { return count > 4 ? 3 : 2; }

  /* Where one sticker goes, and how far off square. The grid is tighter than
     the sticker is wide, so they overlap the way a handful of stickers on a
     folder do; the jitter is what stops the overlap looking like a pattern. */
  function offerPlacing(seed, at, size, cols, stepX) {
    var hash = 2166136261;
    String(seed).split('').forEach(function (ch) {
      hash ^= ch.charCodeAt(0);
      hash = (hash * 16777619) >>> 0;
    });

    var stepY = size * 0.80;
    var jitter = size * 0.22;

    return {
      x: (at % cols) * stepX + ((hash % 101) / 100 - 0.5) * 2 * jitter,
      y: Math.floor(at / cols) * stepY +
         (((hash >>> 9) % 101) / 100 - 0.5) * 2 * jitter,
      tilt: ((hash >>> 17) % 33) - 16         /* -16deg .. +16deg */
    };
  }

  /* How far along a row one sticker is from the next, when nothing asks for
     more room than that. */
  var OFFER_STEP = OFFER_SIZE * 0.82;

  /* How wide the box is for a grid this many across. */
  function offerSpan(cols, step) {
    return (cols - 1) * step + OFFER_SIZE * 1.10;
  }

  /* The width the stickers can have in the corner: from the right edge they
     hang over, back to the end of the longest line of words beside the
     picture -- the name, nearly always, but the school and the facts are
     counted too so a sticker never lands on a word. Measured with the box
     out of the grid, so the words are where they sit with no stickers taking
     room off them. The jitter comes off as well, since a sticker nudged left
     can reach that far past the box. */
  function offerRoom(box) {
    var top = box.parentNode;
    var reach = parseFloat(window.getComputedStyle(box).getPropertyValue('--offers-reach')) || 0;
    var gap = parseFloat(window.getComputedStyle(top).columnGap) || 0;

    /* The text itself, one run at a time: the blocks it sits in are the
       full width of the column and would say the words run to the edge. */
    var words = 0;
    [document.getElementById('playerSchool'), document.getElementById('playerName'),
     document.getElementById('playerStars'), top.querySelector('.ege-detail__list')].forEach(function (node) {
      if (!node) { return; }
      var walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      var range = document.createRange();
      while (walk.nextNode()) {
        if (!walk.currentNode.nodeValue.trim()) { continue; }
        range.selectNodeContents(walk.currentNode);
        words = Math.max(words, range.getBoundingClientRect().right);
      }
    });

    return top.getBoundingClientRect().right + reach - words - gap - OFFER_SIZE * 0.22;
  }

  /* How many across, and how far apart. A handful keeps the grid above. A
     pile that grid would stack more than two deep is let out sideways
     instead, rather than running down past the facts: as many across as fit
     between the name and the edge, so long as the last row is at least half
     full -- a lone sticker trailing under a long row reads as one that fell
     off. Then the row is spaced out to use the room it was given, never so
     far apart that the stickers stop overlapping.

     In the corner the room is what the words leave; where the offers are a
     band of their own under the header, it is the band's whole width. */
  function offerLayout(box, count) {
    var plain = offerCols(count);
    var layout = { cols: plain, step: OFFER_STEP };
    if (Math.ceil(count / plain) <= 2) { return layout; }

    /* Where the offers are a band of their own under the header, the band
       is the panel's whole width, so a big pile spreads across it rather
       than running down the page three at a time. */
    var band = window.matchMedia('(max-width: 1000px)').matches;
    var room = band ? box.parentNode.getBoundingClientRect().width : offerRoom(box);
    function fits(cols) {
      var last = count - (Math.ceil(count / cols) - 1) * cols;
      return cols < count && last * 2 >= cols && offerSpan(cols, OFFER_STEP) <= room;
    }
    for (var cols = count - 1; cols > plain; cols -= 1) {
      if (fits(cols)) { layout.cols = cols; break; }
    }
    if (layout.cols > plain) {
      layout.step = Math.min(OFFER_SIZE * 0.88,
        Math.max(OFFER_STEP, (room - OFFER_SIZE * 1.10) / (layout.cols - 1)));
    }
    return layout;
  }

  /* The school's mark, or its short name until the mark has been added. A
     file that is not there yet is not an error: icon/offers/{logo}.png lands
     whenever it lands and the sticker picks it up with no change here. */
  function offerFace(college, sticker) {
    var abbr = el('span', 'ege-sticker__abbr', college.short);

    if (!college.logo) { return abbr; }

    var logo = el('img', 'ege-sticker__logo');
    logo.src = 'icon/offers/' + college.logo + '.png';
    logo.alt = '';                   /* the sticker's own label says it */
    logo.loading = 'lazy';
    logo.addEventListener('error', function () {
      if (logo.parentNode) { logo.parentNode.replaceChild(abbr, logo); }
    });
    return logo;
  }

  /* Where one sticker sits and how far off square. Set on a sticker that
     already exists as readily as on a new one, which is what lets a re-fit
     move the stickers rather than build them all again. */
  function placeSticker(slot, player, entry, at, cols, step) {
    var place = offerPlacing(player.slug + '-' + entry.key, at, OFFER_SIZE, cols, step);
    slot.style.setProperty('--at-x', Math.round(place.x) + 'px');
    slot.style.setProperty('--at-y', Math.round(place.y) + 'px');
    slot.firstChild.style.setProperty('--tilt', place.tilt + 'deg');
  }

  function offerSticker(player, entry, at, cols, step) {
    var college = entry.college;
    var slot = el('div', 'ege-offers__sticker');

    var sticker = el('span', 'ege-sticker ege-sticker--offer');
    sticker.style.setProperty('--sticker-size', OFFER_SIZE + 'px');
    sticker.style.setProperty('--team-ground', college.ground);
    sticker.style.setProperty('--team-ink', college.ink);
    sticker.title = college.name + ' have offered';

    var face = el('span', 'ege-sticker__face');
    sticker.appendChild(face);
    sticker.appendChild(offerFace(college, sticker));

    slot.appendChild(sticker);
    placeSticker(slot, player, entry, at, cols, step);
    return slot;
  }

  var offersPlayer = null;

  function renderOffers(player) {
    var box = document.getElementById('playerOffers');
    var offers = EGE.offersFor(player);
    offersPlayer = player;

    /* The same stickers as are already up -- a re-fit, or the page redrawn
       once the published weeks land -- are moved rather than made again.
       Making them again swapped every logo for a fresh <img> that had to
       decode before it showed, so the whole pile blinked; on a phone that
       was every time the address bar slid in or out. */
    var key = player.slug + ':' + offers.map(function (one) { return one.key; }).join(',');
    var reuse = box.getAttribute('data-offers') === key &&
                box.children.length === offers.length;
    if (!reuse) {
      box.innerHTML = '';
      box.setAttribute('data-offers', key);
    }

    /* Out of the grid while the room is measured, then back in. */
    box.hidden = true;
    if (!offers.length) { return; }

    var layout = offerLayout(box, offers.length);
    var cols = layout.cols;
    box.hidden = false;
    offers.forEach(function (entry, at) {
      if (reuse) {
        placeSticker(box.children[at], player, entry, at, cols, layout.step);
      } else {
        box.appendChild(offerSticker(player, entry, at, cols, layout.step));
      }
    });

    /* The box is only as big as the stickers in it, so a player with three
       does not reserve room for five. The last row is as wide as it is.

       It is deliberately a little narrower than the stickers can reach. The
       box is what the grid reserves and what the page measures for a
       scrollbar; the stickers inside it are out of the flow and are allowed
       past its edge, which is how the outermost of them end up hanging over
       the panel border without the page growing a sideways scroll. Room for
       the jitter is on the height, where there is nothing to overflow. */
    var rows = Math.ceil(offers.length / cols);
    cols = Math.min(offers.length, cols);
    box.style.setProperty('--offers-width', Math.round(offerSpan(cols, layout.step)) + 'px');
    box.style.setProperty('--offers-height',
      Math.round((rows - 1) * OFFER_SIZE * 0.80 + OFFER_SIZE * 1.34) + 'px');

    box.setAttribute('aria-label', offers.length +
      (offers.length === 1 ? ' college offer: ' : ' college offers: ') +
      offers.map(function (one) { return one.college.name; }).join(', '));
  }

  /* Laid out again when the width changes, and when the webfont lands: both
     move where the name ends, which is what the room is measured to. */
  function refitOffers() {
    var box = document.getElementById('playerOffers');
    if (offersPlayer && box.offsetParent !== null) { renderOffers(offersPlayer); }
  }

  /* Only a change of width can move where the words end. A phone fires
     `resize` every time its address bar slides in or out as you scroll,
     which changes the height and nothing else -- re-fitting then was work
     for nothing, done in the middle of a scroll. */
  var windowWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === windowWidth) { return; }
    windowWidth = window.innerWidth;
    refitOffers();
    refitTally();
    fitBracket();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refitOffers);
    if (document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', refitOffers);
    }
  }

  /* And whenever the header itself changes width without the window doing
     so -- a scrollbar arriving as the schedule fills the page under it is
     the usual one. Width only: laying the stickers out changes the header's
     height, and reacting to that would go round in a circle. */
  if (window.ResizeObserver) {
    var headerWidth = 0;
    new window.ResizeObserver(function (entries) {
      var width = Math.round(entries[0].contentRect.width);
      if (!width || width === headerWidth) { return; }
      headerWidth = width;
      refitOffers();
      refitTally();
      fitBracket();
    }).observe(document.querySelector('.ege-detail'));
  }

  /* Stickers are private: your own, or anyone's if you are an admin. The
     policy on game_boosters enforces it; this only decides what to draw. */
  function canSeeStickers(player) {
    return isMe(player) || EGE.wallet.admin();
  }

  /* A mouse has hover, so a sticker it can take off says so as the pointer
     arrives: it fades, rules itself through and shows a cross. A finger has
     none of that, and drawing the cross permanently instead made every phone
     screen look like the booster was already half off.

     So on a touch screen the sticker arms rather than showing: the first tap
     lifts it and draws the cross, the second takes it off, and a tap anywhere
     else puts it back down. The cross is only ever up while you are actually
     taking one off, and a stray tap costs nothing. */
  var armedSticker = null;

  function disarmSticker() {
    var was = armedSticker;
    armedSticker = null;
    if (!was) { return; }
    was.classList.remove('ege-slot__applied--armed');
    if (was.dataset.restTitle) {
      was.title = was.dataset.restTitle;
      was.setAttribute('aria-label', was.dataset.restTitle);
    }
  }

  /* Anywhere else on the page, including another sticker. Runs after the
     sticker's own handler, which is what lets that one arm itself without
     this one immediately putting it back down. */
  document.addEventListener('click', function (event) {
    if (!armedSticker) { return; }
    var inside = event.target.closest
      ? event.target.closest('.ege-slot__applied--armed')
      : null;
    if (inside !== armedSticker) { disarmSticker(); }
  });

  /* The slot at the end of a schedule row: a sticker if one is stuck there,
     a plus if this is your own unplayed game, and nothing otherwise. */
  function stickerSlot(player, game) {
    var slot = el('span', 'ege-slot');
    var mine = isMe(player);
    var played = EGE.isFinal(game);

    /* A booster written into the season file is the record of a game already
       played. It shows, and it never comes off. Anything still in Supabase is
       a sticker on a fixture, and its owner can still change his mind.

       Either way it is private: what somebody has riding on a game is his own
       business and an admin's, whether it came from the file or the table. */
    var booster = canSeeStickers(player) ? EGE.boosterOn(player, game) : null;
    var stuck = booster ? {
      id: booster.id || (player.slug + '-' + game.week),
      item_key: booster.key,
      item_name: booster.name,
      hardcoded: booster.hardcoded
    } : null;

    if (stuck) {
      var peelable = mine && !played && !stuck.hardcoded;
      var applied = el('button', 'ege-slot__applied ' +
        (peelable ? 'ege-slot__applied--peelable' : 'ege-slot__applied--stuck'));
      applied.type = 'button';
      applied.disabled = !peelable;
      var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
      applied.title = peelable
        ? stuck.item_name + ' \u2014 ' + (touch ? 'tap' : 'click') + ' to peel it off'
        : stuck.item_name + ' \u2014 the game has been played, it stays put';
      applied.setAttribute('aria-label', applied.title);
      applied.dataset.restTitle = applied.title;
      /* How big it is belongs to the stylesheet -- it is bigger than the row
         on purpose, and how much bigger depends on how much row there is.
         What is settled here is only the scatter: which way this one leans
         and how far it hangs over the row above or below. */
      var seed = stuck.id;
      var placing = scatter(seed);
      var sticker = stickerEl(stuck.item_key, null, seed);
      applied.style.setProperty('--nudge', placing.nudge + 'px');
      applied.appendChild(sticker);
      if (peelable) {
        sticker.appendChild(el('span', 'ege-sticker__hatch'));
        sticker.appendChild(el('span', 'ege-sticker__x', '\u00d7'));
        applied.addEventListener('click', function () {
          /* First tap on a touch screen only arms it. */
          if (touch && armedSticker !== applied) {
            disarmSticker();
            armedSticker = applied;
            applied.classList.add('ege-slot__applied--armed');
            applied.title = 'Tap the cross to take ' + stuck.item_name +
                            ' off week ' + game.week;
            applied.setAttribute('aria-label', applied.title);
            return;
          }
          disarmSticker();
          applied.disabled = true;
          EGE.wallet.peelBooster(player.email, stuck).then(function (res) {
            announce(res.message, !res.ok);
            refreshShop();
          });
        });
      }
      slot.appendChild(applied);
      return slot;
    }

    /* Nothing goes on a playoff game. Boosters are a thing you plan a
       regular season around -- you are spending a limited drawer on the
       weeks you think matter -- and the postseason is not planned, it is
       whatever the bracket hands you. The drawer never opens on one, and
       neither does the plus that opens it. */

    /* A booster goes on any game that has not been published yet.

       Not "any game with no result in it" — the season is written up front,
       so every game has a result from day one and that would mean nobody
       could ever use a booster. Holding a week back is exactly the window in
       which a player puts a sticker on it and the admin writes it into the
       file before putting the week out. */
    if (mine && !played && !game.playoff && game.season === EGE.currentSeason) {
      var add = el('button', 'ege-slot__add', '+');
      add.type = 'button';
      add.title = 'Put a booster on this game';
      add.setAttribute('aria-label', 'Put a booster on week ' + game.week);
      add.addEventListener('click', function () { openDrawer(player, game); });
      slot.appendChild(add);
    }

    return slot;
  }

  function isMe(player) {
    var signedIn = EGE.auth.currentPlayer();
    return Boolean(signedIn && player && signedIn.slug === player.slug);
  }

  /* --- the drawer --------------------------------------------------------- */

  var drawer = null;
  var drawerFor = null;

  function announce(message, isError) {
    sayShop(message, isError);
    if (drawer) { renderDrawer(); }
  }

  function closeDrawer() {
    drawerFor = null;
    if (drawer) { drawer.remove(); drawer = null; }
  }

  function openDrawer(player, game) {
    drawerFor = { player: player, game: game };
    renderDrawer();
  }

  function renderDrawer() {
    if (!drawerFor) { return; }
    if (drawer) { drawer.remove(); }

    var game = drawerFor.game;
    var player = drawerFor.player;

    drawer = el('div', 'ege-drawer');
    var inner = el('div', 'ege-drawer__inner');

    var title = el('div', 'ege-drawer__title');
    title.appendChild(el('small', null, 'Week ' + game.week + ' \u00b7 ' +
      (game.home ? 'vs ' : 'at ') + game.opponent));
    title.appendChild(document.createTextNode('Your Booster Stickers'));
    inner.appendChild(title);

    var owned = shopState.inventory.filter(function (row) {
      return row.consumable && STICKER_LOOK[row.item_key];
    });

    if (!owned.length) {
      inner.appendChild(el('span', 'ege-drawer__empty',
        'No boosters in the drawer. They are in the shop.'));
    } else {
      var strip = el('div', 'ege-drawer__stickers');
      owned.forEach(function (row) {
        var pick = el('button', 'ege-pick');
        pick.type = 'button';
        pick.title = 'Stick ' + row.item_name + ' on week ' + game.week;
        pick.appendChild(stickerEl(row.item_key, 76, row.item_key));
        pick.appendChild(el('span', 'ege-pick__count', '\u00d7' + EGE.wallet.quantityOf(row)));
        pick.addEventListener('click', function () {
          pick.disabled = true;
          EGE.wallet.applyBooster(player.email, EGE.shopItem(row.item_key),
                                  game.season, game.week)
            .then(function (res) {
              sayShop(res.message, !res.ok);
              if (res.ok) { closeDrawer(); }
              refreshShop();
            });
        });
        strip.appendChild(pick);
      });
      inner.appendChild(strip);
    }

    var close = el('button', 'fb-btn fb-btn--inverse', 'Close');
    close.type = 'button';
    close.addEventListener('click', closeDrawer);
    inner.appendChild(close);

    drawer.appendChild(inner);
    document.body.appendChild(drawer);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') { return; }
    if (drawer) { closeDrawer(); }
    disarmSticker();
  });

  function scheduleRow(game, opensPlayoffs) {
    var row = el('tr');
    var played = EGE.isFinal(game);

    /* The first postseason row carries the line that divides the two halves
       of the year. */
    if (opensPlayoffs) { row.classList.add('ege-schedule__break'); }

    row.appendChild(el('td', 'ege-schedule__week', game.week));

    row.appendChild(el('td', null, gameDate(game)));
    row.appendChild(el('td', 'ege-schedule__time', game.kickoff || '—'));

    var opponent = el('td', 'ege-schedule__opponent');
    if (game.bye) {
      /* Nobody to play and nowhere to be. The row is still here because the
         week is: a bye is a round of the bracket, and a schedule that skips
         it makes the weeks either side look wrong. */
      opponent.appendChild(el('span', 'ege-schedule__bye', 'Bye'));
    } else {
      opponent.appendChild(el('span', 'ege-schedule__side', game.home ? 'vs' : 'at'));
      opponent.appendChild(el('span', 'fb-name', game.opponent));
    }
    if (game.conference) {
      var mark = el('abbr', 'ege-schedule__conf', '*');
      mark.title = 'Conference game';
      opponent.appendChild(mark);
    }
    /* Two of them for the postseason, one for a conference game. A playoff
       game is never also a conference game, so the two never stack. */
    if (game.playoff) {
      var post = el('abbr', 'ege-schedule__conf', '**');
      post.title = 'Playoff game';
      opponent.appendChild(post);
    }
    if (showScouts && game.scouts) { opponent.appendChild(scoutMark()); }
    row.appendChild(opponent);

    var result = el('td', 'num');
    if (played) {
      var won = game.result.teamScore > game.result.opponentScore;
      result.appendChild(el('span', 'fb-tag fb-tag--num ' + (won ? 'fb-tag--sage' : 'fb-tag--clay'),
        (won ? 'W ' : 'L ') + game.result.teamScore + '–' + game.result.opponentScore +
        (game.overtime ? '/OT' : '')));
    } else {
      result.appendChild(el('span', 'ege-schedule__pending', '—'));
    }
    row.appendChild(result);

    /* What the game paid. Only his own, and an admin's — a balance is nobody
       else's business. */
    var credits = el('td', 'num ege-schedule__credits');
    var earned = schedulePlayer ? EGE.creditsFromGame(schedulePlayer, game) : 0;
    if (earned && canSeeStickers(schedulePlayer)) {
      var tag = el('span', 'ege-schedule__paid', '+' + earned);
      tag.title = earned + ' credits for this game';
      credits.appendChild(tag);
    } else {
      credits.appendChild(el('span', 'ege-schedule__pending', '—'));
    }
    row.appendChild(credits);

    /* What somebody has riding on a game is his own business and an
       admin's. On anyone else's schedule, and on every schedule when nobody
       is signed in, the column is not drawn at all — an empty column of
       dashes still announces that there is something there to not be shown,
       and there is nothing to announce. */
    if (showBoosters) {
      var slot = el('td', 'num ege-schedule__slot');
      slot.appendChild(stickerSlot(schedulePlayer, game));
      row.appendChild(slot);
    }

    return row;
  }

  function renderSchedule(player) {
    var panel = document.getElementById('schedulePanel');
    var body = document.getElementById('scheduleBody');
    var season = shownSeason();
    var games = EGE.gamesFor(player, season);

    /* Intel is good for the season it was bought in, so an older season on
       the switcher shows no scouts. */
    showScouts = canSeeScouts(player) && season === EGE.currentSeason;
    showBoosters = canSeeStickers(player);

    /* A bracket belongs to a school, so opening somebody else's page puts the
       panel back on his games rather than leaving it on a tournament he is
       not in. A redraw of the same player keeps whichever he chose -- the
       boosters and the inventory land late and draw this again. */
    if (!schedulePlayer || schedulePlayer.slug !== player.slug) {
      scheduleView = 'games';
      var onGames = document.querySelector('.ege-switch__option input[value="games"]');
      if (onGames) { onGames.checked = true; }
    }
    schedulePlayer = player;

    document.getElementById('scheduleBoosterHead').hidden = !showBoosters;

    /* Every row is about to be replaced, so whatever was armed is gone. */
    disarmSticker();

    body.innerHTML = '';
    panel.hidden = false;
    document.getElementById('scheduleTableWrap').hidden = !games.length;
    document.getElementById('scheduleEmpty').hidden = Boolean(games.length);

    if (!games.length) {
      setLegend('scheduleFoot', 'scheduleLegend', '');
      renderBracket(player);
      showScheduleView();
      return;
    }

    /* Nothing is slipped in between two games any more, so the kit's own
       even-row shading lands on every second game and stays there whatever
       the week has done. It used to break the moment a week was published:
       the stat line that dropped open under a finished game was a row of its
       own, and every row after it changed colour. */
    var firstPlayoff = games.filter(function (game) { return game.playoff; })[0];
    games.forEach(function (game) {
      body.appendChild(scheduleRow(game, game === firstPlayoff));
    });

    var conference = games.filter(function (game) { return game.conference; }).length;
    var legend = conference ? '* conference game (' + conference + ' of ' + games.length + ')' : '';

    var playoff = games.filter(function (game) { return game.playoff; }).length;
    if (playoff) {
      legend += (legend ? ' · ' : '') + '** playoff game';
    }

    if (showScouts) {
      var scouted = EGE.scoutedGames(player, season).length;
      legend += (legend ? ' · ' : '') + 'Intel: scouts at ' + scouted + ' games this season';
    }
    setLegend('scheduleFoot', 'scheduleLegend', legend);

    renderBracket(player);
    showScheduleView();
  }


  /* --- the bracket ---------------------------------------------------------

     The same panel as the schedule, showing the other half of the same
     thing: the games are what this player plays, the bracket is what he is
     playing in. A switch in the panel head picks one.

     Laid out on a grid with every box placed by hand, rather than left to a
     column of boxes to space themselves out. A bracket only reads as a
     bracket when a second-round box sits exactly between the two first-round
     boxes that feed it, and "exactly between" is arithmetic, not
     `space-around`: the moment one side has a group heading in it and the
     other does not, an evenly spaced column drifts a row out of line with
     the round beside it.

     So every box knows the rows it spans. A first-round matchup takes two;
     anything later takes the rows of the two matchups that feed it, added
     together. A heading takes one of its own, and because the later rounds
     are built out of the ranges underneath them rather than counted from the
     top, that extra row pushes the whole branch down with it and nothing
     comes apart. */

  var BRACKET_ROUNDS = 4;         /* before the final */

  /* Where every box in the draw goes: the row each first-round matchup
     occupies, and then each later round folded up out of the pair below it.
     Rows are 1-based and the end is exclusive, which is what CSS grid wants
     written as `grid-row: start / end`. */
  function bracketRows(side) {
    var openers = EGE.bracketOpeners(side);
    var rounds = [[]];
    var at = 1;

    openers.forEach(function (opener) {
      if (opener.label) { at += 1; }          /* the heading's own row */
      rounds[0].push({ start: at, end: at + 2, opener: opener });
      at += 2;
    });

    /* Each round after the first is its two feeders, end to end. */
    for (var r = 1; r < BRACKET_ROUNDS; r += 1) {
      var below = rounds[r - 1];
      var here = [];
      for (var i = 0; i + 1 < below.length; i += 2) {
        here.push({ start: below[i].start, end: below[i + 1].end });
      }
      rounds.push(here);
    }

    return { rounds: rounds, height: at - 1 };
  }

  /* One team on one line of a matchup: its seed, its name, and nothing else.
     A slot with no team in it yet is the same line left blank, which is what
     makes an undrawn round read as somewhere a team is going to go rather
     than as a gap. */
  /* One team on one line of a matchup. `result` is the settled matchup it is
     part of, or null while it is still to be played -- it decides whether
     this line is the one that went through and what score sits at the end of
     it. */
  function bracketTeam(team, us, result) {
    var row = el('div', 'ege-seed');
    if (!team) {
      row.classList.add('ege-seed--blank');
      row.appendChild(el('span', 'ege-seed__no'));
      row.appendChild(el('span', 'ege-seed__name'));
      return row;
    }

    if (us && team.name === us) { row.classList.add('ege-seed--us'); }
    /* Two names in these four draws are longer than a first-round box and get
       cut; the title is so the cut one can still be read. */
    row.title = team.name;
    row.appendChild(el('span', 'ege-seed__no', team.seed));
    row.appendChild(el('span', 'ege-seed__name', team.name));

    if (result) {
      var through = result.name === team.name;
      row.classList.add(through ? 'ege-seed--through' : 'ege-seed--out');
      if (typeof result.hi === 'number') {
        row.appendChild(el('span', 'ege-seed__score', through ? result.hi : result.lo));
      }
    }

    return row;
  }

  /* A matchup box. `slot` carries whoever is in it and whatever has been
     settled; a round nobody has reached yet has neither, and draws as the
     dashed outline a team is going to go in. */
  function bracketGame(slot, us) {
    var box = el('div', 'ege-tie');
    var has = slot && (slot.a || slot.b);

    if (!has) {
      box.classList.add('ege-tie--open');
      box.appendChild(bracketTeam(null));
      box.appendChild(bracketTeam(null));
      return box;
    }

    var result = slot.result && !slot.result.bye ? slot.result : null;
    if (slot.result) { box.classList.add('ege-tie--done'); }

    box.appendChild(bracketTeam(slot.a, us, result));

    if (slot.b) {
      box.appendChild(bracketTeam(slot.b, us, result));
    } else if (slot.a) {
      /* A bye is one team and the week off, not a team against nobody. */
      var pass = el('div', 'ege-seed ege-seed--bye');
      pass.appendChild(el('span', 'ege-seed__no'));
      pass.appendChild(el('span', 'ege-seed__name', 'Bye'));
      box.appendChild(pass);
    } else {
      box.appendChild(bracketTeam(null));
    }

    return box;
  }

  /* The heading over a round: what it is called, and the day it is played
     on where the bracket says. */
  function bracketHead(round, className) {
    var cell = el('div', className);
    if (round.date) { cell.appendChild(el('span', 'ege-bracket__when', round.date)); }
    cell.appendChild(el('span', 'ege-bracket__round', round.label));
    return cell;
  }

  /* The whole draw in one direction: every first-round game down the left,
     each round after it one column further right, and the final and the
     champion in the last. Five columns rather than the nine the two halves
     facing each other took, which is what lets it fit the panel on a laptop
     with every name written out rather than making you scroll across it.
     Narrower than that it is still this bracket, shrunk to fit -- see
     fitBracket below. */
  function renderBracket(player) {
    var wrap = document.getElementById('bracketWrap');
    var box = document.getElementById('bracket');
    var state = EGE.bracketState(player, shownSeason());

    box.innerHTML = '';
    if (!state) { return; }
    var bracket = state.bracket;

    box.appendChild(el('div', 'ege-bracket__title', bracket.title));

    var heads = el('div', 'ege-bracket__heads');
    bracket.rounds.forEach(function (round) {
      heads.appendChild(bracketHead(round, 'ege-bracket__head'));
    });
    heads.appendChild(bracketHead(bracket.final, 'ege-bracket__head ege-bracket__head--final'));
    box.appendChild(heads);

    /* Both halves of the draw, top one first. The flat list the bracket's
       state is kept in runs the same way -- the whole left half, then the
       whole right -- so a box's place in its round is its place in there. */
    var plan = bracketRows(bracket.left.concat(bracket.right));
    var draw = el('div', 'ege-bracket__draw');
    draw.style.setProperty('--rows', plan.height);

    plan.rounds.forEach(function (round, r) {
      round.forEach(function (place, at) {
        if (place.opener && place.opener.label) {
          var group = el('div', 'ege-bracket__group', place.opener.label);
          group.style.gridColumn = r + 1;
          group.style.gridRow = (place.start - 1) + ' / ' + place.start;
          draw.appendChild(group);
        }

        var tie = bracketGame(state.rounds[r][at], bracket.us);
        tie.style.gridColumn = r + 1;
        tie.style.gridRow = place.start + ' / ' + place.end;
        draw.appendChild(tie);
      });
    });

    /* The final, and the line under it where a champion goes. Nothing is
       written on it until the last game is published. It spans the whole
       height of the draw so it sits level with the middle of it. */
    var centre = el('div', 'ege-bracket__centre');
    centre.style.gridColumn = BRACKET_ROUNDS + 1;
    centre.style.gridRow = '1 / ' + (plan.height + 1);
    centre.appendChild(bracketGame(state.final, bracket.us));
    var cup = el('div', 'ege-bracket__champion' +
      (state.champion ? ' ege-bracket__champion--crowned' : ''));
    cup.appendChild(el('span', 'ege-bracket__cuplabel', 'Champion'));
    cup.appendChild(el('span', 'ege-bracket__cupname', state.champion || '\u2014'));
    centre.appendChild(cup);
    draw.appendChild(centre);

    box.appendChild(draw);

    /* Only said while the bracket is shrunk small enough to need it. */
    box.appendChild(el('p', 'ege-bracket__hint',
      'Pinch to zoom in, or turn your phone sideways.'));

    wrap.setAttribute('aria-label', bracket.title + ' bracket');
    fitBracket();
  }

  /* A bracket is one shape: five rounds side by side, the first one down the
     left with every team in it. Below a certain width the boxes cannot hold a
     school's name however it wraps, and cutting the columns further only
     turns names into three letters and an ellipsis.

     So the bracket is never laid out narrower than BRACKET_MIN, and on a
     screen narrower than that -- a phone held upright -- the whole thing is
     shrunk to fit instead, the way a picture of it would be. It is all on the
     screen at once and nothing scrolls sideways; pinching in reads it, and a
     phone turned on its side has room for it at full size.

     `zoom` rather than a transform, because zoom shrinks the space the
     bracket takes along with it -- a transform would leave a bracket-sized
     hole under it. A browser without zoom keeps the old behaviour: the panel
     scrolls sideways. */
  /* Wide enough that every column holds the longest single word in any of
     the draws -- "Northwestern", "Willowbrook" -- beside a seed and a score,
     so a name only ever wraps between its words. */
  var BRACKET_MIN = 840;

  function fitBracket() {
    var wrap = document.getElementById('bracketWrap');
    var box = document.getElementById('bracket');
    if (!wrap || wrap.hidden || !box.firstChild) { return; }

    var pad = window.getComputedStyle(wrap);
    var room = wrap.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
    var fitted = room > 0 && room < BRACKET_MIN;

    var scale = room / BRACKET_MIN;
    /* The hint is for a bracket shrunk past easy reading -- a phone held
       upright. Turned on its side it is nine tenths size and says nothing. */
    wrap.classList.toggle('is-fitted', fitted && scale < 0.7);
    box.style.width = fitted ? BRACKET_MIN + 'px' : '';
    box.style.zoom = fitted ? String(scale) : '';

    /* The hint is inside the bracket and shrinks with it, so it is set large
       enough to come out at an ordinary reading size afterwards. */
    var hint = box.querySelector('.ege-bracket__hint');
    if (hint) { hint.style.fontSize = fitted ? (12.5 / scale).toFixed(1) + 'px' : ''; }
  }

  /* --- games or tournament -------------------------------------------------

     Which of the two the panel is showing. It survives a redraw -- the
     boosters and the inventory land after the page is up and draw the
     schedule again -- and goes back to the games when a different player is
     opened, because a bracket is his school's, not the site's. */
  var scheduleView = 'games';

  function showScheduleView() {
    var bracket = schedulePlayer ? EGE.bracketFor(schedulePlayer, shownSeason()) : null;
    var tournament = Boolean(bracket) && scheduleView === 'tournament';

    document.getElementById('scheduleSwitch').hidden = !bracket;
    document.getElementById('bracketWrap').hidden = !tournament;

    /* Everything the games view owns goes away together, the empty note and
       the legend included -- a foot reading "* conference game" under a
       bracket is the schedule talking over it. */
    var games = EGE.gamesFor(schedulePlayer, shownSeason());
    document.getElementById('scheduleTableWrap').hidden = tournament || !games.length;
    document.getElementById('scheduleEmpty').hidden = tournament || Boolean(games.length);
    document.getElementById('scheduleFoot').hidden = tournament ||
      !document.getElementById('scheduleLegend').textContent;

    /* A hidden bracket measures as nothing, so it is fitted the moment it is
       shown rather than when it was drawn. */
    if (tournament) { fitBracket(); }
  }

  document.addEventListener('change', function (event) {
    var input = event.target.closest
      ? event.target.closest('.ege-switch__option input')
      : null;
    if (!input || input.name !== 'scheduleView') { return; }
    scheduleView = input.value;
    showScheduleView();
  });

  /* --- the game log ------------------------------------------------------- */

  /* Which column the log is ordered on, and which way. `key` is null for the
     order the season was played in, which is what it opens on and what it
     goes back to when a third click clears a column.

     It survives a redraw -- the boosts and the inventory land after the page
     is already up and redraw this table -- and is cleared when a different
     player is opened, so nobody arrives on somebody else's sort. */
  var DOWN = 'down';          /* biggest first */
  var UP = 'up';              /* smallest first */

  var logSort = { key: null, dir: DOWN };
  var logPlayer = null;

  /* Every column can be read as a number: the worked-out ones are filled in
     by statline.complete before they get here, and C/ATT sorts on the
     completions it leads with. A column with nothing in it -- an average
     with no attempts behind it -- sorts to the bottom either way, because
     the alternative is a blank row at the top of a table somebody has just
     asked to be shown the best of. */
  function sortValue(stats, key) {
    var value = stats ? stats[key] : null;
    return typeof value === 'number' ? value : null;
  }

  function byColumn(position, key, dir) {
    return function (a, b) {
      if (key === 'week') { return dir === DOWN ? b.week - a.week : a.week - b.week; }

      var left = sortValue(EGE.statline.complete(position, a.stats), key);
      var right = sortValue(EGE.statline.complete(position, b.stats), key);
      /* Two equal numbers keep the order the season was played in, so a
         sorted table never shuffles rows with nothing to separate them. */
      if (left === right) { return a.week - b.week; }
      if (left === null) { return 1; }
      if (right === null) { return -1; }
      return dir === DOWN ? right - left : left - right;
    };
  }

  /* The arrow that says which way a sorted column is running, drawn in the
     heading itself so the column and its state are never a guess. */
  function sortMark(dir) {
    return el('span', 'ege-sort__mark', dir === DOWN ? '▼' : '▲');
  }

  /* A heading that sorts the table it is in. Biggest first on the first
     click, whatever the column: what a stat table gets asked is who had the
     best day, not the worst. */
  function sortableHead(label, key, title, className) {
    var sorted = logSort.key === key;
    var th = el('th', (className ? className + ' ' : '') + 'is-sortable' +
      (sorted ? ' is-sorted' : ''));

    var button = el('button', 'ege-sort', label);
    button.type = 'button';
    button.dataset.sortKey = key;
    if (title) { button.title = title; }
    if (sorted) { button.appendChild(sortMark(logSort.dir)); }

    th.appendChild(button);
    return th;
  }

  /* Every game played, under the columns this position is read in. The
     columns come from data/statline.js, so this table and the Discord post
     are never two different opinions about what a stat line is. */
  function renderGameLog(player) {
    var panel = document.getElementById('gameLogPanel');
    var season = shownSeason();
    var played = EGE.gamesPlayed(player, season);

    if (logPlayer !== player.slug) {
      logPlayer = player.slug;
      logSort = { key: null, dir: DOWN };
    }

    panel.hidden = !played.length;
    if (!played.length) { return; }

    var columns = EGE.statline.lineFor(player.position);
    var head = document.getElementById('gameLogHead');
    var body = document.getElementById('gameLogBody');
    var foot = document.getElementById('gameLogTotals');
    head.innerHTML = '';
    body.innerHTML = '';
    foot.innerHTML = '';

    head.appendChild(sortableHead('Wk', 'week', 'Week'));
    head.appendChild(el('th', null, 'Opponent'));
    head.appendChild(el('th', 'num', 'Result'));
    columns.forEach(function (column) {
      head.appendChild(sortableHead(column.label, column.key, column.title, 'num'));
    });

    /* Where the sorted column falls, counted from the left. Wk is the first
       of the three fixed columns; a stat column comes after all three. */
    var sortedAt = -1;
    if (logSort.key === 'week') {
      sortedAt = 0;
    } else if (logSort.key) {
      columns.forEach(function (column, at) {
        if (column.key === logSort.key) { sortedAt = at + 3; }
      });
    }

    var order = played.slice();
    if (logSort.key) { order.sort(byColumn(player.position, logSort.key, logSort.dir)); }

    order.forEach(function (game) {
      var row = el('tr');
      row.appendChild(el('td', 'ege-schedule__week', game.week));

      var opponent = el('td', 'ege-gamelog__opponent');
      opponent.appendChild(el('span', 'ege-schedule__side', game.home ? 'vs' : 'at'));
      opponent.appendChild(el('span', 'fb-name', game.opponent));

      /* A booster is the player's own business, and an admin's. It shows here
         under the same rule the stickers on the schedule follow. */
      var booster = EGE.boosterOn(player, game);
      if (booster && canSeeStickers(player)) {
        var mark = el('abbr', 'ege-gamelog__boost', booster.multiplier + 'x');
        mark.title = booster.name + ' was on this game';
        opponent.appendChild(mark);
      }
      row.appendChild(opponent);

      var won = game.result.teamScore > game.result.opponentScore;
      var result = el('td', 'num');
      result.appendChild(el('span', 'fb-tag fb-tag--num ' + (won ? 'fb-tag--sage' : 'fb-tag--clay'),
        (won ? 'W ' : 'L ') + game.result.teamScore + '–' + game.result.opponentScore +
        (game.overtime ? '/OT' : '')));
      row.appendChild(result);

      var stats = EGE.statline.complete(player.position, game.stats) || {};
      columns.forEach(function (column) {
        row.appendChild(el('td', 'num', column.text(stats)));
      });
      body.appendChild(row);
    });

    /* The totals row works each column out the way that column adds up: a
       long is the longest, and a rating is worked out again from the season's
       numbers rather than averaged across games. It is the season, so it is
       the same line however the games above it are ordered. */
    var totals = EGE.statline.totalLine(player.position, played.map(function (game) {
      return EGE.statline.complete(player.position, game.stats);
    }));

    var label = el('td', null, 'Season');
    label.colSpan = 3;
    foot.appendChild(label);
    columns.forEach(function (column) {
      var cell = el('td', 'num');
      cell.appendChild(el('strong', null, EGE.statline.show(totals.columns[column.key])));
      foot.appendChild(cell);
    });

    markSortedColumn(sortedAt);

    setLegend('gameLogFoot', 'gameLogLegend', '');
  }

  /* The sorted column, shaded down the whole table rather than only in its
     heading, so the eye can follow the numbers it was sorted on.

     The totals row runs one label across the three fixed columns, so a stat
     column sits two cells further left down there than it does in the body,
     and the week has no cell of its own in it at all. */
  function markSortedColumn(at) {
    var table = document.querySelector('.ege-gamelog');
    Array.prototype.forEach.call(table.querySelectorAll('.is-sorted-cell'),
      function (cell) { cell.classList.remove('is-sorted-cell'); });
    if (at < 0) { return; }

    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (row) {
      if (row.children[at]) { row.children[at].classList.add('is-sorted-cell'); }
    });

    if (at < 3) { return; }
    var totals = document.getElementById('gameLogTotals');
    if (totals.children[at - 2]) { totals.children[at - 2].classList.add('is-sorted-cell'); }
  }

  /* One listener on the heading row: the headings are redrawn on every sort,
     and a listener per heading would be left behind by that. Clicking the
     column that is already sorted turns it around, and clicking it once more
     puts the season back in the order it was played in. */
  document.getElementById('gameLogHead').addEventListener('click', function (event) {
    var button = event.target.closest('.ege-sort');
    if (!button) { return; }

    var key = button.dataset.sortKey;
    if (logSort.key !== key) {
      logSort = { key: key, dir: DOWN };
    } else if (logSort.dir === DOWN) {
      logSort = { key: key, dir: UP };
    } else {
      logSort = { key: null, dir: DOWN };
    }

    if (schedulePlayer) { renderGameLog(schedulePlayer); }
  });

  /* --- panel feet and the fold-away arrow ---------------------------------- */

  /* A foot with nothing written in it is a band of empty cream under a hard
     rule, which reads as something that failed to load. It goes away with
     its text. */
  function setLegend(footId, legendId, text) {
    document.getElementById(legendId).textContent = text;
    document.getElementById(footId).hidden = !text;
  }

  /* Schedule and game log fold away; the ratings do not, because the overall
     in the corner of that one is the number the page is about.

     The arrow is the only thing in those heads now -- what used to be
     written up there said what the table underneath already says. */
  document.addEventListener('click', function (event) {
    var button = event.target.closest('.ege-collapse');
    if (!button) { return; }

    var panel = document.getElementById(button.dataset.collapses);
    if (!panel) { return; }

    var open = button.getAttribute('aria-expanded') !== 'false';
    button.setAttribute('aria-expanded', open ? 'false' : 'true');
    panel.classList.toggle('is-collapsed', open);

    /* The arrow has no words in it, so what it does has to be said here --
       and what it does is the opposite of what it did a moment ago. */
    var heading = panel.querySelector('.fb-panel__head h3');
    button.setAttribute('aria-label', (open ? 'Show the ' : 'Hide the ') +
      (heading ? heading.textContent.toLowerCase() : 'panel'));
  });

  /* --- ratings ---------------------------------------------------------- */

  var ratingsPanel = document.getElementById('ratingsPanel');

  /* A stock ticker for a rating: which way it has gone since the live
     season began, and by how much. Up is green with the arrow climbing, down
     is the deep orange with it falling, and a number that has not moved gets
     a flat line and a zero -- still drawn, so "nothing yet" reads as an
     answer rather than as something missing. */
  function tickerEl(change, modifier) {
    var way = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    var ticker = el('span', 'ege-ticker ege-ticker--' + way + (modifier ? ' ' + modifier : ''));
    var mark = el('span', 'ege-ticker__mark');
    mark.setAttribute('aria-hidden', 'true');
    ticker.appendChild(mark);
    ticker.appendChild(el('span', 'ege-ticker__num',
      change > 0 ? '+' + change : change < 0 ? '\u2212' + Math.abs(change) : '0'));
    return ticker;
  }

  function tickerTitle(change, from, to) {
    var season = EGE.currentSeason + ' season';
    if (!change) { return 'No change since the ' + season + ' began (' + to + ')'; }
    return (change > 0 ? 'Up ' : 'Down ') + Math.abs(change) + ' since the ' + season +
      ' began (' + from + ' \u2192 ' + to + ')';
  }

  /* How full a meter is, as a share of the 1-99 scale. */
  function meterShare(value) {
    return Math.max(0, Math.min(100, value)) + '%';
  }

  function buildGroup(group) {
    var box = el('div', 'ege-group');

    var head = el('div', 'ege-group__head');
    head.appendChild(el('span', 'ege-group__label', group.label));
    var score = el('span', 'ege-group__score');
    var moved = typeof group.ratingStart === 'number' ? group.rating - group.ratingStart : 0;
    if (moved) {
      var ticker = tickerEl(moved, 'ege-ticker--sm');
      ticker.title = tickerTitle(moved, group.ratingStart, group.rating);
      score.appendChild(ticker);
    }
    score.appendChild(el('span', 'ege-group__value', group.rating));
    head.appendChild(score);
    box.appendChild(head);

    var list = el('div');
    group.attributes.forEach(function (attr) {
      var row = el('div', 'ege-attr');
      var start = typeof attr.start === 'number' ? attr.start : attr.value;
      var change = attr.value - start;

      row.appendChild(el('span', 'ege-attr__label', attr.label));

      /* The bar is where the number stood when the season began, and the
         climb since then is laid on the end of it in orange -- the season's
         gain, drawn as part of the bar rather than as a second one. */
      var meter = el('div', 'fb-meter ege-meter');
      var fill = el('div', 'ege-meter__fill');
      fill.style.width = meterShare(Math.min(start, attr.value));
      meter.appendChild(fill);
      if (change > 0) {
        var gain = el('div', 'ege-meter__gain');
        gain.style.left = meterShare(start);
        gain.style.width = meterShare(change);
        meter.appendChild(gain);
      }
      row.appendChild(meter);

      row.appendChild(el('span', 'ege-attr__value', attr.value));

      /* Only where something moved: a column of zeroes down every group
         would bury the handful that did. The slot is kept either way so the
         numbers stay in one column. */
      var slot = el('span', 'ege-attr__ticker');
      if (change) {
        var small = tickerEl(change, 'ege-ticker--xs');
        small.title = tickerTitle(change, start, attr.value);
        slot.appendChild(small);
      }
      row.appendChild(slot);

      list.appendChild(row);
    });
    box.appendChild(list);

    return box;
  }

  function renderRatings(player) {
    var ratings = EGE.ratingsFor(player);
    var holder = document.getElementById('ratingsGroups');
    holder.innerHTML = '';

    if (!ratings) { ratingsPanel.hidden = true; return; }

    document.getElementById('ratingsOverall').textContent =
      ratings.overall === null ? '\u2014' : ratings.overall;

    /* The ticker in the head: the overall's climb over the live season. */
    var slot = document.getElementById('ratingsTicker');
    slot.innerHTML = '';
    var canTick = typeof ratings.overall === 'number' && typeof ratings.overallStart === 'number';
    slot.hidden = !canTick;
    if (canTick) {
      var change = ratings.overall - ratings.overallStart;
      var ticker = tickerEl(change);
      slot.className = ticker.className + ' ege-ticker--lg';
      while (ticker.firstChild) { slot.appendChild(ticker.firstChild); }
      slot.appendChild(el('span', 'ege-ticker__since', 'This season'));
      slot.title = tickerTitle(change, ratings.overallStart, ratings.overall);
    }

    ratings.groups.forEach(function (group) { holder.appendChild(buildGroup(group)); });
    ratingsPanel.hidden = false;
  }

  /* --- shop ------------------------------------------------------------- */

  var sayShop = reporter('shopMessage');
  var shopState = { player: null, credits: 0, inventory: [], built: false };

  /* Scouts are in the schedule data all along; Intel is what lets a player
     see them, and only on their own page, for the season they bought it. */
  function canSeeScouts(player) {
    var signedIn = EGE.auth.currentPlayer();
    if (!signedIn || !player || signedIn.slug !== player.slug) { return false; }
    return EGE.wallet.hasIntel(shopState.inventory);
  }

  function coinEl() {
    var coin = el('span', 'ege-coin');
    coin.setAttribute('role', 'img');
    coin.setAttribute('aria-label', 'credits');
    return coin;
  }

  /* A number of credits with the coin after it, as one unbreakable run. The
     coin carries the unit, so this reads 40 (coin) rather than 40 cr -- and
     being a mask it comes out in whatever ink surrounds it, gold on the dark
     nav and black on the gold chip. */
  function priceText(credits, className) {
    var price = el('span', 'ege-price' + (className ? ' ' + className : ''),
      String(credits));
    price.appendChild(coinEl());
    return price;
  }

  function creditTag(credits) {
    var tag = el('span', 'fb-tag fb-tag--num fb-tag--gold');
    tag.appendChild(priceText(credits));
    return tag;
  }

  function targetLabel(key) {
    var found = EGE.ratingGroups
      .reduce(function (all, group) { return all.concat(group.attributes); }, [])
      .filter(function (attr) { return attr.key === key; })[0];
    return found ? found.label : key;
  }

  /* --- the catalogue ----------------------------------------------------- */

  /* Cards whose price is not fixed, so refreshShop can put the new one on
     them: an offseason workout costs twice what the last one did. */
  var stackedCards = [];

  function buildShopItem(item) {
    var card = el('div', 'ege-item');

    var head = el('div', 'ege-item__head');
    head.appendChild(el('h4', 'ege-item__name', EGE.itemName(item, shopState.player)));
    var tag = creditTag(EGE.priceFor(item, ownedNow(item)));
    head.appendChild(tag);
    card.appendChild(head);

    /* What the next one will cost, and why. Written from the item rather
       than into its description, so the prose and the price can never drift
       apart. */
    var stackNote = null;
    if (item.creditsStack) {
      stackNote = el('p', 'fb-meta ege-item__stack');
      card.appendChild(stackNote);
      stackedCards.push({ item: item, tag: tag, note: stackNote, head: head });
    }

    /* A booster is a sticker, and a sticker is the whole appeal of it. The
       card shows the thing itself rather than describing it — the same
       element the drawer and the schedule draw, at the same size the drawer
       uses. Seeded on the item key so every 2.5x in the shop sits at the same
       angle, which is what makes it read as a product shot rather than as one
       that has already been stuck somewhere. */
    if (STICKER_LOOK[item.key]) {
      var show = el('div', 'ege-item__sticker');
      show.appendChild(stickerEl(item.key, 76, item.key));
      card.appendChild(show);
    } else if (item.icon) {
      /* Everything else with a picture shows it in the same frame, so the
         shop reads as a shelf of things rather than a wall of paragraphs. */
      var frame = el('div', 'ege-item__sticker ege-item__icon');
      var icon = el('img');
      icon.src = item.icon;
      icon.alt = '';
      icon.width = 76;
      icon.height = 76;
      icon.loading = 'lazy';
      frame.appendChild(icon);
      card.appendChild(frame);
    }

    if (item.note) { card.appendChild(el('span', 'fb-tag fb-tag--outline', item.note)); }
    var description = EGE.itemDescription(item, shopState.player);
    if (description) { card.appendChild(el('p', 'ege-item__text', description)); }

    var picker = null;
    var allowed = EGE.itemAvailable(item, EGE.currentSeason);
    if (!allowed.ok) {
      card.classList.add('ege-item--locked');
      card.appendChild(el('p', 'ege-item__blocked', allowed.reason));
    }

    var buy = el('button', 'fb-btn fb-btn--primary fb-btn--block',
      allowed.ok ? 'Buy' : 'Unavailable');
    buy.type = 'button';
    buy.disabled = !allowed.ok;
    if (picker) { picker.disabled = !allowed.ok; }
    buy.addEventListener('click', function () {
      buy.disabled = true;
      sayShop('Buying\u2026', false);
      EGE.wallet.buy(shopState.player.email, item, null, shopState.player)
        .then(function (res) {
          buy.disabled = false;
          sayShop(res.message, !res.ok);
          if (res.ok) { refreshShop(); }
        });
    });
    card.appendChild(buy);

    return card;
  }

  function buildShopSection(section) {
    var panel = el('div', 'fb-panel ege-section-gap');

    var head = el('div', 'fb-panel__head');
    head.appendChild(el('h3', null, section.title));
    panel.appendChild(head);

    var body = el('div', 'fb-panel__body fb-stack fb-stack--lg');
    if (section.blurb) { body.appendChild(el('p', 'ege-item__text', section.blurb)); }

    if (section.upgrades) {
      body.appendChild(buildUpgrades());
      /* Any section that asks to be drawn in here -- the offseason workouts
         -- goes in the same box, under the points table. */
      EGE.shop.sections.filter(function (other) {
        return other.panel === section.key;
      }).forEach(function (other) {
        var extra = el('div', 'ege-items ege-items--joined');
        other.items.forEach(function (item) { extra.appendChild(buildShopItem(item)); });
        body.appendChild(extra);
      });
    } else {
      var grid = el('div', 'ege-items');
      section.items.forEach(function (item) { grid.appendChild(buildShopItem(item)); });
      body.appendChild(grid);
    }

    panel.appendChild(body);
    return panel;
  }

  /* Rating points get a table: every attribute this position is judged on,
     what it is at, and what the next point costs. Buying redraws it, because
     the next point always costs a little more. */
  var upgradesBody = null;

  function upgradeRow(row) {
    var tr = el('tr');

    tr.appendChild(el('td', 'ege-upgrade__group', row.group));
    tr.appendChild(el('td', null, row.label));

    var value = el('td', 'num');
    value.appendChild(el('strong', null, row.value));
    if (row.base !== row.value) {
      var moved = row.value - row.base;
      value.appendChild(el('span', 'ege-upgrade__moved', ' ' + (moved > 0 ? '+' : '') + moved));
    }
    tr.appendChild(value);

    var meter = el('td');
    var bar = el('div', 'fb-meter');
    var fill = el('div', 'fb-meter__fill' + (row.value >= 80 ? '' : ' fb-meter__fill--alt'));
    fill.style.width = Math.max(0, Math.min(100, row.value)) + '%';
    bar.appendChild(fill);
    meter.appendChild(bar);
    tr.appendChild(meter);

    var per = el('td', 'num');
    per.appendChild(el('span', 'ege-upgrade__per', row.pointsPerOverall || '\u2014'));
    tr.appendChild(per);

    /* One button per size: a point, two points, four. */
    EGE.economy.BULK_SIZES.forEach(function (points) {
      var cell = el('td', 'num');

      if (row.cost === null) {
        cell.appendChild(el('span', 'fb-tag fb-tag--outline', points === 1 ? 'Maxed' : ''));
        tr.appendChild(cell);
        return;
      }

      var buying = EGE.economy.pointsAvailable(row.value, points);
      var price = EGE.economy.bulkCost(row.value, buying);

      var buy = el('button', 'fb-btn ege-upgrade__buy' + (points === 1 ? ' fb-btn--primary' : ''));
      buy.type = 'button';
      buy.appendChild(el('span', null, '+' + points));
      buy.appendChild(priceText(price, 'ege-upgrade__price'));
      buy.disabled = shopState.credits < price;
      buy.title = buying < points
        ? 'Only ' + buying + ' left below ' + EGE.economy.MAX_RATING
        : row.label + ' ' + row.value + ' \u2192 ' + (row.value + buying) + ' for ' + price + ' credits';
      buy.addEventListener('click', function () {
        buy.disabled = true;
        sayShop('Buying\u2026', false);
        EGE.wallet.buyUpgrade(shopState.player.email, shopState.player, row.key, points)
          .then(function (res) {
            sayShop(res.message, !res.ok);
            refreshShop();
          });
      });
      cell.appendChild(buy);
      tr.appendChild(cell);
    });

    return tr;
  }

  function buildUpgrades() {
    var wrap = el('div', 'fb-tablewrap');
    var table = el('table', 'fb-table ege-upgrades');

    var head = el('thead');
    var headRow = el('tr');
    ['Group', 'Attribute', 'Rating', '', 'Points per +1 OVR', 'Next point', '', '']
      .forEach(function (label, i) {
        headRow.appendChild(el('th', i >= 2 ? 'num' : null, label));
      });
    head.appendChild(headRow);
    table.appendChild(head);

    upgradesBody = el('tbody');
    table.appendChild(upgradesBody);
    wrap.appendChild(table);

    refreshUpgrades();
    return wrap;
  }

  /* How many of this item the player is holding right now. */
  function ownedNow(item) {
    return EGE.timesBought(shopState.inventory, item.key);
  }

  /* The price on a stacking card, and the sentence under it, after anything
     has been bought or cleared. */
  function refreshStackedPrices() {
    stackedCards.forEach(function (card) {
      var owned = ownedNow(card.item);
      var price = EGE.priceFor(card.item, owned);

      var fresh = creditTag(price);
      card.head.replaceChild(fresh, card.tag);
      card.tag = fresh;

      /* The chip is what this one costs, so the sentence is about the one
         after it -- saying "the next one" of a price already on the card is
         how it reads as though the chip were wrong. */
      var after = EGE.priceFor(card.item, owned + 1);
      var times = owned === 1 ? 'once' : (owned === 2 ? 'twice' : owned + ' times');

      card.note.textContent = owned
        ? 'Bought ' + times + ' this offseason. The one after this costs ' + after + '.'
        : 'Twice the price each time you buy it \u2014 the one after this costs ' +
          after + '.';
    });
  }

  function refreshUpgrades() {
    if (!upgradesBody || !shopState.player) { return; }
    upgradesBody.innerHTML = '';
    EGE.economy.upgradePlan(shopState.player).forEach(function (row) {
      upgradesBody.appendChild(upgradeRow(row));
    });
  }

  /* --- the inventory ----------------------------------------------------- */

  function inventoryCard(row, options) {
    var lapsed = EGE.wallet.lapsed(row);
    var live = row.active && !lapsed;
    var quantity = EGE.wallet.quantityOf(row);
    var isUpgrade = row.item_key === 'upgrade';
    var card = el('div', 'ege-item' + (live ? ' ege-item--active' : '') +
      (lapsed ? ' ege-item--locked' : ''));

    /* Points read as what they are: Catching +5. Everything else keeps its
       name and carries a count when there is more than one. */
    /* Nothing says "In effect": owning a thing is what puts it in effect. A
       tag is only for what is not -- expired, switched off, unused. */
    var workout = isWorkout(row) && !isUpgrade;
    var state = isUpgrade
      ? '+' + quantity
      : (lapsed ? 'Expired' : (row.consumable ? 'Unused' : (row.active || workout ? null : 'Off')));

    var head = el('div', 'ege-item__head');
    var item = EGE.shopItem(row.item_key);
    var title = el('div', 'ege-item__title');
    if (item && item.icon) {
      var icon = el('img', 'ege-item__mini');
      icon.src = item.icon;
      icon.alt = '';
      title.appendChild(icon);
    }
    title.appendChild(el('h4', 'ege-item__name',
      row.item_name + (!isUpgrade && quantity > 1 ? ' \u00d7' + quantity : '')));
    head.appendChild(title);
    if (state) {
      head.appendChild(el('span', 'fb-tag fb-tag--num ' +
        (lapsed ? 'fb-tag--clay' : 'fb-tag--outline'), state));
    }
    card.appendChild(head);

    if (typeof row.season === 'number') {
      card.appendChild(el('p', 'ege-item__text', lapsed
        ? 'Bought for the ' + row.season + ' season, which is over.'
        : 'Good for the ' + row.season + ' season only.'));
    }

    /* What a thing did to the ratings is not written on the thing. Every
       point bought is already in "Applied to your ratings" at the top of the
       panel, added up per attribute, which is the number a player actually
       wants -- and repeating it card by card only made the same sum harder
       to read. An admin still sees it, because an admin is looking at
       somebody else's inventory and has no summary of it. */
    if (options.admin && isUpgrade) {
      card.appendChild(el('p', 'ege-item__text',
        (row.credits || 0) + ' credits spent, all of it in the rating.'));
    } else if (options.admin && row.effects && Object.keys(row.effects).length) {
      card.appendChild(el('p', 'ege-item__text', Object.keys(row.effects).map(function (attr) {
        return targetLabel(attr) + ' ' + (row.effects[attr] > 0 ? '+' : '') + row.effects[attr];
      }).join(', ')));
    }

    var actions = el('div', 'fb-row fb-row--wrap');

    if (isUpgrade) {
      if (options.admin) {
        var minus = el('button', 'fb-btn', '\u22121');
        minus.type = 'button';
        minus.title = 'Take one point back';
        minus.addEventListener('click', function () {
          minus.disabled = true;
          EGE.wallet.decrement(row).then(function (res) {
            options.report(res.message, !res.ok);
            options.refresh();
          });
        });
        actions.appendChild(minus);
      }
    } else if (row.consumable) {
      /* A booster is used by putting it on a game, which happens on the
         player's own schedule. Spending one from here never said which game
         it was for, so it does not belong here at all. */
      var where = el('span', 'fb-meta ege-item__where',
        'Use it on your player page \u2014 the + beside a game on your schedule.');
      actions.appendChild(where);
    } else if (!lapsed && !workout) {
      var toggle = el('button', 'fb-btn', row.active ? 'Turn off' : 'Turn on');
      toggle.type = 'button';
      toggle.addEventListener('click', function () {
        toggle.disabled = true;
        EGE.wallet.setActive(row, !row.active).then(function (res) {
          options.report(res.message, !res.ok);
          options.refresh();
        });
      });
      actions.appendChild(toggle);
    }

    if (options.admin) {
      var remove = el('button', 'fb-btn fb-btn--ghost', 'Remove');
      remove.type = 'button';
      remove.addEventListener('click', function () {
        remove.disabled = true;
        EGE.wallet.removeItem(row).then(function (res) {
          options.report(res.message, !res.ok);
          options.refresh();
        });
      });
      actions.appendChild(remove);
    }

    card.appendChild(actions);
    return card;
  }

  /* Everything a player's purchases add up to, attribute by attribute. */
  function boostSummary(rows) {
    var totals = {};
    rows.forEach(function (row) {
      if (EGE.wallet.lapsed(row) || !row.effects) { return; }
      Object.keys(row.effects).forEach(function (attr) {
        totals[attr] = (totals[attr] || 0) + row.effects[attr];
      });
    });
    return totals;
  }

  function buildBoostSummary(totals) {
    var keys = Object.keys(totals).filter(function (key) { return totals[key] !== 0; });
    if (!keys.length) { return null; }

    keys.sort(function (a, b) { return totals[b] - totals[a]; });

    var box = el('div', 'ege-applied');
    box.appendChild(el('span', 'fb-eyebrow', 'Applied to your ratings'));

    var list = el('div', 'fb-row fb-row--wrap');
    keys.forEach(function (key) {
      var up = totals[key] > 0;
      list.appendChild(el('span', 'fb-tag fb-tag--num ' + (up ? 'fb-tag--sage' : 'fb-tag--clay'),
        targetLabel(key) + ' ' + (up ? '+' : '') + totals[key]));
    });
    box.appendChild(list);
    return box;
  }

  /* --- what a player owns, on one line --------------------------------------

     Under "Applied to your ratings": the boosters as their stickers, then
     everything else as its shop icon, each with how many are held boxed on
     its corner. A workout bought three times is one icon with 3X on it, and
     Intel is its own switch -- tap it to turn it on or off. */

  function ownedStickers(rows, line) {
    var counts = {};
    rows.filter(isShelved).forEach(function (row) {
      counts[row.item_key] = (counts[row.item_key] || 0) + EGE.wallet.quantityOf(row);
    });

    /* Biggest multiplier first, the order the shop sells them in. */
    Object.keys(STICKER_LOOK).filter(function (key) {
      return counts[key] > 0;
    }).forEach(function (key) {
      var item = EGE.shopItem(key);
      var slot = el('div', 'ege-owned__thing');
      slot.title = counts[key] + ' \u00d7 ' + (item ? item.name : key);
      slot.setAttribute('aria-label', slot.title);
      slot.appendChild(stickerEl(key, 52, key));
      slot.appendChild(el('span', 'ege-shelf__count', counts[key] + 'X'));
      line.appendChild(slot);
    });
  }

  function ownedThing(rows) {
    var row = rows[0];
    var item = EGE.shopItem(row.item_key);
    var lapsed = EGE.wallet.lapsed(row);
    var switchable = !isWorkout(row) && !lapsed;
    var off = switchable && !row.active;
    var count = rows.reduce(function (sum, one) { return sum + EGE.wallet.quantityOf(one); }, 0);

    var thing = el(switchable ? 'button' : 'div',
      'ege-owned__thing ege-owned__item' + (lapsed ? ' is-expired' : (off ? ' is-off' : '')));
    var label = row.item_name +
      (count > 1 ? ' \u00d7' + count : '') +
      (lapsed ? ' \u2014 expired' : '') +
      (switchable ? (row.active ? ' \u2014 on, tap to turn off' : ' \u2014 off, tap to turn on') : '');
    thing.title = label;
    thing.setAttribute('aria-label', label);

    if (item && item.icon) {
      var icon = el('img', 'ege-owned__icon');
      icon.src = item.icon;
      icon.alt = '';
      thing.appendChild(icon);
    } else {
      thing.appendChild(el('span', 'ege-owned__word', row.item_name));
    }
    if (count > 1) { thing.appendChild(el('span', 'ege-shelf__count', count + 'X')); }
    if (off || lapsed) { thing.appendChild(el('span', 'ege-owned__flag', lapsed ? 'Expired' : 'Off')); }

    if (switchable) {
      thing.type = 'button';
      thing.addEventListener('click', function () {
        thing.disabled = true;
        EGE.wallet.setActive(row, !row.active).then(function (res) {
          sayShop(res.message, !res.ok);
          refreshShop();
        });
      });
    }
    return thing;
  }

  function ownedItems(rows, line) {
    var groups = [];
    var byKey = {};
    rows.filter(function (row) { return !isShelved(row); }).forEach(function (row) {
      if (isWorkout(row)) {
        if (!byKey[row.item_key]) { byKey[row.item_key] = []; groups.push(byKey[row.item_key]); }
        byKey[row.item_key].push(row);
      } else {
        groups.push([row]);
      }
    });
    groups.forEach(function (group) { line.appendChild(ownedThing(group)); });
  }

  function isShelved(row) {
    return Boolean(row.consumable && STICKER_LOOK[row.item_key]);
  }

  /* A workout is a permanent part of the ratings once it is bought: there is
     nothing to switch off, so it has no switch and says nothing about being
     in effect. */
  function isWorkout(row) {
    return Boolean(row.effects && Object.keys(row.effects).length);
  }

  function renderInventory() {
    var holder = document.getElementById('inventoryItems');
    var applied = document.getElementById('inventoryApplied');
    holder.innerHTML = '';
    applied.innerHTML = '';

    document.getElementById('shopBalance').textContent = shopState.credits;

    var summary = buildBoostSummary(boostSummary(shopState.inventory));
    if (summary) { applied.appendChild(summary); }

    /* Rating points are not kept as things -- "Applied to your ratings"
       above says what they add up to, per attribute. What is left is what is
       actually an item. */
    var things = shopState.inventory.filter(function (row) {
      return row.item_key !== 'upgrade';
    });

    document.getElementById('inventoryEmpty').hidden = things.length > 0 || Boolean(summary);

    holder.hidden = !things.length;
    ownedStickers(things, holder);
    ownedItems(things, holder);
  }

  /* --- admin ------------------------------------------------------------- */

  var sayAdmin = reporter('adminMessage');
  var adminState = { credits: [], inventory: [], awards: [], ratingsDownloaded: false };

  function isAdmin() { return EGE.wallet.admin(); }

  /* One account: what it holds, what it has been paid, and the two things an
     admin does to it by hand — set a balance, or hand something over. */
  function adminAccount(player, credits, rows) {
    var box = el('div', 'ege-account');

    var head = el('div', 'ege-account__head');
    var who = el('div', 'ege-who');
    var photo = el('img', 'ege-avatar ege-avatar--sm');
    photo.src = player.headshot;
    photo.alt = '';
    who.appendChild(photo);
    who.appendChild(el('span', 'ege-account__name', player.name));
    head.appendChild(who);

    var editor = el('div', 'fb-row');
    var input = el('input', 'fb-input ege-account__credits');
    input.type = 'number';
    input.min = '0';
    input.value = credits;
    input.setAttribute('aria-label', 'Credits for ' + player.name);
    editor.appendChild(input);

    var save = el('button', 'fb-btn fb-btn--primary', 'Save');
    save.type = 'button';
    save.addEventListener('click', function () {
      save.disabled = true;
      EGE.wallet.setCredits(player.email, input.value).then(function (res) {
        save.disabled = false;
        sayAdmin(res.ok ? player.first + ' now has ' + res.credits + ' credits.' : res.message, !res.ok);
        refreshAdminView();
      });
    });
    editor.appendChild(save);
    head.appendChild(editor);
    box.appendChild(head);

    /* An award off the earnings table, added straight onto the balance.
       Nothing is logged: it is the credits that matter, not a record of how
       they got there. The offseason 60 is not offered -- it pays itself. */
    var awarder = el('div', 'fb-row fb-row--wrap');
    var reason = el('select', 'fb-select ege-account__award');
    EGE.shop.earnings.filter(function (row) { return !row.automatic; }).forEach(function (row) {
      var opt = el('option', null, row.label + '  +' + row.credits);
      opt.value = row.credits + '|' + row.label;
      reason.appendChild(opt);
    });
    awarder.appendChild(reason);

    var pay = el('button', 'fb-btn', 'Award');
    pay.type = 'button';
    pay.addEventListener('click', function () {
      var parts = reason.value.split('|');
      pay.disabled = true;
      EGE.wallet.awardCredits(player.email, parts[0]).then(function (res) {
        pay.disabled = false;
        sayAdmin(res.ok ? player.first + ': ' + res.message : res.message, !res.ok);
        refreshAdminView();
      });
    });
    awarder.appendChild(pay);
    box.appendChild(awarder);

    /* Hand something over without charging for it. */
    var granter = el('div', 'fb-row fb-row--wrap');
    var pick = el('select', 'fb-select ege-account__grant');
    EGE.shopItems().forEach(function (entry) {
      var opt = el('option', null, entry.item.name);
      opt.value = entry.item.key;
      pick.appendChild(opt);
    });
    granter.appendChild(pick);

    var give = el('button', 'fb-btn', 'Grant');
    give.type = 'button';
    give.addEventListener('click', function () {
      give.disabled = true;
      EGE.wallet.grant(player.email, EGE.shopItem(pick.value)).then(function (res) {
        give.disabled = false;
        sayAdmin(res.message, !res.ok);
        refreshAdminView();
      });
    });
    granter.appendChild(give);
    box.appendChild(granter);

    if (!rows.length) {
      box.appendChild(el('p', 'fb-meta', 'Nothing bought.'));
    } else {
      var grid = el('div', 'ege-items');
      rows.forEach(function (row) {
        grid.appendChild(inventoryCard(row, { admin: true, report: sayAdmin, refresh: refreshAdminView }));
      });
      box.appendChild(grid);
    }

    return box;
  }

  function renderAccounts() {
    var holder = document.getElementById('adminAccounts');
    holder.innerHTML = '';

    EGE.playersWithAccounts().forEach(function (player) {
      var row = adminState.credits.filter(function (c) { return c.email === player.email; })[0];
      var owned = adminState.inventory.filter(function (i) { return i.email === player.email; });
      holder.appendChild(adminAccount(player, row ? row.credits : EGE.shop.startingCredits,
                                     owned));
    });
  }

  /* --- what the season has paid out --------------------------------------- */

  function awardKind(row) {
    if (/^td-w/.test(row.award_key)) { return 'td'; }
    if (/^offseason-/.test(row.award_key)) { return 'offseason'; }
    return 'manual';
  }

  function renderAwards() {
    var body = document.getElementById('awardsBody');
    body.innerHTML = '';

    var totals = { all: 0, touchdowns: 0, games: 0, waiting: 0 };
    var fantasySeason = EGE.economy.paysFantasy(EGE.currentSeason);
    document.getElementById('awardsScored').textContent = fantasySeason ? 'Fantasy pts' : 'Touchdowns';

    /* All six, not only the ones who can be paid. A player with no sign-in
       still scores touchdowns, and they are worth counting: the credits wait
       for them and land in full the first time they log in. */
    EGE.players.forEach(function (player) {
      var paid = adminState.awards.filter(function (a) {
        return player.email && a.email &&
               a.email.toLowerCase() === player.email.toLowerCase();
      });

      var sums = { td: 0, offseason: 0, manual: 0 };
      paid.forEach(function (row) { sums[awardKind(row)] += row.credits; });

      /* Counted from the schedule rather than from the ledger, so it is right
         for a week nobody has been paid for yet. What a game earns is
         whatever that season pays on: touchdowns in 2018, fantasy points
         after. */
      var season = EGE.currentSeason;
      var fantasy = EGE.economy.paysFantasy(season);
      var games = EGE.gamesPlayed(player, season);
      var touchdowns = games.reduce(function (sum, game) {
        return sum + (fantasy
          ? EGE.economy.fantasyPoints(game.stats)
          : EGE.economy.touchdownsIn(game.stats));
      }, 0);
      touchdowns = Math.round(touchdowns * 10) / 10;

      /* Awards handed out by hand are not counted: they are not logged any
         more, and the few from before that change are not worth a column. */
      var all = sums.td + sums.offseason;
      var owed = games.reduce(function (sum, game) {
        return sum + EGE.economy.gameCredits(player, game.stats, season);
      }, 0);
      totals.all += all;
      totals.touchdowns += touchdowns;
      totals.games += games.length;
      if (!player.email) { totals.waiting += owed; }

      var tr = el('tr');
      if (!player.email) { tr.className = 'ege-awards__row--noaccount'; }

      var name = el('td');
      name.appendChild(el('strong', null, player.name));
      name.appendChild(el('span', 'fb-meta', player.email
        ? player.position + '  ·  ' + EGE.economy.rateText(player.position, EGE.currentSeason)
        : player.position + '  ·  no sign-in yet'));
      tr.appendChild(name);
      tr.appendChild(el('td', 'num', String(touchdowns)));

      if (player.email) {
        [sums.td, sums.offseason].forEach(function (value) {
          tr.appendChild(el('td', 'num', String(value)));
        });
        var total = el('td', 'num');
        total.appendChild(el('strong', null, String(all)));
        tr.appendChild(total);
      } else {
        /* Nothing can be paid into an account that does not exist yet. What
           the touchdowns are worth shows as waiting, not as earned. */
        tr.appendChild(el('td', 'num', owed ? owed + ' waiting' : '—'));
        tr.appendChild(el('td', 'num', '—'));
        tr.appendChild(el('td', 'num', '—'));
        tr.appendChild(el('td', 'num', '—'));
      }
      body.appendChild(tr);
    });

    document.getElementById('awardsNote').textContent =
      'The ' + EGE.currentSeason + ' season so far';
    var waiting = totals.waiting
      ? ', and ' + totals.waiting + ' waiting on an account to be paid into.'
      : '.';
    var shares = EGE.economy.FANTASY_SHARE;

    document.getElementById('awardsFoot').textContent = fantasySeason
      ? (totals.games
          ? totals.games + ' games played, ' + totals.all + ' credits paid out' + waiting
          : 'No games posted yet. Every game pays its fantasy points (half PPR), ' +
            'rounded up, at ' + shares.QB + ' for a quarterback, ' + shares.RB +
            ' for a back and ' + shares.TE + ' for a tight end.')
      : (totals.touchdowns
          ? totals.touchdowns + ' touchdowns, ' + totals.all + ' credits paid out' + waiting
          : 'No touchdowns posted yet. Credits appear here as results go in — ' +
            EGE.economy.TD_CREDITS.RB + ' a touchdown for a back or a tight end, ' +
            EGE.economy.TD_CREDITS.QB + ' for a quarterback.');
  }

  /* --- putting a week out --------------------------------------------------- */

  var weekState = { season: null, published: [] };

  function adminSeason() {
    return weekState.season || EGE.currentSeason;
  }

  function fillSeasonPicker(select, chosen) {
    var seasons = EGE.seasonsPlayed();
    select.innerHTML = '';
    seasons.forEach(function (year) {
      var option = el('option', null, String(year));
      option.value = year;
      select.appendChild(option);
    });
    select.value = seasons.indexOf(chosen) === -1 ? (seasons[seasons.length - 1] || '') : chosen;
    return Number(select.value) || EGE.currentSeason;
  }

  /* One row per week: how many games it holds, how many have numbers in the
     file, whether Discord has had it, and the button that puts it out. */
  function renderWeeks() {
    var season = adminSeason();
    var body = document.getElementById('weekRows');
    body.innerHTML = '';

    var weeks = EGE.weeksIn(season);
    var out = 0;
    var ready = 0;

    weeks.forEach(function (week) {
      /* A bye is on the schedule but has nothing to type into it, so it is
         not one of the games a week is waiting on. Counting it would leave
         the playoff week reading "5 of 6 filled in" for good and never
         showing as ready to publish. */
      var games = EGE.gamesInWeek(week, season).filter(function (entry) {
        return !entry.game.bye;
      });
      var filled = games.filter(function (entry) { return EGE.hasResult(entry.game); }).length;
      var published = EGE.isPublished(season, week);
      var row = weekState.published.filter(function (r) {
        return r.season === season && r.week === week;
      })[0];

      if (published) { out += 1; }
      if (!published && filled === games.length && filled) { ready += 1; }

      var tr = el('tr');
      if (published) { tr.className = 'ege-weeks__row--out'; }

      tr.appendChild(el('td', 'ege-schedule__week', String(week)));
      tr.appendChild(el('td', 'num', String(games.length)));

      var count = el('td', 'num', filled + ' of ' + games.length);
      if (filled < games.length) { count.className = 'num ege-weeks__short'; }
      tr.appendChild(count);

      tr.appendChild(el('td', 'num', row && row.posted_at ? 'sent' : (published ? 'not yet' : '—')));

      var status = el('td');
      status.appendChild(el('span', 'fb-tag ' + (published ? 'fb-tag--sage' : 'fb-tag--clay'),
        published ? 'Out' : 'Held'));
      tr.appendChild(status);

      var action = el('td', 'num');
      if (published) {
        var pull = el('button', 'fb-btn fb-btn--sm', 'Pull back');
        pull.type = 'button';
        pull.addEventListener('click', function () {
          pull.disabled = true;
          EGE.wallet.unpublishWeek(season, week).then(function (res) {
            sayAdmin(res.message, !res.ok);
            return refreshAdminView();
          }).then(function () { redrawEverything(); });
        });
        action.appendChild(pull);

        var again = el('button', 'fb-btn fb-btn--sm', 'Post again');
        again.type = 'button';
        again.title = 'Send the Discord message again without changing anything';
        again.addEventListener('click', function () {
          again.disabled = true;
          sendWeekToDiscord(season, week).then(function (res) {
            again.disabled = false;
            sayAdmin(res.message, !res.ok);
            return refreshAdminView();
          });
        });
        action.appendChild(again);
      } else {
        var publish = el('button', 'fb-btn fb-btn--sm fb-btn--primary', 'Publish');
        publish.type = 'button';
        publish.disabled = !filled;
        publish.title = filled
          ? 'Show week ' + week + ' and post it to Discord'
          : 'Nothing is filled in for week ' + week + ' yet';
        publish.addEventListener('click', function () {
          publish.disabled = true;
          publishWeek(season, week).then(function () { publish.disabled = false; });
        });
        action.appendChild(publish);
      }
      tr.appendChild(action);

      body.appendChild(tr);
    });

    document.getElementById('weekNote').textContent = season + ' season';
    document.getElementById('weekSummary').textContent =
      out + ' of ' + weeks.length + ' weeks out' +
      (ready ? ', ' + ready + ' ready to go' : '');
  }

  /* Publishing, and the Discord post, on the one click.

     The week goes out first. If Discord will not take it the week still
     stands — the scheduled bot posts anything published it has not sent, so
     a failure here is a delay rather than a hole. */
  function publishWeek(season, week) {
    return EGE.wallet.publishWeek(season, week).then(function (res) {
      if (!res.ok) { sayAdmin(res.message, true); return; }

      /* Credits before Discord, and waited on. It used to fire the payment
         off and compose the message without it, so the one thing the admin
         wanted to know — whether the touchdowns had been paid — was the one
         thing the message never said. Paying first also means a webhook that
         hangs cannot hold up the credits. */
      return payTheWeek(season).then(function (paid) {
        return sendWeekToDiscord(season, week).then(function (posted) {
          sayAdmin('Week ' + week + ' is out. ' + creditLine(paid) + ' ' + posted.message,
                   !posted.ok || Boolean(paid.missed.length));
        });
      });
    }).then(function () {
      return refreshAdminView();
    }).then(function () {
      redrawEverything();
    });
  }

  function sendWeekToDiscord(season, week) {
    var payload = EGE.discordPost.buildWeekPost(week, {
      season: season,
      siteUrl: EGE.discordPost.SITE,
      played: true
    });
    if (!payload) {
      return Promise.resolve({ ok: false, message: 'Week ' + week + ' has no games to post.' });
    }

    return EGE.wallet.postWeekToDiscord(payload).then(function (res) {
      if (!res.ok) {
        return {
          ok: false,
          message: 'Discord did not take it \u2014 ' + res.message +
                   ' The week is still out; Post again retries just the message.'
        };
      }
      return EGE.wallet.markPosted(season, week).then(function () {
        return { ok: true, message: 'Posted to Discord.' };
      });
    });
  }

  /* Everyone's touchdown credits for the season, now that a week has landed.

     Every player, and every week, not just the one going out: paying is keyed
     on what earned it, so a week that is already square costs one call and
     pays nothing, and a stat line corrected since it was published pays the
     difference. That is what makes this safe to run as often as you like. */
  function payTheWeek(season) {
    return Promise.all(EGE.playersWithAccounts().map(function (player) {
      return EGE.wallet.syncAwards(player, season).then(function (res) {
        return { player: player, paid: res.paid || 0, problem: res.message || null };
      });
    })).then(function (all) {
      var paid = all.filter(function (one) { return one.paid > 0; });
      return {
        credits: paid.reduce(function (sum, one) { return sum + one.paid; }, 0),
        names: paid.map(function (one) { return one.player.first + ' +' + one.paid; }),
        missed: all.filter(function (one) { return one.problem; })
                   .map(function (one) { return one.player.first; })
      };
    });
  }

  /* What to tell the admin about the credits, which is never nothing. */
  function creditLine(paid) {
    var line = paid.credits
      ? paid.credits + ' credits paid \u2014 ' + paid.names.join(', ') + '.'
      : 'No credits were owed.';
    if (paid.missed.length) {
      line += ' ' + paid.missed.join(', ') + ' could not be paid.';
    }
    return line;
  }

  /* The same run on its own, for after a stat line has been corrected: there
     is no week left to publish once they are all out, and a correction still
     has to reach somebody's balance. */
  document.getElementById('payCredits').addEventListener('click', function () {
    var button = this;
    button.disabled = true;
    sayAdmin('Paying\u2026', false);
    payTheWeek(adminSeason()).then(function (paid) {
      button.disabled = false;
      sayAdmin(creditLine(paid), Boolean(paid.missed.length));
      return refreshAdminView();
    });
  });

  /* --- the season file ------------------------------------------------------ */

  /* Every week edited this sitting, as week -> slug -> { result, booster,
     stats, bigPlays, overtime }, held here until the file is written.

     All of them, not just the one on screen: editing week 2, flipping to
     week 4 and coming back has to still have week 2's numbers in it, and the
     download has to carry every week that was touched. */
  var editState = { season: null, week: null, weeks: {} };

  function editsFor(week) {
    return editState.weeks[week] || (editState.weeks[week] = {});
  }

  function weeksEdited() {
    return Object.keys(editState.weeks).filter(function (week) {
      return Object.keys(editState.weeks[week]).length;
    }).map(Number).sort(function (a, b) { return a - b; });
  }

  function fillEditorWeeks() {
    var select = document.getElementById('editorWeek');
    var season = adminSeason();
    var weeks = EGE.weeksIn(season);
    select.innerHTML = '';

    weeks.forEach(function (week) {
      var games = EGE.gamesInWeek(week, season).filter(function (entry) {
        return !entry.game.bye;
      });
      var filled = games.filter(function (entry) { return EGE.hasResult(entry.game); }).length;
      var option = el('option', null, 'Week ' + week + '  ·  ' + filled + ' of ' +
                      games.length + ' filled in');
      option.value = week;
      select.appendChild(option);
    });

    /* Open on the first week that still needs numbers. */
    var next = weeks.filter(function (week) {
      return EGE.gamesInWeek(week, season).some(function (entry) {
        return !entry.game.bye && !EGE.hasResult(entry.game);
      });
    })[0];
    select.value = next || weeks[0] || '';

    document.getElementById('editorFile').textContent = 'stats/' + season + '.js';
    document.getElementById('editorNote').textContent = 'stats/' + season + '.js';
    return Number(select.value) || weeks[0];
  }

  function numberField(label, value, onChange) {
    var field = el('label', 'ege-statfield');
    field.appendChild(el('span', 'ege-statfield__label', label));
    var input = el('input', 'fb-input ege-statfield__input');
    input.type = 'number';
    input.value = value === null || value === undefined ? '' : value;
    input.addEventListener('input', function () {
      onChange(input.value === '' ? null : Number(input.value));
    });
    field.appendChild(input);
    return field;
  }

  /* One game's card in the editor: the score, the booster, and every number
     that position's line is typed from. The averages and totals are not here
     — they follow from these and are worked out when the file is written. */
  function editorCard(entry, held) {
    var player = entry.player;
    var game = entry.game;

    /* It borrows the account box's look, but it is not an account — the class
       says which one it is so nothing counts them together. */
    var box = el('div', 'ege-account ege-editcard');

    var head = el('div', 'ege-account__head');
    var who = el('div', 'ege-who');
    var photo = el('img', 'ege-avatar ege-avatar--sm');
    photo.src = player.headshot;
    photo.alt = '';
    who.appendChild(photo);
    var name = el('div');
    name.appendChild(el('span', 'ege-account__name', player.name));
    name.appendChild(el('span', 'fb-meta', player.position + '  ·  ' +
      (game.bye ? 'Bye' : (game.home ? 'vs ' : 'at ') + game.opponent) +
      '  ·  ' + game.date));
    who.appendChild(name);
    head.appendChild(who);

    /* A bye is a week off. There is no score to enter, no booster that could
       have been on it and no stat line to type, so the card says so and
       stops -- a form offering all three would only invite a result for a
       game that was never played. */
    if (game.bye) {
      box.appendChild(el('span', 'ege-note', 'Bye week \u2014 nothing to enter.'));
      return box;
    }

    var score = el('div', 'fb-row');
    score.appendChild(numberField('Us', held.result ? held.result.teamScore : null, function (value) {
      held.result = held.result || { teamScore: null, opponentScore: null };
      held.result.teamScore = value;
    }));
    score.appendChild(numberField('Them', held.result ? held.result.opponentScore : null, function (value) {
      held.result = held.result || { teamScore: null, opponentScore: null };
      held.result.opponentScore = value;
    }));

    /* Whether it went to overtime. Only a flag: the score above is still the
       final score, overtime included. */
    var ot = el('label', 'ege-statfield ege-otfield');
    ot.appendChild(el('span', 'ege-statfield__label', 'OT'));
    var otBox = el('input', 'ege-otfield__input');
    otBox.type = 'checkbox';
    otBox.checked = Boolean(held.overtime);
    otBox.setAttribute('aria-label', 'Went to overtime');
    otBox.addEventListener('change', function () {
      held.overtime = otBox.checked;
    });
    ot.appendChild(otBox);
    score.appendChild(ot);
    head.appendChild(score);
    box.appendChild(head);

    /* The booster that was on the game, written into the file for good. */
    var boosterRow = el('div', 'fb-row fb-row--wrap');
    boosterRow.appendChild(el('span', 'fb-eyebrow', 'Booster'));
    var pick = el('select', 'fb-select');
    var none = el('option', null, 'None');
    none.value = '';
    pick.appendChild(none);
    EGE.shop.sections.filter(function (section) {
      return section.key === 'boosters';
    })[0].items.forEach(function (item) {
      var option = el('option', null, item.name);
      option.value = item.key;
      pick.appendChild(option);
    });
    pick.value = held.booster || '';
    pick.addEventListener('change', function () {
      held.booster = pick.value || null;
    });
    boosterRow.appendChild(pick);
    box.appendChild(boosterRow);

    var grid = el('div', 'ege-statgrid');
    EGE.statline.keysFor(player.position).forEach(function (key) {
      var label = EGE.statline.labelFor(player.position, key);

      grid.appendChild(numberField(label, held.stats ? held.stats[key] : null, function (value) {
        held.stats = held.stats || {};
        held.stats[key] = value;
      }));
    });
    box.appendChild(grid);

    /* The big plays, typed in by hand one to a line, under all of the
       numbers. They go out under the stat line in the Discord post. */
    var plays = el('label', 'ege-statfield ege-bigplays');
    plays.appendChild(el('span', 'ege-statfield__label', 'Big plays \u2014 one per line'));
    var text = el('textarea', 'fb-input ege-bigplays__input');
    text.rows = 3;
    text.placeholder = '44 yard receiving touchdown bomb\n3 yard receiving touchdown';
    text.value = (held.bigPlays || []).join('\n');
    text.setAttribute('aria-label', 'Big plays for ' + player.name);
    text.addEventListener('input', function () {
      held.bigPlays = text.value.split('\n');
    });
    plays.appendChild(text);
    box.appendChild(plays);

    return box;
  }

  function renderEditor() {
    var season = adminSeason();
    var week = Number(document.getElementById('editorWeek').value);
    var holder = document.getElementById('editorGames');
    holder.innerHTML = '';

    var games = EGE.gamesInWeek(week, season);

    /* Start from what the file says, copied so editing it changes nothing
       until the file is downloaded and committed. */
    /* A different season means everything held here belongs to the last one. */
    if (editState.season !== season) {
      editState = { season: season, week: week, weeks: {} };
    }
    editState.week = week;

    /* A week is copied out of the file the first time it is opened, and kept
       after that, so coming back to it finds the numbers as they were left. */
    var held = editsFor(week);
    games.forEach(function (entry) {
      if (held[entry.player.slug]) { return; }
      held[entry.player.slug] = {
        result: entry.game.result ? {
          teamScore: entry.game.result.teamScore,
          opponentScore: entry.game.result.opponentScore
        } : null,
        booster: entry.game.booster || null,
        overtime: Boolean(entry.game.overtime),
        stats: entry.game.stats ? Object.assign({}, entry.game.stats) : null,
        bigPlays: (entry.game.bigPlays || []).slice()
      };
    });

    if (!games.length) {
      holder.appendChild(el('p', 'fb-meta', 'Nobody plays in week ' + week + '.'));
      return;
    }

    games.forEach(function (entry) {
      holder.appendChild(editorCard(entry, held[entry.player.slug]));
    });

    var touched = weeksEdited();
    document.getElementById('editorState').textContent =
      games.length + (games.length === 1 ? ' game' : ' games') + ' in week ' + week +
      (EGE.isPublished(season, week) ? ' · already out' : '') +
      (touched.length > 1 ? ' · ' + touched.length + ' weeks open' : '');
  }

  /* Takes whatever stickers players have put on this week in Supabase and
     writes them into the week being edited, so they can be committed and the
     rows behind them cleared. */
  function pullInBoosters() {
    var season = adminSeason();
    var week = editState.week;

    return EGE.wallet.loadGameBoosters(season).then(function (boosters) {
      var held = editsFor(week);
      var found = 0;
      Object.keys(held).forEach(function (slug) {
        var stuck = (boosters[slug] || {})[week];
        if (!stuck) { return; }
        held[slug].booster = stuck.item_key;
        found += 1;
      });

      renderEditor();
      sayAdmin(found
        ? 'Pulled in ' + found + (found === 1 ? ' sticker' : ' stickers') +
          ' from week ' + week + '. Download the file and commit it, then the ' +
          'rows behind them can go.'
        : 'Nobody has a sticker on week ' + week + '.', false);
    });
  }

  function wireWeekPanel() {
    var seasonPick = document.getElementById('weekSeason');
    var editorWeek = document.getElementById('editorWeek');

    seasonPick.addEventListener('change', function () {
      weekState.season = Number(seasonPick.value);
      editState = { season: null, week: null, weeks: {} };
      renderWeeks();
      fillEditorWeeks();
      renderEditor();
    });

    editorWeek.addEventListener('change', renderEditor);

    document.getElementById('pullBoosters').addEventListener('click', function () {
      pullInBoosters();
    });

    document.getElementById('downloadSeason').addEventListener('click', function () {
      var button = document.getElementById('downloadSeason');
      button.disabled = true;

      EGE.exports.seasonFile(adminSeason(), editState)
        .then(function (text) {
          EGE.exports.download(adminSeason() + '.js', text);
          document.getElementById('downloadNote').textContent =
            'Downloaded. It belongs in stats/.';
          sayAdmin('stats/' + adminSeason() + '.js downloaded. Commit it and the ' +
                   'numbers are live — for the weeks you have published.', false);
        })
        .catch(function (error) { sayAdmin(error.message, true); })
        .then(function () { button.disabled = false; });
    });
  }

  /* --- the end of a season ------------------------------------------------ */

  function renderLockPreview() {
    var body = document.getElementById('lockPreview');
    body.innerHTML = '';

    var moved = 0;
    EGE.exports.ratingsDiff(EGE.currentSeason).forEach(function (row) {
      moved += row.attributes;
      var tr = el('tr');
      var name = el('td');
      name.appendChild(el('strong', null, row.player.name));
      tr.appendChild(name);
      tr.appendChild(el('td', 'num', String(row.attributes)));
      tr.appendChild(el('td', 'num', row.points ? '+' + row.points : '0'));
      tr.appendChild(el('td', 'num', row.overall === null ? TBD : String(row.overall)));
      body.appendChild(tr);
    });

    var locked = EGE.seasonLocked(EGE.currentSeason);
    step('stepLock', locked || adminState.ratingsDownloaded);
    document.getElementById('seasonPanelNote').textContent = locked
      ? EGE.currentSeason + ' is already locked'
      : 'The ' + EGE.currentSeason + ' season';

    document.getElementById('logYear').textContent = EGE.currentSeason;

    document.getElementById('clearWarning').textContent = moved
      ? 'This clears ' + moved + ' attribute' + (moved === 1 ? '' : 's') +
        ' worth of points and training across every account. There is no undo ' +
        'here — if the ratings file above is not committed and live, those ' +
        'improvements are gone.'
      : 'Nobody has bought any points or training this season, so there is ' +
        'nothing to clear.';
  }

  function step(id, done) {
    document.getElementById(id).classList.toggle('ege-step--done', Boolean(done));
  }

  function wireSeasonPanel() {
    var lock = document.getElementById('lockRatings');
    var log = document.getElementById('logSeason');
    var clear = document.getElementById('clearRows');
    var confirm = document.getElementById('clearConfirm');
    var roll = document.getElementById('rollSeason');

    lock.addEventListener('click', function () {
      if (EGE.seasonLocked(EGE.currentSeason)) {
        sayAdmin(EGE.currentSeason + ' is already locked — its purchases are in ' +
                 'data/ratings.js already. Locking it twice would count them twice.', true);
        return;
      }
      lock.disabled = true;
      EGE.exports.ratingsFile(EGE.currentSeason).then(function (text) {
        EGE.exports.download('ratings.js', text);
        adminState.ratingsDownloaded = true;
        step('stepLock', true);
        clear.disabled = confirm.value.trim().toUpperCase() !== 'CLEAR';
        sayAdmin('ratings.js downloaded. Put it in data/ and commit it before ' +
                 'clearing anything.', false);
      }).catch(function (error) {
        sayAdmin(error.message, true);
      }).then(function () { lock.disabled = false; });
    });

    log.addEventListener('click', function () {
      log.disabled = true;
      EGE.exports.seasonLogFile(EGE.currentSeason).then(function (text) {
        EGE.exports.download('season-' + EGE.currentSeason + '.js', text);
        step('stepLog', true);
        sayAdmin('season-' + EGE.currentSeason + '.js downloaded. It belongs in ' +
                 'data/logs/.', false);
      }).catch(function (error) {
        sayAdmin('Could not build the log: ' + error.message, true);
      }).then(function () { log.disabled = false; });
    });

    /* Two locks on the clear: the ratings file has to exist — built in this
       sitting, or already committed with this season locked in it — and the
       word has to be typed. Everything it deletes is only recoverable from
       that file. */
    confirm.addEventListener('input', function () {
      clear.disabled = confirm.value.trim().toUpperCase() !== 'CLEAR';
    });

    clear.addEventListener('click', function () {
      if (!adminState.ratingsDownloaded && !EGE.seasonLocked(EGE.currentSeason)) {
        sayAdmin('Download the ratings file first — step 1. Clearing without it ' +
                 'loses everything anybody bought this season.', true);
        return;
      }
      clear.disabled = true;
      EGE.wallet.clearLockedRows().then(function (res) {
        confirm.value = '';
        sayAdmin(res.ok
          ? 'Rating points and training cleared. Everybody keeps their unused ' +
            'boosters. Roll the season over when you are ready.'
          : res.message, !res.ok);
        if (res.ok) { step('stepClear', true); }
        return refreshAdminView();
      });
    });

    roll.addEventListener('click', function () {
      var next = EGE.nextSeason(EGE.currentSeason);
      if (!next) {
        sayAdmin('There is no season after ' + EGE.currentSeason +
                 ' on the ladder — it ends at the draft.', true);
        return;
      }

      var locked = (EGE.lockedSeasons || []).slice();
      if (locked.indexOf(EGE.currentSeason) === -1) { locked.push(EGE.currentSeason); }

      roll.disabled = true;
      EGE.exports.seasonFileSource(next, locked.sort()).then(function (text) {
        EGE.exports.download('season.js', text);
        step('stepRoll', true);
        sayAdmin('season.js downloaded, pointing at ' + next + '. Commit it with ' +
                 'the other two and everybody is paid their allowance on their ' +
                 'next visit.', false);
      }).catch(function (error) {
        sayAdmin(error.message, true);
      }).then(function () { roll.disabled = false; });
    });
  }

  /* --- drawing the page --------------------------------------------------- */

  var adminBuilt = false;

  function refreshAdminView() {
    if (!isAdmin()) { return Promise.resolve(); }

    return Promise.all([
      EGE.wallet.allCredits(),
      EGE.wallet.allInventory(),
      EGE.wallet.allAwards(EGE.currentSeason),
      EGE.wallet.loadBoosts(),
      EGE.wallet.loadPublishedWeeks(),
      EGE.wallet.publishedRows()
    ]).then(function (all) {
      adminState.credits = all[0];
      adminState.inventory = all[1];
      adminState.awards = all[2];
      weekState.published = all[5];
      renderAccounts();
      renderAwards();
      renderLockPreview();
      renderWeeks();
    });
  }

  function renderAdminView() {
    var admin = isAdmin();
    document.getElementById('adminLocked').hidden = admin;
    document.getElementById('adminContent').hidden = !admin;

    document.getElementById('adminLockedNote').textContent = EGE.auth.currentPlayer()
      ? 'This page is the commissioner’s. Nothing here is yours to change.'
      : 'This page is the commissioner’s, and you are not signed in.';

    if (!admin) { return Promise.resolve(); }

    if (!adminBuilt) {
      adminBuilt = true;
      weekState.season = fillSeasonPicker(document.getElementById('weekSeason'),
                                          EGE.currentSeason);
      wireSeasonPanel();
      wireWeekPanel();
    }
    sayAdmin('', false);

    var note = document.getElementById('discordNote');
    note.textContent = 'Publishing posts to Discord through the post-week function. ' +
      'If it is not deployed the week still goes out, and the scheduled bot ' +
      'posts it on its next run.';

    return refreshAdminView().then(function () {
      fillEditorWeeks();
      renderEditor();
    });
  }

  /* --- loading ----------------------------------------------------------- */

  function refreshShop() {
    var player = shopState.player;
    if (!player) { return Promise.resolve(); }

    return Promise.all([
      EGE.wallet.creditsFor(player.email),
      EGE.wallet.inventoryFor(player.email),
      EGE.wallet.loadBoosts(),
      EGE.wallet.loadGameBoosters(EGE.currentSeason)
    ]).then(function (all) {
      shopState.credits = all[0] === null ? EGE.shop.startingCredits : all[0];
      shopState.inventory = all[1];
      renderInventory();
      refreshStackedPrices();
      refreshUpgrades();
      redrawRatings();
      refreshScoutMarks();
      updateNavCredits(shopState.credits);
    });
  }

  /* The Earning Credits panel: what an offseason pays, what a game pays, and
     how a game's fantasy points are scored. The game rows are read out of
     data/economy.js, so the panel can never describe different maths from
     the maths that pays. */
  var SUB = '\u221f ';

  function earningRow(body, label, value, sub) {
    var tr = el('tr', sub ? 'ege-earnings__sub' : 'ege-earnings__lead');
    tr.appendChild(el('td', null, (sub ? SUB : '') + label));
    var cell = el('td', 'num');
    cell.appendChild(el('strong', null, value));
    tr.appendChild(cell);
    body.appendChild(tr);
  }

  function buildEarnings() {
    var offseason = document.getElementById('shopEarnings');
    EGE.shop.earnings.forEach(function (row) {
      earningRow(offseason, row.label, '+' + row.credits, row.sub);
    });

    var economy = EGE.economy;
    var shares = economy.FANTASY_SHARE;
    var perGame = document.getElementById('shopGameEarnings');
    earningRow(perGame, 'Every Game', 'fantasy pts \u00d7', false);
    [['QB', 'Quarterback'], ['RB', 'Running Back'], ['TE', 'Tight End']].forEach(function (pos) {
      earningRow(perGame, pos[1], '\u00d7' + shares[pos[0]].toFixed(2), true);
    });

    var f = economy.FANTASY;
    var per = function (rate) { return String(Math.round(1 / rate)); };
    var scoring = document.getElementById('shopFantasy');
    [
      ['Passing', null],
      ['Yards', '1 per ' + per(f.passingYards)],
      ['Touchdown', '+' + f.passingTd],
      ['Interception', String(f.interceptions)],
      ['Rushing', null],
      ['Yards', '1 per ' + per(f.rushingYards)],
      ['Touchdown', '+' + f.rushingTd],
      ['Receiving', null],
      ['Catch', '+' + f.receptions],
      ['Yards', '1 per ' + per(f.receivingYards)],
      ['Touchdown', '+' + f.receivingTd],
      ['Fumble lost', String(f.fumbles)]
    ].forEach(function (row) {
      if (row[1] === null) {
        var head = el('tr', 'ege-earnings__lead');
        head.appendChild(el('td', null, row[0]));
        head.appendChild(el('td', 'num'));
        scoring.appendChild(head);
        return;
      }
      earningRow(scoring, row[0], row[1].replace('-', '\u2212'), row[0] !== 'Fumble lost');
    });
  }

  function buildCatalogue() {
    if (shopState.built) { return; }
    shopState.built = true;
    stackedCards = [];

    buildEarnings();

    var sections = document.getElementById('shopSections');
    EGE.shop.sections.filter(function (section) {
      return !section.panel;
    }).forEach(function (section) {
      sections.appendChild(buildShopSection(section));
    });
  }

  function renderShop() {
    var player = EGE.auth.currentPlayer();
    shopState.player = player;

    document.getElementById('shopLocked').hidden = Boolean(player);
    document.getElementById('shopContent').hidden = !player;
    if (!player) { return; }

    sayShop('', false);
    buildCatalogue();
    refreshShop();
  }

  /* A week going out or coming back changes the roster, whatever player page
     is open, and the editor's idea of what is filled in. */
  function redrawEverything() {
    redrawRatings();
    fillEditorWeeks();
    renderEditor();
    updateNavCreditsFromServer();
  }

  function updateNavCreditsFromServer() {
    var player = EGE.auth.currentPlayer();
    if (!player) { return; }
    EGE.wallet.creditsFor(player.email).then(updateNavCredits);
  }

  /* Boosts land after a page may already have been drawn — the roster's
     overalls and the open player page both need redrawing. */
  function redrawRatings() {
    roster.innerHTML = '';
    renderRoster();

    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    if (player) { renderPlayer(player); }
  }

  /* The inventory arrives after a page may already have been drawn, so redraw
     the schedule if what it shows has changed. */
  function refreshScoutMarks() {
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    if (!player) { return; }
    if ((canSeeScouts(player) && shownSeason() === EGE.currentSeason) !== showScouts) {
      renderSchedule(player);
    }
    /* Whether the boosters show in the log turns on who is signed in too. */
    renderGameLog(player);
  }

  /* --- routing ---------------------------------------------------------- */

  function setNav(active) {
    document.getElementById('navPlayers').classList.toggle('is-active', active === 'players');
    document.getElementById('navShop').classList.toggle('is-active', active === 'shop');
    document.getElementById('navAdmin').classList.toggle('is-active', active === 'admin');
  }

  function show(view) {
    viewHome.hidden   = view !== viewHome;
    viewShop.hidden   = view !== viewShop;
    viewPlayer.hidden = view !== viewPlayer;
    viewAdmin.hidden  = view !== viewAdmin;
  }

  /* The page route() last drew, so it can tell going somewhere from being
     asked to draw the same page again. */
  var routed = null;

  function route() {
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    var moved = hash !== routed;
    routed = hash;

    if (hash === 'shop') {
      renderShop();
      show(viewShop);
      setNav('shop');
      document.title = 'Shop \u2014 EGE Football';
    } else if (hash === 'admin') {
      renderAdminView();
      show(viewAdmin);
      setNav('admin');
      document.title = 'Admin \u2014 EGE Football';
    } else if (player) {
      /* Shown first, then drawn. The stickers and the season totals are
         laid out by measuring the page, and a hidden page measures as
         nothing -- drawn the other way round, the offers all piled up in
         the corner and a long number spilled out of its cell until a
         refresh redrew them. */
      show(viewPlayer);
      renderPlayer(player);
      setNav('players');
      document.title = player.name;
    } else {
      show(viewHome);
      setNav('players');
      document.title = 'EGE Football';
    }

    /* To the top only when this is a different page. route() is also how the
       page is redrawn in place -- a sign-in landing, the shop appearing --
       and doing it then threw whoever was halfway down a game log back up
       to the header. */
    if (moved) { window.scrollTo(0, 0); }
  }

  /* --- portal: shared bits ---------------------------------------------- */

  var panelAuth     = document.getElementById('panelAuth');
  var panelSignedIn = document.getElementById('panelSignedIn');

  var loginPlayer  = document.getElementById('loginPlayer');
  var authForm     = document.getElementById('authForm');
  var authSubmit   = document.getElementById('authSubmit');
  var authLead     = document.getElementById('authLead');
  var authPassword = document.getElementById('authPassword');
  var authConfirm  = document.getElementById('authConfirm');
  var confirmField = document.getElementById('confirmField');
  var modeSwitch   = document.getElementById('modeSwitch');

  /* Writes into one of the modal's message slots. */
  function reporter(id) {
    var node = document.getElementById(id);
    return function (text, isError) {
      node.textContent = text || '';
      node.hidden = !text;
      node.className = 'ege-note' + (isError ? ' ege-note--error' : ' ege-note--ok');
    };
  }

  var sayAuth = reporter('authMessage');

  function showPanel(panel) {
    panelAuth.hidden     = panel !== panelAuth;
    panelSignedIn.hidden = panel !== panelSignedIn;
  }

  function selectedPlayer() { return EGE.playerBySlug(loginPlayer.value); }

  /* Starts on an empty "Select" rather than on whoever is first in the
     list, so nobody opens the portal looking at somebody else's name. */
  function fillPlayerSelect() {
    var none = el('option', null, 'Select');
    none.value = '';
    none.disabled = true;
    loginPlayer.appendChild(none);

    EGE.players.forEach(function (player) {
      var opt = el('option', null, player.name + (player.email ? '' : ' \u2014 no account yet'));
      opt.value = player.slug;
      opt.disabled = !player.email;
      loginPlayer.appendChild(opt);
    });
    loginPlayer.value = '';
  }

  /* --- portal: show/hide password --------------------------------------- */

  /* One handler for every eye button; each names the field it reveals. */
  document.addEventListener('click', function (e) {
    var eye = e.target.closest ? e.target.closest('.ege-eye') : null;
    if (!eye) { return; }

    var field = document.getElementById(eye.getAttribute('data-reveals'));
    var reveal = field.type === 'password';

    field.type = reveal ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(reveal));
    eye.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
  });

  /* --- portal: one password, set once ----------------------------------- */

  var mode = 'signin';

  function setMode(next, lead) {
    mode = next;
    var creating = mode === 'create';

    confirmField.hidden = !creating;
    authConfirm.required = creating;
    authPassword.autocomplete = creating ? 'new-password' : 'current-password';
    document.getElementById('passwordLabel').textContent =
      creating ? 'Choose a password' : 'Password';
    authSubmit.textContent = creating ? 'Set Password' : 'Sign In';
    authLead.textContent = lead || '';
    authLead.hidden = !lead;
  }

  /* The portal asks the account table which form this player needs, so
     nobody has to know whether they have signed in before. */
  function loadAccount() {
    var player = selectedPlayer();
    sayAuth('', false);
    authPassword.value = '';
    authConfirm.value = '';
    modeSwitch.hidden = true;

    /* Nobody picked yet: nothing to ask for until somebody is. */
    if (!loginPlayer.value) {
      authForm.hidden = true;
      authLead.hidden = true;
      return Promise.resolve();
    }

    if (!player || !player.email) {
      authForm.hidden = true;
      authLead.hidden = false;
      authLead.textContent = 'That player has no account yet.';
      return Promise.resolve();
    }

    authForm.hidden = true;
    authLead.hidden = false;
    authLead.textContent = 'Checking this account\u2026';

    return EGE.auth.accountState(player.email).then(function (state) {
      authForm.hidden = false;

      if (state === 'set') {
        setMode('signin', 'Welcome back, ' + player.first + '.');
      } else if (state === 'unset') {
        setMode('create', player.first + ' has no password yet. Pick one now.');
      } else {
        /* Cannot tell — offer sign-in and a way across. */
        setMode('signin', 'Sign in, or set a password if this is your first time.');
        modeSwitch.hidden = false;
      }
    });
  }

  loginPlayer.addEventListener('change', loadAccount);

  modeSwitch.addEventListener('click', function () {
    var player = selectedPlayer();
    if (mode === 'create') {
      setMode('signin', 'Sign in, or set a password if this is your first time.');
      modeSwitch.textContent = 'First time? Set your password';
    } else {
      setMode('create', 'Setting the first password for ' + player.first + '.');
      modeSwitch.textContent = 'Already have a password? Sign in';
    }
  });

  authForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var player = selectedPlayer();
    if (!loginPlayer.value) { sayAuth('Pick your name first.', true); return; }
    if (!player || !player.email) { sayAuth('That player has no account yet.', true); return; }

    authSubmit.disabled = true;
    sayAuth('Checking\u2026', false);

    var work = mode === 'create'
      ? EGE.auth.createPassword(player.email, authPassword.value, authConfirm.value)
      : EGE.auth.signIn(player.email, authPassword.value);

    work.then(function (res) {
      authSubmit.disabled = false;
      sayAuth(res.message, !res.ok);

      /* The table said there was no password but Supabase disagrees, so
         put the player on the form that can actually work. */
      if (res.taken) {
        setMode('signin', 'Welcome back, ' + player.first + '.');
        modeSwitch.hidden = true;
      }
      if (res.ok) { authPassword.value = ''; authConfirm.value = ''; }
    });
  });

  /* --- portal: session -------------------------------------------------- */

  document.getElementById('logoutBtn').addEventListener('click', function () {
    EGE.auth.signOut();
  });

  document.getElementById('shopLoginBtn').addEventListener('click', function () {
    openLogin();
  });

  function showSignedOutNav() {
    loginBtn.className = 'fb-btn fb-btn--inverse';
    loginBtn.textContent = 'Log In';
    loginBtn.removeAttribute('title');
    loginBtn.setAttribute('aria-label', 'Open the player portal');
    document.getElementById('navShop').hidden = true;
    document.getElementById('navAdmin').hidden = true;
    document.getElementById('navCredits').hidden = true;
  }

  function showSignedInNav(player) {
    loginBtn.className = 'ege-avatarbtn';
    loginBtn.innerHTML = '';
    var img = el('img', 'ege-avatar');
    img.src = player.headshot;
    img.alt = '';
    loginBtn.appendChild(img);
    loginBtn.title = player.name;
    loginBtn.setAttribute('aria-label', 'Open ' + player.name + '’s portal');

    document.getElementById('navShop').hidden = false;

    document.getElementById('navCredits').hidden = false;
    updateNavCredits(null);
    EGE.wallet.creditsFor(player.email).then(updateNavCredits);
  }

  /* The nav shows what is really in the account, once Supabase answers. */
  function updateNavCredits(credits) {
    var box = document.getElementById('navCredits');
    var shown = credits === null || credits === undefined ? EGE.shop.startingCredits : credits;
    document.getElementById('navCreditsValue').textContent = shown;
    box.title = shown + ' credits to spend in the shop';
  }

  /* Two things decide what a visitor sees before anybody signs in, so both
     load before the first draw and for everybody — signed in or not, player
     or passer-by.

     Which weeks are out decides whether there is a score at all. And what
     has been bought decides every overall on the site: a rating point is a
     permanent part of a player, not a private note, and it has to read the
     same to a passer-by as it does to the person who paid for it. This used
     to be loaded from refreshShop, which needs a signed-in player, so
     signing out dropped every overall back to its base number. */
  Promise.all([
    EGE.wallet.loadPublishedWeeks(),
    EGE.wallet.loadBoosts()
  ]).then(function () {
    redrawRatings();
    settle();
  }).then(null, settle);

  /* The roster is drawn twice on every load: once from the base ratings,
     because the page cannot wait for a round trip before it has anything on
     it, and again a moment later with everything bought folded in. The second
     draw can reorder the cards, and that reshuffle is the flicker.

     So the first draw is done with the roster transparent. It still takes up
     its space, so nothing moves under it, and it fades in once the numbers it
     is sorted by are the real ones. Both promises resolve even when Supabase
     cannot be reached, so this can never sit there hidden. */
  var booted = false;

  function settle() {
    /* The page load's hold on the loading screen, let go of once however many
       ways this is reached -- the loads landing, or the timeout below. */
    if (!booted) { booted = true; loaded(); }
    roster.classList.remove('is-waiting');
    document.getElementById('ratingsOverallBox').classList.remove('is-waiting');
  }

  /* A slow network should not mean a blank page for ever, whatever happens
     to those two promises. */
  window.setTimeout(settle, 4000);

  EGE.auth.onChange(function (player) {
    if (player) {
      /* The wallet loads on sign-in, not on reaching the shop: a player page
         needs the inventory too, to know whether to show the scouts. */
      shopState.player = player;
      loading();
      EGE.wallet.loadPublishedWeeks()
        .then(function () { return EGE.wallet.refreshAdmin(player.email); })
        .then(function (admin) {
          document.getElementById('navAdmin').hidden = !admin;
          /* Anything the season owes this player is paid on the way in, so a
             result posted since their last visit is already credits by the
             time they reach the shop. */
          return EGE.wallet.syncAwards(player, EGE.currentSeason);
        })
        .then(function (paid) {
          if (paid && paid.paid) {
            sayShop('The season paid you ' + paid.paid + ' credits since you were ' +
                    'last here.', false);
          }
          return refreshShop();
        })
        .then(route)
        .then(loaded, loaded);
      showSignedInNav(player);
      document.getElementById('signedInName').textContent = player.name;
      var photo = document.getElementById('signedInPhoto');
      photo.src = player.headshot;
      photo.alt = player.name;
      showPanel(panelSignedIn);
    } else {
      showSignedOutNav();
      showPanel(panelAuth);
      loadAccount();
      shopState.player = null;
      shopState.inventory = [];
      shopState.credits = EGE.shop.startingCredits;
    }
    route();          /* the shop appears and disappears with the session */
  });

  /* --- portal: open and close ------------------------------------------- */

  function openLogin() {
    if (!EGE.auth.available()) {
      authForm.hidden = false;
      authLead.hidden = true;
      sayAuth(EGE.auth.unavailableReason(), true);
      authSubmit.disabled = true;
    }
    loginModal.hidden = false;
    if (!panelAuth.hidden && !authForm.hidden) { authPassword.focus(); }
  }
  function closeLogin() { loginModal.hidden = true; }

  loginBtn.addEventListener('click', openLogin);
  loginModal.addEventListener('click', function (e) {
    if (e.target === loginModal || e.target.hasAttribute('data-close-login')) { closeLogin(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !loginModal.hidden) { closeLogin(); }
  });

  /* --- download the app --------------------------------------------------- */

  /* There is no app. There is this site, pinned to a home screen, which on a
     phone is the same thing: its own icon, no address bar, and the status bar
     tinted to match the nav. Apple has no install prompt to offer, so the only
     way anybody finds Add to Home Screen is by being shown where it is.

     It draws on a phone and nowhere else, and it stops drawing the moment the
     site is opened from the home screen — at that point the guide is telling
     you to do the thing you have already done. */

  function alreadyInstalled() {
    if (window.navigator.standalone) { return true; }          /* iOS */
    return Boolean(window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches); /* everyone else */
  }

  function onAPhone() {
    if (!window.matchMedia) { return false; }
    /* A coarse pointer and a small screen. Asking for both is what keeps a
       touchscreen laptop out of it. */
    return window.matchMedia('(pointer: coarse)').matches &&
           window.matchMedia('(max-width: 820px)').matches;
  }

  function onApple() {
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) { return true; }
    /* An iPad on iPadOS 13 and up reports itself as a Mac; the touch points
       are the only thing that gives it away. */
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }

  /* The share glyph as Apple draws it, because "the share button" means
     nothing until you have seen which one it is. */
  function shareGlyph() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ege-install__glyph');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML =
      '<path d="M12 3v12M12 3l-4 4M12 3l4 4" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M6 11H4.5v9.5h15V11H18" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    return svg;
  }

  var INSTALL_GUIDES = {
    apple: {
      kind: 'iPhone and iPad',
      lede: 'Four taps and EGE Football sits on your home screen next to ' +
            'everything else, full screen, with no address bar across the top.',
      steps: [
        { text: 'Open this page in Safari. The button this needs is Safari\u2019s own.' },
        { text: 'Tap the Share button in the bar at the bottom \u2014 the square ' +
                'with an arrow coming out of the top.', glyph: 'share' },
        { text: 'Scroll that list down and tap Add to Home Screen.' },
        { text: 'Tap Add, top right. Then close Safari and open it from the icon.' }
      ]
    },
    other: {
      kind: 'Android',
      lede: 'Chrome will pin the site to your home screen as an app, with its ' +
            'own icon and no address bar.',
      steps: [
        { text: 'Open this page in Chrome.' },
        { text: 'Tap the three-dot menu, top right.', glyph: 'dots' },
        { text: 'Tap Add to Home screen, or Install app if it offers that instead.' },
        { text: 'Tap Install. Then open it from the icon rather than from Chrome.' }
      ]
    }
  };

  function renderInstallGuide() {
    var panel = document.getElementById('installGuide');
    if (!onAPhone() || alreadyInstalled()) { panel.hidden = true; return; }

    var guide = onApple() ? INSTALL_GUIDES.apple : INSTALL_GUIDES.other;
    document.getElementById('installKind').textContent = guide.kind;
    document.getElementById('installLede').textContent = guide.lede;

    var list = document.getElementById('installSteps');
    list.innerHTML = '';
    guide.steps.forEach(function (step) {
      var item = el('li', 'ege-install__step');
      var body = el('span', 'ege-install__text', step.text);
      if (step.glyph === 'share') { body.appendChild(shareGlyph()); }
      if (step.glyph === 'dots') {
        body.appendChild(el('span', 'ege-install__glyph ege-install__dots', '\u22ee'));
      }
      item.appendChild(body);
      list.appendChild(item);
    });

    panel.hidden = false;
  }

  /* --- go --------------------------------------------------------------- */

  roster.classList.add('is-waiting');
  document.getElementById('ratingsOverallBox').classList.add('is-waiting');

  renderRoster();
  renderInstallGuide();
  fillPlayerSelect();
  route();
  EGE.auth.init();
  window.addEventListener('hashchange', route);

  /* --- staying current --------------------------------------------------

     A phone does not reload a page it put away. Back on a tab from this
     morning, or on the home-screen app opened again, you are looking at the
     page as it was then: a week published since is not there, and neither is
     anything anybody bought. That read as "I have to reload to see it".

     So coming back to the page after a while asks Supabase again, and only
     if the answer is different does anything get redrawn -- in place, with
     the page left where you had it. */
  var AWAY_BEFORE_REFRESH = 30 * 1000;
  var hiddenSince = null;
  var refreshing = false;

  function liveState() {
    return JSON.stringify([EGE.publishedWeeks, EGE.appliedBoosts]);
  }

  function refreshLive() {
    if (refreshing) { return; }
    refreshing = true;
    var before = liveState();
    Promise.all([
      EGE.wallet.loadPublishedWeeks(),
      EGE.wallet.loadBoosts()
    ]).then(function () {
      if (liveState() !== before) {
        redrawRatings();
        refreshScoutMarks();
      }
      updateNavCreditsFromServer();
    }).then(function () { refreshing = false; }, function () { refreshing = false; });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenSince = Date.now(); return; }
    if (hiddenSince !== null && Date.now() - hiddenSince >= AWAY_BEFORE_REFRESH) {
      refreshLive();
    }
    hiddenSince = null;
  });

  /* Back and forward can hand over the page itself, kept whole in memory,
     rather than loading it: the same thing again. */
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) { refreshLive(); }
  });

  /* And a fresh load always gets the files as they are now, not as the
     browser last saw them. See sw.js. Opened straight off a disk there is no
     server to ask, so it is left off there. */
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
