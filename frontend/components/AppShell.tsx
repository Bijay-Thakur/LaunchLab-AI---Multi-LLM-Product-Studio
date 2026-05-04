"use client";

import { ReactNode } from "react";
import { Beaker } from "lucide-react";
import type { HealthStatus } from "@/lib/api";
import AuthButton from "./AuthButton";
import LoginModal from "./LoginModal";

type Props = {
  children: ReactNode;
  health: HealthStatus | null;
};

export default function AppShell({ children, health }: Props) {
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

          <div className="flex items-center gap-2">
            <BackendBadge health={health} />
            {health?.online && (
              <ProviderBadge label="Gemini" on={health.providers.gemini} />
            )}
            {health?.online && (
              <ProviderBadge label="OpenAI" on={health.providers.openai} />
            )}
            {health?.online && (
              <ProviderBadge label="Images" on={health.providers.images} />
            )}
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      <footer className="border-t border-white/5 py-6 text-center text-white/40 text-xs">
        LaunchLab AI - multi-LLM orchestration. Live APIs when keys are present, mock fallback otherwise.
      </footer>

      <LoginModal />
    </div>
  );
}

function BackendBadge({ health }: { health: HealthStatus | null }) {
  const online = health?.online ?? null;
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

function ProviderBadge({ label, on }: { label: string; on: boolean }) {
  return (
    <div
      className={`hidden md:inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border ${
        on
          ? "border-emerald-300/20 bg-emerald-300/5 text-emerald-200/90"
          : "border-white/10 bg-white/5 text-white/50"
      }`}
      title={on ? `${label} key detected` : `${label} key missing`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-emerald-400" : "bg-white/30"}`} />
      <span>{label}</span>
    </div>
  );
}
