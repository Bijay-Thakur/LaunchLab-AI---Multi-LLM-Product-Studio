"use client";

import { useState } from "react";
import { Bookmark, Check, AlertTriangle, Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { saveProject } from "@/lib/projects";
import type { GeneratedImage, ProductPackage } from "@/lib/types";
import { openLoginModal } from "./LoginModal";

type Props = {
  pkg: ProductPackage;
  /** Optional snapshot of currently generated images to bundle with the save. */
  images?: GeneratedImage[];
  onSaved?: () => void;
};

export default function SaveProjectButton({ pkg, images, onSaved }: Props) {
  const { user, configured } = useAuth();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!configured) return null; // hide entirely in local demo mode

  if (!user) {
    return (
      <button
        type="button"
        onClick={() =>
          openLoginModal("Sign in with Google to save your LaunchLab projects.")
        }
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 transition"
        title="Sign in to save this project to your account"
      >
        <Bookmark size={14} />
        Sign in to save this project
      </button>
    );
  }

  const onClick = async () => {
    setState("saving");
    setErrorMsg(null);
    const pkgWithImages: ProductPackage =
      images && images.length > 0 ? { ...pkg, images } : pkg;
    const res = await saveProject(pkgWithImages);
    if (res.ok) {
      setState("saved");
      onSaved?.();
      setTimeout(() => setState("idle"), 2400);
    } else {
      setState("error");
      setErrorMsg(res.error || "Save failed.");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "saving"}
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 transition disabled:opacity-60"
      title={errorMsg || undefined}
    >
      {state === "saving" ? (
        <Loader2 size={14} className="animate-spin" />
      ) : state === "saved" ? (
        <Check size={14} className="text-emerald-300" />
      ) : state === "error" ? (
        <AlertTriangle size={14} className="text-amber-300" />
      ) : (
        <Bookmark size={14} />
      )}
      {state === "saving"
        ? "Saving…"
        : state === "saved"
          ? "Saved"
          : state === "error"
            ? "Save failed"
            : "Save project"}
    </button>
  );
}
