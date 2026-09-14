/* ==========================================================================
   EGE Football — Supabase connection
   Fill these in from your Supabase project: Settings -> API.

   The anon/publishable key is designed to be used in browser code and is
   safe to commit. Never put the service_role key here — that one bypasses
   every security rule and must stay server-side.

   Leave them blank and the site still runs; the portal just reports that
   login is not configured yet.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.supabaseConfig = {
  url: 'https://tubxbdxoplffgpcjbrau.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YnhiZHhvcGxmZmdwY2picmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTkxODgsImV4cCI6MjEwNDk5NTE4OH0.GxVuccay0lpz8DouseY06GC34t1KVdX18qYJswL0FrA',

  /* Where password-reset emails send people. Must be listed under
     Authentication -> URL Configuration -> Redirect URLs in Supabase, or
     the link will bounce. Leave blank to use whatever origin the page is
     served from, which is handy when developing locally. */
  siteUrl: 'https://egefootball.vercel.app'
};
