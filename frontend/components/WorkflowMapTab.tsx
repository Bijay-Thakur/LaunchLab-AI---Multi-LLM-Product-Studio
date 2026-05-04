import type { ProductPackage, WorkflowStage } from "@/lib/types";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  GitBranch,
  Hourglass,
  Layers,
  RefreshCw,
  Repeat,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

type Props = {
  workflow: WorkflowStage[];
  pkg?: ProductPackage | null;
};

// ---------- data ----------

const V1_STEPS = [
  { id: "raw", label: "Raw Idea", provider: "Human", desc: "User submits messy idea" },
  { id: "research", label: "Research", provider: "Gemini", desc: "Gemini validates problem space" },
  { id: "blueprint", label: "Blueprint", provider: "OpenAI", desc: "OpenAI structures product plan" },
  { id: "claude", label: "Claude Prompt", provider: "OpenAI", desc: "OpenAI writes build prompt" },
  { id: "campaign", label: "Campaign", provider: "OpenAI", desc: "OpenAI creates brand & copy" },
  { id: "visuals", label: "Visual Prompts", provider: "OpenAI", desc: "OpenAI creates image prompts" },
  { id: "evaluation", label: "Evaluation", provider: "Gemini", desc: "Judge scores readiness" },
  { id: "final", label: "Final Package", provider: "Human", desc: "Reviewed & shipped" },
];

const V2_NODES = [
  { id: "research_node", label: "Research Node", provider: "Gemini" },
  { id: "product_architect_node", label: "Product Architect Node", provider: "OpenAI" },
  { id: "prompt_engineer_node", label: "Prompt Engineer Node", provider: "OpenAI" },
  { id: "campaign_strategist_node", label: "Campaign Strategist Node", provider: "OpenAI" },
  { id: "visual_prompt_designer_node", label: "Visual Prompt Designer Node", provider: "OpenAI" },
  { id: "evaluation_judge_node", label: "Evaluation Judge Node", provider: "Gemini" },
];

// Maps fallbackSteps step keys (from backend) to v2 node ids.
const STEP_TO_NODE: Record<string, string> = {
  research: "research_node",
  blueprint: "product_architect_node",
  claudeBuildPrompt: "prompt_engineer_node",
  brandCampaign: "campaign_strategist_node",
  visualPrompts: "visual_prompt_designer_node",
  evaluation: "evaluation_judge_node",
};

const PROVIDER_TINT: Record<string, string> = {
  Human: "from-amber-300/25 to-rose-300/25 border-amber-200/30",
  Gemini: "from-sky-300/25 to-cyan-300/25 border-sky-200/30",
  OpenAI: "from-emerald-300/25 to-teal-300/25 border-emerald-200/30",
};

// ---------- top component ----------

export default function WorkflowMapTab({ workflow: _w, pkg }: Props) {
  const isV2 = pkg?.workflowMode === "langgraph" || pkg?.version === "v2";

  return (
    <div className="space-y-5">
      <Header isV2={isV2} pkg={pkg} />

      {pkg && <RunMetadataRow pkg={pkg} isV2={isV2} />}

      <SameOutputNote />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ManualPipelineCard active={!isV2} />
        <LangGraphGraphCard active={isV2} pkg={pkg} />
      </div>

      <AdvantageGrid />
      <ComparisonTable />
    </div>
  );
}

// ---------- header ----------

function Header({ isV2, pkg }: { isV2: boolean; pkg?: ProductPackage | null }) {
  return (
    <section className="glass-strong rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          <Workflow size={18} className="text-accent-cyan" />
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
            Architecture Compare
          </span>
          {pkg && (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-1 rounded-full border ${
                isV2
                  ? "border-violet-300/30 bg-violet-300/10 text-violet-100"
                  : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              }`}
            >
              {isV2 ? <GitBranch size={11} /> : <Workflow size={11} />}
              Current run: {isV2 ? "LangGraph v2" : "Manual v1"}
            </span>
          )}
        </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
        Same product package. Two very different architectures.
      </h2>
      <p className="text-white/60 mt-2 max-w-3xl text-sm leading-relaxed">
        Both modes return the exact same final LaunchLab package so the UI can render them
        consistently. The difference lives underneath: <span className="text-white/85">Version 1</span>{" "}
        is a manual function pipeline; <span className="text-white/85">Version 2</span> models each
        AI role as a LangGraph node that reads and updates a shared workflow state.
      </p>
    </section>
  );
}

// ---------- run metadata ----------

function RunMetadataRow({ pkg, isV2 }: { pkg: ProductPackage; isV2: boolean }) {
  const live = pkg.liveSteps ?? 0;
  const total = pkg.totalSteps ?? 6;
  const fallbackCount = pkg.fallbackSteps?.length ?? 0;
  const warningCount = pkg.providerWarnings?.length ?? 0;
  const nodesRun = pkg.graphMetadata?.nodesRun?.length ?? 0;
  const stepsRun = isV2 ? `${nodesRun}/6 nodes` : `${live}/${total} steps`;

  const cards: { icon: typeof Zap; label: string; value: string; tone?: string }[] = [
    {
      icon: isV2 ? GitBranch : Workflow,
      label: "Mode",
      value: isV2 ? "LangGraph v2" : "Manual v1",
      tone: isV2 ? "text-violet-200" : "text-emerald-200",
    },
    { icon: Cpu, label: "Live work", value: stepsRun },
    {
      icon: RefreshCw,
      label: "Fallbacks",
      value: String(fallbackCount),
      tone: fallbackCount > 0 ? "text-amber-200" : undefined,
    },
    {
      icon: ShieldAlert,
      label: "Warnings",
      value: String(warningCount),
      tone: warningCount > 0 ? "text-amber-200" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5"
        >
          <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
            <c.icon size={14} />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-white/45">{c.label}</div>
            <div className={`text-sm font-medium truncate ${c.tone || "text-white/90"}`}>
              {c.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- same-output note ----------

function SameOutputNote() {
  return (
    <div className="rounded-xl px-4 py-3 border border-white/10 bg-white/[0.03] text-white/70 text-xs leading-relaxed flex gap-2 items-start">
      <Sparkles size={14} className="mt-0.5 text-accent-cyan/80 shrink-0" />
      <span>
        LangGraph does not magically make the output different - both modes intentionally produce
        the same package shape so the same tabs can render them. The architectural payoff shows up
        as the workflow grows: retries, branching, human-in-loop, and persistence become explicit
        graph behavior instead of hidden procedural code.
      </span>
    </div>
  );
}

// ---------- V1 linear pipeline ----------

function ManualPipelineCard({ active }: { active: boolean }) {
  return (
    <section
      className={`relative glass rounded-2xl p-5 sm:p-6 transition border ${
        active ? "border-emerald-300/30 shadow-glow" : "border-white/5"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-white/85">
          <Workflow size={16} className="text-emerald-300" />
          <h3 className="font-semibold tracking-tight">Version 1: Manual Workflow</h3>
        </div>
        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-300/20 bg-emerald-300/5 text-emerald-100">
          Linear Pipeline
        </span>
      </div>
      <p className="text-white/55 text-xs">Direct function calls in a fixed sequence.</p>

      <ol className="mt-4 space-y-2">
        {V1_STEPS.map((s, i) => {
          const last = i === V1_STEPS.length - 1;
          const tint = PROVIDER_TINT[s.provider] || "from-white/10 to-white/5 border-white/10";
          return (
            <li key={s.id}>
              <div
                className={`flex items-center gap-3 rounded-lg p-2.5 bg-gradient-to-br ${tint} border`}
              >
                <span className="text-[10px] uppercase tracking-widest text-white/55 w-6 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 text-sm font-medium truncate">{s.label}</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/65 px-1.5 py-0.5 rounded bg-black/30 border border-white/10">
                      {s.provider}
                    </span>
                  </div>
                  <div className="text-white/65 text-xs truncate">{s.desc}</div>
                </div>
              </div>
              {!last && (
                <div className="flex justify-center my-1 text-white/35">
                  <ArrowRight size={12} className="rotate-90" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ---------- V2 LangGraph node graph ----------

function LangGraphGraphCard({
  active,
  pkg,
}: {
  active: boolean;
  pkg?: ProductPackage | null;
}) {
  const ranSet = new Set(pkg?.graphMetadata?.nodesRun ?? []);
  const fallbackNodeIds = new Set(
    (pkg?.fallbackSteps ?? []).map((s) => STEP_TO_NODE[s] ?? s),
  );

  // Split nodes into two columns flanking the shared state card.
  const leftNodes = V2_NODES.slice(0, 3);
  const rightNodes = V2_NODES.slice(3);

  const isV2Run = pkg?.workflowMode === "langgraph" || pkg?.version === "v2";

  return (
    <section
      className={`relative glass rounded-2xl p-5 sm:p-6 transition border ${
        active ? "border-violet-300/30 shadow-glow" : "border-white/5"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-white/85">
          <GitBranch size={16} className="text-violet-300" />
          <h3 className="font-semibold tracking-tight">Version 2: LangGraph Workflow</h3>
        </div>
        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-violet-300/20 bg-violet-300/5 text-violet-100">
          Stateful Graph Orchestration
        </span>
      </div>
      <p className="text-white/55 text-xs">Graph nodes update a shared workflow state.</p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
        <div className="space-y-2">
          {leftNodes.map((n) => (
            <NodePill
              key={n.id}
              node={n}
              ran={isV2Run && ranSet.has(n.id)}
              fellBack={fallbackNodeIds.has(n.id)}
              direction="right"
            />
          ))}
        </div>

        <SharedStateCard />

        <div className="space-y-2">
          {rightNodes.map((n) => (
            <NodePill
              key={n.id}
              node={n}
              ran={isV2Run && ranSet.has(n.id)}
              fellBack={fallbackNodeIds.has(n.id)}
              direction="left"
            />
          ))}
        </div>
      </div>

      {/* Future-ready dashed nodes */}
      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-widest text-white/45 mb-2">
          Future-ready (not active)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <FutureNode icon={Repeat} label="Retry Node" />
          <FutureNode icon={Users} label="Human Review" />
          <FutureNode icon={GitBranch} label="Branch Node" />
          <FutureNode icon={Database} label="Persistence" />
        </div>
      </div>
    </section>
  );
}

function NodePill({
  node,
  ran,
  fellBack,
  direction,
}: {
  node: { id: string; label: string; provider: string };
  ran: boolean;
  fellBack: boolean;
  direction: "left" | "right";
}) {
  const tint = PROVIDER_TINT[node.provider] || "from-white/10 to-white/5 border-white/10";
  return (
    <div className="flex items-center gap-2">
      {direction === "right" && (
        <ArrowRight size={12} className="text-white/30 shrink-0 hidden sm:block order-2" />
      )}
      <div
        className={`flex-1 rounded-lg p-2.5 bg-gradient-to-br ${tint} border ${
          direction === "left" ? "order-2" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-white/90 text-sm font-medium truncate">{node.label}</div>
          <span className="text-[10px] uppercase tracking-widest text-white/65 px-1.5 py-0.5 rounded bg-black/30 border border-white/10 shrink-0">
            {node.provider}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="text-white/45 text-[11px] truncate">id: {node.id}</div>
          {fellBack ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-100 shrink-0">
              fallback
            </span>
          ) : ran ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-emerald-300/30 bg-emerald-300/10 text-emerald-100 shrink-0">
              <CheckCircle2 size={10} /> ran
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/45 shrink-0">
              idle
            </span>
          )}
        </div>
      </div>
      {direction === "left" && (
        <ArrowRight size={12} className="rotate-180 text-white/30 shrink-0 hidden sm:block" />
      )}
    </div>
  );
}

function SharedStateCard() {
  const KEYS = [
    "rawIdea",
    "research",
    "blueprint",
    "claudePrompt",
    "campaign",
    "visualPrompts",
    "evaluation",
    "errors / fallbacks",
  ];
  return (
    <div className="rounded-xl p-3 sm:p-4 border border-violet-300/25 bg-violet-300/5 flex flex-col items-center justify-center text-center min-w-[180px] self-stretch">
      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet to-accent-blue flex items-center justify-center shadow-glow mb-2">
        <Boxes size={16} className="text-white" />
      </span>
      <div className="text-[10px] uppercase tracking-widest text-violet-200/80">Shared</div>
      <div className="text-white font-semibold text-sm leading-tight">LaunchLab State</div>
      <ul className="mt-2 grid grid-cols-1 gap-0.5 text-[11px] text-white/65 font-mono">
        {KEYS.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ul>
    </div>
  );
}

function FutureNode({
  icon: Icon,
  label,
}: {
  icon: typeof Repeat;
  label: string;
}) {
  return (
    <div className="rounded-lg p-2.5 border border-dashed border-white/15 bg-white/[0.02] flex items-center gap-2 text-white/55">
      <Icon size={13} />
      <span className="text-xs">{label}</span>
    </div>
  );
}

// ---------- advantage cards ----------

const ADVANTAGES: { icon: typeof Layers; title: string; desc: string }[] = [
  { icon: Layers, title: "Modularity", desc: "Each AI role becomes its own node." },
  { icon: Boxes, title: "Shared State", desc: "Every node reads/writes one structured state object." },
  { icon: Eye, title: "Easier Debugging", desc: "Inspect which node ran and what it produced." },
  { icon: Repeat, title: "Better Retries / Fallbacks", desc: "Provider failures are handled at the node level." },
  { icon: Sparkles, title: "Easy Extension", desc: "Add nodes without rewriting the whole pipeline." },
  { icon: GitBranch, title: "Future Branching", desc: "Branch on confidence, safety, or human review." },
  { icon: Users, title: "Human-in-the-Loop Ready", desc: "A future approval node can pause before publishing." },
  { icon: Shield, title: "Scalable Orchestration", desc: "Stays clean as the workflow grows." },
];

function AdvantageGrid() {
  return (
    <section className="space-y-2">
      <div className="text-[11px] uppercase tracking-widest text-white/55 px-1">
        Why LangGraph as the workflow grows
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ADVANTAGES.map((a) => (
          <div
            key={a.title}
            className="glass rounded-xl p-4 border border-white/5 hover:translate-y-[-2px] transition"
          >
            <div className="flex items-center gap-2 mb-1.5 text-violet-200">
              <a.icon size={14} />
              <div className="text-sm font-semibold text-white/90">{a.title}</div>
            </div>
            <p className="text-white/60 text-xs leading-relaxed">{a.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- comparison table ----------

const TABLE: { label: string; v1: string; v2: string }[] = [
  { label: "Architecture", v1: "Sequential function calls", v2: "Graph of nodes with shared state" },
  { label: "Best for", v1: "Simple prototype", v2: "Growing multi-step AI systems" },
  { label: "Debugging", v1: "Debug function chain manually", v2: "Inspect node-by-node state changes" },
  { label: "Fallbacks", v1: "Handled procedurally", v2: "Handled per node" },
  { label: "Extensibility", v1: "Add logic inside the pipeline", v2: "Add or replace nodes" },
  { label: "Branching", v1: "Harder to maintain", v2: "Native graph-friendly structure" },
  { label: "Human review", v1: "Requires custom interruption logic", v2: "Approval / checkpoint nodes later" },
  { label: "Output", v1: "Same final LaunchLab package", v2: "Same final LaunchLab package" },
];

function ComparisonTable() {
  return (
    <section className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-wider text-white/55">Side-by-side</div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/50">
          <Hourglass size={11} />
          LangGraph wins as workflow grows, not always.
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
        <div className="text-[10px] uppercase tracking-widest text-white/45">Aspect</div>
        <div className="text-[10px] uppercase tracking-widest text-emerald-200/80">Manual v1</div>
        <div className="text-[10px] uppercase tracking-widest text-violet-200/80">LangGraph v2</div>
        {TABLE.map((r) => (
          <div key={r.label} className="contents">
            <div className="text-white/55 text-sm pt-1">{r.label}</div>
            <div className="text-white/85 text-sm leading-relaxed">{r.v1}</div>
            <div className="text-white/85 text-sm leading-relaxed">{r.v2}</div>
          </div>
        ))}
      </div>

      {/* Mobile stacked */}
      <div className="md:hidden space-y-3">
        {TABLE.map((r) => (
          <div
            key={r.label}
            className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2"
          >
            <div className="text-[10px] uppercase tracking-widest text-white/45">{r.label}</div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-200/80 mb-0.5">
                Manual v1
              </div>
              <div className="text-white/85 text-sm">{r.v1}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-violet-200/80 mb-0.5">
                LangGraph v2
              </div>
              <div className="text-white/85 text-sm">{r.v2}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
