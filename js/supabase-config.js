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
  url: '',      // e.g. https://abcdefghijklm.supabase.co
  anonKey: ''   // the "anon public" / publishable key
};
