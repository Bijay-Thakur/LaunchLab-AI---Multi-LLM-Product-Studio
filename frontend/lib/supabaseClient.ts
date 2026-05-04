"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(URL && ANON);

let _client: SupabaseClient | null = null;

/**
 * Returns a Supabase client if env vars are set, otherwise null.
 * The whole app must remain functional when this returns null
 * (demo-safe local mode).
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (_client) return _client;
  _client = createClient(URL, ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}
