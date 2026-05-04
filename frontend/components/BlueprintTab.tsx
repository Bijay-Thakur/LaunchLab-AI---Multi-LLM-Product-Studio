import SectionCard from "./SectionCard";
import type { Blueprint } from "@/lib/types";
import {
  LayoutGrid,
  Rocket,
  Users,
  ListChecks,
  Route,
  FileCode2,
  Gauge,
} from "lucide-react";

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((it, i) => (
      <li key={i} className="flex gap-2.5">
        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent-violet/80 shrink-0" />
        <span>{it}</span>
      </li>
    ))}
  </ul>
);

export default function BlueprintTab({ blueprint }: { blueprint: Blueprint }) {
  return (
    <div className="space-y-5">
      <section className="glass-strong rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
            ChatGPT Product Architect Output
          </span>
          <Rocket size={18} className="text-accent-violet" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight gradient-text">
          {blueprint.productName}
        </h2>
        <p className="text-white/80 mt-2 text-base sm:text-lg max-w-3xl">{blueprint.onelinePitch}</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Target Users" icon={<Users size={16} />}>
          <Bullets items={blueprint.targetUsers} />
        </SectionCard>

        <SectionCard title="MVP Scope" icon={<ListChecks size={16} />}>
          <Bullets items={blueprint.mvpScope} />
        </SectionCard>
      </div>

      <SectionCard title="Core Features" icon={<LayoutGrid size={16} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {blueprint.coreFeatures.map((f) => (
            <div
              key={f.name}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition"
            >
              <div className="text-white font-medium mb-1">{f.name}</div>
              <p className="text-white/70 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="User Journey" icon={<Route size={16} />}>
        <ol className="space-y-3">
          {blueprint.userJourney.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-accent-violet to-accent-blue flex items-center justify-center text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Pages Needed" icon={<FileCode2 size={16} />}>
          <div className="flex flex-wrap gap-2">
            {blueprint.pagesNeeded.map((p) => (
              <span
                key={p}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80"
              >
                {p}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Success Metrics" icon={<Gauge size={16} />}>
          <Bullets items={blueprint.successMetrics} />
        </SectionCard>
      </div>
    </div>
  );
}
