/* ==========================================================================
   EGE Football NFL sim — the Mock Draft
   The League's Mock Draft page (Sam, 2026-11-02: "you should be able to
   see the incoming prospects. A prospect grade from F to A+, their
   positions, college, archetype, and just a mock draft order showing the
   projected pick locations of each team ... an option to switch from a
   mock draft to just a big board"):

   - the class the next draft takes (lib/draft-plan.js draftYear), each
     prospect as the teams see him (lib/draft.js preview: his expected
     overall, or the one Sam set, and his archetype, which is the one he
     comes in with);
   - his grade, F to A+, from where a player rated like him goes;
   - the big board, best grade first;
   - the mock: every pick of the draft in its order, the one set by hand
     where there is one, the sim's own once the offseason has worked it
     out, and before that the standings as they are (the worst record
     first). Each team takes the prospect its own board likes best, as the
     sim's draft does (lib/draft.js runDraft), without the scouting noise,
     its needs changing as it picks; a pick in a draft Sam wrote by hand
     goes as he wrote it.

   Nothing private goes out: no overall, ceiling or id, only the letter.
   ========================================================================== */

'use strict';

const { realClass, preview, picksInOrder } = require('./draft');
const { draftYear, slotsFor, planFor } = require('./draft-plan');
const { draftOrder } = require('./season');
const { starterLevels, needAt, onTeam } = require('./rosters');
const { pickPoints, POSITION } = require('./value');
const { fitOf, schemeFor } = require('./schemes');

/* A grade by where a player of his rating goes: an A+ is a top-five pick,
   an F one nobody drafts. */
const LETTERS = [[5, 'A+'], [16, 'A'], [32, 'A-'], [48, 'B+'], [64, 'B'], [96, 'B-'], [128, 'C+'], [160, 'C'], [192, 'C-'],
  [224, 'D+'], [256, 'D'], [288, 'D-']];

function letterFor(grade) {
  for (let i = 0; i < LETTERS.length; i += 1) { if (grade <= LETTERS[i][0]) { return LETTERS[i][1]; } }
  return 'F';
}

/* Every pick of the year's draft in order, and whether that order is
   only the standings so far. */
function order(league, year) {
  const known = slotsFor(league, year);
  if (known) { return { slots: known, projected: false }; }
  return { slots: picksInOrder(league, draftOrder(league), year), projected: true };
}

function mockDraft(league) {
  const year = draftYear(league);
  const real = realClass(year);
  if (!real.list || !real.list.length) { return null; }
  const edits = league.prospectEdits || {};
  const views = real.list.map((pr) => preview(pr, year, real.lift, edits[pr.id]));
  const at = new Map(views.map((v, i) => [v.id, i]));
  const { slots, projected } = order(league, year);
  const plan = planFor(league, year);
  const written = {};
  (plan ? plan.picks : []).forEach((w) => { written[w.n] = w; });
  const levels = starterLevels(league);
  const rosters = {};
  const taken = new Set();
  const mock = [];
  slots.forEach((slot) => {
    const w = written[slot.n];
    const key = w ? w.team : slot.owner;
    const team = league.teams.find((t) => t.key === key);
    if (!team) { return; }
    const roster = rosters[key] || (rosters[key] = onTeam(league, key).slice());
    let choice = w && at.has(w.id) && !taken.has(w.id) ? views[at.get(w.id)] : null;
    if (!choice) {
      let best = -1;
      views.forEach((p) => {
        if (taken.has(p.id)) { return; }
        const need = needAt(league, key, p.pos, levels, roster);
        const fit = fitOf(p, schemeFor(team, p.pos));
        const score = pickPoints(p.grade) * Math.sqrt(POSITION[p.pos] || 0.8) * (1 + 0.45 * need) * (1 + 0.02 * fit);
        if (score > best) { best = score; choice = p; }
      });
    }
    if (!choice) { return; }
    taken.add(choice.id);
    roster.push(choice);
    const row = { n: slot.n, round: slot.round, team: key, p: at.get(choice.id) };
    if (slot.from !== key) { row.from = slot.from; }
    mock.push(row);
  });
  /* The big board: best grade first, the consensus between two alike. */
  const prospects = views.map((v, i) => {
    const pr = real.list[i];
    const row = { name: pr.name, pos: pr.pos, college: pr.college || null, age: pr.age || null, height: pr.height || null,
                  weight: pr.weight || null, archetype: v.archetype || null, grade: letterFor(v.grade), rank: 0 };
    if (pr.espn) { row.espn = String(pr.espn); }
    if (pr.collegePhoto) { row.collegePhoto = true; }
    return row;
  });
  views.map((v, i) => i).sort((a, b) => views[a].grade - views[b].grade || views[a].rank - views[b].rank)
    .forEach((i, n) => { prospects[i].rank = n + 1; });
  return { year, projected, prospects, mock };
}

module.exports = { mockDraft, letterFor };
