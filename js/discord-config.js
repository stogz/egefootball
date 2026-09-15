/* ==========================================================================
   EGE Football — Discord
   Where the week gets posted when the admin publishes it.

   Put the channel webhook URL here and publishing posts straight from the
   browser: one line of setup, nothing to deploy, and the message lands the
   moment the button is clicked.

     Discord -> Server Settings -> Integrations -> Webhooks -> New Webhook
     Copy Webhook URL

   Know what this means. Anything committed here is public, so anyone who
   views source can read this URL, and anyone with the URL can post to that
   channel as the bot. It grants nothing else — no access to the server, the
   members, or anything they have said — and a bad message can be deleted.
   For a channel a handful of friends read, that is a fair trade for not
   having to run anything. Rotate it by deleting the webhook in Discord and
   making a new one.

   If you would rather not publish it, leave this blank and deploy the edge
   function in supabase/functions/post-week instead — it keeps the URL as a
   Supabase secret and the browser hands it a payload. Publishing uses
   whichever is available: this first, the function otherwise.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.discordConfig = {
  webhookUrl: 'https://discordapp.com/api/webhooks/1549516493572800673/39BDW02xGa2Ntu_TXWocUdCjAtoMvGcV-VGSCSX_1IOQD_qFuK-2F7cSVlgDEGKwmUUi'
};
