"use client";

import { useState } from "react";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { openLoginModal } from "./LoginModal";

export default function AuthButton() {
  const { user, configured, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!configured) {
    return (
      <button
        type="button"
        onClick={() => openLoginModal()}
        className="hidden lg:inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition"
        title="Sign-in is disabled until Supabase env vars are set"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
        Auth off
      </button>
    );
  }

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60">
        <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
        Checking…
      </span>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openLoginModal()}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 transition"
      >
        <LogIn size={14} />
        Sign in
      </button>
    );
  }

  const name =
    (user.user_metadata as any)?.full_name ||
    (user.user_metadata as any)?.name ||
    user.email ||
    "Signed in";
  const avatar = (user.user_metadata as any)?.avatar_url as string | undefined;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-xs pl-1 pr-2.5 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 transition"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            className="w-6 h-6 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-violet to-accent-blue flex items-center justify-center">
            <UserIcon size={12} className="text-white" />
          </span>
        )}
        <span className="max-w-[120px] truncate">{name}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-52 glass-strong rounded-xl p-2 z-40"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-2 py-1.5 text-[11px] text-white/55 truncate">{user.email}</div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-white/85 hover:bg-white/10"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
