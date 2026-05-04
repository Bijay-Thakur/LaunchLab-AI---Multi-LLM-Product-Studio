"use client";

import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    let mounted = true;

    sb.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_evt, s) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
  }, []);

  return {
    user,
    session,
    loading,
    configured: isSupabaseConfigured,
    signInWithGoogle,
    signOut,
  };
}
