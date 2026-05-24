// src/lib/supabase.js
// Supabase client singleton — reads credentials from .env
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_ID')) {
  console.warn(
    '[DIDSBOLT] Supabase credentials not configured.\n' +
    'Open .env and set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.\n' +
    'The app will fall back to localStorage until then.'
  );
}

// Quick connectivity check – resolves true/false
export const isSupabaseReady = () =>
  Boolean(supabaseUrl && !supabaseUrl.includes('YOUR_PROJECT_ID') && supabaseKey && !supabaseKey.includes('YOUR_ANON_KEY'));

export const supabase = isSupabaseReady() ? createClient(supabaseUrl, supabaseKey) : null;
