/* ==========================================================================
   EGE Football — post-week
   Takes a Discord payload the admin page built and sends it to the channel.

   Why this exists at all: the site is static and public, so it cannot keep a
   secret. A Discord webhook URL in browser code is a webhook anybody who
   views source can post to. The URL lives here as a Supabase secret instead,
   and the browser never sees it.

   It will only do it for an admin. The caller's JWT comes through on the
   Authorization header, and the same `admins` table the rest of the site
   trusts decides the answer — a player who found this endpoint gets a 403.

   From 2023 there are two channels, one per league, and the payload says
   which with `league`: 'college' or 'nfl'. The URL is the one saved on the
   admin page (the discord_webhooks table, read with the admin's own
   sign-in), or failing that this function's secret for that league.

   Deploying it
   ------------
     supabase secrets set DISCORD_WEBHOOK_URL_COLLEGE='https://discord.com/api/webhooks/...'
     supabase secrets set DISCORD_WEBHOOK_URL_NFL='https://discord.com/api/webhooks/...'
     supabase functions deploy post-week

   The secrets are only needed if the webhooks are not saved on the admin
   page.

   If it is not deployed, nothing breaks: publishing still works, and the
   scheduled bot posts the week on its next run instead.
   ========================================================================== */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') { return new Response('ok', { headers: CORS }); }
  if (request.method !== 'POST') { return reply({ error: 'POST only' }, 405); }

  const authorization = request.headers.get('Authorization');
  if (!authorization) { return reply({ error: 'sign in first' }, 401); }

  /* The caller's own token, so auth.uid() and is_admin() are theirs and not
     this function's. */
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authorization } } }
  );

  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) { return reply({ error: 'sign in first' }, 401); }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError) { return reply({ error: adminError.message }, 500); }
  if (!isAdmin) { return reply({ error: 'admins only' }, 403); }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return reply({ error: 'that was not JSON' }, 400);
  }

  /* Only the shape a week post has. An admin is trusted, but a typo should
     not become a 40kB message in the channel. */
  const post = payload as { content?: unknown; embeds?: unknown; league?: unknown };
  const league = post?.league === undefined ? 'college' : post.league;
  if (league !== 'college' && league !== 'nfl') {
    return reply({ error: "league must be 'college' or 'nfl'" }, 400);
  }

  const { data: saved } = await supabase.from('discord_webhooks')
    .select('url').eq('league', league).maybeSingle();
  const secret = 'DISCORD_WEBHOOK_URL_' + league.toUpperCase();
  const webhook = saved?.url || Deno.env.get(secret);
  if (!webhook) {
    return reply({ error: 'no ' + league + ' webhook: save it on the admin page, or set ' + secret }, 500);
  }

  if (typeof post?.content !== 'string' || !Array.isArray(post?.embeds)) {
    return reply({ error: 'expected { content, embeds }' }, 400);
  }
  if (post.embeds.length > 10) {
    return reply({ error: 'Discord takes at most 10 embeds in one message' }, 400);
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: post.content,
      embeds: post.embeds,
      allowed_mentions: { parse: [] }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return reply({ error: 'Discord replied ' + response.status + ': ' + text.slice(0, 300) }, 502);
  }

  return reply({ ok: true });
});
