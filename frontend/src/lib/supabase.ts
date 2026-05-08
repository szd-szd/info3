import { createClient } from '@supabase/supabase-js';
import { authEmailRedirectUrl, normalizeSupabaseProjectUrl } from './supabaseUrl';

const url = normalizeSupabaseProjectUrl(import.meta.env.VITE_SUPABASE_URL);
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, '') ?? '';

if (!url || !anon) {
  console.warn(
    'Variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquantes — ajoutez un fichier .env'
  );
}

export const supabase = createClient(url, anon, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
