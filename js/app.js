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

  /* --- player cards ----------------------------------------------------- */

  function buildCard(player) {
    var team = EGE.teamFor(player);
    var card = el('a', 'ege-card');
    card.href = '#' + player.slug;

    var photo = el('div', 'ege-card__photo');
    var img = el('img');
    img.src = player.headshot;
    img.alt = player.name;
    img.loading = 'lazy';
    photo.appendChild(img);
    if (player.jersey) { photo.appendChild(el('span', 'ege-card__jersey', '#' + player.jersey)); }
    card.appendChild(photo);

    var body = el('div', 'ege-card__body');
    body.appendChild(el('h3', 'ege-card__name', player.name));
    body.appendChild(schoolLine(player));
    body.appendChild(el('p', 'ege-card__league', team ? (team.league || 'League ' + TBD) : ''));

    var tags = el('div', 'fb-row fb-row--wrap');
    if (player.position) {
      tags.appendChild(el('span', 'fb-tag fb-tag--ink', player.position));
    } else {
      tags.appendChild(el('span', 'fb-tag fb-tag--outline', 'POS ' + TBD));
    }
    tags.appendChild(el('span', 'fb-tag fb-tag--gold', EGE.currentSeason));

    var overall = EGE.overallFor(player);
    if (overall !== null) {
      tags.appendChild(el('span', 'fb-tag fb-tag--num fb-tag--sage', 'OVR ' + overall));
    }
    body.appendChild(tags);

    body.appendChild(el('span', 'ege-card__go', 'View player →'));
    card.appendChild(body);

    return card;
  }

  function renderRoster() {
    var frag = document.createDocumentFragment();
    EGE.players.forEach(function (player) { frag.appendChild(buildCard(player)); });
    roster.appendChild(frag);
  }

  /* --- player view ------------------------------------------------------ */

  function renderPlayer(player) {
    var team = EGE.teamFor(player);

    document.getElementById('playerStripLabel').textContent = seasonLabel(EGE.currentSeason);

    var photo = document.getElementById('playerPhoto');
    photo.src = player.headshot;
    photo.alt = player.name;

    var school = document.getElementById('playerSchool');
    school.innerHTML = '';
    school.appendChild(schoolLine(player, 'ege-school--lg'));

    document.getElementById('playerName').textContent = player.name;
    document.getElementById('playerSeason').textContent = seasonLabel(EGE.currentSeason);
    document.getElementById('playerPosition').textContent = player.position || TBD;
    document.getElementById('playerSchoolRow').textContent = team ? team.school : TBD;
    document.getElementById('playerLeague').textContent = (team && team.league) || TBD;

    var record = EGE.recordFor(player);
    var played = EGE.gamesPlayed(player).length;
    document.getElementById('playerRecord').textContent = played ? record.text : '\u2014';

    var tags = document.getElementById('playerTags');
    tags.innerHTML = '';
    if (player.position) {
      tags.appendChild(el('span', 'fb-tag fb-tag--ink', player.position));
    } else {
      tags.appendChild(el('span', 'fb-tag fb-tag--outline', 'POS ' + TBD));
    }
    tags.appendChild(el('span', 'fb-tag fb-tag--gold', 'Junior Year'));

    var overall = EGE.overallFor(player);
    var overallBox = document.getElementById('playerOverall');
    overallBox.hidden = overall === null;
    document.getElementById('playerOverallValue').textContent = overall === null ? '' : overall;

    renderSchedule(player);
    renderRatings(player);
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

  function scheduleRow(game) {
    var row = el('tr');

    row.appendChild(el('td', 'ege-schedule__week', game.week));
    row.appendChild(el('td', null, gameDate(game)));
    row.appendChild(el('td', 'ege-schedule__time', game.kickoff || '\u2014'));

    var opponent = el('td', 'ege-schedule__opponent');
    opponent.appendChild(el('span', 'ege-schedule__side', game.home ? 'vs' : 'at'));
    opponent.appendChild(el('span', 'fb-name', game.opponent));
    if (game.conference) {
      var mark = el('abbr', 'ege-schedule__conf', '*');
      mark.title = 'Conference game';
      opponent.appendChild(mark);
    }
    row.appendChild(opponent);

    var result = el('td', 'num');
    if (EGE.isFinal(game)) {
      var won = game.result.teamScore > game.result.opponentScore;
      result.appendChild(el('span', 'fb-tag fb-tag--num ' + (won ? 'fb-tag--sage' : 'fb-tag--clay'),
        (won ? 'W ' : 'L ') + game.result.teamScore + '\u2013' + game.result.opponentScore));
    } else {
      result.appendChild(el('span', 'ege-schedule__pending', '\u2014'));
    }
    row.appendChild(result);

    return row;
  }

  function renderSchedule(player) {
    var panel = document.getElementById('schedulePanel');
    var body = document.getElementById('scheduleBody');
    var games = EGE.gamesFor(player);

    body.innerHTML = '';
    panel.hidden = false;
    document.getElementById('scheduleTableWrap').hidden = !games.length;
    document.getElementById('scheduleEmpty').hidden = Boolean(games.length);

    if (!games.length) {
      document.getElementById('scheduleNote').textContent = EGE.currentSeason;
      document.getElementById('scheduleLegend').textContent = '';
      return;
    }

    games.forEach(function (game) { body.appendChild(scheduleRow(game)); });

    var played = EGE.gamesPlayed(player).length;
    document.getElementById('scheduleNote').textContent = played
      ? EGE.currentSeason + ' \u00b7 ' + games.length + ' games \u00b7 ' + EGE.recordFor(player).text
      : EGE.currentSeason + ' \u00b7 ' + games.length + ' games \u00b7 none played yet';

    var conference = games.filter(function (game) { return game.conference; }).length;
    document.getElementById('scheduleLegend').textContent = conference
      ? '* conference game (' + conference + ' of ' + games.length + ')'
      : '';
  }

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

  function creditTag(credits) {
    return el('span', 'fb-tag fb-tag--num fb-tag--gold', credits + ' cr');
  }

  function buildShopItem(item) {
    var card = el('div', 'ege-item');

    var head = el('div', 'ege-item__head');
    head.appendChild(el('h4', 'ege-item__name', item.name));
    head.appendChild(creditTag(item.credits));
    card.appendChild(head);

    if (item.note) { card.appendChild(el('span', 'fb-tag fb-tag--outline', item.note)); }
    if (item.description) { card.appendChild(el('p', 'ege-item__text', item.description)); }
    return card;
  }

  /* The attributes a stat booster can be spent on, grouped the way the shop
     lists them. */
  function buildTargets(targets) {
    var wrap = el('div', 'ege-targets');
    targets.forEach(function (group) {
      var box = el('div', 'ege-targets__group');
      box.appendChild(el('span', 'fb-eyebrow', group.label));
      var list = el('div', 'fb-row fb-row--wrap');
      group.attributes.forEach(function (attr) {
        list.appendChild(el('span', 'fb-tag', attr.label));
      });
      box.appendChild(list);
      wrap.appendChild(box);
    });
    return wrap;
  }

  function buildShopSection(section) {
    var panel = el('div', 'fb-panel ege-section-gap');

    var head = el('div', 'fb-panel__head');
    head.appendChild(el('h3', null, section.title));
    panel.appendChild(head);

    var body = el('div', 'fb-panel__body fb-stack fb-stack--lg');
    if (section.blurb) { body.appendChild(el('p', 'ege-item__text', section.blurb)); }

    var grid = el('div', 'ege-items');
    section.items.forEach(function (item) { grid.appendChild(buildShopItem(item)); });
    body.appendChild(grid);

    if (section.targets) { body.appendChild(buildTargets(section.targets)); }

    panel.appendChild(body);
    return panel;
  }

  function renderShop() {
    var allowance = document.getElementById('shopAllowance');
    if (allowance.childNodes.length) { return; }      /* built once */

    EGE.shop.allowance.forEach(function (band) {
      var tile = el('div', 'fb-tile');
      tile.appendChild(el('span', 'fb-tile__label', band.label));
      tile.appendChild(el('span', 'fb-tile__value', band.credits));
      allowance.appendChild(tile);
    });

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

  /* --- routing ---------------------------------------------------------- */

  function setNav(active) {
    document.getElementById('navPlayers').classList.toggle('is-active', active === 'players');
    document.getElementById('navShop').classList.toggle('is-active', active === 'shop');
  }

  function show(view) {
    viewHome.hidden   = view !== viewHome;
    viewShop.hidden   = view !== viewShop;
    viewPlayer.hidden = view !== viewPlayer;
  }

  function route() {
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;

    if (hash === 'shop') {
      renderShop();
      show(viewShop);
      setNav('shop');
      document.title = 'Shop \u2014 EGE Football';
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

  function showSignedOutNav() {
    loginBtn.className = 'fb-btn fb-btn--inverse';
    loginBtn.textContent = 'Log In';
    loginBtn.removeAttribute('title');
    loginBtn.setAttribute('aria-label', 'Open the player portal');
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
  }

  EGE.auth.onChange(function (player) {
    if (player) {
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
    }
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

  /* --- go --------------------------------------------------------------- */

  renderRoster();
  fillPlayerSelect();
  route();
  EGE.auth.init();
  window.addEventListener('hashchange', route);
})();
