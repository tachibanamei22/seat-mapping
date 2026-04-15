/**
 * supabase.ts
 * Supabase client singleton for the Seat Mapping App.
 * Replaces localStorage with a real-time Postgres backend.
 *
 * Setup:
 *   1. Create a Supabase project at https://supabase.com
 *   2. Run the SQL in /supabase/migrations/001_initial.sql
 *   3. Copy .env.local.example → .env.local and fill in your keys
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[seat-mapping] Supabase env vars missing — ' +
    'set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseAnonKey ?? '');
