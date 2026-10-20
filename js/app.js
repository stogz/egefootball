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
  var viewCards  = document.getElementById('view-cards');
  var viewPlayer = document.getElementById('view-player');
  var viewAdmin  = document.getElementById('view-admin');
  var viewTeams  = document.getElementById('view-teams');
  var viewTeam   = document.getElementById('view-team');
  var viewDiamonds = document.getElementById('view-diamonds');
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

  /* A season as the site names it: the year and the level. No class -- the
     six are not all in the same one (Isaac redshirts 2021), so a class is
     only ever said on a player's own page, from EGE.classFor. */
  function seasonLabel(year) {
    var s = EGE.seasons.filter(function (x) { return x.year === year; })[0];
    return s ? s.year + ' · ' + s.level : String(year);
  }

  /* The home page's line follows the live season rather than being typed
     into index.html, so rolling a season over moves it too. */
  document.getElementById('homeSeasonLabel').textContent = seasonLabel(EGE.currentSeason);

  /* School name with its mark beside it, or a plain TBD while unknown. The
     live season's school unless told another -- a roster card is always the
     live season, a player page is whichever one is picked. */
  function schoolLine(player, className, season) {
    var team = EGE.teamFor(player, season);
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
     same on a card as it does on a page. Under 75 it is the site's own dark
     chip: the word in the accent orange, the number under it in cream. From
     75 up the box is cut from something better, a tier at a time. */
  var OVERALL_TIERS = [
    { from: 99, key: 'galaxy',  name: 'galaxy' },
    { from: 95, key: 'pink',    name: 'pink diamond' },
    { from: 90, key: 'diamond', name: 'diamond' },
    { from: 85, key: 'gold',    name: 'gold' },
    { from: 80, key: 'silver',  name: 'silver' },
    { from: 75, key: 'bronze',  name: 'bronze' }
  ];

  function overallTier(overall) {
    for (var i = 0; i < OVERALL_TIERS.length; i++) {
      if (overall >= OVERALL_TIERS[i].from) { return OVERALL_TIERS[i]; }
    }
    return null;
  }

  function overallBox(overall, modifier) {
    if (typeof overall !== 'number') { return null; }

    /* A pink diamond is the diamond in another colour, so it carries both. */
    var tier = overallTier(overall);
    var tierClass = !tier ? '' :
      ' ege-ovrbox--tier ege-ovrbox--' + tier.key + (tier.key === 'pink' ? ' ege-ovrbox--diamond' : '');
    var box = el('div', 'ege-ovrbox' + (modifier ? ' ' + modifier : '') + tierClass);
    box.title = overall + ' overall' + (tier ? ' \u2014 ' + tier.name : '');
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

    /* His own page is the one place his class is said, and it is his: a
       redshirt year puts him a year behind everybody else. */
    var klass = EGE.classFor(player, season);
    document.getElementById('playerStripLabel').textContent = season +
      (klass ? ' \u00b7 ' + klass : '') + ' \u00b7 ' + (EGE.levelFor(player, season) || '');

    showPhoto(document.getElementById('playerPhoto'), player.headshot, player.name);

    var school = document.getElementById('playerSchool');
    school.innerHTML = '';
    /* A college season's school is a way through to its team page, opened
       on the season this page is showing. */
    var line = schoolLine(player, 'ege-school--lg', season);
    var teamKey = EGE.tierFor(season) !== 'highSchool' ? EGE.teamKeyFor(player, season) : null;
    if (teamKey && EGE.teams[teamKey]) {
      var toTeam = el('a', 'ege-school__link');
      toTeam.href = '#teams/' + EGE.teamSlug(teamKey);
      toTeam.title = 'See ' + EGE.teams[teamKey].school + '\u2019s team page';
      toTeam.appendChild(line);
      toTeam.appendChild(el('span', 'ege-school__go', '\u2192'));
      toTeam.addEventListener('click', function () { teamsPicked = season; });
      school.appendChild(toTeam);
    } else {
      school.appendChild(line);
    }

    document.getElementById('playerName').textContent = player.name;
    /* Three facts under the name: what he plays, how his team's season is
       going, and the number on his back. Which season, class and level it
       is are across the strip at the top of the panel, in full. */
    document.getElementById('playerPosition').textContent =
      EGE.positionFor(player, season) || TBD;
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
    renderConference(player, season);
    document.getElementById('playerJersey').textContent =
      typeof player.jersey === 'number' ? '#' + player.jersey : TBD;

    renderStars(player);
    renderVitals(player);
    renderInjury(player, season);
    renderTally(player, season);

    renderSchedule(player);
    renderGameLog(player);
    renderRatings(player);
    renderTrophies(player);

    /* The cards this player has picked to show off -- not tied to a season. */
    EGE.showcase.render(player);
  }

  /* --- the injury report ----------------------------------------------------

     Only there while the week being played is one he is marked injured for:
     a red cross, OUT, what with, and how healthy he is as a bar -- green
     when he is nearly there, orange in the middle, red when he is a long
     way off -- with the week he is expected back. */
  function renderInjury(player, season) {
    var box = document.getElementById('playerInjury');
    var report = EGE.injuryFor(player, season);
    box.innerHTML = '';
    box.hidden = !report;
    if (!report) { return; }

    var head = el('div', 'ege-injury__head');
    head.appendChild(el('span', 'ege-injury__cross', '+'));
    var words = el('div', 'ege-injury__words');
    words.appendChild(el('span', 'ege-injury__kicker', 'Injury report · Week ' + report.week));
    var line = el('span', 'ege-injury__status');
    line.appendChild(el('strong', null, report.status.toUpperCase()));
    if (report.injury) { line.appendChild(document.createTextNode(' — ' + report.injury)); }
    words.appendChild(line);
    words.appendChild(el('span', 'ege-injury__back', report.back
      ? 'Expected back week ' + report.back
      : 'No return date'));
    head.appendChild(words);
    box.appendChild(head);

    if (report.health !== null) {
      var meter = el('div', 'ege-injury__health');
      meter.appendChild(el('span', 'ege-injury__label', 'Health'));
      var bar = el('div', 'ege-injury__bar');
      bar.setAttribute('role', 'meter');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(report.health));
      bar.setAttribute('aria-label', 'Health ' + report.health + '%');
      var fill = el('span', 'ege-injury__fill ege-injury__fill--' +
        (report.health >= 75 ? 'good' : report.health >= 40 ? 'fair' : 'poor'));
      fill.style.width = report.health + '%';
      bar.appendChild(fill);
      meter.appendChild(bar);
      meter.appendChild(el('span', 'ege-injury__pct', report.health + '%'));
      box.appendChild(meter);
    }
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

  /* Whether the season on show is one of the recruiting years. The stars are
     what a high school player is -- once he has signed somewhere they are
     history, so they stay on 2018 and 2019 and are not carried into
     college. */
  function recruitingSeason() {
    return EGE.tierFor(shownSeason()) === 'highSchool';
  }

  /* Where his team stands in its division -- 3RD in SEC West -- in the
     college seasons, and in the NFL 2ND in NFC West, on the whole record.
     Worked out from the published weeks, so it moves as they come out. TBD
     until the team has played a conference game (in the NFL, any game). */
  function renderConference(player, season) {
    var label = document.getElementById('playerConferenceLabel');
    var box = document.getElementById('playerConference');
    label.textContent = EGE.tierFor(season, player) === 'nfl' ? 'Division' : 'Conference';

    /* A high school season has no table to be placed in, so it gets the
       league's name on its own -- and the row is there either way, so the
       header is the same size whatever season is on show. */
    if (recruitingSeason()) {
      var team = EGE.teamFor(player, season);
      label.hidden = box.hidden = !(team && team.league);
      box.textContent = team && team.league ? team.league : '';
      box.title = '';
      return;
    }

    var standing = EGE.standingFor(player, season);
    label.hidden = box.hidden = !standing;
    if (!standing) { return; }
    box.textContent = (standing.place ? EGE.ordinal(standing.place) : TBD) +
      ' in\u00a0' + standing.league;
    box.title = !standing.place ? ''
      : standing.nfl
        ? standing.wins + '-' + standing.losses + ', ' + standing.divisionRecord.wins + '-' +
          standing.divisionRecord.losses + ' in ' + standing.league + ' games'
        : standing.wins + '-' + standing.losses + ' in ' + standing.conference + ' games';
  }

  /* Stars out of five, the empty ones drawn as outlines, and where he ranks
     at his position in his state. High school seasons only. */
  function renderStars(player) {
    var box = document.getElementById('playerStars');
    box.innerHTML = '';
    var recruit = recruitingSeason() ? (EGE.recruiting || {})[player.slug] : null;

    /* No recruiting line in college, but its line is kept, empty and unseen,
       so the facts under it stay where they were and the header is the same
       size whatever season is on show. */
    box.hidden = false;
    box.classList.toggle('is-blank', !recruit);
    box.setAttribute('aria-hidden', recruit ? 'false' : 'true');
    box.removeAttribute('title');
    if (!recruit) {
      box.appendChild(el('span', 'ege-stars__row', '\u2605'));
      return;
    }

    var row = el('span', 'ege-stars__row');
    row.setAttribute('role', 'img');
    row.setAttribute('aria-label', recruit.stars + '-star recruit');
    for (var i = 1; i <= 5; i += 1) {
      var star = el('span', 'ege-stars__star' + (i > recruit.stars ? ' is-empty' : ''), '\u2605');
      star.setAttribute('aria-hidden', 'true');
      row.appendChild(star);
    }
    box.appendChild(row);
    /* The state rank, and beside it the same position across the country.
       The dot holds on to the state and the national rank holds together,
       so a narrow header breaks the line after the dot and nowhere in
       "#13 nationally". */
    var rank = '#' + recruit.stateRank + ' ' + recruit.position + ' in ' + recruit.state;
    if (recruit.nationalRank) {
      rank += '\u00a0\u00b7 #' + recruit.nationalRank + '\u00a0nationally';
    }
    box.appendChild(el('span', 'ege-stars__rank', rank));
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
  var showGrades = false;
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
     come is on the ladder in data/players.js but has nothing to show --
     except to an admin, who sees a season from the day its file goes in, so
     it can be looked over before it is rolled over to. */
  function loggedSeasons() {
    return EGE.seasonsPlayed().filter(function (year) {
      return year <= EGE.currentSeason || EGE.wallet.admin();
    });
  }

  /* A season the admin can see ahead of everybody else. */
  function isPreview(year) {
    return year > EGE.currentSeason;
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
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    var options = document.getElementById('seasonPick').options;
    Array.prototype.forEach.call(options, function (option) {
      var year = Number(option.value);
      var klass = player ? EGE.classFor(player, year) : null;
      option.textContent = (narrowBar.matches || !klass
        ? String(year)
        : year + ' \u00b7 ' + klass) + (isPreview(year) ? ' \u00b7 Preview' : '');
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

  /* --- straight to one game ---------------------------------------------

     What a card's game button does: open the player's page on the card's
     season and land on that game in the game log, picked out. The season is
     set before the page is drawn, so the switcher does not throw it back to
     the live one on the way in. */
  var spotlight = null;

  EGE.goToGame = function (slug, season, week) {
    if (!EGE.playerBySlug(slug)) { return; }
    spotlight = { slug: slug, season: season, week: Number(week) };
    seasonFor = slug;
    viewedSeason = season === EGE.currentSeason ? null : season;
    if (window.location.hash.replace(/^#/, '') === slug) { route(); }
    else { window.location.hash = slug; }
  };

  function spotlightGame(player) {
    if (!spotlight || spotlight.slug !== player.slug || spotlight.season !== shownSeason()) { return; }
    var week = spotlight.week;
    spotlight = null;

    var panel = document.getElementById('gameLogPanel');
    if (panel.hidden) { return; }
    if (panel.classList.contains('is-collapsed')) {
      panel.querySelector('.ege-collapse').click();
    }
    var row = panel.querySelector('tbody tr[data-week="' + week + '"]');
    if (!row) { return; }
    row.classList.add('is-spotlit');
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
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

  /* A wager's sticker: a chip with the mark of the team it is on, or BET on
     the drawer's blank one. Black until the game is out; then `outcome`
     turns it green for a win and red for a loss (Sam, 2026-10-20). */
  function wagerStickerEl(logo, size, seed, outcome) {
    var sticker = el('span', 'ege-sticker ege-sticker--wager' +
      (outcome ? ' ege-sticker--' + outcome : ''));
    if (size) { sticker.style.setProperty('--sticker-size', size + 'px'); }
    sticker.style.setProperty('--tilt', scatter(seed == null ? 'wager' : seed).tilt + 'deg');

    var face = el('span', 'ege-sticker__face');
    if (logo) {
      var mark = el('img', 'ege-sticker__logo');
      mark.src = logo;
      mark.alt = '';
      mark.addEventListener('error', function () {
        mark.replaceWith(el('span', 'ege-sticker__text', 'BET'));
      });
      face.appendChild(mark);
    } else {
      face.appendChild(el('span', 'ege-sticker__text', 'BET'));
    }
    sticker.appendChild(face);
    return sticker;
  }

  /* The mark of one side of a player's game: his own team's, or the
     opponent's off ESPN (college and NFL only, as the schedule draws). */
  function sideLogo(player, game, side) {
    if (side === 'for') {
      var team = EGE.teamFor(player, game.season);
      return team ? team.logo : null;
    }
    return EGE.tierFor(game.season) !== 'highSchool' && EGE.logoFor ? EGE.logoFor(game.opponent) : null;
  }

  /* Width only. A phone fires `resize` every time its address bar slides in
     or out as you scroll, which changes the height and nothing else --
     re-fitting then was work for nothing, done in the middle of a scroll. */
  var windowWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === windowWidth) { return; }
    windowWidth = window.innerWidth;
    refitTally();
    drawBracketLines();
  });

  /* And whenever the header itself changes width without the window doing
     so -- a scrollbar arriving as the schedule fills the page under it is
     the usual one. Width only: re-fitting can change the header's height,
     and reacting to that would go round in a circle. */
  if (window.ResizeObserver) {
    var headerWidth = 0;
    new window.ResizeObserver(function (entries) {
      var width = Math.round(entries[0].contentRect.width);
      if (!width || width === headerWidth) { return; }
      headerWidth = width;
      refitTally();
      drawBracketLines();
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
    var wager = canSeeStickers(player) ? EGE.wagerOn(player, game) : null;
    var booster = !wager && canSeeStickers(player) ? EGE.boosterOn(player, game) : null;
    var placed = booster || wager;
    var stuck = placed ? {
      id: placed.id || (player.slug + '-' + game.week),
      item_key: placed.key,
      item_name: placed.name,
      hardcoded: placed.hardcoded
    } : null;

    if (stuck) {
      var peelable = mine && !played && !stuck.hardcoded;
      var applied = el('button', 'ege-slot__applied ' +
        (peelable ? 'ege-slot__applied--peelable' : 'ege-slot__applied--stuck'));
      applied.type = 'button';
      applied.disabled = !peelable;
      var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
      var settled = !wager || !wager.outcome ? ' \u2014 the game has been played, it stays put'
        : wager.outcome === 'won' ? ' \u2014 won: the game paid double credits'
        : wager.outcome === 'lost' ? ' \u2014 lost: the game paid no credits'
        : ' \u2014 a tie: the game paid its credits as usual';
      applied.title = peelable
        ? stuck.item_name + ' \u2014 ' + (touch ? 'tap' : 'click') + ' to ' +
          (wager ? 'take it off' : 'peel it off')
        : stuck.item_name + settled;
      applied.setAttribute('aria-label', applied.title);
      applied.dataset.restTitle = applied.title;
      /* How big it is belongs to the stylesheet -- it is bigger than the row
         on purpose, and how much bigger depends on how much row there is.
         What is settled here is only the scatter: which way this one leans
         and how far it hangs over the row above or below. */
      var seed = stuck.id;
      var placing = scatter(seed);
      var sticker = wager
        ? wagerStickerEl(sideLogo(player, game, wager.side), null, seed, wager.outcome)
        : stickerEl(stuck.item_key, null, seed);
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

    /* No booster goes on a playoff game. Boosters are a thing you plan a
       regular season around -- you are spending a limited drawer on the
       weeks you think matter -- and the postseason is not planned, it is
       whatever the bracket hands you. A wager does (Sam, 2026-10-20), so the
       plus is there and the drawer offers only that. */

    /* A booster goes on any game that has not been published yet.

       Not "any game with no result in it" — the season is written up front,
       so every game has a result from day one and that would mean nobody
       could ever use a booster. Holding a week back is exactly the window in
       which a player puts a sticker on it and the admin writes it into the
       file before putting the week out. */
    /* Nor on a bye: there is no game to put it on (Sam, 2026-10-20). */
    if (mine && !played && !game.bye && game.season === EGE.currentSeason) {
      var add = el('button', 'ege-slot__add', '+');
      add.type = 'button';
      add.title = game.playoff ? 'Put a wager on this game' : 'Put a booster or a wager on this game';
      add.setAttribute('aria-label', 'Put a booster or a wager on week ' + game.week);
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

  /* An NFL line is worked out from the rosters, which the page has nearly
     always loaded by the time anybody reaches for a plus. If it has not, the
     drawer is drawn again once they are in. */
  function openDrawer(player, game) {
    var opened = drawerFor = { player: player, game: game };
    var waiting = EGE.leagueOf(player, game.season) === 'nfl' && EGE.nflRosters &&
      EGE.nflRosters.get(game.season) === undefined;
    renderDrawer();
    if (!waiting) { return; }
    EGE.lineReady(player, game.season).then(function () {
      if (drawerFor === opened) { renderDrawer(); }
    });
  }

  /* The drawer, one row of it where the screen has the room (Sam,
     2026-10-20): the game and what the season has left on the left, then
     the boosters, then the wager, and a cross in the corner to shut it. */
  function renderDrawer() {
    if (!drawerFor) { return; }
    var again = Boolean(drawer);
    if (drawer) { drawer.remove(); }

    var game = drawerFor.game;
    var player = drawerFor.player;

    /* Drawn again in place, it does not slide up a second time. */
    drawer = el('div', 'ege-drawer' + (again ? ' ege-drawer--again' : ''));
    var inner = el('div', 'ege-drawer__inner');

    /* What the season has room for: five boosters in all, so many of each,
       and two wagers. */
    var used = EGE.boostersUsed(player, game.season);
    var wagers = EGE.wagerRoom(player, game.season);

    var title = el('div', 'ege-drawer__title');
    title.appendChild(el('small', null, 'Week ' + game.week + ' \u00b7 ' +
      (game.home || game.neutral ? 'vs ' : 'at ') + game.opponent));
    title.appendChild(el('span', 'ege-drawer__heading', 'Your Stickers'));
    title.appendChild(el('span', 'ege-drawer__room',
      used.total + ' of ' + EGE.shop.boosterSeasonLimit + ' boosters \u00b7 ' +
      wagers.used + ' of ' + wagers.limit + ' wagers used'));
    inner.appendChild(title);

    var owned = shopState.inventory.filter(function (row) {
      return row.consumable && STICKER_LOOK[row.item_key];
    });

    /* No booster on a playoff game, or on one he is known to be missing
       hurt (Sam, 2026-10-20). A wager goes on either. */
    if (game.playoff) {
      inner.appendChild(el('span', 'ege-drawer__empty',
        'No boosters in the playoffs. A wager still goes on.'));
    } else if (EGE.outInjured(player, game)) {
      inner.appendChild(el('span', 'ege-drawer__empty',
        'Out injured this week, so no boosters. A wager still goes on.'));
    } else if (!owned.length) {
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
        var room = EGE.boosterRoom(player, row.item_key, game.season);
        pick.appendChild(el('span', 'ege-pick__left', room.ok
          ? Math.min(room.left, room.totalLeft) + ' left'
          : 'Limit hit'));
        if (!room.ok) {
          pick.disabled = true;
          pick.classList.add('is-spent');
          pick.title = room.reason;
        }
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

    inner.appendChild(wagerPicker(player, game, wagers));

    var close = el('button', 'ege-drawer__close', '\u00d7');
    close.type = 'button';
    close.title = 'Close';
    close.setAttribute('aria-label', 'Close your stickers');
    close.addEventListener('click', closeDrawer);
    inner.appendChild(close);

    drawer.appendChild(inner);
    document.body.appendChild(drawer);
  }

  /* The wager in the drawer: the blank chip, the line on the game (see
     js/lines.js) and the projected score, and a button for each side with
     its line, the way a sportsbook lists one. Picking one puts the wager on
     the game at that line. */
  function wagerPicker(player, game, room) {
    var box = el('div', 'ege-drawer__wager');
    box.appendChild(wagerStickerEl(null, 64, 'wager-' + game.week));

    var names = EGE.wagerSides(player, game);
    var odds = EGE.gameLine(player, game);
    var words = el('div', 'ege-drawer__wagerwords');
    words.appendChild(el('span', 'ege-drawer__wagertitle',
      'Wager \u00b7 ' + room.left + ' of ' + room.limit + ' left'));
    if (odds) {
      var under = odds.favorite === 'for' ? 'against' : 'for';
      words.appendChild(el('span', 'ege-drawer__line',
        EGE.sideName(names[odds.favorite]) + ' by ' + odds.spread));
      words.appendChild(el('span', 'ege-drawer__wagernote', room.ok
        ? 'Projected ' + odds.projected[odds.favorite] + '\u2013' + odds.projected[under] +
          '. Beat the line for double credits, miss it for none.'
        : room.reason));
    } else {
      words.appendChild(el('span', 'ege-drawer__wagernote', 'There is no line on this game.'));
    }
    box.appendChild(words);

    var sides = el('div', 'ege-drawer__sides');
    ['for', 'against'].forEach(function (side) {
      var pick = el('button', 'ege-wagerpick');
      pick.type = 'button';
      var logo = sideLogo(player, game, side);
      if (logo) {
        var mark = el('img', 'ege-wagerpick__logo');
        mark.src = logo;
        mark.alt = '';
        mark.addEventListener('error', function () { mark.remove(); });
        pick.appendChild(mark);
      }
      var name = EGE.sideName(names[side]);
      var line = odds ? odds[side] : null;
      pick.appendChild(el('span', 'ege-wagerpick__name', name));
      pick.appendChild(el('span', 'ege-wagerpick__line', EGE.lineText(line)));
      pick.title = odds ? 'Take ' + name + ' ' + EGE.lineText(line) + ': ' + EGE.coverText(name, line) : name;
      pick.disabled = !room.ok || !odds;
      pick.addEventListener('click', function () {
        pick.disabled = true;
        EGE.wallet.applyWager(player.email, game.season, game.week, side, line).then(function (res) {
          if (res.ok) {
            sayShop(res.message, false);
            closeDrawer();
          } else {
            announce(res.message, true);
          }
          refreshShop();
        });
      });
      sides.appendChild(pick);
    });
    box.appendChild(sides);
    return box;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') { return; }
    if (drawer) { closeDrawer(); }
    disarmSticker();
  });

  /* A click anywhere off the drawer shuts it (Sam, 2026-10-20) -- the tabs,
     the page, the schedule -- except a plus, which opens it on its own game
     instead. A button in the drawer that drew the drawer again is no longer
     in the page by the time the click gets here; that was a click inside. */
  document.addEventListener('click', function (event) {
    if (!drawer) { return; }
    var target = event.target;
    if (!target || !target.isConnected || drawer.contains(target)) { return; }
    if (target.closest && target.closest('.ege-slot__add')) { return; }
    closeDrawer();
  });

  /* An opponent's name with its mark in front of it, the mark straight off
     ESPN's image server (see data/logos.js). College and NFL seasons only:
     ESPN carries no high schools, and a Washington or a Lehigh on a high
     school schedule is not the college of that name. A mark that fails to
     load takes itself out rather than leaving a broken-image box in the
     row. */
  function opponentName(cell, game) {
    var name = game.opponent;
    /* An NFL team is its city alone, and the mark and the city are a link
       to its page on Teams, for the season the game is in. The link looks
       exactly like the name did; only a pointer over it says it goes
       somewhere (Sam, 2026-10-20). */
    var nfl = EGE.tierFor(game.season, gamePlayer(game)) === 'nfl' ? EGE.nfl.keyByName(name) : null;
    var holder = cell;
    if (nfl) {
      holder = el('a', 'ege-opplink');
      holder.href = '#teams/' + EGE.nfl.slug(nfl);
      holder.title = name;
      holder.addEventListener('click', function () { teamsPicked = game.season; });
      cell.appendChild(holder);
    }
    var src = EGE.tierFor(game.season) !== 'highSchool' && EGE.logoFor && EGE.logoFor(name);
    if (src) {
      var logo = el('img', 'ege-teamlogo');
      logo.src = src;
      logo.alt = '';                 /* the name beside it says it */
      logo.width = 20;
      logo.height = 20;
      logo.loading = 'lazy';
      logo.decoding = 'async';
      logo.addEventListener('error', function () { logo.remove(); });
      holder.appendChild(logo);
    }
    holder.appendChild(el('span', 'fb-name', nfl ? EGE.nfl.city(nfl) : name));
  }

  /* A played game's score as the result pill -- W 38-9, L 21-24/OT -- or a
     dash for one still to be played. The same on a player's schedule, a
     team's and the game log. */
  function resultTag(game) {
    if (!EGE.isFinal(game)) { return el('span', 'ege-schedule__pending', '—'); }
    var won = game.result.teamScore > game.result.opponentScore;
    return el('span', 'fb-tag fb-tag--num ege-result ' + (won ? 'fb-tag--sage' : 'fb-tag--clay'),
      (won ? 'W ' : 'L ') + game.result.teamScore + '–' + game.result.opponentScore +
      (game.overtime ? '/OT' : ''));
  }

  /* Whose game it is, from the stamp EGE.gamesFor puts on it. */
  function gamePlayer(game) {
    return game && game.slug ? EGE.playerBySlug(game.slug) : null;
  }

  /* A high school's postseason is its playoffs, and so is the NFL's; a
     college's is title games and bowls as much as a bracket. */
  function postseasonWord(game) {
    return EGE.tierFor(game.season, gamePlayer(game)) === 'college' ? 'Postseason' : 'Playoff';
  }

  /* The asterisk on a schedule: a conference game in college, and in the
     NFL a division game -- every NFL game is a conference game or very
     nearly, so the division is the one worth marking. */
  function marksGame(game) {
    return EGE.tierFor(game.season, gamePlayer(game)) === 'nfl' ? Boolean(game.division)
      : Boolean(game.conference);
  }

  function markWord(game) {
    return EGE.tierFor(game.season, gamePlayer(game)) === 'nfl' ? 'Division' : 'Conference';
  }

  function scheduleRow(game, opensPlayoffs) {
    var row = el('tr');

    /* The first postseason row carries the line that divides the two halves
       of the year. */
    if (opensPlayoffs) { row.classList.add('ege-schedule__break'); }

    row.appendChild(el('td', 'ege-schedule__week', game.week));

    row.appendChild(el('td', null, gameDate(game)));

    var opponent = el('td', 'ege-schedule__opponent');
    if (game.bye) {
      /* Nobody to play and nowhere to be. The row is still here because the
         week is: a bye is a round of the bracket, and a schedule that skips
         it makes the weeks either side look wrong. */
      opponent.appendChild(el('span', 'ege-schedule__bye', 'Bye'));
    } else {
      opponent.appendChild(el('span', 'ege-schedule__side', game.home || game.neutral ? 'vs' : 'at'));
      opponentName(opponent, game);
    }
    if (marksGame(game)) {
      var mark = el('abbr', 'ege-schedule__conf', '*');
      mark.title = markWord(game) + ' game';
      opponent.appendChild(mark);
    }
    /* Two of them for the postseason, one for a conference game. A playoff
       game is never also a conference game, so the two never stack -- a
       conference title game is postseason, not a standings game. */
    if (game.playoff) {
      var post = el('abbr', 'ege-schedule__conf', '**');
      post.title = postseasonWord(game) + ' game';
      opponent.appendChild(post);
    }
    if (showScouts && game.scouts) { opponent.appendChild(scoutMark()); }
    row.appendChild(opponent);

    /* The defense across the way, graded for what this player does. */
    if (showGrades) {
      var gradeCell = el('td', 'ege-schedule__grade');
      var grade = EGE.defenseGrade(schedulePlayer, game);
      if (grade) {
        var chip = el('span', 'ege-grade ege-grade--' + grade.letter.toLowerCase(), grade.letter);
        chip.title = grade.text;
        chip.setAttribute('aria-label', grade.text);
        gradeCell.appendChild(chip);
      }
      row.appendChild(gradeCell);
    }

    var result = el('td', 'num ege-schedule__result');
    result.appendChild(resultTag(game));
    row.appendChild(result);

    /* What the game paid. Only his own, and an admin's — a balance is nobody
       else's business, so on anyone else's schedule the column is not drawn
       at all, the same as the boosters beside it. */
    if (showBoosters) {
      var credits = el('td', 'num ege-schedule__credits');
      var earned = schedulePlayer ? EGE.creditsFromGame(schedulePlayer, game) : 0;
      /* A lost wager still shows what it paid: nothing, and the diamonds,
         which a wager leaves alone. */
      var wagered = schedulePlayer && EGE.isFinal(game) ? EGE.wagerOn(schedulePlayer, game) : null;
      var lost = Boolean(wagered && wagered.outcome === 'lost');
      if (earned || lost) {
        var tag = el('span', 'ege-schedule__paid' + (lost ? ' ege-schedule__paid--lost' : ''), '+' + earned);
        tag.title = lost ? 'No credits for this game: ' + wagered.name.replace(/^Wager/, 'the wager') + ' lost'
          : earned + ' credits for this game' +
            (wagered && wagered.outcome === 'won' ? ', doubled by ' + wagered.name.replace(/^Wager/, 'the wager') : '');
        credits.appendChild(tag);

        /* And its diamonds beside them: the same number, or more when a
           booster was riding on the game. */
        var gems = EGE.diamondsFromGame(schedulePlayer, game);
        if (gems) {
          var gemTag = el('span', 'ege-schedule__paid ege-schedule__paid--gem', '+' + gems);
          var mark = el('span', 'ege-gem');
          mark.setAttribute('aria-hidden', 'true');
          gemTag.appendChild(mark);
          gemTag.title = gems + ' diamonds for this game';
          credits.appendChild(gemTag);
        }
      } else {
        credits.appendChild(el('span', 'ege-schedule__pending', '—'));
      }
      row.appendChild(credits);
    }

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

  /* --- the scouting report ----------------------------------------------

     Under an NFL player's next game, in the colour of the team he is about
     to play: a ring filled to that defense's rating against what he does
     (run defense for a back, pass defense for everyone else) with where it
     ranks in the NFL, and the three best of the defenders he will face,
     each with his overall and the pop-up the Teams page opens (Sam,
     2026-10-20). The live season only, and the next game rather than the
     next week, so a bye puts it under the game after it. The rosters are
     the sim's as they stand, injuries and all; see EGE.nflRosters.facing. */
  function nextNflGame(player, season, games) {
    if (season !== EGE.currentSeason || EGE.tierFor(season, player) !== 'nfl') { return null; }
    return games.filter(function (game) {
      return !game.bye && !EGE.isPublished(game.season, game.week);
    })[0] || null;
  }

  var FACING_POS = { DI: 'DT' };
  var FACING_SHOWN = 3;

  /* The defense's rating as a ring that far round, the number in it, and
     what it is and where it ranks beside it. */
  function scoutRing(grade) {
    var box = el('div', 'ege-scoutrep__rating');
    var ring = el('div', 'ege-scoutrep__ring');
    ring.style.setProperty('--fill', Math.max(0, Math.min(100, grade.score)) + '%');
    ring.setAttribute('role', 'img');
    ring.setAttribute('aria-label', grade.short + ' ' + grade.score + ' out of 100');
    ring.appendChild(el('span', 'ege-scoutrep__score', String(grade.score)));
    box.appendChild(ring);
    var words = el('div', 'ege-scoutrep__words');
    words.appendChild(el('span', 'ege-scoutrep__what', grade.short));
    var rank = el('span', 'ege-scoutrep__rank');
    rank.appendChild(el('b', null, EGE.ordinal(grade.rank).toLowerCase()));
    rank.appendChild(document.createTextNode(' of ' + grade.of + ' in the NFL'));
    words.appendChild(rank);
    box.appendChild(words);
    box.title = grade.text;
    return box;
  }

  function appendFaceoff(body, player, game) {
    var key = EGE.nfl.keyByName(game.opponent);
    var position = EGE.positionFor(player, game.season);
    var rows = key ? EGE.nflRosters.facing(game.season, key, position) : null;
    if (!rows || !rows.length) { return false; }
    var team = EGE.nfl.teams[key] || {};
    var grade = EGE.nflRosters.defenseGrade(game.season, key, position);

    var row = el('tr', 'ege-faceoff');
    var cell = el('td');
    cell.colSpan = document.querySelectorAll('#scheduleTableWrap thead th:not([hidden])').length;
    var strip = el('div', 'ege-faceoff__strip');
    strip.style.background = team.color || '';

    var head = el('div', 'ege-faceoff__head');
    head.appendChild(el('span', 'ege-faceoff__title', 'Scouting Report'));
    var src = EGE.nfl.logo(key);
    if (src) {
      var logo = el('img', 'ege-faceoff__logo');
      logo.src = src;
      logo.alt = team.name || '';
      logo.title = team.name || '';
      logo.addEventListener('error', function () { logo.remove(); });
      head.appendChild(logo);
    }
    strip.appendChild(head);

    var report = el('div', 'ege-scoutrep');
    if (grade) { report.appendChild(scoutRing(grade)); }

    var list = el('ul', 'ege-faceoff__list');
    rows.slice().sort(function (a, b) { return (b.ovr || 0) - (a.ovr || 0); })
      .slice(0, FACING_SHOWN).forEach(function (sim) {
        var who = nflRow(sim, game.season, key);
        var item = el('li', 'ege-faceoff__player');
        var card = el('div', 'ege-teamchip ege-teamchip--nfl ege-teamchip--faceoff');
        EGE.cardsView.pressable(card, who.name, function () { openNflPlayer(who); });
        card.appendChild(rosterFace(who));
        var text = el('span', 'ege-teamchip__text');
        text.appendChild(el('span', 'ege-teamchip__name', who.name));
        var meta = el('span', 'ege-teamchip__meta');
        var pos = el('abbr', 'ege-room__class', FACING_POS[sim.pos] || sim.pos);
        pos.title = POSITION_NAMES[sim.pos] || sim.pos;
        meta.appendChild(pos);
        if (who.archetype) { meta.appendChild(el('span', 'ege-teamchip__arch', who.archetype)); }
        text.appendChild(meta);
        card.appendChild(text);
        var box = overallBox(who.overall, 'ege-ovrbox--chip');
        if (box) { card.appendChild(box); }
        item.appendChild(card);
        list.appendChild(item);
      });
    report.appendChild(list);
    strip.appendChild(report);
    cell.appendChild(strip);
    row.appendChild(cell);
    body.appendChild(row);

    /* And a row nobody sees, so the games under it keep the same stripe
       they had: the kit stripes every second row, whatever is in it (see
       .ege-schedule__break in site.css). */
    var keep = el('tr', 'ege-faceoff__keep');
    keep.hidden = true;
    keep.setAttribute('aria-hidden', 'true');
    body.appendChild(keep);
    return true;
  }

  function renderSchedule(player) {
    var panel = document.getElementById('schedulePanel');
    var body = document.getElementById('scheduleBody');
    var season = shownSeason();
    /* The whole regular season, and the postseason only as far as the next
       game: a row for the state final would be telling the player they get
       there. Everything counted under the table is counted from these too. */
    var games = EGE.scheduleFor(player, season);

    /* Intel is good for the season it was bought in, so an older season on
       the switcher shows no scouts. */
    showScouts = canSeeScouts(player) && season === EGE.currentSeason;
    showBoosters = canSeeStickers(player);
    /* The column is only there when there is something in it: a college
       season, against schools with numbers, or an NFL one once the rosters
       its grades come from are in. They arrive after the first draw, and
       the schedule is drawn again with them. */
    showGrades = games.some(function (game) { return EGE.defenseGrade(player, game); });
    if (EGE.tierFor(season, player) === 'nfl' && EGE.nflRosters.get(season) === undefined) {
      EGE.nflRosters.load(season).then(function () {
        if (schedulePlayer === player && shownSeason() === season && !viewPlayer.hidden) { renderSchedule(player); }
      });
    }

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

    document.getElementById('scheduleGradeHead').hidden = !showGrades;
    document.getElementById('scheduleCreditsHead').hidden = !showBoosters;
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
    var next = nextNflGame(player, season, games);
    games.forEach(function (game) {
      var row = scheduleRow(game, game === firstPlayoff);
      body.appendChild(row);
      /* The game and its report boxed in together by a heavy rule above
         and below (Sam, 2026-10-20). */
      if (game === next && appendFaceoff(body, player, game)) { row.classList.add('ege-schedule__next'); }
    });

    /* Out of the games, not the weeks: an NFL bye is a row of its own. */
    var fixtures = games.filter(function (game) { return !game.bye; });
    var conference = fixtures.filter(marksGame).length;
    var legend = conference ? '* ' + markWord(fixtures[0]).toLowerCase() + ' game (' + conference +
      ' of ' + fixtures.length + ')' : '';

    var playoff = games.filter(function (game) { return game.playoff; });
    if (playoff.length) {
      legend += (legend ? ' · ' : '') + '** ' + postseasonWord(playoff[0]).toLowerCase() + ' game';
    }

    if (showScouts) {
      var scouted = EGE.scoutedGames(player, season).length;
      legend += (legend ? ' · ' : '') + 'Intel: scouts at ' + scouted + ' games this season';
    }
    setLegend('scheduleFoot', 'scheduleLegend', legend);

    renderBracket(player);
    showScheduleView();
  }


  /* --- the conference standings --------------------------------------------

     The whole conference rather than the one line in the header: every
     division, the team's own first, ordered the way EGE.divisionTable orders
     them, with the team's row picked out so who is above it and who is
     below it reads at a glance. Conference games only -- nobody outside the
     six has a non-conference result to count -- as of the published weeks,
     the same as the record. */

  function schoolMark(name) {
    var src = EGE.logoFor && EGE.logoFor(name);
    if (!src) { return null; }
    var logo = el('img', 'ege-teamlogo');
    logo.src = src;
    logo.alt = '';
    logo.width = 20;
    logo.height = 20;
    logo.loading = 'lazy';
    logo.decoding = 'async';
    logo.addEventListener('error', function () { logo.remove(); });
    return logo;
  }

  /* The whole conference as one table: one row of headings at the top, and
     every school under it -- the team's own division first, each division
     in its own order, a rule where the next one starts and its name, short,
     in a column of its own. Every heading sorts the table the way the game
     log's do: biggest first, then smallest, then back to the standings.
     Sorted, the divisions mix: the question then is who scored the most in
     the conference, not who leads the East.

     The place (#) is always the division place, whatever the table is
     sorted on, so a school's standing never changes with a click. */
  var standSort = { key: null, dir: null };   /* set on the first draw: DOWN is declared further down */
  var standSchool = null;
  var standDrawn = null;               /* what renderTeamStandings drew last */

  /* 'Big Ten East' within the Big Ten is 'East'. */
  function shortDivision(division, conference) {
    var short = division.indexOf(conference + ' ') === 0 ? division.slice(conference.length + 1) : division;
    return short || division;
  }

  function winPct(wins, losses) {
    return wins + losses ? wins / (wins + losses) : null;
  }

  /* What each column sorts on: a number, biggest first on the first click,
     or null for a school with nothing to sort on yet, which always goes
     last. The place and the school's name read better smallest and A first,
     so theirs are turned round to match. */
  var STANDING_SORTS = {
    place: function (row) { return row.started ? -row.place : null; },
    team: null,
    div: null,
    conf: function (row) {
      var pct = winPct(row.wins, row.losses);
      return pct === null ? null : pct * 1000 + row.wins;
    },
    overall: function (row) {
      if (!row.overall) { return null; }
      var pct = winPct(row.overall.wins, row.overall.losses);
      return pct === null ? null : pct * 1000 + row.overall.wins;
    },
    /* An NFL row's games inside its division and its conference. */
    divrec: function (row) {
      if (!row.divisionRecord) { return null; }
      var pct = winPct(row.divisionRecord.wins, row.divisionRecord.losses);
      return pct === null ? null : pct * 1000 + row.divisionRecord.wins;
    },
    confrec: function (row) {
      if (!row.conferenceRecord) { return null; }
      var pct = winPct(row.conferenceRecord.wins, row.conferenceRecord.losses);
      return pct === null ? null : pct * 1000 + row.conferenceRecord.wins;
    },
    streak: function (row) { return row.streak ? (row.streak.won ? 1 : -1) * row.streak.count : null; },
    pf: function (row) { return row.wins + row.losses ? row.pointsFor : null; },
    pa: function (row) { return row.wins + row.losses ? row.pointsAgainst : null; },
    diff: function (row) { return row.wins + row.losses ? row.pointsFor - row.pointsAgainst : null; },
    change: function (row) { return typeof row.change === 'number' ? row.change : null; }
  };

  function sortStandings(rows) {
    var key = standSort.key;
    if (!key) { return rows; }
    var dir = standSort.dir;
    var text = key === 'team' ? 'school' : key === 'div' ? 'divShort' : null;
    return rows.slice().sort(function (a, b) {
      if (text) {
        var order = a[text].localeCompare(b[text]) || (a.order - b.order);
        return dir === DOWN ? order : -order;
      }
      var left = STANDING_SORTS[key](a);
      var right = STANDING_SORTS[key](b);
      /* Level, or nothing to sort on: the standings' own order. */
      if (left === right) { return a.order - b.order; }
      if (left === null) { return 1; }
      if (right === null) { return -1; }
      return dir === DOWN ? right - left : left - right;
    });
  }

  function standingsHead(label, key, title, className) {
    var sorted = standSort.key === key;
    var th = el('th', (className ? className + ' ' : '') + 'is-sortable' + (sorted ? ' is-sorted' : ''));
    var button = el('button', 'ege-sort', label);
    button.type = 'button';
    button.dataset.sortKey = key;
    if (title) { button.title = title; }
    if (sorted) { button.appendChild(sortMark(standSort.dir)); }
    th.appendChild(button);
    return th;
  }

  function standingsTable(conference, school) {
    var tables = conference.tables;
    if (standSchool !== school) {
      standSchool = school;
      standSort = { key: null, dir: DOWN };
    }
    var divided = tables.length > 1;
    var withOverall = conference.overall;
    /* An NFL table is on the whole record, with the games inside the
       division and the conference as columns of their own. */
    var nfl = Boolean(conference.nfl);

    /* Every school, in the standings' own order, carrying what it needs. */
    var rows = [];
    tables.forEach(function (table) {
      var started = table.rows.some(function (row) { return row.wins + row.losses; });
      table.rows.forEach(function (row, i) {
        rows.push(Object.assign({}, row, {
          place: i + 1,
          started: started,
          divShort: shortDivision(table.division, conference.conference),
          division: table.division,
          divStart: i === 0 && rows.length > 0,
          order: rows.length
        }));
      });
    });
    var shown = sortStandings(rows);

    var wrap = el('div', 'ege-standings__division');
    var scroller = el('div', 'fb-tablewrap');
    var t = el('table', 'fb-table ege-standings__table');
    var head = el('tr');
    var columns = [
      ['#', 'place', 'Place in the division', 'num ege-standings__placehead'],
      ['Team', 'team', 'School', null]
    ];
    if (divided) { columns.push(['Div', 'div', 'Division', 'ege-standings__divcol']); }
    if (nfl) {
      columns.push(['W-L', 'conf', 'Record, every game', 'num'],
                   ['vDiv', 'divrec', 'Record against the division', 'num'],
                   ['vConf', 'confrec', 'Record against the ' + conference.conference, 'num'],
                   ['Strk', 'streak', 'Streak', 'num'],
                   ['PF', 'pf', 'Points for', 'num ege-standings__pts'],
                   ['PA', 'pa', 'Points against', 'num ege-standings__pts'],
                   ['Diff', 'diff', 'Point differential', 'num ege-standings__pts']);
    } else {
      columns.push(['Conf', 'conf', 'Conference record', 'num']);
      if (withOverall) { columns.push(['Ovr', 'overall', 'Overall record, every game', 'num']); }
      columns.push(['Strk', 'streak', 'Conference streak', 'num'],
                   ['PF', 'pf', 'Conference points for', 'num ege-standings__pts'],
                   ['PA', 'pa', 'Conference points against', 'num ege-standings__pts'],
                   ['Diff', 'diff', 'Conference point differential', 'num ege-standings__pts']);
    }
    columns.push(['Chg', 'change', 'Places moved since the week before', 'num']);
    columns.forEach(function (col) { head.appendChild(standingsHead(col[0], col[1], col[2], col[3])); });
    var thead = el('thead');
    thead.appendChild(head);
    t.appendChild(thead);
    var sortedAt = columns.map(function (col) { return col[1]; }).indexOf(standSort.key);

    var body = el('tbody');
    shown.forEach(function (row) {
      var tr = el('tr');
      if (row.school === school) { tr.classList.add('is-ours'); }
      /* A rule where the next division starts, in the standings' own order;
         sorted, the divisions are mixed and there is nowhere to draw one. */
      if (row.divStart && !standSort.key) { tr.classList.add('is-divstart'); }

      tr.appendChild(el('td', 'num ege-standings__place', row.started ? String(row.place) : '–'));

      var name = el('td', 'ege-standings__team');
      var mark = schoolMark(row.school);
      if (mark) { name.appendChild(mark); }
      name.appendChild(el('span', 'fb-name', row.school));
      tr.appendChild(name);

      /* East in full, or E on a phone. */
      if (divided) {
        var div = el('td', 'ege-standings__divcol');
        div.appendChild(el('span', 'ege-standings__divlong', row.divShort));
        div.appendChild(el('span', 'ege-standings__divletter', row.divShort.charAt(0)));
        div.title = row.division;
        tr.appendChild(div);
      }

      tr.appendChild(el('td', 'num', row.wins + '-' + row.losses));
      if (withOverall) {
        tr.appendChild(el('td', 'num', row.overall ? row.overall.wins + '-' + row.overall.losses : '–'));
      }
      if (nfl) {
        [row.divisionRecord, row.conferenceRecord].forEach(function (record) {
          tr.appendChild(el('td', 'num', record ? record.wins + '-' + record.losses : '–'));
        });
      }

      /* The run it is on in conference play (in the NFL, every game), green
         for wins, red for losses. */
      var streakCell = el('td', 'num');
      if (row.streak) {
        var run = el('span', 'ege-streak ege-streak--' + (row.streak.won ? 'win' : 'loss'), row.streak.text);
        run.title = row.streak.count + (nfl ? ' ' : ' conference ') + (row.streak.won ? 'win' : 'loss') +
          (row.streak.count === 1 ? '' : (row.streak.won ? 's' : 'es')) + ' in a row';
        streakCell.appendChild(run);
      } else {
        streakCell.appendChild(el('span', 'ege-schedule__pending', '–'));
      }
      tr.appendChild(streakCell);

      tr.appendChild(el('td', 'num ege-standings__pts', String(row.pointsFor)));
      tr.appendChild(el('td', 'num ege-standings__pts', String(row.pointsAgainst)));
      var diff = row.pointsFor - row.pointsAgainst;
      tr.appendChild(el('td', 'num ege-standings__pts ege-standings__diff' +
        (diff > 0 ? ' is-up' : diff < 0 ? ' is-down' : ''), (diff > 0 ? '+' : '') + diff));

      /* How many places it has moved since the week before: a green arrow up,
         a red one down, a dash for none. */
      var change = el('td', 'num ege-standings__change');
      if (row.change > 0 || row.change < 0) {
        var up = row.change > 0;
        change.classList.add(up ? 'is-up' : 'is-down');
        change.appendChild(el('span', 'ege-standings__arrow', up ? '▲' : '▼'));
        change.appendChild(document.createTextNode(String(Math.abs(row.change))));
        change.title = (up ? 'Up ' : 'Down ') + Math.abs(row.change) +
          (Math.abs(row.change) === 1 ? ' place' : ' places') + ' since last week';
      } else {
        change.appendChild(el('span', 'ege-schedule__pending', '–'));
        if (row.change === 0) { change.title = 'No change since last week'; }
      }
      tr.appendChild(change);

      if (sortedAt !== -1 && tr.children[sortedAt]) { tr.children[sortedAt].classList.add('is-sorted-cell'); }
      body.appendChild(tr);
    });
    t.appendChild(body);
    scroller.appendChild(t);
    wrap.appendChild(scroller);

    /* No note under the table: Sam took the "Through week N" line off every
       team page (2026-10-17). */
    return wrap;
  }

  /* One listener on the panel: the headings are redrawn on every sort. The
     column already sorted turns round, and a third click puts the standings
     back in their own order. */
  document.getElementById('teamStandingsBody').addEventListener('click', function (event) {
    var button = event.target.closest('.ege-sort');
    if (!button || !standDrawn) { return; }
    var key = button.dataset.sortKey;
    if (standSort.key !== key) {
      standSort = { key: key, dir: DOWN };
    } else if (standSort.dir === DOWN) {
      standSort = { key: key, dir: UP };
    } else {
      standSort = { key: null, dir: DOWN };
    }
    renderTeamStandings(standDrawn.entry, standDrawn.season);
  });

  /* --- the teams: position rooms ------------------------------------------

     A team page's roster: a room for each skill position, best overall
     first, the six put in wherever their overall puts them. */

  var ROOMS = [
    { key: 'QB', title: 'Quarterbacks' },
    { key: 'RB', title: 'Running Backs' },
    { key: 'WR', title: 'Receivers' },
    { key: 'TE', title: 'Tight Ends' }
  ];

  /* How many of a room show before the rest fold away behind "more". */
  var ROOM_SHOWN = 4;

  /* A face for a roster card: the six's own headshots, ESPN's for everybody
     it has one for (asked for from ESPN's image server, like the opponents'
     logos), and initials for anybody else -- or anybody whose picture does
     not load. */
  function rosterFace(row) {
    var face = el('span', 'ege-teamchip__photo');
    var initials = row.name.split(' ').filter(function (part) {
      return /^[A-Z]/.test(part) && !/^(Jr|Sr|II|III|IV)\.?$/.test(part);
    }).map(function (part) { return part.charAt(0); }).slice(0, 2).join('');
    var src = row.player ? row.player.headshot : EGE.rosterPhoto(row);
    if (!src) {
      face.textContent = initials;
      return face;
    }
    var img = el('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', function () {
      img.remove();
      face.textContent = initials;
    });
    face.appendChild(img);
    return face;
  }

  /* An NFL player's seasons in the league, the way an NFL roster lists
     them: R for a rookie, then the season he is in. */
  function nflClass(year) {
    if (!year) { return null; }
    return year === 1 ? { short: 'R', name: 'Rookie' }
      : { short: String(year), name: EGE.ordinal(year).toLowerCase() + ' season in the NFL' };
  }

  /* One player in a room, as a card: his picture, his name, his number,
     class, height and weight, and his overall in the same box the six's is
     drawn in. One of the six is a way through to his page and is picked out
     in orange; everybody else is the same
     card with nowhere to go. No season numbers -- the overall says it. An
     NFL player's card is the sim's (nflLine). */
  function rosterLine(row) {
    if (row.sim) { return nflLine(row); }
    var item = el('li', 'ege-room__player');
    var card = el(row.player ? 'a' : 'div', 'ege-teamchip' + (row.player ? ' is-six' : ''));
    if (row.player) { card.href = '#' + row.player.slug; }
    card.appendChild(rosterFace(row));

    var text = el('span', 'ege-teamchip__text');
    text.appendChild(el('span', 'ege-teamchip__name', row.name));

    var meta = el('span', 'ege-teamchip__meta');
    if (typeof row.jersey === 'number') {
      var number = el('span', null, '#' + row.jersey);
      if (row.realJersey) { number.title = 'Wears #' + row.realJersey + ' in real life'; }
      meta.appendChild(number);
    }
    var klass = row.nfl ? nflClass(row.year)
      : row.redshirting ? { short: 'RS', name: 'Redshirt' } : EGE.CLASSES[row.year];
    if (klass) {
      var chip = el('abbr', 'ege-room__class', klass.short);
      chip.title = klass.name;
      meta.appendChild(chip);
    }
    text.appendChild(meta);

    var size = [EGE.heightText(row), row.weight ? row.weight + ' lbs' : null]
      .filter(Boolean).join(' \u00b7 ');
    if (size) { text.appendChild(el('span', 'ege-teamchip__meta', size)); }
    card.appendChild(text);

    var box = overallBox(row.overall, 'ege-ovrbox--chip');
    if (box) { card.appendChild(box); }
    item.appendChild(card);
    return item;
  }

  function roomEl(room, rows) {
    var box = el('div', 'ege-room');
    box.appendChild(el('h4', 'ege-room__title', room.title));
    if (!rows.length) {
      box.appendChild(el('p', 'ege-room__empty', 'Nobody listed.'));
      return box;
    }
    /* Best first, and never folding one of the six away: a room shows down
       to whichever of them is lowest, however far down that is. */
    var shown = ROOM_SHOWN;
    rows.forEach(function (row, i) { if (row.player) { shown = Math.max(shown, i + 1); } });

    var list = el('ol', 'ege-room__list');
    rows.slice(0, shown).forEach(function (row) { list.appendChild(rosterLine(row)); });
    box.appendChild(list);

    if (rows.length > shown) {
      var more = el('details', 'ege-room__more');
      more.appendChild(el('summary', null, (rows.length - shown) + ' more'));
      var rest = el('ol', 'ege-room__list');
      rest.start = shown + 1;
      rows.slice(shown).forEach(function (row) {
        rest.appendChild(rosterLine(row));
      });
      more.appendChild(rest);
      box.appendChild(more);
    }
    return box;
  }

  /* --- the NFL's rosters, from the sim ----------------------------------

     An NFL team's page is the NFL sim's roster (js/nfl-rosters.js), not
     data/rosters.js: every player on the team with his overall, his years
     in the league, his size and his archetype, on two sides of the ball
     picked with the switch in the panel's head. A fullback is in with the
     backs, and the edge rushers and the tackles are one line. */
  var NFL_ROOMS = {
    offense: [
      { key: 'QB', title: 'Quarterbacks', pos: ['QB'] },
      { key: 'RB', title: 'Running Backs', pos: ['RB', 'FB'] },
      { key: 'WR', title: 'Receivers', pos: ['WR'] },
      { key: 'TE', title: 'Tight Ends', pos: ['TE'] }
    ],
    defense: [
      { key: 'DL', title: 'Defensive Line', pos: ['EDGE', 'DI'] },
      { key: 'LB', title: 'Linebackers', pos: ['LB'] },
      { key: 'CB', title: 'Cornerbacks', pos: ['CB'] },
      { key: 'S', title: 'Safeties', pos: ['S'] }
    ]
  };
  var rosterSide = 'offense';

  /* Which roster is on screen, so one that arrives late lands only if
     nobody has moved on. */
  var nflShown = null;

  /* A sim row as a room's row. One of the six is his own: the overall,
     headshot and size his page has. Everybody else is the sim's, with
     ESPN's headshot. */
  function nflRow(sim, season, key) {
    var player = sim.ege ? EGE.playerBySlug(sim.ege) : null;
    return {
      name: player ? player.name : sim.name,
      overall: player ? EGE.overallFor(player) : sim.ovr,
      height: player && player.height ? player.height : sim.height,
      weight: player && player.weight ? player.weight : sim.weight,
      archetype: sim.archetype,
      year: (player && EGE.nflYearFor(player, season)) || sim.years,
      nfl: true,
      photo: Boolean(sim.espn),
      espn: sim.espn,
      player: player,
      sim: sim,
      team: key,
      season: season
    };
  }

  /* An NFL player's card: his picture, then his name, his archetype with
     his seasons in the league beside it, and his height and weight -- no
     number (Sam, 2026-10-19) -- and his overall. Every card opens the
     player's pop-up; one of the six is still picked out in orange, and his
     pop-up is the way to his page. */
  function nflLine(row) {
    var item = el('li', 'ege-room__player');
    var card = el('div', 'ege-teamchip ege-teamchip--nfl' + (row.player ? ' is-six' : ''));
    EGE.cardsView.pressable(card, row.name, function () { openNflPlayer(row); });
    card.appendChild(rosterFace(row));

    var text = el('span', 'ege-teamchip__text');
    text.appendChild(el('span', 'ege-teamchip__name', row.name));
    var meta = el('span', 'ege-teamchip__meta');
    if (row.archetype) { meta.appendChild(el('span', 'ege-teamchip__arch', row.archetype)); }
    var klass = nflClass(row.year);
    if (klass) {
      var chip = el('abbr', 'ege-room__class', klass.short);
      chip.title = klass.name;
      meta.appendChild(chip);
    }
    text.appendChild(meta);
    var size = [EGE.heightText(row), EGE.weightText(row)].filter(Boolean).join(' · ');
    if (size) { text.appendChild(el('span', 'ege-teamchip__meta', size)); }
    card.appendChild(text);

    var box = overallBox(row.overall, 'ege-ovrbox--chip');
    if (box) { card.appendChild(box); }
    item.appendChild(card);
    return item;
  }

  /* `key` is the sim's (DET). Drawn as soon as the season's rosters are
     in; until then the panel says it is getting them. */
  function renderNflRoster(key, season) {
    var body = document.getElementById('teamRosterBody');
    document.getElementById('rosterSwitch').hidden = false;
    nflShown = key + ':' + season;
    body.innerHTML = '';
    renderUnitOveralls(key, season);

    var all = EGE.nflRosters.get(season);
    if (all === undefined) {
      body.appendChild(el('p', 'ege-room__empty', 'Getting the roster…'));
      EGE.nflRosters.load(season).then(function () {
        if (nflShown === key + ':' + season) { renderNflRoster(key, season); }
      });
      return;
    }
    var rows = all && all.teams ? all.teams[key] : null;
    if (!rows || !rows.length) {
      body.appendChild(el('p', 'ege-room__empty', 'No roster yet for ' + season + '.'));
      return;
    }
    var grid = el('div', 'ege-rooms');
    NFL_ROOMS[rosterSide].forEach(function (room) {
      var inRoom = rows.filter(function (sim) { return room.pos.indexOf(sim.pos) !== -1; })
        .map(function (sim) { return nflRow(sim, season, key); })
        .sort(function (a, b) {
          return ((b.overall || 0) - (a.overall || 0)) || (b.player ? 1 : 0) - (a.player ? 1 : 0);
        });
      grid.appendChild(roomEl(room, inRoom));
    });
    body.appendChild(grid);
  }

  /* Beside the Offense and Defense switch, for an admin and nobody else
     (Sam, 2026-10-20): the team's offense and defense as two overalls, from
     its players' ratings. Hidden in client viewer mode, and for a team the
     rosters do not have yet. */
  function renderUnitOveralls(key, season) {
    var holder = document.getElementById('rosterRatings');
    holder.innerHTML = '';
    var units = key && EGE.wallet.admin() ? EGE.nflRosters.unitOveralls(season, key, function (sim) {
      var player = sim.ege ? EGE.playerBySlug(sim.ege) : null;
      return player ? EGE.overallFor(player) : sim.ovr;
    }) : null;
    holder.hidden = !units;
    if (!units) { return; }
    [['offense', 'OFF', 'Offense'], ['defense', 'DEF', 'Defense']].forEach(function (side) {
      var box = overallBox(units[side[0]], 'ege-ovrbox--unit');
      if (!box) { return; }
      box.querySelector('.ege-ovrbox__label').textContent = side[1];
      box.title = side[2] + ' overall ' + units[side[0]] + ', from its starters\u2019 ratings. Only admins see this.';
      holder.appendChild(box);
    });
  }

  document.addEventListener('change', function (event) {
    var input = event.target.closest ? event.target.closest('.ege-switch__option input') : null;
    if (!input || input.name !== 'rosterSide') { return; }
    rosterSide = input.value;
    var slug = currentTeamSlug();
    if (slug) { renderTeam(slug); }
  });

  /* --- an NFL player up close ---------------------------------------------

     The card overlay, as a card or a trophy opens in: across the top a band
     in his team's colour with his headshot, his name and the team's mark;
     under it where he came from (college, draft, age, height, weight), then
     his overall, archetype and skills, then his contract. A click anywhere
     off it puts it away. */
  var POSITION_NAMES = {
    QB: 'Quarterback', RB: 'Running Back', FB: 'Fullback', WR: 'Wide Receiver', TE: 'Tight End',
    EDGE: 'Edge Rusher', DI: 'Defensive Tackle', LB: 'Linebacker', CB: 'Cornerback', S: 'Safety'
  };
  var SKILL_NAMES = {
    accuracy: 'Accuracy', deep: 'Deep', arm: 'Arm', poise: 'Poise', mobility: 'Mobility',
    power: 'Power', elusive: 'Elusiveness', speed: 'Speed', vision: 'Vision', hands: 'Hands',
    block: 'Blocking', route: 'Route Running', yac: 'After the Catch', size: 'Size',
    rush: 'Pass Rush', run: 'Run Defense', cover: 'Coverage', blitz: 'Blitzing',
    man: 'Man Coverage', zone: 'Zone Coverage', ball: 'Ball Skills', tackle: 'Tackling',
    range: 'Range', box: 'In the Box'
  };

  function skillName(skill, pos) {
    if (skill === 'deep') { return pos === 'QB' ? 'Deep Ball' : 'Deep Routes'; }
    return SKILL_NAMES[skill] || skill;
  }

  function moneyText(millions) {
    return millions >= 1 ? '$' + (Math.round(millions * 10) / 10) + 'M'
      : '$' + Math.round(millions * 1000) + 'K';
  }

  function nflPhoto(row, wide) {
    if (row.player) { return row.player.headshot; }
    if (!row.espn) { return null; }
    return 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/' + row.espn +
      '.png&w=' + (wide ? 350 : 96) + '&h=' + (wide ? 254 : 70);
  }

  /* The pop-up's name at the size site.css gives it, or smaller when a
     long name would otherwise run wider than its column (VanValkenburg) or
     past two lines. A name is never broken inside a word. */
  function fitName(node) {
    node.style.fontSize = '';
    var size = parseFloat(window.getComputedStyle(node).fontSize);
    while (size > 10 && (node.scrollWidth > node.clientWidth + 1 ||
        node.offsetHeight > size * 1.1 * 2 + 2)) {
      size -= 1;
      node.style.fontSize = size + 'px';
    }
  }

  function openNflPlayer(row) {
    var sim = row.sim;
    var team = EGE.nfl.teams[row.team] || {};
    var stage = EGE.cardsView.openOverlay(POSITION_NAMES[sim.pos] || sim.pos, 'ege-rip__stage--person');
    var box = el('div', 'ege-person');

    /* Line one: the band. */
    var band = el('div', 'ege-person__band');
    band.style.background = team.color || '';
    var face = el('span', 'ege-person__face');
    var src = nflPhoto(row, true);
    if (src) {
      var img = el('img');
      img.src = src;
      img.alt = '';
      img.addEventListener('error', function () { img.remove(); });
      face.appendChild(img);
    }
    band.appendChild(face);
    var name = el('h3', 'ege-person__name', row.name);
    band.appendChild(name);
    var mark = el('span', 'ege-person__mark');
    var logoSrc = EGE.nfl.logo(row.team);
    if (logoSrc) {
      var logo = el('img');
      logo.src = logoSrc;
      logo.alt = team.name || '';
      logo.title = team.name || '';
      logo.addEventListener('error', function () { logo.remove(); });
      mark.appendChild(logo);
    }
    band.appendChild(mark);
    box.appendChild(band);

    var panel = el('div', 'ege-person__body');

    /* Line two: where he came from and his size. */
    var facts = el('dl', 'ege-person__facts');
    function fact(label, value, title) {
      var cell = el('div', 'ege-person__fact');
      cell.appendChild(el('dt', null, label));
      var dd = el('dd', null, value);
      if (title) { dd.title = title; }
      cell.appendChild(dd);
      facts.appendChild(cell);
    }
    fact('College', sim.college || '–');
    var d = sim.draft;
    var by = d && d.team && EGE.nfl.teams[d.team] ? EGE.nfl.teams[d.team].name : null;
    fact('Draft', d ? d.year + ' · R' + d.round + ' #' + d.pick : 'Undrafted',
      d ? 'Round ' + d.round + ', pick ' + d.pick + ' of the ' + d.year + ' draft' + (by ? ', by the ' + by : '') : null);
    fact('Age', typeof sim.age === 'number' ? String(sim.age) : '–');
    fact('Height', EGE.heightText(row) || '–');
    fact('Weight', EGE.weightText(row) || '–');
    panel.appendChild(facts);

    /* Line three: how good, what kind, and the skills it comes from, best
       first. */
    var rating = el('div', 'ege-person__rating');
    var ovr = overallBox(row.overall, 'ege-ovrbox--chip');
    if (ovr) { rating.appendChild(ovr); }
    var kind = el('div', 'ege-person__kind');
    kind.appendChild(el('span', 'ege-person__arch', sim.archetype || POSITION_NAMES[sim.pos] || sim.pos));
    var skills = el('ul', 'ege-person__skills');
    Object.keys(sim.skills || {}).sort(function (a, b) { return sim.skills[b] - sim.skills[a]; })
      .forEach(function (skill) {
        var chip = el('li', 'ege-person__skill');
        chip.appendChild(el('span', null, skillName(skill, sim.pos)));
        chip.appendChild(el('b', null, String(sim.skills[skill])));
        skills.appendChild(chip);
      });
    kind.appendChild(skills);
    rating.appendChild(kind);
    panel.appendChild(rating);

    /* Line four: the contract, and anything keeping him off the field. */
    var foot = el('dl', 'ege-person__deal');
    function line(label, value) {
      foot.appendChild(el('dt', null, label));
      foot.appendChild(el('dd', null, value));
    }
    line('Contract', sim.contract
      ? moneyText(sim.contract.apy) + ' a year through ' + sim.contract.through
      : 'None');
    if (sim.out) {
      var what = String(sim.out.what || 'injured').replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
      line('Injury', what + (sim.out.games ? ' · out ' + sim.out.games + ' more ' +
        (sim.out.games === 1 ? 'game' : 'games') : ' · out for the season'));
    }
    panel.appendChild(foot);

    if (row.player) {
      var go = el('a', 'fb-btn fb-btn--primary ege-person__go', row.player.first + '’s page →');
      go.href = '#' + row.player.slug;
      go.addEventListener('click', function () { EGE.cardsView.closeOverlay(); });
      panel.appendChild(go);
    }
    box.appendChild(panel);
    stage.appendChild(box);
    fitName(name);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { fitName(name); }); }

    var close = stage.querySelector('.ege-rip__close');
    if (close) { close.focus({ preventScroll: true }); }
  }

  /* Off the box closes it, as off a trophy does. */
  document.getElementById('cardRip').addEventListener('click', function (e) {
    if (!this.querySelector('.ege-rip__stage--person')) { return; }
    if (e.target.closest('.ege-person')) { return; }
    EGE.cardsView.closeOverlay();
  });

  /* --- the teams ----------------------------------------------------------

     Laid out like the players: #teams is a card for every school one of the
     six plays for, and a card opens that school's own page at
     #teams/{school}, with the way back and a season switcher above it. College
     and NFL seasons only -- the high schools are the player pages' business.
     A season with both has the NFL's teams first and a dotted line before
     the colleges'. */

  /* Every season past high school there is something to show for: logged,
     and for an admin any season whose file is in ahead of time. 2023, half
     NFL and half college, is one of these. */
  function collegeSeasons() {
    return loggedSeasons().filter(function (year) { return EGE.tierFor(year) !== 'highSchool'; });
  }

  /* The season the Teams pages are on. One pick for the index and every
     team's page alike, so a season chosen on either carries over to the
     other -- open a team from 2021's cards and it is 2021's team. Null for
     the live season (or the latest college season before it). */
  var teamsPicked = null;

  function teamsIndexSeason() {
    var years = collegeSeasons();
    if (teamsPicked && years.indexOf(teamsPicked) !== -1) { return teamsPicked; }
    var live = years.filter(function (year) { return year <= EGE.currentSeason; });
    return live.length ? live[live.length - 1] : null;
  }

  /* A season switcher: every season in `years`, newest first, with a step
     either way -- the player page's, for the index and a team's page. */
  function fillTeamsBar(ids, years, season) {
    var bar = document.getElementById(ids.bar);
    bar.hidden = years.length < 2;
    if (bar.hidden) { return; }

    var pick = document.getElementById(ids.pick);
    pick.innerHTML = '';
    years.slice().reverse().forEach(function (year) {
      var option = el('option', null, String(year) + (isPreview(year) ? ' \u00b7 Preview' : ''));
      option.value = year;
      pick.appendChild(option);
    });
    pick.value = String(season);

    var at = years.indexOf(season);
    document.getElementById(ids.prev).disabled = at <= 0;
    document.getElementById(ids.next).disabled = at === -1 || at >= years.length - 1;
  }

  function pickTeamsSeason(year) {
    teamsPicked = year;
    var slug = currentTeamSlug();
    if (slug) { renderTeam(slug); } else { renderTeams(); }
  }

  function wireTeamsBar(ids, yearsFor) {
    document.getElementById(ids.pick).addEventListener('change', function (e) {
      pickTeamsSeason(Number(e.target.value));
    });
    [[ids.prev, -1], [ids.next, 1]].forEach(function (pair) {
      document.getElementById(pair[0]).addEventListener('click', function () {
        var years = yearsFor();
        var page = teamPage(currentTeamSlug());
        var at = years.indexOf(page ? page.season : teamsIndexSeason());
        var next = years[at + pair[1]];
        if (next) { pickTeamsSeason(next); }
      });
    });
  }

  var INDEX_BAR = { bar: 'teamsSeasonBar', pick: 'teamsSeasonPick', prev: 'teamsSeasonPrev', next: 'teamsSeasonNext' };
  var TEAM_BAR = { bar: 'teamSeasonBar', pick: 'teamSeasonPick', prev: 'teamSeasonPrev', next: 'teamSeasonNext' };

  /* The seasons a school has a page for: the college seasons one of the six
     was there. */
  function teamSeasons(key) {
    return collegeSeasons().filter(function (year) {
      return EGE.teamsIn(year).some(function (entry) { return entry.key === key; });
    });
  }

  function teamEntry(key, season) {
    return EGE.teamsIn(season).filter(function (entry) { return entry.key === key; })[0] || null;
  }

  /* What a season is called away from a player page: the year and the
     level. A class would be wrong for somebody -- Isaac redshirts 2021. On
     a team's own page the level is the team's: an NFL team's 2023 is the
     NFL's, not the season's NFL & College Football. */
  function teamSeasonText(year, team) {
    var level = team ? (team.tier === 'nfl' ? EGE.TIER_LEVELS.nfl : EGE.TIER_LEVELS.college) : null;
    return (level ? year + ' · ' + level : seasonLabel(year)) + (isPreview(year) ? ' · Preview' : '');
  }

  /* --- the index --------------------------------------------------------- */

  /* A school's mark on its own colour, for a team card or a team page: the
     ground from EGE.teams behind it, and the mark in white where the school
     asks for it. A school with no colour keeps the cream. */
  function paintMark(box, team, img) {
    box.style.background = team.ground || '';
    box.classList.toggle('is-painted', Boolean(team.ground));
    if (img) { img.classList.toggle('is-white', Boolean(team.whiteMark)); }
  }

  function teamCard(entry, season) {
    var card = el('a', 'ege-card ege-teamcard');
    card.href = '#teams/' + EGE.teamSlug(entry.key);

    var mark = el('div', 'ege-card__photo ege-teamcard__mark');
    var logo = null;
    if (entry.team.logo) {
      logo = el('img');
      logo.src = entry.team.logo;
      logo.alt = '';
      logo.loading = 'lazy';
      mark.appendChild(logo);
    }
    paintMark(mark, entry.team, logo);
    card.appendChild(mark);

    var body = el('div', 'ege-card__body');
    var text = el('div', 'ege-card__text');
    text.appendChild(el('h3', 'ege-card__name', entry.team.school));

    var lead = entry.players[0];
    var standing = EGE.standingFor(lead, season);
    text.appendChild(el('span', 'ege-card__school',
      EGE.recordFor(lead, season).text + ' · ' + (standing
        ? (standing.place ? EGE.ordinal(standing.place) + ' in ' : '') + standing.league
        : (entry.team.league || ''))));

    /* The six who play there: a face each, with the name beside it where
       there is room for one. */
    var faces = el('span', 'ege-teamcard__ours');
    entry.players.forEach(function (player) {
      var who = el('span', 'ege-teamcard__player');
      who.title = player.name;
      var face = el('img', 'ege-teamcard__face');
      face.src = player.headshot;
      face.alt = '';
      face.loading = 'lazy';
      who.appendChild(face);
      who.appendChild(el('span', 'ege-teamcard__who', player.name));
      faces.appendChild(who);
    });
    text.appendChild(faces);
    text.appendChild(el('span', 'ege-card__go', 'View team →'));
    body.appendChild(text);
    card.appendChild(body);
    return card;
  }

  function renderTeams() {
    var season = teamsIndexSeason();
    var grid = document.getElementById('teamsGrid');
    grid.innerHTML = '';
    fillTeamsBar(INDEX_BAR, collegeSeasons(), season);
    document.getElementById('teamsSeasonLabel').textContent = season ? teamSeasonText(season) : '';
    if (!season) {
      grid.appendChild(el('p', 'ege-note', 'No college season yet.'));
      return;
    }
    /* The NFL above the NCAA, with a dotted line between the two, in a
       season that has both. No label on either: the line is enough (Sam,
       2026-10-17). */
    var entries = EGE.teamsIn(season);
    var nfl = entries.filter(function (entry) { return entry.team.tier === 'nfl'; });
    var college = entries.filter(function (entry) { return entry.team.tier !== 'nfl'; });
    [nfl, college].forEach(function (group, at) {
      if (!group.length) { return; }
      if (at && nfl.length) { grid.appendChild(el('hr', 'ege-teamgrid__divider')); }
      group.forEach(function (entry) { grid.appendChild(teamCard(entry, season)); });
    });
    /* Under the six's teams, every NFL team in its division, each one the
       way to its page. */
    if (nfl.length) { grid.appendChild(nflStandingsBox(season)); }
  }

  /* --- every NFL team ------------------------------------------------------ */

  var NFL_DIVISIONS = ['East', 'North', 'South', 'West'];

  /* A division as it stands: { key, name, wins, losses, streak } top to
     bottom. The site's own table where the season has one
     (EGE.divisionTable, with the league's tie-breaks); otherwise counted
     from every NFL result there is, best record first. */
  function nflDivisionRows(conf, div, season) {
    var keys = Object.keys(EGE.nfl.teams).filter(function (key) {
      return EGE.nfl.teams[key].conf === conf && EGE.nfl.teams[key].div === div;
    });
    var table = EGE.divisionTable(EGE.nfl.teams[keys[0]].name, season);
    if (table && table.nfl) {
      return table.rows.map(function (row) {
        return { key: EGE.nfl.keyByName(row.school), name: row.school, wins: row.wins,
                 losses: row.losses, streak: row.streak };
      });
    }
    var rows = keys.map(function (key) {
      return { key: key, name: EGE.nfl.teams[key].name, wins: 0, losses: 0, streak: null };
    });
    EGE.nflResults(season).forEach(function (game) {
      rows.forEach(function (row) {
        var ours = game.home === row.name ? game.score[0] : game.away === row.name ? game.score[1] : null;
        if (ours === null) { return; }
        var theirs = game.home === row.name ? game.score[1] : game.score[0];
        if (ours > theirs) { row.wins += 1; } else { row.losses += 1; }
      });
    });
    function pct(row) { return row.wins + row.losses ? row.wins / (row.wins + row.losses) : 0.5; }
    return rows.sort(function (a, b) { return (pct(b) - pct(a)) || (b.wins - a.wins) || a.name.localeCompare(b.name); });
  }

  /* Where an NFL team stands: its row and its place in the division. */
  function nflStanding(key, season) {
    var team = EGE.nfl.teams[key];
    var rows = nflDivisionRows(team.conf, team.div, season);
    var at = 0;
    rows.forEach(function (row, i) { if (row.key === key) { at = i; } });
    return { row: rows[at], place: rows[at].wins + rows[at].losses ? at + 1 : null,
             league: team.conf + ' ' + team.div };
  }

  /* The sim's keys of the teams the six are on that season. */
  function nflOurs(season) {
    var ours = {};
    EGE.teamsIn(season).forEach(function (entry) {
      var key = entry.team.tier === 'nfl' ? EGE.nfl.keyForSite(entry.key) : null;
      if (key) { ours[key] = true; }
    });
    return ours;
  }

  /* The whole league, a box for each division, every team a link to its
     page and the six's teams picked out in orange. */
  function nflStandingsBox(season) {
    var ours = nflOurs(season);
    var panel = el('section', 'fb-panel ege-nflstand');
    var head = el('div', 'fb-panel__head');
    head.appendChild(el('h3', null, 'NFL Standings'));
    panel.appendChild(head);
    var body = el('div', 'fb-panel__body ege-nflstand__grid');
    ['AFC', 'NFC'].forEach(function (conf) {
      NFL_DIVISIONS.forEach(function (div) {
        var box = el('div', 'ege-nflstand__div');
        box.appendChild(el('h4', 'ege-nflstand__title', conf + ' ' + div));
        var list = el('ol', 'ege-nflstand__list');
        nflDivisionRows(conf, div, season).forEach(function (row) {
          var item = el('li');
          var link = el('a', 'ege-nflstand__team' + (ours[row.key] ? ' is-ours' : ''));
          link.href = '#teams/' + EGE.nfl.slug(row.key);
          var mark = schoolMark(row.name);
          if (mark) { link.appendChild(mark); }
          link.appendChild(el('span', 'ege-nflstand__name', row.name));
          link.appendChild(el('span', 'ege-nflstand__record', row.wins + '-' + row.losses));
          item.appendChild(link);
          list.appendChild(item);
        });
        box.appendChild(list);
        body.appendChild(box);
      });
    });
    panel.appendChild(body);
    return panel;
  }

  /* --- a team's page ------------------------------------------------------ */

  /* The season a team's page is on: the one picked on the index or on a
     team's switcher, if the school had one of the six that season;
     otherwise the latest season it did. */
  function shownTeamSeason(key) {
    var years = teamSeasons(key);
    var picked = teamsIndexSeason();
    if (years.indexOf(picked) !== -1) { return picked; }
    return years.length ? years[years.length - 1] : null;
  }

  function currentTeamSlug() {
    var hash = window.location.hash.replace(/^#/, '');
    return hash.indexOf('teams/') === 0 ? hash.slice(6) : null;
  }

  /* The seasons the NFL is on the site: the ones any of the six played in
     it. */
  function nflSeasons() {
    return collegeSeasons().filter(function (year) {
      return EGE.teamsIn(year).some(function (entry) { return entry.team.tier === 'nfl'; });
    });
  }

  /* What #teams/{slug} opens: { key, nfl, years, season, entry }. A school
     one of the six played for (`key`, its key in EGE.teams) has its whole
     page in the seasons one of them was there. Every NFL team (`nfl`, the
     sim's key) has a page every NFL season; with none of the six on it that
     season, `entry` is null and the page is the team's roster and nothing
     else -- no schedule, no standings (Sam, 2026-10-19). */
  function teamPage(slug) {
    var key = slug ? EGE.teamKeyBySlug(slug) : null;
    var nfl = slug ? EGE.nfl.keyBySlug(slug) : null;
    var season;
    if (!nfl) {
      if (!key) { return null; }
      season = shownTeamSeason(key);
      return { key: key, nfl: null, years: teamSeasons(key), season: season,
               entry: season ? teamEntry(key, season) : null };
    }
    var years = nflSeasons();
    var picked = teamsIndexSeason();
    season = years.indexOf(picked) !== -1 ? picked : years[years.length - 1] || null;
    return { key: key, nfl: nfl, years: years, season: season,
             entry: key && season ? teamEntry(key, season) : null };
  }

  wireTeamsBar(INDEX_BAR, function () { return collegeSeasons(); });
  wireTeamsBar(TEAM_BAR, function () {
    var page = teamPage(currentTeamSlug());
    return page ? page.years : [];
  });

  /* The header: the mark, the name, and what the season has come to. */
  function renderTeamHead(entry, season) {
    document.getElementById('teamStripLabel').textContent = teamSeasonText(season, entry.team);

    var mark = document.getElementById('teamLogo');
    mark.innerHTML = '';
    var logo = null;
    if (entry.team.logo) {
      logo = el('img');
      logo.src = entry.team.logo;
      logo.alt = entry.team.school;
      mark.appendChild(logo);
    }
    paintMark(mark, entry.team, logo);
    document.getElementById('teamName').textContent = entry.team.school;

    /* Everybody from the six on a team plays its games, so the first of them
       speaks for its record. */
    var lead = entry.players[0];
    var facts = document.getElementById('teamFacts');
    facts.innerHTML = '';
    function fact(label, value) {
      facts.appendChild(el('dt', null, label));
      var dd = el('dd');
      if (typeof value === 'string') { dd.textContent = value; } else { dd.appendChild(value); }
      facts.appendChild(dd);
    }

    var record = el('span', 'ege-record', EGE.recordFor(lead, season).text);
    var streak = EGE.streakFor(lead, season);
    if (streak && !EGE.seasonOverFor(lead, season)) {
      record.appendChild(el('span', 'ege-record__dot', ' · '));
      record.appendChild(el('span', 'ege-streak ege-streak--' + (streak.won ? 'win' : 'loss'),
        streak.text + ' Streak'));
    }
    fact('Record', record);

    var standing = EGE.standingFor(lead, season);
    fact(entry.team.tier === 'nfl' ? 'Division' : 'Conference', standing
      ? (standing.place ? EGE.ordinal(standing.place) + ' in ' : 'TBD in ') + standing.league
      : (entry.team.league || 'TBD'));

    var ours = el('span', 'ege-teamhead__ours');
    entry.players.forEach(function (player, i) {
      if (i) { ours.appendChild(document.createTextNode(' · ')); }
      var link = el('a', null, player.name);
      link.href = '#' + player.slug;
      ours.appendChild(link);
    });
    fact(entry.players.length > 1 ? 'EGE Players' : 'EGE Player', ours);
  }

  /* The header of an NFL team none of the six are on: its mark, its name,
     its record and where it stands in its division. */
  function renderNflHead(key, season) {
    var team = EGE.nfl.teams[key];
    document.getElementById('teamStripLabel').textContent = teamSeasonText(season, { tier: 'nfl' });

    var mark = document.getElementById('teamLogo');
    mark.innerHTML = '';
    var logo = null;
    var src = EGE.nfl.logo(key);
    if (src) {
      logo = el('img');
      logo.src = src;
      logo.alt = team.name;
      logo.addEventListener('error', function () { logo.remove(); });
      mark.appendChild(logo);
    }
    /* On the team's colour, as the six's teams are. */
    paintMark(mark, { ground: team.color }, logo);
    document.getElementById('teamName').textContent = team.name;

    var facts = document.getElementById('teamFacts');
    facts.innerHTML = '';
    var standing = nflStanding(key, season);
    var record = el('span', 'ege-record', standing.row.wins + '-' + standing.row.losses);
    if (standing.row.streak) {
      record.appendChild(el('span', 'ege-record__dot', ' · '));
      record.appendChild(el('span', 'ege-streak ege-streak--' + (standing.row.streak.won ? 'win' : 'loss'),
        standing.row.streak.text + ' Streak'));
    }
    facts.appendChild(el('dt', null, 'Record'));
    facts.appendChild(el('dd')).appendChild(record);
    facts.appendChild(el('dt', null, 'Division'));
    facts.appendChild(el('dd', null, (standing.place ? EGE.ordinal(standing.place) : 'TBD') + ' in ' + standing.league));
  }

  function renderTeamRoster(entry, season, nflKey) {
    if (nflKey) { renderNflRoster(nflKey, season); return; }
    nflShown = null;
    document.getElementById('rosterSwitch').hidden = true;
    renderUnitOveralls(null, season);
    var body = document.getElementById('teamRosterBody');
    body.innerHTML = '';
    var rooms = EGE.rosterFor(entry.key, season);
    if (!rooms) { return; }
    var grid = el('div', 'ege-rooms');
    ROOMS.forEach(function (room) { grid.appendChild(roomEl(room, rooms[room.key] || [])); });
    body.appendChild(grid);
    if (rooms.season !== season) {
      body.appendChild(el('p', 'fb-meta', 'Roster as of ' + rooms.season + '.'));
    }
  }

  function renderTeamStandings(entry, season) {
    var panel = document.getElementById('teamStandingsPanel');
    var body = document.getElementById('teamStandingsBody');
    var conference = EGE.conferenceTables(entry.team.school, season);
    body.innerHTML = '';
    panel.hidden = !conference;
    if (!conference) { return; }
    /* The NFC's, say, for an NFL team: the conference is the whole table. */
    document.getElementById('teamStandingsTitle').textContent =
      conference.nfl ? conference.conference + ' Standings' : 'Conference Standings';
    standDrawn = { entry: entry, season: season };
    body.appendChild(standingsTable(conference, entry.team.school));
  }

  /* The team's games as everybody can see them: the same fixtures, the same
     rule about how far into the postseason anybody can see, and no credits,
     boosters or grades -- those belong to a player. */
  function renderTeamSchedule(entry, season) {
    var body = document.getElementById('teamScheduleBody');
    body.innerHTML = '';
    var games = EGE.scheduleFor(entry.players[0], season);
    var firstPlayoff = games.filter(function (game) { return game.playoff; })[0];
    games.forEach(function (game) {
      var row = el('tr');
      if (game === firstPlayoff) { row.classList.add('ege-schedule__break'); }
      row.appendChild(el('td', 'ege-schedule__week', game.week));
      row.appendChild(el('td', null, gameDate(game)));

      var opponent = el('td', 'ege-schedule__opponent');
      if (game.bye) {
        opponent.appendChild(el('span', 'ege-schedule__bye', 'Bye'));
      } else {
        opponent.appendChild(el('span', 'ege-schedule__side', game.home || game.neutral ? 'vs' : 'at'));
        opponentName(opponent, game);
      }
      if (marksGame(game)) {
        var conf = el('abbr', 'ege-schedule__conf', '*');
        conf.title = markWord(game) + ' game';
        opponent.appendChild(conf);
      }
      if (game.playoff) {
        var post = el('abbr', 'ege-schedule__conf', '**');
        post.title = postseasonWord(game) + ' game';
        opponent.appendChild(post);
      }
      row.appendChild(opponent);

      var result = el('td', 'num ege-schedule__result');
      result.appendChild(resultTag(game));
      row.appendChild(result);
      body.appendChild(row);
    });
  }

  /* `slug` is the address after #teams/. */
  function renderTeam(slug) {
    var page = teamPage(slug);
    var entry = page ? page.entry : null;
    var found = Boolean(entry || (page && page.nfl && page.season));
    document.getElementById('teamMissing').hidden = found;
    document.getElementById('teamContent').hidden = !found;
    if (!found) { return; }

    fillTeamsBar(TEAM_BAR, page.years, page.season);
    document.getElementById('teamSchedulePanel').hidden = !entry;
    if (!entry) {
      renderNflHead(page.nfl, page.season);
      renderNflRoster(page.nfl, page.season);
      document.getElementById('teamStandingsPanel').hidden = true;
      document.title = EGE.nfl.teams[page.nfl].name + ' — EGE Football';
      return;
    }
    renderTeamHead(entry, page.season);
    renderTeamRoster(entry, page.season, page.nfl);
    renderTeamStandings(entry, page.season);
    renderTeamSchedule(entry, page.season);
    document.title = entry.team.school + ' — EGE Football';
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

  /* How tall a draw has to be for the champion line to fit above its final.
     Thirty-two teams are sixteen rows a half and never come near it. San
     Diego's four are two rows a half, and get empty rows above and below
     until they reach it -- the same number both ways, so the final still
     sits level with the semifinals either side of it. */
  var BRACKET_MIN_ROWS = 8;

  /* Where every box in the draw goes: the row each first-round matchup
     occupies, and then each later round folded up out of the pair below it,
     for as many rounds as the half runs to. Rows are 1-based and the end is
     exclusive, which is what CSS grid wants written as `grid-row: start /
     end`. */
  function bracketRows(side, depth) {
    var openers = EGE.bracketOpeners(side);
    var used = openers.length * 2 + openers.filter(function (opener) {
      return opener.label;
    }).length;
    var pad = Math.max(0, Math.ceil((BRACKET_MIN_ROWS - used) / 2));
    var rounds = [[]];
    var at = 1 + pad;

    openers.forEach(function (opener) {
      if (opener.label) { at += 1; }          /* the heading's own row */
      rounds[0].push({ start: at, end: at + 2, opener: opener });
      at += 2;
    });

    /* Each round after the first is its two feeders, end to end. */
    for (var r = 1; r < depth; r += 1) {
      var below = rounds[r - 1];
      var here = [];
      for (var i = 0; i + 1 < below.length; i += 2) {
        here.push({ start: below[i].start, end: below[i + 1].end });
      }
      rounds.push(here);
    }

    return { rounds: rounds, height: at - 1 + pad, pad: pad };
  }

  /* One team on one line of a matchup: its seed, its name, and nothing else.
     A slot with no team in it yet is the same line left blank, which is what
     makes an undrawn round read as somewhere a team is going to go rather
     than as a gap. */
  /* One team on one line of a matchup. `result` is the settled matchup it is
     part of, or null while it is still to be played -- it decides whether
     this line is the one that went through and what score sits at the end of
     it. */
  /* Every line has the same three parts -- seed, name, score -- whether or
     not there is anything to put in them yet, so a name is centred in the
     same space on every line of every box and they all sit in one column. */
  function bracketLine(className, seed, name, score, team) {
    var row = el('div', 'ege-seed' + (className ? ' ' + className : ''));
    if (team) { row.setAttribute('data-team', team); }
    row.appendChild(el('span', 'ege-seed__no', seed));
    row.appendChild(el('span', 'ege-seed__name', name));
    row.appendChild(el('span', 'ege-seed__score', score));
    return row;
  }

  function bracketTeam(team, us, result) {
    if (!team) { return bracketLine('ege-seed--blank'); }

    var score = null;
    var classes = [];
    if (us && team.name === us) { classes.push('ege-seed--us'); }

    if (result) {
      var through = result.name === team.name;
      classes.push(through ? 'ege-seed--through' : 'ege-seed--out');
      if (typeof result.hi === 'number') { score = through ? result.hi : result.lo; }
    }

    var row = bracketLine(classes.join(' '), team.seed, team.name, score, team.name);
    /* The whole name, for one cut short at two lines. */
    row.title = team.name;
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
      box.appendChild(bracketLine('ege-seed--bye', null, 'Bye', null));
    } else {
      box.appendChild(bracketTeam(null));
    }

    return box;
  }

  /* The heading over a round: what it is called. The dates are on the
     schedule, which is where anybody looks for when a game is. */
  function bracketHead(round) {
    return el('div', 'ege-bracket__head', round.label);
  }

  /* The two halves of the draw working inwards from the edges and meeting in
     the middle, where the championship is: the rounds of the left half, the
     final, and the same rounds mirrored down the right. Nine columns for
     thirty-two teams, sized to fit a full-width computer screen; on anything
     narrower -- a phone -- the panel scrolls sideways, and a line under it
     says so. Four teams are three columns: a semifinal, the final, a
     semifinal.

     Every box is placed on one grid (see bracketRows), and the lines that
     join a game to the one its winner plays next are drawn over it afterwards
     by drawBracketLines, from where the boxes actually landed. */
  var bracketTies = null;

  /* Whether this bracket has been scrolled to his school yet. Once, the first
     time it is on screen, and never again until a different bracket is drawn
     -- scrolling it back after somebody has swiped across would be taking the
     page out of their hands. */
  var bracketFound = false;

  function renderBracket(player) {
    var wrap = document.getElementById('bracketWrap');
    var box = document.getElementById('bracket');
    /* No draw until a game of it is in sight: a bracket with their school in
       it says they made the playoffs before the season has said so -- the
       regular season for a high school, and the conference title game for a
       college team waiting on the College Football Playoff. */
    var state = EGE.bracketInSight(player, shownSeason())
      ? EGE.bracketState(player, shownSeason())
      : null;

    box.innerHTML = '';
    bracketTies = null;
    bracketFound = false;
    if (!state) { return; }
    var bracket = state.bracket;

    /* A column for every round of each half and one for the final, handed to
       the stylesheet, which lays the heads and the draw out on that many. */
    var depth = bracket.rounds.length;
    bracketColumns = depth * 2 + 1;
    box.style.setProperty('--columns', bracketColumns);
    /* Anything short of a full thirty-two-team draw would stretch its few
       columns across a panel built for nine; the stylesheet stops them at a
       box's width and puts the draw in the middle. */
    box.classList.toggle('ege-bracket--small', depth < 4);

    /* The round names over their columns, on the dark band every table on the
       site heads itself with: counting in from the left edge, the final,
       then counting back out to the right edge. */
    var heads = el('div', 'ege-bracket__heads');
    bracket.rounds.forEach(function (round) { heads.appendChild(bracketHead(round)); });
    heads.appendChild(bracketHead(bracket.final));
    bracket.rounds.slice().reverse().forEach(function (round) {
      heads.appendChild(bracketHead(round));
    });
    box.appendChild(heads);

    var draw = el('div', 'ege-bracket__draw');
    var lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lines.setAttribute('class', 'ege-bracket__lines');
    lines.setAttribute('aria-hidden', 'true');
    draw.appendChild(lines);

    var ties = { left: [], right: [], final: null };
    var height = 0;
    var pad = 0;
    var semis = [];

    [['left', false], ['right', true]].forEach(function (half) {
      var side = half[0];
      var flip = half[1];
      var plan = bracketRows(bracket[side], depth);
      height = Math.max(height, plan.height);
      pad = plan.pad;
      semis.push(plan.rounds[plan.rounds.length - 1][0]);

      plan.rounds.forEach(function (round, r) {
        /* Round one is nearest the edge on both sides. */
        var column = flip ? bracketColumns - r : r + 1;
        ties[side][r] = [];

        round.forEach(function (place, at) {
          if (place.opener && place.opener.label) {
            var group = el('div', 'ege-bracket__group' +
              (flip ? ' ege-bracket__group--flip' : ''), place.opener.label);
            group.style.gridColumn = column;
            group.style.gridRow = (place.start - 1) + ' / ' + place.start;
            draw.appendChild(group);
          }

          var tie = bracketGame(state.rounds[r][state.at(r, flip, at)], bracket.us);
          if (flip) { tie.classList.add('ege-tie--flip'); }
          tie.style.gridColumn = column;
          tie.style.gridRow = place.start + ' / ' + place.end;
          draw.appendChild(tie);
          ties[side][r].push(tie);
        });
      });
    });

    draw.style.setProperty('--rows', height);

    /* The championship in the middle column, spanning exactly the rows the
       two semifinals span, so it sits dead level with them and the lines
       into it run straight across. Centring it on the whole draw instead put
       it a few points off wherever a region heading sat above one half --
       the heading's row is in the draw but not under the semifinal -- and
       the lines stepped up into it. If the two halves were ever drawn with
       different rows it falls back to the whole height.

       The line where a champion goes sits above the game. Nothing is written
       on it until the last game is published. A draw short enough to have
       been padded (see bracketRows) spans the empty rows too, one way as far
       as the other, which is what gives that line somewhere to go. */
    var level = semis[0].start === semis[1].start && semis[0].end === semis[1].end;
    var centre = el('div', 'ege-bracket__centre');
    centre.style.gridColumn = depth + 1;
    centre.style.gridRow = level
      ? (semis[0].start - pad) + ' / ' + (semis[0].end + pad)
      : '1 / ' + (height + 1);
    var cup = el('div', 'ege-bracket__champion' +
      (state.champion ? ' ege-bracket__champion--crowned' : ''));
    if (state.champion) { cup.setAttribute('data-team', state.champion); }
    cup.appendChild(el('span', 'ege-bracket__cuplabel', 'Champion'));
    cup.appendChild(el('span', 'ege-bracket__cupname', state.champion || '\u2014'));
    centre.appendChild(cup);
    ties.final = bracketGame(state.final, bracket.us);
    ties.final.classList.add('ege-tie--final');
    centre.appendChild(ties.final);
    draw.appendChild(centre);

    box.appendChild(draw);
    bracketTies = ties;
    bracketUs = bracket.us;
    bracketHover = null;
    watchBracket(draw);

    wrap.setAttribute('aria-label', bracket.title + ' bracket');
    drawBracketLines();
  }

  /* The draw on screen, in columns: its rounds a side and the final between
     them. Nine for thirty-two teams, three for four; set as each is drawn. */
  var bracketColumns = 9;

  /* His school's name in the draw, and whichever team the pointer is on. */
  var bracketUs = null;
  var bracketHover = null;

  /* The lines between the games. Each box gets an elbow out of the side
     facing the middle: across to halfway between its column and the next,
     up or down to the level of the game its winner plays next, and across
     into that box. The two elbows out of a pair of games meet, and between
     them they draw the bracket's bracket shape.

     Drawn from where the boxes actually are rather than worked out from the
     grid, because a long school name wraps and makes its box taller, and
     every box is then a little off wherever arithmetic would have put it.
     So they are drawn again whenever the draw changes size: when it is first
     shown, when the window changes width, when the webfont lands.

     The school whose page this is, while it is still winning, has its own
     path through the draw drawn in the site's orange. */
  function drawBracketLines() {
    var wrap = document.getElementById('bracketWrap');
    var swipe = document.getElementById('bracketSwipe');
    var draw = wrap ? wrap.querySelector('.ege-bracket__draw') : null;
    var visible = Boolean(draw && bracketTies && !wrap.hidden && wrap.offsetParent !== null);

    var overflowing = visible && wrap.scrollWidth > wrap.clientWidth + 1;
    if (swipe) { swipe.hidden = !overflowing; }
    if (!visible) { return; }

    /* On a screen too narrow for the whole bracket, open it where his school
       is: the furthest round it reached, across the middle of the screen.
       Sideways only -- the page itself is left where it is. */
    if (!bracketFound && wrap.clientWidth) {
      bracketFound = true;
      var mine = draw.querySelectorAll('.ege-tie .ege-seed--us');
      var furthest = null;
      Array.prototype.forEach.call(mine, function (seed) {
        var tie = seed.closest('.ege-tie');
        var column = parseInt(tie.style.gridColumn, 10) || 0;
        var depth = Math.min(column, bracketColumns + 1 - column);
        if (!furthest || depth > furthest.depth) { furthest = { tie: tie, depth: depth }; }
      });
      if (overflowing && furthest) {
        var at = furthest.tie.getBoundingClientRect();
        var frame = wrap.getBoundingClientRect();
        wrap.scrollLeft += (at.left + at.width / 2) - (frame.left + frame.width / 2);
      }
    }

    /* Every line in the draw as tall as the tallest one in it, so every box
       is the same size as every other: the one whose school's name needs the
       most lines sets it for all of them. Measured from scratch each time --
       a different width wraps the names differently. */
    draw.style.removeProperty('--seed-height');
    var tallest = 0;
    Array.prototype.forEach.call(draw.querySelectorAll('.ege-seed'), function (line) {
      tallest = Math.max(tallest, line.getBoundingClientRect().height);
    });
    if (tallest) { draw.style.setProperty('--seed-height', Math.ceil(tallest) + 'px'); }

    var svg = draw.querySelector('.ege-bracket__lines');
    var origin = draw.getBoundingClientRect();
    if (!origin.width) { return; }

    function place(node) {
      var r = node.getBoundingClientRect();
      return {
        left: r.left - origin.left,
        right: r.right - origin.left,
        middle: (r.top + r.bottom) / 2 - origin.top
      };
    }

    /* The team that went along a line: the one in both the box it leaves and
       the box it goes into. None yet for a round that has not been played. */
    function along(from, to) {
      var next = Array.prototype.map.call(
        to.querySelectorAll('.ege-seed[data-team]'),
        function (line) { return line.getAttribute('data-team'); });
      var found = null;
      Array.prototype.forEach.call(from.querySelectorAll('.ege-seed[data-team]'), function (line) {
        if (next.indexOf(line.getAttribute('data-team')) !== -1) { found = line.getAttribute('data-team'); }
      });
      return found;
    }

    var elbows = [];

    function elbow(from, to, flip) {
      var a = place(from);
      var b = place(to);
      var out = flip ? a.left : a.right;
      var into = flip ? b.right : b.left;
      var turn = (out + into) / 2;
      elbows.push({
        team: along(from, to),
        d: 'M' + out.toFixed(1) + ' ' + a.middle.toFixed(1) +
           'H' + turn.toFixed(1) +
           'V' + b.middle.toFixed(1) +
           'H' + into.toFixed(1)
      });
    }

    [['left', false], ['right', true]].forEach(function (half) {
      var rounds = bracketTies[half[0]];
      rounds.forEach(function (round, r) {
        round.forEach(function (tie, at) {
          var next = r + 1 < rounds.length
            ? rounds[r + 1][Math.floor(at / 2)]
            : bracketTies.final;
          elbow(tie, next, half[1]);
        });
      });
    });

    /* One path a line, so a team's own run through the draw can be picked
       out. The plain ones first and his school's last, so his is on top --
       it is the one line on the page in orange, as far as he got. */
    var ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    elbows.sort(function (x, y) {
      return (x.team === bracketUs ? 1 : 0) - (y.team === bracketUs ? 1 : 0);
    }).forEach(function (line) {
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', line.d);
      if (line.team) { path.setAttribute('data-team', line.team); }
      if (line.team && line.team === bracketUs) { path.setAttribute('class', 'is-us'); }
      svg.appendChild(path);
    });

    showBracketHover();
  }

  /* Pointing at a team lights up every box it is in, white the way a
     schedule row does under the pointer, and draws its run through the draw
     in a heavier line -- how far it got, at a glance. */
  function showBracketHover() {
    var draw = document.querySelector('#bracket .ege-bracket__draw');
    if (!draw) { return; }

    Array.prototype.forEach.call(draw.querySelectorAll('.is-hover'), function (node) {
      node.classList.remove('is-hover');
    });
    if (!bracketHover) { return; }

    Array.prototype.forEach.call(draw.querySelectorAll('[data-team]'), function (node) {
      if (node.getAttribute('data-team') !== bracketHover) { return; }
      node.classList.add('is-hover');
      /* A line is drawn over the ones before it, so his goes last. */
      if (node.parentNode.namespaceURI === 'http://www.w3.org/2000/svg') {
        node.parentNode.appendChild(node);
      }
    });
  }

  document.getElementById('bracket').addEventListener('mouseover', function (event) {
    var line = event.target.closest ? event.target.closest('[data-team]') : null;
    var team = line && !line.closest('svg') ? line.getAttribute('data-team') : null;
    if (team === bracketHover) { return; }
    bracketHover = team;
    showBracketHover();
  });

  document.getElementById('bracket').addEventListener('mouseleave', function () {
    if (!bracketHover) { return; }
    bracketHover = null;
    showBracketHover();
  });

  /* Whenever the draw changes size -- shown, hidden, a different width, a
     font arriving -- its lines are drawn again. One observer, moved on to
     each new draw as it is made. */
  var bracketObserver = null;

  function watchBracket(draw) {
    if (!window.ResizeObserver) { return; }
    if (!bracketObserver) {
      bracketObserver = new window.ResizeObserver(function () { drawBracketLines(); });
    }
    bracketObserver.disconnect();
    bracketObserver.observe(draw);
  }

  /* --- games or tournament -------------------------------------------------

     Which of the two the panel is showing. It survives a redraw -- the
     boosters and the inventory land after the page is up and draw the
     schedule again -- and goes back to the games when a different player is
     opened, because a bracket is his school's, not the site's. */
  var scheduleView = 'games';

  function showScheduleView() {
    /* The switch comes with the draw coming into sight: see renderBracket. */
    var bracket = schedulePlayer && EGE.bracketInSight(schedulePlayer, shownSeason())
      ? EGE.bracketFor(schedulePlayer, shownSeason())
      : null;
    var tournament = Boolean(bracket) && scheduleView === 'tournament';

    document.getElementById('scheduleSwitch').hidden = !bracket;
    document.getElementById('bracketWrap').hidden = !tournament;

    /* Everything the games view owns goes away together, the empty note and
       the legend included -- a foot reading "* conference game" under a
       bracket is the schedule talking over it. */
    var games = EGE.scheduleFor(schedulePlayer, shownSeason());
    document.getElementById('scheduleTableWrap').hidden = tournament || !games.length;
    document.getElementById('scheduleEmpty').hidden = tournament || Boolean(games.length);
    document.getElementById('scheduleFoot').hidden = tournament ||
      !document.getElementById('scheduleLegend').textContent;

    /* A hidden bracket measures as nothing, so its lines are drawn the moment
       it is shown rather than when it was built -- and the swipe note goes
       with it when it is not. */
    drawBracketLines();
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
      row.dataset.week = game.week;
      row.appendChild(el('td', 'ege-schedule__week', game.week));

      var opponent = el('td', 'ege-gamelog__opponent');
      opponent.appendChild(el('span', 'ege-schedule__side', game.home || game.neutral ? 'vs' : 'at'));
      opponentName(opponent, game);

      /* A booster is the player's own business, and an admin's. It shows here
         under the same rule the stickers on the schedule follow. */
      var booster = EGE.boosterOn(player, game);
      if (booster && canSeeStickers(player)) {
        var mark = el('abbr', 'ege-gamelog__boost', booster.multiplier + 'x');
        mark.title = booster.name + ' was on this game';
        opponent.appendChild(mark);
      }
      /* And a wager, the same way: what it did to the game's credits. */
      var wager = canSeeStickers(player) ? EGE.wagerOn(player, game) : null;
      if (wager && wager.outcome) {
        var bet = el('abbr', 'ege-gamelog__boost ege-gamelog__boost--' + wager.outcome,
          wager.outcome === 'won' ? 'Bet 2x' : wager.outcome === 'lost' ? 'Bet 0x' : 'Bet 1x');
        bet.title = wager.name + (wager.outcome === 'won' ? ' won: double credits'
          : wager.outcome === 'lost' ? ' lost: no credits' : ' was a tie: credits as usual');
        opponent.appendChild(bet);
      }
      row.appendChild(opponent);

      var result = el('td', 'num');
      result.appendChild(resultTag(game));
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

  /* Schedule, game log and ratings all fold away. The ratings used to stay
     open because the overall sat in the corner of their heading; it is on a
     band inside the panel now, and folds away with everything else in it.

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

      var label = el('span', 'ege-attr__label', attr.label);
      label.title = attr.label;
      row.appendChild(label);

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

  /* His three best attributes, for the podium, best first.

     Ranked among the attributes his position is judged on before anything
     else. Every page shows Break Sack under Carrying, but it is a
     quarterback's number and counts for nothing toward a back's overall;
     straight off the top it would have been the second-best thing about
     both running backs. Anything his position does not count only comes in
     if there are not three that it does.

     A tie goes to the attribute that counts for more toward his overall --
     Catching over Catch in Traffic for a tight end -- and then to whichever
     comes first on the page, so the same numbers always stand the same way. */
  function bestAttributes(ratings, count) {
    var weights = EGE.weightsFor(ratings.position);
    var all = [];
    ratings.groups.forEach(function (group) {
      group.attributes.forEach(function (attr) {
        if (typeof attr.value !== 'number') { return; }
        all.push({
          label: attr.label,
          value: attr.value,
          weight: weights[attr.key] || 0,
          order: all.length
        });
      });
    });

    all.sort(function (a, b) {
      return (b.weight > 0) - (a.weight > 0) ||
        b.value - a.value ||
        b.weight - a.weight ||
        a.order - b.order;
    });
    return all.slice(0, count);
  }

  /* Written best first, which is the order a screen reader gives them. The
     stylesheet is what stands them second, first, third, with the best one
     biggest. */
  function renderPodium(ratings) {
    var list = document.getElementById('ratingsPodium');
    list.innerHTML = '';

    bestAttributes(ratings, 3).forEach(function (attr, at) {
      var place = el('li', 'ege-podium__place ege-podium__place--' + (at + 1));
      place.appendChild(el('span', 'ege-podium__value', attr.value));
      place.appendChild(el('span', 'ege-podium__label', attr.label));
      list.appendChild(place);
    });
    list.hidden = !list.children.length;
  }

  /* The overall in the header, on the right of the name and the facts: the
     tiered box the home page and the team rosters draw, made big, and joined
     under it the way the height and weight hang off the picture, how far it
     has climbed since the live season began. */
  function renderOverall(ratings) {
    var holder = document.getElementById('playerOverall');
    holder.innerHTML = '';

    var box = ratings && overallBox(ratings.overall, 'ege-ovrbox--hero');
    holder.hidden = !box;
    if (!box) { return; }
    holder.appendChild(box);

    if (typeof ratings.overallStart !== 'number') { return; }
    var change = ratings.overall - ratings.overallStart;
    var progress = el('div', 'ege-ovrprog');
    progress.title = tickerTitle(change, ratings.overallStart, ratings.overall);
    progress.appendChild(el('span', 'ege-ovrprog__label', 'This season'));
    progress.appendChild(tickerEl(change, 'ege-ticker--lg'));
    holder.appendChild(progress);
  }

  function renderRatings(player) {
    var ratings = EGE.ratingsFor(player);
    var holder = document.getElementById('ratingsGroups');
    holder.innerHTML = '';

    if (!ratings) { ratingsPanel.hidden = true; renderOverall(null); return; }

    renderOverall(ratings);
    renderPodium(ratings);

    ratings.groups.forEach(function (group) { holder.appendChild(buildGroup(group)); });
    ratingsPanel.hidden = false;
  }

  /* --- the trophy case ----------------------------------------------------

     Under the ratings: a wooden cabinet holding every trophy he has won, from
     the `trophies` list on his entry in data/players.js. A shelf holds as
     many as fit across it -- eight or so on a computer, four on a phone --
     and the next one goes on a new shelf under it, so the cabinet grows a
     shelf at a time. With nothing won yet there is no cabinet at all. The shelf
     itself is drawn in site.css; this only decides what goes on which. */
  var trophyPanel = document.getElementById('trophyPanel');
  var trophyCase = document.getElementById('trophyCase');
  var trophyShown = { items: [], perShelf: 0 };

  /* A gold cup on a dark plinth. */
  var CUP_SVG = '<svg viewBox="0 0 40 52" aria-hidden="true">' +
    '<path d="M9 4h22v10c0 8-5 14-11 14S9 22 9 14z" fill="#f0b82a" stroke="#8a5a0b" stroke-width="1.2"/>' +
    '<path d="M9 8H4c0 7 3 11 7 12M31 8h5c0 7-3 11-7 12" fill="none" stroke="#c98f12" stroke-width="2.4"/>' +
    '<path d="M17 28h6v7h-6z" fill="#d9a21d"/>' +
    '<path d="M12 35h16v4H12z" fill="#f0b82a" stroke="#8a5a0b" stroke-width="1"/>' +
    '<path d="M9 39h22v9H9z" fill="#3a2414"/>' +
    '<path d="M14 7h3v12c-2-1-3-4-3-7z" fill="#fff" opacity=".35"/>' +
    '</svg>';

  /* A trophy with a picture of its own (`image`, a path under
     icon/trophies/) is shown as that picture; one without gets the gold cup
     and his name for it on a brass plate under it, the season after it.
     Either way, pointing at it lifts it and says what it is, from `about` if
     the entry has one, and clicking it -- or tapping it on a phone -- opens
     it up close in the same overlay a card does. */
  function trophyAbout(trophy) {
    return trophy.about || (trophy.name + (trophy.season ? ' \u00b7 ' + trophy.season : ''));
  }

  function trophyEl(trophy) {
    var item = el('li', 'ege-trophy');
    var about = trophyAbout(trophy);
    EGE.cardsView.pressable(item, about, function () { zoomTrophy(trophy, art); });

    var art = el('span', 'ege-trophy__art');
    if (trophy.image) {
      var img = el('img', 'ege-trophy__img');
      img.src = trophy.image;
      img.alt = '';                   /* the label on the item says it */
      img.loading = 'lazy';
      img.decoding = 'async';
      art.appendChild(img);
      item.classList.add('ege-trophy--pictured');
      /* A bigger honour stands taller than the rest; see `scale`. */
      if (typeof trophy.scale === 'number') { item.style.setProperty('--trophy-scale', trophy.scale); }
    } else {
      var cup = el('span', 'ege-trophy__cup');
      cup.innerHTML = CUP_SVG;
      art.appendChild(cup);
      var plate = el('span', 'ege-trophy__plate', trophy.name);
      if (trophy.season) { plate.appendChild(el('span', 'ege-trophy__season', String(trophy.season))); }
      art.appendChild(plate);
    }
    item.appendChild(art);

    var tip = el('span', 'ege-trophy__tip', about);
    tip.setAttribute('aria-hidden', 'true');
    item.appendChild(tip);
    return item;
  }

  /* A trophy up close: the card overlay -- the page blurred and dark behind
     it, its name across the top and the close at the top right -- with the
     trophy as big as the screen allows and what it is under it. */
  function zoomTrophy(trophy, art) {
    var stage = EGE.cardsView.openOverlay(
      trophy.name + (trophy.season ? ' \u00b7 ' + trophy.season : ''), 'ege-rip__stage--trophy');

    var holder = el('div', 'ege-trophyzoom');
    holder.appendChild(art.cloneNode(true));
    stage.appendChild(holder);
    stage.appendChild(el('p', 'ege-trophyzoom__about', trophyAbout(trophy)));

    var close = stage.querySelector('.ege-rip__close');
    if (close) { close.focus({ preventScroll: true }); }
  }

  /* A click anywhere but on the trophy itself puts it away. The overlay is
     the cards' too, so this only acts while a trophy is what is in it. */
  document.getElementById('cardRip').addEventListener('click', function (e) {
    if (!this.querySelector('.ege-rip__stage--trophy')) { return; }
    if (e.target.closest('.ege-trophyzoom .ege-trophy__art')) { return; }
    EGE.cardsView.closeOverlay();
  });

  function shelfEl() {
    var shelf = el('div', 'ege-shelf');
    shelf.appendChild(el('ul', 'ege-shelf__items'));
    return shelf;
  }

  /* How many trophies fit across one shelf at the width it is drawn at:
     the slot and the gap between slots are set in site.css. */
  function trophiesPerShelf() {
    var list = trophyCase.querySelector('.ege-shelf__items');
    if (!list || !list.clientWidth) { return 0; }
    var style = window.getComputedStyle(list);
    var room = list.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    var slot = parseFloat(style.getPropertyValue('--trophy-slot')) || 96;
    var gap = parseFloat(style.columnGap) || 0;
    return Math.max(1, Math.floor((room + gap) / (slot + gap)));
  }

  function drawTrophyShelves(force) {
    if (!trophyShown.items.length) { return; }
    if (!trophyCase.firstChild) { trophyCase.appendChild(shelfEl()); }
    var perShelf = trophiesPerShelf();
    /* Folded away or not on screen: nothing to measure, so leave it be. */
    if (!perShelf) { return; }
    if (!force && perShelf === trophyShown.perShelf) { return; }
    trophyShown.perShelf = perShelf;

    var items = trophyShown.items;
    var shelves = Math.max(1, Math.ceil(items.length / perShelf));
    trophyCase.innerHTML = '';
    for (var i = 0; i < shelves; i += 1) {
      var shelf = shelfEl();
      var list = shelf.firstChild;
      items.slice(i * perShelf, (i + 1) * perShelf).forEach(function (trophy) {
        list.appendChild(trophyEl(trophy));
      });
      trophyCase.appendChild(shelf);
    }
  }

  function renderTrophies(player) {
    trophyShown.items = (player.trophies || []).slice();
    /* Forget the last player's shelves, so if this page is not on screen
       yet the first measure once it is deals his out. */
    trophyShown.perShelf = 0;
    trophyCase.innerHTML = '';

    /* No trophies, no cabinet: it only shows once he has won something. */
    trophyPanel.hidden = !trophyShown.items.length;
    if (trophyPanel.hidden) { return; }
    drawTrophyShelves(true);
  }

  /* A shelf that was full at one width may not be at another, so the shelves
     are dealt out again whenever the cabinet changes width. */
  if (window.ResizeObserver) {
    new window.ResizeObserver(function () { drawTrophyShelves(false); }).observe(trophyCase);
  } else {
    window.addEventListener('resize', function () { drawTrophyShelves(false); });
  }

  /* --- shop ------------------------------------------------------------- */

  var sayShop = reporter('shopMessage', true);
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

  /* Cards for a thing that levels up, priced off where the chosen
     quarterback's connection stands: the card is redrawn when he is picked
     and after every purchase. */
  var levelCards = [];

  function refreshLevelPrices() {
    levelCards.forEach(function (card) {
      var target = card.picker ? card.picker.value || null : null;
      var held = EGE.levelOf(shopState.inventory, card.item.key, target);
      var fresh = creditTag(EGE.priceFor(card.item, held));
      card.head.replaceChild(fresh, card.tag);
      card.tag = fresh;

      if (card.picker && !target) {
        card.note.textContent = 'Buy it again with the same quarterback to level it up.';
      } else if (!held) {
        card.note.textContent = 'Buy it again to level it up \u2014 from the third level on, each costs more.';
      } else {
        card.note.textContent = 'Level ' + EGE.roman(held) + (target ? ' with ' + target : '') +
          '. ' + EGE.roman(held + 1) + ' costs ' + EGE.priceFor(card.item, held) + '.';
      }
    });
  }

  function buildShopItem(item) {
    var card = el('div', 'ege-item');

    var head = el('div', 'ege-item__head');
    head.appendChild(el('h4', 'ege-item__name', EGE.itemName(item, shopState.player)));
    var tag = creditTag(EGE.priceFor(item, item.levels ? 0 : ownedNow(item)));
    head.appendChild(tag);
    card.appendChild(head);

    var levelNote = null;
    if (item.levels) {
      levelNote = el('p', 'fb-meta ege-item__stack');
      card.appendChild(levelNote);
    }

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
    var allowed = EGE.itemAvailable(item, EGE.currentSeason, shopState.player);
    if (!allowed.ok) {
      card.classList.add('ege-item--locked');
      card.appendChild(el('p', 'ege-item__blocked', allowed.reason));
    }

    /* A QB Connection is with one quarterback, picked from his team's room,
       and the button waits until one is. */
    if (EGE.needsQuarterback(item, shopState.player)) {
      var field = el('label', 'ege-statfield ege-item__pick');
      field.appendChild(el('span', 'ege-statfield__label', 'Your quarterback'));
      picker = el('select', 'fb-select');
      var choose = el('option', null, 'Choose a quarterback\u2026');
      choose.value = '';
      picker.appendChild(choose);
      EGE.quarterbacksFor(shopState.player, EGE.currentSeason).forEach(function (name) {
        var option = el('option', null, name);
        option.value = name;
        picker.appendChild(option);
      });
      field.appendChild(picker);
      card.appendChild(field);
    }

    if (levelNote) {
      levelCards.push({ item: item, tag: tag, note: levelNote, head: head, picker: picker });
      if (picker) { picker.addEventListener('change', refreshLevelPrices); }
      refreshLevelPrices();
    }

    var buy = el('button', 'fb-btn fb-btn--primary fb-btn--block',
      allowed.ok ? 'Buy' : 'Unavailable');
    buy.type = 'button';
    buy.disabled = !allowed.ok || Boolean(picker && !picker.value);
    if (picker) {
      picker.disabled = !allowed.ok;
      picker.addEventListener('change', function () {
        buy.disabled = !allowed.ok || !picker.value;
      });
    }
    buy.addEventListener('click', function () {
      buy.disabled = true;
      sayShop('', false);
      EGE.wallet.buy(shopState.player.email, item, picker ? picker.value || null : null,
                     shopState.player)
        .then(function (res) {
          buy.disabled = Boolean(picker && !picker.value);
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
        sayShop('', false);
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

  /* The ways the points table can be ordered, in a drop-down above it. A
     maxed attribute has no next point, so it sinks to the bottom of anything
     ordered by price. */
  function priceOrder(direction) {
    return function (a, b) {
      if (a.cost === null || b.cost === null) {
        return (a.cost === null ? 1 : 0) - (b.cost === null ? 1 : 0);
      }
      return direction * (a.cost - b.cost);
    };
  }

  var UPGRADE_SORTS = [
    { key: 'value',  label: 'Best value',      title: 'Most overall for the credits',
      compare: function (a, b) { return b.value_ - a.value_; } },
    { key: 'impact', label: 'Most OVR impact', title: 'Biggest gain to your overall per point',
      compare: function (a, b) { return b.gain - a.gain; } },
    { key: 'cheap',  label: 'Cheapest',        title: 'Cheapest next point first',
      compare: priceOrder(1) },
    { key: 'dear',   label: 'Most expensive',  title: 'Dearest next point first',
      compare: priceOrder(-1) },
    { key: 'high',   label: 'Highest rating',  title: 'Highest rating to lowest',
      compare: function (a, b) { return b.value - a.value; } },
    { key: 'low',    label: 'Lowest rating',   title: 'Lowest rating to highest',
      compare: function (a, b) { return a.value - b.value; } },
    { key: 'group',  label: 'Group',           title: 'By group, then best value',
      compare: function (a, b) { return a.group.localeCompare(b.group); } },
    { key: 'name',   label: 'A\u2013Z',         title: 'Attribute name, A to Z',
      compare: function (a, b) { return a.label.localeCompare(b.label); } }
  ];

  var upgradeSort = 'value';

  var upgradeGroup = '';      /* '' is every group */
  var groupHolder = null;
  var sortPick = null;

  function sortedPlan(plan) {
    var chosen = UPGRADE_SORTS.filter(function (sort) { return sort.key === upgradeSort; })[0];
    return plan.filter(function (row) {
      return !upgradeGroup || row.groupKey === upgradeGroup;
    }).sort(function (a, b) {
      return chosen.compare(a, b) ||
        (b.value_ - a.value_) ||
        a.label.localeCompare(b.label);
    });
  }

  /* The sorts are one drop-down; the buttons beside it narrow the table to
     one group of attributes. Only the groups this position is judged on get a
     button -- a running back has no Passing -- so they are drawn from the
     player's own plan rather than from a fixed list. */
  function buildUpgradeSorter() {
    var bar = el('div', 'fb-row fb-row--wrap ege-sortbar');

    var field = el('label', 'ege-sortbar__sort');
    field.appendChild(el('span', 'fb-eyebrow', 'Sort by'));
    sortPick = el('select', 'fb-select');
    UPGRADE_SORTS.forEach(function (sort) {
      var option = el('option', null, sort.label);
      option.value = sort.key;
      option.title = sort.title;
      sortPick.appendChild(option);
    });
    sortPick.value = upgradeSort;
    sortPick.addEventListener('change', function () {
      upgradeSort = sortPick.value;
      refreshUpgrades();
    });
    field.appendChild(sortPick);
    bar.appendChild(field);

    groupHolder = el('div', 'fb-row fb-row--wrap ege-sortbar__groups');
    groupHolder.setAttribute('role', 'group');
    groupHolder.setAttribute('aria-label', 'Show one group of attributes');
    bar.appendChild(groupHolder);
    return bar;
  }

  function drawGroupButtons(plan) {
    if (!groupHolder) { return; }
    groupHolder.innerHTML = '';

    var groups = [];
    plan.forEach(function (row) {
      if (!groups.some(function (g) { return g.key === row.groupKey; })) {
        groups.push({ key: row.groupKey, label: row.group });
      }
    });
    /* Another player's groups can be gone from this one's. */
    if (!groups.some(function (g) { return g.key === upgradeGroup; })) { upgradeGroup = ''; }
    if (groups.length < 2) { return; }

    [{ key: '', label: 'All' }].concat(groups).forEach(function (group) {
      var on = group.key === upgradeGroup;
      var button = el('button', 'fb-chip' + (on ? ' is-active' : ''), group.label);
      button.type = 'button';
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.addEventListener('click', function () {
        upgradeGroup = group.key;
        refreshUpgrades();
      });
      groupHolder.appendChild(button);
    });
  }

  function buildUpgrades() {
    var box = el('div', 'fb-stack');
    box.appendChild(buildUpgradeSorter());

    var wrap = el('div', 'fb-tablewrap ege-upgrades-wrap');
    box.appendChild(wrap);
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
    return box;
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
    var plan = EGE.economy.upgradePlan(shopState.player);
    drawGroupButtons(plan);
    sortedPlan(plan).forEach(function (row) {
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
    title.appendChild(el('h4', 'ege-item__name', item && item.levels
      ? EGE.connectionName(item, options.player, EGE.connectionQuarterback(row), quantity)
      : row.item_name + (!isUpgrade && quantity > 1 ? ' \u00d7' + quantity : '')));
    head.appendChild(title);
    if (state) {
      head.appendChild(el('span', 'fb-tag fb-tag--num ' +
        (lapsed ? 'fb-tag--clay' : 'fb-tag--outline'), state));
    }
    card.appendChild(head);

    var cardWho = connectionWho(row, options.player);
    if (cardWho) { card.appendChild(cardWho); }

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
    } else if (!lapsed && !workout && (options.admin || playerMaySwitch(row))) {
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

  /* Who a QB Connection is with, as a headshot and a name. Null for a
     connection with nobody named (a quarterback's own, with his line). */
  function connectionWho(row, player) {
    var name = EGE.connectionQuarterback(row);
    if (!name) { return null; }

    var who = el('span', 'ege-qb');
    var photo = EGE.quarterbackPhoto(player, EGE.currentSeason, name);
    if (photo) {
      var face = el('img', 'ege-qb__photo');
      face.src = photo;
      face.alt = '';
      face.loading = 'lazy';
      who.appendChild(face);
    }
    who.appendChild(el('span', 'ege-qb__name', name));
    return who;
  }

  /* A QB Connection is switched by an admin only. A quarterback who is
     traded or retires ends the connection, and that is not the player's call
     to make -- or to undo. */
  function playerMaySwitch(row) {
    return row.item_key !== 'qb-connection' || isAdmin();
  }

  function ownedThing(rows) {
    var row = rows[0];
    var item = EGE.shopItem(row.item_key);
    var lapsed = EGE.wallet.lapsed(row);
    var who = connectionWho(row, shopState.player);
    var switchable = !isWorkout(row) && !lapsed && playerMaySwitch(row);
    var off = switchable && !row.active;
    var count = rows.reduce(function (sum, one) { return sum + EGE.wallet.quantityOf(one); }, 0);
    var leveled = Boolean(item && item.levels);

    var disabled = !lapsed && !isWorkout(row) && !row.active && !switchable;

    var thing = el(switchable ? 'button' : 'div',
      'ege-owned__thing ege-owned__item' + (who ? ' ege-owned__item--qb' : '') +
      (lapsed ? ' is-expired' : ((off || disabled) ? ' is-off' : '')));
    var label = (leveled
        ? EGE.connectionName(item, shopState.player, EGE.connectionQuarterback(row), count)
        : row.item_name + (count > 1 ? ' \u00d7' + count : '')) +
      (lapsed ? ' \u2014 expired' : '') +
      (switchable ? (row.active ? ' \u2014 on, tap to turn off' : ' \u2014 off, tap to turn on') : '') +
      (disabled ? ' \u2014 turned off by an admin' : '');
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
    if (who) { thing.appendChild(who); }
    /* A connection counts in levels, not in copies. */
    if (count > 1) {
      thing.appendChild(el('span', 'ege-shelf__count', leveled ? EGE.roman(count) : count + 'X'));
    }
    if (off || disabled || lapsed) {
      thing.appendChild(el('span', 'ege-owned__flag', lapsed ? 'Expired' : 'Off'));
    }

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
  var adminState = { credits: [], diamonds: null, inventory: [], awards: [], diamondAwards: [],
                     ratingsDownloaded: false };

  function isAdmin() { return EGE.wallet.admin(); }

  /* A balance to type over, with its coin or its diamond after it. */
  function balanceField(value, label, icon) {
    var field = el('label', 'ege-account__balance');
    var input = el('input', 'fb-input ege-account__credits');
    input.type = 'number';
    input.min = '0';
    input.value = value === null ? '' : value;
    input.setAttribute('aria-label', label);
    field.appendChild(input);
    var mark = el('span', icon);
    mark.setAttribute('aria-hidden', 'true');
    field.appendChild(mark);
    return { field: field, input: input };
  }

  /* One account: what it holds, what it has been paid, and the two things an
     admin does to it by hand — set its balances, or hand something over.

     `diamonds` is null when the diamond table could not be read, and then
     that box is shut rather than offering to write a number over one
     nobody has seen. */
  function adminAccount(player, credits, diamonds, rows) {
    var box = el('div', 'ege-account');

    var head = el('div', 'ege-account__head');
    var who = el('div', 'ege-who');
    var photo = el('img', 'ege-avatar ege-avatar--sm');
    photo.src = player.headshot;
    photo.alt = '';
    who.appendChild(photo);
    who.appendChild(el('span', 'ege-account__name', player.name));
    head.appendChild(who);

    var editor = el('div', 'fb-row fb-row--wrap ege-account__balances');
    var creditBox = balanceField(credits, 'Credits for ' + player.name, 'ege-coin');
    var gemBox = balanceField(diamonds, 'Diamonds for ' + player.name, 'ege-gem');
    gemBox.input.disabled = diamonds === null;
    if (diamonds === null) { gemBox.input.placeholder = '\u2014'; }
    editor.appendChild(creditBox.field);
    editor.appendChild(gemBox.field);

    /* Only what was changed is written. Saving a credit balance must not put
       back a diamond number that a game has paid into since the page was
       drawn, and the other way round. */
    var save = el('button', 'fb-btn fb-btn--primary', 'Save');
    save.type = 'button';
    save.addEventListener('click', function () {
      var jobs = [];
      if (String(creditBox.input.value) !== String(credits)) {
        jobs.push(EGE.wallet.setCredits(player.email, creditBox.input.value).then(function (res) {
          return res.ok ? { ok: true, text: res.credits + ' credits' } : res;
        }));
      }
      if (diamonds !== null && String(gemBox.input.value) !== String(diamonds)) {
        jobs.push(EGE.wallet.setDiamonds(player.email, gemBox.input.value).then(function (res) {
          return res.ok ? { ok: true, text: res.diamonds + ' diamonds' } : res;
        }));
      }
      if (!jobs.length) { sayAdmin('Nothing changed for ' + player.first + '.', false); return; }

      save.disabled = true;
      Promise.all(jobs).then(function (all) {
        save.disabled = false;
        var bad = all.filter(function (res) { return !res.ok; })[0];
        sayAdmin(bad ? bad.message
                     : player.first + ' now has ' + all.map(function (res) { return res.text; }).join(' and ') + '.',
                 Boolean(bad));
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

    /* A QB Connection handed over is still with somebody. */
    var qbPick = el('select', 'fb-select ege-account__grant');
    EGE.quarterbacksFor(player, EGE.currentSeason).forEach(function (name) {
      var opt = el('option', null, name);
      opt.value = name;
      qbPick.appendChild(opt);
    });
    qbPick.setAttribute('aria-label', 'Which quarterback');
    function showQbPick() {
      qbPick.hidden = !EGE.needsQuarterback(EGE.shopItem(pick.value), player);
    }
    pick.addEventListener('change', showQbPick);
    showQbPick();
    granter.appendChild(qbPick);

    var give = el('button', 'fb-btn', 'Grant');
    give.type = 'button';
    give.addEventListener('click', function () {
      give.disabled = true;
      EGE.wallet.grant(player.email, EGE.shopItem(pick.value),
                       qbPick.hidden ? null : qbPick.value || null).then(function (res) {
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
        grid.appendChild(inventoryCard(row, { admin: true, player: player, report: sayAdmin,
                                              refresh: refreshAdminView }));
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
      var gems = adminState.diamonds === null ? null
        : adminState.diamonds.filter(function (d) { return d.email === player.email; })[0];
      var owned = adminState.inventory.filter(function (i) { return i.email === player.email; });
      holder.appendChild(adminAccount(player, row ? row.credits : EGE.shop.startingCredits,
                                     adminState.diamonds === null ? null : (gems ? gems.diamonds : 0),
                                     owned));
    });
  }

  /* Every balance at once: add the number to all of them, or set all of
     them to it, in credits or in diamonds. Set asks first, since it writes
     over six numbers nobody has written down. */
  function wireEveryone() {
    function run(mode, button) {
      var amount = document.getElementById('everyoneAmount').value;
      var currency = document.getElementById('everyoneCurrency').value;
      if (mode === 'set' && !window.confirm('Set every balance to ' + amount + ' ' + currency +
                                            '? What each player has now is not kept anywhere.')) {
        return;
      }
      button.disabled = true;
      EGE.wallet.adjustEveryone(currency, mode, amount).then(function (res) {
        button.disabled = false;
        sayAdmin(res.message, !res.ok);
        refreshAdminView();
        updateNavCreditsFromServer();
      });
    }
    var add = document.getElementById('everyoneAdd');
    var set = document.getElementById('everyoneSet');
    add.addEventListener('click', function () { run('add', add); });
    set.addEventListener('click', function () { run('set', set); });
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

    var totals = { all: 0, touchdowns: 0, games: 0, waiting: 0, diamonds: 0 };
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
        return sum + EGE.economy.gameCredits(player, game.stats, season, game.playoff);
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

      /* What the games have paid in diamonds, off their own ledger. */
      var gems = adminState.diamondAwards.filter(function (a) {
        return player.email && a.email &&
               a.email.toLowerCase() === player.email.toLowerCase();
      }).reduce(function (sum, a) { return sum + a.diamonds; }, 0);
      totals.diamonds += gems;

      if (player.email) {
        [sums.td, sums.offseason].forEach(function (value) {
          tr.appendChild(el('td', 'num', String(value)));
        });
        var total = el('td', 'num');
        total.appendChild(el('strong', null, String(all)));
        tr.appendChild(total);
        tr.appendChild(el('td', 'num', EGE.economy.paysDiamonds(season) ? String(gems) : '—'));
      } else {
        /* Nothing can be paid into an account that does not exist yet. What
           the touchdowns are worth shows as waiting, not as earned. */
        tr.appendChild(el('td', 'num', owed ? owed + ' waiting' : '—'));
        tr.appendChild(el('td', 'num', '—'));
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
          ? totals.games + ' games played, ' + totals.all + ' credits' +
            (totals.diamonds ? ' and ' + totals.diamonds + ' diamonds' : '') + ' paid out' + waiting
          : 'No games posted yet. Every game pays its fantasy points (half PPR), ' +
            'rounded up, at ' + shares.QB + ' for a quarterback, ' + shares.RB +
            ' for a back and ' + shares.TE + ' for a tight end or receiver.')
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

      tr.appendChild(el('td', 'num', discordState(row, published)));

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
        again.title = 'Send the Discord message again without changing anything. ' +
          'When only one league\u2019s went out, just the other one.';
        again.addEventListener('click', function () {
          again.disabled = true;
          sendWeekToDiscord(season, week, row).then(function (res) {
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

  var LEAGUE_NAMES = { nfl: 'NFL', college: 'college' };

  /* The Discord column: sent, not yet, or which league's went out when only
     one of the two did. */
  function discordState(row, published) {
    if (row && row.posted_at) { return 'sent'; }
    var some = (row && row.posted_leagues) || [];
    if (some.length) {
      return some.map(function (league) { return LEAGUE_NAMES[league] || league; }).join(', ') + ' sent';
    }
    return published ? 'not yet' : '—';
  }

  /* The week to Discord, one message per league to that league's channel:
     the NFL's players to the NFL bot and the colleges' to the college bot.
     Given the week's row, only the leagues it has not had yet go -- unless
     it has had them all, which is Post again meaning it. Sent one after the
     other, so the two land in the same order every week. */
  function sendWeekToDiscord(season, week, row) {
    var posts = EGE.discordPost.buildWeekPosts(week, {
      season: season,
      siteUrl: EGE.discordPost.SITE,
      played: true
    });
    if (!posts.length) {
      return Promise.resolve({ ok: false, message: 'Week ' + week + ' has no games to post.' });
    }

    var before = (row && !row.posted_at && row.posted_leagues) || [];
    var owed = posts.filter(function (post) { return before.indexOf(post.league) === -1; });
    if (!owed.length) { owed = posts; before = []; }

    var sent = before.slice();
    var failed = [];
    return owed.reduce(function (chain, post) {
      return chain.then(function () {
        return EGE.wallet.postWeekToDiscord(post.payload, post.league).then(function (res) {
          if (res.ok) { sent.push(post.league); } else { failed.push(LEAGUE_NAMES[post.league] + ': ' + res.message); }
        });
      });
    }, Promise.resolve()).then(function () {
      var done = posts.every(function (post) { return sent.indexOf(post.league) !== -1; });
      var mark = sent.length ? EGE.wallet.markPosted(season, week, sent, done) : Promise.resolve();
      return mark.then(function () {
        var names = owed.filter(function (post) { return sent.indexOf(post.league) !== -1; })
          .map(function (post) { return LEAGUE_NAMES[post.league]; });
        if (!failed.length) {
          return { ok: true, message: 'Posted to Discord' + (posts.length > 1 ? ' (' + names.join(' and ') + ')' : '') + '.' };
        }
        return {
          ok: false,
          message: (names.length ? 'Posted the ' + names.join(' and ') + ' week. ' : '') +
                   'Discord did not take ' + failed.join('; ') +
                   ' The week is still out; Post again retries just what is missing.'
        };
      });
    });
  }

  /* Everyone's game credits and diamonds for the season, now that a week
     has landed.

     Every player, and every week, not just the one going out: paying is keyed
     on what earned it, so a week that is already square costs one call and
     pays nothing, and a stat line corrected since it was published pays the
     difference. That is what makes this safe to run as often as you like.

     The stickers on the season's games are loaded once, before any diamonds
     are worked out, since a booster multiplies them. */
  function payTheWeek(season) {
    var boosters = season === EGE.currentSeason
      ? EGE.wallet.loadGameBoosters(season)
      : Promise.resolve();
    var cards = { paid: 0 };

    return boosters.then(function () {
      /* The admin's own Player Cards too. They used to wait for the next
         load, so the week's game diamonds landed in the nav and the cards'
         share of it only after a reload. Only your own: Postgres pays a
         Player Card to whoever is signed in, so everybody else's are paid
         when their page next checks in (see "staying current" below). */
      var me = EGE.auth.currentPlayer();
      return me && season === EGE.currentSeason
        ? EGE.cardStore.syncPlayerCards(me, season).then(function (res) { cards = res; })
        : null;
    }).then(function () {
      return Promise.all(EGE.playersWithAccounts().map(function (player) {
        /* A player hurt in the week just out has his boosters on the games
           he will miss handed back first (wagers stay). */
        return EGE.wallet.returnInjuredBoosters(player, season, true).then(function () {
          return Promise.all([
            EGE.wallet.syncAwards(player, season, true),
            EGE.wallet.syncDiamonds(player, season, true)
          ]);
        }).then(function (both) {
          return {
            player: player,
            paid: both[0].paid || 0,
            diamonds: both[1].paid || 0,
            problem: both[0].message || both[1].message || null
          };
        });
      }));
    }).then(function (all) {
      function tally(key, word) {
        var paid = all.filter(function (one) { return one[key] > 0; });
        return {
          total: paid.reduce(function (sum, one) { return sum + one[key]; }, 0),
          names: paid.map(function (one) { return one.player.first + ' +' + one[key]; }),
          word: word
        };
      }
      return {
        credits: tally('paid', 'credits'),
        diamonds: tally('diamonds', 'diamonds'),
        cards: cards.paid || 0,
        missed: all.filter(function (one) { return one.problem; })
                   .map(function (one) { return one.player.first; })
      };
    });
  }

  /* What to tell the admin about the payout, which is never nothing. */
  function creditLine(paid) {
    var parts = [paid.credits, paid.diamonds].filter(function (one) { return one.total; })
      .map(function (one) {
        return one.total + ' ' + one.word + ' paid \u2014 ' + one.names.join(', ') + '.';
      });
    if (paid.cards) { parts.push('Your Player Cards paid ' + paid.cards + ' diamonds.'); }
    var line = parts.length ? parts.join(' ') : 'No credits or diamonds were owed.';
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

    /* Open on the first week that still needs numbers, or the first week
       when they all have them. Week 0 is a week like any other -- a season
       that opens in August has one -- so it is looked for, not tested for
       truth, or a season with every week filled in opened on nothing. */
    var next = weeks.filter(function (week) {
      return EGE.gamesInWeek(week, season).some(function (entry) {
        return !entry.game.bye && !EGE.hasResult(entry.game);
      });
    })[0];
    var start = next !== undefined ? next : weeks[0];
    select.value = start !== undefined ? String(start) : '';

    document.getElementById('editorFile').textContent = 'stats/' + season + '.js';
    document.getElementById('editorNote').textContent = 'stats/' + season + '.js';
    return start;
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
      (game.bye ? 'Bye' : (game.home || game.neutral ? 'vs ' : 'at ') + game.opponent) +
      '  ·  ' + game.date));
    who.appendChild(name);
    head.appendChild(who);

    /* A bye is a week off. There is no score to enter, no booster that could
       have been on it and no stat line to type, so the card says so and
       stops -- a form offering all three would only invite a result for a
       game that was never played. */
    if (game.bye) {
      box.appendChild(head);
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

    /* The booster or wager that was on the game, written into the file for
       good. */
    var boosterRow = el('div', 'fb-row fb-row--wrap');
    boosterRow.appendChild(el('span', 'fb-eyebrow', 'Booster or wager'));
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
    var sides = EGE.wagerSides(entry.player, entry.game);
    Object.keys(EGE.WAGER_SIDES).forEach(function (key) {
      var option = el('option', null, 'Wager on ' + EGE.sideName(sides[EGE.WAGER_SIDES[key]]));
      option.value = key;
      pick.appendChild(option);
    });
    pick.value = held.booster || '';
    /* A wager is written with its line: the one it was taken at when it
       came in off Supabase (Pull in stickers), or, picked here by hand,
       the line on the game as it stands. */
    var lineNote = el('span', 'fb-meta');
    function showLine() {
      lineNote.textContent = EGE.isWagerKey(held.booster) && typeof held.line === 'number'
        ? 'at ' + EGE.lineText(held.line) : '';
    }
    pick.addEventListener('change', function () {
      held.booster = pick.value || null;
      if (EGE.isWagerKey(held.booster)) {
        var odds = EGE.gameLine(entry.player, entry.game);
        held.line = odds ? odds[EGE.WAGER_SIDES[held.booster]] : null;
      } else {
        held.line = null;
      }
      showLine();
    });
    showLine();
    boosterRow.appendChild(pick);
    boosterRow.appendChild(lineNote);
    box.appendChild(boosterRow);

    /* Hurt this week: he sits it out, the Discord post says DNP Injured, and
       while it is the week being played his page carries the injury report
       with how healthy he is. */
    var hurtRow = el('div', 'fb-row fb-row--wrap ege-hurtrow');
    var hurt = el('label', 'ege-statfield ege-otfield');
    hurt.appendChild(el('span', 'ege-statfield__label', 'Injured'));
    var hurtBox = el('input', 'ege-otfield__input');
    hurtBox.type = 'checkbox';
    hurtBox.checked = Boolean(held.injured);
    hurtBox.setAttribute('aria-label', player.name + ' is injured this week');
    hurt.appendChild(hurtBox);
    hurtRow.appendChild(hurt);

    var what = el('label', 'ege-statfield ege-hurtrow__what');
    what.appendChild(el('span', 'ege-statfield__label', 'Injury'));
    var whatInput = el('input', 'fb-input ege-statfield__input');
    whatInput.type = 'text';
    whatInput.placeholder = 'Bruised Shoulder';
    whatInput.value = held.injury || '';
    whatInput.addEventListener('input', function () { held.injury = whatInput.value; });
    what.appendChild(whatInput);
    hurtRow.appendChild(what);

    var health = numberField('Health %', held.health, function (value) { held.health = value; });
    hurtRow.appendChild(health);

    function showHurt() {
      what.hidden = !hurtBox.checked;
      health.hidden = !hurtBox.checked;
    }
    hurtBox.addEventListener('change', function () {
      held.injured = hurtBox.checked;
      showHurt();
    });
    showHurt();
    box.appendChild(hurtRow);

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
        line: typeof entry.game.line === 'number' ? entry.game.line : null,
        overtime: Boolean(entry.game.overtime),
        injured: Boolean(entry.game.injured),
        injury: entry.game.injury || '',
        health: typeof entry.game.health === 'number' ? entry.game.health : null,
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
        held[slug].line = stuck.line === null || stuck.line === undefined ? null : Number(stuck.line);
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

    /* As many times as it is wanted. A season that is already locked is not
       folded in a second time: EGE.valuesFor counts its purchases from where
       the season started while the rows behind them are still there, and from
       the locked numbers once they are cleared, so downloading again hands
       back the same file -- plus anything bought since. */
    lock.addEventListener('click', function () {
      var again = EGE.seasonLocked(EGE.currentSeason);
      lock.disabled = true;
      EGE.exports.ratingsFile(EGE.currentSeason).then(function (text) {
        EGE.exports.download('ratings.js', text);
        adminState.ratingsDownloaded = true;
        step('stepLock', true);
        clear.disabled = confirm.value.trim().toUpperCase() !== 'CLEAR';
        sayAdmin(again
          ? 'ratings.js downloaded again. ' + EGE.currentSeason + ' was already ' +
            'locked, so its purchases are counted once, not twice — the file ' +
            'matches the one committed, plus anything bought since.'
          : 'ratings.js downloaded. Put it in data/ and commit it before ' +
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
      EGE.wallet.publishedRows(),
      EGE.wallet.diamondsFor(EGE.auth.currentPlayer() && EGE.auth.currentPlayer().email),
      EGE.wallet.allDiamonds(),
      EGE.wallet.allDiamondAwards(EGE.currentSeason)
    ]).then(function (all) {
      adminState.credits = all[0];
      adminState.inventory = all[1];
      adminState.awards = all[2];
      weekState.published = all[5];
      /* Whether the diamond table is there at all is the admin's own balance
         answering: a missing table is an error there, where an empty list
         from allDiamonds could just mean nobody has any yet. */
      adminState.diamonds = all[6] === null ? null : all[7];
      adminState.diamondAwards = all[8];
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
      wireEveryone();
    }
    sayAdmin('', false);
    showAdminTab(adminTab());

    renderWebhooks();

    EGE.cardsAdmin.render();

    return refreshAdminView().then(function () {
      fillEditorWeeks();
      renderEditor();
    });
  }

  /* --- the admin page's tabs ---------------------------------------------

     One part of the page at a time, picked in the bar at the top and kept in
     the address (#admin/sim), so a reload or the back button comes back to
     the same one. Plain #admin is the weeks. Every panel says which tab it
     belongs to in data-admin-tab. */
  var ADMIN_TABS = ['weeks', 'accounts', 'cards', 'sim', 'season'];

  function adminTab() {
    var hash = window.location.hash.replace(/^#/, '');
    var tab = hash.indexOf('admin/') === 0 ? hash.slice(6) : '';
    return ADMIN_TABS.indexOf(tab) !== -1 ? tab : 'weeks';
  }

  function showAdminTab(tab) {
    Array.prototype.forEach.call(document.querySelectorAll('#adminTabs [data-tab]'), function (link) {
      var on = link.dataset.tab === tab;
      link.classList.toggle('is-active', on);
      if (on) { link.setAttribute('aria-current', 'page'); } else { link.removeAttribute('aria-current'); }
    });
    /* The first panel showing sits straight under the bar. */
    var first = true;
    Array.prototype.forEach.call(document.querySelectorAll('#adminContent [data-admin-tab]'), function (panel) {
      panel.hidden = panel.dataset.adminTab !== tab;
      panel.classList.toggle('is-tabfirst', !panel.hidden && first);
      if (!panel.hidden) { first = false; }
    });
    if (tab === 'sim') { EGE.nflSimAdmin.render(); }
  }

  /* --- the Discord channels ----------------------------------------------

     The two bots' webhooks, pasted in once. They are kept in Supabase where
     only an admin can read them, never in the site's files: the repository
     is public, and anybody with a webhook URL can post to its channel. A
     saved one is never put back into the box -- it says it is saved, with
     the last few characters to tell which it is. */
  var HOOK_FIELDS = { college: 'hookCollege', nfl: 'hookNfl' };
  var hooksWired = false;

  function renderWebhooks() {
    var note = document.getElementById('discordNote');
    if (!hooksWired) {
      hooksWired = true;
      Object.keys(HOOK_FIELDS).forEach(function (league) {
        var button = document.getElementById(HOOK_FIELDS[league] + 'Save');
        button.addEventListener('click', function () {
          var input = document.getElementById(HOOK_FIELDS[league]);
          button.disabled = true;
          EGE.wallet.saveWebhook(league, input.value).then(function (res) {
            button.disabled = false;
            if (res.ok) { input.value = ''; }
            sayAdmin(res.ok ? 'Saved the ' + LEAGUE_NAMES[league] + ' webhook.' : res.message, !res.ok);
            renderWebhooks();
          });
        });
      });
    }
    EGE.wallet.loadWebhooks().then(function (hooks) {
      Object.keys(HOOK_FIELDS).forEach(function (league) {
        var input = document.getElementById(HOOK_FIELDS[league]);
        input.placeholder = hooks[league]
          ? 'Saved (\u2026' + hooks[league].slice(-6) + '). Paste a new one to replace it.'
          : 'Not set. Paste the channel\u2019s webhook URL.';
      });
      var missing = Object.keys(HOOK_FIELDS).filter(function (league) { return !hooks[league]; });
      note.textContent = 'Publishing posts each league\u2019s week to its own channel: the NFL ' +
        'players to the NFL bot and the college players to the college bot. ' +
        (missing.length
          ? 'No ' + missing.map(function (league) { return LEAGUE_NAMES[league]; }).join(' or ') +
            ' webhook is saved, so that one goes through the post-week function, and the ' +
            'scheduled bot posts anything that did not land.'
          : 'Both webhooks are saved.');
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
      EGE.wallet.loadGameBoosters(EGE.currentSeason),
      EGE.wallet.diamondsFor(player.email)
    ]).then(function (all) {
      shopState.credits = all[0] === null ? EGE.shop.startingCredits : all[0];
      shopState.inventory = all[1];
      updateNavDiamonds(all[4]);
      renderInventory();
      refreshStackedPrices();
      refreshLevelPrices();
      refreshUpgrades();
      redrawRatings();
      refreshScoutMarks();
      updateNavCredits(shopState.credits);
    });
  }

  function buildCatalogue() {
    if (shopState.built) { return; }
    shopState.built = true;
    stackedCards = [];
    levelCards = [];

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
    EGE.wallet.diamondsFor(player.email).then(updateNavDiamonds);
  }

  /* Boosts land after a page may already have been drawn — the roster's
     overalls and the open player page both need redrawing. */
  function redrawRatings() {
    roster.innerHTML = '';
    renderRoster();

    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    if (player) { renderPlayer(player); }
    /* The teams carry records and overalls too. */
    if (hash === 'teams') { renderTeams(); }
    if (hash.indexOf('teams/') === 0) { renderTeam(hash.slice(6)); }
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
    document.getElementById('navTeams').classList.toggle('is-active', active === 'teams');
    document.getElementById('navShop').classList.toggle('is-active', active === 'shop');
    document.getElementById('navCards').classList.toggle('is-active', active === 'cards');
    document.getElementById('navAdmin').classList.toggle('is-active', active === 'admin');
    document.getElementById('navDiamonds').classList.toggle('is-active', active === 'diamonds');
  }

  function show(view) {
    viewHome.hidden   = view !== viewHome;
    viewShop.hidden   = view !== viewShop;
    viewCards.hidden  = view !== viewCards;
    viewPlayer.hidden = view !== viewPlayer;
    viewAdmin.hidden  = view !== viewAdmin;
    viewTeams.hidden  = view !== viewTeams;
    viewTeam.hidden   = view !== viewTeam;
    viewDiamonds.hidden = view !== viewDiamonds;
  }

  /* The page route() last drew, so it can tell going somewhere from being
     asked to draw the same page again. */
  var routed = null;

  function route() {
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    var moved = hash !== routed;
    routed = hash;

    /* Going anywhere else shuts the sticker drawer (Sam, 2026-10-20): it
       belongs to a game on the page being left. */
    if (moved) { closeDrawer(); }

    if (hash === 'teams') {
      renderTeams();
      show(viewTeams);
      setNav('teams');
      document.title = 'Teams \u2014 EGE Football';
    } else if (hash.indexOf('teams/') === 0) {
      show(viewTeam);
      setNav('teams');
      renderTeam(hash.slice(6));
    } else if (hash === 'shop') {
      renderShop();
      show(viewShop);
      setNav('shop');
      document.title = 'Shop \u2014 EGE Football';
    } else if (hash === 'cards' || hash.indexOf('cards/') === 0) {
      show(viewCards);
      EGE.cardsView.render(hash.slice(6) || null);
      setNav('cards');
      document.title = 'Cards \u2014 EGE Football';
    } else if (hash === 'diamonds') {
      show(viewDiamonds);
      EGE.diamondsView.render();
      setNav('diamonds');
      document.title = 'Diamonds \u2014 EGE Football';
    } else if (hash === 'admin' || hash.indexOf('admin/') === 0) {
      renderAdminView();
      show(viewAdmin);
      setNav('admin');
      document.title = 'Admin \u2014 EGE Football';
    } else if (player) {
      /* Shown first, then drawn. The season totals and the trophy shelves
         are laid out by measuring the page, and a hidden page measures as
         nothing -- drawn the other way round, a long number spilled out of
         its cell until a refresh redrew it. */
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

    /* After the jump to the top, so a card's game button lands on its game. */
    if (player) { spotlightGame(player); }
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

  /* Writes into one of the page's message slots. With `problemsOnly` only
     errors show: a buy or a switch that went through needs no banner to
     say so, and anything else just clears it (Sam, 2026-10-16). */
  function reporter(id, problemsOnly) {
    var node = document.getElementById(id);
    return function (text, isError) {
      var shown = problemsOnly && !isError ? '' : text || '';
      node.textContent = shown;
      node.hidden = !shown;
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

  /* The admin's link in the nav and, in the portal, the client viewer
     mode switch: shown to a real admin whichever way it is set, so it can
     always be switched back. With it on the page is drawn as a player's,
     so the Admin link goes with everything else. */
  var viewerMode = document.getElementById('viewerMode');

  function showAdminBits() {
    var real = EGE.auth.currentPlayer() && EGE.wallet.realAdmin();
    document.getElementById('navAdmin').hidden = !EGE.wallet.admin();
    document.getElementById('viewerModeRow').hidden = !real;
    viewerMode.checked = Boolean(real && EGE.wallet.viewerMode());
    document.getElementById('viewerModeNote').textContent = viewerMode.checked
      ? 'On: you are seeing the site the way a player does.'
      : 'See the site the way a player does.';
  }

  viewerMode.addEventListener('change', function () {
    EGE.wallet.setViewerMode(viewerMode.checked);
    showAdminBits();
    /* Whatever is on screen, drawn again for whoever it is now for. */
    route();
  });

  document.getElementById('shopLoginBtn').addEventListener('click', function () {
    openLogin();
  });

  document.getElementById('cardsLoginBtn').addEventListener('click', function () {
    openLogin();
  });

  document.getElementById('diamondsLoginBtn').addEventListener('click', function () {
    openLogin();
  });

  /* The Cards tab spends diamonds, swaps credits for them, and a library
     set can pay out a booster, so the balances in the nav and the shop's
     inventory -- which the sticker drawer reads -- are brought up to date
     when it says so. */
  document.addEventListener('ege:wallet', function (event) {
    var credits = event.detail && event.detail.credits;
    var diamonds = event.detail && event.detail.diamonds;
    if (typeof credits === 'number') { updateNavCredits(credits); }
    if (typeof diamonds === 'number') { updateNavDiamonds(diamonds); }
    refreshShop();
  });

  function showSignedOutNav() {
    loginBtn.className = 'fb-btn fb-btn--inverse';
    loginBtn.textContent = 'Log In';
    loginBtn.removeAttribute('title');
    loginBtn.setAttribute('aria-label', 'Open the player portal');
    document.getElementById('navShop').hidden = true;
    document.getElementById('navCards').hidden = true;
    document.getElementById('navAdmin').hidden = true;
    document.getElementById('viewerModeRow').hidden = true;
    document.getElementById('navCredits').hidden = true;
    document.getElementById('navDiamonds').hidden = true;
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
    document.getElementById('navCards').hidden = false;

    document.getElementById('navCredits').hidden = false;
    document.getElementById('navDiamonds').hidden = false;
    updateNavCredits(null);
    updateNavDiamonds(null);
    EGE.wallet.creditsFor(player.email).then(updateNavCredits);
    EGE.wallet.diamondsFor(player.email).then(updateNavDiamonds);
  }

  /* The nav shows what is really in the account, once Supabase answers. */
  function updateNavCredits(credits) {
    var box = document.getElementById('navCredits');
    var shown = credits === null || credits === undefined ? EGE.shop.startingCredits : credits;
    document.getElementById('navCreditsValue').textContent = shown;
    box.title = shown + ' credits to spend in the shop';
  }

  /* Diamonds beside them, for the Cards tab. A balance that could not be
     read shows a dash rather than a zero nobody has. It opens the diamonds
     page, which lists where they came from. */
  function updateNavDiamonds(diamonds) {
    var box = document.getElementById('navDiamonds');
    var known = typeof diamonds === 'number' && !isNaN(diamonds);
    document.getElementById('navDiamondsValue').textContent = known ? diamonds : '\u2014';
    box.title = known ? diamonds + ' diamonds: see where they came from' : 'Diamonds: see where they came from';
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
    document.getElementById('ratingsTop').classList.remove('is-waiting');
    document.getElementById('playerOverall').classList.remove('is-waiting');
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
        .then(function () {
          showAdminBits();
          /* Anything the season owes this player is paid on the way in, so a
             result posted since their last visit is already credits and
             diamonds by the time they reach the shop. */
          return payWhatIsOwed(player);
        })
        .then(function () {
          EGE.cardsView.refreshBadge();
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
      /* Nobody is an admin once they have signed out, so nothing only an
         admin sees stays on the page behind them. */
      EGE.wallet.refreshAdmin(null);
      showSignedOutNav();
      showPanel(panelAuth);
      loadAccount();
      shopState.player = null;
      shopState.inventory = [];
      shopState.credits = EGE.shop.startingCredits;
    }
    route();          /* the shop appears and disappears with the session */
  });

  /* Everything the live season owes the signed-in player and has not paid:
     touchdown credits, the games' diamonds, and what their Player Cards
     earn on those games. Each is keyed on what earned it, so running it
     again pays nothing twice. Nothing is said: the balances show it. */
  function payWhatIsOwed(player) {
    /* And a booster on a game he is now known to miss goes back in his
       drawer before anything else (see returnInjuredBoosters). */
    return EGE.wallet.returnInjuredBoosters(player, EGE.currentSeason).then(function (back) {
      if (back.returned) { refreshShop().then(route); }
      return Promise.all([
        EGE.wallet.syncAwards(player, EGE.currentSeason),
        EGE.wallet.syncDiamonds(player, EGE.currentSeason),
        EGE.cardStore.syncPlayerCards(player, EGE.currentSeason)
      ]);
    }).then(function (all) {
      var credits = (all[0] && all[0].paid) || 0;
      var diamonds = ((all[1] && all[1].paid) || 0) + ((all[2] && all[2].paid) || 0);
      return { credits: credits, diamonds: diamonds };
    });
  }

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
  document.getElementById('ratingsTop').classList.add('is-waiting');
  document.getElementById('playerOverall').classList.add('is-waiting');

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
     the page left where you had it.

     And while the page is on screen it checks in by itself, so nobody has
     to keep reloading: every twenty seconds on a Cards page (trades, the
     balance, the shop -- EGE.cardsView.poll), and once a minute anywhere for
     a week gone out, a rating bought, the balances in the nav and the trade
     count. A week out pays the signed-in player what it owes them there and
     then -- touchdown credits, game diamonds and their Player Cards' share
     -- rather than on the next load. Nothing is checked while the page is
     put away, and a redraw waits while somebody is in the middle of
     something (pageBusy). */
  var AWAY_BEFORE_REFRESH = 30 * 1000;
  var TICK = 20 * 1000;
  var LIVE_EVERY = 3;                /* ticks between looks at the weeks: a minute */
  var hiddenSince = null;
  var refreshing = false;
  var redrawOwed = false;
  var ticks = 0;
  var touched = 0;

  /* Keys in order, so the same weeks and purchases read the same whichever
     order Postgres hands the rows back in -- checked every minute now, a
     reshuffle must not pass for a change. */
  function liveState() {
    return JSON.stringify([EGE.publishedWeeks, EGE.appliedBoosts], function (key, value) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) { return value; }
      return Object.keys(value).sort().reduce(function (out, k) { out[k] = value[k]; return out; }, {});
    });
  }

  function onCards() { return /^#cards(\/|$)/.test(window.location.hash); }

  ['pointerdown', 'keydown'].forEach(function (type) {
    document.addEventListener(type, function () { touched = Date.now(); }, true);
  });

  /* Something a redraw would pull out from under somebody: the portal or the
     card overlay open, a sticker picked up or its drawer out, a box being
     typed in, or a tap a moment ago that may still be waiting on its answer. */
  function pageBusy() {
    if (Date.now() - touched < 4000) { return true; }
    if (armedSticker || drawer) { return true; }
    if (!document.getElementById('loginModal').hidden) { return true; }
    if (document.documentElement.classList.contains('ege-noscroll')) { return true; }
    var a = document.activeElement;
    return Boolean(a && (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' ||
      (a.tagName === 'INPUT' && !/^(radio|checkbox|button|submit)$/.test(a.type))));
  }

  /* `background` is the minute's check, made while somebody may be reading:
     then a redraw waits until they are not in the middle of anything. */
  function refreshLive(background) {
    if (refreshing) { return; }
    refreshing = true;
    var before = liveState();
    Promise.all([
      EGE.wallet.loadPublishedWeeks(),
      EGE.wallet.loadBoosts()
    ]).then(function () {
      var moved = liveState() !== before;
      if (moved) { redrawOwed = true; }
      /* A week out since is credits and diamonds owed: paid now, before the
         balances below are read. */
      var player = EGE.auth.currentPlayer();
      return moved && player ? payWhatIsOwed(player) : null;
    }).then(function () {
      if (redrawOwed && !(background && pageBusy())) {
        redrawOwed = false;
        redrawRatings();
        refreshScoutMarks();
        /* A week out since is a week of new cards in the packs, and new
           Player Card earnings -- and new rows on the diamonds page. */
        if (onCards()) { EGE.cardsView.poll(true); }
        if (window.location.hash === '#diamonds') { EGE.diamondsView.render(); }
      }
      updateNavCreditsFromServer();
      /* An offer may have come in while the page was put away. On a Cards
         page the poll keeps the count itself. */
      if (!onCards()) { EGE.cardsView.refreshBadge(); }
    }).then(function () { refreshing = false; }, function () { refreshing = false; });
  }

  function tick() {
    if (document.hidden || navigator.onLine === false) { return; }
    ticks += 1;
    if (onCards()) { EGE.cardsView.poll(); }
    if (ticks % LIVE_EVERY === 0) { refreshLive(true); }
  }

  window.setInterval(tick, TICK);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenSince = Date.now(); return; }
    if (hiddenSince !== null && Date.now() - hiddenSince >= AWAY_BEFORE_REFRESH) {
      refreshLive();
      if (onCards()) { EGE.cardsView.poll(); }
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
