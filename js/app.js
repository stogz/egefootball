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

  function seasonLabel(year) {
    var s = EGE.seasons.filter(function (x) { return x.year === year; })[0];
    return s ? s.year + ' · ' + s.class + ' · ' + s.level : String(year);
  }

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

  /* Four things, and the sketch has no room for a fifth: the name, the school
     with its mark, the way in, and the overall in a box on the right.

     No headshot, no league line, no position or season chip. They were all on
     here and they are all one tap away on the player's own page -- what a
     roster is for is telling six people apart and putting them in order, and
     a name and a number do that on their own. */
  function buildCard(player) {
    var card = el('a', 'ege-card');
    card.href = '#' + player.slug;

    var text = el('div', 'ege-card__text');
    text.appendChild(el('h3', 'ege-card__name', player.name));
    text.appendChild(schoolLine(player));
    text.appendChild(el('span', 'ege-card__go', 'View player →'));
    card.appendChild(text);

    var box = overallBox(EGE.overallFor(player), 'ege-ovrbox--card');
    if (box) { card.appendChild(box); }

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

  /* --- player view ------------------------------------------------------ */

  function renderPlayer(player, keepSeason) {
    var team = EGE.teamFor(player);
    if (!keepSeason) { viewSeason = null; }
    var season = shownSeason();

    document.getElementById('playerStripLabel').textContent = seasonLabel(season);

    var photo = document.getElementById('playerPhoto');
    photo.src = player.headshot;
    photo.alt = player.name;

    var school = document.getElementById('playerSchool');
    school.innerHTML = '';
    school.appendChild(schoolLine(player, 'ege-school--lg'));

    document.getElementById('playerName').textContent = player.name;
    document.getElementById('playerSeason').textContent = seasonLabel(season);
    document.getElementById('playerPosition').textContent = player.position || TBD;
    document.getElementById('playerSchoolRow').textContent = team ? team.school : TBD;
    document.getElementById('playerLeague').textContent = (team && team.league) || TBD;

    var record = EGE.recordFor(player, season);
    var played = EGE.gamesPlayed(player, season).length;
    document.getElementById('playerRecord').textContent = played ? record.text : '\u2014';

    var tags = document.getElementById('playerTags');
    tags.innerHTML = '';
    if (player.position) {
      tags.appendChild(el('span', 'fb-tag fb-tag--ink', player.position));
    } else {
      tags.appendChild(el('span', 'fb-tag fb-tag--outline', 'POS ' + TBD));
    }
    var year = (EGE.seasons.filter(function (s) { return s.year === season; })[0] || {});
    if (year.class) { tags.appendChild(el('span', 'fb-tag fb-tag--gold', year.class)); }

    var overall = EGE.overallFor(player);
    /* Not `overallBox`: that is the function above, and a local of the same
       name shadows it three lines later. */
    var overallWrap = document.getElementById('playerOverall');
    overallWrap.hidden = overall === null;

    /* The same box the roster card carries, at the size a page can afford. */
    var slot = document.getElementById('playerOverallBox');
    slot.innerHTML = '';
    var box = overallBox(overall, 'ege-ovrbox--page');
    if (box) { slot.appendChild(box); }

    renderOverallClimb(player, overall);

    /* The line under the box says where the season is up to, which is a more
       useful thing than a promise that stats are coming. */
    var games = EGE.gamesFor(player, season);
    var done = EGE.gamesPlayed(player, season).length;
    document.getElementById('playerFootNote').textContent = !games.length
      ? 'No schedule for ' + season + ' yet.'
      : (done
          ? done + ' of ' + games.length + ' games played. ' +
            (window.matchMedia && window.matchMedia('(hover: none)').matches ? 'Tap' : 'Click') +
            ' a week on the schedule for the stat line.'
          : 'None of the ' + games.length + ' games have been posted yet.');

    fillPlayerSeasons(player);
    renderSchedule(player);
    renderGameLog(player);
    renderRatings(player);
  }

  /* How far the shop has carried him. The base numbers in data/ratings.js are
     where the season started; the difference is what he has bought since, and
     it goes beside the overall as an arrow rather than as another panel
     nobody scrolls to. */
  function renderOverallClimb(player, overall) {
    var climb = document.getElementById('playerOverallClimb');
    var boosts = EGE.boostsFor(player);

    if (overall === null || !Object.keys(boosts).length) {
      climb.hidden = true;
      return;
    }

    var was = EGE.exports.baseOverall(player);
    var moved = overall - was;

    climb.hidden = !moved;
    if (!moved) { return; }

    climb.textContent = (moved > 0 ? '\u25b2 +' : '\u25bc ') + moved;
    climb.className = 'ege-ovr__climb' + (moved > 0 ? '' : ' ege-ovr__climb--down');
    climb.title = 'Started the season at ' + was + '. ' +
      (moved > 0 ? 'Up ' + moved : 'Down ' + Math.abs(moved)) + ' from the shop.';
  }

  /* The seasons this player has a schedule for. One of them and the picker
     stays out of the way. */
  function fillPlayerSeasons(player) {
    var pick = document.getElementById('playerSeasonPick');
    var seasons = EGE.seasonsPlayed().filter(function (year) {
      return EGE.gamesFor(player, year).length;
    });

    pick.innerHTML = '';
    seasons.forEach(function (year) {
      var option = el('option', null, String(year));
      option.value = year;
      pick.appendChild(option);
    });

    var showing = seasons.indexOf(shownSeason()) === -1 ? seasons[seasons.length - 1] : shownSeason();
    if (showing) { pick.value = showing; viewSeason = showing; }
    pick.hidden = seasons.length < 2;
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

  /* Which season the player page is showing. It follows the live season until
     somebody picks another one, and resets when a different player is opened
     so nobody lands on a year that player never had. */
  var viewSeason = null;

  function shownSeason() {
    return viewSeason || EGE.currentSeason;
  }

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

  function stickerEl(itemKey, size, seed) {
    var look = STICKER_LOOK[itemKey];
    if (!look) { return null; }

    var sticker = el('span', 'ege-sticker ege-sticker--' + look.modifier);
    sticker.style.setProperty('--sticker-size', (size || 40) + 'px');
    sticker.style.setProperty('--tilt', scatter(seed == null ? itemKey : seed).tilt + 'deg');

    var face = el('span', 'ege-sticker__face');
    face.appendChild(el('span', 'ege-sticker__text', look.label));
    sticker.appendChild(face);

    return sticker;
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
      /* Bigger than the row on purpose, sitting over it, and nudged a few
         pixels up or down so it overlaps the row above or below. */
      var seed = stuck.id;
      var placing = scatter(seed);
      var sticker = stickerEl(stuck.item_key, 62, seed);
      applied.style.setProperty('--sticker-size', '62px');
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

    /* A booster goes on any game that has not been published yet.

       Not "any game with no result in it" — the season is written up front,
       so every game has a result from day one and that would mean nobody
       could ever use a booster. Holding a week back is exactly the window in
       which a player puts a sticker on it and the admin writes it into the
       file before putting the week out. */
    if (mine && !played) {
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
                                  EGE.currentSeason, game.week)
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

  function scheduleRow(game) {
    var row = el('tr');
    var played = EGE.isFinal(game);

    var week = el('td', 'ege-schedule__week');
    /* A played game opens to show what he did in it. */
    if (played) {
      var toggle = el('button', 'ege-schedule__open', String(game.week));
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.title = 'Show the stat line for week ' + game.week;
      week.appendChild(toggle);
      row.dataset.week = game.week;
    } else {
      week.textContent = game.week;
    }
    row.appendChild(week);

    row.appendChild(el('td', null, gameDate(game)));
    row.appendChild(el('td', 'ege-schedule__time', game.kickoff || '—'));

    var opponent = el('td', 'ege-schedule__opponent');
    opponent.appendChild(el('span', 'ege-schedule__side', game.home ? 'vs' : 'at'));
    opponent.appendChild(el('span', 'fb-name', game.opponent));
    if (game.conference) {
      var mark = el('abbr', 'ege-schedule__conf', '*');
      mark.title = 'Conference game';
      opponent.appendChild(mark);
    }
    if (showScouts && game.scouts) { opponent.appendChild(scoutMark()); }
    row.appendChild(opponent);

    var result = el('td', 'num');
    if (played) {
      var won = game.result.teamScore > game.result.opponentScore;
      result.appendChild(el('span', 'fb-tag fb-tag--num ' + (won ? 'fb-tag--sage' : 'fb-tag--clay'),
        (won ? 'W ' : 'L ') + game.result.teamScore + '–' + game.result.opponentScore));
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
      tag.title = earned + ' credits for the touchdowns in this game';
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

  /* The row that drops open under a played game: that game's line under the
     columns his position is read in. */
  function statRow(player, game) {
    var row = el('tr', 'ege-statrow');
    row.hidden = true;
    row.dataset.forWeek = game.week;

    var cell = el('td');
    cell.colSpan = showBoosters ? 7 : 6;

    var stats = EGE.statline.complete(player.position, game.stats);
    var box = el('div', 'ege-statrow__box');

    /* The kickoff has no column of its own on a narrow screen, so it rides
       here instead of being lost. */
    if (game.kickoff) {
      box.appendChild(el('p', 'fb-meta ege-statrow__when',
        gameDate(game) + ', ' + game.kickoff + (game.home ? ' \u00b7 home' : ' \u00b7 away')));
    }

    if (!game.stats) {
      box.appendChild(el('p', 'fb-meta', 'No stat line for this one.'));
    } else {
      EGE.statline.lineFor(player.position).forEach(function (column) {
        var item = el('div', 'ege-statrow__stat');
        var label = el('span', 'ege-statrow__label', column.label);
        label.title = column.title;
        item.appendChild(label);
        item.appendChild(el('span', 'ege-statrow__value', column.text(stats)));
        box.appendChild(item);
      });
    }

    var booster = EGE.boosterOn(player, game);
    if (booster && canSeeStickers(player)) {
      var note = el('p', 'fb-meta ege-statrow__note',
        booster.name + ' was on this game' +
        (booster.multiplier ? ' — ' + booster.multiplier + 'x' : '') + '.');
      box.appendChild(note);
    }

    cell.appendChild(box);
    row.appendChild(cell);
    return row;
  }

  function renderSchedule(player) {
    var panel = document.getElementById('schedulePanel');
    var body = document.getElementById('scheduleBody');
    var season = shownSeason();
    var games = EGE.gamesFor(player, season);

    showScouts = canSeeScouts(player);
    showBoosters = canSeeStickers(player);
    schedulePlayer = player;

    document.getElementById('scheduleBoosterHead').hidden = !showBoosters;

    /* Every row is about to be replaced, so whatever was armed is gone. */
    disarmSticker();

    body.innerHTML = '';
    panel.hidden = false;
    document.getElementById('scheduleTableWrap').hidden = !games.length;
    document.getElementById('scheduleEmpty').hidden = Boolean(games.length);

    if (!games.length) {
      document.getElementById('scheduleNote').textContent = season;
      document.getElementById('scheduleLegend').textContent = '';
      return;
    }

    games.forEach(function (game) {
      body.appendChild(scheduleRow(game));
      if (EGE.isFinal(game)) { body.appendChild(statRow(player, game)); }
    });

    var played = EGE.gamesPlayed(player, season).length;
    document.getElementById('scheduleNote').textContent = played
      ? season + ' · ' + games.length + ' games · ' + EGE.recordFor(player, season).text
      : season + ' · ' + games.length + ' games · none played yet';

    var conference = games.filter(function (game) { return game.conference; }).length;
    var legend = conference ? '* conference game (' + conference + ' of ' + games.length + ')' : '';
    if (showScouts) {
      var scouted = EGE.scoutedGames(player, season).length;
      legend += (legend ? ' · ' : '') + 'Intel: scouts at ' + scouted + ' games this season';
    }
    if (played) {
      var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
      legend += (legend ? ' · ' : '') +
        (touch ? 'Tap' : 'Click') + ' a week to see the stat line';
    }
    document.getElementById('scheduleLegend').textContent = legend;
  }

  /* One listener on the table rather than one per row, so rows can be redrawn
     without leaving handlers behind. */
  document.getElementById('scheduleBody').addEventListener('click', function (event) {
    var button = event.target.closest('.ege-schedule__open');
    if (!button) { return; }

    var row = button.closest('tr');
    var stats = row.nextElementSibling;
    if (!stats || !stats.classList.contains('ege-statrow')) { return; }

    var open = stats.hidden;
    stats.hidden = !open;
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    row.classList.toggle('ege-schedule__row--open', open);
  });

  /* --- the game log ------------------------------------------------------- */

  /* Every game played, under the columns this position is read in. The
     columns come from data/statline.js, so this table and the Discord post
     are never two different opinions about what a stat line is. */
  function renderGameLog(player) {
    var panel = document.getElementById('gameLogPanel');
    var season = shownSeason();
    var played = EGE.gamesPlayed(player, season);

    panel.hidden = !played.length;
    if (!played.length) { return; }

    var columns = EGE.statline.lineFor(player.position);
    var head = document.getElementById('gameLogHead');
    var body = document.getElementById('gameLogBody');
    var foot = document.getElementById('gameLogTotals');
    head.innerHTML = '';
    body.innerHTML = '';
    foot.innerHTML = '';

    head.appendChild(el('th', null, 'Wk'));
    head.appendChild(el('th', null, 'Opponent'));
    head.appendChild(el('th', null, 'Result'));
    columns.forEach(function (column) {
      var th = el('th', 'num', column.label);
      th.title = column.title;
      head.appendChild(th);
    });

    var boosted = 0;

    played.forEach(function (game) {
      var row = el('tr');
      row.appendChild(el('td', 'ege-schedule__week', game.week));

      var opponent = el('td', 'ege-gamelog__opponent');
      opponent.appendChild(el('span', 'ege-schedule__side', game.home ? 'vs' : 'at'));
      opponent.appendChild(el('span', 'fb-name', game.opponent));

      /* A booster is the player's own business, and an admin's. It shows here
         under the same rule the stickers on the schedule follow. */
      var booster = EGE.boosterOn(player, game);
      if (booster && canSeeStickers(player)) {
        boosted += 1;
        var mark = el('abbr', 'ege-gamelog__boost', booster.multiplier + 'x');
        mark.title = booster.name + ' was on this game';
        opponent.appendChild(mark);
      }
      row.appendChild(opponent);

      var won = game.result.teamScore > game.result.opponentScore;
      var result = el('td', 'num');
      result.appendChild(el('span', 'fb-tag fb-tag--num ' + (won ? 'fb-tag--sage' : 'fb-tag--clay'),
        (won ? 'W ' : 'L ') + game.result.teamScore + '–' + game.result.opponentScore));
      row.appendChild(result);

      var stats = EGE.statline.complete(player.position, game.stats) || {};
      columns.forEach(function (column) {
        row.appendChild(el('td', 'num', column.text(stats)));
      });
      body.appendChild(row);
    });

    /* The totals row works each column out the way that column adds up: a
       long is the longest, and a rating is worked out again from the season's
       numbers rather than averaged across games. */
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

    var record = EGE.recordFor(player, season);
    document.getElementById('gameLogNote').textContent =
      played.length + (played.length === 1 ? ' game' : ' games') + ' · ' + record.text;

    document.getElementById('gameLogLegend').textContent = boosted
      ? 'A multiplier beside an opponent is a booster that was on that game — only you and an admin see it.'
      : 'Hover a column heading for what it stands for.';
  }

  document.getElementById('playerSeasonPick').addEventListener('change', function (event) {
    viewSeason = Number(event.target.value);
    if (schedulePlayer) { renderPlayer(schedulePlayer, true); }
  });

  /* --- ratings ---------------------------------------------------------- */

  var ratingsPanel = document.getElementById('ratingsPanel');

  function buildGroup(group) {
    var box = el('div', 'ege-group');

    var head = el('div', 'ege-group__head');
    head.appendChild(el('span', 'ege-group__label', group.label));
    head.appendChild(el('span', 'ege-group__score', group.rating));
    box.appendChild(head);

    group.attributes.forEach(function (attr) {
      var row = el('div', 'ege-attr');
      row.appendChild(el('span', 'ege-attr__label', attr.label));

      var meter = el('div', 'fb-meter');
      var fill = el('div', 'fb-meter__fill' + (attr.value >= 80 ? '' : ' fb-meter__fill--alt'));
      fill.style.width = Math.max(0, Math.min(100, attr.value)) + '%';
      meter.appendChild(fill);
      row.appendChild(meter);

      row.appendChild(el('span', 'ege-attr__value', attr.value));
      box.appendChild(row);
    });

    return box;
  }

  function renderRatings(player) {
    var ratings = EGE.ratingsFor(player);
    var holder = document.getElementById('ratingsGroups');
    holder.innerHTML = '';

    if (!ratings) { ratingsPanel.hidden = true; return; }

    document.getElementById('ratingsOverall').textContent =
      ratings.overall === null ? '—' : ratings.overall;

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

  function creditTag(credits) {
    return el('span', 'fb-tag fb-tag--num fb-tag--gold', credits + ' cr');
  }

  function targetLabel(key) {
    var found = EGE.ratingGroups
      .reduce(function (all, group) { return all.concat(group.attributes); }, [])
      .filter(function (attr) { return attr.key === key; })[0];
    return found ? found.label : key;
  }

  /* --- the catalogue ----------------------------------------------------- */

  function buildShopItem(item) {
    var card = el('div', 'ege-item');

    var head = el('div', 'ege-item__head');
    head.appendChild(el('h4', 'ege-item__name', EGE.itemName(item, shopState.player)));
    head.appendChild(creditTag(item.credits));
    card.appendChild(head);

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
    }

    if (item.note) { card.appendChild(el('span', 'fb-tag fb-tag--outline', item.note)); }
    if (item.description) { card.appendChild(el('p', 'ege-item__text', item.description)); }

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
      buy.textContent = '+' + points + '  \u00b7  ' + price;
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
    var state = isUpgrade
      ? '+' + quantity
      : (lapsed ? 'Expired' : (row.active ? 'In effect' : (row.consumable ? 'Unused' : 'Off')));

    var head = el('div', 'ege-item__head');
    head.appendChild(el('h4', 'ege-item__name',
      row.item_name + (!isUpgrade && quantity > 1 ? ' \u00d7' + quantity : '')));
    head.appendChild(el('span', 'fb-tag fb-tag--num ' +
      (live ? 'fb-tag--sage' : (lapsed ? 'fb-tag--clay' : 'fb-tag--outline')), state));
    card.appendChild(head);

    if (typeof row.season === 'number') {
      card.appendChild(el('p', 'ege-item__text', lapsed
        ? 'Bought for the ' + row.season + ' season, which is over.'
        : 'Good for the ' + row.season + ' season only.'));
    }

    if (isUpgrade) {
      card.appendChild(el('p', 'ege-item__text',
        (row.credits || 0) + ' credits spent, all of it in the rating.'));
    } else if (row.effects && Object.keys(row.effects).length) {
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
    } else if (!lapsed) {
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
      if (!row.active || EGE.wallet.lapsed(row) || !row.effects) { return; }
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

  function renderInventory() {
    var holder = document.getElementById('inventoryItems');
    var applied = document.getElementById('inventoryApplied');
    holder.innerHTML = '';
    applied.innerHTML = '';

    document.getElementById('shopBalance').textContent = shopState.credits;
    document.getElementById('inventoryEmpty').hidden = shopState.inventory.length > 0;

    var summary = buildBoostSummary(boostSummary(shopState.inventory));
    if (summary) { applied.appendChild(summary); }

    shopState.inventory.forEach(function (row) {
      holder.appendChild(inventoryCard(row, {
        admin: false,
        report: sayShop,
        refresh: refreshShop
      }));
    });
  }

  /* --- admin ------------------------------------------------------------- */

  var sayAdmin = reporter('adminMessage');
  var adminState = { credits: [], inventory: [], awards: [], ratingsDownloaded: false };

  function isAdmin() { return EGE.wallet.admin(); }

  /* One account: what it holds, what it has been paid, and the two things an
     admin does to it by hand — set a balance, or hand something over. */
  function adminAccount(player, credits, rows, awards) {
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

    /* An award off the earnings table. It goes through the same ledger the
       touchdowns do, so the season log has a line for it rather than a
       balance that moved for no recorded reason. */
    var awarder = el('div', 'fb-row fb-row--wrap');
    var reason = el('select', 'fb-select ege-account__award');
    EGE.shop.earnings.forEach(function (row) {
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
      EGE.wallet.awardCredits(player.email, parts[0], parts[1]).then(function (res) {
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

    var earned = awards.reduce(function (sum, row) { return sum + row.credits; }, 0);
    if (earned) {
      box.appendChild(el('p', 'fb-meta',
        'Earned ' + earned + ' credits this season, over ' + awards.length +
        (awards.length === 1 ? ' award.' : ' awards.')));
    }

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
      var paid = adminState.awards.filter(function (a) {
        return player.email && a.email &&
               a.email.toLowerCase() === player.email.toLowerCase();
      });
      holder.appendChild(adminAccount(player, row ? row.credits : EGE.shop.startingCredits,
                                     owned, paid));
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

    var totals = { all: 0, touchdowns: 0, waiting: 0 };

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
         for a week nobody has been paid for yet. */
      var touchdowns = EGE.gamesPlayed(player, EGE.currentSeason).reduce(function (sum, game) {
        return sum + EGE.economy.touchdownsIn(game.stats);
      }, 0);

      var all = sums.td + sums.offseason + sums.manual;
      var owed = touchdowns * EGE.economy.tdRateFor(player.position);
      totals.all += all;
      totals.touchdowns += touchdowns;
      if (!player.email) { totals.waiting += owed; }

      var tr = el('tr');
      if (!player.email) { tr.className = 'ege-awards__row--noaccount'; }

      var name = el('td');
      name.appendChild(el('strong', null, player.name));
      name.appendChild(el('span', 'fb-meta', player.email
        ? player.position + '  ·  ' + EGE.economy.tdRateFor(player.position) + ' a TD'
        : player.position + '  ·  no sign-in yet'));
      tr.appendChild(name);
      tr.appendChild(el('td', 'num', String(touchdowns)));

      if (player.email) {
        [sums.td, sums.offseason, sums.manual].forEach(function (value) {
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
    document.getElementById('awardsFoot').textContent = totals.touchdowns
      ? totals.touchdowns + ' touchdowns, ' + totals.all + ' credits paid out' +
        (totals.waiting
          ? ', and ' + totals.waiting + ' waiting on an account to be paid into.'
          : '.')
      : 'No touchdowns posted yet. Credits appear here as results go in — ' +
        EGE.economy.TD_CREDITS.RB + ' a touchdown for a back or a tight end, ' +
        EGE.economy.TD_CREDITS.QB + ' for a quarterback.';
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
      var games = EGE.gamesInWeek(week, season);
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
     stats }, held here until the file is written.

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
      var games = EGE.gamesInWeek(week, season);
      var filled = games.filter(function (entry) { return EGE.hasResult(entry.game); }).length;
      var option = el('option', null, 'Week ' + week + '  ·  ' + filled + ' of ' +
                      games.length + ' filled in');
      option.value = week;
      select.appendChild(option);
    });

    /* Open on the first week that still needs numbers. */
    var next = weeks.filter(function (week) {
      return EGE.gamesInWeek(week, season).some(function (entry) {
        return !EGE.hasResult(entry.game);
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
      (game.home ? 'vs ' : 'at ') + game.opponent + '  ·  ' + game.date));
    who.appendChild(name);
    head.appendChild(who);

    var score = el('div', 'fb-row');
    score.appendChild(numberField('Us', held.result ? held.result.teamScore : null, function (value) {
      held.result = held.result || { teamScore: null, opponentScore: null };
      held.result.teamScore = value;
    }));
    score.appendChild(numberField('Them', held.result ? held.result.opponentScore : null, function (value) {
      held.result = held.result || { teamScore: null, opponentScore: null };
      held.result.opponentScore = value;
    }));
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
        stats: entry.game.stats ? Object.assign({}, entry.game.stats) : null
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

    /* Two locks on the clear: the ratings file has to have been built in this
       sitting, and the word has to be typed. Everything it deletes is only
       recoverable from that file. */
    confirm.addEventListener('input', function () {
      clear.disabled = confirm.value.trim().toUpperCase() !== 'CLEAR';
    });

    clear.addEventListener('click', function () {
      if (!adminState.ratingsDownloaded) {
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
      refreshUpgrades();
      redrawRatings();
      refreshScoutMarks();
      updateNavCredits(shopState.credits);
    });
  }

  function buildCatalogue() {
    if (shopState.built) { return; }
    shopState.built = true;

    var earnings = document.getElementById('shopEarnings');
    EGE.shop.earnings.forEach(function (row) {
      var tr = el('tr');
      tr.appendChild(el('td', null, row.label));
      var credits = el('td', 'num');
      credits.appendChild(el('strong', null, '+' + row.credits));
      tr.appendChild(credits);
      earnings.appendChild(tr);
    });

    var sections = document.getElementById('shopSections');
    EGE.shop.sections.forEach(function (section) {
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
    if (player) { renderPlayer(player, true); }
  }

  /* The inventory arrives after a page may already have been drawn, so redraw
     the schedule if what it shows has changed. */
  function refreshScoutMarks() {
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    if (!player) { return; }
    if (canSeeScouts(player) !== showScouts) { renderSchedule(player); }
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

  function route() {
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;

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
      renderPlayer(player);
      show(viewPlayer);
      setNav('players');
      document.title = player.name;
    } else {
      show(viewHome);
      setNav('players');
      document.title = 'EGE Football';
    }
    window.scrollTo(0, 0);
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

  function fillPlayerSelect() {
    EGE.players.forEach(function (player) {
      var opt = el('option', null, player.name + (player.email ? '' : ' \u2014 no account yet'));
      opt.value = player.slug;
      opt.disabled = !player.email;
      loginPlayer.appendChild(opt);
    });
    var first = EGE.playersWithAccounts()[0];
    if (first) { loginPlayer.value = first.slug; }
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
  });

  EGE.auth.onChange(function (player) {
    if (player) {
      /* The wallet loads on sign-in, not on reaching the shop: a player page
         needs the inventory too, to know whether to show the scouts. */
      shopState.player = player;
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
        .then(route);
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

  renderRoster();
  renderInstallGuide();
  fillPlayerSelect();
  route();
  EGE.auth.init();
  window.addEventListener('hashchange', route);
})();
