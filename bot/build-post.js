/* ==========================================================================
   Turns one week of the season into a Discord message.

   ## Week {n}
   {embed per player who actually played}

   A player on a bye, a player who did not play, and a player with no
   schedule at all are simply left out.
   ========================================================================== */

'use strict';

const COLOR_WIN  = 0x41713c;   /* the site's grass green */
const COLOR_LOSS = 0xa64412;   /* the site's deep accent */

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

/* Record through the given week, so the embed says where the season stands. */
function recordThrough(EGE, player, week, season) {
  let wins = 0;
  let losses = 0;
  EGE.gamesPlayed(player, season).forEach(function (game) {
    if (game.week > week) { return; }
    if (game.teamScore > game.opponentScore) { wins += 1; } else { losses += 1; }
  });
  return wins + '-' + losses;
}

function buildEmbed(EGE, player, game, options) {
  const siteUrl = options.siteUrl;
  const season = options.season;
  const team = EGE.teamFor(player);
  const won = game.teamScore > game.opponentScore;
  const opponent = opponentTeam(EGE, game.opponent);

  const embed = {
    color: won ? COLOR_WIN : COLOR_LOSS,
    author: {
      name: player.name,
      url: playerUrl(siteUrl, player),
      icon_url: asset(siteUrl, player.headshot)
    },
    title: (won ? 'W ' : 'L ') + game.teamScore + '–' + game.opponentScore +
           (game.home ? ' vs ' : ' at ') + game.opponent,
    url: playerUrl(siteUrl, player),
    fields: statFields(player, game.stats)
  };

  /* The player's own mark leads; the opponent's sits in the footer when we
     have one, which is as close to both crests as an embed allows. */
  if (team && team.logo) { embed.thumbnail = { url: asset(siteUrl, team.logo) }; }

  const footerBits = [team ? team.school : 'School TBD'];
  if (team && team.league) { footerBits.push(team.league); }
  footerBits.push(season + ' · ' + recordThrough(EGE, player, game.week, season));

  embed.footer = { text: footerBits.join(' · ') };
  if (opponent && opponent.logo) { embed.footer.icon_url = asset(siteUrl, opponent.logo); }

  return embed;
}

/* Every player who actually took the field in this week. */
function gamesInWeek(EGE, week, season) {
  return EGE.players
    .map(function (player) {
      return { player: player, game: EGE.gameInWeek(player, week, season) };
    })
    .filter(function (entry) { return Boolean(entry.game); });
}

function buildWeekPost(EGE, week, options) {
  const played = gamesInWeek(EGE, week, options.season);
  if (!played.length) { return null; }

  return {
    content: '## Week ' + week,
    embeds: played.map(function (entry) {
      return buildEmbed(EGE, entry.player, entry.game, options);
    }),
    allowed_mentions: { parse: [] }
  };
}

module.exports = { buildWeekPost, gamesInWeek };
