/* ==========================================================================
   EGE Football — what a stat line is
   The columns each position's game log carries, in the order they are read
   in, and how a season of them adds up.

   One definition, used by the player page's game log, the season editor on
   the admin page and the Discord post, so there is never a version of a
   quarterback's line that disagrees with another version of it.

   Nothing here works a result out. The numbers are hardcoded a season at a
   time in stats/{year}.js, from wherever the admin generates them; this file
   only knows how to read them.

   `edits` on a column names the raw keys the season editor should offer for
   it. A column without one is edited under its own key, and a column with an
   empty one is worked out rather than typed — an average, a total, a rating.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.statline = (function () {
  'use strict';

  function show(value) {
    return value === null || value === undefined ? '—' : String(value);
  }

  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }

  /* An average to one decimal place, or nothing when there was nothing to
     average. Always worked out from the two numbers beside it, so a line can
     never disagree with itself. */
  function averageOf(yards, count) {
    if (!count) { return null; }
    return Math.round((yards / count) * 10) / 10;
  }

  /* NFL passer rating. Each part is capped at 2.375 before it is added in,
     which is the formula, not a tidy-up. */
  function passerRating(completions, attempts, yards, touchdowns, interceptions) {
    if (!attempts) { return null; }
    var a = clamp((completions / attempts - 0.3) * 5, 0, 2.375);
    var b = clamp((yards / attempts - 3) * 0.25, 0, 2.375);
    var c = clamp((touchdowns / attempts) * 20, 0, 2.375);
    var d = clamp(2.375 - (interceptions / attempts) * 25, 0, 2.375);
    return Math.round(((a + b + c + d) / 6) * 1000) / 10;
  }

  /* --- the columns -------------------------------------------------------- */

  var RUSHING = [
    { key: 'carries', label: 'CAR', title: 'Rushing Attempts',
      text: function (s) { return show(s.carries); }, total: 'sum' },
    { key: 'rushingYards', label: 'RUYDS', title: 'Rushing Yards',
      text: function (s) { return show(s.rushingYards); }, total: 'sum' },
    { key: 'rushingAvg', label: 'RUAVG', title: 'Rushing Yards per Attempt',
      text: function (s) { return show(s.rushingAvg); }, total: 'derive', edits: [],
      derive: function (t) { return averageOf(t.rushingYards, t.carries); } },
    { key: 'rushingTd', label: 'RUTD', title: 'Rushing Touchdowns',
      text: function (s) { return show(s.rushingTd); }, total: 'sum' },
    { key: 'rushingLong', label: 'LNG', title: 'Longest Rush',
      text: function (s) { return show(s.rushingLong); }, total: 'max' }
  ];

  var RECEIVING = [
    { key: 'receptions', label: 'REC', title: 'Receptions',
      text: function (s) { return show(s.receptions); }, total: 'sum' },
    { key: 'receivingYards', label: 'REYDS', title: 'Receiving Yards',
      text: function (s) { return show(s.receivingYards); }, total: 'sum' },
    { key: 'receivingAvg', label: 'REAVG', title: 'Receiving Yards per Reception',
      text: function (s) { return show(s.receivingAvg); }, total: 'derive', edits: [],
      derive: function (t) { return averageOf(t.receivingYards, t.receptions); } },
    { key: 'receivingYac', label: 'YAC', title: 'Yards After Catch',
      text: function (s) { return show(s.receivingYac); }, total: 'sum' },
    { key: 'receivingTd', label: 'RETD', title: 'Receiving Touchdowns',
      text: function (s) { return show(s.receivingTd); }, total: 'sum' },
    { key: 'receivingLong', label: 'LNG', title: 'Longest Reception',
      text: function (s) { return show(s.receivingLong); }, total: 'max' },
    { key: 'targets', label: 'TGT', title: 'Targets',
      text: function (s) { return show(s.targets); }, total: 'sum' }
  ];

  var FUMBLES = { key: 'fumbles', label: 'FL', title: 'Fumbles Lost',
                  text: function (s) { return show(s.fumbles); }, total: 'sum' };

  /* Totals a position carries at the front of its line. Both are worked out
     from the rushing and receiving numbers rather than typed, so they can
     never drift from the halves they add up. */
  var TOTALS = [
    { key: 'totalYards', label: 'YDS', title: 'Total Yards',
      text: function (s) { return show(s.totalYards); }, total: 'sum', edits: [],
      derive: function (t) { return t.totalYards; } },
    { key: 'totalTd', label: 'TD', title: 'Total Touchdowns',
      text: function (s) { return show(s.totalTd); }, total: 'sum', edits: [],
      derive: function (t) { return t.totalTd; } }
  ];

  var LINES = {
    QB: [
      { key: 'completions', label: 'C/ATT', title: 'Completions / Attempts',
        text: function (s) { return show(s.completions) + '/' + show(s.attempts); },
        total: 'derive', edits: ['completions', 'attempts'],
        derive: function (t) { return t.completions + '/' + t.attempts; } },
      { key: 'passingYards', label: 'PYDS', title: 'Passing Yards',
        text: function (s) { return show(s.passingYards); }, total: 'sum' },
      { key: 'passingAvg', label: 'PAVG', title: 'Passing Yards per Completion',
        text: function (s) { return show(s.passingAvg); }, total: 'derive', edits: [],
        derive: function (t) { return averageOf(t.passingYards, t.completions); } },
      { key: 'passingYac', label: 'PYAC', title: 'Passing Yards After Catch',
        text: function (s) { return show(s.passingYac); }, total: 'sum' },
      { key: 'passingTd', label: 'PTD', title: 'Passing Touchdowns',
        text: function (s) { return show(s.passingTd); }, total: 'sum' },
      { key: 'interceptions', label: 'INT', title: 'Interceptions',
        text: function (s) { return show(s.interceptions); }, total: 'sum' },
      { key: 'rating', label: 'RTG', title: 'Passer Rating',
        text: function (s) { return show(s.rating); }, total: 'derive', edits: [],
        derive: function (t) {
          return passerRating(t.completions, t.attempts, t.passingYards,
                              t.passingTd, t.interceptions);
        } }
    ].concat(RUSHING, [
      { key: 'sacks', label: 'SACK', title: 'Sacks Taken',
        text: function (s) { return show(s.sacks); }, total: 'sum' },
      FUMBLES
    ]),

    RB: TOTALS.concat(RUSHING, RECEIVING, [FUMBLES]),
    TE: TOTALS.concat(RECEIVING, RUSHING, [FUMBLES]),
    WR: TOTALS.concat(RECEIVING, RUSHING, [FUMBLES])
  };

  function lineFor(position) {
    return LINES[position] || LINES.WR;
  }

  /* Where one column covers two numbers, what each of them is called on its
     own — C/ATT is one column but two things to type, and two fields in a
     Discord post. */
  var KEY_LABELS = { completions: 'C', attempts: 'ATT' };

  /* What to call a single raw number. Falls back to the label of whichever
     column carries it, which is why both longs come out as LNG. */
  function labelFor(position, key) {
    if (KEY_LABELS[key]) { return KEY_LABELS[key]; }

    var column = lineFor(position).filter(function (c) {
      return c.key === key || (c.edits || []).indexOf(key) !== -1;
    })[0];
    return column ? column.label : key;
  }

  /* The typed numbers as label-and-value pairs, in the order the line reads.
     What the season editor asks for, and what a Discord post carries a field
     apiece of — the averages and totals are left out of both, because they
     follow from these rather than standing beside them. */
  function fieldsFor(position, stats) {
    var line = stats || {};
    return keysFor(position).map(function (key) {
      return {
        key: key,
        label: labelFor(position, key),
        value: show(line[key])
      };
    });
  }

  /* The raw numbers a position's line is typed from — everything the editor
     has to ask for, with the worked-out columns left out. */
  function keysFor(position) {
    var keys = [];
    lineFor(position).forEach(function (column) {
      var edits = column.edits === undefined ? [column.key] : column.edits;
      edits.forEach(function (key) {
        if (keys.indexOf(key) === -1) { keys.push(key); }
      });
    });
    return keys;
  }

  /* Fills in everything that follows from the numbers that were typed: the
     averages, the totals and the rating. Called whenever a line is written
     or read, so a hand-edited file and an edited one come out the same. */
  function complete(position, stats) {
    if (!stats) { return null; }
    var out = {};
    keysFor(position).forEach(function (key) {
      out[key] = typeof stats[key] === 'number' ? stats[key] : 0;
    });

    if (position === 'QB') {
      out.passingAvg = averageOf(out.passingYards, out.completions);
      out.rating = passerRating(out.completions, out.attempts, out.passingYards,
                                out.passingTd, out.interceptions);
      out.rushingAvg = averageOf(out.rushingYards, out.carries);
      return out;
    }

    out.rushingAvg = averageOf(out.rushingYards, out.carries);
    out.receivingAvg = averageOf(out.receivingYards, out.receptions);
    out.totalYards = out.rushingYards + out.receivingYards;
    out.totalTd = out.rushingTd + out.receivingTd;
    return out;
  }

  /* A season's worth of games under one line, each column added up the way
     that column is meant to be: summed, or the longest, or worked out again
     from the season's numbers. Averaging a column of averages is how a stat
     page ends up lying. */
  function totalLine(position, games) {
    var summed = {};
    var longs = {};

    games.forEach(function (stats) {
      if (!stats) { return; }
      Object.keys(stats).forEach(function (key) {
        var value = stats[key];
        if (typeof value !== 'number') { return; }
        summed[key] = (summed[key] || 0) + value;
        longs[key] = longs[key] === undefined ? value : Math.max(longs[key], value);
      });
    });

    var out = {};
    lineFor(position).forEach(function (column) {
      if (column.total === 'max') {
        out[column.key] = longs[column.key] === undefined ? null : longs[column.key];
      } else if (column.total === 'derive') {
        out[column.key] = column.derive(summed);
      } else {
        out[column.key] = summed[column.key] || 0;
      }
    });
    return { columns: out, summed: summed };
  }

  return {
    lineFor: lineFor,
    keysFor: keysFor,
    labelFor: labelFor,
    fieldsFor: fieldsFor,
    complete: complete,
    totalLine: totalLine,
    passerRating: passerRating,
    averageOf: averageOf,
    show: show
  };
})();
