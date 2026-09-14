/* ==========================================================================
   EGE Football — homepage
   Renders the six player cards and routes #{slug} to a player view.
   Plain script, no build step, no modules — works from file:// and http.
   ========================================================================== */

(function () {
  'use strict';

  var TBD = 'TBD';

  var roster      = document.getElementById('roster');
  var viewHome    = document.getElementById('view-home');
  var viewPlayer  = document.getElementById('view-player');
  var loginBtn    = document.getElementById('loginBtn');
  var loginModal  = document.getElementById('loginModal');

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

  /* --- player cards ----------------------------------------------------- */

  function buildCard(player) {
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
    body.appendChild(el('p', 'ege-card__school', player.school || 'School ' + TBD));

    var tags = el('div', 'fb-row--wrap');
    if (player.position) {
      tags.appendChild(el('span', 'fb-tag fb-tag--ink', player.position));
    } else {
      tags.appendChild(el('span', 'fb-tag fb-tag--outline', 'POS ' + TBD));
    }
    tags.appendChild(el('span', 'fb-tag fb-tag--sage', EGE.currentSeason));
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
    document.getElementById('playerStripLabel').textContent = seasonLabel(EGE.currentSeason);

    var photo = document.getElementById('playerPhoto');
    photo.src = player.headshot;
    photo.alt = player.name;

    document.getElementById('playerSchool').textContent = player.school || 'School ' + TBD;
    document.getElementById('playerName').textContent = player.name;
    document.getElementById('playerSeason').textContent = seasonLabel(EGE.currentSeason);
    document.getElementById('playerPosition').textContent = player.position || TBD;
    document.getElementById('playerSchoolRow').textContent = player.school || TBD;

    var tags = document.getElementById('playerTags');
    tags.innerHTML = '';
    if (player.position) {
      tags.appendChild(el('span', 'fb-tag fb-tag--ink', player.position));
    } else {
      tags.appendChild(el('span', 'fb-tag fb-tag--outline', 'POS ' + TBD));
    }
    tags.appendChild(el('span', 'fb-tag fb-tag--clay', 'Junior Year'));

    document.title = player.name + ' — EGE Football';
  }

  /* --- routing ---------------------------------------------------------- */

  function route() {
    var slug = window.location.hash.replace(/^#/, '');
    var player = slug ? EGE.playerBySlug(slug) : null;

    if (player) {
      renderPlayer(player);
      viewHome.hidden = true;
      viewPlayer.hidden = false;
    } else {
      viewHome.hidden = false;
      viewPlayer.hidden = true;
      document.title = 'EGE Football — Player Select';
    }
    window.scrollTo(0, 0);
  }

  /* --- login placeholder ------------------------------------------------ */

  function openLogin() { loginModal.hidden = false; }
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
  route();
  window.addEventListener('hashchange', route);
})();
