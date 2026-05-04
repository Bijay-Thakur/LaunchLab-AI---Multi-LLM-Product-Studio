import type { WorkflowStage } from "@/lib/types";
import { ArrowRight, Workflow } from "lucide-react";

const MODEL_TINT: Record<string, string> = {
  You: "from-amber-300/30 to-rose-300/30 border-amber-200/30",
  Gemini: "from-sky-300/30 to-cyan-300/30 border-sky-200/30",
  ChatGPT: "from-emerald-300/30 to-teal-300/30 border-emerald-200/30",
  "Claude Code": "from-violet-300/30 to-fuchsia-300/30 border-violet-200/30",
  "GPT Image": "from-pink-300/30 to-orange-300/30 border-pink-200/30",
};

export default function WorkflowMapTab({ workflow }: { workflow: WorkflowStage[] }) {
  return (
    <div className="space-y-5">
      <section className="glass-strong rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <Workflow size={18} className="text-accent-cyan" />
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
            Multi-LLM Pipeline
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          How a raw idea becomes a launch package.
        </h2>
        <p className="text-white/60 mt-2 max-w-2xl text-sm">
          Each stage is owned by a different model, with the human as the orchestrator at both
          ends. No single model does everything; each plays to its strength.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflow.map((stage, i) => {
          const tint = MODEL_TINT[stage.model] || "from-white/10 to-white/5 border-white/10";
          const isLast = i === workflow.length - 1;
          return (
            <div key={i} className="relative">
              <div
                className={`glass rounded-2xl p-5 h-full bg-gradient-to-br ${tint} border hover:translate-y-[-2px] transition`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/55">
                    Stage {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-white/70 px-2 py-0.5 rounded-full bg-black/30 border border-white/10">
                    {stage.model}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-lg leading-tight">{stage.stage}</h3>
                <div className="text-white/60 text-xs mt-0.5">{stage.owner}</div>
                <p className="text-white/75 text-sm mt-3 leading-relaxed">{stage.description}</p>
              </div>

              {!isLast && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-ink-900 border border-white/10 text-white/60">
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
