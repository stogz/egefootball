/* ==========================================================================
   EGE Football NFL sim — a draft written by hand
   Sam can write the first rounds of a draft himself (the mock draft he
   posted on Discord, say) and the sim takes them as given: every pick's
   team and player, the six included. The sim drafts the rest from there.

   It reads the draft as text: the Discord lists ("### Round One",
   "7. :CHI: __**Cooper Clark**__"), one pick a line with the team and the
   player ("7 CHI Cooper Clark", "7, Chicago Bears (from CAR), Cooper
   Clark, RB, USC"), a CSV or tab-separated table with Pick, Team and
   Player columns, or JSON. Every pick is checked against the draft order
   and the class, and the draft is kept in the world (league.draftPlans)
   until the draft runs. While it waits, the picks it covers cannot be
   traded.

   A year's draft order can be set by hand too (data/draft-orders.json):
   the first round's order, the teams tied on record, who rotate each
   round as the NFL's do, and pick trades made before the 2023 kickoff,
   which the sim's starting league does not have. With one, every round of
   that draft goes in that order whatever the sim's own season said. 2024's
   is the order in the "2024 NFL Combine and Mock Draft" doc.
   ========================================================================== */

'use strict';

const io = require('./io');
const { TEAMS, KEYS } = require('./teams');
const { sixFromSite } = require('./ege');
const { picksInOrder } = require('./draft');
const { nextDraft } = require('./picks');

function nick(key) { return TEAMS[key] ? TEAMS[key].name.split(' ').slice(-1)[0] : key; }

/* ------------------------------------------------------ the order by hand -- */

function orders() { return io.data('draft-orders.json'); }

/* Every round's order for a year whose order was set by hand, or null.
   Teams tied on record take turns: the first of them in one round picks
   last of them in the next. */
function officialRounds(year) {
  const set = orders()[year];
  if (!set) { return null; }
  const rounds = [];
  for (let r = 0; r < 7; r += 1) {
    const order = set.order.slice();
    (set.ties || []).forEach((group) => {
      const at = group.map((key) => set.order.indexOf(key)).sort((a, b) => a - b);
      const turn = r % group.length;
      group.slice(turn).concat(group.slice(0, turn)).forEach((key, i) => { order[at[i]] = key; });
    });
    rounds.push(order);
  }
  return rounds;
}

/* Puts the hand-set orders in force: the trades each names, once a year
   and only for a pick nobody has traded since, and at the draft, its order
   for every round. Run whenever the league is opened. */
function applyOfficial(league) {
  const all = orders();
  league.officialTrades = league.officialTrades || {};
  Object.keys(all).forEach((year) => {
    if (league.officialTrades[year] || Number(year) < league.season) { return; }
    (all[year].trades || []).forEach((t) => {
      const pick = league.picks.find((p) => p.year === Number(year) && p.round === t.round && p.from === t.from);
      if (pick && pick.owner === t.from) { pick.owner = t.owner; }
    });
    league.officialTrades[year] = true;
  });
  if (league.phase === 'draft' && all[league.season]) {
    league.draftRounds = officialRounds(league.season);
    league.draftOrder = league.draftRounds[0];
  }
}

/* The draft an upload is for: this one when the league is at it,
   otherwise next spring's. */
function draftYear(league) { return league.phase === 'draft' ? league.season : league.season + 1; }

/* Every pick of a year's draft as far as it is known now, or null while
   its order is not: a hand-set order is known from the start, the sim's
   own once the offseason has worked it out. */
function slotsFor(league, year) {
  const order = officialRounds(year) || (league.phase === 'draft' && league.season === year ? league.draftOrder : null);
  return order ? picksInOrder(league, order, year) : null;
}

/* The year a draft can be uploaded for now, or null: one with a class to
   draft from and an order that is known. */
function ready(league) {
  const year = draftYear(league);
  return io.data('prospects.json').classes[year] && slotsFor(league, year) ? year : null;
}

function planFor(league, year) { return (league.draftPlans || {})[year] || null; }

/* A pick an uploaded draft covers stays where it is. */
function locked(league, pick) {
  const plan = planFor(league, pick.year);
  return Boolean(plan && pick.round <= plan.rounds);
}

/* Every pick from the next draft on, by the team that owns it, as the
   Teams pages show them: { DET: [{ year, round, from, n, locked }] }, each
   team's by year and round. `n` is the pick's number in its draft where
   that draft's order is known (one set by hand, or the sim's own once the
   offseason has worked it out); `locked`, a pick an uploaded draft
   covers. */
function board(league) {
  const first = nextDraft(league);
  const out = {};
  league.teams.forEach((t) => { out[t.key] = []; });
  const numbers = {};
  new Set(league.picks.filter((p) => p.year >= first).map((p) => p.year)).forEach((year) => {
    (slotsFor(league, year) || []).forEach((s) => { numbers[year + ':' + s.round + ':' + s.from] = s.n; });
  });
  league.picks.forEach((p) => {
    if (p.year < first || !out[p.owner]) { return; }
    const row = { year: p.year, round: p.round, from: p.from };
    const n = numbers[p.year + ':' + p.round + ':' + p.from];
    if (n) { row.n = n; }
    if (locked(league, p)) { row.locked = true; }
    out[p.owner].push(row);
  });
  Object.keys(out).forEach((key) => {
    out[key].sort((a, b) => a.year - b.year || a.round - b.round || (a.n || 999) - (b.n || 999) ||
      (a.from === key ? -1 : b.from === key ? 1 : a.from.localeCompare(b.from)));
  });
  return out;
}

/* -------------------------------------------------------------- reading -- */

function words(text) {
  return String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`.]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function nameKey(text) { return words(text).replace(/ (jr|sr|ii|iii|iv|v)$/, ''); }

/* Every way a team gets written: its key, name and nickname, its city
   where only one team plays there, the Discord emoji codes (:DC:, :NOLA:)
   and the other common abbreviations. */
const ALIASES = {
  lar: 'LA', stl: 'LA', wsh: 'WAS', dc: 'WAS', nola: 'NO', nor: 'NO', jac: 'JAX', gnb: 'GB', kan: 'KC', nwe: 'NE',
  sfo: 'SF', tam: 'TB', lvr: 'LV', oak: 'LV', sd: 'LAC', arz: 'ARI', blt: 'BAL', clv: 'CLE', hst: 'HOU', niners: 'SF',
  bucs: 'TB', pats: 'NE'
};
let teamWords = null;
function teamKey(text) {
  if (!teamWords) {
    teamWords = {};
    const cities = {};
    KEYS.forEach((key) => {
      const parts = TEAMS[key].name.split(' ');
      const city = words(parts.slice(0, -1).join(' '));
      teamWords[words(key)] = key;
      teamWords[words(TEAMS[key].name)] = key;
      teamWords[words(parts[parts.length - 1])] = key;
      cities[city] = city in cities ? null : key;
    });
    Object.keys(cities).forEach((city) => { if (cities[city] && !teamWords[city]) { teamWords[city] = cities[city]; } });
    Object.keys(ALIASES).forEach((alias) => { teamWords[alias] = ALIASES[alias]; });
  }
  return teamWords[words(String(text || '').replace(/\((?:from|via)\s[^)]*\)/gi, ''))] || null;
}

const POSITIONS = { QB: 'QB', RB: 'RB', HB: 'RB', FB: 'FB', WR: 'WR', TE: 'TE', T: 'OT', OT: 'OT', G: 'IOL', OG: 'IOL',
                    C: 'IOL', IOL: 'IOL', EDGE: 'EDGE', DE: 'EDGE', OLB: 'EDGE', DT: 'DI', DI: 'DI', DL: 'DI', NT: 'DI',
                    LB: 'LB', ILB: 'LB', CB: 'CB', S: 'S', FS: 'S', SS: 'S', K: 'K', P: 'P' };
const MARKS = /[*_~`|]/g;

/* One line's team, player and (if given) position, after its pick
   number. The team comes first: an emoji code, or the first cell, or the
   first one to three words. */
function splitPick(rest) {
  let text = rest.replace(/\((?:from|via)\s[^)]*\)/gi, ' ').trim();
  let team = null;
  const emoji = /^<?a?:([A-Za-z0-9_]+):(?:\d+>)?\s*/.exec(text);
  if (emoji) {
    team = emoji[1];
    text = text.slice(emoji[0].length);
  }
  const parts = text.split(/\s*(?:\t|,|;|\||:\s|\s[-–—]\s)\s*/).map((s) => s.replace(MARKS, '').trim()).filter(Boolean);
  if (!team && parts.length >= 2 && teamKey(parts[0])) { team = parts.shift(); }
  if (!team && parts.length) {
    const w = parts[0].split(/\s+/);
    for (let k = Math.min(3, w.length - 1); k >= 1 && !team; k -= 1) {
      if (teamKey(w.slice(0, k).join(' '))) {
        team = w.slice(0, k).join(' ');
        parts[0] = w.slice(k).join(' ');
      }
    }
    if (!team && parts.length >= 2) { team = parts.shift(); }
    if (!team) {
      team = w[0];
      parts[0] = w.slice(1).join(' ');
    }
  }
  const player = (parts[0] || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  const pos = parts[1] ? POSITIONS[parts[1].toUpperCase()] || null : null;
  return { team: team || '', player, pos };
}

/* A line of a CSV or tab-separated table. */
function cells(line) {
  const sep = line.indexOf('\t') !== -1 ? '\t' : ',';
  const out = [];
  let cell = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') { quoted = !quoted; } else if (ch === sep && !quoted) { out.push(cell.trim()); cell = ''; } else { cell += ch; }
  }
  out.push(cell.trim());
  return out;
}

const HEADINGS = { n: /^(pick|pick no|pick number|no|number|overall|#)$/, team: /^(team|club)$/, player: /^(player|name|prospect)$/,
                   pos: /^(pos|position)$/ };

function headingsOf(row) {
  const at = {};
  row.forEach((cell, i) => {
    const w = words(cell) || cell.trim();
    Object.keys(HEADINGS).forEach((k) => { if (at[k] === undefined && HEADINGS[k].test(w)) { at[k] = i; } });
  });
  return at.n !== undefined && at.team !== undefined && at.player !== undefined ? at : null;
}

const NUMBERED = /^(?:pick\s*|no\.?\s*|#\s*)?(\d{1,3})(?=[\s.):,\-–]|$)\s*[.):,\-–]?\s*(.*)$/i;

/* The picks as written: [{ line, n, team, player, pos }]. Lines with no
   pick number (headings like "### Round One") are passed over; a pick
   left out that way shows up as missing. */
function readDraft(text) {
  const body = String(text || '').replace(/^﻿/, '').trim();
  if (!body) { return { rows: [], errors: ['There is nothing to read.'] }; }
  if (/^[[{]/.test(body)) {
    let data;
    try { data = JSON.parse(body); } catch (err) { return { rows: [], errors: ['The JSON does not read: ' + err.message] }; }
    const list = Array.isArray(data) ? data : data && (data.picks || data.draft);
    if (!Array.isArray(list)) { return { rows: [], errors: ['The JSON needs a list of picks: [{ "pick": 1, "team": "NE", "player": "Caleb Williams" }]'] }; }
    return {
      rows: list.map((p, i) => ({ line: i + 1, n: Number(p.pick || p.n || p.no || p.number) || null, team: String(p.team || ''),
                                  player: String(p.player || p.name || p.id || ''), pos: POSITIONS[String(p.pos || '').toUpperCase()] || null })),
      errors: []
    };
  }
  const lines = body.split(/\r?\n/);
  const first = lines.findIndex((l) => l.trim());
  const at = headingsOf(cells(lines[first]));
  const rows = [];
  lines.forEach((raw, i) => {
    if (at) {
      if (i <= first || !raw.trim()) { return; }
      const c = cells(raw);
      const n = parseInt(c[at.n], 10);
      if (n) { rows.push({ line: i + 1, n, team: c[at.team] || '', player: (c[at.player] || '').replace(MARKS, '').trim(),
                           pos: at.pos !== undefined ? POSITIONS[String(c[at.pos] || '').toUpperCase()] || null : null }); }
      return;
    }
    const m = NUMBERED.exec(raw.trim().replace(/^[-*>•]\s+/, ''));
    if (!m || !m[2].trim()) { return; }
    rows.push(Object.assign({ line: i + 1, n: Number(m[1]) }, splitPick(m[2])));
  });
  return { rows, errors: [] };
}

/* --------------------------------------------------------------- checking -- */

/* Who can be picked in a year's draft: its class, and those of the six in
   it who are not in the league yet. */
function poolFor(league, year) {
  const all = io.data('prospects.json');
  const list = all.classes[year];
  if (!list) { return null; }
  const pool = list.map((pr) => ({ id: pr.id, name: pr.name, pos: pr.pos, college: pr.college }));
  const slugs = ((all.ege && all.ege[year]) || []).filter((slug) => !league.players.some((p) => p.ege === slug));
  if (slugs.length) {
    const site = io.site();
    const six = sixFromSite(year);
    slugs.filter((slug) => six[slug]).forEach((slug) => {
      const player = site.players.find((x) => x.slug === slug);
      const school = site.teamFor ? site.teamFor(player, year - 1) : null;
      const p = six[slug].player;
      pool.push({ id: p.id, ege: slug, name: p.name, pos: p.pos, college: school ? school.school || school.name : null });
    });
  }
  return pool;
}

function distance(a, b) {
  const row = [];
  for (let j = 0; j <= b.length; j += 1) { row.push(j); }
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const here = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = here;
    }
  }
  return row[b.length];
}

function findPlayer(pool, text, pos, year) {
  const want = nameKey(text);
  const raw = String(text || '').trim();
  if (!want) { return { error: 'no player.' }; }
  let found = pool.filter((p) => nameKey(p.name) === want || p.id === raw || p.ege === raw.toLowerCase());
  if (found.length > 1 && pos) { found = found.filter((p) => p.pos === pos); }
  if (found.length === 1) { return { player: found[0] }; }
  if (found.length > 1) { return { error: 'more than one prospect is called ' + raw + '; add his position after his name.' }; }
  let best = null;
  let near = Infinity;
  pool.forEach((p) => {
    const d = distance(nameKey(p.name), want);
    if (d < near) { near = d; best = p; }
  });
  return { error: 'no ' + year + ' prospect called “' + raw + '”.' +
    (best && near <= Math.max(2, Math.round(want.length / 4)) ? ' Did you mean ' + best.name + '?' : '') };
}

/* The Bears’, the 49ers’. */
function theirs(key) { return 'the ' + nick(key) + '’' + (nick(key).slice(-1) === 's' ? '' : 's'); }

function belongsTo(slot) {
  return theirs(slot.owner) + (slot.from !== slot.owner ? ' (from the ' + nick(slot.from) + ')' : '');
}

/* 34-64, or 47 and 52. */
function spans(list) {
  const out = [];
  list.forEach((n) => {
    const last = out[out.length - 1];
    if (last && n === last[1] + 1) { last[1] = n; } else { out.push([n, n]); }
  });
  const bits = out.map(([a, b]) => (a === b ? String(a) : a + '–' + b));
  return bits.length > 1 ? bits.slice(0, -1).join(', ') + ' and ' + bits[bits.length - 1] : bits[0];
}

/* A draft as written, checked against the year's order and class:
   { year, rounds, picks: [{ n, round, from, team, id, ege, name, pos,
   college }], errors }. Nothing is kept until save(). */
function check(league, text) {
  const year = draftYear(league);
  const read = readDraft(text);
  const errors = read.errors.slice();
  const out = { year, rounds: 0, picks: [], errors };
  if (errors.length) { return out; }
  const pool = poolFor(league, year);
  const slots = pool && slotsFor(league, year);
  if (!pool) { errors.push('The sim has no ' + year + ' class to draft from.'); return out; }
  if (!slots) { errors.push('The ' + year + ' order is set when the offseason runs. Upload the draft after that.'); return out; }
  if (!read.rows.length) { errors.push('No picks found. Write one a line, like 7. CHI Cooper Clark'); return out; }
  const byN = {};
  const taken = {};
  read.rows.forEach((r) => {
    if (!r.n) { errors.push('Line ' + r.line + ' has no pick number.'); return; }
    const where = 'Pick ' + r.n;
    const slot = slots[r.n - 1];
    if (!slot) { errors.push('There is no pick ' + r.n + ': the ' + year + ' draft has ' + slots.length + '.'); return; }
    const key = teamKey(r.team);
    const found = findPlayer(pool, r.player, r.pos, year);
    if (byN[r.n]) {
      if (byN[r.n].team !== key || !found.player || byN[r.n].id !== found.player.id) { errors.push(where + ' is in twice.'); }
      return;
    }
    byN[r.n] = Object.assign({ n: r.n, round: slot.round, from: slot.from, team: key }, found.player || { name: r.player });
    if (!key) {
      errors.push(where + ': no team called “' + r.team + '”.');
    } else if (key !== slot.owner) {
      errors.push(where + ' is ' + belongsTo(slot) + ', not ' + theirs(key) + '.');
    }
    if (!found.player) {
      errors.push(where + ': ' + found.error);
    } else if (taken[found.player.id]) {
      errors.push(found.player.name + ' is picked twice, at ' + taken[found.player.id] + ' and ' + r.n + '.');
    } else {
      taken[found.player.id] = r.n;
    }
  });
  const have = Object.keys(byN).map(Number).sort((a, b) => a - b);
  if (have.length) {
    out.rounds = slots[have[have.length - 1] - 1].round;
    for (let round = 1; round <= out.rounds; round += 1) {
      const missing = slots.filter((s) => s.round === round && !byN[s.n]).map((s) => s.n);
      if (missing.length) { errors.push('Round ' + round + ' is missing ' + (missing.length === 1 ? 'pick ' : 'picks ') + spans(missing) + '.'); }
    }
  }
  out.picks = have.map((n) => byN[n]);
  return out;
}

/* ---------------------------------------------------------------- keeping -- */

/* Keeps a checked draft for its year's draft, in place of any before it. */
function save(league, checked) {
  if (checked.errors.length) { throw new Error(checked.errors[0]); }
  if (!checked.picks.length) { throw new Error('There are no picks to keep.'); }
  league.draftPlans = league.draftPlans || {};
  league.draftPlans[checked.year] = {
    rounds: checked.rounds,
    picks: checked.picks.map((p) => ({ n: p.n, team: p.team, id: p.id, name: p.name, pos: p.pos, ege: p.ege || undefined }))
  };
  return league.draftPlans[checked.year];
}

function remove(league, year) {
  if (league.draftPlans) { delete league.draftPlans[year]; }
}

/* The draft kept for the next draft, as check() hands one back, or null. */
function saved(league) {
  const year = draftYear(league);
  const plan = planFor(league, year);
  if (!plan) { return null; }
  const slots = slotsFor(league, year) || [];
  const pool = poolFor(league, year) || [];
  return {
    year,
    rounds: plan.rounds,
    picks: plan.picks.map((p) => {
      const slot = slots[p.n - 1] || {};
      const who = pool.find((x) => x.id === p.id) || {};
      return Object.assign({ round: slot.round, from: slot.from || p.team, college: who.college || null }, p);
    })
  };
}

module.exports = {
  officialRounds, applyOfficial, draftYear, slotsFor, ready, planFor, locked, board, readDraft, teamKey, check, save, remove, saved
};
