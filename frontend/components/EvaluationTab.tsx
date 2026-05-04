import SectionCard from "./SectionCard";
import type { Evaluation } from "@/lib/types";
import { ClipboardCheck, ThumbsUp, AlertTriangle, Wrench, MessageSquare } from "lucide-react";

const SCORE_LABELS: { key: keyof Evaluation["scores"]; label: string }[] = [
  { key: "productMarketFit", label: "Product-Market Fit" },
  { key: "userEmpathy", label: "User Empathy" },
  { key: "technicalFeasibility", label: "Technical Feasibility" },
  { key: "ethicalSafety", label: "Ethical Safety" },
  { key: "accessibility", label: "Accessibility" },
  { key: "campaignQuality", label: "Campaign Quality" },
];

function scoreColor(score: number): string {
  if (score >= 85) return "from-emerald-400 to-cyan-400";
  if (score >= 70) return "from-sky-400 to-violet-400";
  return "from-rose-400 to-amber-400";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-white/80">{label}</span>
        <span className="font-mono text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${scoreColor(value)} rounded-full`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

const Bullets = ({ items, accent }: { items: string[]; accent: string }) => (
  <ul className="space-y-2">
    {items.map((it, i) => (
      <li key={i} className="flex gap-2.5">
        <span className={`mt-2 w-1.5 h-1.5 rounded-full ${accent} shrink-0`} />
        <span>{it}</span>
      </li>
    ))}
  </ul>
);

export default function EvaluationTab({ evaluation }: { evaluation: Evaluation }) {
  const overall = evaluation.scores.overallReadiness;
  return (
    <div className="space-y-5">
      <section className="glass-strong rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 mb-3">
              <ClipboardCheck size={12} /> Gemini Evaluation Judge Output
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Overall readiness
            </h2>
          </div>
          <div className="text-right">
            <div className="text-5xl sm:text-6xl font-semibold gradient-text leading-none">
              {overall}
            </div>
            <div className="text-white/50 text-xs uppercase tracking-wider mt-1">/ 100</div>
          </div>
        </div>
      </section>

      <SectionCard title="Scorecard">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCORE_LABELS.map(({ key, label }) => (
            <ScoreBar key={key} label={label} value={evaluation.scores[key]} />
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Strengths" icon={<ThumbsUp size={16} />}>
          <Bullets items={evaluation.strengths} accent="bg-emerald-400/80" />
        </SectionCard>
        <SectionCard title="Weaknesses" icon={<AlertTriangle size={16} />}>
          <Bullets items={evaluation.weaknesses} accent="bg-amber-400/80" />
        </SectionCard>
      </div>

      <SectionCard title="Recommended Improvements" icon={<Wrench size={16} />}>
        <Bullets items={evaluation.recommendedImprovements} accent="bg-accent-violet/80" />
      </SectionCard>

      <SectionCard title="Judge Notes" icon={<MessageSquare size={16} />}>
        <p className="italic text-white/85">{evaluation.judgeNotes}</p>
      </SectionCard>
    </div>
  );
}
