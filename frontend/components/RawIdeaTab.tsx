"use client";

import { Sparkles, Wand2 } from "lucide-react";
import { MODEL_ROLES, SAMPLE_IDEA } from "@/lib/constants";

type Props = {
  rawIdea: string;
  setRawIdea: (v: string) => void;
  onGenerate: () => void;
  onUseSample: () => void;
  loading: boolean;
};

export default function RawIdeaTab({
  rawIdea,
  setRawIdea,
  onGenerate,
  onUseSample,
  loading,
}: Props) {
  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 mb-3">
              <Sparkles size={12} /> Step 1 - Human Orchestrator
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Drop your raw idea here.
            </h2>
            <p className="text-white/60 mt-2 max-w-2xl text-sm sm:text-base">
              Messy is good. The multi-LLM workflow will research, architect, prompt-engineer,
              brand, visualize, and evaluate it for you. You stay in the driver's seat.
            </p>
          </div>
        </div>

        <textarea
          value={rawIdea}
          onChange={(e) => setRawIdea(e.target.value)}
          placeholder={`e.g. ${SAMPLE_IDEA}`}
          rows={5}
          className="w-full rounded-xl bg-black/30 border border-white/10 p-4 text-white placeholder-white/30 focus:outline-none focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/20 transition resize-y"
        />

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading || !rawIdea.trim()}
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 size={18} />
            {loading ? "Generating..." : "Generate Product Package"}
          </button>
          <button
            type="button"
            onClick={onUseSample}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 font-medium transition disabled:opacity-50"
          >
            Use Sample Idea
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-sm uppercase tracking-wider text-white/50 mb-3 px-1">Model roles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MODEL_ROLES.map((m) => (
            <div
              key={m.name}
              className="glass rounded-2xl p-4 hover:translate-y-[-2px] transition"
            >
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.accent} mb-3 flex items-center justify-center text-ink-900 font-bold text-sm`}
              >
                {m.name[0]}
              </div>
              <div className="text-white font-medium text-sm">{m.name}</div>
              <div className="text-white/50 text-[11px] uppercase tracking-wider mt-0.5">
                {m.role}
              </div>
              <p className="text-white/70 text-xs leading-relaxed mt-2">{m.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
