"use client";

import { useEffect, useState } from "react";
import { History, Loader2, LogIn, Lock } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { listProjects, type SavedProject } from "@/lib/projects";
import type { ProductPackage } from "@/lib/types";
import { openLoginModal } from "./LoginModal";

type Props = {
  refreshKey: number;
  onLoad: (pkg: ProductPackage, rawIdea: string) => void;
};

export default function ProjectHistory({ refreshKey, onLoad }: Props) {
  const { user, configured } = useAuth();
  const [items, setItems] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!configured || !user) {
      setItems([]);
      return;
    }
    let alive = true;
    setLoading(true);
    listProjects(5).then((rows) => {
      if (alive) {
        setItems(rows);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [configured, user, refreshKey]);

  if (!configured) return null;

  if (!user) {
    return (
      <section className="glass rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-white/80">
          <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
            <Lock size={16} />
          </span>
          <div>
            <div className="text-sm font-semibold text-white/90">Project history is private</div>
            <div className="text-xs text-white/55">
              Sign in with Google to save and reload your past LaunchLab projects.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            openLoginModal("Sign in with Google to view your saved LaunchLab projects.")
          }
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 transition"
        >
          <LogIn size={14} />
          Continue with Google
        </button>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <header className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-white/85">
          <History size={16} className="text-accent-cyan/90" />
          <h3 className="text-sm font-semibold">Your recent projects</h3>
        </div>
        {loading && <Loader2 size={14} className="animate-spin text-white/50" />}
      </header>

      {items.length === 0 && !loading ? (
        <p className="text-white/50 text-xs">
          Nothing saved yet. After generating a package, click <em>Save project</em>.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onLoad(p.package_json, p.raw_idea)}
                className="w-full text-left rounded-lg px-3 py-2 border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white/90 text-sm font-medium truncate">
                    {p.product_name || "Untitled"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-white/40">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-white/55 text-xs truncate mt-0.5">{p.raw_idea}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
