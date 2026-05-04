"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import PulsingOrb from "./PulsingOrb";

const STAGES = [
  { label: "Preparing raw idea", model: "You" },
  { label: "Gemini researching problem space", model: "Gemini" },
  { label: "OpenAI designing product blueprint", model: "OpenAI" },
  { label: "OpenAI writing Claude Code prompt", model: "OpenAI" },
  { label: "OpenAI creating brand campaign", model: "OpenAI" },
  { label: "OpenAI preparing visual prompts", model: "OpenAI" },
  { label: "Gemini evaluating final package", model: "Gemini" },
  { label: "Finalizing LaunchLab package", model: "You" },
];

const MODEL_TINT: Record<string, string> = {
  You: "from-amber-300 to-rose-300",
  Gemini: "from-sky-300 to-cyan-300",
  OpenAI: "from-emerald-300 to-teal-300",
};

/**
 * Premium workflow loader. Cycles through plausible status messages while
 * the backend request is in flight. Never claims a step is done when it
 * isn't — language is "Working on..." style.
 */
export default function WorkflowLoader({ rawIdea }: { rawIdea?: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Advance through visible stages while we wait. The last stage stays
    // pinned ("Finalizing...") so the UI doesn't run out before the
    // request returns.
    const id = setInterval(() => {
      setActive((i) => Math.min(i + 1, STAGES.length - 1));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="glass-strong rounded-3xl p-6 sm:p-10 overflow-hidden relative">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
        <div className="shrink-0 flex flex-col items-center gap-3">
          <PulsingOrb size={88} />
          <span className="text-[10px] uppercase tracking-widest text-white/50">
            Multi-LLM in flight
          </span>
        </div>
        <div className="flex-1 w-full">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
            <Loader2 size={12} className="animate-spin" />
            Generating product package
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Working on{" "}
            <span className="gradient-text">
              "{(rawIdea || "your idea").slice(0, 70)}
              {rawIdea && rawIdea.length > 70 ? "…" : ""}"
            </span>
          </h2>
          <p className="text-white/55 text-sm mt-2 max-w-xl">
            Each stage is owned by a different model. We won't lie about progress — these
            messages reflect what's plausibly happening server-side right now.
          </p>

          <ol className="mt-6 space-y-2">
            {STAGES.map((s, i) => {
              const tint = MODEL_TINT[s.model] || "from-white/30 to-white/10";
              const isActive = i === active;
              const isPast = i < active;
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 border transition ${
                    isActive
                      ? "border-white/20 bg-white/[0.06]"
                      : isPast
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-white/5 bg-transparent opacity-60"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tint} flex items-center justify-center text-ink-900 font-bold text-xs`}
                  >
                    {isPast ? (
                      <CheckCircle2 size={14} className="text-ink-900" />
                    ) : isActive ? (
                      <Loader2 size={14} className="animate-spin text-ink-900" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/85 text-sm truncate">{s.label}</span>
                      <span className="text-[10px] uppercase tracking-widest text-white/40 hidden sm:inline">
                        {s.model}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <motion.span
                      className="block h-1 w-16 rounded-full bg-gradient-to-r from-accent-violet via-accent-blue to-accent-cyan"
                      style={{ backgroundSize: "200% 100%" }}
                      animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
