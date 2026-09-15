/* ==========================================================================
   Turns one week of the season into a Discord message.

   ## Week {n}
   {embed per player with a game that week}

   A game that has been played shows the result, the final score and the
   player's stat line. A game that has not shows the matchup and the
   kickoff. A player on a bye, one with no game that week, and one with no
   schedule at all are simply left out.
   ========================================================================== */

'use strict';

const COLOR_WIN      = 0x41713c;   /* the site's grass green */
const COLOR_LOSS     = 0xa64412;   /* the site's deep accent */
const COLOR_UPCOMING = 0xf0b82a;   /* the site's gold, for a game not yet played */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Dates are plain calendar days, so read them as such rather than letting
   the runtime's time zone move them. */
function kickoffLabel(game) {
  const parts = String(game.date).split('-').map(Number);
  const when = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = WEEKDAYS[when.getUTCDay()] + ' ' + MONTHS[when.getUTCMonth()] + ' ' + when.getUTCDate();
  return game.kickoff ? day + ', ' + game.kickoff : day;
}

/* Absolute URLs — Discord will not load anything relative. */
function asset(siteUrl, relativePath) {
  return siteUrl.replace(/\/+$/, '') + '/' + String(relativePath).replace(/^\/+/, '');
}

function playerUrl(siteUrl, player) {
  return siteUrl.replace(/\/+$/, '') + '/#' + player.slug;
}

/* Opponents are mostly schools we hold nothing for, but a few of them are
   each other — Bloomington and Normal Community share a league — so look
   the name up and use the mark when there is one. */
function opponentTeam(EGE, name) {
  const wanted = String(name).toLowerCase();
  const key = Object.keys(EGE.teams).filter(function (id) {
    const school = EGE.teams[id].school.toLowerCase();
    return school === wanted || school.indexOf(wanted + ' ') === 0;
  })[0];
  return key ? EGE.teams[key] : null;
}

/* The stat line a position is judged on. */
function statFields(player, stats) {
  if (!stats) { return []; }
  const fields = [];
  const add = function (name, value) { fields.push({ name: name, value: String(value), inline: true }); };

  if (player.position === 'QB') {
    add('Passing', stats.completions + '/' + stats.attempts + ', ' + stats.passingYards + ' yds');
    add('TD / INT', stats.passingTd + ' / ' + stats.interceptions);
    if (stats.rushingYards) {
      add('Rushing', stats.rushingYards + ' yds' + (stats.rushingTd ? ', ' + stats.rushingTd + ' TD' : ''));
    }
    return fields;
  }

  if (player.position === 'RB') {
    add('Rushing', stats.carries + ' car, ' + stats.rushingYards + ' yds');
    add('Rush TD', stats.rushingTd);
    if (stats.receptions) {
      add('Receiving', stats.receptions + ' rec, ' + stats.receivingYards + ' yds');
    }
    return fields;
  }

  /* TE and WR */
  add('Receiving', stats.receptions + ' rec, ' + stats.receivingYards + ' yds');
  if (typeof stats.targets === 'number') { add('Targets', stats.targets); }
  add('Rec TD', stats.receivingTd);
  return fields;
}

/* Record through the given week, so the embed says where the season stands.
   Null while nothing has been played, rather than a meaningless 0-0. */
function recordThrough(EGE, player, week, season) {
  let wins = 0;
  let losses = 0;
  let counted = 0;
  EGE.gamesPlayed(player, season).forEach(function (game) {
    if (game.week > week) { return; }
    counted += 1;
    if (game.result.teamScore > game.result.opponentScore) { wins += 1; } else { losses += 1; }
  });
  return counted ? wins + '-' + losses : null;
}

function buildEmbed(EGE, player, game, options) {
  const siteUrl = options.siteUrl;
  const season = options.season;
  const team = EGE.teamFor(player);
  const opponent = opponentTeam(EGE, game.opponent);
  const played = EGE.isFinal(game);
  const won = played && game.result.teamScore > game.result.opponentScore;
  const matchup = (game.home ? 'vs ' : 'at ') + game.opponent;

  const embed = {
    color: played ? (won ? COLOR_WIN : COLOR_LOSS) : COLOR_UPCOMING,
    author: {
      name: player.name,
      url: playerUrl(siteUrl, player),
      icon_url: asset(siteUrl, player.headshot)
    },
    title: played
      ? (won ? 'W ' : 'L ') + game.result.teamScore + '\u2013' + game.result.opponentScore + ' ' + matchup
      : matchup,
    url: playerUrl(siteUrl, player),
    fields: []
  };

  if (played) {
    embed.fields = statFields(player, game.stats);
  } else {
    embed.fields.push({ name: 'Kickoff', value: kickoffLabel(game), inline: true });
    embed.fields.push({ name: 'Where', value: game.home ? 'Home' : 'Away', inline: true });
    if (game.conference) {
      embed.fields.push({ name: 'Conference', value: 'Yes', inline: true });
    }
  }

  /* The player's own mark leads; the opponent's sits in the footer when we
     have one, which is as close to both crests as an embed allows. */
  if (team && team.logo) { embed.thumbnail = { url: asset(siteUrl, team.logo) }; }

  const footerBits = [team ? team.school : 'School TBD'];
  if (team && team.league) { footerBits.push(team.league); }
  const record = recordThrough(EGE, player, game.week, season);
  footerBits.push(record ? season + ' \u00b7 ' + record : String(season));

  embed.footer = { text: footerBits.join(' \u00b7 ') };
  if (opponent && opponent.logo) { embed.footer.icon_url = asset(siteUrl, opponent.logo); }

  return embed;
}

/* Every player with a game this week. */
function gamesInWeek(EGE, week, season) {
  return EGE.players
    .map(function (player) {
      return { player: player, game: EGE.gameInWeek(player, week, season) };
    })
    .filter(function (entry) { return Boolean(entry.game); });
}

function buildWeekPost(EGE, week, options) {
  const playing = gamesInWeek(EGE, week, options.season);
  if (!playing.length) { return null; }

  return {
    content: '## Week ' + week,
    embeds: playing.map(function (entry) {
      return buildEmbed(EGE, entry.player, entry.game, options);
    }),
    allowed_mentions: { parse: [] }
  };
}

module.exports = { buildWeekPost, gamesInWeek };
