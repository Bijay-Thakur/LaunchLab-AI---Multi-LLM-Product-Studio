"use client";

import { useEffect, useState } from "react";
import { X, ShieldCheck, Sparkles, Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

const OPEN_EVENT = "launchlab:open-login";

export function openLoginModal(message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { message } }));
}

export default function LoginModal() {
  const { configured, user, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail || {};
      setMessage(detail.message ?? null);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(OPEN_EVENT, onOpen as EventListener);
  }, []);

  // Auto-close once the user is authenticated.
  useEffect(() => {
    if (user) setOpen(false);
  }, [user]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const onSignIn = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      // Browser will redirect; if it doesn't, leave modal busy.
    } catch {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loginmodal-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm glass-strong rounded-2xl p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-violet to-accent-blue flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 id="loginmodal-title" className="text-white font-semibold tracking-tight">
              Sign in to LaunchLab
            </h2>
            <p className="text-white/55 text-xs">Google sign-in only.</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/75 leading-relaxed">
          {message ||
            "Sign in with Google to save and revisit your LaunchLab projects. The demo workflow keeps working without an account."}
        </p>

        {!configured ? (
          <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-amber-200/90 text-xs leading-relaxed">
            Supabase is not configured. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>frontend/.env.local</code> to enable
            sign-in.
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            disabled={busy}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-ink-950 font-medium text-sm hover:bg-white/90 transition disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <GoogleMark />
            )}
            Continue with Google
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 w-full text-center text-xs text-white/55 hover:text-white/80 py-2"
        >
          Cancel
        </button>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-white/45">
          <ShieldCheck size={12} />
          We never see or store your Google password.
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.6 7.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.3 2.4-5.3 0-9.7-3.3-11.3-8L6 33.4C9.2 40.4 16 45 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.1 4-3.9 5.5l6.2 5.2c-.4.4 6.4-4.7 6.4-14.7 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
