"use client";

import { ReactNode } from "react";
import { Beaker, Github } from "lucide-react";

type Props = {
  children: ReactNode;
  backendOnline: boolean | null;
};

export default function AppShell({ children, backendOnline }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-ink-950/60 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet to-accent-blue flex items-center justify-center shadow-glow">
              <Beaker size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold tracking-tight leading-tight">
                LaunchLab <span className="gradient-text">AI</span>
              </div>
              <div className="text-[11px] text-white/50 leading-tight">
                Multi-LLM product studio
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BackendBadge online={backendOnline} />
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 transition"
            >
              <Github size={14} />
              <span>Repo</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      <footer className="border-t border-white/5 py-6 text-center text-white/40 text-xs">
        LaunchLab AI - v1 demo build. Mock data, no external APIs. Built with Caveman Method.
      </footer>
    </div>
  );
}

function BackendBadge({ online }: { online: boolean | null }) {
  const label =
    online === null ? "Checking backend..." : online ? "Backend online" : "Local fallback";
  const dot =
    online === null ? "bg-white/40" : online ? "bg-emerald-400" : "bg-amber-400";
  return (
    <div className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80">
      <span className={`w-2 h-2 rounded-full ${dot} ${online === null ? "animate-pulse" : ""}`} />
      <span>{label}</span>
    </div>
  );
}
