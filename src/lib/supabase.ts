import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let clientPromise: Promise<SupabaseClient> | null = null;

export const isSupabaseConfigured = Boolean(url && key);

/** Netlify/Vite build zamanı env daxil edilməlidir; redeploy lazım ola bilər. */
export const supabaseEnvHint =
  '`VITE_SUPABASE_URL` və ya `NEXT_PUBLIC_SUPABASE_URL`, həmçinin `VITE_SUPABASE_ANON_KEY` və ya `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`';

export const getSupabaseClient = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url, key, {
        auth: {
          persistSession: false,
        },
      }),
    );
  }

  return clientPromise;
};
