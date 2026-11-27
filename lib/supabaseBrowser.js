import { createBrowserClient } from '@supabase/ssr';

let supabase;

export function getSupabaseBrowser() {
  if (supabase) return supabase;

  supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        // Passkeys (Face ID / fingerprint) are a Supabase beta feature and
        // must be switched on here, plus in Authentication -> Passkeys.
        // Needs @supabase/supabase-js 2.105.0 or newer.
        experimental: { passkey: true },
      },
    }
  );

  return supabase;
}
